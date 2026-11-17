import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Camera, Hand, RefreshCw, ScanFace, ShieldCheck, Target, Trophy } from 'lucide-react'
import { DecorLabo } from '../../components/labo/DecorLabo.jsx'
import { Eclat, useRetourSalle } from '../../components/labo/CadreJeu.jsx'
import './labo.css'
import PiedLabo from '../../components/labo/PiedLabo.jsx'

// =============================================================
//  A1 · Le miroir à rayons X
//  La caméra de la tablette détecte le corps de l'élève en direct
//  (MediaPipe Pose, calcul fait DANS la tablette : aucune image
//  n'est enregistrée ni envoyée) et dessine son squelette sur lui.
//  Caméra arrière par défaut : on scanne d'abord sa propre main,
//  puis un copain. Modes : main (os de la main), rayons X
//  (os, articulations, angles, biceps),
//  chasse aux os (toucher l'os demandé sur son propre corps),
//  missions de mouvement (flexion, extension…).
//  Attendus 112, 113, 120, 121.
// =============================================================

const WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm'
const MODELE = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'
const MODELE_MAIN = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

// Missions de la main (21 points MediaPipe : 0 poignet, 1-4 pouce, 5-8 index, 9-12 majeur, 13-16 annulaire, 17-20 auriculaire)
const MISSIONS_MAIN = [
  {
    titre: 'Montre ta main ouverte, doigts bien tendus',
    test: (h) => h.doigtsTendus >= 4,
    bravo: '27 os dans une main !',
    explication: '8 petits os au poignet (les carpes), 5 dans la paume (les métacarpiens) et 14 dans les doigts (les phalanges).',
  },
  {
    titre: 'Plie seulement ton index',
    test: (h) => h.anglesDoigts[0] < 120 && h.anglesDoigts.slice(1).filter((a) => a > 150).length >= 2,
    bravo: 'Les phalanges bougent !',
    explication: 'Chaque doigt a 3 phalanges reliées par des articulations. Le pouce n’en a que 2.',
  },
  {
    titre: 'Fais un poing bien serré',
    test: (h) => h.anglesDoigts.every((a) => a < 110),
    bravo: 'Poing fermé !',
    explication: 'Les muscles qui plient tes doigts sont dans l’avant-bras : ils tirent sur de longs tendons qui vont jusqu’au bout des doigts.',
  },
  {
    titre: 'Touche le bout de ton pouce avec ton petit doigt',
    test: (h) => h.pouceAuriculaire < h.echelle * 0.28,
    bravo: 'Pouce opposable !',
    explication: 'Ton pouce peut toucher chacun de tes doigts : c’est ce qui te permet d’attraper et de tenir les objets.',
  },
]

// Points du corps (numérotation MediaPipe). G = gauche de l'élève, D = droite.
const P = {
  nez: 0, oeilG: 2, oeilD: 5, oreilleG: 7, oreilleD: 8,
  epauleG: 11, epauleD: 12, coudeG: 13, coudeD: 14, poignetG: 15, poignetD: 16,
  indexG: 19, indexD: 20, hancheG: 23, hancheD: 24, genouG: 25, genouD: 26,
  chevilleG: 27, chevilleD: 28, piedG: 31, piedD: 32,
}

const OS_CHASSE = [
  { id: 'crane', nom: 'ton crâne', cible: (c) => [c.tete] },
  { id: 'clavicule', nom: 'une clavicule', cible: (c) => [c.clavG, c.clavD] },
  { id: 'cotes', nom: 'tes côtes', cible: (c) => [c.cotes] },
  { id: 'humerus', nom: 'un humérus', cible: (c) => [c.humG, c.humD], bras: true },
  { id: 'avantbras', nom: 'ton radius ou ton cubitus', cible: (c) => [c.abG, c.abD], bras: true },
  { id: 'bassin', nom: 'ton bassin', cible: (c) => [c.hancheG, c.hancheD] },
  { id: 'femur', nom: 'un fémur', cible: (c) => [c.femG, c.femD] },
  { id: 'rotule', nom: 'une rotule', cible: (c) => [c.genouG, c.genouD] },
  { id: 'tibia', nom: 'un tibia', cible: (c) => [c.tibG, c.tibD] },
]

const MISSIONS = [
  {
    titre: 'Plie un coude à angle droit (90°)',
    test: (m) => [m.angleCoudeG, m.angleCoudeD].some((a) => a > 70 && a < 110),
    bravo: 'Flexion du coude !',
    explication: 'Ton biceps se contracte : il raccourcit et tire sur l’os de l’avant-bras grâce à son tendon.',
  },
  {
    titre: 'Tends un bras bien droit, à l’horizontale',
    test: (m) => m.brasHorizontalTendu,
    bravo: 'Extension du coude !',
    explication: 'Cette fois, c’est le triceps (à l’arrière du bras) qui a tiré, et le biceps s’est relâché.',
  },
  {
    titre: 'Lève les deux bras au-dessus de ta tête',
    test: (m) => m.deuxBrasEnHaut,
    bravo: 'Épaules en action !',
    explication: 'L’épaule est l’articulation la plus mobile de ton corps : elle tourne presque dans tous les sens.',
  },
  {
    titre: 'Pose une main sur ta tête',
    test: (m) => m.mainSurTete,
    bravo: 'Le casque naturel !',
    explication: 'Sous ta main : le crâne. Ses os soudés forment une boîte solide qui protège ton cerveau.',
  },
  {
    titre: 'Plie un genou en levant la jambe',
    test: (m) => [m.angleGenouG, m.angleGenouD].some((a) => a > 0 && a < 120),
    bravo: 'Flexion du genou !',
    explication: 'Les muscles à l’arrière de ta cuisse (les ischio-jambiers) se contractent et tirent sur le tibia.',
  },
  {
    titre: 'Fais une grande étoile avec ton corps',
    test: (m) => m.etoile,
    bravo: 'Étoile du labo !',
    explication: 'Épaules, coudes, hanches, genoux : tes articulations ont toutes travaillé en même temps.',
  },
]

const visible = (p) => p && (p.visibility ?? 1) > 0.5
const v1 = (p) => ({ ...p, visibility: 1 })
const milieu = (a, b, t = 0.5) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, visibility: Math.min(a.visibility ?? 1, b.visibility ?? 1) })
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
function angle(a, b, c) {
  if (!visible(a) || !visible(b) || !visible(c)) return 0
  const v1 = Math.atan2(a.y - b.y, a.x - b.x)
  const v2 = Math.atan2(c.y - b.y, c.x - b.x)
  let d = Math.abs(((v1 - v2) * 180) / Math.PI)
  if (d > 180) d = 360 - d
  return Math.round(d)
}

// ---------- Dessin : os anatomiques (diaphyse fine, têtes renflées en deux lobes) ----------
function os(ctx, a, b, largeur) {
  if (!visible(a) || !visible(b)) return
  const L = dist(a, b) || 1
  const ux = (b.x - a.x) / L
  const uy = (b.y - a.y) / L
  const nx = -uy
  const ny = ux
  const tete = largeur * 0.62
  const corps = largeur * 0.3
  const pt = (s, k) => [a.x + ux * s + nx * k, a.y + uy * s + ny * k]
  ctx.save()
  const g = ctx.createLinearGradient(...pt(0, tete), ...pt(0, -tete))
  g.addColorStop(0, '#FFF9EA')
  g.addColorStop(0.45, '#EADFC2')
  g.addColorStop(1, '#A8966F')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.moveTo(...pt(tete * 0.6, corps * 1.4))
  ctx.quadraticCurveTo(...pt(L / 2, corps * 0.8), ...pt(L - tete * 0.6, corps * 1.4))
  ctx.lineTo(...pt(L - tete * 0.6, -corps * 1.4))
  ctx.quadraticCurveTo(...pt(L / 2, -corps * 0.8), ...pt(tete * 0.6, -corps * 1.4))
  ctx.closePath()
  ctx.fill()
  for (const [s0, sens] of [[0, 1], [L, -1]]) {
    for (const k of [tete * 0.42, -tete * 0.42]) {
      ctx.beginPath()
      ctx.arc(...pt(s0 + sens * tete * 0.15, k), tete * 0.55, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
}

function osDouble(ctx, a, b, largeur) {
  if (!visible(a) || !visible(b)) return
  const L = dist(a, b) || 1
  const nx = (-(b.y - a.y) / L) * largeur * 0.75
  const ny = ((b.x - a.x) / L) * largeur * 0.75
  os(ctx, { x: a.x + nx, y: a.y + ny }, { x: b.x + nx * 0.8, y: b.y + ny * 0.8 }, largeur * 0.62)
  os(ctx, { x: a.x - nx, y: a.y - ny }, { x: b.x - nx * 0.8, y: b.y - ny * 0.8 }, largeur * 0.62)
}

function texte(ctx, t, x, y, couleur = '#E8ECFF', taille = 14) {
  ctx.save()
  ctx.font = `700 ${taille}px "Space Grotesk", system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const w = ctx.measureText(t).width + 14
  ctx.shadowBlur = 0
  ctx.fillStyle = 'rgba(7,11,22,.8)'
  ctx.beginPath()
  ctx.roundRect(x - w / 2, y - taille * 0.85, w, taille * 1.7, 8)
  ctx.fill()
  ctx.fillStyle = couleur
  ctx.fillText(t, x, y + 1)
  ctx.restore()
}

function dessinerMain(ctx, Lm, echelle) {
  const W = Lm[0]
  const axe = { x: Lm[9].x - W.x, y: Lm[9].y - W.y }
  const travers = { x: Lm[5].x - Lm[17].x, y: Lm[5].y - Lm[17].y }
  const e = echelle
  // radius (côté pouce) et cubitus (côté auriculaire) qui arrivent au poignet
  const dirBas = { x: -axe.x / (Math.hypot(axe.x, axe.y) || 1), y: -axe.y / (Math.hypot(axe.x, axe.y) || 1) }
  for (const k of [0.32, -0.32]) {
    const base = { x: W.x + travers.x * k, y: W.y + travers.y * k, visibility: 1 }
    os(ctx, base, { x: base.x + dirBas.x * e * 0.9, y: base.y + dirBas.y * e * 0.9, visibility: 1 }, e * 0.16)
  }
  // 8 carpes en deux rangées
  ctx.save()
  const g = ctx.createRadialGradient(W.x, W.y, 0, W.x, W.y, e * 0.3)
  g.addColorStop(0, '#FFF9EA')
  g.addColorStop(1, '#C9B88E')
  ctx.fillStyle = g
  for (const [t, n] of [[0.1, 4], [0.24, 4]]) {
    for (let i = 0; i < n; i++) {
      const k = (i / (n - 1) - 0.5) * 0.8
      ctx.beginPath()
      ctx.ellipse(W.x + axe.x * t + travers.x * k, W.y + axe.y * t + travers.y * k, e * 0.065, e * 0.055, Math.atan2(axe.y, axe.x), 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
  const v = (p) => ({ ...p, visibility: 1 })
  // pouce : métacarpien + 2 phalanges
  os(ctx, v(Lm[1]), v(Lm[2]), e * 0.11)
  os(ctx, v(Lm[2]), v(Lm[3]), e * 0.09)
  os(ctx, v(Lm[3]), v(milieu(Lm[3], Lm[4], 0.85)), e * 0.08)
  // doigts : métacarpien + 3 phalanges
  for (const [mcp, pip, dip, bout] of [[5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16], [17, 18, 19, 20]]) {
    os(ctx, v(milieu(W, Lm[mcp], 0.32)), v(Lm[mcp]), e * 0.09)
    os(ctx, v(Lm[mcp]), v(Lm[pip]), e * 0.08)
    os(ctx, v(Lm[pip]), v(Lm[dip]), e * 0.07)
    os(ctx, v(Lm[dip]), v(milieu(Lm[dip], Lm[bout], 0.85)), e * 0.06)
  }
}

export default function MiroirView() {
  const retour = useRetourSalle()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const detecteurRef = useRef(null)
  const mainRef = useRef(null)
  const visionRef = useRef(null)
  const fluxRef = useRef(null)
  const rafRef = useRef(0)
  const jeuRef = useRef({ mode: 'main', cible: 0, maintien: 0, mission: 0, score: 0, debut: 0, termine: false })

  const [phase, setPhase] = useState('accueil') // accueil | chargement | jeu | erreur
  const [erreur, setErreur] = useState('')
  const [mode, setMode] = useState('main')
  const [camera, setCamera] = useState('environment')
  const [noms, setNoms] = useState(true)
  const nomsRef = useRef(true)
  nomsRef.current = noms
  const [infos, setInfos] = useState({ corps: false, maintien: 0, cible: 0, mission: 0, score: 0 })
  const [eclat, setEclat] = useState({ message: '', sous: '', cle: 0 })

  function choisirMode(m) {
    setMode(m)
    Object.assign(jeuRef.current, { mode: m, cible: 0, maintien: 0, mission: 0, score: 0, debut: performance.now(), termine: false })
    setInfos((i) => ({ ...i, cible: 0, mission: 0, score: 0, maintien: 0 }))
  }

  async function demarrer(face = camera) {
    setPhase('chargement')
    setErreur('')
    try {
      const flux = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: face }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      fluxRef.current = flux
      const video = videoRef.current
      video.srcObject = flux
      await video.play()

      if (!detecteurRef.current) {
        const { FilesetResolver, PoseLandmarker, HandLandmarker } = await import('@mediapipe/tasks-vision')
        const vision = await FilesetResolver.forVisionTasks(WASM)
        visionRef.current = vision
        const options = (modele, delegate, extra) => ({ baseOptions: { modelAssetPath: modele, delegate }, runningMode: 'VIDEO', ...extra })
        const creer = async (Classe, modele, extra) => {
          try {
            return await Classe.createFromOptions(vision, options(modele, 'GPU', extra))
          } catch {
            return Classe.createFromOptions(vision, options(modele, 'CPU', extra))
          }
        }
        ;[detecteurRef.current, mainRef.current] = await Promise.all([
          creer(PoseLandmarker, MODELE, { numPoses: 1 }),
          creer(HandLandmarker, MODELE_MAIN, { numHands: 2 }),
        ])
      }
      jeuRef.current.debut = performance.now()
      setPhase('jeu')
    } catch (e) {
      console.error(e)
      arreter()
      setErreur(
        e?.name === 'NotAllowedError'
          ? 'La caméra a été refusée. Autorise-la dans les réglages du navigateur, puis réessaie.'
          : 'Impossible de démarrer le miroir sur cet appareil. Essaie avec Safari ou Chrome, sur une tablette ou un ordinateur avec caméra.'
      )
      setPhase('erreur')
    }
  }

  function arreter() {
    cancelAnimationFrame(rafRef.current)
    fluxRef.current?.getTracks().forEach((t) => t.stop())
    fluxRef.current = null
  }

  async function changerCamera() {
    const face = camera === 'environment' ? 'user' : 'environment'
    setCamera(face)
    fluxRef.current?.getTracks().forEach((t) => t.stop())
    try {
      const flux = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: face }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
      fluxRef.current = flux
      videoRef.current.srcObject = flux
      await videoRef.current.play()
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(
    () => () => {
      arreter()
      detecteurRef.current?.close?.()
      mainRef.current?.close?.()
    },
    []
  )

  // Boucle d'analyse et de dessin
  useEffect(() => {
    if (phase !== 'jeu') return
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let derniereVideo = -1
    let points = null
    let mains = []
    let derniereMaj = 0
    let dernierInstant = performance.now()

    function boucle(maintenant) {
      rafRef.current = requestAnimationFrame(boucle)
      const dt = Math.min(100, maintenant - dernierInstant)
      dernierInstant = maintenant
      const W = canvas.clientWidth
      const H = canvas.clientHeight
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      if (canvas.width !== Math.round(W * dpr)) {
        canvas.width = Math.round(W * dpr)
        canvas.height = Math.round(H * dpr)
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const vw = video.videoWidth
      const vh = video.videoHeight
      if (!vw || !vh) return

      const modeMain = jeuRef.current.mode === 'main'
      if (video.currentTime !== derniereVideo) {
        derniereVideo = video.currentTime
        try {
          if (modeMain && mainRef.current) {
            mains = mainRef.current.detectForVideo(video, maintenant).landmarks || []
            points = null
          } else if (detecteurRef.current) {
            points = detecteurRef.current.detectForVideo(video, maintenant).landmarks?.[0] || null
            mains = []
          }
        } catch {
          points = null
          mains = []
        }
      }
      const miroir = videoRef.current?.srcObject?.getVideoTracks?.()[0]?.getSettings?.().facingMode === 'user'

      // Image de la caméra en miroir, façon radio
      const s = Math.max(W / vw, H / vh)
      const dx = (W - vw * s) / 2
      const dy = (H - vh * s) / 2
      ctx.save()
      if (miroir) {
        ctx.translate(W, 0)
        ctx.scale(-1, 1)
      }
      ctx.drawImage(video, dx, dy, vw * s, vh * s)
      ctx.restore()
      // Noir et blanc (mode « saturation », compatible Safari), assombri, teinte bleutée de radio
      ctx.globalCompositeOperation = 'saturation'
      ctx.fillStyle = 'hsl(0,0%,50%)'
      ctx.fillRect(0, 0, W, H)
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = 'rgba(3,10,22,.58)'
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = 'rgba(20,80,120,.22)'
      ctx.fillRect(0, 0, W, H)

      const jeu = jeuRef.current
      const versEcran = (l) => ({ x: miroir ? W - (l.x * vw * s + dx) : l.x * vw * s + dx, y: l.y * vh * s + dy, visibility: l.visibility ?? 1 })

      // ----- Mode main : les 27 os de la main -----
      if (modeMain) {
        let maintienMain = 0
        const mesures = []
        for (const brute of mains) {
          const Lm = brute.map(versEcran)
          const echelle = dist(Lm[0], Lm[9]) * 1.25 || 100
          ctx.save()
          ctx.shadowColor = '#8FF4FF'
          ctx.shadowBlur = 12
          dessinerMain(ctx, Lm, echelle)
          ctx.restore()
          const anglesDoigts = [[5, 6, 8], [9, 10, 12], [13, 14, 16], [17, 18, 20]].map(([a, b, c]) => angle(v1(Lm[a]), v1(Lm[b]), v1(Lm[c])))
          mesures.push({ anglesDoigts, doigtsTendus: anglesDoigts.filter((a) => a > 160).length, pouceAuriculaire: dist(Lm[4], Lm[20]), echelle })
          if (nomsRef.current) {
            texte(ctx, 'phalanges', Lm[11].x, Lm[11].y - echelle * 0.12, '#FFD27A', 12)
            texte(ctx, 'métacarpiens', milieu(Lm[0], Lm[9], 0.62).x, milieu(Lm[0], Lm[9], 0.62).y, '#9DFF8A', 12)
            texte(ctx, 'carpes (poignet)', milieu(Lm[0], Lm[9], 0.17).x, milieu(Lm[0], Lm[9], 0.17).y + echelle * 0.12, '#6FEFFF', 12)
          }
        }
        if (!jeu.termine && mesures.length) {
          const mission = MISSIONS_MAIN[jeu.mission]
          const ok = mesures.some((h) => mission.test(h))
          jeu.maintien = ok ? jeu.maintien + dt : Math.max(0, jeu.maintien - dt * 2)
          maintienMain = Math.min(1, jeu.maintien / 900)
          if (jeu.maintien > 900) {
            jeu.maintien = 0
            jeu.score += 1
            setEclat((x) => ({ message: mission.bravo, sous: mission.explication, cle: x.cle + 1 }))
            if (jeu.mission + 1 >= MISSIONS_MAIN.length) jeu.termine = true
            else jeu.mission += 1
          }
        }
        if (maintenant - derniereMaj > 120) {
          derniereMaj = maintenant
          setInfos({ corps: mains.length > 0, maintien: maintienMain, cible: jeu.cible, mission: jeu.mission, score: jeu.score, termine: jeu.termine })
        }
        return
      }

      if (!points) {
        if (maintenant - derniereMaj > 250) {
          derniereMaj = maintenant
          setInfos((i) => (i.corps ? { ...i, corps: false } : i))
        }
        return
      }

      const pt = (i) => versEcran(points[i])
      const c = {}
      for (const [nom, i] of Object.entries(P)) c[nom] = pt(i)
      const largeurEpaules = dist(c.epauleG, c.epauleD) || 100
      const e = Math.max(6, largeurEpaules * 0.075)
      const cou = milieu(c.epauleG, c.epauleD)
      const bassin = milieu(c.hancheG, c.hancheD)
      c.tete = milieu(c.oreilleG, c.oreilleD)
      c.tete = { ...c.tete, y: c.tete.y - largeurEpaules * 0.12, visibility: c.nez.visibility }
      c.clavG = milieu(cou, c.epauleG)
      c.clavD = milieu(cou, c.epauleD)
      c.cotes = milieu(cou, bassin, 0.35)
      c.humG = milieu(c.epauleG, c.coudeG)
      c.humD = milieu(c.epauleD, c.coudeD)
      c.abG = milieu(c.coudeG, c.poignetG)
      c.abD = milieu(c.coudeD, c.poignetD)
      c.femG = milieu(c.hancheG, c.genouG)
      c.femD = milieu(c.hancheD, c.genouD)
      c.tibG = milieu(c.genouG, c.chevilleG)
      c.tibD = milieu(c.genouD, c.chevilleD)

      // ----- Squelette -----
      ctx.save()
      ctx.strokeStyle = '#EDE6D1'
      ctx.fillStyle = '#EDE6D1'
      ctx.shadowColor = '#8FF4FF'
      ctx.shadowBlur = 14

      // Crâne
      if (visible(c.oreilleG) && visible(c.oreilleD)) {
        const rx = dist(c.oreilleG, c.oreilleD) * 0.62
        ctx.globalAlpha = 0.9
        ctx.lineWidth = e * 0.5
        ctx.beginPath()
        ctx.ellipse(c.tete.x, c.tete.y + rx * 0.15, rx, rx * 1.22, 0, 0, Math.PI * 2)
        ctx.stroke()
        ctx.globalAlpha = 1
        ctx.fillStyle = 'rgba(7,11,22,.9)'
        for (const o of [c.oeilG, c.oeilD]) {
          if (!visible(o)) continue
          ctx.beginPath()
          ctx.ellipse(o.x, o.y, rx * 0.22, rx * 0.18, 0, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.fillStyle = '#EDE6D1'
      }

      // Colonne vertébrale
      if (visible(cou) && visible(bassin)) {
        const haut = { x: cou.x, y: cou.y - largeurEpaules * 0.18 }
        for (let k = 0; k <= 16; k++) {
          const p = milieu(haut, bassin, k / 16)
          const t = e * (0.55 + (k / 16) * 0.5)
          ctx.beginPath()
          ctx.roundRect(p.x - t, p.y - t * 0.38, t * 2, t * 0.76, t * 0.3)
          ctx.fill()
        }
        // Côtes
        ctx.lineWidth = e * 0.32
        ctx.globalAlpha = 0.85
        for (let k = 0; k < 8; k++) {
          const t = 0.1 + k * 0.055
          const p = milieu(cou, bassin, t)
          const demi = largeurEpaules * (0.28 + Math.sin(((k + 1) / 9) * Math.PI) * 0.12)
          for (const sens of [-1, 1]) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.quadraticCurveTo(p.x + sens * demi * 1.1, p.y - e * 0.6, p.x + sens * demi, p.y + largeurEpaules * 0.12)
            ctx.stroke()
          }
        }
        ctx.globalAlpha = 1
      }
      // Clavicules, bras, avant-bras, mains
      os(ctx, cou, c.epauleG, e * 0.55)
      os(ctx, cou, c.epauleD, e * 0.55)
      os(ctx, c.epauleG, c.coudeG, e)
      os(ctx, c.epauleD, c.coudeD, e)
      osDouble(ctx, c.coudeG, c.poignetG, e)
      osDouble(ctx, c.coudeD, c.poignetD, e)
      os(ctx, c.poignetG, c.indexG, e * 0.35)
      os(ctx, c.poignetD, c.indexD, e * 0.35)
      // Bassin
      if (visible(c.hancheG) && visible(c.hancheD)) {
        ctx.globalAlpha = 0.9
        ctx.lineWidth = e * 0.6
        ctx.beginPath()
        ctx.moveTo(c.hancheG.x + (c.hancheG.x - bassin.x) * 0.5, c.hancheG.y - e * 2.5)
        ctx.quadraticCurveTo(bassin.x, bassin.y - e * 4, c.hancheD.x + (c.hancheD.x - bassin.x) * 0.5, c.hancheD.y - e * 2.5)
        ctx.quadraticCurveTo(bassin.x, bassin.y + e * 4, c.hancheG.x + (c.hancheG.x - bassin.x) * 0.5, c.hancheG.y - e * 2.5)
        ctx.stroke()
        ctx.globalAlpha = 1
      }
      // Jambes
      os(ctx, c.hancheG, c.genouG, e * 1.15)
      os(ctx, c.hancheD, c.genouD, e * 1.15)
      osDouble(ctx, c.genouG, c.chevilleG, e * 1.05)
      osDouble(ctx, c.genouD, c.chevilleD, e * 1.05)
      os(ctx, c.chevilleG, c.piedG, e * 0.5)
      os(ctx, c.chevilleD, c.piedD, e * 0.5)
      for (const g of [c.genouG, c.genouD]) {
        if (!visible(g)) continue
        ctx.beginPath()
        ctx.arc(g.x, g.y, e * 0.9, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()

      // ----- Mesures -----
      const m = {
        angleCoudeG: angle(c.epauleG, c.coudeG, c.poignetG),
        angleCoudeD: angle(c.epauleD, c.coudeD, c.poignetD),
        angleGenouG: angle(c.hancheG, c.genouG, c.chevilleG),
        angleGenouD: angle(c.hancheD, c.genouD, c.chevilleD),
      }
      m.brasHorizontalTendu = [
        [m.angleCoudeG, c.epauleG, c.poignetG],
        [m.angleCoudeD, c.epauleD, c.poignetD],
      ].some(([a, ep, po]) => a > 160 && visible(po) && Math.abs(po.y - ep.y) < largeurEpaules * 0.35 && dist(po, ep) > largeurEpaules * 0.9)
      m.deuxBrasEnHaut = visible(c.poignetG) && visible(c.poignetD) && c.poignetG.y < c.nez.y && c.poignetD.y < c.nez.y
      m.mainSurTete = [c.indexG, c.indexD].some((i) => visible(i) && dist(i, c.tete) < largeurEpaules * 0.45 && i.y < c.nez.y + largeurEpaules * 0.1)
      m.etoile =
        visible(c.poignetG) && visible(c.poignetD) && visible(c.chevilleG) && visible(c.chevilleD) &&
        c.poignetG.y < c.epauleG.y && c.poignetD.y < c.epauleD.y &&
        dist(c.poignetG, c.poignetD) > largeurEpaules * 2.6 &&
        dist(c.chevilleG, c.chevilleD) > largeurEpaules * 1.1

      // ----- Mode rayons X : articulations, angles, biceps -----
      if (jeu.mode === 'rayons') {
        const art = [
          ['épaule', c.epauleG], ['épaule', c.epauleD], ['coude', c.coudeG], ['coude', c.coudeD],
          ['poignet', c.poignetG], ['poignet', c.poignetD], ['hanche', c.hancheG], ['hanche', c.hancheD],
          ['genou', c.genouG], ['genou', c.genouD], ['cheville', c.chevilleG], ['cheville', c.chevilleD],
        ]
        for (const [, p] of art) {
          if (!visible(p)) continue
          ctx.save()
          ctx.strokeStyle = '#FFD27A'
          ctx.lineWidth = 3
          ctx.shadowColor = '#FFD27A'
          ctx.shadowBlur = 10
          ctx.beginPath()
          ctx.arc(p.x, p.y, e * 1.25, 0, Math.PI * 2)
          ctx.stroke()
          ctx.restore()
        }
        // Biceps : visible sur l'avant du bras, il gonfle quand le coude se plie
        for (const [ep, co, a] of [[c.epauleG, c.coudeG, m.angleCoudeG], [c.epauleD, c.coudeD, m.angleCoudeD]]) {
          if (!visible(ep) || !visible(co) || !a) continue
          const contraction = Math.max(0, Math.min(1, (165 - a) / 100))
          const mil = milieu(ep, co, 0.55)
          const L = dist(ep, co)
          ctx.save()
          ctx.translate(mil.x, mil.y)
          ctx.rotate(Math.atan2(co.y - ep.y, co.x - ep.x))
          ctx.fillStyle = `rgba(255,${Math.round(110 - contraction * 60)},${Math.round(120 - contraction * 70)},${0.35 + contraction * 0.4})`
          ctx.beginPath()
          ctx.ellipse(0, 0, L * (0.36 - contraction * 0.08), e * (1.1 + contraction * 1.3), 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
          texte(ctx, contraction > 0.35 ? 'biceps contracté' : 'biceps relâché', mil.x, mil.y - e * 3.2, contraction > 0.35 ? '#FF9AA5' : '#B9C1E3', 12)
        }
        for (const [p, a] of [[c.coudeG, m.angleCoudeG], [c.coudeD, m.angleCoudeD], [c.genouG, m.angleGenouG], [c.genouD, m.angleGenouD]]) {
          if (!visible(p) || !a) continue
          texte(ctx, `${a}°`, p.x, p.y + e * 3, '#FFD27A', 15)
        }
      }

      // ----- Mode chasse aux os -----
      let maintienAffiche = 0
      if (jeu.mode === 'chasse' && !jeu.termine) {
        const osCible = OS_CHASSE[jeu.cible]
        const cibles = osCible.cible(c).filter(visible)
        const doigts = [
          { p: c.indexG, bras: [c.humG, c.abG] },
          { p: c.indexD, bras: [c.humD, c.abD] },
        ].filter((d) => visible(d.p))
        const seuil = largeurEpaules * 0.32
        const touche = doigts.some((d) =>
          cibles.some((ci) => dist(d.p, ci) < seuil && !(osCible.bras && d.bras.some((b) => b === ci)))
        )
        jeu.maintien = touche ? jeu.maintien + dt : Math.max(0, jeu.maintien - dt * 2)
        maintienAffiche = Math.min(1, jeu.maintien / 900)
        for (const ci of cibles) {
          ctx.save()
          ctx.strokeStyle = touche ? '#9DFF8A' : '#6FEFFF'
          ctx.setLineDash([6, 6])
          ctx.lineWidth = 2
          ctx.globalAlpha = 0.35
          ctx.beginPath()
          ctx.arc(ci.x, ci.y, seuil, 0, Math.PI * 2)
          ctx.stroke()
          ctx.restore()
        }
        if (jeu.maintien > 900) {
          jeu.score += 1
          jeu.maintien = 0
          const nom = osCible.nom
          setEclat((x) => ({ message: 'Trouvé !', sous: `C’était bien ${nom}.`, cle: x.cle + 1 }))
          if (jeu.cible + 1 >= OS_CHASSE.length) {
            jeu.termine = true
            jeu.temps = Math.round((maintenant - jeu.debut) / 1000)
          } else jeu.cible += 1
        }
      }

      // ----- Mode missions -----
      if (jeu.mode === 'missions' && !jeu.termine) {
        const mission = MISSIONS[jeu.mission]
        const ok = mission.test(m)
        jeu.maintien = ok ? jeu.maintien + dt : Math.max(0, jeu.maintien - dt * 2)
        maintienAffiche = Math.min(1, jeu.maintien / 1000)
        if (jeu.maintien > 1000) {
          jeu.maintien = 0
          jeu.score += 1
          setEclat((x) => ({ message: mission.bravo, sous: mission.explication, cle: x.cle + 1 }))
          if (jeu.mission + 1 >= MISSIONS.length) jeu.termine = true
          else jeu.mission += 1
        }
      }

      if (maintenant - derniereMaj > 120) {
        derniereMaj = maintenant
        setInfos({ corps: true, maintien: maintienAffiche, cible: jeu.cible, mission: jeu.mission, score: jeu.score, termine: jeu.termine, temps: jeu.temps })
      }
    }
    rafRef.current = requestAnimationFrame(boucle)
    return () => cancelAnimationFrame(rafRef.current)
  }, [phase])

  // ---------- Écrans ----------
  const video = <video key="camera" ref={videoRef} playsInline muted autoPlay className="pointer-events-none fixed left-0 top-0 h-px w-px opacity-0" />

  if (phase !== 'jeu') {
    return (
      <>
      {video}
      <div className="labo relative min-h-[100dvh] overflow-hidden">
        <DecorLabo flash={false} />
        <div className="relative mx-auto flex min-h-[100dvh] max-w-xl flex-col gap-5 px-5 pb-10 pt-[max(16px,env(safe-area-inset-top))]">
          <header className="flex items-center gap-3">
            <Link to={retour} aria-label="Retour au labo" className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15">
              <ArrowLeft size={20} strokeWidth={2.5} />
            </Link>
            <div>
              <p className="labo-mono text-[11px] tracking-[.1em] text-[#6FEFFF]">PAILLASSE A1 · ATTENDUS 112, 113, 120, 121</p>
              <h1 className="labo-titre text-xl font-bold">Le miroir à rayons X</h1>
            </div>
          </header>

          <div className="relative mx-auto mt-4 flex h-48 w-48 items-center justify-center">
            <span className="labo-pulse absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle, rgba(111,239,255,.35), transparent 65%)' }} />
            <ScanFace size={110} strokeWidth={1.2} className="relative text-[#6FEFFF]" />
          </div>

          <div className="text-center">
            <h2 className="labo-titre text-2xl font-black text-[#F4F6FF]">Passe-toi aux rayons X</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#B9C1E3]">
              Pointe la caméra arrière vers ta main : ses 27 os apparaissent dessus, en direct. Ensuite, scanne un copain debout à
              2 mètres : son squelette, ses articulations et son biceps bougent avec lui.
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-[#9DFF8A]/30 bg-[#9DFF8A]/10 p-3 text-sm text-[#DDF8D6]">
            <ShieldCheck size={20} className="mt-0.5 flex-none text-[#9DFF8A]" />
            <p>Tout est calculé dans la tablette : aucune image n’est enregistrée, ni envoyée sur internet.</p>
          </div>

          {phase === 'erreur' && <p className="rounded-2xl border border-[#FF8A95]/40 bg-[#FF8A95]/10 p-3 text-sm text-[#FFD0D5]">{erreur}</p>}

          <button
            type="button"
            onClick={() => demarrer()}
            disabled={phase === 'chargement'}
            className="labo-titre flex h-14 items-center justify-center gap-3 rounded-2xl bg-[#6FEFFF] text-base font-bold text-[#04232A] active:scale-[.98] disabled:opacity-60"
          >
            <Camera size={22} />
            {phase === 'chargement' ? 'Allumage du scanner…' : 'Allumer le miroir'}
          </button>
          <PiedLabo />
        </div>
      </div>
      </>
    )
  }

  const osCible = OS_CHASSE[infos.cible] || OS_CHASSE[0]
  const listeMissions = mode === 'main' ? MISSIONS_MAIN : MISSIONS
  const mission = listeMissions[infos.mission] || listeMissions[0]

  return (
    <>
    {video}
    <div className="labo fixed inset-0 overflow-hidden bg-black">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <span className="labo-scan opacity-40" style={{ background: '#8FF4FF' }} />
      <Eclat message={eclat.message} sousTitre={eclat.sous} cle={eclat.cle} couleur="#6FEFFF" />

      <div className="absolute inset-x-0 top-0 flex items-center gap-3 px-4 pt-[max(12px,env(safe-area-inset-top))]">
        <Link
          to={retour}
          onClick={arreter}
          aria-label="Quitter le miroir"
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-black/50 backdrop-blur"
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
        </Link>
        <p className="labo-titre flex-1 text-lg font-bold drop-shadow">Miroir à rayons X</p>
        <button
          type="button"
          onClick={changerCamera}
          aria-label="Changer de caméra"
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-black/50 backdrop-blur"
        >
          <RefreshCw size={18} />
        </button>
        {mode !== 'rayons' && (
          <span className="labo-mono flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-sm text-[#FFD27A]">
            <Trophy size={14} /> {infos.score}
          </span>
        )}
      </div>

      {!infos.corps && (
        <div className="absolute inset-x-6 top-1/3 rounded-2xl bg-black/70 p-4 text-center text-[#E8ECFF] backdrop-blur">
          {mode === 'main'
            ? 'Montre ta main à la caméra, bien à plat, à 30 cm environ.'
            : 'Je ne vois personne… le copain doit reculer pour être vu en entier, face à la caméra.'}
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 px-4 pb-[max(14px,env(safe-area-inset-bottom))]">
        {mode !== 'rayons' && (
          <div className="rounded-2xl border border-white/15 bg-black/65 p-3 backdrop-blur">
            {infos.termine ? (
              <div className="flex items-center justify-between gap-3">
                <p className="labo-titre text-base font-bold text-[#9DFF8A]">
                  {mode === 'chasse' ? `Tous les os trouvés en ${infos.temps} s !` : 'Toutes les missions réussies !'}
                </p>
                <button type="button" onClick={() => choisirMode(mode)} className="rounded-xl bg-[#6FEFFF] px-4 py-2 font-bold text-[#04232A]">
                  Rejouer
                </button>
              </div>
            ) : (
              <>
                <p className="labo-mono text-[11px] text-[#6FEFFF]">
                  {mode === 'chasse' ? `OS ${infos.cible + 1} / ${OS_CHASSE.length}` : `MISSION ${infos.mission + 1} / ${listeMissions.length}`}
                </p>
                <p className="labo-titre mt-0.5 text-lg font-bold text-white">
                  {mode === 'chasse' ? (
                    <>
                      <Target size={18} className="mr-1.5 inline text-[#FFD27A]" />
                      Le copain touche {osCible.nom} avec son doigt
                    </>
                  ) : (
                    mission.titre
                  )}
                </p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full rounded-full bg-[#9DFF8A] transition-[width] duration-100" style={{ width: `${Math.round(infos.maintien * 100)}%` }} />
                </div>
              </>
            )}
          </div>
        )}
        {mode === 'main' && (
          <button type="button" onClick={() => setNoms((n) => !n)} className="self-start rounded-xl border border-white/20 bg-black/55 px-3 py-2 text-xs font-bold text-white backdrop-blur">
            {noms ? 'Masquer les noms des os' : 'Afficher les noms des os'}
          </button>
        )}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            ['main', 'Ma main'],
            ['rayons', 'Corps'],
            ['chasse', 'Chasse'],
            ['missions', 'Missions'],
          ].map(([id, nom]) => (
            <button
              key={id}
              type="button"
              onClick={() => choisirMode(id)}
              className={`flex h-12 items-center justify-center gap-1 rounded-2xl text-[13px] font-bold backdrop-blur ${mode === id ? 'bg-[#6FEFFF] text-[#04232A]' : 'border border-white/20 bg-black/55 text-white'}`}
            >
              {id === 'main' && <Hand size={14} />}
              {nom}
            </button>
          ))}
        </div>
      </div>
    </div>
    </>
  )
}
