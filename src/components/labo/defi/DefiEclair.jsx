import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { addDoc, collection, limit, onSnapshot, orderBy, query, serverTimestamp, Timestamp, where } from 'firebase/firestore'
import { Check, Crown, Flame, Play, RotateCcw, Send, Trophy } from 'lucide-react'
import { db } from '../../../firebase/config.js'
import { usePin } from '../../../context/PinContext.jsx'
import { Bouton, Carte, Eclat } from '../CadreJeu.jsx'
import LogoActivite from '../LogoActivite.jsx'
import { EXPERIENCE } from '../../../config/laboAteliers.js'

// =============================================================
//  Moteur commun des « Défi » (A11, E8, C8) : le grand test de
//  chaque expérience.
//  - 60 secondes, séries = points multipliés (comme avant).
//  - Chaque question est liée à une activité (q.act = id de
//    l'activité) → à la fin, BILAN par activité : réussi, ou
//    « à revoir » avec un lien direct vers l'activité.
//  - Records en direct (Firebase) : DU JOUR et DE TOUS LES TEMPS.
//    Même collection qu'avant (laboDefi, laboDefiElec, laboDefiCirc),
//    mêmes champs : pseudo, score, createdAt (+ bons, total).
//
//  Chaque vue fournit : question() → { act, choix, bonne, ... },
//  rendu(q, flash) (zone de la question), nomChoix(q, c).
// =============================================================
const DUREE = 60
const JAUNE = '#FFE45E'

const minuit = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return Timestamp.fromDate(d)
}

function useRecords(nomCollection, authReady) {
  const [tous, setTous] = useState([])
  const [jour, setJour] = useState([])
  useEffect(() => {
    if (!authReady) return
    const col = collection(db, nomCollection)
    const a = onSnapshot(query(col, orderBy('score', 'desc'), limit(10)), (s) => setTous(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => {})
    // un seul champ (createdAt) dans la requête → pas d'index composite à créer
    const b = onSnapshot(
      query(col, where('createdAt', '>=', minuit())),
      (s) => setJour(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((x, y) => y.score - x.score).slice(0, 10)),
      () => {},
    )
    return () => {
      a()
      b()
    }
  }, [nomCollection, authReady])
  return { tous, jour }
}

function TableauRecords({ tous, jour, monId }) {
  const [onglet, setOnglet] = useState('jour')
  const liste = onglet === 'jour' ? jour : tous
  return (
    <Carte couleur="rgba(255,228,94,.45)">
      <div className="flex items-center justify-between gap-2">
        <p className="labo-mono flex items-center gap-1.5 text-[11px] text-[#FFE45E]">
          <Trophy size={13} /> RECORDS
        </p>
        <div className="flex rounded-full bg-[#070B16]/70 p-1 text-xs font-bold">
          {[
            ['jour', 'Aujourd’hui'],
            ['tous', 'Tous les temps'],
          ].map(([id, nom]) => (
            <button key={id} type="button" onClick={() => setOnglet(id)} className="min-h-[34px] rounded-full px-3" style={onglet === id ? { background: JAUNE, color: '#070B16' } : { color: '#B9C1E3' }}>
              {nom}
            </button>
          ))}
        </div>
      </div>
      {liste.length === 0 ? (
        <p className="mt-3 text-sm text-[#8A93B8]">Pas encore de record. Sois le premier !</p>
      ) : (
        <ol className="mt-3 space-y-1">
          {liste.map((r, i) => (
            <li
              key={r.id}
              className="flex items-center justify-between rounded-xl px-3 py-1.5 text-sm"
              style={{ background: r.id === monId ? 'rgba(255,228,94,.22)' : 'rgba(7,11,22,.6)' }}
            >
              <span className="flex items-center text-[#E8ECFF]">
                <span className="labo-mono mr-2 w-5 text-[#FFE45E]">{i === 0 ? <Crown size={15} /> : `${i + 1}.`}</span>
                {r.pseudo}
              </span>
              <span className="labo-mono text-[#FFE45E]">{r.score}</span>
            </li>
          ))}
        </ol>
      )}
    </Carte>
  )
}

function Bilan({ experience, resultats }) {
  const exp = EXPERIENCE[experience]
  const lignes = exp.activites
    .filter((a) => resultats[a.id])
    .map((a) => ({ a, ...resultats[a.id] }))
    .sort((x, y) => x.bons / x.total - y.bons / y.total)
  if (lignes.length === 0) return null
  return (
    <Carte couleur="rgba(232,236,255,.15)">
      <p className="labo-mono text-[11px] text-[#B9C1E3]">TON BILAN</p>
      <ul className="mt-2 space-y-1.5">
        {lignes.map(({ a, bons, total }) => {
          const ok = bons === total
          const contenu = (
            <>
              <LogoActivite activite={a} taille={36} />
              <span className="labo-jeu flex-1 text-lg" style={{ color: a.couleur }}>
                {a.nom}
              </span>
              <span className="labo-mono text-sm text-[#E8ECFF]">
                {bons}/{total}
              </span>
              {ok ? (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#9DFF8A] text-[#06210A]">
                  <Check size={18} strokeWidth={3} />
                </span>
              ) : (
                <span className="rounded-full bg-[#FF8A95] px-2.5 py-1 text-xs font-bold text-[#2A0509]">À revoir</span>
              )}
            </>
          )
          return (
            <li key={a.id}>
              {ok ? (
                <div className="flex items-center gap-3 rounded-2xl bg-[#070B16]/60 p-2">{contenu}</div>
              ) : (
                <Link to={`/labo/${experience}/${a.id}`} className="flex items-center gap-3 rounded-2xl bg-[#070B16]/60 p-2 active:scale-[.98]">
                  {contenu}
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </Carte>
  )
}

export default function DefiEclair({ Page, cadre, experience, nomCollection, question, rendu, nomChoix, annonce, delaiErreur = 800 }) {
  const { authReady } = usePin()
  const [phase, setPhase] = useState('accueil') // accueil | jeu | fin
  const [restant, setRestant] = useState(DUREE)
  const [q, setQ] = useState(question)
  const [score, setScore] = useState(0)
  const [serie, setSerie] = useState(0)
  const [flash, setFlash] = useState(null)
  const [resultats, setResultats] = useState({})
  const [pseudo, setPseudo] = useState('')
  const [monId, setMonId] = useState(null)
  const [eclat, setEclat] = useState({ message: '', cle: 0 })
  const minuteur = useRef(null)
  const { tous, jour } = useRecords(nomCollection, authReady)

  useEffect(() => () => clearInterval(minuteur.current), [])

  function suivante(actuelle) {
    // évite de reposer la même question deux fois de suite (sauf les circuits, tous différents)
    const cle = (x) => (x.circuit ? Math.random() : x.texte || x.cible)
    let n = question()
    for (let i = 0; i < 6 && cle(n) === cle(actuelle); i++) n = question()
    return n
  }

  function lancer() {
    setPhase('jeu')
    setRestant(DUREE)
    setScore(0)
    setSerie(0)
    setResultats({})
    setMonId(null)
    setQ(question())
    const fin = Date.now() + DUREE * 1000
    clearInterval(minuteur.current)
    minuteur.current = setInterval(() => {
      const r = Math.max(0, Math.ceil((fin - Date.now()) / 1000))
      setRestant(r)
      if (r <= 0) {
        clearInterval(minuteur.current)
        setPhase('fin')
      }
    }, 200)
  }

  function repondre(c) {
    if (flash) return
    const bon = c === q.bonne
    if (bon) {
      const multi = 1 + Math.floor(serie / 3)
      setScore((s) => s + 10 * multi)
      setSerie((s) => s + 1)
      if ((serie + 1) % 3 === 0) setEclat((x) => ({ message: `Série ×${multi + 1} !`, cle: x.cle + 1 }))
    } else setSerie(0)
    if (q.act)
      setResultats((r) => {
        const avant = r[q.act] || { bons: 0, total: 0 }
        return { ...r, [q.act]: { bons: avant.bons + (bon ? 1 : 0), total: avant.total + 1 } }
      })
    setFlash(bon ? 'ok' : 'non')
    setTimeout(
      () => {
        setFlash(null)
        setQ(suivante(q))
      },
      bon ? 300 : typeof delaiErreur === 'function' ? delaiErreur(q) : delaiErreur,
    )
  }

  const totaux = useMemo(() => Object.values(resultats).reduce((t, r) => ({ bons: t.bons + r.bons, total: t.total + r.total }), { bons: 0, total: 0 }), [resultats])

  async function envoyer() {
    try {
      const ref = await addDoc(collection(db, nomCollection), {
        pseudo: pseudo.trim().slice(0, 20) || 'Anonyme',
        score,
        bons: totaux.bons,
        total: totaux.total,
        createdAt: serverTimestamp(),
      })
      setMonId(ref.id)
    } catch (e) {
      console.error(e)
    }
  }

  const records = <TableauRecords tous={tous} jour={jour} monId={monId} />

  if (phase === 'accueil')
    return (
      <Page {...cadre}>
        <div className="relative overflow-hidden rounded-3xl border-2 p-5 text-center" style={{ borderColor: '#FFF3A6', background: 'linear-gradient(135deg, #FFE45E, #FFC93C)' }}>
          <span className="labo-reflet" />
          <Trophy className="relative mx-auto text-[#070B16]" size={48} strokeWidth={2.2} />
          <p className="labo-jeu relative mt-2 text-[34px] leading-none text-[#070B16]">Teste-toi !</p>
          <p className="relative mt-2 text-[15px] font-medium text-[#3D3200]">{annonce}</p>
          <p className="labo-mono relative mt-1 text-xs text-[#5C4A00]">60 secondes · 3 bonnes d’affilée = points ×2</p>
          <button
            type="button"
            onClick={lancer}
            className="labo-titre relative mx-auto mt-4 flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-[#070B16] px-6 text-base font-bold text-[#FFE45E] active:scale-[.97]"
          >
            <Play size={20} /> C’est parti
          </button>
        </div>
        {records}
      </Page>
    )

  if (phase === 'fin') {
    // meilleur score des AUTRES (sans le mien, une fois inscrit)
    const meilleur = (liste) => liste.find((r) => r.id !== monId)?.score ?? 0
    const recordJour = score > 0 && score > meilleur(jour)
    const recordTous = score > 0 && score > meilleur(tous)
    return (
      <Page {...cadre}>
        <Eclat message={!monId && recordTous ? 'Record absolu !' : !monId && recordJour ? 'Record du jour !' : ''} couleur={JAUNE} cle={1} />
        <Carte couleur="rgba(255,228,94,.45)" className="text-center">
          <p className="labo-mono text-[11px] text-[#FFE45E]">TEMPS ÉCOULÉ</p>
          <p className="labo-titre text-5xl font-black text-white">{score}</p>
          <p className="text-sm text-[#B9C1E3]">
            points · {totaux.bons} bonne{totaux.bons > 1 ? 's' : ''} réponse{totaux.bons > 1 ? 's' : ''} sur {totaux.total}
          </p>
          {(recordTous || recordJour) && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#FFE45E] px-3 py-1 text-sm font-bold text-[#070B16]">
              <Crown size={15} /> {recordTous ? 'Record de tous les temps !' : 'Record du jour !'}
            </p>
          )}
          {!monId ? (
            <div className="mt-3 text-left">
              <label className="block text-sm text-[#E8ECFF]">
                Ton surnom ou ton numéro de table
                <input value={pseudo} onChange={(e) => setPseudo(e.target.value)} maxLength={20} placeholder="Table 4" className="mt-2 h-12 w-full rounded-xl border border-white/20 bg-[#070B16] px-3 text-white" />
              </label>
              <Bouton className="mt-3 w-full" couleur={JAUNE} onClick={envoyer} disabled={!authReady}>
                <Send size={18} /> Inscrire mon score
              </Bouton>
            </div>
          ) : (
            <p className="mt-2 text-sm text-[#9DFF8A]">Score inscrit au tableau !</p>
          )}
          <Bouton variante="secondaire" className="mx-auto mt-3" onClick={lancer}>
            <RotateCcw size={18} /> Rejouer
          </Bouton>
        </Carte>
        <Bilan experience={experience} resultats={resultats} />
        {records}
      </Page>
    )
  }

  return (
    <Page
      {...cadre}
      droite={
        <div className="text-right">
          <p className={`labo-mono text-2xl ${restant <= 10 ? 'text-[#FF8A95]' : 'text-[#FFE45E]'}`}>{restant}</p>
          <p className="text-[10px] text-[#8A93B8]">secondes</p>
        </div>
      }
    >
      <Eclat message={eclat.message} cle={eclat.cle} couleur={JAUNE} />
      <div className="flex items-center justify-between">
        <span className="labo-titre text-2xl font-black text-white">{score}</span>
        {serie >= 2 && (
          <span className="flex items-center gap-1 rounded-full bg-[#FF8A3D]/20 px-3 py-1 text-sm font-bold text-[#FFB86B]">
            <Flame size={16} /> série de {serie}
          </span>
        )}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-[#FFE45E] transition-[width] duration-200" style={{ width: `${(restant / DUREE) * 100}%` }} />
      </div>
      <div className="rounded-3xl border-2 p-3 transition-colors" style={{ borderColor: flash === 'ok' ? '#9DFF8A' : flash === 'non' ? '#FF8A95' : 'rgba(232,236,255,.12)', background: 'rgba(7,11,22,.7)' }}>
        {rendu ? rendu(q, flash) : <p className="labo-titre flex min-h-[180px] items-center justify-center text-center text-xl font-bold text-white">{q.texte}</p>}
      </div>
      <div className={`grid gap-2 ${q.choix.length === 3 ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {q.choix.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => repondre(c)}
            className="labo-titre min-h-[56px] rounded-2xl border-2 px-2 text-[15px] font-bold text-white active:scale-[.97]"
            style={{ borderColor: flash && c === q.bonne ? '#9DFF8A' : 'rgba(255,228,94,.35)', background: 'rgba(18,26,48,.9)' }}
          >
            {nomChoix(q, c)}
          </button>
        ))}
      </div>
    </Page>
  )
}
