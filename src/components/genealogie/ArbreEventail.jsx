import { useMemo } from 'react'
import PanZoom from './PanZoom.jsx'
import { initiales } from './ArbreSablier.jsx'
import { dates, parents } from '../../utils/gedcom.js'

// Roue / éventail des ancêtres (style "roue généalogique").
// Chaque anneau = une génération. Couleurs = les 4 grandes branches de grands-parents.
const R0 = 78 // rayon du cercle central
const LARGEURS = [84, 78, 78, 100, 100, 96, 92] // épaisseur de chaque anneau
const OUVERTURE = 240 // angle total de l'éventail (degrés)
const TEINTES_QUARTS = [232, 195, 330, 24] // pat.-pat., pat.-mat., mat.-pat., mat.-mat.

function rayons(g) {
  let r = R0
  for (let i = 0; i < g - 1; i++) r += LARGEURS[i]
  return [r, r + LARGEURS[g - 1]]
}

// Point sur le cercle (angle en degrés, 0 = en haut, sens horaire)
function point(r, angle) {
  const a = (angle * Math.PI) / 180
  return [Math.sin(a) * r, -Math.cos(a) * r]
}

function secteur(r1, r2, a1, a2) {
  const [x1, y1] = point(r2, a1)
  const [x2, y2] = point(r2, a2)
  const [x3, y3] = point(r1, a2)
  const [x4, y4] = point(r1, a1)
  const grand = a2 - a1 > 180 ? 1 : 0
  return `M${x1},${y1} A${r2},${r2} 0 ${grand} 1 ${x2},${y2} L${x3},${y3} A${r1},${r1} 0 ${grand} 0 ${x4},${y4} Z`
}

function tronquer(txt, max) {
  if (!txt) return ''
  return txt.length > max ? txt.slice(0, Math.max(1, max - 1)) + '…' : txt
}

function couleur(g, i, vide) {
  let teinte
  if (g === 1) teinte = i === 0 ? 215 : 345
  else teinte = TEINTES_QUARTS[Math.floor(i / 2 ** (g - 2))]
  const lum = 50 - g * 3.2
  return vide ? `hsla(${teinte}, 40%, 40%, 0.08)` : `hsl(${teinte}, 68%, ${lum}%)`
}

export default function ArbreEventail({ arbre, racineId, generations, photoDe, selectionId, onSelect }) {
  const cases = useMemo(() => {
    const res = []
    // Numérotation de Sosa : le père de n est 2n, la mère 2n+1
    let niveau = [arbre.personnes[racineId]]
    for (let g = 1; g <= generations; g++) {
      const suivant = []
      niveau.forEach((p) => {
        const par = p ? parents(arbre, p.id) : { pere: null, mere: null }
        suivant.push(par.pere, par.mere)
      })
      const n = suivant.length
      const pas = OUVERTURE / n
      suivant.forEach((p, i) => {
        const a1 = -OUVERTURE / 2 + i * pas
        res.push({ g, i, p, a1, a2: a1 + pas })
      })
      niveau = suivant
    }
    return res
  }, [arbre, racineId, generations])

  const racine = arbre.personnes[racineId]
  const rMax = rayons(generations)[1]
  const bounds = { minX: -rMax, maxX: rMax, minY: -rMax, maxY: Math.max(R0 + 70, rMax * 0.55) }
  const photoRacine = photoDe(racine)

  return (
    <PanZoom bounds={bounds} recentrerCle={`${racineId}-${generations}`} ajusterTout>
      <defs>
        <clipPath id="clipCentre">
          <circle cx={0} cy={0} r={R0 - 6} />
        </clipPath>
        <linearGradient id="gradEventail" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d946ef" />
          <stop offset="50%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#fb923c" />
        </linearGradient>
      </defs>

      {cases.map(({ g, i, p, a1, a2 }) => {
        const [r1, r2] = rayons(g)
        const mid = (a1 + a2) / 2
        const rm = (r1 + r2) / 2
        const arc = ((a2 - a1) * Math.PI * rm) / 180 // longueur disponible
        const selectionne = p && selectionId === p.id
        const [tx, ty] = point(rm, mid)
        const radial = g >= 4
        let rotation
        if (radial) rotation = mid > 0 ? mid - 90 : mid + 90
        else rotation = Math.abs(mid) > 90 ? mid + 180 : mid

        const taille = radial ? Math.max(6.5, Math.min(11, arc / 3.2)) : g === 1 ? 14 : 12.5
        const longueurTexte = radial ? r2 - r1 - 10 : arc - 14
        const maxCar = Math.floor(longueurTexte / (taille * 0.56))
        const deuxLignes = !radial || arc > 26

        return (
          <g key={`${g}-${i}`} onClick={p ? () => onSelect(p.id) : undefined} style={{ cursor: p ? 'pointer' : 'default' }}>
            <path
              d={secteur(r1 + 1.5, r2 - 1.5, a1 + 0.35, a2 - 0.35)}
              fill={couleur(g, i, !p)}
              stroke={selectionne ? '#ffffff' : 'rgba(255,255,255,0.08)'}
              strokeWidth={selectionne ? 2.5 : 1}
            />
            {p && (
              <g transform={`translate(${tx},${ty}) rotate(${rotation})`} style={{ pointerEvents: 'none' }}>
                {deuxLignes ? (
                  <>
                    <text y={-taille * 0.25} textAnchor="middle" fontSize={taille} fontWeight={600} fill="#fff">
                      {tronquer(g <= 2 ? `${p.prenom} ${p.nom}` : p.prenom.split(' ')[0] + ' ' + p.nom, maxCar)}
                    </text>
                    <text y={taille * 1.05} textAnchor="middle" fontSize={taille * 0.85} fill="rgba(255,255,255,0.75)">
                      {dates(p)}
                    </text>
                  </>
                ) : (
                  <text y={taille * 0.35} textAnchor="middle" fontSize={taille} fontWeight={600} fill="#fff">
                    {tronquer(`${p.prenom.split(' ')[0]} ${p.nom}`, maxCar)}
                  </text>
                )}
              </g>
            )}
          </g>
        )
      })}

      {/* Personne centrale */}
      <g onClick={() => onSelect(racineId)} style={{ cursor: 'pointer' }}>
        <circle r={R0} fill="#0f172a" stroke="url(#gradEventail)" strokeWidth={4} />
        {photoRacine ? (
          <image
            href={photoRacine}
            x={-(R0 - 6)}
            y={-(R0 - 6)}
            width={(R0 - 6) * 2}
            height={(R0 - 6) * 2}
            preserveAspectRatio="xMidYMid slice"
            clipPath="url(#clipCentre)"
          />
        ) : (
          <text y={10} textAnchor="middle" fontSize={30} fontWeight={700} fill="#fda4af">
            {initiales(racine)}
          </text>
        )}
        <text y={R0 + 30} textAnchor="middle" fontSize={17} fontWeight={700} fill="#fff">
          {racine.prenom} {racine.nom}
        </text>
        <text y={R0 + 50} textAnchor="middle" fontSize={13} fill="#94a3b8">
          {dates(racine)}
        </text>
      </g>
    </PanZoom>
  )
}
