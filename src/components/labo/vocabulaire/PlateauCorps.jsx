import { useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import Corps3D from '../Corps3D.jsx'
import { COULEUR_GENRE, MOT, avecArticle } from './corps.js'
import { CADRES, OS_MOT, ancrage, cadreDe, entourages, partieSousLeDoigt, surUnDoigt } from './zonesCorps.js'

// =============================================================
//  Plateau du vocabulaire : le VRAI squelette 3D (BodyParts3D), vu de face.
//  - la caméra zoome toute seule sur la tête ou la main quand il le faut
//  - toucher le squelette renvoie le mot de la partie touchée (onToucher)
//  - les mots trouvés se collent en étiquettes de chaque côté, avec un trait
//  - les vrais os de la partie trouvée s'allument en vert
//
//  Props : cadre ('corps' | 'tete' | 'main') · trouves [ids] · actif id · anneaux [{ id, couleur, tirets }]
//          poses {…} · onToucher(id | null, { x, y }) · ruban (étiquettes façon étiqueteuse) · className
// =============================================================
let mesure = null
function largeur(texte, taille, police = `800 ${taille}px "Space Grotesk", system-ui, sans-serif`) {
  mesure = mesure || document.createElement('canvas').getContext('2d')
  mesure.font = police
  return mesure.measureText(texte).width
}
// Largeur d'une étiquette (pastille ou ruban) en pixels
const largeurEtiquette = (m, ruban) => (ruban ? largeur(avecArticle(m).toUpperCase(), 13, '900 13px "JetBrains Mono", ui-monospace, monospace') + 28 + 13 * 0.04 * avecArticle(m).length : largeur(avecArticle(m), 14) + 26)

const FOND_RUBAN = { m: '#1F5FBF', f: '#C2297A', pl: '#2E8B3E' }
const ESPACE = 6

// Étiquettes rangées en deux colonnes (gauche / droite), sans se chevaucher
function disposer(items, W, H, hauteur) {
  const sortie = []
  for (const cote of [-1, 1]) {
    const col = items.filter((i) => i.cote === cote).sort((a, b) => a.y - b.y)
    let y = -Infinity
    for (const it of col) {
      y = Math.max(it.y, y + hauteur + 4)
      it.ey = y
    }
    // si ça dépasse en bas, on remonte
    let max = H - hauteur / 2 - 4
    for (let k = col.length - 1; k >= 0; k--) {
      col[k].ey = Math.min(col[k].ey, max)
      max = col[k].ey - hauteur - 4
    }
    for (const it of col) sortie.push(it)
  }
  return sortie
}

export default function PlateauCorps({ cadre = 'corps', trouves = [], actif = null, anneaux = [], poses, onToucher, ruban = false, className = '', cadreInstantane = false, capturerRef = null, titreAffiche = '' }) {
  const racine = useRef(null)
  const outilsRef = useRef(null)
  const [pret, setPret] = useState(false)
  const [proj, setProj] = useState({ ancres: {}, anneaux: [], W: 0, H: 0 })
  const dernier = useRef({ trouves, anneaux })
  dernier.current = { trouves, anneaux }
  const depart = useRef(null)
  const dernierHit = useRef(null)
  const cle = useRef('')

  // Positions à l'écran, recalculées tant que la caméra bouge
  useEffect(() => {
    if (!pret) return
    let raf = 0
    const boucle = () => {
      raf = requestAnimationFrame(boucle)
      const o = outilsRef.current
      const el = racine.current
      if (!o || !el) return
      const { trouves: t, anneaux: a } = dernier.current
      const ancres = {}
      for (const id of t) {
        const p = ancrage(o, id, el.clientWidth, el.clientHeight)
        if (p) ancres[id] = p
      }
      const ring = a.map((r) => ({ ...r, formes: entourages(o, r.id) }))
      const c = JSON.stringify([ancres, ring.map((r) => r.formes), el.clientWidth, el.clientHeight], (k, v) => (typeof v === 'number' ? Math.round(v) : v))
      if (c !== cle.current) {
        cle.current = c
        // mis à jour dans la même image que le rendu 3D : les étiquettes ne « traînent » pas quand la caméra zoome
        flushSync(() => setProj({ ancres, anneaux: ring, W: el.clientWidth, H: el.clientHeight }))
      }
    }
    raf = requestAnimationFrame(boucle)
    return () => cancelAnimationFrame(raf)
  }, [pret])

  // Seul l'os à nommer s'allume (en cyan). Les mots trouvés ne colorent PAS le squelette en vert :
  // certains mots (yeux, nez…) n'ont pas d'os propre, le vert aurait touché seulement bras, jambes…
  const etats = useMemo(() => {
    const e = {}
    if (actif) for (const g of OS_MOT[actif] || []) e[g] = 'actif'
    return e
  }, [actif])

  function bas(e) {
    depart.current = { x: e.clientX, y: e.clientY }
  }
  function haut(e) {
    const d = depart.current
    depart.current = null
    const o = outilsRef.current
    if (!d || !o || !onToucher) return
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 12) return
    const r = racine.current.getBoundingClientRect()
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    let t = partieSousLeDoigt(o, x, y)
    // Si le doigt est pile sur un os de la main : le bas (doigts) ou le haut (paume) ?
    const hit = dernierHit.current
    dernierHit.current = null
    if (hit && performance.now() - hit.t < 300 && hit.groupe === 'main') {
      t = { id: surUnDoigt(hit.point[0], hit.point[1]) && o.pixelsParMetre() >= 900 ? 'doigt' : 'main' }
    }
    onToucher(t?.id ?? null, { x, y })
  }

  // Étiquettes
  const hauteur = 30
  const items = Object.entries(proj.ancres)
    .filter(([, p]) => p.x > 0 && p.x < proj.W && p.y > 0 && p.y < proj.H)
    .map(([id, p]) => ({ id, x: p.x, y: p.y, cote: p.cote, ey: p.y }))
  const rangees = disposer(items, proj.W, proj.H, hauteur)

  // Affiche à enregistrer : le squelette + ses étiquettes, dans une image
  if (capturerRef) {
    capturerRef.current = () => {
      const o = outilsRef.current
      if (!o) return null
      const c = o.capturer()
      const k = c.width / (proj.W || 1)
      const x = c.getContext('2d')
      x.scale(k, k)
      for (const it of rangees) {
        const m = MOT[it.id]
        const couleur = COULEUR_GENRE[m.genre]
        const texte = avecArticle(m)
        const w = largeurEtiquette(m, ruban)
        const ex = it.cote === -1 ? ESPACE + w : proj.W - ESPACE - w
        x.strokeStyle = couleur
        x.lineWidth = 2.5
        x.lineCap = 'round'
        x.beginPath()
        x.moveTo(it.x, it.y)
        x.lineTo(ex, it.ey)
        x.stroke()
        x.fillStyle = couleur
        x.beginPath()
        x.arc(it.x, it.y, 5, 0, Math.PI * 2)
        x.fill()
        const bx = it.cote === -1 ? ESPACE : proj.W - ESPACE - w
        const by = it.ey - hauteur / 2
        x.save()
        x.font = ruban ? '900 13px "JetBrains Mono", ui-monospace, monospace' : '800 14px "Space Grotesk", system-ui, sans-serif'
        x.textBaseline = 'middle'
        x.shadowColor = 'rgba(0,0,0,.5)'
        x.shadowBlur = 6
        if (ruban) {
          x.fillStyle = FOND_RUBAN[m.genre]
          x.beginPath()
          x.moveTo(bx, by)
          x.lineTo(bx + w, by)
          x.lineTo(bx + w - 6, by + hauteur / 2)
          x.lineTo(bx + w, by + hauteur)
          x.lineTo(bx, by + hauteur)
          x.lineTo(bx + 6, by + hauteur / 2)
          x.closePath()
          x.fill()
          x.shadowBlur = 0
          x.fillStyle = '#FFFFFF'
          x.fillText(texte.toUpperCase(), bx + 14, by + hauteur / 2 + 1)
        } else {
          x.fillStyle = 'rgba(7,11,22,.94)'
          x.beginPath()
          x.roundRect(bx, by, w, hauteur, hauteur / 2)
          x.fill()
          x.shadowBlur = 0
          x.strokeStyle = couleur
          x.lineWidth = 2
          x.stroke()
          x.fillStyle = couleur
          const art = m.article
          x.fillText(art, bx + 13, by + hauteur / 2 + 1)
          x.fillStyle = '#FFFFFF'
          x.fillText(m.mot, bx + 13 + x.measureText(art).width + (art.endsWith('’') ? 0 : 5), by + hauteur / 2 + 1)
        }
        x.restore()
      }
      if (titreAffiche) {
        x.font = '900 18px "Space Grotesk", system-ui, sans-serif'
        x.fillStyle = '#FFE45E'
        x.textAlign = 'center'
        x.fillText(titreAffiche, proj.W / 2, 24)
      }
      return c
    }
  }

  return (
    <div ref={racine} className={`relative select-none overflow-hidden ${className}`} onPointerDown={bas} onPointerUp={haut}>
      <Corps3D
        className="h-full w-full"
        cadre={{ ...CADRES[cadre], instantane: cadreInstantane }}
        etats={etats}
        poses={poses}
        onChoisir={(groupe, cote, point) => {
          dernierHit.current = { groupe, cote, point, t: performance.now() }
        }}
        onPret={(o) => {
          outilsRef.current = o
          setPret(true)
        }}
      />

      <svg className="pointer-events-none absolute inset-0 h-full w-full" width={proj.W} height={proj.H}>
        {/* entourages (indice, partie touchée…) */}
        {proj.anneaux.map((r, k) =>
          r.formes.map((f, i) => (
            <g key={`${k}-${i}`} className="labo-pouls">
              <line x1={f.x1} y1={f.y1} x2={f.x2} y2={f.y2} stroke={r.couleur} strokeOpacity={0.22} strokeWidth={f.r * 2} strokeLinecap="round" />
              {f.x1 === f.x2 && f.y1 === f.y2 ? (
                <circle cx={f.x1} cy={f.y1} r={f.r} fill="none" stroke={r.couleur} strokeWidth={3} strokeDasharray={r.tirets ? '7 7' : undefined} />
              ) : (
                <path d={capsule(f)} fill="none" stroke={r.couleur} strokeWidth={3} strokeDasharray={r.tirets ? '7 7' : undefined} />
              )}
            </g>
          )),
        )}
        {/* traits vers les étiquettes */}
        {rangees.map((it) => {
          const m = MOT[it.id]
          const w = largeurEtiquette(m, ruban)
          const ex = it.cote === -1 ? ESPACE + w : proj.W - ESPACE - w
          const c = COULEUR_GENRE[m.genre]
          return (
            <g key={it.id}>
              <line x1={it.x} y1={it.y} x2={ex} y2={it.ey} stroke={c} strokeWidth={2.5} strokeLinecap="round" />
              <circle data-ancre={it.id} cx={it.x} cy={it.y} r={5} fill={c} stroke="#070B16" strokeWidth={1.5} />
            </g>
          )
        })}
      </svg>

      {rangees.map((it) => {
        const m = MOT[it.id]
        const c = COULEUR_GENRE[m.genre]
        const style = { top: it.ey - hauteur / 2, height: hauteur, width: largeurEtiquette(m, ruban), [it.cote === -1 ? 'left' : 'right']: ESPACE }
        return ruban ? (
          <div
            key={it.id}
            className="labo-apparait pointer-events-none absolute flex items-center whitespace-nowrap text-[13px] font-black uppercase tracking-wide text-white shadow-[0_3px_8px_rgba(0,0,0,.55)]"
            style={{ ...style, background: FOND_RUBAN[m.genre], clipPath: 'polygon(0 0,100% 0,calc(100% - 6px) 50%,100% 100%,0 100%,6px 50%)', fontFamily: '"JetBrains Mono", ui-monospace, monospace', paddingLeft: 14, paddingRight: 14 }}
          >
            {avecArticle(m)}
          </div>
        ) : (
          <div key={it.id} className="labo-apparait pointer-events-none absolute flex items-center justify-center whitespace-nowrap rounded-full border-2 bg-[#070B16]/92 text-[14px] font-extrabold text-white" style={{ ...style, borderColor: c }}>
            <span style={{ color: c }}>{m.article}</span>
            <span className={m.article.endsWith('’') ? '' : 'ml-1'}>{m.mot}</span>
          </div>
        )
      })}
    </div>
  )
}

function capsule(f) {
  const dx = f.x2 - f.x1
  const dy = f.y2 - f.y1
  const l = Math.hypot(dx, dy) || 1
  const nx = (-dy / l) * f.r
  const ny = (dx / l) * f.r
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI
  return `M ${f.x1 + nx} ${f.y1 + ny} L ${f.x2 + nx} ${f.y2 + ny} A ${f.r} ${f.r} ${ang} 0 0 ${f.x2 - nx} ${f.y2 - ny} L ${f.x1 - nx} ${f.y1 - ny} A ${f.r} ${f.r} ${ang} 0 0 ${f.x1 + nx} ${f.y1 + ny} Z`
}

export { cadreDe }
