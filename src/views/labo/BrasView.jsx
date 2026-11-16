import { useEffect, useMemo, useState } from 'react'
import { Check, RotateCcw } from 'lucide-react'
import CadreJeu, { Bouton, Carte, Eclat } from '../../components/labo/CadreJeu.jsx'

// =============================================================
//  A3 · Le bras mécanique (la « représentation mobile » du référentiel)
//  L'élève accroche lui-même les deux tendons du muscle sur les os,
//  puis contracte le muscle. Le mouvement est calculé (géométrie
//  réelle) et la force nécessaire aussi (moments autour du coude).
//  Attendus 111, 117, 118, 120.
// =============================================================

const COUDE = { x: 150, y: 250 }
const PX_CM = 0.15 // 1 px = 0,15 cm → avant-bras de 30 cm
const LONG_AVANT_BRAS = 200
const MASSE_KG = 1 // une bouteille d'eau d'1 litre dans la main

// Points d'accroche possibles : sur l'humérus (a = hauteur au-dessus du coude)
// ou sur l'avant-bras (d = distance depuis le coude). cote : +1 devant, -1 derrière.
const POINTS = {
  'hum-haut-avant': { os: 'humerus', a: 165, cote: 1, nom: 'Humérus, en haut, devant' },
  'hum-bas-avant': { os: 'humerus', a: 70, cote: 1, nom: 'Humérus, en bas, devant' },
  'hum-haut-arriere': { os: 'humerus', a: 165, cote: -1, nom: 'Humérus, en haut, derrière' },
  'ab-pres': { os: 'avantbras', d: 30, cote: 1, nom: 'Radius, près du coude' },
  'ab-milieu': { os: 'avantbras', d: 95, cote: 1, nom: 'Radius, au milieu' },
  olecrane: { os: 'avantbras', d: -16, cote: -1, nom: 'Cubitus, pointe du coude' },
}

function position(id, phi) {
  const p = POINTS[id]
  const r = (phi * Math.PI) / 180
  if (p.os === 'humerus') return { x: COUDE.x + p.cote * 13, y: COUDE.y - p.a }
  const f = { x: Math.sin(r), y: Math.cos(r) }
  const n = { x: Math.cos(r), y: -Math.sin(r) }
  return { x: COUDE.x + p.d * f.x + p.cote * 8 * n.x, y: COUDE.y + p.d * f.y + p.cote * 8 * n.y }
}

const longueur = (a, b, phi) => {
  const p1 = position(a, phi)
  const p2 = position(b, phi)
  return Math.hypot(p1.x - p2.x, p1.y - p2.y)
}

// Bras de levier du muscle autour du coude (distance du coude à la ligne du muscle)
function brasDeLevier(a, b, phi) {
  const p1 = position(a, phi)
  const p2 = position(b, phi)
  const L = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1
  return Math.abs((p2.x - p1.x) * (p1.y - COUDE.y) - (p1.x - COUDE.x) * (p2.y - p1.y)) / L
}

const DEFIS = [
  { id: 'flexion', titre: 'Fais plier le coude (flexion)' },
  { id: 'levier', titre: 'Soulève la bouteille à l’horizontale avec moins de 40 N' },
  { id: 'extension', titre: 'Le bras est plié : fais-le se tendre (extension)' },
]

export default function BrasView() {
  const [tendons, setTendons] = useState([])
  const [contraction, setContraction] = useState(0)
  const [reussis, setReussis] = useState([])
  const [eclat, setEclat] = useState({ message: '', sous: '', cle: 0 })

  const complet = tendons.length === 2
  const [a, b] = tendons
  const memeOs = complet && POINTS[a].os === POINTS[b].os
  const traverseCoude = complet && !memeOs
  const extenseur = traverseCoude && tendons.every((t) => POINTS[t].cote === -1)
  const flechisseur = traverseCoude && tendons.every((t) => POINTS[t].cote === 1)
  const depart = extenseur ? 120 : 0

  // Angle du coude obtenu en raccourcissant le muscle
  const phi = useMemo(() => {
    if (!traverseCoude || (!extenseur && !flechisseur)) return depart
    const cible = longueur(a, b, depart) * (1 - 0.32 * contraction)
    let meilleur = depart
    let ecart = Infinity
    for (let p = 0; p <= 150; p += 0.5) {
      const e = Math.abs(longueur(a, b, p) - cible) + Math.abs(p - depart) * 0.0005
      if (e < ecart) {
        ecart = e
        meilleur = p
      }
    }
    return meilleur
  }, [a, b, contraction, traverseCoude, extenseur, flechisseur, depart])

  // Force du muscle pour tenir la bouteille à cet angle (N)
  const force = useMemo(() => {
    if (!traverseCoude || !flechisseur) return null
    const moment = MASSE_KG * 9.81 * (LONG_AVANT_BRAS * PX_CM / 100) * Math.sin((phi * Math.PI) / 180)
    const levier = (brasDeLevier(a, b, phi) * PX_CM) / 100
    return levier > 0.001 ? moment / levier : null
  }, [a, b, phi, traverseCoude, flechisseur])

  function valider(id, sous) {
    if (reussis.includes(id)) return
    setReussis((r) => [...r, id])
    setEclat((x) => ({ message: 'Défi réussi !', sous, cle: x.cle + 1 }))
  }

  useEffect(() => {
    if (contraction === 0) return
    if (flechisseur && phi > 40) valider('flexion', 'Le muscle s’est contracté, il a tiré sur le radius : le coude se plie.')
    if (flechisseur && phi >= 85 && force !== null && force < 40)
      valider('levier', 'Tendon accroché plus loin du coude = bras de levier plus grand = moins de force nécessaire.')
    if (extenseur && phi < 30) valider('extension', 'Le triceps, derrière le bras, tire sur la pointe du coude : le bras se tend.')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phi, force, contraction])

  function toucher(id) {
    if (tendons.includes(id)) return
    setContraction(0)
    setTendons((t) => (t.length >= 2 ? [id] : [...t, id]))
  }

  const r = (phi * Math.PI) / 180
  const main = { x: COUDE.x + LONG_AVANT_BRAS * Math.sin(r), y: COUDE.y + LONG_AVANT_BRAS * Math.cos(r) }
  const n = { x: Math.cos(r) * 5, y: -Math.sin(r) * 5 }
  const p1 = complet ? position(a, phi) : null
  const p2 = complet ? position(b, phi) : null

  let message = 'Touche un point sur un os pour accrocher le premier tendon du muscle.'
  if (tendons.length === 1) message = 'Accroche maintenant le second tendon.'
  if (memeOs) message = 'Le muscle se contracte… mais ses deux tendons sont sur le même os : rien ne bouge ! Il faut deux os différents, de part et d’autre de l’articulation.'
  else if (complet && !extenseur && !flechisseur) message = 'Un tendon devant, un derrière : le muscle s’enroule autour de l’articulation. Dans le corps, chaque muscle reste d’un seul côté.'
  else if (flechisseur) message = 'Muscle accroché devant le bras (comme le biceps). Contracte-le !'
  else if (extenseur) message = 'Muscle accroché derrière le bras (comme le triceps). Contracte-le !'

  return (
    <CadreJeu code="A3" titre="Le bras mécanique" attendus={[111, 117, 118, 120]} couleur="#C9A3FF">
      <Eclat message={eclat.message} sousTitre={eclat.sous} cle={eclat.cle} couleur="#C9A3FF" />

      <Carte couleur="rgba(201,163,255,.4)">
        <p className="labo-mono text-[11px] text-[#C9A3FF]">TES DÉFIS · {reussis.length} / {DEFIS.length}</p>
        <ul className="mt-1.5 space-y-1">
          {DEFIS.map((d) => (
            <li key={d.id} className={`flex items-center gap-2 text-sm ${reussis.includes(d.id) ? 'text-[#9DFF8A]' : 'text-[#DDE2F7]'}`}>
              <span className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border ${reussis.includes(d.id) ? 'border-[#9DFF8A] bg-[#9DFF8A]/20' : 'border-white/25'}`}>
                {reussis.includes(d.id) && <Check size={13} />}
              </span>
              {d.titre}
            </li>
          ))}
        </ul>
      </Carte>

      <div className="rounded-3xl border border-white/10 bg-[#070B16]/75 p-2">
        <svg viewBox="0 0 400 480" className="mx-auto w-full max-w-md touch-none" role="img" aria-label="Bras vu de profil, avec humérus, radius, cubitus et muscle">
          <defs>
            <radialGradient id="bras-balle" cx=".35" cy=".35" r=".7">
              <stop offset="0" stopColor="#B8F7FF" />
              <stop offset="1" stopColor="#2B8FB5" />
            </radialGradient>
          </defs>
          {/* Épaule (omoplate) et humérus */}
          <ellipse cx={150} cy={58} rx={30} ry={22} fill="#3A4566" />
          <text x={150} y={34} textAnchor="middle" fontSize="11" fill="#8A93B8">épaule</text>
          <line x1={150} y1={62} x2={150} y2={244} stroke="#EDE6D1" strokeWidth="16" strokeLinecap="round" />
          <circle cx={150} cy={62} r={14} fill="#EDE6D1" />
          <text x={186} y={150} fontSize="12" fill="#B9C1E3">humérus</text>
          {/* Avant-bras : radius et cubitus */}
          <g>
            <line x1={COUDE.x + n.x} y1={COUDE.y + n.y} x2={main.x + n.x} y2={main.y + n.y} stroke="#EDE6D1" strokeWidth="7" strokeLinecap="round" />
            <line
              x1={COUDE.x - n.x - Math.sin(r) * 16}
              y1={COUDE.y - n.y - Math.cos(r) * 16}
              x2={main.x - n.x}
              y2={main.y - n.y}
              stroke="#D9D0B6"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <circle cx={main.x} cy={main.y} r={11} fill="#D9D0B6" />
            <circle cx={main.x + Math.cos(r) * 14 + Math.sin(r) * 10} cy={main.y - Math.sin(r) * 14 + Math.cos(r) * 10} r={18} fill="url(#bras-balle)" />
            <text x={main.x + Math.cos(r) * 14 + Math.sin(r) * 10} y={main.y - Math.sin(r) * 14 + Math.cos(r) * 10 + 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="#04232A">
              1 kg
            </text>
          </g>
          {/* Articulation du coude */}
          <circle cx={COUDE.x} cy={COUDE.y} r={12} fill="#070B16" stroke="#FFD27A" strokeWidth="3" />
          <text x={COUDE.x - 22} y={COUDE.y + 4} textAnchor="end" fontSize="12" fill="#FFD27A">coude</text>

          {/* Muscle + tendons */}
          {complet && (
            <g>
              {(() => {
                const mx = (p1.x + p2.x) / 2
                const my = (p1.y + p2.y) / 2
                const L = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1
                const nx = -(p2.y - p1.y) / L
                const ny = (p2.x - p1.x) / L
                const t1 = { x: p1.x + (p2.x - p1.x) * 0.16, y: p1.y + (p2.y - p1.y) * 0.16 }
                const t2 = { x: p1.x + (p2.x - p1.x) * 0.84, y: p1.y + (p2.y - p1.y) * 0.84 }
                const epais = 9 + contraction * 16
                const sens = POINTS[a].cote
                const c1 = { x: mx + nx * epais * sens, y: my + ny * epais * sens }
                const c2 = { x: mx - nx * epais * 0.4 * sens, y: my - ny * epais * 0.4 * sens }
                return (
                  <>
                    <path
                      d={`M${t1.x} ${t1.y} Q${c1.x} ${c1.y} ${t2.x} ${t2.y} Q${c2.x} ${c2.y} ${t1.x} ${t1.y} Z`}
                      fill={`rgba(232,${90 - contraction * 40},${100 - contraction * 50},.92)`}
                      stroke="#FF8A95"
                      strokeWidth="1.5"
                    />
                    <line x1={p1.x} y1={p1.y} x2={t1.x} y2={t1.y} stroke="#F4F6FF" strokeWidth="3.5" strokeLinecap="round" />
                    <line x1={p2.x} y1={p2.y} x2={t2.x} y2={t2.y} stroke="#F4F6FF" strokeWidth="3.5" strokeLinecap="round" />
                    {contraction > 0.05 && (
                      <>
                        <line x1={t2.x} y1={t2.y} x2={t2.x + (t1.x - t2.x) * 0.25} y2={t2.y + (t1.y - t2.y) * 0.25} stroke="#FFD27A" strokeWidth="3" markerEnd="url(#fleche)" />
                        <line x1={t1.x} y1={t1.y} x2={t1.x + (t2.x - t1.x) * 0.25} y2={t1.y + (t2.y - t1.y) * 0.25} stroke="#FFD27A" strokeWidth="3" markerEnd="url(#fleche)" />
                      </>
                    )}
                  </>
                )
              })()}
            </g>
          )}
          <defs>
            <marker id="fleche" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill="#FFD27A" />
            </marker>
          </defs>

          {/* Points d'accroche */}
          {Object.keys(POINTS).map((id) => {
            const p = position(id, phi)
            const choisi = tendons.includes(id)
            return (
              <g key={id} onClick={() => toucher(id)} style={{ cursor: 'pointer' }}>
                <circle cx={p.x} cy={p.y} r={16} fill="transparent" />
                <circle cx={p.x} cy={p.y} r={choisi ? 7 : 6} fill={choisi ? '#F4F6FF' : '#070B16'} stroke={choisi ? '#FFFFFF' : '#C9A3FF'} strokeWidth="2.5">
                  {!choisi && <animate attributeName="r" values="5;8;5" dur="1.6s" repeatCount="indefinite" />}
                </circle>
              </g>
            )
          })}
          <text x={300} y={460} textAnchor="middle" fontSize="11" fill="#8A93B8">vue de profil · devant →</text>
        </svg>
      </div>

      <Carte couleur="rgba(201,163,255,.4)">
        <p className="text-[15px] leading-relaxed text-[#E8ECFF]">{message}</p>
        {complet && (
          <div className="mt-2 text-xs text-[#B9C1E3]">
            Tendons : {POINTS[a].nom} → {POINTS[b].nom}
          </div>
        )}
        <label className="mt-3 block">
          <span className="labo-mono text-[11px] text-[#C9A3FF]">CONTRACTER LE MUSCLE · {Math.round(contraction * 100)} %</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={contraction}
            disabled={!complet}
            onChange={(e) => setContraction(Number(e.target.value))}
            className="mt-2 w-full accent-[#C9A3FF]"
          />
        </label>
        <div className="mt-2 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-2xl bg-[#070B16]/70 p-2">
            <p className="text-[11px] text-[#8A93B8]">Angle du coude</p>
            <p className="labo-mono text-lg text-[#FFD27A]">{Math.round(180 - phi)}°</p>
          </div>
          <div className="rounded-2xl bg-[#070B16]/70 p-2">
            <p className="text-[11px] text-[#8A93B8]">Force du muscle</p>
            <p className="labo-mono text-lg text-[#FF8A95]">{force !== null && phi > 2 ? `${Math.round(force)} N` : '—'}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-[#8A93B8]">
          Une force de 10 N, c’est à peu près le poids d’un objet d’1 kg. Calcul réel : moments autour du coude, avant-bras de 30 cm, bouteille d’1 kg dans la main.
        </p>
        <Bouton variante="secondaire" className="mt-3 w-full" onClick={() => { setTendons([]); setContraction(0) }}>
          <RotateCcw size={16} /> Décrocher les tendons
        </Bouton>
      </Carte>
    </CadreJeu>
  )
}
