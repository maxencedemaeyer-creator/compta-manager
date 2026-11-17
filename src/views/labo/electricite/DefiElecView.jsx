import { useEffect, useRef, useState } from 'react'
import { addDoc, collection, limit, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { Flame, Play, Send, Timer, Trophy } from 'lucide-react'
import { db } from '../../../firebase/config.js'
import { usePin } from '../../../context/PinContext.jsx'
import { Bouton, Carte, Eclat, melanger } from '../../../components/labo/CadreJeu.jsx'
import { CircuitFige, Vignette } from '../../../components/labo/electricite/Banc.jsx'
import { fonctionne, resoudre } from '../../../components/labo/electricite/circuit.js'
import { OBJETS } from '../../../components/labo/electricite/objets.jsx'
import { JAUNE, PageElec, comp, fil } from './commun.jsx'

// =============================================================
//  E8 · Défi éclair électricité : 60 secondes.
//  « Ça marche ? » sur des circuits tirés au hasard (la réponse
//  est calculée par le moteur du circuit), symboles, vocabulaire.
//  Tableau des records en direct (Firebase, laboDefiElec). Attendu 114.
// =============================================================
const DUREE = 60
const COLLECTION = 'laboDefiElec'
const H = 315

const AFFIRMATIONS = [
  ['La pile est un générateur.', true],
  ['L’ampoule est un générateur.', false],
  ['Le moteur et la sonnette sont des récepteurs.', true],
  ['Le métal est un conducteur.', true],
  ['Le plastique est un conducteur.', false],
  ['Le bois sec est un isolant.', true],
  ['La mine de crayon (graphite) conduit le courant.', true],
  ['Dans un circuit ouvert, le courant circule.', false],
  ['Un interrupteur fermé laisse passer le courant.', true],
  ['En série, si une ampoule grille, les autres s’éteignent.', true],
  ['En dérivation, si une ampoule grille, les autres s’éteignent.', false],
  ['Relier les deux bornes d’une pile par un fil provoque un court-circuit.', true],
  ['Une DEL s’allume quel que soit son sens de branchement.', false],
  ['La prise du mur (230 V) est sans danger.', false],
  ['Le courant sort de la pile par la borne + et y revient par la borne −.', true],
  ['Un circuit doit être fermé pour fonctionner.', true],
]
const SYMBOLES = { pile: 'Pile', ampoule: 'Ampoule', moteur: 'Moteur', sonnette: 'Sonnette', del: 'DEL', interrupteur: 'Interrupteur', poussoir: 'Bouton-poussoir' }
const QUESTION_RECEPTEUR = { ampoule: 'L’ampoule s’allume-t-elle ?', moteur: 'Le moteur tourne-t-il ?', del: 'La DEL s’allume-t-elle ?', sonnette: 'La sonnette sonne-t-elle ?' }
const hasard = (l) => l[Math.floor(Math.random() * l.length)]

function circuitAuHasard() {
  const type = hasard(['ampoule', 'ampoule', 'moteur', 'del', 'sonnette'])
  const composants = [comp('p', 'pile', 180, 255), comp('x', type, 86, 95)]
  const second = hasard(['interrupteur', 'interrupteur', 'objet', 'ampoule', 'aucun'])
  let fils
  if (second === 'aucun') fils = [fil('p:0', 'x:0'), fil('x:1', 'p:1')]
  else {
    const o = second === 'objet' ? hasard(OBJETS) : null
    composants.push(comp('y', second, 274, 95, second === 'interrupteur' ? { ferme: Math.random() < 0.5 } : o ? { objet: o.id, materiau: o.materiau } : {}))
    fils = [fil('p:0', 'x:0'), fil('x:1', 'y:0'), fil('y:1', 'p:1')]
  }
  const t = Math.random()
  if (t < 0.22) fils.splice(Math.floor(Math.random() * fils.length), 1) // un fil manque
  else if (t < 0.3) fils.push(fil('p:0', 'p:1')) // court-circuit
  if (type === 'del' && Math.random() < 0.5) fils = fils.map((f) => ({ ...f, a: f.a.replace(/^x:(\d)$/, (m, b) => `x:${1 - b}`), b: f.b.replace(/^x:(\d)$/, (m, b) => `x:${1 - b}`) }))
  const circuit = { composants, fils }
  const marche = fonctionne(resoudre(composants, fils), 'x')
  return { type: 'circuit', circuit, texte: QUESTION_RECEPTEUR[type], vue: Math.random() < 0.65 ? 'photo' : 'schema', choix: ['oui', 'non'], bonne: marche ? 'oui' : 'non' }
}

function question() {
  const t = Math.random()
  if (t < 0.5) return circuitAuHasard()
  if (t < 0.72) {
    const cible = hasard(Object.keys(SYMBOLES))
    return { type: 'symbole', cible, choix: melanger([cible, ...melanger(Object.keys(SYMBOLES).filter((x) => x !== cible)).slice(0, 3)]), bonne: cible }
  }
  const [texte, vrai] = hasard(AFFIRMATIONS)
  return { type: 'vf', texte, choix: ['vrai', 'faux'], bonne: vrai ? 'vrai' : 'faux' }
}

const nomChoix = (q, c) => (q.type === 'symbole' ? SYMBOLES[c] : { oui: 'Oui', non: 'Non', vrai: 'Vrai', faux: 'Faux' }[c])

export default function DefiElecView() {
  const { authReady } = usePin()
  const [phase, setPhase] = useState('accueil')
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
    } else setSerie(0)
    setFlash(bon ? 'ok' : 'non')
    setTimeout(
      () => {
        setFlash(null)
        setQ(question())
      },
      bon ? 300 : q.type === 'circuit' ? 1400 : 700,
    )
  }

  async function envoyer() {
    try {
      await addDoc(collection(db, COLLECTION), { pseudo: pseudo.trim().slice(0, 20) || 'Anonyme', score, createdAt: serverTimestamp() })
      setEnvoye(true)
    } catch (e) {
      console.error(e)
    }
  }

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

  const cadre = { code: 'E8', titre: 'Défi éclair', attendus: [114], couleur: JAUNE }

  if (phase === 'accueil')
    return (
      <PageElec {...cadre}>
        <Carte couleur="rgba(255,228,94,.45)" className="text-center">
          <Timer className="mx-auto text-[#FFE45E]" size={44} />
          <p className="labo-titre mt-2 text-2xl font-black text-white">60 secondes chrono</p>
          <p className="mt-1 text-[15px] text-[#B9C1E3]">Ce circuit fonctionne-t-il ? Quel est ce symbole ? Vrai ou faux ? Trois bonnes réponses d’affilée = points multipliés !</p>
          <Bouton className="mx-auto mt-4" couleur={JAUNE} onClick={lancer}>
            <Play size={18} /> C’est parti
          </Bouton>
        </Carte>
        {tableau}
      </PageElec>
    )

  if (phase === 'fin')
    return (
      <PageElec {...cadre}>
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
              <Bouton className="mt-3 w-full" couleur={JAUNE} onClick={envoyer} disabled={!authReady}>
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
      </PageElec>
    )

  return (
    <PageElec
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
        {q.type === 'vf' && <p className="labo-titre flex min-h-[200px] items-center justify-center text-center text-xl font-bold text-white">{q.texte}</p>}
        {q.type === 'symbole' && (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-2">
            <p className="text-sm text-[#B9C1E3]">Quel est ce symbole ?</p>
            <div className="rounded-2xl bg-[#F7F5EE] p-2">
              <Vignette type={q.cible} vue="schema" taille={130} />
            </div>
          </div>
        )}
        {q.type === 'circuit' && (
          <div>
            <p className="mb-2 text-center text-[15px] font-bold text-white">{q.texte}</p>
            {/* pendant la question, le circuit est montré éteint ; la réponse s'allume après */}
            <CircuitFige circuit={q.circuit} vue={q.vue} hauteur={H} apercu={!flash} />
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
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
    </PageElec>
  )
}
