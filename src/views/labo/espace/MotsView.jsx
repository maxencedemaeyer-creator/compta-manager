import { useMemo, useState } from 'react'
import { Carte, Duo, Eclat, melanger } from '../../../components/labo/CadreJeu.jsx'
import { OR, ORANGE } from '../../../components/labo/espace/donnees.js'
import { PageEspace } from './commun.jsx'

// =============================================================
//  S12 · Mots — le vocabulaire de l'espace : relier chaque mot à sa définition (3 manches de 4 mots).
//  Définitions : UAI et manuels de sciences (cycle 10-12 ans). Attendus 99 à 109.
// =============================================================
const MOTS = [
  { id: 'etoile', mot: 'Étoile', def: 'Une boule de gaz qui produit sa propre lumière. Le Soleil en est une.', couleur: '#FFD27A' },
  { id: 'planete', mot: 'Planète', def: 'Un astre qui tourne autour d’une étoile et ne brille pas tout seul.', couleur: '#7CFFB5' },
  { id: 'satellite', mot: 'Satellite naturel', def: 'Un astre qui tourne autour d’une planète. La Lune est celui de la Terre.', couleur: '#FFE9B8' },
  { id: 'comete', mot: 'Comète', def: 'Une boule de glace et de poussière qui fait une queue près du Soleil.', couleur: '#FF9AE0' },
  { id: 'galaxie', mot: 'Galaxie', def: 'Un immense ensemble de milliards d’étoiles.', couleur: '#E56BFF' },
  { id: 'orbite', mot: 'Orbite', def: 'Le chemin suivi par un astre qui tourne autour d’un autre.', couleur: '#C9A3FF' },
  { id: 'rotation', mot: 'Rotation', def: 'Le tour qu’un astre fait sur lui‑même. Pour la Terre : 24 heures.', couleur: '#FF7AC8' },
  { id: 'revolution', mot: 'Révolution', def: 'Le tour qu’un astre fait autour d’un autre. Pour la Terre : 1 an.', couleur: '#FFA24D' },
  { id: 'eclipse', mot: 'Éclipse', def: 'Quand un astre en cache un autre, ou passe dans son ombre.', couleur: '#FF8A6B' },
  { id: 'phase', mot: 'Phase de la Lune', def: 'La partie éclairée de la Lune que l’on voit depuis la Terre.', couleur: '#FFD27A' },
  { id: 'annee-lumiere', mot: 'Année‑lumière', def: 'La distance que la lumière parcourt en un an.', couleur: '#FFB86B' },
  { id: 'systeme', mot: 'Système solaire', def: 'Le Soleil et tous les astres qui tournent autour de lui.', couleur: '#A66BFF' },
]

function nouvellesManches() {
  const m = melanger(MOTS)
  return [m.slice(0, 4), m.slice(4, 8), m.slice(8, 12)]
}

export default function MotsView() {
  const [manches, setManches] = useState(nouvellesManches)
  const [n, setN] = useState(0)
  const [trouves, setTrouves] = useState([])
  const [mot, setMot] = useState(null)
  const [faux, setFaux] = useState(null)
  const [erreurs, setErreurs] = useState(0)
  const [fini, setFini] = useState(false)
  const [eclat, setEclat] = useState({ message: '', cle: 0 })
  const manche = manches[n]
  const defs = useMemo(() => melanger(manche), [manche])

  function choisirDef(id) {
    if (!mot || trouves.includes(id)) return
    if (id === mot) {
      const t = [...trouves, id]
      setTrouves(t)
      setMot(null)
      if (t.length === 4) {
        setTimeout(() => {
          if (n === 2) {
            setFini(true)
            setEclat((c) => ({ message: 'Bravo !', cle: c.cle + 1 }))
          } else {
            setN(n + 1)
            setTrouves([])
          }
        }, 900)
      }
    } else {
      setErreurs((e) => e + 1)
      setFaux(id)
      setTimeout(() => setFaux(null), 650)
    }
  }
  function rejouer() {
    setManches(nouvellesManches())
    setN(0)
    setTrouves([])
    setMot(null)
    setErreurs(0)
    setFini(false)
  }

  return (
    <PageEspace code="S12" titre="Mots" attendus={[100,108]} ecran large>
      <Eclat message={eclat.message} cle={eclat.cle} couleur="#FFE27A" />
      <Duo
        visuelDabord
        commandes={
          <>
            <Carte couleur="rgba(166,107,255,.4)" className="!p-3">
              <p className="labo-mono text-[11px] text-[#B9C1E3]">{fini ? 'TERMINÉ' : `MANCHE ${n + 1} SUR 3`}</p>
              <p className="labo-jeu mt-1 text-[20px] leading-snug text-white">{fini ? 'Tu connais le vocabulaire de l’espace !' : 'Touche un mot, puis sa définition.'}</p>
              <div className="mt-2 flex gap-1.5">
                {[0, 1, 2].map((i) => <span key={i} className="h-2 flex-1 rounded-full" style={{ background: i < n || fini ? ORANGE : i === n ? 'rgba(255,162,77,.45)' : 'rgba(255,255,255,.12)' }} />)}
              </div>
            </Carte>
            {fini && (
              <Carte couleur="rgba(255,226,122,.5)" className="!p-3 text-center">
                <p className="labo-jeu text-[30px] leading-none" style={{ color: OR }}>{erreurs === 0 ? 'Sans faute !' : `${erreurs} erreur${erreurs > 1 ? 's' : ''}`}</p>
                <button type="button" onClick={rejouer} className="mt-3 min-h-[48px] w-full rounded-2xl text-[15px] font-bold active:scale-95" style={{ background: ORANGE, color: '#12062A' }}>Rejouer</button>
              </Carte>
            )}
          </>
        }
      >
        <div className="rounded-3xl border border-white/12 bg-[#05030f]/40 p-2.5 tab:min-h-0 tab:flex-1 tab:overflow-y-auto">
          {!fini ? (
            <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)] gap-2.5 tab:h-full">
              <div className="grid gap-2.5 tab:grid-rows-4">
                {manche.map((m) => {
                  const ok = trouves.includes(m.id)
                  const sel = mot === m.id
                  return (
                    <button key={m.id} type="button" disabled={ok} onClick={() => setMot(m.id)} className="labo-jeu flex min-h-[72px] items-center justify-center rounded-2xl border-2 px-2 text-center text-[19px] leading-tight active:scale-95" style={{ borderColor: ok ? '#9DFF8A' : sel ? m.couleur : `${m.couleur}66`, background: ok ? 'rgba(157,255,138,.14)' : sel ? `${m.couleur}33` : 'rgba(11,10,30,.88)', color: ok ? '#C8FFC0' : m.couleur, opacity: ok ? 0.85 : 1 }}>
                      {m.mot}
                    </button>
                  )
                })}
              </div>
              <div className="grid gap-2.5 tab:grid-rows-4">
                {defs.map((m) => {
                  const ok = trouves.includes(m.id)
                  return (
                    <button key={m.id} type="button" disabled={ok} onClick={() => choisirDef(m.id)} className={`flex min-h-[72px] items-center rounded-2xl border-2 px-3 py-2 text-left text-[13px] leading-snug tab:text-[16px] active:scale-[.98] ${faux === m.id ? 'espace-secoue' : ''}`} style={{ borderColor: ok ? '#9DFF8A' : faux === m.id ? '#FF6B7A' : mot ? 'rgba(255,162,77,.55)' : 'rgba(232,236,255,.18)', background: ok ? 'rgba(157,255,138,.14)' : 'rgba(11,10,30,.88)', color: ok ? '#C8FFC0' : '#E8ECFF' }}>
                      {m.def}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {MOTS.map((m) => (
                <li key={m.id} className="rounded-xl bg-[#0B0A1E]/80 px-3 py-2 text-[12.5px] leading-snug">
                  <span className="labo-jeu text-[15px]" style={{ color: m.couleur }}>{m.mot}</span><br />
                  <span className="text-[#DDE2F7]">{m.def}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Duo>
    </PageEspace>
  )
}
