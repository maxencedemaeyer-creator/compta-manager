import { useEffect, useRef, useState } from 'react'
import { addDoc, collection, limit, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { Flame, Play, Send, Timer, Trophy } from 'lucide-react'
import { db } from '../../../firebase/config.js'
import { usePin } from '../../../context/PinContext.jsx'
import { Bouton, Carte, Eclat, melanger } from '../../../components/labo/CadreJeu.jsx'
import { PageCirc } from './commun.jsx'

// =============================================================
//  C8 · Défi éclair du système circulatoire : 60 secondes.
//  Vrai ou faux, artère ou veine, qui transporte quoi, vocabulaire.
//  Les séries de bonnes réponses multiplient les points.
//  Tableau des records en direct (Firebase, laboDefiCirc).
//  Attendus 66, 67, 70.
// =============================================================
const DUREE = 60
const COLLECTION = 'laboDefiCirc'
const JAUNE = '#FFE45E'

const AFFIRMATIONS = [
  ['Les artères partent du cœur.', true],
  ['Les veines reviennent au cœur.', true],
  ['Les veines partent du cœur.', false],
  ['Le cœur est un muscle.', true],
  ['Le cœur a quatre cavités : deux oreillettes et deux ventricules.', true],
  ['Le sang du côté droit et du côté gauche du cœur se mélange.', false],
  ['Le sang transporte le dioxygène.', true],
  ['Le sang transporte les nutriments.', true],
  ['Le sang transporte le dioxyde de carbone vers les poumons.', true],
  ['C’est dans les poumons que le sang se charge en dioxygène.', true],
  ['C’est dans l’estomac que les nutriments passent dans le sang.', false],
  ['Les nutriments passent dans le sang au niveau de l’intestin grêle.', true],
  ['Après un effort, le cœur bat moins vite.', false],
  ['Pendant un effort, les muscles ont besoin de plus de dioxygène.', true],
  ['L’aorte est une veine.', false],
  ['Le ventricule gauche envoie le sang dans tout le corps.', true],
  ['Le ventricule droit envoie le sang vers les poumons.', true],
  ['On peut sentir son pouls au poignet.', true],
  ['Le rythme cardiaque se mesure en litres par minute.', false],
  ['Les valvules empêchent le sang de revenir en arrière.', true],
  ['Le sang ne passe qu’une seule fois par le cœur pendant un tour complet du corps.', false],
  ['Plus un animal est petit, plus son cœur bat vite, en général.', true],
]
const VAISSEAUX = [
  ['Aorte', 'artere'],
  ['Artère carotide', 'artere'],
  ['Veine jugulaire', 'veine'],
  ['Veine cave', 'veine'],
  ['Artère fémorale', 'artere'],
  ['Veine saphène', 'veine'],
  ['Artère radiale', 'artere'],
  ['Veine fémorale', 'veine'],
]
const ORGANES = [
  ['Où le sang se charge-t-il en dioxygène ?', 'Poumons', ['Poumons', 'Cœur', 'Intestin grêle']],
  ['Où le sang se charge-t-il en nutriments ?', 'Intestin grêle', ['Intestin grêle', 'Poumons', 'Cœur']],
  ['Où le sang rejette-t-il le dioxyde de carbone ?', 'Poumons', ['Poumons', 'Reins', 'Muscles']],
  ['Quelle cavité envoie le sang dans l’aorte ?', 'Ventricule gauche', ['Ventricule gauche', 'Ventricule droit', 'Oreillette gauche']],
  ['Quelle cavité reçoit le sang des veines caves ?', 'Oreillette droite', ['Oreillette droite', 'Oreillette gauche', 'Ventricule gauche']],
  ['Quelle est la plus grosse artère ?', 'Aorte', ['Aorte', 'Carotide', 'Artère radiale']],
  ['Avec quel instrument mesure-t-on le rythme cardiaque en classe ?', 'Chronomètre', ['Chronomètre', 'Thermomètre', 'Balance']],
]
const hasard = (l) => l[Math.floor(Math.random() * l.length)]

function question() {
  const t = Math.random()
  if (t < 0.5) {
    const [texte, vrai] = hasard(AFFIRMATIONS)
    return { type: 'vf', texte, choix: ['vrai', 'faux'], bonne: vrai ? 'vrai' : 'faux' }
  }
  if (t < 0.75) {
    const [nom, type] = hasard(VAISSEAUX)
    return { type: 'vaisseau', texte: `${nom} : artère ou veine ?`, choix: ['artere', 'veine'], bonne: type }
  }
  const [texte, bonne, choix] = hasard(ORGANES)
  return { type: 'qcm', texte, choix: melanger(choix), bonne }
}

const nomChoix = (c) => ({ vrai: 'Vrai', faux: 'Faux', artere: 'Artère', veine: 'Veine' })[c] || c

export default function DefiCircView() {
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
        let n = question()
        while (n.texte === q.texte) n = question()
        setQ(n)
      },
      bon ? 300 : 900,
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

  const cadre = { code: 'C8', titre: 'Défi éclair', attendus: [66, 67, 70] }

  if (phase === 'accueil')
    return (
      <PageCirc {...cadre}>
        <Carte couleur="rgba(255,228,94,.45)" className="text-center">
          <Timer className="mx-auto text-[#FFE45E]" size={44} />
          <p className="labo-titre mt-2 text-2xl font-black text-white">60 secondes chrono</p>
          <p className="mt-1 text-[15px] text-[#B9C1E3]">Vrai ou faux ? Artère ou veine ? Où le sang se charge-t-il ? Trois bonnes réponses d’affilée = points multipliés !</p>
          <Bouton className="mx-auto mt-4" couleur={JAUNE} onClick={lancer}>
            <Play size={18} /> C’est parti
          </Bouton>
        </Carte>
        {tableau}
      </PageCirc>
    )

  if (phase === 'fin')
    return (
      <PageCirc {...cadre}>
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
      </PageCirc>
    )

  return (
    <PageCirc
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
        <p className="labo-titre flex min-h-[180px] items-center justify-center text-center text-xl font-bold text-white">{q.texte}</p>
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
            {nomChoix(c)}
          </button>
        ))}
      </div>
    </PageCirc>
  )
}
