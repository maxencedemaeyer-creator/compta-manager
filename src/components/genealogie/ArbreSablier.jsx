import { memo, useMemo } from 'react'
import PanZoom from './PanZoom.jsx'
import { dates, parents, unions } from '../../utils/gedcom.js'

// Arbre "sablier" : ancêtres au-dessus, descendants en dessous de la personne centrale.
const W = 200 // largeur d'une carte
const H = 76 // hauteur d'une carte
const GAP_X = 18
const GAP_Y = 64
const PAS_Y = H + GAP_Y

export const COULEURS_SEXE = {
  M: { trait: '#38bdf8', fond: '#0c4a6e', texte: '#7dd3fc' },
  F: { trait: '#f472b6', fond: '#831843', texte: '#f9a8d4' },
  U: { trait: '#94a3b8', fond: '#334155', texte: '#cbd5e1' },
}

function tronquer(txt, max) {
  if (!txt) return ''
  return txt.length > max ? txt.slice(0, max - 1) + '…' : txt
}

export function initiales(p) {
  return ((p?.prenom?.[0] || '') + (p?.nom?.[0] || '')).toUpperCase() || '?'
}

// ---------- Calcul des positions ----------
function calculerDisposition(arbre, racineId, genHaut, genBas) {
  const noeuds = []
  const liens = []
  const pas = W + GAP_X

  // Ancêtres : largeur (en nombre de cartes) de chaque branche
  function largeurAnc(id, g) {
    if (g >= genHaut) return 1
    const { pere, mere } = parents(arbre, id)
    const l = (pere ? largeurAnc(pere.id, g + 1) : 0) + (mere ? largeurAnc(mere.id, g + 1) : 0)
    return Math.max(1, l)
  }
  function placerAnc(id, g, gauche, chemin) {
    const l = largeurAnc(id, g)
    const x = (gauche + l / 2) * pas
    const y = -g * PAS_Y
    const { pere, mere } = parents(arbre, id)
    const aPlus = g >= genHaut && (pere || mere)
    if (g > 0) noeuds.push({ cle: chemin, p: arbre.personnes[id], x, y, aPlusHaut: aPlus })
    if (g < genHaut) {
      let curseur = gauche
      for (const par of [pere, mere]) {
        if (!par) continue
        const px = placerAnc(par.id, g + 1, curseur, chemin + (par === pere ? 'p' : 'm'))
        liens.push({ de: { x, y: y - H / 2 }, a: { x: px, y: y - PAS_Y + H / 2 } })
        curseur += largeurAnc(par.id, g + 1)
      }
    }
    return x
  }

  // Descendants : largeur de chaque branche
  function enfantsDe(id) {
    return unions(arbre, id).flatMap((u) => u.enfants)
  }
  function largeurDesc(id, g) {
    if (g >= genBas) return 1
    const l = enfantsDe(id).reduce((s, e) => s + largeurDesc(e.id, g + 1), 0)
    return Math.max(1, l)
  }
  function placerDesc(id, g, gauche, chemin) {
    const l = largeurDesc(id, g)
    const x = (gauche + l / 2) * pas
    const y = g * PAS_Y
    const ses = enfantsDe(id)
    if (g > 0) noeuds.push({ cle: chemin, p: arbre.personnes[id], x, y, aPlusBas: g >= genBas && ses.length > 0 })
    if (g < genBas) {
      let curseur = gauche
      ses.forEach((e, i) => {
        const ex = placerDesc(e.id, g + 1, curseur, chemin + 'e' + i)
        liens.push({ de: { x, y: y + H / 2 }, a: { x: ex, y: y + PAS_Y - H / 2 } })
        curseur += largeurDesc(e.id, g + 1)
      })
    }
    return x
  }

  // On place puis on décale pour que la personne centrale soit en (0, 0)
  const avantAnc = noeuds.length
  const xAnc = placerAnc(racineId, 0, 0, 'a')
  for (let i = avantAnc; i < noeuds.length; i++) noeuds[i].x -= xAnc
  const liensAnc = liens.length
  for (let i = 0; i < liensAnc; i++) {
    liens[i].de.x -= xAnc
    liens[i].a.x -= xAnc
  }

  const avantDesc = noeuds.length
  const xDesc = placerDesc(racineId, 0, 0, 'd')
  for (let i = avantDesc; i < noeuds.length; i++) noeuds[i].x -= xDesc
  for (let i = liensAnc; i < liens.length; i++) {
    liens[i].de.x -= xDesc
    liens[i].a.x -= xDesc
  }

  // La personne centrale et ses conjoints, côte à côte
  const racine = arbre.personnes[racineId]
  const r = parents(arbre, racineId)
  noeuds.push({ cle: 'racine', p: racine, x: 0, y: 0, estRacine: true, aPlusHaut: genHaut === 0 && (r.pere || r.mere) })
  const conjoints = unions(arbre, racineId).filter((u) => u.conjoint)
  const mariages = []
  conjoints.forEach((u, i) => {
    const x = (i + 1) * (W + 46)
    noeuds.push({ cle: 'conj' + i, p: u.conjoint, x, y: 0, estConjoint: true })
    mariages.push({ x1: x - (W + 46) + W / 2, x2: x - W / 2 })
  })

  const xs = noeuds.map((n) => n.x)
  const ys = noeuds.map((n) => n.y)
  const bounds = {
    minX: Math.min(...xs) - W / 2,
    maxX: Math.max(...xs) + W / 2,
    minY: Math.min(...ys) - H / 2 - 20,
    maxY: Math.max(...ys) + H / 2 + 20,
  }
  return { noeuds, liens, mariages, bounds }
}

// ---------- Une carte ----------
const Carte = memo(function Carte({ noeud, photo, selectionne, onSelect }) {
  const { p, x, y, estRacine, estConjoint } = noeud
  const c = COULEURS_SEXE[p.sexe] || COULEURS_SEXE.U
  const d = dates(p)

  return (
    <g
      transform={`translate(${x - W / 2},${y - H / 2})`}
      onClick={() => onSelect(p.id)}
      style={{ cursor: 'pointer' }}
    >
      {estRacine && (
        <rect x={-5} y={-5} width={W + 10} height={H + 10} rx={23} fill="none" stroke="url(#gradRacine)" strokeWidth={3} />
      )}
      <rect
        width={W}
        height={H}
        rx={18}
        fill={selectionne ? '#334155' : '#1e293b'}
        stroke={selectionne ? '#ffffff' : estConjoint ? '#475569' : '#334155'}
        strokeWidth={selectionne ? 2 : 1}
        strokeDasharray={estConjoint ? '5 4' : undefined}
      />
      <rect x={0} y={14} width={4} height={H - 28} rx={2} fill={c.trait} />

      {/* Photo ou initiales */}
      <circle cx={40} cy={H / 2} r={27} fill={c.fond} stroke={c.trait} strokeWidth={2} />
      {photo ? (
        <image
          href={photo}
          x={15}
          y={H / 2 - 25}
          width={50}
          height={50}
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#clipRond)"
        />
      ) : (
        <text x={40} y={H / 2 + 5} textAnchor="middle" fontSize={15} fontWeight={700} fill={c.texte}>
          {initiales(p)}
        </text>
      )}

      <text x={78} y={27} fontSize={13.5} fontWeight={600} fill="#f8fafc">
        {tronquer(p.prenom, 15)}
      </text>
      <text x={78} y={44} fontSize={11} fontWeight={500} fill="#94a3b8" letterSpacing={0.6}>
        {tronquer((p.nom || '').toUpperCase(), 16)}
      </text>
      {d && (
        <text x={78} y={61} fontSize={11} fill={c.texte}>
          {d}
        </text>
      )}
    </g>
  )
})

function BoutonPlus({ x, y, onClick }) {
  return (
    <g transform={`translate(${x},${y})`} onClick={onClick} style={{ cursor: 'pointer' }}>
      <circle r={12} fill="#0f172a" stroke="#64748b" strokeWidth={1.5} />
      <path d="M-5 0H5M0 -5V5" stroke="#e2e8f0" strokeWidth={2} strokeLinecap="round" />
    </g>
  )
}

export default function ArbreSablier({ arbre, racineId, genHaut, genBas, photoDe, selectionId, onSelect, onRecentrer }) {
  const { noeuds, liens, mariages, bounds } = useMemo(
    () => calculerDisposition(arbre, racineId, genHaut, genBas),
    [arbre, racineId, genHaut, genBas]
  )

  return (
    <PanZoom bounds={bounds} recentrerCle={`${racineId}-${genHaut}-${genBas}`}>
      <defs>
        <clipPath id="clipRond" clipPathUnits="objectBoundingBox">
          <circle cx={0.5} cy={0.5} r={0.5} />
        </clipPath>
        <linearGradient id="gradRacine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d946ef" />
          <stop offset="50%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#fb923c" />
        </linearGradient>
      </defs>

      {/* Liens parent-enfant */}
      {liens.map((l, i) => {
        const mid = (l.de.y + l.a.y) / 2
        return (
          <path
            key={i}
            d={`M${l.de.x},${l.de.y} V${mid} H${l.a.x} V${l.a.y}`}
            fill="none"
            stroke="#475569"
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
        )
      })}

      {/* Liens de mariage */}
      {mariages.map((m, i) => (
        <g key={i}>
          <line x1={m.x1} y1={0} x2={m.x2} y2={0} stroke="#f43f5e" strokeWidth={1.6} strokeDasharray="4 4" />
          <circle cx={(m.x1 + m.x2) / 2} cy={0} r={10} fill="#0f172a" stroke="#f43f5e" strokeWidth={1.5} />
          <text x={(m.x1 + m.x2) / 2} y={4.5} textAnchor="middle" fontSize={12} fill="#fda4af">
            ∞
          </text>
        </g>
      ))}

      {noeuds.map((n) => (
        <Carte
          key={n.cle}
          noeud={n}
          photo={photoDe(n.p)}
          selectionne={selectionId === n.p.id}
          onSelect={onSelect}
        />
      ))}

      {/* "+" pour continuer l'exploration au-delà des générations affichées */}
      {noeuds
        .filter((n) => n.aPlusHaut)
        .map((n) => (
          <BoutonPlus key={'h' + n.cle} x={n.x} y={n.y - H / 2 - 16} onClick={() => onRecentrer(n.p.id)} />
        ))}
      {noeuds
        .filter((n) => n.aPlusBas)
        .map((n) => (
          <BoutonPlus key={'b' + n.cle} x={n.x} y={n.y + H / 2 + 16} onClick={() => onRecentrer(n.p.id)} />
        ))}
    </PanZoom>
  )
}
