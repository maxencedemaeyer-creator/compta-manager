import { useEffect, useRef, useState } from 'react'
import { Check, Maximize, RotateCw, X } from 'lucide-react'

// =============================================================
//  Appli « Lis-moi » : recadrage rapide de la photo
//  On tire les 4 coins (ou le cadre entier) pour ne garder que la
//  zone utile (consigne, paragraphe…) → moins de bruit pour la
//  reconnaissance du texte et pour l'élève. Gros bouton « Pivoter »
//  (demande de Max) + conseil si la photo semble couchée.
// =============================================================
const COTE_MAX = 2400 // px : assez pour une bonne reconnaissance, léger pour la tablette
const TAILLE_MIN = 0.06 // 6 % de l'image au minimum
const TOUT = { x: 0, y: 0, w: 1, h: 1 }

async function chargerImage(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      /* méthode classique ci-dessous */
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Impossible de lire la photo.'))
    img.src = url
  })
}

// Image de travail : réduite et tournée de « quarts » quarts de tour
function dessiner(img, quarts) {
  const echelle = Math.min(1, COTE_MAX / Math.max(img.width, img.height))
  const l = Math.round(img.width * echelle)
  const h = Math.round(img.height * echelle)
  const tourne = quarts % 2 === 1
  const c = document.createElement('canvas')
  c.width = tourne ? h : l
  c.height = tourne ? l : h
  const ctx = c.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.translate(c.width / 2, c.height / 2)
  ctx.rotate((quarts * Math.PI) / 2)
  ctx.drawImage(img, -l / 2, -h / 2, l, h)
  return c
}

const borner = (v, min, max) => Math.max(min, Math.min(max, v))

export default function Recadrage({ file, onValider, onAnnuler }) {
  const [image, setImage] = useState(null)
  const [quarts, setQuarts] = useState(0)
  const [travail, setTravail] = useState(null) // { canvas, url }
  const [cadre, setCadre] = useState(TOUT)
  const [taille, setTaille] = useState(null) // taille affichée de l'image
  const zone = useRef(null)
  // Photo plus large que haute (souvent : feuille prise de travers) → petit conseil
  const couche = !!travail && quarts === 0 && travail.canvas.width > travail.canvas.height * 1.15
  const glisse = useRef(null)

  const annuler = useRef(onAnnuler)
  annuler.current = onAnnuler

  useEffect(() => {
    let actif = true
    chargerImage(file)
      .then((img) => actif && setImage(img))
      .catch(() => annuler.current())
    return () => {
      actif = false
    }
  }, [file])

  useEffect(() => {
    if (!image) return
    const canvas = dessiner(image, quarts)
    let url = null
    canvas.toBlob(
      (b) => {
        url = URL.createObjectURL(b)
        setTravail({ canvas, url })
      },
      'image/jpeg',
      0.9
    )
    setCadre(TOUT)
    return () => url && URL.revokeObjectURL(url)
  }, [image, quarts])

  // Taille d'affichage : l'image entière tient dans la zone
  useEffect(() => {
    if (!travail || !zone.current) return
    const calculer = () => {
      const { width, height } = zone.current.getBoundingClientRect()
      const marge = 48 // place pour les poignées des coins
      const e = Math.min((width - marge) / travail.canvas.width, (height - marge) / travail.canvas.height)
      setTaille({ l: travail.canvas.width * e, h: travail.canvas.height * e })
    }
    calculer()
    const obs = new ResizeObserver(calculer)
    obs.observe(zone.current)
    return () => obs.disconnect()
  }, [travail])

  const commencer = (poignee) => (e) => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    glisse.current = { poignee, x: e.clientX, y: e.clientY, depart: cadre }
  }

  const bouger = (e) => {
    const g = glisse.current
    if (!g || !taille) return
    const dx = (e.clientX - g.x) / taille.l
    const dy = (e.clientY - g.y) / taille.h
    const d = g.depart
    let { x, y, w, h } = d
    if (g.poignee === 'cadre') {
      x = borner(d.x + dx, 0, 1 - d.w)
      y = borner(d.y + dy, 0, 1 - d.h)
    } else {
      if (g.poignee.includes('g')) {
        x = borner(d.x + dx, 0, d.x + d.w - TAILLE_MIN)
        w = d.x + d.w - x
      }
      if (g.poignee.includes('d')) w = borner(d.w + dx, TAILLE_MIN, 1 - d.x)
      if (g.poignee.includes('h')) {
        y = borner(d.y + dy, 0, d.y + d.h - TAILLE_MIN)
        h = d.y + d.h - y
      }
      if (g.poignee.includes('b')) h = borner(d.h + dy, TAILLE_MIN, 1 - d.y)
    }
    setCadre({ x, y, w, h })
  }

  const finir = () => {
    glisse.current = null
  }

  const valider = () => {
    const src = travail.canvas
    const sx = Math.round(cadre.x * src.width)
    const sy = Math.round(cadre.y * src.height)
    const sw = Math.max(1, Math.round(cadre.w * src.width))
    const sh = Math.max(1, Math.round(cadre.h * src.height))
    const c = document.createElement('canvas')
    c.width = sw
    c.height = sh
    c.getContext('2d').drawImage(src, sx, sy, sw, sh, 0, 0, sw, sh)
    c.toBlob(
      (b) => onValider(new File([b], 'photo.jpg', { type: 'image/jpeg' })),
      'image/jpeg',
      0.92
    )
  }

  const coin = (id, classes) => (
    <span
      onPointerDown={commencer(id)}
      className={`absolute h-11 w-11 touch-none ${classes}`}
      style={{ margin: -22 }}
    >
      <span className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-violet-500 shadow-lg" />
    </span>
  )

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#0f0d1f] text-white"
      onPointerMove={bouger}
      onPointerUp={finir}
      onPointerCancel={finir}
    >
      <div className="flex items-center justify-between px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button onClick={onAnnuler} className="flex h-11 items-center gap-1.5 rounded-full bg-white/10 px-4 font-semibold">
          <X size={18} /> Annuler
        </button>
        <p className="hidden font-semibold text-white/80 sm:block">Garde seulement le texte à lire</p>
        <span className="hidden w-[6.5rem] sm:block" />
      </div>
      {couche && (
        <p className="mx-auto mb-1 rounded-full bg-amber-400/90 px-4 py-1.5 text-center text-sm font-semibold text-amber-950">
          Le texte est couché ? Touche « Pivoter » ↻
        </p>
      )}

      <div ref={zone} className="relative mx-2 my-1 flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        {travail && taille && (
          <div className="relative" style={{ width: taille.l, height: taille.h }}>
            <img src={travail.url} alt="" className="h-full w-full select-none" draggable={false} />
            <div
              onPointerDown={commencer('cadre')}
              className="absolute touch-none cursor-move border-2 border-white"
              style={{
                left: `${cadre.x * 100}%`,
                top: `${cadre.y * 100}%`,
                width: `${cadre.w * 100}%`,
                height: `${cadre.h * 100}%`,
                boxShadow: '0 0 0 9999px rgba(10,8,25,0.6)',
              }}
            >
              {/* repères des tiers */}
              <span className="pointer-events-none absolute inset-x-0 top-1/3 border-t border-white/30" />
              <span className="pointer-events-none absolute inset-x-0 top-2/3 border-t border-white/30" />
              {coin('hg', 'left-0 top-0')}
              {coin('hd', 'right-0 top-0')}
              {coin('bg', 'bottom-0 left-0')}
              {coin('bd', 'bottom-0 right-0')}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
        <button
          onClick={() => setQuarts((q) => (q + 1) % 4)}
          className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-white/15 font-semibold"
        >
          <RotateCw size={20} /> Pivoter
        </button>
        <button onClick={() => setCadre(TOUT)} className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-white/10 font-semibold">
          <Maximize size={18} /> <span className="hidden sm:inline">Tout garder</span><span className="sm:hidden">Tout</span>
        </button>
        <button
          onClick={valider}
          disabled={!travail}
          className="flex h-14 flex-[1.4] items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-bold shadow-lg shadow-violet-600/30 disabled:opacity-50"
        >
          <Check size={22} /> Lire ce texte
        </button>
      </div>
    </div>
  )
}
