import { useEffect, useMemo, useRef, useState } from 'react'
import { addDoc, collection, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore'
import { Brain, Ear, Eye, RotateCcw, Send } from 'lucide-react'
import { db } from '../../firebase/config.js'
import { usePin } from '../../context/PinContext.jsx'
import CadreJeu, { Bouton, Carte, Eclat, melanger } from '../../components/labo/CadreJeu.jsx'
import Squelette from '../../components/labo/Squelette.jsx'

// =============================================================
//  A7 · Message express
//  1. Le trajet du message : cerveau → moelle épinière → nerf → muscle.
//  2. Vraie expérience : temps de réaction (lumière puis son), mesuré
//     en millisecondes ; les résultats de la classe arrivent en direct
//     (Firebase, collection laboReflexes) et on compare lumière / son.
//  Attendu 114.
// =============================================================
const ETAPES = [
  { id: 'cerveau', nom: 'Le cerveau', texte: 'décide du mouvement' },
  { id: 'moelle', nom: 'La moelle épinière', texte: 'transmet le message dans la colonne' },
  { id: 'nerf', nom: 'Le nerf', texte: 'apporte le message jusqu’au muscle' },
  { id: 'muscle', nom: 'Le muscle', texte: 'se contracte et tire sur l’os' },
]
const ESSAIS = 5
const COLLECTION = 'laboReflexes'
const aujourdhui = () => new Date().toLocaleDateString('fr-CA')
const mediane = (l) => {
  const a = [...l].sort((x, y) => x - y)
  return a.length ? a[Math.floor(a.length / 2)] : 0
}

function bip(ctx) {
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.frequency.value = 880
  g.gain.value = 0.25
  o.connect(g).connect(ctx.destination)
  o.start()
  o.stop(ctx.currentTime + 0.15)
}

function Trajet({ allumes }) {
  const a = (id) => allumes.includes(id)
  return (
    <g>
      <path d="M86 34 C84 22 96 16 104 20 C114 16 120 26 116 36 C120 44 110 50 104 46 C96 50 86 46 86 34 Z" fill={a('cerveau') ? '#FF8AD8' : 'rgba(255,138,216,.25)'} />
      <line x1={100} y1={56} x2={100} y2={200} stroke={a('moelle') ? '#FFD27A' : 'rgba(255,210,122,.25)'} strokeWidth="3" />
      <path d="M100 110 C80 112 66 120 60 140 L57 160" fill="none" stroke={a('nerf') ? '#FFD27A' : 'rgba(255,210,122,.25)'} strokeWidth="2.2" strokeDasharray={a('nerf') ? '0' : '3 3'} />
      <ellipse cx={61} cy={138} rx={6} ry={18} fill={a('muscle') ? 'rgba(255,90,110,.9)' : 'rgba(255,90,110,.3)'} transform="rotate(8 61 138)" />
      {a('muscle') && (
        <circle r="3" fill="#FFF">
          <animateMotion dur="1.2s" repeatCount="indefinite" path="M100 40 L100 110 C80 112 66 120 60 140" />
        </circle>
      )}
    </g>
  )
}

export default function ReflexesView() {
  const { authReady } = usePin()
  const ordre = useMemo(() => melanger(ETAPES), [])
  const [allumes, setAllumes] = useState([])
  const [erreur, setErreur] = useState(null)
  const [partie, setPartie] = useState('trajet') // trajet | test | resultat
  const [stimulus, setStimulus] = useState('lumiere')
  const [etat, setEtat] = useState('pret') // pret | attente | go | trop-tot
  const [temps, setTemps] = useState({ lumiere: [], son: [] })
  const [pseudo, setPseudo] = useState('')
  const [envoye, setEnvoye] = useState(false)
  const [classe, setClasse] = useState([])
  const [eclat, setEclat] = useState({ message: '', cle: 0 })
  const minuteur = useRef(null)
  const depart = useRef(0)
  const audio = useRef(null)

  useEffect(() => {
    if (!authReady) return
    const q = query(collection(db, COLLECTION), where('seance', '==', aujourdhui()))
    return onSnapshot(q, (snap) => setClasse(snap.docs.map((d) => d.data())), () => {})
  }, [authReady])

  useEffect(() => () => clearTimeout(minuteur.current), [])

  function toucherEtape(id) {
    const attendu = ETAPES[allumes.length].id
    if (id === attendu) {
      const n = [...allumes, id]
      setAllumes(n)
      if (n.length === ETAPES.length) setEclat((x) => ({ message: 'Message transmis !', cle: x.cle + 1 }))
    } else {
      setErreur(id)
      setTimeout(() => setErreur(null), 600)
    }
  }

  function lancerEssai() {
    if (!audio.current) audio.current = new (window.AudioContext || window.webkitAudioContext)()
    audio.current.resume?.()
    setEtat('attente')
    clearTimeout(minuteur.current)
    minuteur.current = setTimeout(() => {
      depart.current = performance.now()
      if (stimulus === 'son') bip(audio.current)
      setEtat('go')
    }, 1500 + Math.random() * 2500)
  }

  function toucherZone() {
    if (etat === 'pret' || etat === 'trop-tot') return lancerEssai()
    if (etat === 'attente') {
      clearTimeout(minuteur.current)
      setEtat('trop-tot')
      return
    }
    if (etat === 'go') {
      const ms = Math.round(performance.now() - depart.current)
      const liste = [...temps[stimulus], ms]
      setTemps((t) => ({ ...t, [stimulus]: liste }))
      if (liste.length >= ESSAIS) {
        if (stimulus === 'lumiere') {
          setStimulus('son')
          setEtat('pret')
        } else {
          setPartie('resultat')
        }
      } else {
        setEtat('pret')
      }
    }
  }

  async function envoyer() {
    if (envoye) return
    try {
      await addDoc(collection(db, COLLECTION), {
        pseudo: pseudo.trim().slice(0, 20) || 'Anonyme',
        lumiere: mediane(temps.lumiere),
        son: mediane(temps.son),
        seance: aujourdhui(),
        createdAt: serverTimestamp(),
      })
      setEnvoye(true)
    } catch (e) {
      console.error(e)
    }
  }

  const moyClasse = (cle) => (classe.length ? Math.round(classe.reduce((s, r) => s + (r[cle] || 0), 0) / classe.length) : 0)
  const maxBarre = Math.max(400, ...classe.map((r) => Math.max(r.lumiere, r.son)))

  return (
    <CadreJeu code="A7" titre="Message express" attendus={[114]} couleur="#FFD27A">
      <Eclat message={eclat.message} cle={eclat.cle} couleur="#FFD27A" />

      {partie === 'trajet' && (
        <>
          <Carte couleur="rgba(255,210,122,.45)">
            <p className="labo-mono text-[11px] text-[#FFD27A]">ÉTAPE 1 · LE TRAJET DU MESSAGE</p>
            <p className="mt-1 text-[15px] text-[#E8ECFF]">Tu décides de plier le bras. Dans quel ordre le message voyage-t-il ? Touche les étapes dans l’ordre.</p>
          </Carte>
          <div className="flex gap-3">
            <div className="w-32 flex-none rounded-3xl border border-white/10 bg-[#070B16]/70 p-2">
              <Squelette className="w-full" etats={{}} caches={['femur', 'rotule', 'tibia', 'perone', 'pied']} enfants={<Trajet allumes={allumes} />} />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              {ordre.map((e) => {
                const fait = allumes.includes(e.id)
                return (
                  <button
                    key={e.id}
                    type="button"
                    disabled={fait}
                    onClick={() => toucherEtape(e.id)}
                    className="min-h-[56px] rounded-2xl border-2 px-3 text-left transition"
                    style={{
                      borderColor: fait ? '#9DFF8A' : erreur === e.id ? '#FF8A95' : 'rgba(232,236,255,.18)',
                      background: fait ? 'rgba(157,255,138,.12)' : 'rgba(18,26,48,.85)',
                    }}
                  >
                    <span className="block font-bold text-white">
                      {fait && `${allumes.indexOf(e.id) + 1}. `}
                      {e.nom}
                    </span>
                    {fait && <span className="block text-xs text-[#B9C1E3]">{e.texte}</span>}
                  </button>
                )
              })}
            </div>
          </div>
          {allumes.length === ETAPES.length && (
            <Carte couleur="rgba(157,255,138,.45)">
              <p className="text-[15px] text-[#E8ECFF]">
                Le cerveau commande, l’information circule par les nerfs jusqu’au muscle. Et ça va très vite… Mesurons-le !
              </p>
              <Bouton className="mt-3 w-full" couleur="#FFD27A" onClick={() => setPartie('test')}>
                <Brain size={18} /> Mesurer mes réflexes
              </Bouton>
            </Carte>
          )}
        </>
      )}

      {partie === 'test' && (
        <>
          <Carte couleur="rgba(255,210,122,.45)">
            <p className="labo-mono text-[11px] text-[#FFD27A]">
              ÉTAPE 2 · {stimulus === 'lumiere' ? 'SIGNAL LUMINEUX' : 'SIGNAL SONORE'} · ESSAI {temps[stimulus].length + 1} / {ESSAIS}
            </p>
            <p className="mt-1 text-[15px] text-[#E8ECFF]">
              {stimulus === 'lumiere'
                ? 'Touche la zone dès qu’elle devient verte.'
                : 'Monte le son. Ferme les yeux si tu veux : touche la zone dès que tu entends le bip.'}
            </p>
          </Carte>
          <button
            type="button"
            onPointerDown={toucherZone}
            className="flex h-[46vh] select-none flex-col items-center justify-center gap-3 rounded-3xl border-2 text-center transition-colors duration-75"
            style={{
              background: etat === 'go' && stimulus === 'lumiere' ? '#3CFF5A' : etat === 'trop-tot' ? 'rgba(255,90,110,.35)' : 'rgba(18,26,48,.9)',
              borderColor: '#FFD27A',
            }}
          >
            {stimulus === 'lumiere' ? <Eye size={40} className="text-[#FFD27A]" /> : <Ear size={40} className="text-[#FFD27A]" />}
            <span className="labo-titre text-xl font-bold text-white">
              {etat === 'pret' && 'Touche pour lancer'}
              {etat === 'attente' && 'Attends…'}
              {etat === 'go' && (stimulus === 'lumiere' ? 'MAINTENANT !' : '…')}
              {etat === 'trop-tot' && 'Trop tôt ! Touche pour recommencer'}
            </span>
            {temps[stimulus].length > 0 && (
              <span className="labo-mono text-sm text-[#B9C1E3]">dernier : {temps[stimulus][temps[stimulus].length - 1]} ms</span>
            )}
          </button>
        </>
      )}

      {partie === 'resultat' && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Carte couleur="rgba(255,210,122,.45)" className="text-center">
              <Eye className="mx-auto text-[#FFD27A]" />
              <p className="labo-mono mt-1 text-2xl text-white">{mediane(temps.lumiere)} ms</p>
              <p className="text-xs text-[#8A93B8]">lumière</p>
            </Carte>
            <Carte couleur="rgba(255,210,122,.45)" className="text-center">
              <Ear className="mx-auto text-[#FFD27A]" />
              <p className="labo-mono mt-1 text-2xl text-white">{mediane(temps.son)} ms</p>
              <p className="text-xs text-[#8A93B8]">son</p>
            </Carte>
          </div>
          <p className="text-center text-sm text-[#B9C1E3]">
            1 000 ms = 1 seconde. Pendant ce temps, ton œil ou ton oreille a capté le signal, le message est allé au cerveau, puis du cerveau jusqu’aux muscles de ton doigt.
          </p>
          {!envoye ? (
            <Carte couleur="rgba(255,210,122,.45)">
              <label className="block text-sm text-[#E8ECFF]">
                Ton surnom ou ton numéro de table (pas ton nom complet)
                <input
                  value={pseudo}
                  onChange={(e) => setPseudo(e.target.value)}
                  maxLength={20}
                  className="mt-2 h-12 w-full rounded-xl border border-white/20 bg-[#070B16] px-3 text-white"
                  placeholder="Table 4"
                />
              </label>
              <Bouton className="mt-3 w-full" couleur="#FFD27A" onClick={envoyer} disabled={!authReady}>
                <Send size={18} /> Ajouter mes résultats à ceux de la classe
              </Bouton>
            </Carte>
          ) : (
            <p className="text-center text-sm text-[#9DFF8A]">Résultats envoyés au tableau de la classe.</p>
          )}
          <Carte couleur="rgba(255,210,122,.45)">
            <p className="labo-mono text-[11px] text-[#FFD27A]">LA CLASSE AUJOURD’HUI · {classe.length} ÉLÈVE(S) · EN DIRECT</p>
            {classe.length > 0 && (
              <p className="mt-1 text-sm text-[#E8ECFF]">
                Moyenne : lumière {moyClasse('lumiere')} ms · son {moyClasse('son')} ms.{' '}
                {moyClasse('son') < moyClasse('lumiere') ? 'La classe réagit plus vite au son !' : 'Ici, la lumière gagne. Les scientifiques mesurent d’habitude l’inverse : à vérifier avec plus d’essais !'}
              </p>
            )}
            <div className="mt-3 space-y-2">
              {classe.map((r, i) => (
                <div key={i}>
                  <p className="text-xs text-[#B9C1E3]">{r.pseudo}</p>
                  <div className="mt-0.5 h-2.5 rounded-full bg-[#FFD27A]" style={{ width: `${(r.lumiere / maxBarre) * 100}%` }} />
                  <div className="mt-0.5 h-2.5 rounded-full bg-[#6FEFFF]" style={{ width: `${(r.son / maxBarre) * 100}%` }} />
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-[#8A93B8]">jaune : lumière · bleu : son · une barre plus courte = plus rapide</p>
          </Carte>
          <Bouton
            variante="secondaire"
            onClick={() => {
              setTemps({ lumiere: [], son: [] })
              setStimulus('lumiere')
              setEtat('pret')
              setEnvoye(false)
              setPartie('test')
            }}
          >
            <RotateCcw size={16} /> Nouvel élève
          </Bouton>
        </>
      )}
    </CadreJeu>
  )
}
