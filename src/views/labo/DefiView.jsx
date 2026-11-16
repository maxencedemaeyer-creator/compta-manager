import { useEffect, useRef, useState } from 'react'
import { addDoc, collection, limit, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { Flame, Play, Send, Timer, Trophy } from 'lucide-react'
import { db } from '../../firebase/config.js'
import { usePin } from '../../context/PinContext.jsx'
import CadreJeu, { Bouton, Carte, Eclat, melanger } from '../../components/labo/CadreJeu.jsx'
import Squelette, { NOMS_ARTICULATIONS, NOMS_OS, OS_REFERENTIEL } from '../../components/labo/Squelette.jsx'

// =============================================================
//  A11 · Défi éclair
//  60 secondes : os, articulations et vocabulaire du référentiel.
//  Les séries de bonnes réponses multiplient les points.
//  Tableau des records de la classe en direct (Firebase, laboDefi).
//  Attendus 112, 113, 116.
// =============================================================
const DUREE = 60
const COLLECTION = 'laboDefi'

const AFFIRMATIONS = [
  ['Un muscle est attaché aux os par des tendons.', true],
  ['Un muscle peut pousser sur un os.', false],
  ['Le fémur est l’os de la cuisse.', true],
  ['La rotule se trouve devant le genou.', true],
  ['Le radius est un os de la jambe.', false],
  ['Le crâne protège le cerveau.', true],
  ['Plier le bras, c’est une extension.', false],
  ['Tendre la jambe, c’est une extension.', true],
  ['Le cerveau commande les mouvements ; le message circule par les nerfs.', true],
  ['Les côtes protègent le cœur et les poumons.', true],
  ['Le péroné est un os du bras.', false],
  ['Le squelette sert au soutien, à la locomotion et à la protection.', true],
  ['Pour plier le bras, le biceps se contracte.', true],
  ['Les vertèbres forment la colonne vertébrale.', true],
  ['Le coude relie l’épaule au poignet sans articulation.', false],
  ['Un muscle attaché à un seul os peut faire bouger un membre.', false],
]

function question() {
  const tirage = Math.random()
  if (tirage < 0.45) {
    const os = OS_REFERENTIEL[Math.floor(Math.random() * OS_REFERENTIEL.length)]
    const choix = melanger([os, ...melanger(OS_REFERENTIEL.filter((o) => o !== os)).slice(0, 3)])
    return { type: 'os', cible: os, choix, bonne: os }
  }
  if (tirage < 0.7) {
    const ids = Object.keys(NOMS_ARTICULATIONS)
    const art = ids[Math.floor(Math.random() * ids.length)]
    const choix = melanger([art, ...melanger(ids.filter((a) => a !== art)).slice(0, 3)])
    return { type: 'articulation', cible: art, choix, bonne: art }
  }
  const [texte, vrai] = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]
  return { type: 'vf', texte, choix: ['vrai', 'faux'], bonne: vrai ? 'vrai' : 'faux' }
}

export default function DefiView() {
  const { authReady } = usePin()
  const [phase, setPhase] = useState('accueil') // accueil | jeu | fin
  const [restant, setRestant] = useState(DUREE)
  const [q, setQ] = useState(question)
  const [score, setScore] = useState(0)
  const [serie, setSerie] = useState(0)
  const [flash, setFlash] = useState(null)
  const [pseudo, setPseudo] = useState('')
  const [envoye, setEnvoye] = useState(false)
  const [records, setRecords] = useState([])
  const [eclat, setEclat] = useState({ message: '', cle: 0 })
  const minuteur = useRef(null)

  useEffect(() => {
    if (!authReady) return
    const qr = query(collection(db, COLLECTION), orderBy('score', 'desc'), limit(10))
    return onSnapshot(qr, (s) => setRecords(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => {})
  }, [authReady])

  useEffect(() => () => clearInterval(minuteur.current), [])

  function lancer() {
    setPhase('jeu')
    setRestant(DUREE)
    setScore(0)
    setSerie(0)
    setEnvoye(false)
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
    } else {
      setSerie(0)
    }
    setFlash(bon ? 'ok' : 'non')
    setTimeout(() => {
      setFlash(null)
      setQ(question())
    }, bon ? 250 : 700)
  }

  async function envoyer() {
    try {
      await addDoc(collection(db, COLLECTION), { pseudo: pseudo.trim().slice(0, 20) || 'Anonyme', score, createdAt: serverTimestamp() })
      setEnvoye(true)
    } catch (e) {
      console.error(e)
    }
  }

  const nomChoix = (c) => (q.type === 'os' ? NOMS_OS[c] : q.type === 'articulation' ? NOMS_ARTICULATIONS[c] : c === 'vrai' ? 'Vrai' : 'Faux')

  const tableau = (
    <Carte couleur="rgba(255,228,94,.45)">
      <p className="labo-mono flex items-center gap-1.5 text-[11px] text-[#FFE45E]">
        <Trophy size={13} /> TABLEAU DES RECORDS · EN DIRECT
      </p>
      {records.length === 0 ? (
        <p className="mt-2 text-sm text-[#8A93B8]">Aucun record pour l’instant. Sois le premier !</p>
      ) : (
        <ol className="mt-2 space-y-1">
          {records.map((r, i) => (
            <li key={r.id} className="flex items-center justify-between rounded-xl bg-[#070B16]/60 px-3 py-1.5 text-sm">
              <span className="text-[#E8ECFF]">
                <span className="labo-mono mr-2 text-[#FFE45E]">{i + 1}.</span>
                {r.pseudo}
              </span>
              <span className="labo-mono text-[#FFE45E]">{r.score}</span>
            </li>
          ))}
        </ol>
      )}
    </Carte>
  )

  if (phase === 'accueil') {
    return (
      <CadreJeu code="A11" titre="Défi éclair" attendus={[112, 113, 116]} couleur="#FFE45E">
        <Carte couleur="rgba(255,228,94,.45)" className="text-center">
          <Timer className="mx-auto text-[#FFE45E]" size={44} />
          <p className="labo-titre mt-2 text-2xl font-black text-white">60 secondes chrono</p>
          <p className="mt-1 text-[15px] text-[#B9C1E3]">Os, articulations, vrai ou faux : réponds le plus vite possible. Trois bonnes réponses d’affilée = points multipliés !</p>
          <Bouton className="mx-auto mt-4" couleur="#FFE45E" onClick={lancer}>
            <Play size={18} /> C’est parti
          </Bouton>
        </Carte>
        {tableau}
      </CadreJeu>
    )
  }

  if (phase === 'fin') {
    return (
      <CadreJeu code="A11" titre="Défi éclair" attendus={[112, 113, 116]} couleur="#FFE45E">
        <Carte couleur="rgba(255,228,94,.45)" className="text-center">
          <p className="labo-mono text-[11px] text-[#FFE45E]">TEMPS ÉCOULÉ</p>
          <p className="labo-titre text-5xl font-black text-white">{score}</p>
          <p className="text-sm text-[#8A93B8]">points</p>
          {!envoye ? (
            <div className="mt-3 text-left">
              <label className="block text-sm text-[#E8ECFF]">
                Ton surnom ou ton numéro de table
                <input value={pseudo} onChange={(e) => setPseudo(e.target.value)} maxLength={20} placeholder="Table 4" className="mt-2 h-12 w-full rounded-xl border border-white/20 bg-[#070B16] px-3 text-white" />
              </label>
              <Bouton className="mt-3 w-full" couleur="#FFE45E" onClick={envoyer} disabled={!authReady}>
                <Send size={18} /> Inscrire mon score
              </Bouton>
            </div>
          ) : (
            <p className="mt-2 text-sm text-[#9DFF8A]">Score inscrit au tableau !</p>
          )}
          <Bouton variante="secondaire" className="mx-auto mt-3" onClick={lancer}>
            Rejouer
          </Bouton>
        </Carte>
        {tableau}
      </CadreJeu>
    )
  }

  return (
    <CadreJeu
      code="A11"
      titre="Défi éclair"
      attendus={[112, 113, 116]}
      couleur="#FFE45E"
      droite={
        <div className="text-right">
          <p className={`labo-mono text-2xl ${restant <= 10 ? 'text-[#FF8A95]' : 'text-[#FFE45E]'}`}>{restant}</p>
          <p className="text-[10px] text-[#8A93B8]">secondes</p>
        </div>
      }
    >
      <Eclat message={eclat.message} cle={eclat.cle} couleur="#FFE45E" />
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

      <div
        className="rounded-3xl border-2 p-3 transition-colors"
        style={{ borderColor: flash === 'ok' ? '#9DFF8A' : flash === 'non' ? '#FF8A95' : 'rgba(232,236,255,.12)', background: 'rgba(7,11,22,.7)' }}
      >
        {q.type === 'vf' ? (
          <p className="labo-titre flex min-h-[200px] items-center justify-center text-center text-xl font-bold text-white">{q.texte}</p>
        ) : (
          <>
            <p className="text-center text-sm text-[#B9C1E3]">{q.type === 'os' ? 'Quel est cet os ?' : 'Quelle est cette articulation ?'}</p>
            <Squelette
              className="mx-auto h-[36vh] w-full"
              etats={q.type === 'os' ? { [q.cible]: 'actif' } : {}}
              articulations={q.type === 'articulation' ? { [q.cible]: 'actif' } : null}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {q.choix.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => repondre(c)}
            className="labo-titre min-h-[56px] rounded-2xl border-2 px-2 text-[15px] font-bold text-white active:scale-[.97]"
            style={{
              borderColor: flash && c === q.bonne ? '#9DFF8A' : 'rgba(255,228,94,.35)',
              background: 'rgba(18,26,48,.9)',
            }}
          >
            {nomChoix(c)}
          </button>
        ))}
      </div>
    </CadreJeu>
  )
}
