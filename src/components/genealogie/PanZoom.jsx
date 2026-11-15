import { useCallback, useEffect, useRef } from 'react'
import { Maximize2, Minus, Plus } from 'lucide-react'

// Zone de dessin déplaçable (glisser) et zoomable (molette, pincement, boutons).
// - bounds : { minX, minY, maxX, maxY } = taille du dessin
// - recentrerCle : quand cette valeur change, la vue est recentrée
// - ajusterTout : toujours afficher le dessin en entier (sinon zoom sur la personne centrale si trop grand)
export default function PanZoom({ bounds, recentrerCle, ajusterTout = false, children }) {
  const conteneur = useRef(null)
  const groupe = useRef(null)
  const t = useRef({ x: 0, y: 0, k: 1 })
  const pointeurs = useRef(new Map())
  const geste = useRef(null)
  const aBouge = useRef(false)

  const appliquer = useCallback(() => {
    const { x, y, k } = t.current
    groupe.current?.setAttribute('transform', `translate(${x},${y}) scale(${k})`)
  }, [])

  const zoomerAutour = useCallback(
    (facteur, cx, cy) => {
      const { x, y, k } = t.current
      const nk = Math.min(3, Math.max(0.08, k * facteur))
      const r = nk / k
      t.current = { k: nk, x: cx - (cx - x) * r, y: cy - (cy - y) * r }
      appliquer()
    },
    [appliquer]
  )

  const recentrer = useCallback(() => {
    const el = conteneur.current
    if (!el || !bounds) return
    const w = el.clientWidth
    const h = el.clientHeight
    const bw = bounds.maxX - bounds.minX + 80
    const bh = bounds.maxY - bounds.minY + 80
    let k = Math.min(w / bw, h / bh, 1.1)
    if (k < 0.45 && !ajusterTout) {
      // Dessin trop grand : on zoome sur la personne centrale (point 0,0)
      k = Math.min(0.8, Math.max(0.45, w / 900))
      t.current = { k, x: w / 2, y: h / 2 }
    } else {
      const cx = (bounds.minX + bounds.maxX) / 2
      const cy = (bounds.minY + bounds.maxY) / 2
      t.current = { k, x: w / 2 - cx * k, y: h / 2 - cy * k }
    }
    appliquer()
  }, [bounds, ajusterTout, appliquer])

  // Recentrage au chargement et quand la personne centrale change
  useEffect(() => {
    recentrer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recentrerCle, bounds?.minX, bounds?.maxX, bounds?.minY, bounds?.maxY])

  // Molette / pincement du trackpad
  useEffect(() => {
    const el = conteneur.current
    if (!el) return
    function onWheel(e) {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const facteur = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018))
      zoomerAutour(facteur, e.clientX - rect.left, e.clientY - rect.top)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [zoomerAutour])

  // Glisser (souris / doigt) et pincement à deux doigts
  useEffect(() => {
    function onMove(e) {
      if (!pointeurs.current.has(e.pointerId)) return
      pointeurs.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      const pts = Array.from(pointeurs.current.values())
      const g = geste.current
      if (!g) return

      if (pts.length === 1 && g.type === 'pan') {
        const dx = pts[0].x - g.depart.x
        const dy = pts[0].y - g.depart.y
        if (Math.abs(dx) + Math.abs(dy) > 5) aBouge.current = true
        t.current = { ...t.current, x: g.t.x + dx, y: g.t.y + dy }
        appliquer()
      } else if (pts.length >= 2 && g.type === 'pinch') {
        aBouge.current = true
        const rect = conteneur.current.getBoundingClientRect()
        const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
        const mx = (pts[0].x + pts[1].x) / 2 - rect.left
        const my = (pts[0].y + pts[1].y) / 2 - rect.top
        const nk = Math.min(3, Math.max(0.08, g.t.k * (d / g.distance)))
        const r = nk / g.t.k
        t.current = {
          k: nk,
          x: mx - (g.milieu.x - g.t.x) * r,
          y: my - (g.milieu.y - g.t.y) * r,
        }
        appliquer()
      }
    }
    function onUp(e) {
      pointeurs.current.delete(e.pointerId)
      const pts = Array.from(pointeurs.current.values())
      geste.current = pts.length === 1 ? { type: 'pan', depart: pts[0], t: { ...t.current } } : null
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [appliquer])

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return
    pointeurs.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const pts = Array.from(pointeurs.current.values())
    if (pts.length === 1) {
      aBouge.current = false
      geste.current = { type: 'pan', depart: pts[0], t: { ...t.current } }
    } else if (pts.length === 2) {
      const rect = conteneur.current.getBoundingClientRect()
      geste.current = {
        type: 'pinch',
        distance: Math.max(1, Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)),
        milieu: {
          x: (pts[0].x + pts[1].x) / 2 - rect.left,
          y: (pts[0].y + pts[1].y) / 2 - rect.top,
        },
        t: { ...t.current },
      }
    }
  }

  // Après un glissement, on ignore le "clic" qui suit (pour ne pas ouvrir une fiche par erreur)
  function onClickCapture(e) {
    if (aBouge.current) {
      e.stopPropagation()
      e.preventDefault()
      aBouge.current = false
    }
  }

  function zoomBouton(facteur) {
    const el = conteneur.current
    zoomerAutour(facteur, el.clientWidth / 2, el.clientHeight / 2)
  }

  return (
    <div
      ref={conteneur}
      onPointerDown={onPointerDown}
      onClickCapture={onClickCapture}
      className="absolute inset-0 overflow-hidden cursor-grab active:cursor-grabbing select-none"
      style={{ touchAction: 'none' }}
    >
      <svg width="100%" height="100%" className="block">
        <g ref={groupe}>{children}</g>
      </svg>

      <div className="absolute right-3 bottom-3 sm:right-5 sm:bottom-5 flex flex-col gap-1.5 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur p-1.5 shadow-xl">
        <button
          type="button"
          onClick={() => zoomBouton(1.25)}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white/80 hover:bg-white/10"
          aria-label="Zoomer"
        >
          <Plus size={18} />
        </button>
        <button
          type="button"
          onClick={() => zoomBouton(0.8)}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white/80 hover:bg-white/10"
          aria-label="Dézoomer"
        >
          <Minus size={18} />
        </button>
        <button
          type="button"
          onClick={recentrer}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white/80 hover:bg-white/10"
          aria-label="Recentrer"
        >
          <Maximize2 size={16} />
        </button>
      </div>
    </div>
  )
}
