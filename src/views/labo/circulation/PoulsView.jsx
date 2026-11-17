import { useEffect, useMemo, useRef, useState } from 'react'
import { addDoc, collection, limit, onSnapshot, orderBy, query, serverTimestamp, where, Timestamp } from 'firebase/firestore'
import { ArrowRight, Camera, Check, Hand, HeartPulse, Minus, Plus, RotateCcw, Send, Timer, Users } from 'lucide-react'
import { db } from '../../../firebase/config.js'
import { usePin } from '../../../context/PinContext.jsx'
import { Bouton, Carte, Eclat } from '../../../components/labo/CadreJeu.jsx'
import Circulation3D from '../../../components/labo/circulation/Circulation3D.jsx'
import { Consigne, Onglets, PageCirc } from './commun.jsx'

// =============================================================
//  C4 · Mon cœur au chrono
//  L'expérience du référentiel : évaluer le rythme cardiaque avant
//  et après l'effort, et l'interpréter.
//  1) Au repos : 3 mesures → moyenne (répéter l'expérience)
//  2) Effort guidé d'une minute (sauts sur place)
//  3) Juste après l'effort, puis après 2 minutes de récupération
//  Deux façons de mesurer :
//  - au chronomètre (15 s, × 4), en tapant à chaque battement, le pouls
//    pris au poignet (artère radiale) ou au cou (artère carotide), montrés en 3D ;
//  - avec la caméra du téléphone ou de la tablette (bout du doigt sur
//    l'objectif : la couleur change à chaque battement). Calcul fait
//    DANS l'appareil : aucune image n'est enregistrée ni envoyée.
//  Bilan, interprétation, puis synthèse de toute la classe (Firebase,
//  collection laboPouls). Attendu 68.
// =============================================================
const COLLECTION = 'laboPouls'
const DUREE_CHRONO = 15
const DUREE_EFFORT = 60
const DUREE_RECUP = 120

const moyenne = (l) => (l.length ? Math.round(l.reduce((a, b) => a + b, 0) / l.length) : 0)

export default function PoulsView() {
  const [etape, setEtape] = useState('intro') // intro | repos | effort | apres | attente | recup | bilan
  const [repos, setRepos] = useState([])
  const [apres, setApres] = useState(null)
  const [recup, setRecup] = useState(null)
  const [eclat, setEclat] = useState({ message: '', cle: 0 })

  function ajouterRepos(v) {
    const l = [...repos, v]
    setRepos(l)
    setEclat((x) => ({ message: `Mesure ${l.length} : ${v}`, cle: x.cle + 1 }))
    if (l.length >= 3) setTimeout(() => setEtape('effort'), 900)
  }

  function recommencer() {
    setRepos([])
    setApres(null)
    setRecup(null)
    setEtape('intro')
  }

  const ETAPES_FRISE = [
    ['repos', 'Repos'],
    ['effort', 'Effort'],
    ['apres', 'Après'],
    ['recup', 'Récup.'],
    ['bilan', 'Bilan'],
  ]
  const ordre = ['intro', 'repos', 'effort', 'apres', 'attente', 'recup', 'bilan']
  const iEtape = ordre.indexOf(etape)

  return (
    <PageCirc code="C4" titre="Mon cœur au chrono" attendus={[68]}>
      <Eclat message={eclat.message} cle={eclat.cle} couleur="#FFD27A" />
      {/* Frise des étapes */}
      <div className="flex gap-1">
        {ETAPES_FRISE.map(([id, nom]) => {
          const i = ordre.indexOf(id)
          const fait = iEtape > i || (id === 'recup' && etape === 'bilan')
          const encours = etape === id || (id === 'recup' && etape === 'attente')
          return (
            <div key={id} className="flex-1">
              <div className="h-1.5 rounded-full" style={{ background: fait ? '#FFD27A' : encours ? 'rgba(255,210,122,.55)' : 'rgba(255,255,255,.1)' }} />
              <p className="labo-mono mt-1 text-center text-[10px]" style={{ color: encours ? '#FFD27A' : '#8A93B8' }}>
                {nom}
              </p>
            </div>
          )
        })}
      </div>

      {etape === 'intro' && (
        <>
          <Carte couleur="rgba(255,210,122,.5)">
            <p className="labo-titre text-lg font-bold text-white">L’expérience</p>
            <p className="mt-1 text-[15px] leading-snug text-[#DDE2F7]">
              Comment ton cœur réagit-il à un effort ? Tu vas mesurer ton <b>rythme cardiaque</b> (le nombre de battements par minute) :
            </p>
            <ol className="mt-2 flex flex-col gap-1.5 text-[14px] text-[#E8ECFF]">
              <li>1. Au repos, <b>3 fois</b>, pour faire une moyenne.</li>
              <li>2. Puis 1 minute d’effort : des sauts sur place.</li>
              <li>3. Juste après l’effort.</li>
              <li>4. Après 2 minutes de repos.</li>
            </ol>
          </Carte>
          <Consigne couleur="#FFD27A">
            <b>Hypothèse :</b> avant de commencer, que va-t-il se passer après l’effort ? Dis-le à ton voisin… puis vérifie !
          </Consigne>
          <Bouton couleur="#FFD27A" onClick={() => setEtape('repos')}>
            Assieds-toi au calme et commence <ArrowRight size={18} />
          </Bouton>
        </>
      )}

      {etape === 'repos' && (
        <>
          <Consigne couleur="#FFD27A">
            <b>Au repos · mesure {repos.length + 1} / 3.</b> Reste assis, calme. {repos.length > 0 && `Déjà : ${repos.join(', ')}.`}
          </Consigne>
          <Mesure key={repos.length} onResultat={ajouterRepos} />
        </>
      )}

      {etape === 'effort' && <Effort repos={moyenne(repos)} onFini={() => setEtape('apres')} />}

      {etape === 'apres' && (
        <>
          <Consigne couleur="#FF6B7A">
            <b>Vite, juste après l’effort !</b> Mesure ton rythme maintenant.
          </Consigne>
          <Mesure
            rapide
            onResultat={(v) => {
              setApres(v)
              setEtape('attente')
            }}
          />
        </>
      )}

      {etape === 'attente' && <Attente onFini={() => setEtape('recup')} />}

      {etape === 'recup' && (
        <>
          <Consigne couleur="#9DFF8A">
            <b>Après 2 minutes de repos.</b> Mesure encore une fois.
          </Consigne>
          <Mesure
            onResultat={(v) => {
              setRecup(v)
              setEtape('bilan')
            }}
          />
        </>
      )}

      {etape === 'bilan' && <Bilan repos={repos} apres={apres} recup={recup} onRecommencer={recommencer} />}
    </PageCirc>
  )
}

// ------------------------------------------------------------------
//  Une mesure : au chronomètre (en tapant) ou avec la caméra
// ------------------------------------------------------------------
function Mesure({ onResultat, rapide = false }) {
  const [methode, setMethode] = useState('chrono')
  return (
    <>
      <Onglets
        valeur={methode}
        onChange={setMethode}
        couleur="#FFD27A"
        options={[
          ['chrono', Timer, 'Chronomètre'],
          ['camera', Camera, 'Caméra'],
        ]}
      />
      {methode === 'chrono' ? <MesureChrono onResultat={onResultat} rapide={rapide} /> : <MesureCamera onResultat={onResultat} />}
    </>
  )
}

function MesureChrono({ onResultat, rapide }) {
  const [endroit, setEndroit] = useState('poignet')
  const [phase, setPhase] = useState('pret') // pret | compte | fin
  const [restant, setRestant] = useState(DUREE_CHRONO)
  const [taps, setTaps] = useState(0)
  const [flash, setFlash] = useState(0)
  const minuteur = useRef(null)
  useEffect(() => () => clearInterval(minuteur.current), [])

  function demarrer() {
    setTaps(0)
    setPhase('compte')
    setRestant(DUREE_CHRONO)
    const fin = Date.now() + DUREE_CHRONO * 1000
    clearInterval(minuteur.current)
    minuteur.current = setInterval(() => {
      const r = Math.max(0, Math.ceil((fin - Date.now()) / 1000))
      setRestant(r)
      if (r <= 0) {
        clearInterval(minuteur.current)
        setPhase('fin')
        navigator.vibrate?.(200)
      }
    }, 100)
  }

  const groupe = endroit === 'poignet' ? 'artere_radiale' : 'carotide'
  return (
    <>
      {phase === 'pret' && (
        <>
          <div className="grid grid-cols-2 gap-2">
            {[
              ['poignet', 'Au poignet'],
              ['cou', 'Au cou'],
            ].map(([v, n]) => (
              <button key={v} type="button" onClick={() => setEndroit(v)} className="h-11 rounded-2xl border text-[14px] font-bold" style={endroit === v ? { background: '#FFD27A', color: '#1F1500', borderColor: '#FFD27A' } : { borderColor: 'rgba(255,255,255,.15)' }}>
                {n}
              </button>
            ))}
          </div>
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#070B16]/80">
            <Circulation3D
              className="h-[34vh] min-h-[230px] w-full"
              afficher={['artere', 'veine', 'os', 'coeur']}
              couleurs="type"
              opacites={{ os: 0.35 }}
              cadrage={endroit === 'poignet' ? { boite: [[0.18, 0.82, -0.06], [0.3, 1.0, 0.07]] } : { boite: [[-0.08, 1.38, -0.08], [0.08, 1.62, 0.1]] }}
              etats={{ [`${groupe}_g`]: 'actif', [`${groupe}_d`]: 'actif', veine: 'attenue' }}
              etiquettes={[endroit === 'poignet' ? { texte: 'Artère radiale : pose 2 doigts ici', point: [0.262, 0.905, 0.02], couleur: '#8FF4FF', dy: -34 } : { texte: 'Artère carotide : pose 2 doigts ici', point: [0.02, 1.43, 0.01], couleur: '#8FF4FF', dy: -30 }]}
              battement={70}
            />
          </div>
          <p className="text-[13px] leading-snug text-[#B9C1E3]">
            {endroit === 'poignet'
              ? 'Retourne ta main, paume vers le haut. Pose l’index et le majeur sur le poignet, du côté du pouce, et appuie doucement.'
              : 'Pose l’index et le majeur sur le côté du cou, sous la mâchoire, et appuie doucement.'}{' '}
            N’utilise pas ton pouce : il a son propre pouls !
          </p>
          <Bouton couleur="#FFD27A" onClick={demarrer}>
            <Timer size={18} /> Je sens mon pouls : chrono {DUREE_CHRONO} s
          </Bouton>
        </>
      )}

      {phase === 'compte' && (
        <div className="flex flex-col items-center gap-3">
          <p className="labo-mono text-[12px] text-[#FFD27A]">TAPE À CHAQUE BATTEMENT</p>
          <button
            type="button"
            onPointerDown={() => {
              setTaps((t) => t + 1)
              setFlash((f) => f + 1)
            }}
            className="relative flex h-60 w-60 select-none items-center justify-center rounded-full border-4 border-[#FF4D6D] bg-[#FF4D6D]/15 active:scale-95"
            style={{ touchAction: 'manipulation' }}
          >
            <span key={flash} className="labo-onde absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,77,109,.6), transparent 70%)' }} />
            <span className="relative flex flex-col items-center">
              <HeartPulse size={44} className="text-[#FF4D6D]" />
              <span className="labo-titre text-6xl font-black text-white">{taps}</span>
            </span>
          </button>
          <p className="labo-titre text-3xl font-black text-[#FFD27A]">{restant} s</p>
        </div>
      )}

      {phase === 'fin' && (
        <Carte couleur="rgba(255,210,122,.5)">
          <p className="text-[14px] text-[#DDE2F7]">Combien de battements as-tu comptés en {DUREE_CHRONO} secondes ? Corrige si besoin.</p>
          <div className="mt-2 flex items-center justify-center gap-4">
            <button type="button" onClick={() => setTaps((t) => Math.max(0, t - 1))} className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20" aria-label="Un de moins">
              <Minus />
            </button>
            <span className="labo-titre w-20 text-center text-5xl font-black text-white">{taps}</span>
            <button type="button" onClick={() => setTaps((t) => t + 1)} className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20" aria-label="Un de plus">
              <Plus />
            </button>
          </div>
          <p className="mt-3 text-center text-[15px] text-[#E8ECFF]">
            En 1 minute (60 s = 4 × 15 s) : <b>{taps} × 4 = </b>
            <b className="labo-titre text-2xl text-[#FFD27A]">{taps * 4}</b> battements
          </p>
          {(taps * 4 < 40 || taps * 4 > 220) && <p className="mt-1 text-center text-[13px] text-[#FFB3BD]">Ce nombre est étonnant : recommence la mesure.</p>}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Bouton variante="secondaire" onClick={() => setPhase('pret')}>
              <RotateCcw size={16} /> Refaire
            </Bouton>
            <Bouton couleur="#FFD27A" disabled={taps * 4 < 30 || taps * 4 > 240} onClick={() => onResultat(taps * 4)}>
              <Check size={17} /> Valider
            </Bouton>
          </div>
        </Carte>
      )}
      {rapide && phase === 'pret' && <p className="text-center text-[12px] text-[#FF8A9C]">Ne traîne pas : le cœur ralentit vite après l’effort !</p>}
    </>
  )
}

// Caméra : le bout du doigt sur l'objectif. À chaque battement, un peu plus de sang
// arrive dans le doigt et l'image devient un tout petit peu plus sombre.
function MesureCamera({ onResultat }) {
  const video = useRef(null)
  const toile = useRef(null)
  const courbe = useRef(null)
  const [etat, setEtat] = useState('pret') // pret | mesure | fin | erreur
  const [message, setMessage] = useState('')
  const [bpm, setBpm] = useState(null)
  const [couvert, setCouvert] = useState(false)
  const [progres, setProgres] = useState(0)
  const flux = useRef(null)
  const DUREE = 25

  useEffect(() => () => arreter(), [])

  function arreter() {
    flux.current?.getTracks().forEach((t) => t.stop())
    flux.current = null
  }

  async function demarrer() {
    setMessage('')
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 320 }, height: { ideal: 240 } }, audio: false })
      flux.current = s
      const piste = s.getVideoTracks()[0]
      try {
        if (piste.getCapabilities?.().torch) await piste.applyConstraints({ advanced: [{ torch: true }] })
      } catch {
        /* pas de lampe : la lumière de la pièce suffit souvent */
      }
      video.current.srcObject = s
      await video.current.play()
      setEtat('mesure')
      analyser()
    } catch (e) {
      console.error(e)
      setEtat('erreur')
      setMessage('La caméra n’est pas disponible. Autorise-la, ou utilise le chronomètre.')
    }
  }

  function analyser() {
    const ctx = toile.current.getContext('2d', { willReadFrequently: true })
    const ech = [] // { t, v }
    let debutCouvert = null
    let dernierAffichage = 0
    const boucle = () => {
      if (!flux.current) return
      const v = video.current
      if (v.readyState >= 2) {
        ctx.drawImage(v, v.videoWidth * 0.3, v.videoHeight * 0.3, v.videoWidth * 0.4, v.videoHeight * 0.4, 0, 0, 32, 32)
        const d = ctx.getImageData(0, 0, 32, 32).data
        let r = 0
        let g = 0
        let b = 0
        for (let i = 0; i < d.length; i += 4) {
          r += d[i]
          g += d[i + 1]
          b += d[i + 2]
        }
        const n = d.length / 4
        r /= n
        g /= n
        b /= n
        const t = performance.now() / 1000
        const ok = r > 60 && r > g * 1.6 && r > b * 1.6
        setCouvert(ok)
        if (!ok) {
          debutCouvert = null
          ech.length = 0
          setProgres(0)
        } else {
          debutCouvert ??= t
          ech.push({ t, v: r })
          while (ech.length && ech[0].t < t - 12) ech.shift()
          const ecoule = t - debutCouvert
          setProgres(Math.min(1, ecoule / DUREE))
          if (t - dernierAffichage > 0.25) {
            dernierAffichage = t
            const res = calculer(ech)
            dessiner(res.signal)
            if (res.bpm && ecoule > 6) setBpm(res.bpm)
            if (ecoule >= DUREE && res.bpm) {
              setBpm(res.bpm)
              setEtat('fin')
              arreter()
              return
            }
          }
        }
      }
      requestAnimationFrame(boucle)
    }
    requestAnimationFrame(boucle)
  }

  function dessiner(signal) {
    const c = courbe.current
    if (!c || signal.length < 3) return
    const g = c.getContext('2d')
    const W = (c.width = c.clientWidth * 2)
    const H = (c.height = 120)
    g.clearRect(0, 0, W, H)
    const vals = signal.map((s) => s.v)
    const mn = Math.min(...vals)
    const mx = Math.max(...vals)
    const t0 = signal[0].t
    const t1 = signal[signal.length - 1].t
    g.strokeStyle = '#FF4D6D'
    g.lineWidth = 3
    g.beginPath()
    signal.forEach((s, i) => {
      const x = ((s.t - t0) / (t1 - t0 || 1)) * W
      const y = H - 8 - ((s.v - mn) / (mx - mn || 1)) * (H - 16)
      i ? g.lineTo(x, y) : g.moveTo(x, y)
    })
    g.stroke()
  }

  return (
    <>
      <Carte couleur="rgba(255,210,122,.45)">
        <p className="text-[14px] leading-snug text-[#DDE2F7]">
          Pose le <b>bout de ton index</b> sur l’objectif de la caméra arrière (et sur le flash s’il y en a un). Appuie à peine, ne bouge plus. Dans une pièce bien éclairée, ça marche aussi sans flash.
        </p>
        <p className="mt-1 text-[12px] text-[#8A93B8]">Le calcul se fait dans l’appareil : aucune image n’est enregistrée ni envoyée.</p>
      </Carte>
      <video ref={video} playsInline muted className="hidden" />
      <canvas ref={toile} width="32" height="32" className="hidden" />
      {etat === 'pret' && (
        <Bouton couleur="#FFD27A" onClick={demarrer}>
          <Camera size={18} /> Allumer la caméra
        </Bouton>
      )}
      {etat === 'erreur' && <p className="text-center text-[14px] text-[#FFB3BD]">{message}</p>}
      {etat === 'mesure' && (
        <Carte couleur={couvert ? '#FF4D6D' : 'rgba(255,255,255,.15)'}>
          <p className="labo-mono text-[11px]" style={{ color: couvert ? '#FF8A9C' : '#FFD27A' }}>
            {couvert ? 'SIGNAL DU DOIGT · NE BOUGE PLUS' : 'COUVRE BIEN LA CAMÉRA AVEC LE DOIGT'}
          </p>
          <canvas ref={courbe} className="mt-2 h-[60px] w-full" />
          <div className="mt-2 flex items-end justify-between">
            <span className="labo-titre text-4xl font-black text-white">
              {bpm ?? '…'} <span className="text-sm font-bold text-[#B9C1E3]">batt./min</span>
            </span>
            <HeartPulse className={couvert ? 'labo-pulse text-[#FF4D6D]' : 'text-[#4A5375]'} size={34} />
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-[#FFD27A] transition-all" style={{ width: `${progres * 100}%` }} />
          </div>
        </Carte>
      )}
      {etat === 'fin' && (
        <Carte couleur="rgba(255,210,122,.5)">
          <p className="text-center text-[14px] text-[#DDE2F7]">Rythme mesuré par la caméra :</p>
          <p className="labo-titre text-center text-5xl font-black text-[#FFD27A]">{bpm}</p>
          <p className="text-center text-[13px] text-[#B9C1E3]">battements par minute</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Bouton
              variante="secondaire"
              onClick={() => {
                setBpm(null)
                setEtat('pret')
              }}
            >
              <RotateCcw size={16} /> Refaire
            </Bouton>
            <Bouton couleur="#FFD27A" onClick={() => onResultat(bpm)}>
              <Check size={17} /> Valider
            </Bouton>
          </div>
        </Carte>
      )}
    </>
  )
}

// Traitement du signal : on enlève la lente dérive (moyenne glissante d'1 s), on lisse,
// on cherche les creux de luminosité (= battements), puis la durée médiane entre deux.
function calculer(ech) {
  if (ech.length < 30) return { signal: [], bpm: null }
  const moy = (arr, i, demi) => {
    let s = 0
    let n = 0
    for (let k = Math.max(0, i - demi); k <= Math.min(arr.length - 1, i + demi); k++) {
      s += arr[k]
      n++
    }
    return s / n
  }
  const dt = (ech[ech.length - 1].t - ech[0].t) / (ech.length - 1)
  const brut = ech.map((e) => e.v)
  const demiLent = Math.max(2, Math.round(0.5 / dt))
  const demiLisse = Math.max(1, Math.round(0.07 / dt))
  const detendu = brut.map((v, i) => moy(brut, i, demiLent) - v) // inversé : un battement = un pic
  const lisse = detendu.map((v, i) => moy(detendu, i, demiLisse))
  const signal = lisse.map((v, i) => ({ t: ech[i].t, v }))
  const ecart = Math.sqrt(lisse.reduce((s, v) => s + v * v, 0) / lisse.length)
  const pics = []
  for (let i = 2; i < lisse.length - 2; i++) {
    const v = lisse[i]
    if (v > 0.35 * ecart && v >= lisse[i - 1] && v >= lisse[i + 1] && v >= lisse[i - 2] && v >= lisse[i + 2]) {
      if (!pics.length || ech[i].t - pics[pics.length - 1] > 0.3) pics.push(ech[i].t)
    }
  }
  const ecarts = []
  for (let i = 1; i < pics.length; i++) {
    const d = pics[i] - pics[i - 1]
    if (d >= 0.3 && d <= 1.6) ecarts.push(d)
  }
  if (ecarts.length < 4) return { signal, bpm: null }
  ecarts.sort((a, b) => a - b)
  const med = ecarts[Math.floor(ecarts.length / 2)]
  return { signal, bpm: Math.round(60 / med) }
}

// ------------------------------------------------------------------
//  L'effort guidé : 1 minute de sauts sur place
// ------------------------------------------------------------------
function Effort({ repos, onFini }) {
  const [lance, setLance] = useState(false)
  const [restant, setRestant] = useState(DUREE_EFFORT)
  useEffect(() => {
    if (!lance) return
    const fin = Date.now() + DUREE_EFFORT * 1000
    const id = setInterval(() => {
      const r = Math.max(0, Math.ceil((fin - Date.now()) / 1000))
      setRestant(r)
      if (r <= 0) {
        clearInterval(id)
        navigator.vibrate?.([200, 100, 200])
        onFini()
      }
    }, 200)
    return () => clearInterval(id)
  }, [lance])

  return (
    <>
      <Carte couleur="rgba(255,107,122,.5)">
        <p className="labo-mono text-[11px] text-[#FF8A9C]">TA MOYENNE AU REPOS : {repos} BATTEMENTS PAR MINUTE</p>
        <p className="labo-titre mt-1 text-lg font-bold text-white">L’effort : 1 minute de sauts sur place</p>
        <p className="mt-1 text-[14px] leading-snug text-[#DDE2F7]">Saute sur place en écartant bras et jambes (ou cours sur place), sans t’arrêter, jusqu’à la fin du chrono. Pose la tablette dans un endroit sûr.</p>
      </Carte>
      {!lance ? (
        <Bouton couleur="#FF6B7A" onClick={() => setLance(true)}>
          C’est parti !
        </Bouton>
      ) : (
        <div className="flex flex-col items-center gap-2 py-4">
          <div className="relative flex h-52 w-52 items-center justify-center">
            <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="6" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="#FF6B7A" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(restant / DUREE_EFFORT) * 283} 283`} />
            </svg>
            <span className="labo-titre text-6xl font-black text-white">{restant}</span>
          </div>
          <p className="labo-titre animate-bounce text-xl font-bold text-[#FF8A9C]">Saute ! Saute ! Saute !</p>
        </div>
      )}
    </>
  )
}

function Attente({ onFini }) {
  const [restant, setRestant] = useState(DUREE_RECUP)
  useEffect(() => {
    const fin = Date.now() + DUREE_RECUP * 1000
    const id = setInterval(() => {
      const r = Math.max(0, Math.ceil((fin - Date.now()) / 1000))
      setRestant(r)
      if (r <= 0) {
        clearInterval(id)
        navigator.vibrate?.(200)
        onFini()
      }
    }, 250)
    return () => clearInterval(id)
  }, [])
  return (
    <Carte couleur="rgba(157,255,138,.45)" className="text-center">
      <p className="labo-titre text-lg font-bold text-white">Repos : assieds-toi et respire calmement</p>
      <p className="labo-titre mt-2 text-6xl font-black text-[#9DFF8A]">
        {Math.floor(restant / 60)}:{String(restant % 60).padStart(2, '0')}
      </p>
      <p className="mt-2 text-[14px] text-[#B9C1E3]">Pendant ce temps, observe : ta respiration aussi s’est accélérée pendant l’effort ?</p>
      <button type="button" onClick={onFini} className="mt-3 text-[12px] text-[#8A93B8] underline">
        Passer l’attente
      </button>
    </Carte>
  )
}

// ------------------------------------------------------------------
//  Bilan, interprétation et synthèse de la classe
// ------------------------------------------------------------------
const QUESTIONS_BILAN = [
  {
    q: 'Pourquoi le cœur bat-il plus vite pendant et après l’effort ?',
    choix: ['Les muscles ont besoin de plus de dioxygène et de nutriments : le cœur envoie plus de sang', 'Le sang devient plus lourd', 'Le cœur a froid'],
    bonne: 0,
  },
  {
    q: 'Et la respiration, pendant l’effort ?',
    choix: ['Elle accélère aussi, pour faire entrer plus de dioxygène dans le sang', 'Elle s’arrête', 'Elle ne change pas'],
    bonne: 0,
  },
  {
    q: 'Après 2 minutes de repos, le rythme cardiaque…',
    choix: ['redescend vers le rythme de repos', 'continue de monter', 'tombe à zéro'],
    bonne: 0,
  },
]

function Bilan({ repos, apres, recup, onRecommencer }) {
  const { authReady } = usePin()
  const m = moyenne(repos)
  const [reponses, setReponses] = useState({})
  const [pseudo, setPseudo] = useState('')
  const [envoye, setEnvoye] = useState(false)
  const [classe, setClasse] = useState([])
  const [vueClasse, setVueClasse] = useState(false)

  useEffect(() => {
    if (!authReady) return
    const minuit = new Date()
    minuit.setHours(0, 0, 0, 0)
    const q = query(collection(db, COLLECTION), where('createdAt', '>=', Timestamp.fromDate(minuit)), orderBy('createdAt', 'desc'), limit(60))
    return onSnapshot(q, (s) => setClasse(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => {})
  }, [authReady])

  async function envoyer() {
    try {
      await addDoc(collection(db, COLLECTION), { pseudo: pseudo.trim().slice(0, 20) || 'Anonyme', repos: m, effort: apres, recup, createdAt: serverTimestamp() })
      setEnvoye(true)
      setVueClasse(true)
    } catch (e) {
      console.error(e)
    }
  }

  const max = Math.max(m, apres, recup, 100)
  const barres = [
    ['Au repos (moyenne)', m, '#4DA3FF'],
    ['Juste après l’effort', apres, '#FF4D6D'],
    ['Après 2 min de repos', recup, '#9DFF8A'],
  ]
  const synthese = useMemo(() => {
    const l = classe.filter((c) => c.repos && c.effort)
    if (!l.length) return null
    return { n: l.length, repos: moyenne(l.map((c) => c.repos)), effort: moyenne(l.map((c) => c.effort)), recup: moyenne(l.filter((c) => c.recup).map((c) => c.recup)), l }
  }, [classe])

  return (
    <>
      <Carte couleur="rgba(255,210,122,.5)">
        <p className="labo-mono text-[11px] text-[#FFD27A]">MES RÉSULTATS</p>
        <p className="mt-1 text-[13px] text-[#B9C1E3]">
          Moyenne au repos : ({repos.join(' + ')}) ÷ {repos.length} = <b className="text-white">{m}</b>
        </p>
        <svg viewBox="0 0 320 170" className="mt-2 w-full">
          {barres.map(([nom, v, c], i) => {
            const h = (v / max) * 120
            const x = 22 + i * 100
            return (
              <g key={nom}>
                <rect x={x} y={140 - h} width="76" height={h} rx="8" fill={c} opacity=".85" />
                <text x={x + 38} y={132 - h} textAnchor="middle" fontSize="18" fontWeight="800" fill="#fff">
                  {v}
                </text>
                <text x={x + 38} y={158} textAnchor="middle" fontSize="9.5" fill="#B9C1E3">
                  {nom}
                </text>
              </g>
            )
          })}
          <line x1="10" y1="140" x2="310" y2="140" stroke="rgba(255,255,255,.25)" />
        </svg>
        <p className="mt-1 text-[14px] leading-snug text-[#E8ECFF]">
          Après l’effort, ton cœur est passé de <b>{m}</b> à <b>{apres}</b> battements par minute : {apres >= m ? `${apres - m} de plus` : `${m - apres} de moins (étonnant : refais l’expérience ?)`}. Deux minutes plus tard : <b>{recup}</b>.
        </p>
      </Carte>

      {QUESTIONS_BILAN.map((q, i) => (
        <Carte key={q.q} couleur="rgba(255,255,255,.14)">
          <p className="text-[15px] font-bold text-white">{q.q}</p>
          <div className="mt-2 flex flex-col gap-1.5">
            {q.choix.map((c, k) => {
              const r = reponses[i]
              const st = r === undefined ? {} : k === q.bonne ? { background: '#9DFF8A', color: '#06210A' } : k === r ? { background: '#FF6B7A', color: '#2A0509' } : { opacity: 0.45 }
              return (
                <button key={c} type="button" onClick={() => r === undefined && setReponses((x) => ({ ...x, [i]: k }))} className="min-h-[44px] rounded-xl border border-white/15 bg-[#0B1122] px-3 py-2 text-left text-[14px]" style={st}>
                  {c}
                </button>
              )
            })}
          </div>
        </Carte>
      ))}

      <Carte couleur="rgba(77,163,255,.5)">
        <p className="labo-mono flex items-center gap-1.5 text-[11px] text-[#8FC4FF]">
          <Users size={13} /> SYNTHÈSE DE LA CLASSE · AUJOURD’HUI
        </p>
        {!envoye ? (
          <div className="mt-2 flex gap-2">
            <input value={pseudo} onChange={(e) => setPseudo(e.target.value)} maxLength={20} placeholder="Ton prénom ou un pseudo" className="h-12 min-w-0 flex-1 rounded-xl border border-white/15 bg-[#0B1122] px-3 text-[15px] text-white" />
            <Bouton couleur="#4DA3FF" onClick={envoyer} disabled={!authReady}>
              <Send size={17} /> Envoyer
            </Bouton>
          </div>
        ) : (
          <p className="mt-1 text-[13px] text-[#9DFF8A]">Tes résultats sont dans le tableau de la classe.</p>
        )}
        {!vueClasse && synthese && (
          <button type="button" onClick={() => setVueClasse(true)} className="mt-2 text-[13px] font-bold text-[#8FC4FF] underline">
            Voir les résultats de la classe ({synthese.n})
          </button>
        )}
        {vueClasse && synthese && <SyntheseClasse s={synthese} />}
      </Carte>

      <Bouton variante="secondaire" onClick={onRecommencer}>
        <RotateCcw size={16} /> Refaire l’expérience
      </Bouton>
    </>
  )
}

function SyntheseClasse({ s }) {
  const max = Math.max(...s.l.map((c) => Math.max(c.effort, c.repos)), 120)
  const min = Math.min(...s.l.map((c) => Math.min(c.repos, c.recup || c.repos)), 50)
  const x = (v) => 8 + ((v - min) / (max - min || 1)) * 84
  return (
    <div className="mt-3">
      <p className="text-[14px] leading-snug text-[#E8ECFF]">
        <b>{s.n}</b> élève{s.n > 1 ? 's' : ''} : en moyenne, le cœur passe de <b className="text-[#8FC4FF]">{s.repos}</b> au repos à <b className="text-[#FF8A9C]">{s.effort}</b> battements par minute après l’effort
        {s.recup ? (
          <>
            , puis redescend à <b className="text-[#9DFF8A]">{s.recup}</b>.
          </>
        ) : (
          '.'
        )}
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {s.l.slice(0, 30).map((c) => (
          <div key={c.id} className="flex items-center gap-2">
            <span className="w-20 truncate text-[12px] text-[#B9C1E3]">{c.pseudo}</span>
            <div className="relative h-5 flex-1">
              <div className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full" style={{ left: `${x(c.repos)}%`, width: `${Math.max(0, x(c.effort) - x(c.repos))}%`, background: 'linear-gradient(90deg,#4DA3FF,#FF4D6D)' }} />
              <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4DA3FF]" style={{ left: `${x(c.repos)}%` }} />
              {c.recup && <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#9DFF8A]" style={{ left: `${x(c.recup)}%` }} />}
              <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF4D6D]" style={{ left: `${x(c.effort)}%` }} />
            </div>
            <span className="labo-mono w-16 text-right text-[11px] text-[#DDE2F7]">
              {c.repos}→{c.effort}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 flex flex-wrap gap-3 text-[11px] text-[#8A93B8]">
        <span>
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#4DA3FF]" />
          repos
        </span>
        <span>
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#FF4D6D]" />
          après l’effort
        </span>
        <span>
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#9DFF8A]" />
          après 2 min
        </span>
      </p>
      <p className="mt-2 rounded-xl bg-white/5 p-2 text-[13px] leading-snug text-[#DDE2F7]">
        <Hand size={13} className="mr-1 inline" /> À discuter en classe : les résultats sont-ils tous pareils ? Pourquoi peut-il y avoir des différences (taille, sport pratiqué, effort plus ou moins intense, erreur de comptage) ?
      </p>
    </div>
  )
}
