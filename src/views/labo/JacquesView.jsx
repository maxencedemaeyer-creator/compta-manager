import { useEffect, useRef, useState } from 'react'
import { Camera, Languages, Play, RefreshCw, RotateCcw, ShieldCheck, Volume2 } from 'lucide-react'
import CadreJeu, { Bouton, Carte, Eclat, melanger } from '../../components/labo/CadreJeu.jsx'
import { BAS_DU_CORPS, COULEUR_GENRE, LANGUES, MOT, avecArticle, mainsJointes, parler, partieTouchee, zones } from '../../components/labo/vocabulaire/corps.js'
import { creerPose, etiquette, messageErreurCamera, ouvrirCamera } from '../../components/labo/vocabulaire/pose.js'

// =============================================================
//  A12 · Jacques a dit ! (vocabulaire du corps, élèves allophones)
//  La tablette DIT et ÉCRIT la consigne (« Touche ton nez ») ;
//  la caméra vérifie que l'élève touche la bonne partie de SON
//  corps. Chaque mot trouvé se colle en étiquette sur lui, en
//  direct. Niveau 3 : le vrai « Jacques a dit » avec des pièges.
//  Rien n'est enregistré : l'image reste sur la tablette.
// =============================================================
const CYAN = '#6FEFFF'
const TOURS = 10
const MAINTIEN = 450
const NIVEAUX = [
  { n: 1, titre: 'Ma tête', texte: 'tête, yeux, nez, bouche, oreille, cou, épaule', ids: ['tete', 'yeux', 'nez', 'bouche', 'oreille', 'cou', 'epaule'] },
  {
    n: 2,
    titre: 'Tout mon corps',
    texte: '+ bras, coude, main, ventre, jambe, genou, pied',
    ids: ['tete', 'yeux', 'nez', 'bouche', 'oreille', 'cou', 'epaule', 'bras', 'coude', 'main', 'ventre', 'jambe', 'genou', 'pied'],
  },
  {
    n: 3,
    titre: 'Jacques a dit !',
    texte: 'Attention : sans « Jacques a dit », on ne bouge pas !',
    ids: ['tete', 'yeux', 'nez', 'bouche', 'oreille', 'cou', 'epaule', 'bras', 'coude', 'main', 'ventre', 'jambe', 'genou', 'pied'],
  },
]

function tirage(ids) {
  const l = []
  while (l.length < TOURS) l.push(...melanger(ids))
  return l.slice(0, TOURS)
}

export default function JacquesView() {
  const [phase, setPhase] = useState('accueil')
  const [niveau, setNiveau] = useState(1)
  const [langue, setLangue] = useState('')
  const [face, setFace] = useState('user')
  const [erreur, setErreur] = useState('')
  const [infos, setInfos] = useState({ tour: 0, score: 0, cible: 'tete', piege: false, statut: 'consigne', touche: null, maintien: 0, recule: false, corps: false, termine: false })
  const [eclat, setEclat] = useState({ message: '', sous: '', cle: 0 })
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fluxRef = useRef(null)
  const poseRef = useRef(null)
  const rafRef = useRef(0)
  const jeu = useRef(null)

  const consigne = (j) => (j.niveau === 3 && !j.piege ? `Jacques a dit : ${MOT[j.cible].consigne.toLowerCase()} !` : `${MOT[j.cible].consigne} !`)

  function nouveauTour(j, i) {
    j.tour = i
    j.cible = j.liste[i]
    j.piege = j.niveau === 3 && i > 0 && Math.random() < 0.3
    j.debut = performance.now()
    j.maintien = 0
    j.statut = 'consigne'
    j.finStatut = 0
    setTimeout(() => parler(consigne(j)), 250)
  }

  async function demarrer(f = face) {
    parler('C’est parti !')
    setPhase('chargement')
    try {
      const flux = await ouvrirCamera(f)
      fluxRef.current = flux
      videoRef.current.srcObject = flux
      await videoRef.current.play()
      if (!poseRef.current) poseRef.current = await creerPose('VIDEO')
      const n = NIVEAUX.find((x) => x.n === niveau)
      jeu.current = { niveau, ids: n.ids, liste: tirage(n.ids), score: 0, collees: new Set(), termine: false }
      nouveauTour(jeu.current, 0)
      setPhase('jeu')
    } catch (e) {
      console.error(e)
      arreter()
      setErreur(messageErreurCamera(e))
      setPhase('erreur')
    }
  }

  function arreter() {
    cancelAnimationFrame(rafRef.current)
    fluxRef.current?.getTracks().forEach((t) => t.stop())
    fluxRef.current = null
  }

  async function changerCamera() {
    const f = face === 'user' ? 'environment' : 'user'
    setFace(f)
    fluxRef.current?.getTracks().forEach((t) => t.stop())
    try {
      const flux = await ouvrirCamera(f)
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
      poseRef.current?.close?.()
      window.speechSynthesis?.cancel?.()
    },
    [],
  )

  // Boucle : caméra → posture → règles du jeu → dessin
  useEffect(() => {
    if (phase !== 'jeu') return
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let derniereVideo = -1
    let points = null
    let derniereMaj = 0
    let avant = performance.now()
    let autre = { id: null, t: 0 }

    function boucle(maintenant) {
      rafRef.current = requestAnimationFrame(boucle)
      const dt = Math.min(100, maintenant - avant)
      avant = maintenant
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
      if (video.currentTime !== derniereVideo) {
        derniereVideo = video.currentTime
        try {
          points = poseRef.current.detectForVideo(video, maintenant).landmarks?.[0] || null
        } catch {
          points = null
        }
      }
      const miroir = fluxRef.current?.getVideoTracks?.()[0]?.getSettings?.().facingMode !== 'environment'
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
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75)
      g.addColorStop(0, 'rgba(7,11,22,0)')
      g.addColorStop(1, 'rgba(7,11,22,.75)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, W, H)

      const j = jeu.current
      const L = points?.map((l) => ({ x: miroir ? W - (l.x * vw * s + dx) : l.x * vw * s + dx, y: l.y * vh * s + dy, visibility: l.visibility ?? 1 }))
      let touche = null
      let recule = false
      let z = null
      if (L) {
        z = zones(L)
        // étiquettes déjà gagnées, collées sur le corps
        const centre = (L[11].x + L[12].x) / 2
        for (const id of j.collees) {
          const p = id === 'main' ? z.main?.[0] : z[id]?.[0]
          if (!p) continue
          const cote = p.x < centre ? -1 : 1
          const m = MOT[id]
          etiquette(ctx, p.x + cote * Math.max(70, Math.abs(p.x - centre) * 0.6 + 60), p.y, m.article, m.mot, COULEUR_GENRE[m.genre], 15, p)
        }
      }

      if (!j.termine && L) {
        const ecoule = maintenant - j.debut
        if (j.statut === 'consigne') {
          recule = BAS_DU_CORPS.includes(j.cible) && !(z[j.cible] || []).length
          let bon = false
          let ou = null
          if (j.cible === 'main') {
            ou = mainsJointes(L)
            bon = !!ou
          } else {
            const t = partieTouchee(L, z, j.ids)
            if (t) {
              touche = t
              bon = t.id === j.cible
              ou = t.zone
              if (!bon) {
                autre = autre.id === t.id ? { id: t.id, t: autre.t + dt } : { id: t.id, t: 0 }
              }
            } else autre = { id: null, t: 0 }
          }
          j.maintien = bon ? j.maintien + dt : Math.max(0, j.maintien - dt * 2)
          // anneau de progression autour de la main
          if (bon && ou) {
            ctx.save()
            ctx.strokeStyle = j.piege ? '#FF6B7A' : '#9DFF8A'
            ctx.lineWidth = 6
            ctx.beginPath()
            ctx.arc(ou.x, ou.y, 34, -Math.PI / 2, -Math.PI / 2 + Math.min(1, j.maintien / MAINTIEN) * Math.PI * 2)
            ctx.stroke()
            ctx.restore()
          }
          // ce que la main touche (pour apprendre en explorant)
          if (touche && !bon && autre.t > 700) {
            const m = MOT[touche.id]
            etiquette(ctx, touche.main.x, touche.main.y - 46, 'ça, c’est ' + m.article, m.mot, '#B9C1E3', 14)
          }
          // aide : la zone clignote après 7 secondes
          if (!j.piege && ecoule > 7000 && j.cible !== 'main') {
            const a = 0.45 + 0.4 * Math.sin(maintenant / 180)
            ctx.save()
            ctx.strokeStyle = `rgba(255,228,94,${a})`
            ctx.lineWidth = 4
            ctx.setLineDash([8, 7])
            for (const p of z[j.cible] || []) {
              ctx.beginPath()
              ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
              ctx.stroke()
            }
            ctx.restore()
          }
          if (j.maintien > MAINTIEN) {
            if (j.piege) {
              j.statut = 'rate'
              parler('Non ! Jacques n’a pas dit !')
              setEclat((e) => ({ message: 'Jacques n’a pas dit !', sous: 'Sans « Jacques a dit », on ne bouge pas.', cle: e.cle + 1 }))
            } else {
              j.statut = 'bravo'
              j.score += ecoule < 4000 ? 2 : 1
              j.collees.add(j.cible)
              parler(`Bravo ! ${avecArticle(MOT[j.cible])}`)
              setEclat((e) => ({ message: 'Bravo !', sous: avecArticle(MOT[j.cible]), cle: e.cle + 1 }))
            }
            j.finStatut = maintenant
          } else if (j.piege && ecoule > 4500) {
            j.statut = 'bravo'
            j.score += 2
            parler('Bien joué, tu n’as pas bougé !')
            setEclat((e) => ({ message: 'Bien joué !', sous: 'Jacques n’avait rien dit.', cle: e.cle + 1 }))
            j.finStatut = maintenant
          }
        } else if (maintenant - j.finStatut > 1900) {
          if (j.tour + 1 >= TOURS) {
            j.termine = true
            parler('Fini ! Bravo !')
          } else nouveauTour(j, j.tour + 1)
        }
      }

      if (maintenant - derniereMaj > 120) {
        derniereMaj = maintenant
        setInfos({ tour: j.tour, score: j.score, cible: j.cible, piege: j.piege, statut: j.statut, touche: touche?.id ?? null, maintien: j.maintien, recule, corps: !!L, termine: j.termine })
      }
    }
    rafRef.current = requestAnimationFrame(boucle)
    return () => cancelAnimationFrame(rafRef.current)
  }, [phase])

  function photo() {
    canvasRef.current?.toBlob((b) => {
      if (!b) return
      const a = document.createElement('a')
      a.href = URL.createObjectURL(b)
      a.download = 'mon-corps-etiquete.png'
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 2000)
    })
  }

  function rejouer() {
    const n = NIVEAUX.find((x) => x.n === niveau)
    jeu.current = { niveau, ids: n.ids, liste: tirage(n.ids), score: 0, collees: new Set(), termine: false }
    nouveauTour(jeu.current, 0)
  }

  const m = MOT[infos.cible]
  const texteConsigne = jeu.current ? consigne({ ...jeu.current, cible: infos.cible, piege: infos.piege }) : ''
  const trad = langue && m?.tr[langue]
  const sensLangue = LANGUES.find((l) => l.id === langue)?.dir

  return (
    <CadreJeu code="A12" titre="Jacques a dit !" couleur={CYAN} large>
      <Eclat message={eclat.message} sousTitre={eclat.sous} cle={eclat.cle} couleur={CYAN} />
      {phase !== 'jeu' && phase !== 'chargement' && (
        <>
          <Carte couleur={`${CYAN}66`}>
            <p className="text-[15px] leading-snug text-[#DDE2F7]">
              La tablette <b>dit</b> et <b>écrit</b> une consigne : « Touche ton nez ». Touche la bonne partie de ton corps : la caméra vérifie, et le mot se colle sur toi&nbsp;!
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[#9DFF8A]">
              <ShieldCheck size={14} /> Aucune image n’est enregistrée ni envoyée.
            </p>
          </Carte>
          <div className="grid gap-2 sm:grid-cols-3">
            {NIVEAUX.map((n) => (
              <button
                key={n.n}
                type="button"
                onClick={() => setNiveau(n.n)}
                className="rounded-2xl border-2 p-3 text-left"
                style={{ borderColor: niveau === n.n ? CYAN : 'rgba(255,255,255,.12)', background: niveau === n.n ? 'rgba(111,239,255,.1)' : 'rgba(18,26,48,.85)' }}
              >
                <p className="labo-mono text-[11px]" style={{ color: CYAN }}>
                  NIVEAU {n.n}
                </p>
                <p className="labo-titre text-base font-bold text-white">{n.titre}</p>
                <p className="mt-0.5 text-[12px] leading-snug text-[#B9C1E3]">{n.texte}</p>
              </button>
            ))}
          </div>
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
                  style={langue === l.id ? { background: CYAN, color: '#04161A', borderColor: CYAN } : { borderColor: 'rgba(255,255,255,.18)', color: '#DDE2F7' }}
                >
                  {l.nom}
                </button>
              ))}
            </div>
          </Carte>
          {phase === 'erreur' && <p className="rounded-xl bg-[#FF6B7A]/15 px-3 py-2 text-[14px] text-[#FFC2C8]">{erreur}</p>}
          <Bouton couleur={CYAN} onClick={() => demarrer()}>
            <Play size={18} /> Démarrer la caméra
          </Bouton>
          <p className="text-center text-[12px] text-[#8A93B8]">Pose la tablette debout. Pour le niveau 2, recule pour qu’on voie tes pieds.</p>
        </>
      )}

      <div className={phase === 'jeu' || phase === 'chargement' ? '' : 'hidden'}>
        {phase === 'jeu' && !infos.termine && m && (
          <div className="mb-2 rounded-2xl border bg-[#070B16]/88 px-3 py-2 text-center" style={{ borderColor: infos.statut === 'rate' ? '#FF6B7A' : infos.statut === 'bravo' ? '#9DFF8A' : `${CYAN}66` }}>
            <div className="flex items-center justify-between text-[11px] text-[#8A93B8]">
              <span className="labo-mono">
                {infos.tour + 1}/{TOURS}
              </span>
              <span className="labo-mono text-[#FFE45E]">★ {infos.score}</span>
            </div>
            <p className="labo-titre text-[22px] font-black leading-tight text-white sm:text-3xl">{texteConsigne}</p>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-full px-3 py-0.5 text-lg font-black" style={{ background: `${COULEUR_GENRE[m.genre]}22`, color: COULEUR_GENRE[m.genre] }}>
                {avecArticle(m)}
              </span>
              {trad && (
                <span dir={sensLangue} className="rounded-full bg-white/10 px-3 py-0.5 text-lg font-bold text-white">
                  {trad}
                </span>
              )}
              <button type="button" aria-label="Écouter" onClick={() => parler(texteConsigne)} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#6FEFFF] text-[#04161A]">
                <Volume2 size={18} />
              </button>
            </div>
            {infos.recule && <p className="mt-1 text-[13px] font-bold text-[#FFE45E]">Recule : je dois voir tes jambes et tes pieds !</p>}
            {!infos.corps && <p className="mt-1 text-[13px] font-bold text-[#FFE45E]">Mets-toi devant la caméra !</p>}
          </div>
        )}
        {phase === 'jeu' && infos.termine && (
          <div className="mb-2 rounded-3xl border border-[#9DFF8A]/60 bg-[#070B16]/90 p-4 text-center">
            <p className="labo-titre text-3xl font-black text-white">★ {infos.score}</p>
            <p className="text-[14px] text-[#B9C1E3]">Regarde : tous tes mots sont collés sur toi !</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Bouton couleur="#9DFF8A" onClick={photo}>
                <Camera size={18} /> Photo souvenir
              </Bouton>
              <Bouton variante="secondaire" onClick={rejouer}>
                <RotateCcw size={18} /> Rejouer
              </Bouton>
              <Bouton
                variante="secondaire"
                onClick={() => {
                  arreter()
                  setPhase('accueil')
                }}
              >
                Changer de niveau
              </Bouton>
            </div>
          </div>
        )}
        <div className="relative">
          <video ref={videoRef} playsInline muted className="hidden" />
          <canvas ref={canvasRef} className="block h-[62dvh] w-full rounded-3xl border border-[#6FEFFF]/40 bg-black" />
          {phase === 'chargement' && <p className="absolute inset-0 flex items-center justify-center text-[15px] font-bold text-[#6FEFFF]">Préparation de la caméra…</p>}
          {phase === 'jeu' && (
            <div className="absolute bottom-3 right-3 flex gap-2">
              <button type="button" aria-label="Photo souvenir" onClick={photo} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#070B16]/85 text-white">
                <Camera size={20} />
              </button>
              <button type="button" aria-label="Changer de caméra" onClick={changerCamera} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#070B16]/85 text-white">
                <RefreshCw size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </CadreJeu>
  )
}
