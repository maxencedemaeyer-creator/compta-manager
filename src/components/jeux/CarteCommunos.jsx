import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Minus, Plus, Maximize2, MapPin } from 'lucide-react'
import { couleurChaleur, COULEUR_TROUVEE, COULEUR_REVELEE, nom } from '../../utils/communos.js'

// =============================================================
//  Carte 2D de la Belgique pour COMMUNOS
//  - glisser pour déplacer, pincer / molette / boutons pour zoomer
//  - toucher une commune déjà essayée affiche son nom
// =============================================================
const ZOOM_MAX = 14

// Villes affichées comme repères (désactivables), nom français + position du texte
const REPERES = [
  ['Bruxelles', 'gauche'], ['Anvers', 'haut'], ['Gand', 'haut'], ['Bruges', 'haut'], ['Courtrai', 'bas'],
  ['Mons', 'gauche'], ['Charleroi', 'bas'], ['Namur', 'droite'], ['Liège', 'haut'], ['Louvain', 'droite'],
  ['Hasselt', 'haut'], ['Arlon', 'gauche'], ['Bastogne', 'gauche'], ['Eupen', 'bas'],
]

// Fond de carte (toutes les communes) : ne se redessine jamais
const FondCarte = memo(function FondCarte({ carte, actives }) {
  return (
    <>
      <g>
        {carte.communes.map((c) => {
          const active = !actives || actives.has(c.id)
          return (
          <path
            key={c.id}
            d={c.chemin}
            data-id={active ? c.id : undefined}
            fill={active ? (actives ? '#1f2a52' : '#1a2240') : '#080a1c'}
            stroke={active ? (actives ? '#33437a' : '#2c3a66') : '#10142c'}
            strokeWidth="0.6"
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
          />
          )
        })}
      </g>
    </>
  )
})

const Contours = memo(function Contours({ carte }) {
  return (
    <g pointerEvents="none" fill="none" strokeLinejoin="round" strokeLinecap="round">
      <path d={carte.provinces} stroke="#6b7fb8" strokeWidth="1.1" vectorEffect="non-scaling-stroke" opacity="0.8" />
      <path d={carte.pays} stroke="#c4b5fd" strokeWidth="4" vectorEffect="non-scaling-stroke" opacity="0.18" />
      <path d={carte.pays} stroke="#c4b5fd" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </g>
  )
})

export default function CarteCommunos({ carte, essais, cible, statut, dernier, reperes, onToucher, selection, cadre, actives, echelle = 200 }) {
  const svgRef = useRef(null)
  const [vue, setVue] = useState({ k: 1, x: 0, y: 0 })
  const [largeurEcran, setLargeurEcran] = useState(360)
  const pointeurs = useRef(new Map())
  const geste = useRef(null)
  // Zone affichée : toute la Belgique, ou la boîte d'une province (avec une marge)
  const [X0, Y0, W, H] = useMemo(() => {
    if (!cadre) return [0, 0, carte.largeur, carte.hauteur]
    const [a, b, c, d] = cadre
    const m = Math.max(c - a, d - b) * 0.06
    return [a - m, b - m, c - a + 2 * m, d - b + 2 * m]
  }, [cadre, carte])
  useEffect(() => setVue({ k: 1, x: 0, y: 0 }), [X0, Y0, W, H])

  // Taille réelle de la carte à l'écran (pour garder textes et boutons lisibles)
  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setLargeurEcran(el.getBoundingClientRect().width || 360))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const limiter = useCallback(
    (v) => {
      const k = Math.min(ZOOM_MAX, Math.max(1, v.k))
      return {
        k,
        x: Math.min(0, Math.max(W * (1 - k), v.x)),
        y: Math.min(0, Math.max(H * (1 - k), v.y)),
      }
    },
    [W, H]
  )

  // Point de l'écran → coordonnées de la carte (unités du viewBox)
  const versCarte = useCallback(
    (clientX, clientY) => {
      const r = svgRef.current.getBoundingClientRect()
      return [((clientX - r.left) / r.width) * W, ((clientY - r.top) / r.height) * H]
    },
    [W, H]
  )

  const zoomerAutour = useCallback(
    (facteur, px, py) => {
      setVue((v) => {
        const k = Math.min(ZOOM_MAX, Math.max(1, v.k * facteur))
        const f = k / v.k
        return limiter({ k, x: px - (px - v.x) * f, y: py - (py - v.y) * f })
      })
    },
    [limiter]
  )

  // Molette (ordinateur)
  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const surMolette = (e) => {
      e.preventDefault()
      const [px, py] = versCarte(e.clientX, e.clientY)
      zoomerAutour(Math.exp(-e.deltaY * 0.0022), px, py)
    }
    el.addEventListener('wheel', surMolette, { passive: false })
    return () => el.removeEventListener('wheel', surMolette)
  }, [versCarte, zoomerAutour])

  function surAppui(e) {
    svgRef.current.setPointerCapture?.(e.pointerId)
    pointeurs.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointeurs.current.size === 1) {
      geste.current = { depart: { x: e.clientX, y: e.clientY }, bouge: false, cible: e.target?.dataset?.id }
    } else {
      if (geste.current) geste.current.bouge = true
    }
  }

  function surMouvement(e) {
    const p = pointeurs.current
    if (!p.has(e.pointerId)) return
    const avant = p.get(e.pointerId)
    const rect = svgRef.current.getBoundingClientRect()
    const ratio = W / rect.width

    if (p.size === 1) {
      const dx = e.clientX - avant.x
      const dy = e.clientY - avant.y
      if (geste.current && Math.hypot(e.clientX - geste.current.depart.x, e.clientY - geste.current.depart.y) > 6) {
        geste.current.bouge = true
      }
      p.set(e.pointerId, { x: e.clientX, y: e.clientY })
      setVue((v) => limiter({ ...v, x: v.x + dx * ratio, y: v.y + dy * ratio }))
    } else if (p.size === 2) {
      const [a, b] = [...p.values()]
      const autre = [...p.entries()].find(([id]) => id !== e.pointerId)[1]
      const distAvant = Math.hypot(a.x - b.x, a.y - b.y)
      const distApres = Math.hypot(e.clientX - autre.x, e.clientY - autre.y)
      const milieuAvant = versCarte((avant.x + autre.x) / 2, (avant.y + autre.y) / 2)
      const milieuApres = versCarte((e.clientX + autre.x) / 2, (e.clientY + autre.y) / 2)
      p.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (distAvant > 0) {
        setVue((v) => {
          const k = Math.min(ZOOM_MAX, Math.max(1, (v.k * distApres) / distAvant))
          const f = k / v.k
          return limiter({
            k,
            x: milieuApres[0] - (milieuAvant[0] - v.x) * f,
            y: milieuApres[1] - (milieuAvant[1] - v.y) * f,
          })
        })
      }
    }
  }

  function surRelache(e) {
    const p = pointeurs.current
    p.delete(e.pointerId)
    if (p.size === 0 && geste.current) {
      if (!geste.current.bouge) onToucher?.(geste.current.cible || null)
      geste.current = null
    }
  }

  const ratio = W / largeurEcran // unités de carte par pixel à l'écran (zoom 1)
  const listeEssais = useMemo(() => essais.map((e) => ({ ...e, c: carte.parId.get(e.id) })), [essais, carte])
  const reperesListe = useMemo(
    () =>
      REPERES.map(([n, position]) => {
        const c = carte.communes.find((x) => x.fr === n)
        return c && (!actives || actives.has(c.id)) ? { c, position } : null
      }).filter(Boolean),
    [carte, actives]
  )
  const couleurCible = statut === 'trouve' ? COULEUR_TROUVEE : COULEUR_REVELEE
  const montrerCible = statut === 'trouve' || statut === 'abandon'

  const boutons = 'w-10 h-10 rounded-xl bg-slate-900/80 backdrop-blur border border-white/15 text-white flex items-center justify-center active:scale-95 hover:bg-slate-800 transition'

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`${X0} ${Y0} ${W} ${H}`}
        className="h-auto block select-none cursor-grab active:cursor-grabbing mx-auto"
        style={{ touchAction: 'none', aspectRatio: `${W} / ${H}`, width: `min(100%, calc(62dvh * ${(W / H).toFixed(4)}))` }}
        onPointerDown={surAppui}
        onPointerMove={surMouvement}
        onPointerUp={surRelache}
        onPointerCancel={surRelache}
        onDoubleClick={(e) => {
          const [px, py] = versCarte(e.clientX, e.clientY)
          zoomerAutour(2, px, py)
        }}
      >
        <defs>
          <filter id="cm-lueur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={6 / vue.k} result="flou" />
            <feMerge>
              <feMergeNode in="flou" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g transform={`translate(${X0 + vue.x} ${Y0 + vue.y}) scale(${vue.k}) translate(${-X0} ${-Y0})`}>
          <FondCarte carte={carte} actives={actives} />

          {/* Communes essayées */}
          <g>
            {listeEssais.map(({ id, km, c }) =>
              c && !(montrerCible && id === cible?.id) ? (
                <path
                  key={id}
                  d={c.chemin}
                  data-id={id}
                  fill={couleurChaleur(km, echelle)}
                  stroke="rgba(15,23,42,0.55)"
                  strokeWidth="0.8"
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                />
              ) : null
            )}
          </g>

          {/* Commune mystère (trouvée ou révélée) */}
          {montrerCible && cible && (
            <path
              d={cible.chemin}
              data-id={cible.id}
              fill={couleurCible}
              stroke="#ffffff"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
              filter="url(#cm-lueur)"
              className="cm-cible"
            />
          )}

          <Contours carte={carte} />

          {/* Dernier essai et commune touchée : contour lumineux */}
          {[dernier, selection]
            .filter((id, i, t) => id && t.indexOf(id) === i)
            .map((id) => {
              const c = carte.parId.get(id)
              return c ? (
                <path
                  key={'h' + id}
                  d={c.chemin}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2.2"
                  vectorEffect="non-scaling-stroke"
                  pointerEvents="none"
                  className={id === dernier ? 'cm-pulse' : ''}
                />
              ) : null
            })}

          {/* Repères */}
          {reperes && (
            <g pointerEvents="none">
              {reperesListe.map(({ c, position }) => {
                const fs = (10.5 * ratio) / vue.k
                const ecart = fs * 0.55
                const [x, y] = c.centre
                const place = {
                  haut: { x, y: y - ecart, a: 'middle' },
                  bas: { x, y: y + fs * 1.15, a: 'middle' },
                  gauche: { x: x - ecart, y: y + fs * 0.35, a: 'end' },
                  droite: { x: x + ecart, y: y + fs * 0.35, a: 'start' },
                }[position]
                return (
                  <g key={c.id}>
                    <circle cx={x} cy={y} r={(2.6 * ratio) / vue.k} fill="#e0e7ff" />
                    <text
                      x={place.x}
                      y={place.y}
                      fontSize={fs}
                      textAnchor={place.a}
                      fill="#e0e7ff"
                      stroke="#0b1024"
                      strokeWidth={fs * 0.28}
                      paintOrder="stroke"
                      fontWeight="600"
                      style={{ letterSpacing: '0.02em' }}
                    >
                      {nom(c)}
                    </text>
                  </g>
                )
              })}
            </g>
          )}
        </g>
      </svg>

      {/* Boutons de zoom */}
      <div className="absolute top-2 right-2 flex gap-2">
        <button type="button" aria-label="Zoomer" className={boutons} onClick={() => zoomerAutour(1.6, W / 2 , H / 2)}>
          <Plus size={18} />
        </button>
        <button type="button" aria-label="Dézoomer" className={boutons} onClick={() => zoomerAutour(1 / 1.6, W / 2, H / 2)}>
          <Minus size={18} />
        </button>
        {vue.k > 1.01 && (
          <button type="button" aria-label="Vue entière" className={boutons} onClick={() => setVue({ k: 1, x: 0, y: 0 })}>
            <Maximize2 size={16} />
          </button>
        )}
      </div>

      {/* Nom de la commune touchée */}
      {selection && carte.parId.get(selection) && (
        <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 max-w-full rounded-xl bg-slate-950/85 backdrop-blur border border-white/15 px-3 py-1.5 text-sm font-semibold shadow-lg">
            <MapPin size={14} className="shrink-0 text-fuchsia-300" />
            <span className="truncate">{nom(carte.parId.get(selection))}</span>
          </span>
        </div>
      )}
    </div>
  )
}
