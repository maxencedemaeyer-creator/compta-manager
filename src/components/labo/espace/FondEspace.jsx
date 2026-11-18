import { useEffect, useRef } from 'react'

// =============================================================
//  Ciel étoilé en fond du labo (expérience « L'espace ») :
//  étoiles de plusieurs tailles et couleurs, une bande de Voie lactée,
//  quelques galaxies spirales qui tournent très lentement, étoiles qui
//  scintillent, étoiles filantes. Tout est dessiné une seule fois dans
//  un canvas (léger pour les tablettes) ; seules quelques petites
//  pièces bougent en CSS. Aucune image à télécharger.
//  Sert de modèle pour d'autres fonds (ex. petits circuits en électricité).
// =============================================================
function hasard(graine) {
  let s = graine
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

// Galaxie spirale dessinée avec des milliers de petites étoiles (bras logarithmiques)
export function dessinerGalaxie(canvas, { bras = 2, graine = 7, teinte = [255, 214, 170], bout = [200, 160, 255], barre = false } = {}) {
  const g = canvas.getContext('2d')
  const T = canvas.width
  const c = T / 2
  const rnd = hasard(graine)
  g.clearRect(0, 0, T, T)
  g.globalCompositeOperation = 'lighter'
  // halo diffus
  const h = g.createRadialGradient(c, c, 0, c, c, c)
  h.addColorStop(0, `rgba(${teinte},.7)`)
  h.addColorStop(0.16, `rgba(${teinte},.38)`)
  h.addColorStop(0.5, `rgba(${bout},.13)`)
  h.addColorStop(0.8, `rgba(${bout},.05)`)
  h.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = h
  g.fillRect(0, 0, T, T)
  // bras : nuages doux le long des spirales, puis étoiles
  const N = 16000
  for (let i = 0; i < N; i++) {
    const k = Math.floor(rnd() * bras)
    const t = Math.pow(rnd(), 1.35)
    const r = t * c * 0.92
    const th = (k * Math.PI * 2) / bras + 5.6 * Math.log(1 + 4.2 * t) + (rnd() + rnd() - 1) * (1.15 - 0.55 * t)
    const x = c + Math.cos(th) * r * (barre && t < 0.25 ? 1.5 : 1)
    const y = c + Math.sin(th) * r * (barre && t < 0.25 ? 0.5 : 1)
    const m = Math.min(1, t * 1.4)
    const col = [0, 1, 2].map((j) => Math.round(teinte[j] * (1 - m) + bout[j] * m))
    const a = (0.2 + rnd() * 0.75) * (1 - t * 0.3)
    g.fillStyle = `rgba(${col},${a})`
    g.beginPath()
    g.arc(x, y, 0.6 + rnd() * (t < 0.2 ? 1 : 1.7), 0, Math.PI * 2)
    g.fill()
    if (i % 22 === 0) {
      // petit amas brillant (pouponnière d'étoiles, rosée)
      const gr = g.createRadialGradient(x, y, 0, x, y, 7 + rnd() * 9)
      gr.addColorStop(0, `rgba(255,150,210,${0.22 * (0.4 + m)})`)
      gr.addColorStop(1, 'rgba(255,150,210,0)')
      g.fillStyle = gr
      g.fillRect(x - 18, y - 18, 36, 36)
    }
  }
  // noyau très lumineux
  const n = g.createRadialGradient(c, c, 0, c, c, c * 0.2)
  n.addColorStop(0, 'rgba(255,244,222,.95)')
  n.addColorStop(0.35, `rgba(${teinte},.55)`)
  n.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = n
  g.fillRect(0, 0, T, T)
}

function dessinerCiel(canvas, largeur, hauteur) {
  const g = canvas.getContext('2d')
  const rnd = hasard(20261118)
  g.clearRect(0, 0, largeur, hauteur)
  // Voie lactée : bande diagonale de poussière lumineuse
  g.save()
  g.translate(largeur * 0.5, hauteur * 0.5)
  g.rotate(-0.55)
  const L = Math.hypot(largeur, hauteur)
  const bande = g.createLinearGradient(0, -hauteur * 0.28, 0, hauteur * 0.28)
  bande.addColorStop(0, 'rgba(180,130,255,0)')
  bande.addColorStop(0.5, 'rgba(210,170,255,.075)')
  bande.addColorStop(1, 'rgba(255,170,210,0)')
  g.fillStyle = bande
  g.fillRect(-L / 2, -hauteur * 0.28, L, hauteur * 0.56)
  g.restore()
  const couleurs = ['255,255,255', '255,255,255', '255,255,255', '210,225,255', '255,236,205', '255,214,170', '255,190,235']
  const total = Math.round((largeur * hauteur) / 1900)
  for (let i = 0; i < total; i++) {
    const x = rnd() * largeur
    const y = rnd() * hauteur
    const grosse = rnd() < 0.04
    const taille = grosse ? 1 + rnd() * 1.1 : 0.35 + rnd() * 0.7
    const col = couleurs[Math.floor(rnd() * couleurs.length)]
    g.fillStyle = `rgba(${col},${0.3 + rnd() * 0.7})`
    g.beginPath()
    g.arc(x, y, taille, 0, Math.PI * 2)
    g.fill()
    if (grosse) {
      const gr = g.createRadialGradient(x, y, 0, x, y, 7)
      gr.addColorStop(0, `rgba(${col},.45)`)
      gr.addColorStop(1, `rgba(${col},0)`)
      g.fillStyle = gr
      g.fillRect(x - 8, y - 8, 16, 16)
    }
  }
  // étoiles supplémentaires dans la bande lumineuse
  for (let i = 0; i < total * 0.9; i++) {
    const u = (rnd() - 0.5) * L
    const v = (rnd() + rnd() + rnd() - 1.5) * hauteur * 0.2
    const x = largeur / 2 + u * Math.cos(-0.55) - v * Math.sin(-0.55)
    const y = hauteur / 2 + u * Math.sin(-0.55) + v * Math.cos(-0.55)
    g.fillStyle = `rgba(255,240,255,${0.12 + rnd() * 0.5})`
    g.fillRect(x, y, 0.8, 0.8)
  }
}

const GALAXIES = [
  // x, y en %, taille, inclinaison (deg), durée du tour (s), opacité, paramètres
  { x: 84, y: 14, t: 280, incl: 0, tour: 260, o: 0.7, p: { bras: 2, graine: 11, teinte: [255, 214, 170], bout: [210, 160, 255] } },
  { x: 9, y: 70, t: 230, incl: 68, tour: 340, o: 0.65, p: { bras: 3, graine: 5, teinte: [255, 224, 180], bout: [255, 160, 220] } },
  { x: 60, y: 90, t: 150, incl: 40, tour: 300, o: 0.5, p: { bras: 2, graine: 23, teinte: [255, 235, 210], bout: [200, 170, 255], barre: true } },
]

const SCINTILLENT = Array.from({ length: 46 }, (_, i) => {
  const r = hasard(97 + i * 13)
  return { x: r() * 100, y: r() * 100, t: 1.5 + r() * 2.2, d: r() * 6, du: 2.4 + r() * 4, c: ['#FFFFFF', '#FFE9C4', '#F3DBFF', '#FFD0EA'][Math.floor(r() * 4)] }
})

export default function FondEspace() {
  const ciel = useRef(null)
  const gal = useRef([])

  useEffect(() => {
    const cv = ciel.current
    const peindre = () => {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1)
      const w = window.innerWidth
      const h = window.innerHeight
      cv.width = Math.round(w * dpr)
      cv.height = Math.round(h * dpr)
      const g = cv.getContext('2d')
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      dessinerCiel(cv, w, h)
    }
    peindre()
    GALAXIES.forEach((G, i) => {
      const c = gal.current[i]
      if (c) dessinerGalaxie(c, G.p)
    })
    let attente
    const surRedim = () => {
      clearTimeout(attente)
      attente = setTimeout(peindre, 250)
    }
    window.addEventListener('resize', surRedim)
    return () => {
      window.removeEventListener('resize', surRedim)
      clearTimeout(attente)
    }
  }, [])

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <canvas ref={ciel} className="absolute inset-0 h-full w-full" />
      {/* nébuleuses */}
      <span className="absolute -left-24 top-[18%] h-[360px] w-[360px] rounded-full opacity-60 blur-2xl" style={{ background: 'radial-gradient(circle, rgba(166,107,255,.32), rgba(166,107,255,0) 70%)' }} />
      <span className="absolute -right-20 bottom-[12%] h-[420px] w-[420px] rounded-full opacity-50 blur-2xl" style={{ background: 'radial-gradient(circle, rgba(255,122,200,.25), rgba(255,122,200,0) 70%)' }} />
      {/* galaxies (dessinées en étoiles, elles tournent lentement) */}
      {GALAXIES.map((G, i) => (
        <div key={i} className="absolute" style={{ left: `${G.x}%`, top: `${G.y}%`, width: G.t, height: G.t, marginLeft: -G.t / 2, marginTop: -G.t / 2, opacity: G.o, transform: `rotateX(${G.incl}deg) rotateZ(${i * 40}deg)` }}>
          <canvas ref={(el) => (gal.current[i] = el)} width={G.t * 2} height={G.t * 2} className="espace-galaxie h-full w-full" style={{ animationDuration: `${G.tour}s` }} />
        </div>
      ))}
      {/* étoiles qui scintillent */}
      {SCINTILLENT.map((s, i) => (
        <span key={i} className="espace-scintille absolute rounded-full" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.t, height: s.t, background: s.c, boxShadow: `0 0 ${s.t * 3}px ${s.c}`, animationDelay: `${s.d}s`, animationDuration: `${s.du}s` }} />
      ))}
      {/* étoiles filantes */}
      <span className="espace-filante absolute" style={{ left: '12%', top: '8%', animationDelay: '3s' }} />
      <span className="espace-filante absolute" style={{ left: '58%', top: '3%', animationDelay: '11s', animationDuration: '17s' }} />
    </div>
  )
}
