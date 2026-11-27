import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Minus, Plus, Maximize2, MapPin } from 'lucide-react'
import { TAILLES_VILLES, construireZones, ecartZone, placerEtiquettes, rivieresVisibles, villesVisibles } from '../../utils/atlas.js'

// =============================================================
//  Carte de la Belgique de l'ATLAS (SVG, fond clair, à projeter)
//  - couches : vierge, régions, communautés, provinces, communes
//  - noms, villes, hydrographie activables (voir AtlasBelgiqueView)
//  - glisser pour déplacer, molette / pincer / boutons pour zoomer,
//    toucher une zone pour afficher son nom
//  Tailles (textes, points, traits) exprimées en pixels d'écran :
//  elles restent constantes quand on zoome.
// =============================================================
const ZOOM_MAX = 16

const COULEUR_TRAIT = '#334155'
const COULEUR_PAYS = '#0f172a'
const COULEUR_EAU = '#2a62a8'
const COULEUR_MER = '#d3e8f7'
const COULEUR_NOM_EAU = '#1d4ed8'

// Zones colorées : ne se redessinent que si la couche change
const FondZones = memo(function FondZones({ zones, communes, limitrophes }) {
  if (limitrophes) {
    // Les voisins sont recalés sur la Belgique par le script de génération (leur frontière avec elle est celle de la Belgique) ;
    // la Belgique, sans le détail de ses communes, est posée dessus.
    const voisins = zones.filter((z) => z.id !== 'belgique')
    const belgique = zones.find((z) => z.id === 'belgique')
    return (
      <g>
        {voisins.map((z) => (
          <path key={z.id} d={z.d} data-id={z.id} fillRule="evenodd" fill={z.couleur} stroke="#475569" strokeWidth="1.3" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        ))}
        {belgique && (
          <path d={belgique.d} data-id="belgique" fill={belgique.couleur} stroke={belgique.couleur} strokeWidth="1" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        )}
      </g>
    )
  }
  return (
    <g>
      {zones.map((z) => (
        <path
          key={z.id}
          d={z.d}
          data-id={z.id}
          fill={z.couleur === 'hachures' ? 'url(#atlas-hachures)' : z.couleur}
          stroke={communes ? '#94a3b8' : z.couleur === 'hachures' ? 'none' : z.couleur}
          strokeWidth={communes ? 0.7 : 1}
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
        />
      ))}
    </g>
  )
})

const Traits = memo(function Traits({ chemins }) {
  return (
    <g pointerEvents="none" fill="none" strokeLinejoin="round" strokeLinecap="round">
      {chemins.map(([cle, d, couleur, largeur]) => (
        <path key={cle} d={d} stroke={couleur} strokeWidth={largeur} vectorEffect="non-scaling-stroke" />
      ))}
    </g>
  )
})

// Fleuves et rivières : trait plein en Belgique ; hors de Belgique, pointillés qui s'effacent
// (comme dans INTERFACE-ELEVES). Un court passage à l'étranger entre deux parties belges
// (la Meuse à Maastricht) reste en pointillés, sans fondu : le tracé n'est jamais interrompu.
const Hydro = memo(function Hydro({ rivieres }) {
  return (
    <g pointerEvents="none" fill="none" strokeLinejoin="round" strokeLinecap="round">
      <defs>
        {rivieres.flatMap((r) =>
          r.dehors.map((p, i) =>
            p.fondu ? (
              <linearGradient key={`${r.id}${i}`} id={`atlas-fondu-${r.id}-${i}`} gradientUnits="userSpaceOnUse" x1={p.a[0]} y1={p.a[1]} x2={p.b[0]} y2={p.b[1]}>
                <stop offset="0" stopColor={COULEUR_EAU} stopOpacity="0.8" />
                {p.tenue > 0 && <stop offset={p.tenue} stopColor={COULEUR_EAU} stopOpacity="0.8" />}
                <stop offset="1" stopColor={COULEUR_EAU} stopOpacity="0" />
              </linearGradient>
            ) : null
          )
        )}
      </defs>
      {rivieres.map((r) => {
        const largeur = r.genre === 'fleuve' ? 3.6 : 2.4
        return (
          <g key={r.id}>
            {r.dehors.map((p, i) => (
              <path
                key={i}
                d={p.d}
                stroke={p.fondu ? `url(#atlas-fondu-${r.id}-${i})` : COULEUR_EAU}
                strokeOpacity={p.fondu ? 1 : 0.65}
                strokeWidth={largeur * 0.8}
                strokeDasharray="5 6"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            <path d={r.d} stroke={COULEUR_EAU} strokeWidth={largeur} vectorEffect="non-scaling-stroke" />
          </g>
        )
      })}
    </g>
  )
})

// Étoile à 5 branches (Bruxelles), centrée, rayon r
function etoile(x, y, r) {
  const pts = []
  for (let i = 0; i < 10; i++) {
    const rayon = i % 2 === 0 ? r : r * 0.42
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    pts.push(`${(x + rayon * Math.cos(a)).toFixed(1)},${(y + rayon * Math.sin(a)).toFixed(1)}`)
  }
  return pts.join(' ')
}

const halo = (fs, couleur = '#ffffff') => ({ stroke: couleur, strokeWidth: fs * 0.3, paintOrder: 'stroke', strokeLinejoin: 'round' })

export default function CarteAtlas({ carte, atlas, couche, noms, villes, nomsVilles, eau, mer, selection, onSelection }) {
  // Cadre : le pays et les pointillés des rivières qui en sortent
  const [X0, Y0, X1, Y1] = atlas.cadre
  const W = X1 - X0
  const H = Y1 - Y0
  const boite = useRef(null)
  const svgRef = useRef(null)
  const [taille, setTaille] = useState({ w: 1000, h: 800 })
  const [vue, setVue] = useState({ k: 1, x: 0, y: 0 })
  const pointeurs = useRef(new Map())
  const geste = useRef(null)

  // Taille disponible → pixels d'écran par unité de carte (zoom 1)
  useEffect(() => {
    const el = boite.current
    if (!el) return
    const ro = new ResizeObserver(() => setTaille({ w: el.clientWidth || 1000, h: el.clientHeight || 800 }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const echelle = Math.min(taille.w / W, taille.h / H)
  const upp = 1 / echelle // unités de carte par pixel d'écran (zoom 1)
  const px = (n) => (n * upp) / vue.k // n pixels d'écran → unités de carte

  const communesDG = useMemo(() => new Set(atlas.communesDG), [atlas])
  const zones = useMemo(() => construireZones(carte, couche, communesDG, atlas), [carte, couche, communesDG, atlas])
  const rivieres = useMemo(() => rivieresVisibles(atlas, eau), [atlas, eau])
  const listeVilles = useMemo(() => villesVisibles(atlas, villes), [atlas, villes])

  const traits = useMemo(() => {
    const t = []
    if (couche === 'communes') t.push(['prov', atlas.frontieres.provinces, '#475569', 1.9])
    else if (couche !== 'vierge' && couche !== 'limitrophes') t.push(['couche', atlas.frontieres[couche], COULEUR_TRAIT, 2.2])
    t.push(['pays', carte.pays, COULEUR_PAYS, 2.6])
    return t
  }, [atlas, carte, couche])

  const limiter = useCallback(
    (v) => {
      const k = Math.min(ZOOM_MAX, Math.max(1, v.k))
      return { k, x: Math.min(0, Math.max(W * (1 - k), v.x)), y: Math.min(0, Math.max(H * (1 - k), v.y)) }
    },
    [W, H]
  )

  // Point de l'écran → coordonnées de la carte (origine = coin de la zone affichée)
  const versCarte = useCallback((clientX, clientY) => {
    const r = svgRef.current.getBoundingClientRect()
    const ech = Math.min(r.width / W, r.height / H)
    const ox = r.left + (r.width - W * ech) / 2
    const oy = r.top + (r.height - H * ech) / 2
    return [(clientX - ox) / ech, (clientY - oy) / ech]
  }, [W, H])

  const zoomerAutour = useCallback(
    (facteur, ux, uy) => {
      setVue((v) => {
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
      setVue((v) => limiter({ ...v, x: v.x + dx * upp, y: v.y + dy * upp }))
    } else if (p.size === 2) {
      const autre = [...p.entries()].find(([id]) => id !== e.pointerId)[1]
      const distAvant = Math.hypot(avant.x - autre.x, avant.y - autre.y)
      const distApres = Math.hypot(e.clientX - autre.x, e.clientY - autre.y)
      const milieuAvant = versCarte((avant.x + autre.x) / 2, (avant.y + autre.y) / 2)
      const milieuApres = versCarte((e.clientX + autre.x) / 2, (e.clientY + autre.y) / 2)
      p.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (distAvant > 0) {
        setVue((v) => {
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

  // ---------- étiquettes ----------
  const taillePolice = { regions: 20, communautes: 17, provinces: 15, limitrophes: 17, vierge: 0, communes: 0 }[couche]
  const etiquettesZones = useMemo(() => {
    const pos = atlas.etiquettes[couche]
    if (!pos) return []
    return zones.filter((z) => pos[z.id]).map((z) => ({ ...z, ...pos[z.id] }))
  }, [atlas, couche, zones])

  // Noms de zones : position finale (certains sont écartés de leur zone) et taille en pixels
  const nomsZones = useMemo(
    () =>
      etiquettesZones.map((z) => {
        const ecart = ecartZone(couche, z.id)
        const police = z.id === 'germanophone' ? taillePolice - 3 : taillePolice
        const fs = px(police)
        const x = z.x + (ecart ? px(ecart.dx) : 0)
        const y = z.y + (ecart ? px(ecart.dy) : 0)
        const trait = ecart ? [z.x, z.y, x + px(ecart.fin[0]), y + px(ecart.fin[1])] : null
        return { ...z, x, y, fs, trait, ancre: 'middle' }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [etiquettesZones, couche, taillePolice, vue.k, echelle]
  )
  // Pas de nom de zone pour Bruxelles si le nom de la ville est affiché au même endroit
  const nomsZonesAffiches = nomsZones.filter((z) => !(z.id === 'bruxelles' && villes.bruxelles && nomsVilles))

  // Noms des villes et des rivières : emplacements sans chevauchement
  const placement = useMemo(
    () =>
      placerEtiquettes({
        zones: noms ? nomsZonesAffiches : [],
        villes: listeVilles,
        avecNomsVilles: nomsVilles,
        rivieres,
        avecNomsRivieres: noms,
        px,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [noms, nomsZones, listeVilles, nomsVilles, rivieres, vue.k, echelle]
  )

  // Noms de communes : seulement ceux qui tiennent dans leur commune, et seulement dans la zone visible
  const etiquettesCommunes = useMemo(() => {
    if (!(couche === 'communes' && noms && vue.k >= 2.2)) return []
    const police = 11
    const liste = []
    for (const c of carte.communes) {
      const [x0, y0, x1, y1] = c.boite
      const largeur = (x1 - x0) * echelle * vue.k
      const hauteur = (y1 - y0) * echelle * vue.k
      if (largeur < c.fr.length * police * 0.58 || hauteur < police * 1.5) continue
      const ux = (c.centre[0] - X0) * vue.k + vue.x
      const uy = (c.centre[1] - Y0) * vue.k + vue.y
      if (ux < 0 || ux > W || uy < 0 || uy > H) continue
      liste.push(c)
    }
    return liste
  }, [couche, noms, vue, carte, echelle, W, H, X0, Y0])

  const zoneSelectionnee = selection ? zones.find((z) => z.id === selection) : null
  const boutons =
    'w-12 h-12 rounded-xl bg-white/90 backdrop-blur border border-slate-300 text-slate-700 flex items-center justify-center active:scale-95 hover:bg-white shadow-sm transition'

  return (
    <div ref={boite} className="relative w-full h-full">
      <svg
        ref={svgRef}
        viewBox={`${X0} ${Y0} ${W} ${H}`}
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
          {/* Bruxelles dans la carte des communautés : hachures jaune (flamande) / bleu (française) */}
          <pattern id="atlas-hachures" patternUnits="userSpaceOnUse" width={px(12)} height={px(12)} patternTransform="rotate(45)">
            <rect width={px(12)} height={px(6)} fill="#fcd34d" />
            <rect y={px(6)} width={px(12)} height={px(6)} fill="#93c5fd" />
          </pattern>
        </defs>

        <g transform={`translate(${X0 + vue.x} ${Y0 + vue.y}) scale(${vue.k}) translate(${-X0} ${-Y0})`}>
          {/* Mer du Nord : un grand fond bleu, sur lequel on repose la terre (France, Pays-Bas…) à la couleur de la page */}
          {mer && (
            <g pointerEvents="none">
              <rect x={X0 - 20000} y={Y0 - 20000} width={W + 40000} height={H + 40000} fill={COULEUR_MER} />
              <path d={atlas.terre} fill="#f4f6f8" stroke={COULEUR_MER} strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
            </g>
          )}
          <FondZones zones={zones} communes={couche === 'communes'} limitrophes={couche === 'limitrophes'} />

          {/* Zone touchée : voile sombre (+ contour pour une commune seule : pour une province, le contour
              dessinerait toutes les communes qui la composent) */}
          {zoneSelectionnee && (
            <path
              d={zoneSelectionnee.d}
              fill="rgba(15,23,42,0.16)"
              stroke={couche === 'communes' || couche === 'vierge' ? COULEUR_PAYS : 'none'}
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
              pointerEvents="none"
            />
          )}

          <Traits chemins={traits} />
          <Hydro rivieres={rivieres} />

          {/* Mer et pays voisins */}
          {noms && couche !== 'limitrophes' &&
            atlas.voisins.map((v) => {
              const fs = px(v.type === 'mer' ? 17 : 14)
              return (
                <text
                  key={v.nom}
                  x={v.x}
                  y={v.y}
                  fontSize={fs}
                  textAnchor="middle"
                  fill={v.type === 'mer' ? '#5b8fc7' : '#94a3b8'}
                  fontStyle="italic"
                  fontWeight="600"
                  letterSpacing={fs * 0.12}
                  pointerEvents="none"
                >
                  {v.type === 'mer' ? v.nom : v.nom.toUpperCase()}
                </text>
              )
            })}

          {/* Noms des zones de la couche */}
          {noms && nomsZonesAffiches.length > 0 && (
            <g pointerEvents="none" textAnchor="middle" fill="#0f172a" fontWeight="800">
              {nomsZonesAffiches.map((z) => {
                const n = z.lignes.length
                return (
                  <g key={z.id}>
                    {z.trait && <line x1={z.trait[0]} y1={z.trait[1]} x2={z.trait[2]} y2={z.trait[3]} stroke="#0f172a" strokeWidth="1.3" vectorEffect="non-scaling-stroke" />}
                    <text x={z.x} y={z.y - ((n - 1) * z.fs * 1.1) / 2 + z.fs * 0.35} fontSize={z.fs} {...halo(z.fs, 'rgba(255,255,255,0.85)')}>
                      {z.lignes.map((l, i) => (
                        <tspan key={i} x={z.x} dy={i === 0 ? 0 : z.fs * 1.1}>
                          {l}
                        </tspan>
                      ))}
                    </text>
                  </g>
                )
              })}
            </g>
          )}

          {/* Noms des communes (zoom) */}
          {etiquettesCommunes.length > 0 && (
            <g pointerEvents="none" textAnchor="middle" fill="#1e293b" fontWeight="600">
              {etiquettesCommunes.map((c) => {
                const fs = px(11)
                return (
                  <text key={c.id} x={c.centre[0]} y={c.centre[1] + fs * 0.35} fontSize={fs} {...halo(fs, 'rgba(255,255,255,0.9)')}>
                    {c.fr}
                  </text>
                )
              })}
            </g>
          )}

          {/* Noms des rivières */}
          {noms && (
            <g pointerEvents="none" textAnchor="middle" fill={COULEUR_NOM_EAU} fontStyle="italic" fontWeight="700">
              {rivieres.map((r) => {
                const pos = placement.rivieres[r.id]
                if (!pos) return null
                const fs = px(r.genre === 'fleuve' ? 15 : 13)
                return (
                  <text key={r.id} transform={`translate(${pos.x} ${pos.y}) rotate(${pos.angle})`} y={-fs * 0.55} fontSize={fs} {...halo(fs)}>
                    {r.nom}
                  </text>
                )
              })}
            </g>
          )}

          {/* Villes */}
          <g pointerEvents="none">
            {listeVilles.map((v) => {
              const r = px(TAILLES_VILLES[v.type].rayon)
              const fs = px(TAILLES_VILLES[v.type].police)
              const lettre = placement.villes[v.nom]
              return (
                <g key={v.nom}>
                  {v.type === 'capitale' && <polygon points={etoile(v.x, v.y, r)} fill="#dc2626" stroke="#ffffff" strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />}
                  {v.type === 'chef-lieu' && <rect x={v.x - r} y={v.y - r} width={2 * r} height={2 * r} fill="#111827" stroke="#ffffff" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />}
                  {v.type === 'ville' && <circle cx={v.x} cy={v.y} r={r} fill="#374151" stroke="#ffffff" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />}
                  {lettre && (
                    <text
                      x={lettre.x}
                      y={lettre.y}
                      fontSize={fs}
                      textAnchor={lettre.a}
                      fill={v.type === 'capitale' ? '#991b1b' : '#111827'}
                      fontWeight={v.type === 'capitale' ? 800 : v.type === 'chef-lieu' ? 700 : 600}
                      {...halo(fs)}
                    >
                      {v.nom}
                    </text>
                  )}
                </g>
              )
            })}
          </g>
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
        {vue.k > 1.01 && (
          <button type="button" aria-label="Vue entière" className={boutons} onClick={() => setVue({ k: 1, x: 0, y: 0 })}>
            <Maximize2 size={20} />
          </button>
        )}
      </div>

      {/* Nom de la zone touchée */}
      {zoneSelectionnee && (
        <div className="absolute bottom-4 left-4 pointer-events-none">
          <span className="inline-flex items-center gap-2 rounded-2xl bg-white/95 border border-slate-300 px-4 py-2 text-lg font-bold text-slate-900 shadow-md">
            <MapPin size={18} className="shrink-0 text-sky-600" />
            {zoneSelectionnee.nom}
            {zoneSelectionnee.commune && <span className="text-sm font-medium text-slate-500">· {zoneSelectionnee.commune.prov.replace(/^(Province (d'|de |du )|Région de )/, '')}</span>}
          </span>
        </div>
      )}
    </div>
  )
}
