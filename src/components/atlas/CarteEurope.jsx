import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Minus, Plus, Maximize2, MapPin } from 'lucide-react'
import {
  COULEUR_MER,
  ELEMENTS_LIMITE,
  MERS,
  MONTAGNES,
  PAYS,
  SOMMETS,
  formaterAlt,
  nomCourt,
  paysDe,
  placerEtiquettes,
  traceGeo,
} from '../../utils/atlasEurope.js'

// =============================================================
//  Carte de l'Europe de l'ATLAS (SVG, projection Lambert azimutale équivalente)
//  Les contours sont en longitude / latitude, projetés par d3-geo.
//  Glisser pour déplacer, molette / pincer / boutons pour zoomer, toucher un
//  pays pour son nom. Tailles (textes, traits) en pixels d'écran : constantes
//  au zoom. Les noms ne se recouvrent jamais : les petits pays apparaissent
//  en zoomant.
// =============================================================
const ZOOM_MAX = 14
const COULEUR_TRAIT = '#64748b'
const COULEUR_BELGIQUE = '#e11d48'
const MICRO_ETATS = ['ad', 'mc', 'sm', 'va', 'li', 'mt']

const halo = (fs, couleur = '#ffffff') => ({ stroke: couleur, strokeWidth: fs * 0.3, paintOrder: 'stroke', strokeLinejoin: 'round' })

// Les terres : ne se redessinent que si les couleurs changent
const Terres = memo(function Terres({ pays, remplir }) {
  return (
    <g stroke={COULEUR_TRAIT} strokeWidth="0.8" vectorEffect="non-scaling-stroke" strokeLinejoin="round">
      {pays.map((c) => {
        const f = remplir[c.id]
        if (f && typeof f === 'object' && !c.dEurope) {
          // Pays « à cheval » dont la carte n'a pas de partie européenne (Géorgie) : tout en Asie
          return <path key={c.id} d={c.d} data-id={c.id} fill={f.asie} vectorEffect="non-scaling-stroke" />
        }
        if (f && typeof f === 'object') {
          return (
            <g key={c.id}>
              <path d={c.dEurope} data-id={c.id} fill={f.europe} vectorEffect="non-scaling-stroke" />
              <path d={c.dAsie} data-id={c.id} fill={f.asie} vectorEffect="non-scaling-stroke" />
            </g>
          )
        }
        return <path key={c.id} d={c.d} data-id={c.id} fill={f || '#e6e2d3'} vectorEffect="non-scaling-stroke" />
      })}
    </g>
  )
})

// Largeur approximative d'un texte (en pixels d'écran)
const largeurTexte = (texte, fs, coef) => texte.length * fs * coef

export default function CarteEurope({
  vue,
  pays,
  limite,
  remplir,
  noms,
  nomsHors = true,
  capitales,
  capitalesAvant = false,
  mers,
  montagnes = [],
  sommets,
  limiteTrace,
  limiteNoms,
  belgique,
  onBelgique,
  selection,
  onSelection,
  fiche,
}) {
  const W = vue.largeur
  const H = vue.hauteur
  const boite = useRef(null)
  const svgRef = useRef(null)
  const [taille, setTaille] = useState({ w: 1000, h: 800 })
  const [zoom, setZoom] = useState({ k: 1, x: 0, y: 0 })
  const pointeurs = useRef(new Map())
  const geste = useRef(null)

  useEffect(() => {
    const el = boite.current
    if (!el) return
    const ro = new ResizeObserver(() => setTaille({ w: el.clientWidth || 1000, h: el.clientHeight || 800 }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const echelle = Math.min(taille.w / W, taille.h / H)
  const upp = 1 / echelle // unités du SVG par pixel d'écran
  const u = upp / zoom.k // ... et au zoom actuel
  const px = (n) => n * u

  // ---------- géométrie (calculée une fois) ----------
  const dPays = useMemo(
    () => pays.map((c) => ({ id: c.id, d: vue.path(c.geo), dEurope: c.europe ? vue.path(c.europe) : null, dAsie: c.asie ? vue.path(c.asie) : null })),
    [pays, vue]
  )
  const dBelgique = dPays.find((c) => c.id === 'be')?.d
  const dChoisi = selection ? dPays.find((c) => c.id === selection) : null
  const dLimite = useMemo(() => vue.path(limite), [limite, vue])
  const dMontagnes = useMemo(() => MONTAGNES.map((m) => ({ ...m, d: vue.path(traceGeo(m.trace)) })), [vue])

  // ---------- déplacement et zoom (comme la carte du monde) ----------
  const limiter = useCallback(
    (v) => {
      const k = Math.min(ZOOM_MAX, Math.max(1, v.k))
      return { k, x: Math.min(0, Math.max(W * (1 - k), v.x)), y: Math.min(0, Math.max(H * (1 - k), v.y)) }
    },
    [W, H]
  )
  const versCarte = useCallback(
    (clientX, clientY) => {
      const r = svgRef.current.getBoundingClientRect()
      const ech = Math.min(r.width / W, r.height / H)
      const ox = r.left + (r.width - W * ech) / 2
      const oy = r.top + (r.height - H * ech) / 2
      return [(clientX - ox) / ech, (clientY - oy) / ech]
    },
    [W, H]
  )
  const zoomerAutour = useCallback(
    (facteur, ux, uy) => {
      setZoom((v) => {
        const k = Math.min(ZOOM_MAX, Math.max(1, v.k * facteur))
        const f = k / v.k
        return limiter({ k, x: ux - (ux - v.x) * f, y: uy - (uy - v.y) * f })
      })
    },
    [limiter]
  )

  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const surMolette = (e) => {
      e.preventDefault()
      const [ux, uy] = versCarte(e.clientX, e.clientY)
      zoomerAutour(Math.exp(-e.deltaY * 0.0022), ux, uy)
    }
    el.addEventListener('wheel', surMolette, { passive: false })
    return () => el.removeEventListener('wheel', surMolette)
  }, [versCarte, zoomerAutour])

  function surAppui(e) {
    svgRef.current.setPointerCapture?.(e.pointerId)
    pointeurs.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointeurs.current.size === 1) geste.current = { depart: { x: e.clientX, y: e.clientY }, bouge: false, cible: e.target?.dataset?.id }
    else if (geste.current) geste.current.bouge = true
  }
  function surMouvement(e) {
    const p = pointeurs.current
    if (!p.has(e.pointerId)) return
    const avant = p.get(e.pointerId)
    if (p.size === 1) {
      const dx = e.clientX - avant.x
      const dy = e.clientY - avant.y
      if (geste.current && Math.hypot(e.clientX - geste.current.depart.x, e.clientY - geste.current.depart.y) > 6) geste.current.bouge = true
      p.set(e.pointerId, { x: e.clientX, y: e.clientY })
      setZoom((v) => limiter({ ...v, x: v.x + dx * upp, y: v.y + dy * upp }))
    } else if (p.size === 2) {
      const autre = [...p.entries()].find(([id]) => id !== e.pointerId)[1]
      const distAvant = Math.hypot(avant.x - autre.x, avant.y - autre.y)
      const distApres = Math.hypot(e.clientX - autre.x, e.clientY - autre.y)
      const milieuAvant = versCarte((avant.x + autre.x) / 2, (avant.y + autre.y) / 2)
      const milieuApres = versCarte((e.clientX + autre.x) / 2, (e.clientY + autre.y) / 2)
      p.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (distAvant > 0) {
        setZoom((v) => {
          const k = Math.min(ZOOM_MAX, Math.max(1, (v.k * distApres) / distAvant))
          const f = k / v.k
          return limiter({ k, x: milieuApres[0] - (milieuAvant[0] - v.x) * f, y: milieuApres[1] - (milieuAvant[1] - v.y) * f })
        })
      }
    }
  }
  function surRelache(e) {
    const p = pointeurs.current
    p.delete(e.pointerId)
    if (p.size === 0 && geste.current) {
      if (!geste.current.bouge) onSelection?.(geste.current.cible || null)
      geste.current = null
    }
  }

  // ---------- points (capitales, sommets) ----------
  const points = useMemo(() => {
    const liste = []
    if (capitales) {
      for (const p of PAYS) {
        if (!p.cap) continue
        const q = vue.place(p.cap[1], p.cap[2])
        if (q) liste.push({ cle: `cap-${p.id}`, id: p.id, x: q[0], y: q[1], hors: p.zone === 'hors' })
      }
    }
    return liste
  }, [capitales, vue])
  const pointsSommets = useMemo(
    () => (sommets ? SOMMETS.map((s) => ({ ...s, p: vue.place(...s.lieu) })).filter((s) => s.p) : []),
    [sommets, vue]
  )

  // ---------- noms (placés sans recouvrement, selon le zoom) ----------
  const etiquettes = useMemo(() => {
    const items = []
    const boxe = (x, y, r) => ({ x0: x - r, y0: y - r, x1: x + r, y1: y + r })
    const obstacles = []
    const rond = px(8) // écart entre un point et son nom, en unités du SVG
    for (const q of points) obstacles.push(boxe(q.x, q.y, px(q.id === 'be' ? 6 : q.hors ? 3.5 : 4.5)))
    for (const s of pointsSommets) obstacles.push(boxe(s.p[0], s.p[1], px(8)))

    // Quatre emplacements possibles autour d'un point : à droite, à gauche, au-dessus, en dessous
    const autour = (x, y, w, h, ecart) => [
      { x: x + ecart + w / 2, y, w, h },
      { x: x - ecart - w / 2, y, w, h },
      { x, y: y - ecart - h / 2 - px(1), w, h },
      { x, y: y + ecart + h / 2 + px(1), w, h },
    ]

    // Sommets : toujours lisibles
    for (const s of pointsSommets) {
      const texte = `${s.nom} · ${formaterAlt(s.alt)}`
      const fs = 13
      const w = px(largeurTexte(texte, fs, 0.6))
      const h = px(fs * 1.2)
      items.push({ cle: `som-${s.id}`, type: 'sommet', texte, fs, ordre: -3, candidats: autour(s.p[0], s.p[1], w, h, px(10)) })
    }
    // Noms de montagnes
    for (const m of dMontagnes) {
      if (!montagnes.includes(m.id)) continue
      const q = vue.place(...m.lab)
      if (!q) continue
      const fs = 14
      const texte = m.nom.toUpperCase()
      const w = px(largeurTexte(texte, fs, 0.74))
      const h = px(fs * 1.2)
      // Le nom de la chaîne passe avant les sommets ; à défaut de place, on le décale au-dessus ou au-dessous
      items.push({ cle: `mont-${m.id}`, type: 'montagne', texte, fs, ordre: -4, candidats: [0, -24, 24, -48, 48].map((d) => ({ x: q[0], y: q[1] + px(d), w, h })) })
    }
    // Noms de la limite géographique
    if (limiteNoms) {
      for (const el of ELEMENTS_LIMITE) {
        const q = vue.place(...el.lieu)
        if (!q) continue
        const fs = 13
        const w = px(largeurTexte(el.nom, fs, 0.56))
        const h = px(fs * 1.2)
        const a = ((el.rot || 0) * Math.PI) / 180
        items.push({
          cle: `lim-${el.nom}`,
          type: 'limite',
          texte: el.nom,
          fs,
          rot: el.rot || 0,
          ordre: -2,
          candidats: [{ x: q[0], y: q[1], w: Math.abs(w * Math.cos(a)) + Math.abs(h * Math.sin(a)), h: Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a)) }],
        })
      }
    }
    // Noms des pays
    if (noms) {
      for (const p of PAYS) {
        if (!p.lab) continue
        if (p.zone === 'hors' && !nomsHors) continue
        const q = vue.place(...p.lab)
        if (!q) continue
        const texte = nomCourt(p)
        const fs = p.zone === 'hors' ? 12.5 : p.rang <= 1 ? 15 : p.rang <= 3 ? 13.5 : 12
        const ordre = p.id === 'be' ? -1 : p.rang + (capitales && capitalesAvant ? 0.7 : 0)
        items.push({ cle: `pays-${p.id}`, type: 'pays', hors: p.zone === 'hors', texte, fs, ordre, candidats: [{ x: q[0], y: q[1], w: px(largeurTexte(texte, fs, 0.6)), h: px(fs * 1.2) }] })
      }
    }
    // Noms des capitales
    if (capitales) {
      for (const q of points) {
        const p = paysDe(q.id)
        const texte = p.cap[0]
        const fs = q.hors ? 11 : 12
        const w = px(largeurTexte(texte, fs, 0.56))
        const h = px(fs * 1.2)
        const ordre = q.id === 'be' ? -1 : p.rang + (capitalesAvant ? 0 : 0.4)
        items.push({ cle: q.cle, type: 'capitale', hors: q.hors, texte, fs, ordre, candidats: autour(q.x, q.y, w, h, rond) })
      }
    }
    // Mers et océans
    if (mers) {
      MERS.forEach((m, i) => {
        const q = vue.place(...m.lieu)
        if (!q) return
        const fs = m.petit ? 12 : 14
        const texte = m.nom
        items.push({ cle: `mer-${i}`, type: 'mer', texte, fs, ordre: 20, candidats: [{ x: q[0], y: q[1], w: px(largeurTexte(texte, fs, 0.55)), h: px(fs * 1.2) }] })
      })
    }
    return placerEtiquettes(items, obstacles, px(2))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [u, noms, nomsHors, capitales, capitalesAvant, mers, montagnes, limiteNoms, points, pointsSommets, dMontagnes, vue])

  const boutons =
    'w-12 h-12 rounded-xl bg-white/90 backdrop-blur border border-slate-300 text-slate-700 flex items-center justify-center active:scale-95 hover:bg-white shadow-sm transition'

  return (
    <div ref={boite} className="relative w-full h-full rounded-xl overflow-hidden" style={{ background: COULEUR_MER }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full h-full select-none cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
        onPointerDown={surAppui}
        onPointerMove={surMouvement}
        onPointerUp={surRelache}
        onPointerCancel={surRelache}
        onDoubleClick={(e) => {
          const [ux, uy] = versCarte(e.clientX, e.clientY)
          zoomerAutour(2, ux, uy)
        }}
      >
        <g transform={`translate(${zoom.x} ${zoom.y}) scale(${zoom.k})`}>
          {/* Mers et océans (déborde du cadre : les grands écrans montrent un peu plus de carte) */}
          <rect x={-4000} y={-4000} width={W + 8000} height={H + 8000} fill={COULEUR_MER} data-id="" />

          <Terres pays={dPays} remplir={remplir} />

          {dChoisi && <path d={dChoisi.d} fill="rgba(15,23,42,0.18)" stroke="#0f172a" strokeWidth="2.5" vectorEffect="non-scaling-stroke" pointerEvents="none" />}
          {belgique && dBelgique && <path d={dBelgique} fill={COULEUR_BELGIQUE} stroke="#881337" strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" pointerEvents="none" />}

          {/* Micro-États : un rond, car leur surface est trop petite pour être vue ou touchée */}
          <g strokeWidth="1.2" stroke="#334155" vectorEffect="non-scaling-stroke">
            {MICRO_ETATS.map((id) => {
              const p = paysDe(id)
              const q = vue.place(...p.lab)
              if (!q) return null
              const f = remplir[id]
              return (
                <g key={id}>
                  <circle cx={q[0]} cy={q[1]} r={px(9)} fill="transparent" stroke="none" data-id={id} />
                  <circle cx={q[0]} cy={q[1]} r={px(4.2)} fill={typeof f === 'string' ? f : '#e6e2d3'} data-id={id} vectorEffect="non-scaling-stroke" />
                </g>
              )
            })}
          </g>

          {/* Chaînes de montagnes */}
          <g pointerEvents="none" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {dMontagnes
              .filter((m) => montagnes.includes(m.id))
              .map((m) => (
                <g key={m.id}>
                  <path d={m.d} stroke="rgba(120,72,30,0.5)" strokeWidth={px(m.secondaire ? 8 : 11)} />
                  <path d={m.d} stroke="rgba(92,50,16,0.85)" strokeWidth={px(2.2)} strokeDasharray={`${px(1)} ${px(5)}`} />
                </g>
              ))}
          </g>

          {/* Limite géographique de l'Europe */}
          {limiteTrace && <path d={dLimite} fill="none" stroke="#dc2626" strokeWidth="2.6" strokeDasharray="9 5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" pointerEvents="none" />}

          {/* Sommets */}
          <g pointerEvents="none">
            {pointsSommets.map((s) => {
              const t = px(8)
              return <path key={s.id} d={`M${s.p[0]} ${s.p[1] - t} L${s.p[0] + t} ${s.p[1] + t * 0.8} L${s.p[0] - t} ${s.p[1] + t * 0.8} Z`} fill="#7c2d12" stroke="#fff" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
            })}
          </g>

          {/* Capitales : un point par capitale */}
          <g pointerEvents="none">
            {points.map((q) => (
              <circle key={q.cle} cx={q.x} cy={q.y} r={px(q.hors ? 3 : q.id === 'be' ? 5 : 3.8)} fill={q.hors ? '#64748b' : '#0f172a'} stroke="#fff" strokeWidth="1.3" vectorEffect="non-scaling-stroke" />
            ))}
          </g>

          {/* Noms */}
          <g pointerEvents="none" textAnchor="middle">
            {etiquettes.map((t) => {
              const fs = px(t.fs)
              const props = { x: t.x, y: t.y + fs * 0.35, fontSize: fs }
              switch (t.type) {
                case 'pays':
                  return (
                    <text key={t.cle} {...props} fontWeight={t.hors ? 600 : 800} fontStyle={t.hors ? 'italic' : 'normal'} fill={t.hors ? '#64748b' : '#0f172a'} {...halo(fs, 'rgba(255,255,255,0.8)')}>
                      {t.texte}
                    </text>
                  )
                case 'capitale':
                  return (
                    <text key={t.cle} {...props} fontWeight="700" fill={t.hors ? '#475569' : '#1e293b'} {...halo(fs, 'rgba(255,255,255,0.9)')}>
                      {t.texte}
                    </text>
                  )
                case 'mer':
                  return (
                    <text key={t.cle} {...props} fontStyle="italic" fontWeight="600" letterSpacing={fs * 0.08} fill="#1d4ed8" {...halo(fs, 'rgba(211,232,247,0.85)')}>
                      {t.texte}
                    </text>
                  )
                case 'montagne':
                  return (
                    <text key={t.cle} {...props} fontWeight="800" letterSpacing={fs * 0.14} fill="#5c3210" {...halo(fs, 'rgba(255,255,255,0.85)')}>
                      {t.texte}
                    </text>
                  )
                case 'sommet':
                  return (
                    <text key={t.cle} {...props} fontWeight="800" fill="#7c2d12" {...halo(fs, 'rgba(255,255,255,0.95)')}>
                      {t.texte}
                    </text>
                  )
                default:
                  return (
                    <text key={t.cle} {...props} fontWeight="800" fontStyle="italic" fill="#b91c1c" transform={t.rot ? `rotate(${t.rot} ${t.x} ${t.y})` : undefined} {...halo(fs, 'rgba(255,255,255,0.9)')}>
                      {t.texte}
                    </text>
                  )
              }
            })}
          </g>
        </g>
      </svg>

      {/* Bouton annexe : la Belgique en couleur (propre à chaque carte) */}
      <button
        type="button"
        aria-pressed={!!belgique}
        onClick={onBelgique}
        className={`absolute top-3 left-3 h-12 rounded-xl border px-3.5 flex items-center gap-2 text-[15px] font-bold shadow-sm transition active:scale-95 ${
          belgique ? 'bg-rose-600 border-rose-700 text-white' : 'bg-white/90 backdrop-blur border-slate-300 text-slate-700 hover:bg-white'
        }`}
      >
        <span className="w-4 h-4 rounded-sm border border-black/20" style={{ background: belgique ? '#fff' : COULEUR_BELGIQUE }} />
        Belgique
      </button>

      {/* Zoom */}
      <div className="absolute top-3 right-3 flex gap-2">
        <button type="button" aria-label="Zoomer" className={boutons} onClick={() => zoomerAutour(1.6, W / 2, H / 2)}>
          <Plus size={22} />
        </button>
        <button type="button" aria-label="Dézoomer" className={boutons} onClick={() => zoomerAutour(1 / 1.6, W / 2, H / 2)}>
          <Minus size={22} />
        </button>
        {zoom.k > 1.01 && (
          <button type="button" aria-label="Vue entière" className={boutons} onClick={() => setZoom({ k: 1, x: 0, y: 0 })}>
            <Maximize2 size={20} />
          </button>
        )}
      </div>

      {/* Pays touché */}
      {fiche && (
        <div className="absolute bottom-4 left-4 max-w-sm pointer-events-none">
          <div className="rounded-2xl bg-white/95 border border-slate-300 px-4 py-2.5 shadow-md">
            <p className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <MapPin size={18} className="shrink-0 text-sky-600" />
              {fiche.titre}
              {fiche.badge && (
                <span className="rounded-full px-2.5 py-0.5 text-[12px] font-bold" style={{ background: fiche.badge.fond, color: fiche.badge.couleurTexte }}>
                  {fiche.badge.texte}
                </span>
              )}
            </p>
            {fiche.lignes.map((l) => (
              <p key={l} className="mt-1 text-[13px] leading-snug text-slate-700">
                {l}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
