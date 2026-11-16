import { useEffect, useMemo, useState } from 'react'
import { Music, RotateCcw } from 'lucide-react'
import CadreJeu, { Bouton, Carte, Eclat, melanger } from '../../components/labo/CadreJeu.jsx'
import Squelette, { NOMS_ARTICULATIONS } from '../../components/labo/Squelette.jsx'

// =============================================================
//  A5 · Le pantin du savant fou
//  L'élève pose les 6 articulations sur le pantin, puis le fait
//  danser : le pantin plie là où il a posé les articulations.
//  Mal placée, l'articulation fait plier… le milieu d'un os (CRAC !).
//  Attendus 113, 120.
// =============================================================

// Chaînes du côté droit de la personne (coordonnées du schéma du squelette)
const BRAS = {
  depart: [97, 99],
  fin: [45, 282],
  articulations: [
    { id: 'epaule', options: [[64, 102], [60, 136], [81, 97]] },
    { id: 'coude', options: [[56, 171], [52, 203], [60, 142]] },
    { id: 'poignet', options: [[48, 236], [51, 206], [44, 262]] },
  ],
}
const JAMBE = {
  depart: [94, 214],
  fin: [97, 442],
  articulations: [
    { id: 'hanche', options: [[83, 224], [85, 268], [95, 240]] },
    { id: 'genou', options: [[88, 328], [87, 288], [88, 372]] },
    { id: 'cheville', options: [[84, 420], [86, 382], [91, 437]] },
  ],
}
const ORDRE = ['epaule', 'coude', 'poignet', 'hanche', 'genou', 'cheville']
const BONNE = Object.fromEntries([...BRAS.articulations, ...JAMBE.articulations].map((a) => [a.id, a.options[0]]))
const OPTIONS = Object.fromEntries([...BRAS.articulations, ...JAMBE.articulations].map((a) => [a.id, a.options]))

const egal = (a, b) => a && b && a[0] === b[0] && a[1] === b[1]

// Cinématique : chaque point de la chaîne tourne autour des articulations choisies
function chaine(def, choix, angles, miroirX = false) {
  const pts = [def.depart, ...def.articulations.map((a) => choix[a.id] || a.options[0]), def.fin]
  const sortie = [pts[0]]
  let rotation = 0
  for (let i = 1; i < pts.length; i++) {
    const prec = pts[i - 1]
    const v = [pts[i][0] - prec[0], pts[i][1] - prec[1]]
    if (i >= 2) rotation += angles[def.articulations[i - 2].id] || 0
    const r = (rotation * Math.PI) / 180
    const base = sortie[i - 1]
    sortie.push([base[0] + v[0] * Math.cos(r) - v[1] * Math.sin(r), base[1] + v[0] * Math.sin(r) + v[1] * Math.cos(r)])
  }
  return miroirX ? sortie.map(([x, y]) => [200 - x, y]) : sortie
}

export default function PantinView() {
  const [choix, setChoix] = useState({})
  const [danse, setDanse] = useState(false)
  const [t, setT] = useState(0)
  const [eclat, setEclat] = useState({ message: '', cle: 0 })
  const etape = ORDRE.find((id) => !choix[id])
  const options = useMemo(() => (etape ? melanger(OPTIONS[etape]) : []), [etape])

  useEffect(() => {
    if (!danse) return
    let raf
    const debut = performance.now()
    const boucle = (m) => {
      setT((m - debut) / 1000)
      raf = requestAnimationFrame(boucle)
    }
    raf = requestAnimationFrame(boucle)
    return () => cancelAnimationFrame(raf)
  }, [danse])

  const erreurs = ORDRE.filter((id) => choix[id] && !egal(choix[id], BONNE[id]))
  const toutPlace = !etape

  function lancerDanse() {
    setDanse(true)
    if (erreurs.length === 0) setEclat((x) => ({ message: 'Danse parfaite !', cle: x.cle + 1 }))
  }

  const s = Math.sin(t * 3)
  const anglesBrasD = { epaule: danse ? 55 + 45 * s : 0, coude: danse ? -50 - 40 * Math.sin(t * 3 + 1) : 0, poignet: danse ? 25 * Math.sin(t * 6) : 0 }
  const anglesBrasG = { epaule: danse ? -(55 - 45 * s) : 0, coude: danse ? 50 + 40 * Math.sin(t * 3 + 2) : 0, poignet: danse ? -25 * Math.sin(t * 6) : 0 }
  const anglesJambeD = { hanche: danse ? 18 * Math.sin(t * 3) : 0, genou: danse ? -35 - 30 * Math.sin(t * 3) : 0, cheville: danse ? 20 * Math.sin(t * 6) : 0 }
  const anglesJambeG = { hanche: danse ? -18 * Math.sin(t * 3 + Math.PI) : 0, genou: danse ? 35 + 30 * Math.sin(t * 3 + Math.PI) : 0, cheville: danse ? -20 * Math.sin(t * 6) : 0 }

  const membres = [
    { def: BRAS, angles: anglesBrasD, miroir: false, l: 6 },
    { def: BRAS, angles: anglesBrasG, miroir: true, l: 6 },
    { def: JAMBE, angles: anglesJambeD, miroir: false, l: 8 },
    { def: JAMBE, angles: anglesJambeG, miroir: true, l: 8 },
  ]
  const rebond = danse ? Math.abs(Math.sin(t * 3)) * -8 : 0

  const dessin = (
    <g>
      {membres.map(({ def, angles, miroir, l }, k) => {
        const pts = chaine(def, choix, angles, miroir)
        return (
          <g key={k}>
            {pts.slice(1).map((p, i) => (
              <line key={i} x1={pts[i][0]} y1={pts[i][1]} x2={p[0]} y2={p[1]} stroke="#EDE6D1" strokeWidth={i === 0 ? l * 0.6 : l} strokeLinecap="round" />
            ))}
            {def.articulations.map((a, i) => {
              const p = pts[i + 1]
              const place = choix[a.id]
              if (!place) return null
              const faux = !egal(place, BONNE[a.id])
              return (
                <g key={a.id}>
                  <circle cx={p[0]} cy={p[1]} r={5} fill="#070B16" stroke={faux ? '#FF8A95' : '#9DFF8A'} strokeWidth="2.2" />
                  {faux && danse && (
                    <text x={p[0] + (miroir ? 8 : -8)} y={p[1] - 8} textAnchor={miroir ? 'start' : 'end'} fontSize="11" fontWeight="900" fill="#FF8A95">
                      CRAC !
                    </text>
                  )}
                </g>
              )
            })}
          </g>
        )
      })}
      {!danse &&
        etape &&
        options.map((p, i) => (
          <g key={i} onClick={() => setChoix((c) => ({ ...c, [etape]: p }))} style={{ cursor: 'pointer' }}>
            <circle cx={p[0]} cy={p[1]} r={11} fill="transparent" />
            <circle cx={p[0]} cy={p[1]} r={5.5} fill="rgba(255,138,216,.25)" stroke="#FF8AD8" strokeWidth="2">
              <animate attributeName="r" values="4;7;4" dur="1.4s" repeatCount="indefinite" />
            </circle>
          </g>
        ))}
    </g>
  )

  return (
    <CadreJeu code="A5" titre="Le pantin du savant fou" attendus={[113, 120]} couleur="#FF8AD8">
      <Eclat message={eclat.message} cle={eclat.cle} couleur="#FF8AD8" />
      <Carte couleur="rgba(255,138,216,.45)">
        {!toutPlace ? (
          <>
            <p className="labo-mono text-[11px] text-[#FF8AD8]">
              ARTICULATION {ORDRE.indexOf(etape) + 1} / 6 · bras et jambe droits, la gauche suit en miroir
            </p>
            <p className="labo-titre mt-1 text-2xl font-black text-white">Place : {NOMS_ARTICULATIONS[etape].toLowerCase()}</p>
            <p className="mt-1 text-sm text-[#B9C1E3]">Touche le point rose qui correspond. Une articulation, c’est l’endroit où deux os se rejoignent.</p>
          </>
        ) : !danse ? (
          <>
            <p className="labo-titre text-xl font-bold text-white">Le pantin est prêt.</p>
            <p className="mt-1 text-sm text-[#B9C1E3]">Fais-le danser : il pliera exactement là où tu as mis les articulations.</p>
            <Bouton className="mt-3 w-full" couleur="#FF8AD8" onClick={lancerDanse}>
              <Music size={18} /> Faire danser
            </Bouton>
          </>
        ) : erreurs.length ? (
          <>
            <p className="labo-titre text-lg font-bold text-[#FF8A95]">Aïe, ça plie au milieu d’un os !</p>
            <p className="mt-1 text-sm text-[#E8ECFF]">
              Un os est rigide : il ne peut pas se plier. À corriger : {erreurs.map((id) => NOMS_ARTICULATIONS[id].toLowerCase()).join(', ')}.
            </p>
          </>
        ) : (
          <>
            <p className="labo-titre text-lg font-bold text-[#9DFF8A]">Six articulations parfaites !</p>
            <p className="mt-1 text-sm text-[#E8ECFF]">Les os restent droits et le mouvement se fait aux articulations : épaule, coude, poignet, hanche, genou, cheville.</p>
          </>
        )}
        {(toutPlace || Object.keys(choix).length > 0) && (
          <Bouton variante="secondaire" className="mt-3 w-full" onClick={() => { setChoix({}); setDanse(false) }}>
            <RotateCcw size={16} /> Recommencer
          </Bouton>
        )}
      </Carte>

      <div className="mx-auto w-full max-w-sm rounded-3xl border border-white/10 bg-[#070B16]/70 p-3">
        <Squelette
          className="mx-auto h-[60vh] max-h-[600px] w-full"
          caches={['humerus', 'radius', 'cubitus', 'main', 'femur', 'rotule', 'tibia', 'perone', 'pied']}
          style={{ transform: `translateY(${rebond}px)` }}
          enfants={dessin}
        />
      </div>
    </CadreJeu>
  )
}
