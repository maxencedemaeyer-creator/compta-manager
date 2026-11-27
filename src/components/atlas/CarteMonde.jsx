import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Minus, Plus, Maximize2, MapPin } from 'lucide-react'
import {
  CONTINENTS,
  FUSEAUX,
  LIGNES,
  OCEANS,
  ZONES_CLIMAT,
  bandeGeo,
  cerclesTissot,
  grille,
  heureDuFuseau,
  ligneGeo,
  signe,
} from '../../utils/atlasMonde.js'

// =============================================================
//  Carte du monde de l'ATLAS (SVG, fond clair, à projeter)
//  La carte est dessinée par d3-geo à partir des continents en
//  longitude / latitude. Couches possibles : continents, océans,
//  lignes imaginaires, fuseaux horaires, zones climatiques, grille,
//  cercles de déformation. Glisser pour déplacer, molette / pincer /
//  boutons pour zoomer, toucher un continent pour afficher son nom.
//  Tailles (textes, traits) en pixels d'écran : constantes au zoom.
// =============================================================
const ZOOM_MAX = 12
const COULEUR_EAU = '#d3e8f7'
const COULEUR_TERRE = '#ece7d5'
const COULEUR_TRAIT = '#475569'

// Abscisse d'un nom centré en x, ramenée dans le cadre (largeur d'un nom ≈ 0,66 × taille de police × nombre de lettres)
const caler = (x, nom, fs, W) => {
  const moitie = (nom.length * fs * 0.66) / 2 + 4
  return Math.min(W - moitie, Math.max(moitie, x))
}
const halo = (fs, couleur = '#ffffff') => ({ stroke: couleur, strokeWidth: fs * 0.3, paintOrder: 'stroke', strokeLinejoin: 'round' })

// Terres : ne se redessinent que si la projection ou le mode de couleur change
const Terres = memo(function Terres({ continents, mode, zones }) {
  const traits = (
    <g fill="transparent" stroke={COULEUR_TRAIT} strokeWidth="1" vectorEffect="non-scaling-stroke" strokeLinejoin="round">
      {continents.map((c) => (
        <path key={c.id} d={c.d} data-id={c.id} fill={mode === 'climat' ? 'transparent' : mode === 'continents' ? c.couleur : COULEUR_TERRE} vectorEffect="non-scaling-stroke" />
      ))}
    </g>
  )
  if (mode !== 'climat') return traits
  return (
    <g>
      {zones.map((z) => (
        <g key={z.id} clipPath={`url(#monde-clim-${z.id})`} pointerEvents="none">
          {continents.map((c) => (
            <path key={c.id} d={c.d} fill={z.terre} />
          ))}
        </g>
      ))}
      {traits}
    </g>
  )
})

export default function CarteMonde({ vue, donneesContinents, couleurs, nomsContinents, nomsOceans, lignes, nomsLignes, fuseaux, heure, climat, avecGrille, tissot, centre, selection, onSelection }) {
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
  // Nouvelle projection : on revient à la vue entière
  useEffect(() => setZoom({ k: 1, x: 0, y: 0 }), [vue])

  const echelle = Math.min(taille.w / W, taille.h / H)
  const upp = 1 / echelle
  const px = (n) => (n * upp) / zoom.k

  // ---------- géométrie (recalculée seulement si la projection change) ----------
  const continents = useMemo(
    () => donneesContinents.map((c) => ({ ...c, d: vue.path(c.geo), couleur: CONTINENTS.find((x) => x.id === c.id).couleur })),
    [donneesContinents, vue]
  )
  const zonesClimat = useMemo(() => ZONES_CLIMAT.map((z) => ({ ...z, d: vue.path(bandeGeo({ lat: z.lat })) })), [vue])
  const bandesFuseaux = useMemo(() => FUSEAUX.map((f) => ({ ...f, d: vue.path(bandeGeo({ lon: [f.de, f.a] })) })), [vue])
  const dLignes = useMemo(() => LIGNES.filter((l) => lignes.includes(l.id)).map((l) => ({ ...l, d: vue.path(ligneGeo(l)) })), [vue, lignes])
  const dGrille = useMemo(() => (avecGrille ? vue.path(grille()) : null), [vue, avecGrille])
  const dTissot = useMemo(() => (tissot ? vue.path(cerclesTissot()) : null), [vue, tissot])

  // ---------- déplacement et zoom ----------
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

  // ---------- noms ----------
  const nomsC = useMemo(
    () => (nomsContinents ? CONTINENTS.map((c) => ({ ...c, p: vue.place(...c.label) })).filter((c) => c.p) : []),
    [nomsContinents, vue]
  )
  // Un nom d'océan trop près d'un nom de continent est supprimé (vues polaires, où tout se rapproche)
  const nomsO = useMemo(
    () =>
      nomsOceans
        ? OCEANS.flatMap((o) => o.lieux.map((l, i) => ({ cle: `${o.id}${i}`, nom: o.nom, p: vue.place(...l) })))
            .filter((o) => o.p)
            .filter((o) => !nomsC.some((c) => Math.abs(c.p[0] - o.p[0]) < 120 && Math.abs(c.p[1] - o.p[1]) < 26))
        : [],
    [nomsOceans, nomsC, vue]
  )
  const nomsL = useMemo(() => {
    if (!nomsLignes) return []
    return dLignes
      .map((l) => {
        if (l.lat !== undefined) {
          const p = vue.place(centre + 177, l.lat) || vue.place(centre + 160, l.lat)
          return p && { ...l, p, a: 'end', dy: -1 }
        }
        const p = vue.place(l.lon, -50)
        return p && { ...l, p, a: 'start', dy: 0 }
      })
      .filter(Boolean)
  }, [nomsLignes, dLignes, vue, centre])

  const nomsZonesClimat = useMemo(
    () => (climat ? zonesClimat.flatMap((z) => z.label.map((l, i) => ({ cle: `${z.id}${i}`, nom: z.nom, p: vue.place(...l) }))).filter((z) => z.p) : []),
    [climat, zonesClimat, vue]
  )

  const continentChoisi = selection ? CONTINENTS.find((c) => c.id === selection) : null
  const dChoisi = selection ? continents.find((c) => c.id === selection)?.d : null
  const boutons =
    'w-12 h-12 rounded-xl bg-white/90 backdrop-blur border border-slate-300 text-slate-700 flex items-center justify-center active:scale-95 hover:bg-white shadow-sm transition'
  const modeCouleur = climat ? 'climat' : couleurs ? 'continents' : 'neutre'
  const belgique = fuseaux ? vue.place(4.4, 50.85) : null

  return (
    <div ref={boite} className="relative w-full h-full">
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
        <defs>
          {climat &&
            zonesClimat.map((z) => (
              <clipPath key={z.id} id={`monde-clim-${z.id}`}>
                <path d={z.d} />
              </clipPath>
            ))}
        </defs>

        <g transform={`translate(${zoom.x} ${zoom.y}) scale(${zoom.k})`}>
          {/* Mers et océans */}
          <path d={vue.contourD} fill={COULEUR_EAU} data-id="" />
          {climat && (
            <g pointerEvents="none">
              {zonesClimat.map((z) => (
                <path key={z.id} d={z.d} fill={z.mer} />
              ))}
            </g>
          )}

          <Terres continents={continents} mode={modeCouleur} zones={zonesClimat} />

          {dChoisi && <path d={dChoisi} fill="rgba(15,23,42,0.18)" stroke="#0f172a" strokeWidth="2.5" vectorEffect="non-scaling-stroke" pointerEvents="none" />}

          {/* Fuseaux horaires : une tranche sur deux est grisée */}
          {fuseaux && (
            <g pointerEvents="none">
              {bandesFuseaux.map((f) => (
                <path key={f.n} d={f.d} fill={f.n % 2 === 0 ? 'rgba(30,64,175,0.0)' : 'rgba(30,64,175,0.13)'} stroke="rgba(30,64,175,0.55)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              ))}
            </g>
          )}

          {dGrille && <path d={dGrille} fill="none" stroke="rgba(51,65,85,0.45)" strokeWidth="1" vectorEffect="non-scaling-stroke" pointerEvents="none" />}
          {dTissot && <path d={dTissot} fill="rgba(220,38,38,0.35)" stroke="#991b1b" strokeWidth="1" vectorEffect="non-scaling-stroke" pointerEvents="none" />}

          {/* Lignes imaginaires */}
          <g pointerEvents="none" fill="none" strokeLinecap="round">
            {dLignes.map((l) => (
              <path key={l.id} d={l.d} stroke={l.couleur} strokeWidth={l.largeur} strokeDasharray={l.tirets} vectorEffect="non-scaling-stroke" />
            ))}
          </g>
          {nomsL.length > 0 && (
            <g pointerEvents="none" fontStyle="italic" fontWeight="700">
              {nomsL.map((l) => {
                const fs = px(14)
                return (
                  <text key={l.id} x={l.p[0] + (l.a === 'start' ? px(8) : 0)} y={l.p[1] + (l.dy < 0 ? -px(5) : fs * 0.35)} fontSize={fs} textAnchor={l.a} fill={l.couleur} {...halo(fs, 'rgba(255,255,255,0.9)')}>
                    {l.nom}
                  </text>
                )
              })}
            </g>
          )}

          {/* Zones climatiques : noms */}
          {nomsZonesClimat.length > 0 && (
            <g pointerEvents="none" textAnchor="middle" fontWeight="800">
              {nomsZonesClimat.map((z) => {
                const fs = px(19)
                return (
                  <text key={z.cle} x={caler(z.p[0], z.nom, fs, W)} y={z.p[1] + fs * 0.35} fontSize={fs} fill="#0f172a" {...halo(fs, 'rgba(255,255,255,0.8)')}>
                    {z.nom}
                  </text>
                )
              })}
            </g>
          )}

          {/* Noms des océans */}
          {nomsO.length > 0 && (
            <g pointerEvents="none" textAnchor="middle" fill="#1d4ed8" fontStyle="italic" fontWeight="600">
              {nomsO.map((o) => {
                const fs = px(17)
                return (
                  <text key={o.cle} x={caler(o.p[0], o.nom, fs, W)} y={o.p[1] + fs * 0.35} fontSize={fs} letterSpacing={fs * 0.1} {...halo(fs, 'rgba(211,232,247,0.85)')}>
                    {o.nom}
                  </text>
                )
              })}
            </g>
          )}

          {/* Noms des continents */}
          {nomsC.length > 0 && (
            <g pointerEvents="none" textAnchor="middle" fill="#0f172a" fontWeight="800">
              {nomsC.map((c) => {
                const fs = px(c.id === 'antarctique' ? 15 : 18)
                return (
                  <text key={c.id} x={caler(c.p[0], c.nom, fs, W)} y={c.p[1] + fs * 0.35} fontSize={fs} letterSpacing={fs * 0.06} {...halo(fs, 'rgba(255,255,255,0.8)')}>
                    {c.nom.toUpperCase()}
                  </text>
                )
              })}
            </g>
          )}

          {/* Fuseaux : numéros (décalage avec Greenwich) et heures locales */}
          {fuseaux && (
            <g pointerEvents="none" textAnchor="middle" fontWeight="800" fill="#1e3a8a">
              {bandesFuseaux.map((f) => {
                const haut = vue.place(f.milieu, 85)
                const bas = vue.place(f.milieu, 72)
                if (!haut || !bas) return null
                const fs = px(f.de === f.a || f.a - f.de < 10 ? 11 : 14)
                const { h, jour } = heureDuFuseau(heure, f.n)
                return (
                  <g key={f.n}>
                    <text x={haut[0]} y={haut[1] + fs * 0.35} fontSize={fs} {...halo(fs, 'rgba(255,255,255,0.9)')}>
                      {signe(f.n)}
                    </text>
                    <text x={bas[0]} y={bas[1] + fs * 0.35} fontSize={fs} fill="#9a3412" {...halo(fs, 'rgba(255,255,255,0.9)')}>
                      {h}h
                      {jour !== 0 && (
                        <tspan fontSize={fs * 0.72} dy={-fs * 0.3}>
                          {jour > 0 ? '+1j' : '−1j'}
                        </tspan>
                      )}
                    </text>
                  </g>
                )
              })}
            </g>
          )}
          {belgique && (
            <g pointerEvents="none">
              <circle cx={belgique[0]} cy={belgique[1]} r={px(5)} fill="#dc2626" stroke="#fff" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
              <text x={belgique[0] - px(8)} y={belgique[1] - px(8)} fontSize={px(13)} textAnchor="end" fontWeight="800" fill="#991b1b" {...halo(px(13), 'rgba(255,255,255,0.9)')}>
                Belgique
              </text>
            </g>
          )}

          {/* Contour de la carte */}
          <path d={vue.contourD} fill="none" stroke="#94a3b8" strokeWidth="1.5" vectorEffect="non-scaling-stroke" pointerEvents="none" />
        </g>
      </svg>

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

      {/* Nom du continent touché */}
      {continentChoisi && (
        <div className="absolute bottom-4 left-4 pointer-events-none">
          <span className="inline-flex items-center gap-2 rounded-2xl bg-white/95 border border-slate-300 px-4 py-2 text-lg font-bold text-slate-900 shadow-md">
            <MapPin size={18} className="shrink-0 text-sky-600" />
            {continentChoisi.nom}
          </span>
        </div>
      )}
    </div>
  )
}
