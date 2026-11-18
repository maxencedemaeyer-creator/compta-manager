import { useEffect, useMemo, useRef, useState } from 'react'
import { Camera, Check, Delete, Download, ImagePlus, Languages, Lightbulb, RefreshCw, RotateCcw, ShieldCheck, Tags, Volume2 } from 'lucide-react'
import CadreJeu, { Bouton, Carte, Duo, Eclat, melanger } from '../../components/labo/CadreJeu.jsx'
import { COULEUR_GENRE, LANGUES, MOTS, avecArticle, parler, zones } from '../../components/labo/vocabulaire/corps.js'
import { creerPose, messageErreurCamera, ouvrirCamera } from '../../components/labo/vocabulaire/pose.js'
import PlateauCorps from '../../components/labo/vocabulaire/PlateauCorps.jsx'
import { cadreDe } from '../../components/labo/vocabulaire/zonesCorps.js'

// =============================================================
//  A13 · L'étiqueteuse (écrire les mots du corps, élèves allophones)
//  Jacques, le VRAI squelette 3D (os de BodyParts3D), a perdu ses
//  étiquettes. Une partie s'allume (la caméra zoome dessus) : l'élève
//  écrit son nom ; chaque mot juste sort de l'étiqueteuse et se colle
//  sur Jacques. À la fin, l'affiche « le corps » est prête à imprimer.
//  Option : le faire avec une photo de soi (ou d'un copain).
//  Niveaux : 1 lettres à toucher · 2 clavier · 3 dictée (on écoute, on écrit).
//  La photo reste sur la tablette : rien n'est enregistré ni envoyé.
// =============================================================
const ORANGE = '#FFB86B'
const MAX_MOTS = 10
let premierMot = null // premier mot de la partie précédente (module : dure toute la séance)
const NIVEAUX = [
  { n: 1, titre: 'Les lettres', texte: 'Touche les lettres dans le bon ordre' },
  { n: 2, titre: 'Le clavier', texte: 'Écris le mot tout seul' },
  { n: 3, titre: 'La dictée', texte: 'Écoute le mot, écris-le, puis découvre où il va' },
]
const ACCENTS = ['é', 'è', 'ê', 'à', 'ç', 'ï', 'û']
const sansAccent = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '')

// Étiquette façon « étiqueteuse » (ruban de couleur, lettres en relief)
function dymo(ctx, x, y, texte, couleur, taille = 15) {
  ctx.save()
  ctx.font = `900 ${taille}px "JetBrains Mono", ui-monospace, monospace`
  const t = texte.toUpperCase()
  const w = ctx.measureText(t).width + taille * 1.4
  const h = taille * 1.9
  const bx = x - w / 2
  const by = y - h / 2
  ctx.shadowColor = 'rgba(0,0,0,.55)'
  ctx.shadowBlur = 7
  ctx.shadowOffsetY = 3
  ctx.fillStyle = couleur
  ctx.beginPath()
  ctx.moveTo(bx, by)
  ctx.lineTo(bx + w, by)
  ctx.lineTo(bx + w - 5, by + h / 2)
  ctx.lineTo(bx + w, by + h)
  ctx.lineTo(bx, by + h)
  ctx.lineTo(bx + 5, by + h / 2)
  ctx.closePath()
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.fillStyle = 'rgba(255,255,255,.22)'
  ctx.fillRect(bx + 4, by + 2, w - 8, 2)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = 'rgba(0,0,0,.35)'
  ctx.fillText(t, x + 1, y + 2)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillText(t, x, y + 1)
  ctx.restore()
  return { x: bx, y: by, w, h }
}

export default function EtiqueteuseView() {
  const [phase, setPhase] = useState('accueil') // accueil | camera | analyse | jeu | fin | erreur
  const [mode, setMode] = useState('os') // os : le vrai squelette · photo : ma photo
  const capturerRef = useRef(null)
  const [niveau, setNiveau] = useState(1)
  const [langue, setLangue] = useState('')
  const [erreur, setErreur] = useState('')
  const [face, setFace] = useState('user')
  const [compte, setCompte] = useState(0)
  const [image, setImage] = useState(null) // canvas de la photo
  const [points, setPoints] = useState(null) // 33 points en pixels de la photo
  const [liste, setListe] = useState([])
  const [n, setN] = useState(0)
  const [faits, setFaits] = useState([]) // { id, juste }
  const [saisie, setSaisie] = useState('')
  const [tuiles, setTuiles] = useState([])
  const [essais, setEssais] = useState([]) // tentatives au clavier (niveaux 2-3)
  const [secoue, setSecoue] = useState(null)
  const [indices, setIndices] = useState(0)
  const [eclat, setEclat] = useState({ message: '', sous: '', cle: 0 })
  const [revele, setRevele] = useState(false)
  const videoRef = useRef(null)
  const fluxRef = useRef(null)
  const canvasRef = useRef(null)
  const poseRef = useRef(null)
  const fichierRef = useRef(null)

  const mot = liste[n]
  const trad = langue && mot?.tr[langue]
  const sensLangue = LANGUES.find((l) => l.id === langue)?.dir

  useEffect(
    () => () => {
      fluxRef.current?.getTracks().forEach((t) => t.stop())
      poseRef.current?.close?.()
      window.speechSynthesis?.cancel?.()
    },
    [],
  )

  // ---------- Photo ----------
  async function ouvrir(f = face) {
    parler('Prends la pose !')
    setPhase('camera')
    try {
      fluxRef.current?.getTracks().forEach((t) => t.stop())
      const flux = await ouvrirCamera(f)
      fluxRef.current = flux
      for (let i = 0; i < 20 && !videoRef.current; i++) await new Promise((r) => setTimeout(r, 50))
      videoRef.current.srcObject = flux
      await videoRef.current.play()
    } catch (e) {
      console.error(e)
      setErreur(messageErreurCamera(e))
      setPhase('erreur')
    }
  }

  function declencher() {
    let c = 3
    setCompte(c)
    const id = setInterval(() => {
      c -= 1
      setCompte(c)
      if (c <= 0) {
        clearInterval(id)
        const v = videoRef.current
        const cv = document.createElement('canvas')
        cv.width = v.videoWidth
        cv.height = v.videoHeight
        const ctx = cv.getContext('2d')
        if (face === 'user') {
          ctx.translate(cv.width, 0)
          ctx.scale(-1, 1)
        }
        ctx.drawImage(v, 0, 0)
        fluxRef.current?.getTracks().forEach((t) => t.stop())
        analyser(cv)
      }
    }, 1000)
  }

  function importer(e) {
    const f = e.target.files?.[0]
    if (!f) return
    const img = new Image()
    img.onload = () => {
      const k = Math.min(1, 1600 / Math.max(img.width, img.height))
      const cv = document.createElement('canvas')
      cv.width = Math.round(img.width * k)
      cv.height = Math.round(img.height * k)
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height)
      URL.revokeObjectURL(img.src)
      analyser(cv)
    }
    img.src = URL.createObjectURL(f)
    e.target.value = ''
  }

  async function analyser(cv) {
    setPhase('analyse')
    try {
      if (!poseRef.current) poseRef.current = await creerPose('IMAGE')
      const r = poseRef.current.detect(cv)
      const brut = r.landmarks?.[0]
      if (!brut) {
        setErreur('Je ne vois personne sur la photo. Recule un peu, mets-toi bien en face et recommence.')
        setPhase('erreur')
        return
      }
      const L = brut.map((l) => ({ x: l.x * cv.width, y: l.y * cv.height, visibility: l.visibility ?? 1 }))
      const z = zones(L)
      const possibles = MOTS.filter((m) => (z[m.id] || []).length)
      setMode('photo')
      setImage(cv)
      setPoints(L)
      commencer(possibles)
    } catch (e) {
      console.error(e)
      setErreur('Impossible d’analyser la photo sur cet appareil.')
      setPhase('erreur')
    }
  }

  function jouerSquelette() {
    setMode('os')
    setImage(null)
    setPoints(null)
    commencer(MOTS)
  }

  function commencer(possibles) {
    // ordre différent à chaque partie, et premier mot différent de celui de la partie précédente
    const l = melanger(possibles)
    if (l.length > 1 && l[0].id === premierMot) l.push(l.shift())
    premierMot = l[0].id
    l.splice(MAX_MOTS)
    setListe(l)
    setFaits([])
    preparer(l, 0)
    setPhase('jeu')
  }

  function preparer(l, i) {
    const m = l[i]
    setN(i)
    setSaisie('')
    setEssais([])
    setIndices(0)
    setRevele(niveau < 3)
    if (!m) return
    const lettres = [...m.mot]
    const leurres = melanger([...'abcdefgilmnoprstu'].filter((x) => !lettres.includes(x))).slice(0, 2)
    setTuiles(melanger([...lettres, ...leurres]).map((c, k) => ({ c, k, utilisee: false })))
    setTimeout(() => parler(niveau === 3 ? avecArticle(m) : `Comment s’appelle cette partie du corps ?`), 300)
  }

  function reussir(juste) {
    const m = mot
    setFaits((f) => [...f, { id: m.id, juste }])
    setRevele(true)
    parler(avecArticle(m))
    setEclat((e) => ({ message: juste ? 'Parfait !' : 'Presque !', sous: avecArticle(m), cle: e.cle + 1 }))
    setTimeout(() => {
      if (n + 1 >= liste.length) {
        setPhase('fin')
        parler('Bravo ! Ton affiche est prête.')
      } else preparer(liste, n + 1)
    }, 1700)
  }

  // ---------- Niveau 1 : tuiles ----------
  function toucherTuile(t) {
    if (t.utilisee || !mot) return
    const attendu = mot.mot[saisie.length]
    if (t.c === attendu) {
      const s = saisie + t.c
      setSaisie(s)
      setTuiles((l) => l.map((x) => (x.k === t.k ? { ...x, utilisee: true } : x)))
      if (s === mot.mot) reussir(indices === 0)
    } else {
      setSecoue(t.k)
      setIndices((x) => x + 0.5)
      setTimeout(() => setSecoue(null), 450)
    }
  }

  // ---------- Niveaux 2 et 3 : clavier ----------
  function valider() {
    const essai = saisie.trim().toLowerCase().replace(/^(le|la|les|l['’])\s*/, '')
    if (!essai || !mot) return
    if (essai === mot.mot) return reussir(essais.length === 0 && indices === 0)
    if (sansAccent(essai) === sansAccent(mot.mot)) {
      setEssais((l) => [...l, essai])
      setEclat((e) => ({ message: 'Attention aux accents !', sous: `On écrit : ${mot.mot}`, cle: e.cle + 1 }))
      setTimeout(() => reussir(false), 600)
      return
    }
    setEssais((l) => [...l, essai])
    setSaisie('')
    if (essais.length + 1 >= 3) {
      setEclat((e) => ({ message: 'Regarde bien', sous: avecArticle(mot), cle: e.cle + 1 }))
      setTimeout(() => reussir(false), 900)
    }
  }

  // ---------- Dessin de la photo + étiquettes ----------
  const placement = useMemo(() => {
    if (!points || !image) return {}
    const z = zones(points)
    const centre = (points[11].x + points[12].x) / 2
    const r = {}
    for (const m of MOTS) {
      const p = z[m.id]?.[0]
      if (p) r[m.id] = { p, cote: p.x < centre ? -1 : 1 }
    }
    return r
  }, [points, image])

  useEffect(() => {
    if (!image || !canvasRef.current || !['jeu', 'fin'].includes(phase)) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let raf = 0
    const dessiner = (t) => {
      raf = requestAnimationFrame(dessiner)
      const W = canvas.clientWidth
      const H = canvas.clientHeight
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      if (canvas.width !== Math.round(W * dpr)) {
        canvas.width = Math.round(W * dpr)
        canvas.height = Math.round(H * dpr)
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.fillStyle = '#070B16'
      ctx.fillRect(0, 0, W, H)
      const k = Math.min(W / image.width, H / image.height)
      const ox = (W - image.width * k) / 2
      const oy = (H - image.height * k) / 2
      ctx.drawImage(image, ox, oy, image.width * k, image.height * k)
      const ecran = (p) => ({ x: ox + p.x * k, y: oy + p.y * k })
      // étiquettes déjà gagnées
      const boites = []
      for (const f of faits) {
        const pl = placement[f.id]
        const m = MOTS.find((x) => x.id === f.id)
        if (!pl) continue
        const a = ecran(pl.p)
        let x = Math.max(60, Math.min(W - 60, a.x + pl.cote * 85))
        let y = a.y
        for (const b of boites) if (Math.abs(b.y - y) < 30 && Math.abs(b.x - x) < 120) y = b.y + 32
        ctx.save()
        ctx.strokeStyle = COULEUR_GENRE[m.genre]
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(x, y)
        ctx.stroke()
        ctx.fillStyle = COULEUR_GENRE[m.genre]
        ctx.beginPath()
        ctx.arc(a.x, a.y, 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
        dymo(ctx, x, y, avecArticle(m), m.genre === 'f' ? '#C2297A' : m.genre === 'pl' ? '#2E8B3E' : '#1F5FBF', 14)
        boites.push({ x, y })
      }
      // la partie à nommer clignote
      if (phase === 'jeu' && mot && revele && !faits.some((f) => f.id === mot.id)) {
        const pl = placement[mot.id]
        if (pl) {
          const a = ecran(pl.p)
          const puls = 0.5 + 0.5 * Math.sin(t / 220)
          ctx.save()
          ctx.strokeStyle = '#FFE45E'
          ctx.shadowColor = '#FFE45E'
          ctx.shadowBlur = 16
          ctx.lineWidth = 5
          ctx.beginPath()
          ctx.arc(a.x, a.y, 22 + puls * 10, 0, Math.PI * 2)
          ctx.stroke()
          ctx.fillStyle = '#FFE45E'
          ctx.beginPath()
          ctx.arc(a.x, a.y, 6, 0, Math.PI * 2)
          ctx.fill()
          // flèche
          const fx = a.x + pl.cote * 70
          ctx.lineWidth = 4
          ctx.beginPath()
          ctx.moveTo(fx, a.y - 40)
          ctx.lineTo(a.x + pl.cote * 30, a.y - 12)
          ctx.stroke()
          ctx.restore()
        }
      }
    }
    raf = requestAnimationFrame(dessiner)
    return () => cancelAnimationFrame(raf)
  }, [image, phase, faits, mot, revele, placement])

  function telecharger() {
    const cible = mode === 'os' ? capturerRef.current?.() : canvasRef.current
    cible?.toBlob((b) => {
      if (!b) return
      const a = document.createElement('a')
      a.href = URL.createObjectURL(b)
      a.download = mode === 'os' ? 'le-corps-etiquete.png' : 'mon-corps.png'
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 2000)
    })
  }

  const score = faits.filter((f) => f.juste).length

  // ---------- Écrans ----------
  if (phase === 'accueil' || phase === 'erreur')
    return (
      <CadreJeu code="A13" titre="L’étiqueteuse" couleur={ORANGE} large ecran>
        <Carte couleur={`${ORANGE}66`}>
          <p className="text-[15px] leading-snug text-[#DDE2F7]">
            <b>Jacques</b>, le squelette, a perdu ses étiquettes ! Une partie de son corps s’allume : <b>écris son nom</b>. Chaque mot juste sort de l’étiqueteuse et se colle sur Jacques. À la fin, l’affiche est prête&nbsp;!
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[#9DFF8A]">
            <ShieldCheck size={14} /> Rien n’est enregistré ni envoyé.
          </p>
        </Carte>
        <div className="grid gap-2 sm:grid-cols-3">
          {NIVEAUX.map((x) => (
            <button
              key={x.n}
              type="button"
              onClick={() => setNiveau(x.n)}
              className="rounded-2xl border-2 p-3 text-left"
              style={{ borderColor: niveau === x.n ? ORANGE : 'rgba(255,255,255,.12)', background: niveau === x.n ? 'rgba(255,184,107,.1)' : 'rgba(18,26,48,.85)' }}
            >
              <p className="labo-mono text-[11px]" style={{ color: ORANGE }}>
                NIVEAU {x.n}
              </p>
              <p className="labo-titre text-base font-bold text-white">{x.titre}</p>
              <p className="mt-0.5 text-[12px] leading-snug text-[#B9C1E3]">{x.texte}</p>
            </button>
          ))}
        </div>
        {phase === 'erreur' && <p className="rounded-xl bg-[#FF6B7A]/15 px-3 py-2 text-[14px] text-[#FFC2C8]">{erreur}</p>}
        <Bouton couleur={ORANGE} onClick={jouerSquelette}>
          <Tags size={18} /> Jouer avec Jacques le squelette
        </Bouton>
        <div className="flex flex-col gap-3 tab:grid tab:grid-cols-2">
        <Carte couleur="rgba(255,255,255,.15)">
          <p className="flex items-center gap-1.5 text-[13px] font-bold text-[#E8ECFF]">
            <Languages size={15} /> Aide dans ma langue
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {LANGUES.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setLangue(l.id)}
                className="min-h-[40px] rounded-full border px-3 text-[14px] font-bold"
                style={langue === l.id ? { background: ORANGE, color: '#1A0E00', borderColor: ORANGE } : { borderColor: 'rgba(255,255,255,.18)', color: '#DDE2F7' }}
              >
                {l.nom}
              </button>
            ))}
          </div>
        </Carte>
        <Carte couleur="rgba(255,255,255,.12)">
          <p className="text-[13px] font-bold text-[#E8ECFF]">Ou avec une vraie photo de toi (ou d’un copain)</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <Bouton variante="secondaire" onClick={() => ouvrir()}>
              <Camera size={18} /> Prendre la photo
            </Bouton>
            <Bouton variante="secondaire" onClick={() => fichierRef.current?.click()}>
              <ImagePlus size={18} /> Choisir une photo
            </Bouton>
          </div>
          <p className="mt-2 text-[12px] text-[#8A93B8]">Conseil : debout, en entier sur la photo, bras un peu écartés. La photo reste sur la tablette.</p>
        </Carte>
        </div>
        <input ref={fichierRef} type="file" accept="image/*" className="hidden" onChange={importer} />
      </CadreJeu>
    )

  if (phase === 'camera' || phase === 'analyse')
    return (
      <CadreJeu code="A13" titre="L’étiqueteuse" couleur={ORANGE} large>
        <div className="relative">
          <video ref={videoRef} playsInline muted className="block h-[68dvh] w-full rounded-3xl border border-[#FFB86B]/40 bg-black object-cover" style={face === 'user' ? { transform: 'scaleX(-1)' } : undefined} />
          {compte > 0 && <p className="labo-titre absolute inset-0 flex items-center justify-center text-[120px] font-black text-white drop-shadow-[0_0_20px_#FFB86B]">{compte}</p>}
          {phase === 'analyse' && <p className="absolute inset-0 flex items-center justify-center rounded-3xl bg-black/60 text-[16px] font-bold text-[#FFB86B]">La machine repère ton corps…</p>}
        </div>
        {phase === 'camera' && (
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Bouton couleur={ORANGE} onClick={declencher} disabled={compte > 0}>
              <Camera size={18} /> Clic ! (3 secondes)
            </Bouton>
            <button
              type="button"
              aria-label="Changer de caméra"
              onClick={() => {
                const f = face === 'user' ? 'environment' : 'user'
                setFace(f)
                ouvrir(f)
              }}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 text-white"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        )}
      </CadreJeu>
    )

  const essaiColore = (essai) =>
    [...essai].map((c, i) => (
      <span key={i} className="inline-block min-w-[1.1em] rounded px-0.5 text-center" style={{ background: c === mot.mot[i] ? 'rgba(157,255,138,.25)' : mot.mot.includes(c) ? 'rgba(255,228,94,.22)' : 'rgba(255,107,122,.2)', color: '#FFF' }}>
        {c}
      </span>
    ))

  return (
    <CadreJeu
      code="A13"
      titre="L’étiqueteuse"
      couleur={ORANGE}
      large
      ecran
      droite={
        <span className="labo-mono rounded-full bg-white/10 px-3 py-1 text-sm text-[#FFE45E]">
          {faits.length}/{liste.length}
        </span>
      }
    >
      <Eclat message={eclat.message} sousTitre={eclat.sous} cle={eclat.cle} couleur={ORANGE} />
      <Duo
        commandes={
          <>
        {phase === 'fin' ? (
          <Carte couleur={`${ORANGE}88`} className="text-center">
            <p className="labo-titre text-3xl font-black text-white">
              {score}/{liste.length}
            </p>
            <p className="text-[14px] text-[#B9C1E3]">mots écrits du premier coup</p>
            <div className="mt-3 grid gap-2">
              <Bouton couleur={ORANGE} onClick={telecharger}>
                <Download size={18} /> Enregistrer mon affiche
              </Bouton>
              <Bouton
                variante="secondaire"
                onClick={() => {
                  if (mode === 'os') return jouerSquelette()
                  const z = zones(points)
                  commencer(MOTS.filter((m) => (z[m.id] || []).length))
                }}
              >
                <RotateCcw size={18} /> {mode === 'os' ? 'Rejouer avec d’autres mots' : 'Rejouer avec cette photo'}
              </Bouton>
              <Bouton variante="secondaire" onClick={() => setPhase('accueil')}>
                <Camera size={18} /> {mode === 'os' ? 'Changer de niveau' : 'Nouvelle photo'}
              </Bouton>
            </div>
          </Carte>
        ) : (
          mot && (
            <Carte couleur={`${ORANGE}66`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[14px] text-[#B9C1E3]">{niveau === 3 && !revele ? 'Écoute et écris le mot :' : 'Comment s’appelle la partie qui brille ?'}</p>
                <button type="button" aria-label="Écouter le mot" onClick={() => parler(niveau === 3 || indices >= 1 ? avecArticle(mot) : 'Comment s’appelle cette partie du corps ?')} className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#FFB86B] text-[#1A0E00]">
                  <Volume2 size={18} />
                </button>
              </div>
              {trad && (
                <p dir={sensLangue} className="mt-1 text-center text-lg font-bold text-white">
                  {trad}
                </p>
              )}

              {/* le mot à construire */}
              <div className="mt-3 flex flex-wrap items-end justify-center gap-1.5">
                <span className="labo-lettres mr-1 text-[28px]" style={{ color: COULEUR_GENRE[mot.genre] }}>
                  {mot.article}
                </span>
                {niveau === 1
                  ? [...mot.mot].map((c, i) => (
                      <span key={i} className="labo-lettres flex h-11 w-9 items-center justify-center rounded-lg border-b-4 text-[28px] text-white" style={{ borderColor: i < saisie.length ? '#9DFF8A' : 'rgba(255,255,255,.3)', background: 'rgba(7,11,22,.6)' }}>
                        {saisie[i] ?? ''}
                      </span>
                    ))
                  : null}
              </div>

              {niveau === 1 ? (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {tuiles.map((t) => (
                    <button
                      key={t.k}
                      type="button"
                      disabled={t.utilisee}
                      onClick={() => toucherTuile(t)}
                      className={`labo-lettres h-14 w-12 rounded-xl text-[30px] leading-none shadow-[0_4px_0_#7A4A12] transition active:translate-y-1 active:shadow-none disabled:opacity-0 ${secoue === t.k ? 'animate-[elec-sonne_.09s_linear_4]' : ''}`}
                      style={{ background: secoue === t.k ? '#FF6B7A' : '#FFD9A8', color: '#2A1600' }}
                    >
                      {t.c}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-3">
                  <input
                    value={saisie}
                    onChange={(e) => setSaisie(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && valider()}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoComplete="off"
                    placeholder="écris ici…"
                    className="labo-lettres h-14 w-full rounded-2xl border-2 border-[#FFB86B]/50 bg-[#070B16] px-4 text-center text-[28px] text-white outline-none focus:border-[#FFB86B]"
                  />
                  <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                    {ACCENTS.map((a) => (
                      <button key={a} type="button" onClick={() => setSaisie((s) => s + a)} className="labo-lettres h-10 w-10 rounded-xl bg-white/10 text-[22px] text-white">
                        {a}
                      </button>
                    ))}
                    <button type="button" aria-label="Effacer" onClick={() => setSaisie((s) => s.slice(0, -1))} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                      <Delete size={18} />
                    </button>
                  </div>
                  {essais.map((e, i) => (
                    <p key={i} className="labo-lettres mt-2 text-center text-[26px] tracking-wider">
                      {essaiColore(e)}
                    </p>
                  ))}
                  {essais.length > 0 && <p className="mt-1 text-center text-[11px] text-[#8A93B8]">vert : bonne place · jaune : dans le mot · rouge : pas dans le mot</p>}
                  <Bouton className="mt-3 w-full" couleur={ORANGE} onClick={valider}>
                    <Check size={18} /> Valider
                  </Bouton>
                </div>
              )}

              {/* indices */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                {indices < 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIndices(1)
                      parler(avecArticle(mot))
                    }}
                    className="flex items-center gap-1 text-[13px] font-bold"
                    style={{ color: ORANGE }}
                  >
                    <Lightbulb size={14} /> Écouter le mot
                  </button>
                )}
                {niveau > 1 && indices >= 1 && (
                  <p className="text-[13px] text-[#B9C1E3]">
                    Il commence par <b className="labo-lettres text-[18px] text-white">{mot.mot[0]}</b> et a <b className="text-white">{mot.mot.length}</b> lettres.
                  </p>
                )}
              </div>
            </Carte>
          )
        )}
          </>
        }
      >
        <div className="tab:min-h-0 tab:flex-1">
        {mode === 'os' ? (
          <PlateauCorps
            ruban
            titreAffiche="LE CORPS HUMAIN"
            capturerRef={capturerRef}
            className="h-[56dvh] w-full rounded-3xl border border-[#FFB86B]/40 bg-[radial-gradient(circle_at_50%_38%,#2A2140,#070B16_75%)] md:h-[78dvh] tab:h-full"
            cadre={phase === 'fin' || !mot ? 'corps' : cadreDe(mot.id)}
            trouves={faits.map((f) => f.id)}
            actif={phase === 'jeu' && mot && revele && !faits.some((f) => f.id === mot.id) ? mot.id : null}
            anneaux={phase === 'jeu' && mot && revele && !faits.some((f) => f.id === mot.id) ? [{ id: mot.id, couleur: '#FFE45E' }] : []}
          />
        ) : (
          <canvas ref={canvasRef} className="block h-[52dvh] w-full rounded-3xl border border-[#FFB86B]/40 bg-black md:h-[78dvh] tab:h-full" />
        )}

        </div>
      </Duo>
    </CadreJeu>
  )
}
