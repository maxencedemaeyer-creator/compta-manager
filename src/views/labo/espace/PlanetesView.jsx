import { useState } from 'react'
import { Gem, Ruler, Sun as SunIcon, Sparkles } from 'lucide-react'
import { Carte, Duo, Eclat, melanger } from '../../../components/labo/CadreJeu.jsx'
import { PLANETES, TYPE_COURT, dureeLumiere, nombre, OR, ORANGE } from '../../../components/labo/espace/donnees.js'
import { Boule, Onglets, OrdreCartes, PageEspace } from './commun.jsx'

// =============================================================
//  S7 · Planètes — les huit planètes du Système solaire.
//  Trois jeux : l'ordre depuis le Soleil, l'ordre des tailles, le type de planète.
//  (Pluton est une planète naine depuis 2006 — UAI.)
//  Attendus 100, 108 (voir le référentiel P5-P6 §3.1).
// =============================================================
const TAILLE_BOULE = 62
const visuel = (p, t = TAILLE_BOULE) => <Boule texture={p.texture} taille={t} anneaux={!!p.anneaux} duree={20 + (p.nom.length % 5) * 3} />
const cartes = PLANETES.map((p) => ({ id: p.id, nom: p.nom, couleur: p.couleur, visuel: visuel(p), sous: null }))
const ORDRE_DIST = PLANETES.map((p) => p.id)
const ORDRE_TAILLE = [...PLANETES].sort((a, b) => a.diamKm - b.diamKm).map((p) => p.id)

const TYPES = [
  { id: 'tellurique', nom: 'Rocheuse', texte: 'Un sol solide : roche et métal', couleur: '#E27B58' },
  { id: 'géante gazeuse', nom: 'Géante gazeuse', texte: 'Surtout de l’hydrogène et de l’hélium', couleur: '#FFD27A' },
  { id: 'géante de glaces', nom: 'Géante de glaces', texte: 'Eau, ammoniac, méthane en glace et en gaz', couleur: '#C9A3FF' },
]

function Resume({ ordre, mode, erreurs, onRejouer }) {
  const liste = ordre.map((id) => PLANETES.find((p) => p.id === id))
  return (
    <Carte couleur="rgba(255,226,122,.5)" className="!p-3">
      <p className="labo-jeu text-[24px] leading-tight" style={{ color: OR }}>{erreurs === 0 ? 'Parfait !' : erreurs < 4 ? 'Bravo !' : 'Bien joué !'}</p>
      <p className="text-[12px] text-[#B9C1E3]">{erreurs === 0 ? 'Aucune erreur.' : `${erreurs} erreur${erreurs > 1 ? 's' : ''}.`}</p>
      <ul className="mt-2 grid gap-1">
        {liste.map((p, i) => (
          <li key={p.id} className="flex items-center justify-between rounded-xl bg-[#0B0A1E]/80 px-2.5 py-1 text-[12.5px]">
            <span className="flex items-center gap-2"><b className="labo-jeu w-4 text-[#B9C1E3]">{i + 1}</b><span className="labo-jeu" style={{ color: p.couleur }}>{p.nom}</span></span>
            <span className="text-[#DDE2F7]">{mode === 'distance' ? `${nombre(p.distMkm, 1)} M km · lumière ${dureeLumiere(p.distMkm)}` : `${nombre(p.diamKm)} km`}</span>
          </li>
        ))}
      </ul>
      <button type="button" onClick={onRejouer} className="mt-3 min-h-[48px] w-full rounded-2xl text-[15px] font-bold active:scale-95" style={{ background: ORANGE, color: '#12062A' }}>Rejouer</button>
    </Carte>
  )
}

function JeuType({ onFin }) {
  const [ordre] = useState(() => melanger(PLANETES))
  const [i, setI] = useState(0)
  const [rep, setRep] = useState(null)
  const [fautes, setFautes] = useState(0)
  const [eclat, setEclat] = useState({ message: '', cle: 0 })
  const p = ordre[i]
  function choisir(id) {
    if (rep) return
    setRep(id)
    const bon = id === p.type
    if (!bon) setFautes((f) => f + 1)
    else setEclat((c) => ({ message: 'Oui !', cle: c.cle + 1 }))
    setTimeout(() => {
      if (i + 1 >= ordre.length) onFin(fautes + (bon ? 0 : 1))
      else {
        setI(i + 1)
        setRep(null)
      }
    }, 1500)
  }
  return (
    <div className="flex flex-col gap-3 tab:min-h-0 tab:flex-1">
      <Eclat message={eclat.message} cle={eclat.cle} couleur="#FFE27A" />
      <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-white/12 bg-[#05030f]/40 p-4 tab:flex-1">
        <p className="labo-mono text-[11px] text-[#B9C1E3]">PLANÈTE {i + 1} / {ordre.length}</p>
        <div key={p.id}>{visuel(p, 120)}</div>
        <p className="labo-jeu text-[34px] leading-none" style={{ color: p.couleur }}>{p.nom}</p>
        {rep && <p className="max-w-md text-center text-[13px] leading-snug text-[#E8ECFF]">{p.fait}</p>}
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {TYPES.map((t) => {
          const bon = rep && t.id === p.type
          const mauvais = rep === t.id && t.id !== p.type
          return (
            <button key={t.id} type="button" onClick={() => choisir(t.id)} className={`flex min-h-[96px] flex-col items-center justify-center gap-1 rounded-3xl border-2 p-2 text-center active:scale-95 ${mauvais ? 'espace-secoue' : ''}`} style={{ borderColor: bon ? '#9DFF8A' : mauvais ? '#FF6B7A' : `${t.couleur}88`, background: bon ? 'rgba(157,255,138,.15)' : 'rgba(11,10,30,.88)' }}>
              <span className="labo-jeu text-[17px] leading-tight" style={{ color: t.couleur }}>{t.nom}</span>
              <span className="text-[11px] leading-tight text-[#B9C1E3]">{t.texte}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function PlanetesView() {
  const [mode, setMode] = useState('distance')
  const [cle, setCle] = useState(0)
  const [fin, setFin] = useState(null)
  const [eclat, setEclat] = useState({ message: '', cle: 0 })

  function terminer(erreurs) {
    setFin({ erreurs })
    setEclat((c) => ({ message: erreurs === 0 ? 'Parfait !' : 'Bravo !', cle: c.cle + 1 }))
  }
  function changer(m) {
    setMode(m)
    setFin(null)
    setCle((c) => c + 1)
  }
  const consigne = { distance: 'Touche les planètes dans l’ordre, de la plus proche du Soleil à la plus lointaine.', taille: 'Touche les planètes de la plus petite à la plus grosse.', type: 'Quelle sorte de planète est‑ce ?' }[mode]
  const ordre = mode === 'distance' ? ORDRE_DIST : ORDRE_TAILLE

  return (
    <PageEspace code="S7" titre="Planètes" attendus={[100,108]} ecran large>
      <Eclat message={eclat.message} cle={eclat.cle} couleur="#FFE27A" />
      <Duo
        visuelDabord
        commandes={
          <>
            <Onglets valeur={mode} onChange={changer} couleur={ORANGE} options={[['distance', SunIcon, 'Distance'], ['taille', Ruler, 'Taille'], ['type', Gem, 'Type']]} />
            <Carte couleur="rgba(166,107,255,.4)" className="!p-3">
              <p className="labo-jeu text-[20px] leading-snug text-white">{consigne}</p>
            </Carte>
            {fin && mode !== 'type' && <Resume ordre={ordre} mode={mode} erreurs={fin.erreurs} onRejouer={() => changer(mode)} />}
            {fin && mode === 'type' && (
              <Carte couleur="rgba(255,226,122,.5)" className="!p-3">
                <p className="labo-jeu text-[24px]" style={{ color: OR }}>{fin.erreurs === 0 ? 'Parfait !' : 'Bravo !'}</p>
                <p className="text-[12px] text-[#B9C1E3]">{fin.erreurs === 0 ? 'Aucune erreur.' : `${fin.erreurs} erreur${fin.erreurs > 1 ? 's' : ''}.`}</p>
                <ul className="mt-2 grid gap-1">
                  {TYPES.map((t) => (
                    <li key={t.id} className="rounded-xl bg-[#0B0A1E]/80 px-2.5 py-1.5 text-[12.5px]">
                      <span className="labo-jeu" style={{ color: t.couleur }}>{t.nom}</span> : {PLANETES.filter((p) => p.type === t.id).map((p) => p.nom).join(', ')}
                    </li>
                  ))}
                </ul>
                <button type="button" onClick={() => changer('type')} className="mt-3 min-h-[48px] w-full rounded-2xl text-[15px] font-bold active:scale-95" style={{ background: ORANGE, color: '#12062A' }}>Rejouer</button>
              </Carte>
            )}
            <Carte couleur="rgba(255,255,255,.12)" className="!p-3">
              <div className="flex items-start gap-2 text-[12px] leading-snug text-[#B9C1E3]"><Sparkles size={16} className="mt-0.5 flex-none" color="#C9A3FF" /><p>Pluton n’est plus une planète : depuis 2006, c’est une <b className="text-white">planète naine</b> (trop petite pour avoir « nettoyé » son orbite).</p></div>
            </Carte>
          </>
        }
      >
        {mode === 'type' ? (
          <JeuType key={cle} onFin={terminer} />
        ) : (
          <OrdreCartes
            key={cle}
            cartes={cartes}
            ordre={ordre}
            colonnes={4}
            onFin={terminer}
            depart={
              mode === 'distance' ? (
                <div className="flex min-w-[60px] flex-none flex-col items-center justify-center rounded-2xl px-1">
                  <SunIcon size={34} color="#FFB347" />
                  <span className="labo-jeu text-[12px] text-[#FFD27A]">Soleil</span>
                </div>
              ) : null
            }
          />
        )}
      </Duo>
    </PageEspace>
  )
}
