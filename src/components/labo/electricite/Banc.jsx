// =============================================================
//  L'établi électrique : on glisse les composants, on tire des
//  fils d'une borne à l'autre, le circuit est calculé pour de vrai
//  (circuit.js). Courant animé dans les fils, ampoules qui éclairent,
//  hélice qui tourne, sonnette qui sonne, et flammes + fumée en cas
//  de court-circuit. Vue « photo » ou vue « schéma » (symboles).
// =============================================================
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { RotateCw, Trash2, Wrench, X } from 'lucide-react'
import { COMPOSANTS, resoudre } from './circuit.js'
import { BORNES, DefsComposants, Halo, Photo, Symbole } from './Composants.jsx'

export const LARGEUR = 360
export const HAUTEUR = 520
export const ECHELLE = 0.82

const COULEURS_FILS = ['#E0384A', '#1E2230', '#2F7DF6', '#F2C230', '#2DB36A']

export function bornePos(c, b) {
  const [lx, ly] = BORNES[b]
  const a = ((c.rot || 0) * Math.PI) / 180
  return [c.x + (lx * Math.cos(a) - ly * Math.sin(a)) * ECHELLE, c.y + (lx * Math.sin(a) + ly * Math.cos(a)) * ECHELLE]
}

function cheminFil(p, q, vue, dp = [0, 0], dq = [0, 0]) {
  if (vue === 'schema') return { d: `M${p[0]} ${p[1]} L${q[0]} ${q[1]}`, milieu: [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2] }
  // le fil part de la borne vers l'extérieur du composant, puis pend un peu
  const dist = Math.hypot(q[0] - p[0], q[1] - p[1])
  const s = Math.min(46, 10 + dist * 0.12)
  const k = Math.min(60, 22 + dist * 0.18)
  const c1 = [p[0] + dp[0] * k, p[1] + dp[1] * k + s]
  const c2 = [q[0] + dq[0] * k, q[1] + dq[1] * k + s]
  return {
    d: `M${p[0]} ${p[1]} C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${q[0]} ${q[1]}`,
    milieu: [0.125 * p[0] + 0.375 * c1[0] + 0.375 * c2[0] + 0.125 * q[0], 0.125 * p[1] + 0.375 * c1[1] + 0.375 * c2[1] + 0.125 * q[1]],
  }
}

// ---------- Tracé des fils du schéma : angles droits, sans fausse jonction ----------
// Pour chaque fil, on essaie plusieurs tracés et on garde celui qui ne touche
// ni les fils d'un autre nœud, ni les symboles, ni les autres bornes.
const E = 2
function conflit(s, t) {
  const hs = Math.abs(s[0][1] - s[1][1]) < E
  const ht = Math.abs(t[0][1] - t[1][1]) < E
  const [sx1, sx2] = [Math.min(s[0][0], s[1][0]), Math.max(s[0][0], s[1][0])]
  const [sy1, sy2] = [Math.min(s[0][1], s[1][1]), Math.max(s[0][1], s[1][1])]
  const [tx1, tx2] = [Math.min(t[0][0], t[1][0]), Math.max(t[0][0], t[1][0])]
  const [ty1, ty2] = [Math.min(t[0][1], t[1][1]), Math.max(t[0][1], t[1][1])]
  if (hs && ht) return Math.abs(s[0][1] - t[0][1]) < 4 && sx1 < tx2 + E && tx1 < sx2 + E ? 40 : 0
  if (!hs && !ht) return Math.abs(s[0][0] - t[0][0]) < 4 && sy1 < ty2 + E && ty1 < sy2 + E ? 40 : 0
  const [h, v] = hs ? [s, t] : [t, s]
  const y = h[0][1]
  const x = v[0][0]
  const [hx1, hx2] = [Math.min(h[0][0], h[1][0]), Math.max(h[0][0], h[1][0])]
  const [vy1, vy2] = [Math.min(v[0][1], v[1][1]), Math.max(v[0][1], v[1][1])]
  if (x < hx1 - E || x > hx2 + E || y < vy1 - E || y > vy2 + E) return 0
  const bout = Math.abs(x - hx1) < E || Math.abs(x - hx2) < E || Math.abs(y - vy1) < E || Math.abs(y - vy2) < E
  return bout ? 14 : 4
}
function traverseBoite(s, b) {
  const [x1, x2] = [Math.min(s[0][0], s[1][0]), Math.max(s[0][0], s[1][0])]
  const [y1, y2] = [Math.min(s[0][1], s[1][1]), Math.max(s[0][1], s[1][1])]
  return x1 < b[2] && x2 > b[0] && y1 < b[3] && y2 > b[1]
}
function surPoint(s, pt) {
  const [x1, x2] = [Math.min(s[0][0], s[1][0]), Math.max(s[0][0], s[1][0])]
  const [y1, y2] = [Math.min(s[0][1], s[1][1]), Math.max(s[0][1], s[1][1])]
  return pt[0] > x1 - 3 && pt[0] < x2 + 3 && pt[1] > y1 - 3 && pt[1] < y2 + 3
}
function routerSchema(composants, fils, bornes, hauteur, largeur = LARGEUR) {
  const pos = Object.fromEntries(bornes.map((b) => [b.cle, b.pos]))
  // nœuds électriques (les fils d'un même nœud peuvent se toucher)
  const parent = {}
  const trouver = (x) => (parent[x] === x ? x : (parent[x] = trouver(parent[x])))
  for (const k of Object.keys(pos)) parent[k] = k
  for (const f of fils) if (pos[f.a] && pos[f.b]) parent[trouver(f.a)] = trouver(f.b)
  // boîtes des symboles (entre leurs deux bornes)
  const boites = composants.map((c) => {
    const pts = [
      [-26, 6],
      [26, 42],
    ].map(([lx, ly]) => {
      const a = ((c.rot || 0) * Math.PI) / 180
      return [c.x + (lx * Math.cos(a) - ly * Math.sin(a)) * ECHELLE, c.y + (lx * Math.sin(a) + ly * Math.cos(a)) * ECHELLE]
    })
    return [Math.min(pts[0][0], pts[1][0]), Math.min(pts[0][1], pts[1][1]), Math.max(pts[0][0], pts[1][0]), Math.max(pts[0][1], pts[1][1])]
  })
  const poses = [] // { noeud, seg }
  const traces = {}
  for (const f of fils) {
    const p = pos[f.a]
    const q = pos[f.b]
    if (!p || !q) continue
    const noeud = trouver(f.a)
    const cands = []
    if (Math.abs(p[0] - q[0]) < E || Math.abs(p[1] - q[1]) < E) cands.push([p, q])
    const bas = Math.max(p[1], q[1])
    const haut = Math.min(p[1], q[1])
    for (let k = 0; k < 7; k++) cands.push([p, [p[0], bas + 12 + 9 * k], [q[0], bas + 12 + 9 * k], q])
    for (let k = 0; k < 4; k++) cands.push([p, [p[0], haut - 14 - 9 * k], [q[0], haut - 14 - 9 * k], q])
    cands.push([p, [p[0], q[1]], q], [p, [q[0], p[1]], q], [p, [p[0], (p[1] + q[1]) / 2], [q[0], (p[1] + q[1]) / 2], q])
    const gauche = Math.min(p[0], q[0])
    const droite = Math.max(p[0], q[0])
    for (let k = 0; k < 3; k++) {
      cands.push([p, [p[0], p[1] + 12], [gauche - 14 - 9 * k, p[1] + 12], [gauche - 14 - 9 * k, q[1] + 12], [q[0], q[1] + 12], q])
      cands.push([p, [p[0], p[1] + 12], [droite + 14 + 9 * k, p[1] + 12], [droite + 14 + 9 * k, q[1] + 12], [q[0], q[1] + 12], q])
    }
    let meilleur = null
    for (const pts of cands) {
      let score = 0
      let longueur = 0
      const segs = []
      for (let i = 0; i < pts.length - 1; i++) {
        if (Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) < 0.5) continue
        segs.push([pts[i], pts[i + 1]])
        longueur += Math.abs(pts[i + 1][0] - pts[i][0]) + Math.abs(pts[i + 1][1] - pts[i][1])
      }
      for (const s of segs) {
        for (const o of poses) if (o.noeud !== noeud) score += conflit(s, o.seg)
        for (const b of boites) if (traverseBoite(s, b)) score += 30
        for (const [cle, pt] of Object.entries(pos)) if (trouver(cle) !== noeud && surPoint(s, pt)) score += 25
        for (const pt of s) if (pt[1] > hauteur - 4 || pt[1] < 4 || pt[0] < 4 || pt[0] > largeur - 4) score += 50
      }
      score += longueur / 400 + segs.length * 0.05
      if (!meilleur || score < meilleur.score) meilleur = { score, pts, segs }
    }
    for (const s of meilleur.segs) poses.push({ noeud, seg: s })
    const pts = meilleur.pts
    const m = meilleur.segs[Math.floor(meilleur.segs.length / 2)]
    traces[f.id] = {
      d: pts.map((pt, i) => `${i ? 'L' : 'M'}${pt[0].toFixed(1)} ${pt[1].toFixed(1)}`).join(' '),
      milieu: m ? [(m[0][0] + m[1][0]) / 2, (m[0][1] + m[1][1]) / 2] : p,
    }
  }
  return traces
}

let compteur = 0
export const nouvelId = (prefixe = 'c') => `${prefixe}${Date.now().toString(36)}${(compteur++).toString(36)}`

// ---------- L'état d'un banc (composants + fils + résultat) ----------
export function useBanc(initial = {}) {
  const [composants, setComposants] = useState(initial.composants ?? [])
  const [fils, setFils] = useState(initial.fils ?? [])
  const [grillees, setGrillees] = useState(0) // nombre d'ampoules grillées depuis le début
  const resultat = useMemo(() => resoudre(composants, fils), [composants, fils])

  // Une ampoule trop alimentée (3 piles) brille très fort… puis grille (le filament fond)
  useEffect(() => {
    const trop = composants.filter((c) => c.type === 'ampoule' && !c.grillee && resultat.composants[c.id]?.surcharge)
    if (!trop.length) return
    const t = setTimeout(() => {
      setComposants((l) => l.map((c) => (trop.some((x) => x.id === c.id) ? { ...c, grillee: true } : c)))
      setGrillees((n) => n + trop.length)
    }, 2600)
    return () => clearTimeout(t)
  }, [resultat, composants])

  const charger = useCallback((c = [], f = []) => {
    setComposants(c)
    setFils(f)
  }, [])

  return { composants, setComposants, fils, setFils, resultat, grillees, charger }
}

// ---------- Son de la sonnette (Web Audio, sans fichier) ----------
function useBuzz(actif, coupe) {
  const ctx = useRef(null)
  const osc = useRef(null)
  useEffect(() => {
    if (!actif || coupe) return
    try {
      ctx.current = ctx.current || new (window.AudioContext || window.webkitAudioContext)()
      const c = ctx.current
      const o = c.createOscillator()
      const mod = c.createOscillator()
      const g = c.createGain()
      const gm = c.createGain()
      o.type = 'square'
      o.frequency.value = 820
      mod.frequency.value = 22 // le marteau frappe la cloche ~22 fois par seconde
      gm.gain.value = 0.05
      g.gain.value = 0.05
      mod.connect(gm).connect(g.gain)
      o.connect(g).connect(c.destination)
      o.start()
      mod.start()
      osc.current = [o, mod]
    } catch {
      /* pas de son disponible */
    }
    return () => {
      osc.current?.forEach((x) => {
        try {
          x.stop()
        } catch {
          /* déjà arrêté */
        }
      })
      osc.current = null
    }
  }, [actif, coupe])
}

// ---------- Musique de l'enceinte (Web Audio, petite mélodie originale en boucle) ----------
const MELODIE = [523, 659, 784, 659, 587, 698, 880, 698, 523, 659, 784, 1047, 988, 784, 659, 587]
function useMusique(actif, coupe) {
  const ctx = useRef(null)
  useEffect(() => {
    if (!actif || coupe) return
    let arret = false
    let minuteur = null
    try {
      ctx.current = ctx.current || new (window.AudioContext || window.webkitAudioContext)()
      const c = ctx.current
      let i = 0
      const jouer = () => {
        if (arret) return
        const o = c.createOscillator()
        const g = c.createGain()
        o.type = 'triangle'
        o.frequency.value = MELODIE[i % MELODIE.length]
        g.gain.setValueAtTime(0.0001, c.currentTime)
        g.gain.exponentialRampToValueAtTime(0.09, c.currentTime + 0.02)
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.22)
        o.connect(g).connect(c.destination)
        o.start()
        o.stop(c.currentTime + 0.25)
        i++
        minuteur = setTimeout(jouer, 190)
      }
      jouer()
    } catch {
      /* pas de son disponible */
    }
    return () => {
      arret = true
      clearTimeout(minuteur)
    }
  }, [actif, coupe])
}

// ---------- Flamme ----------
function Flamme({ x, y, taille = 1, delai = 0 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${taille})`} style={{ pointerEvents: 'none' }}>
      <g className="elec-flamme" style={{ animationDelay: `${delai}s` }}>
        <path d="M0 0 C-14 -6 -12 -24 -4 -34 C-4 -24 2 -22 3 -30 C10 -20 14 -6 0 0 Z" fill="#FF5A1F" opacity=".92" />
        <path d="M0 -1 C-8 -5 -7 -16 -2 -23 C-1 -16 3 -15 3 -20 C7 -13 8 -4 0 -1 Z" fill="#FFC531" />
        <path d="M0 -2 C-3 -4 -3 -9 0 -12 C2 -8 3 -5 0 -2 Z" fill="#FFF6C8" />
      </g>
      {[0, 0.6, 1.2].map((d, i) => (
        <circle key={d} cx={i * 4 - 4} cy="-30" r="7" fill="#5A5F6E" opacity=".5" className="elec-fumee" style={{ animationDelay: `${d + delai}s`, '--fx': `${(i - 1) * 14}px` }} />
      ))}
    </g>
  )
}

// =============================================================
//  Le banc lui-même
//  props :
//   banc        : objet renvoyé par useBanc
//   vue         : 'photo' | 'schema'
//   editable    : déplacer / brancher / supprimer
//   cablage     : on peut tirer des fils (même si editable = false)
//   fond        : éléments SVG dessinés sous le circuit (ex. maison)
//   onToucher   : (idComposant) => void, quand on touche un composant
//   silence     : coupe le son de la sonnette
//   hauteur     : hauteur du plan (viewBox)
//   largeur     : largeur du plan (viewBox) — E1 a un établi plus large
//   Le bloc garde les proportions du plan (aspect-ratio) : on peut le
//   dimensionner en largeur (téléphone) OU en hauteur (tablette en
//   paysage : classe « tab:h-full tab:w-auto »).
// =============================================================
export default function Banc({ banc, vue = 'photo', editable = true, cablage = editable, fond, onToucher, silence = false, hauteur = HAUTEUR, largeur = LARGEUR, className = '', compact = false, retirer = true, style }) {
  const { composants, setComposants, fils, setFils, resultat } = banc
  const svg = useRef(null)
  const [selection, setSelection] = useState(null) // { type: 'c'|'f', id }
  const [attente, setAttente] = useState(null) // borne choisie, en attente d'une 2e borne
  const geste = useRef(null)
  const [tirage, setTirage] = useState(null) // fil en cours de tirage { de, x, y }

  const parId = useMemo(() => Object.fromEntries(composants.map((c) => [c.id, c])), [composants])
  const bornes = useMemo(() => {
    const l = []
    for (const c of composants) for (const b of [0, 1]) {
        const a = ((c.rot || 0) * Math.PI) / 180
        const sx = b ? 1 : -1
        l.push({ cle: `${c.id}:${b}`, c, pos: bornePos(c, b), dir: [sx * Math.cos(a), sx * Math.sin(a)] })
      }
    return l
  }, [composants])
  const posBorne = (cle) => bornes.find((b) => b.cle === cle)?.pos
  const traces = useMemo(() => (vue === 'schema' ? routerSchema(composants, fils, bornes, hauteur, largeur) : null), [vue, composants, fils, bornes, hauteur, largeur])
  const dirBorne = (cle) => bornes.find((b) => b.cle === cle)?.dir
  const chemin = (f, p, q) => traces?.[f.id] ?? cheminFil(p, q, 'photo', dirBorne(f.a), dirBorne(f.b))

  const sonne = composants.some((c) => c.type === 'sonnette' && resultat.composants[c.id]?.sonne) && !resultat.courtCircuit
  useBuzz(sonne, silence)
  const musique = composants.some((c) => c.type === 'enceinte' && resultat.composants[c.id]?.joue) && !resultat.courtCircuit
  useMusique(musique, silence)

  // effacer la sélection si l'élément a disparu
  useEffect(() => {
    if (selection?.type === 'c' && !parId[selection.id]) setSelection(null)
    if (selection?.type === 'f' && !fils.some((f) => f.id === selection.id)) setSelection(null)
  }, [parId, fils, selection])

  const point = (e) => {
    const m = svg.current.getScreenCTM()
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())
    return [p.x, p.y]
  }

  const relier = (a, b) => {
    if (!a || !b || a === b) return
    if (a.split(':')[0] === b.split(':')[0] && parId[a.split(':')[0]]?.type !== 'pile') {
      // un fil entre les deux bornes d'un même composant : court-circuit du composant (autorisé, c'est une erreur classique)
    }
    setFils((l) => (l.some((f) => (f.a === a && f.b === b) || (f.a === b && f.b === a)) ? l : [...l, { id: nouvelId('f'), a, b }]))
  }

  const actionComposant = (c, appui) => {
    if (c.type === 'interrupteur' && appui) setComposants((l) => l.map((x) => (x.id === c.id ? { ...x, ferme: !x.ferme } : x)))
    if (c.type === 'poussoir') setComposants((l) => l.map((x) => (x.id === c.id ? { ...x, presse: appui } : x)))
  }

  function downComposant(e, c) {
    e.stopPropagation()
    const action = e.target.closest?.('[data-action]')
    if (action && (c.type === 'interrupteur' || c.type === 'poussoir')) {
      actionComposant(c, true)
      geste.current = { type: 'action', c }
      svg.current.setPointerCapture?.(e.pointerId)
      return
    }
    const [x, y] = point(e)
    geste.current = { type: 'drag', id: c.id, dx: c.x - x, dy: c.y - y, x0: x, y0: y, bouge: false, peut: editable && !c.fixe }
    svg.current.setPointerCapture?.(e.pointerId)
  }

  function downBorne(e, cle) {
    e.stopPropagation()
    if (!cablage) return
    const [x, y] = point(e)
    geste.current = { type: 'fil', de: cle, x0: x, y0: y, bouge: false }
    svg.current.setPointerCapture?.(e.pointerId)
  }

  function move(e) {
    const g = geste.current
    if (!g) return
    const [x, y] = point(e)
    if (g.type === 'drag') {
      if (!g.bouge && Math.hypot(x - g.x0, y - g.y0) > 6) g.bouge = true
      if (g.bouge && g.peut) {
        const nx = Math.max(40, Math.min(largeur - 40, x + g.dx))
        const ny = Math.max(60, Math.min(hauteur - 30, y + g.dy))
        setComposants((l) => l.map((c) => (c.id === g.id ? { ...c, x: Math.round(nx), y: Math.round(ny) } : c)))
      }
    } else if (g.type === 'fil') {
      if (!g.bouge && Math.hypot(x - g.x0, y - g.y0) > 8) g.bouge = true
      if (g.bouge) setTirage({ de: g.de, x, y })
    }
  }

  function up(e) {
    const g = geste.current
    geste.current = null
    setTirage(null)
    if (!g) return
    if (g.type === 'action') {
      actionComposant(g.c, false)
      return
    }
    if (g.type === 'drag') {
      if (!g.bouge) {
        setAttente(null)
        if (onToucher) onToucher(g.id)
        setSelection((s) => (s?.type === 'c' && s.id === g.id ? null : { type: 'c', id: g.id }))
      }
      return
    }
    if (g.type === 'fil') {
      if (g.bouge) {
        const [x, y] = point(e)
        const proche = bornes.filter((b) => b.cle !== g.de).map((b) => ({ b, d: Math.hypot(b.pos[0] - x, b.pos[1] - y) })).sort((a, b) => a.d - b.d)[0]
        if (proche && proche.d < 32) relier(g.de, proche.b.cle)
        setAttente(null)
      } else if (attente && attente !== g.de) {
        relier(attente, g.de)
        setAttente(null)
      } else {
        setAttente(attente === g.de ? null : g.de)
        setSelection(null)
      }
    }
  }

  const choisi = selection?.type === 'c' ? parId[selection.id] : null
  const filChoisi = selection?.type === 'f' ? fils.find((f) => f.id === selection.id) : null

  const piles = composants.filter((c) => c.type === 'pile')
  const filsChauds = fils.filter((f) => resultat.fils[f.id]?.chauffe)
  const papier = vue === 'schema'

  return (
    <div className={`relative ${className}`} style={{ aspectRatio: `${largeur} / ${hauteur}`, ...style }}>
      <svg
        ref={svg}
        viewBox={`0 0 ${largeur} ${hauteur}`}
        className="block h-full w-full touch-none select-none rounded-[22px]"
        style={{ background: papier ? '#F7F5EE' : '#141B2E' }}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerDown={() => {
          setSelection(null)
          setAttente(null)
        }}
      >
        <DefsComposants />
        <defs>
          <pattern id="el-trous" width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="9" cy="9" r="1.6" fill="#0A0F1C" />
            <circle cx="9" cy="8.4" r="1.6" fill="#2A3554" opacity=".35" />
          </pattern>
          <pattern id="el-carreaux" width="12" height="12" patternUnits="userSpaceOnUse">
            <path d="M12 0 L0 0 L0 12" fill="none" stroke="#C9D6E8" strokeWidth=".6" />
          </pattern>
        </defs>
        <rect width={largeur} height={hauteur} fill={papier ? 'url(#el-carreaux)' : 'url(#el-trous)'} />
        {!papier && <rect width={largeur} height={hauteur} fill={`rgba(255,220,120,${Math.min(0.22, resultat.lumiere * 0.16)})`} style={{ transition: 'fill .5s' }} />}
        {fond}

        {/* halos de lumière, sous tout le reste */}
        {!papier &&
          composants.map((c) => (
            <g key={`h${c.id}`} transform={`translate(${c.x} ${c.y}) rotate(${c.rot || 0}) scale(${ECHELLE})`} style={{ pointerEvents: 'none' }}>
              <g transform={`rotate(${-(c.rot || 0)} 0 -36)`}>
                <Halo c={c} r={resultat.composants[c.id]} />
              </g>
            </g>
          ))}

        {/* fils chauffés (court-circuit) : lueur rouge */}
        {filsChauds.map((f) => {
          const p = posBorne(f.a)
          const q = posBorne(f.b)
          if (!p || !q) return null
          return <path key={`ch${f.id}`} d={chemin(f, p, q).d} stroke="#FF4A1A" strokeWidth="11" fill="none" opacity=".55" className="elec-chauffe" style={{ filter: 'blur(3px)' }} />
        })}

        {/* composants */}
        {composants.map((c) => {
          const actif = choisi?.id === c.id
          return (
            <g key={c.id} transform={`translate(${c.x} ${c.y}) rotate(${c.rot || 0}) scale(${ECHELLE})`} onPointerDown={(e) => downComposant(e, c)} style={{ cursor: editable && !c.fixe ? 'grab' : 'pointer' }}>
              {actif && <rect x="-58" y="-70" width="116" height="114" rx="14" fill="none" stroke={papier ? '#2F7DF6' : '#FFE45E'} strokeWidth="2" strokeDasharray="6 5" />}
              {papier ? <Symbole c={c} /> : <Photo c={c} r={resultat.composants[c.id] ?? {}} />}
              {c.etiquette && (
                <text x="0" y={papier ? -12 : 52} textAnchor="middle" fontSize="11" fontWeight="800" fill={papier ? '#151A26' : '#E8ECFF'} transform={`rotate(${-(c.rot || 0)} 0 ${papier ? -12 : 52})`}>
                  {c.etiquette}
                </text>
              )}
            </g>
          )
        })}

        {/* fils */}
        {fils.map((f, i) => {
          const p = posBorne(f.a)
          const q = posBorne(f.b)
          if (!p || !q) return null
          const { d } = chemin(f, p, q)
          const courant = resultat.fils[f.id]?.courant ?? 0
          const couleur = f.couleur ?? COULEURS_FILS[i % COULEURS_FILS.length]
          const actif = filChoisi?.id === f.id
          const duree = Math.max(0.18, Math.min(4, 0.32 / Math.max(1e-3, Math.abs(courant))))
          return (
            <g key={f.id}>
              <path
                d={d}
                stroke="transparent"
                strokeWidth="13"
                fill="none"
                onPointerDown={(e) => {
                  e.stopPropagation()
                  setAttente(null)
                  setSelection({ type: 'f', id: f.id })
                }}
              />
              {papier ? (
                <path d={d} stroke={actif ? '#2F7DF6' : '#151A26'} strokeWidth="2.4" fill="none" style={{ pointerEvents: 'none' }} />
              ) : (
                <g style={{ pointerEvents: 'none' }}>
                  <path d={d} stroke="#05070D" strokeWidth="6.5" fill="none" strokeLinecap="round" opacity=".55" transform="translate(0 2.5)" />
                  <path d={d} stroke={actif ? '#FFE45E' : couleur} strokeWidth="5" fill="none" strokeLinecap="round" />
                  <path d={d} stroke="#FFFFFF" strokeOpacity=".22" strokeWidth="1.4" fill="none" strokeLinecap="round" transform="translate(-.8 -1.2)" />
                </g>
              )}
              {courant !== 0 && (
                <path
                  d={d}
                  stroke={papier ? '#F28A00' : Math.abs(courant) > 1.5 ? '#FFFFFF' : '#FFF3A6'}
                  strokeWidth={papier ? 3.2 : 3}
                  strokeLinecap="round"
                  fill="none"
                  className="elec-courant"
                  style={{ pointerEvents: 'none', animationDuration: `${duree}s`, animationDirection: courant > 0 ? 'normal' : 'reverse' }}
                />
              )}
              {!papier &&
                [p, q].map((pt, j) => (
                  <g key={j} transform={`translate(${pt[0]} ${pt[1]})`} style={{ pointerEvents: 'none' }}>
                    <rect x="-5" y="-3" width="10" height="13" rx="2" fill={couleur} stroke="#05070D" strokeWidth=".6" />
                    <rect x="-3.5" y="-5" width="7" height="5" rx="1" fill="url(#el-metal)" />
                  </g>
                ))}
            </g>
          )
        })}

        {/* leviers et boutons : au-dessus des fils pour rester faciles à toucher */}
        {composants
          .filter((c) => c.type === 'interrupteur' || c.type === 'poussoir')
          .map((c) => {
            const [lx, ly] = papier ? (c.type === 'interrupteur' ? [0, 16] : [0, 10]) : c.type === 'interrupteur' ? [6, -16] : [0, -24]
            return (
              <g key={`act${c.id}`} transform={`translate(${c.x} ${c.y}) rotate(${c.rot || 0}) scale(${ECHELLE})`}>
                <circle
                  cx={lx}
                  cy={ly}
                  r="20"
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    actionComposant(c, true)
                    geste.current = { type: 'action', c }
                    svg.current.setPointerCapture?.(e.pointerId)
                  }}
                />
              </g>
            )
          })}

        {/* fil en cours de tirage */}
        {tirage && posBorne(tirage.de) && (
          <path d={cheminFil(posBorne(tirage.de), [tirage.x, tirage.y], vue, dirBorne(tirage.de)).d} stroke={papier ? '#2F7DF6' : '#FFE45E'} strokeWidth="4" strokeDasharray="7 6" fill="none" strokeLinecap="round" style={{ pointerEvents: 'none' }} />
        )}

        {/* bornes (zones tactiles) */}
        {bornes.map((b) => {
          const choisie = attente === b.cle
          return (
            <g key={b.cle} onPointerDown={(e) => downBorne(e, b.cle)}>
              <circle cx={b.pos[0]} cy={b.pos[1]} r="19" fill="transparent" />
              {(choisie || (attente && cablage)) && (
                <circle cx={b.pos[0]} cy={b.pos[1]} r={choisie ? 11 : 8} fill="none" stroke={papier ? '#2F7DF6' : '#FFE45E'} strokeWidth={choisie ? 3 : 1.6} opacity={choisie ? 1 : 0.6} className={choisie ? 'labo-pulse' : ''} style={{ pointerEvents: 'none' }} />
              )}
            </g>
          )
        })}

        {/* court-circuit : flammes sur la pile et les fils */}
        {resultat.courtCircuit && (
          <g style={{ pointerEvents: 'none' }}>
            {piles
              .filter((p) => resultat.composants[p.id]?.courtCircuit)
              .map((p) => (
                <g key={`fl${p.id}`}>
                  <Flamme x={p.x - 14} y={p.y - 30} taille={1.1} />
                  <Flamme x={p.x + 12} y={p.y - 36} taille={0.9} delai={0.15} />
                </g>
              ))}
            {filsChauds.slice(0, 4).map((f, i) => {
              const p = posBorne(f.a)
              const q = posBorne(f.b)
              if (!p || !q) return null
              const m = chemin(f, p, q).milieu
              return <Flamme key={`ff${f.id}`} x={m[0]} y={m[1]} taille={0.8} delai={i * 0.1} />
            })}
          </g>
        )}
      </svg>

      {/* bulle d'aide pendant le câblage */}
      {attente && (
        <div className="pointer-events-none absolute inset-x-3 top-3 rounded-xl bg-[#070B16]/90 px-3 py-2 text-center text-[13px] font-bold text-[#FFE45E]">
          Touche une 2e borne pour brancher le fil
        </div>
      )}

      {/* barre d'outils de la sélection */}
      {(choisi || filChoisi) && !compact && (
        <div className="absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-2xl border border-white/15 bg-[#0B1122]/95 p-2 text-[#E8ECFF] shadow-lg">
          <p className="min-w-0 flex-1 truncate px-1 text-[13px] font-bold">
            {choisi ? COMPOSANTS[choisi.type]?.nomComplet : 'Fil de connexion'}
            {choisi?.grillee && <span className="text-[#FF8A95]"> · grillée</span>}
            {choisi?.vide && <span className="text-[#FF8A95]"> · usée</span>}
          </p>
          {choisi?.grillee && (
            <OutilBouton onClick={() => setComposants((l) => l.map((c) => (c.id === choisi.id ? { ...c, grillee: false } : c)))} label="Changer l’ampoule">
              <Wrench size={16} /> Changer
            </OutilBouton>
          )}
          {choisi?.vide && (
            <OutilBouton onClick={() => setComposants((l) => l.map((c) => (c.id === choisi.id ? { ...c, vide: false } : c)))} label="Changer la pile">
              <Wrench size={16} /> Pile neuve
            </OutilBouton>
          )}
          {choisi?.type === 'objet' && choisi.materiau === 'isolant' && choisi.remplacable && (
            <OutilBouton onClick={() => setComposants((l) => l.map((c) => (c.id === choisi.id ? { ...c, materiau: 'metal', objet: 'trombone' } : c)))} label="Remplacer par un trombone">
              <Wrench size={16} /> Trombone
            </OutilBouton>
          )}
          {choisi && editable && !choisi.fixe && (
            <OutilBouton onClick={() => setComposants((l) => l.map((c) => (c.id === choisi.id ? { ...c, rot: ((c.rot || 0) + 90) % 360 } : c)))} label="Tourner">
              <RotateCw size={16} />
            </OutilBouton>
          )}
          {((choisi && editable && retirer && !choisi.fixe) || (filChoisi && cablage && !filChoisi.fixe)) && (
            <OutilBouton
              danger
              label="Retirer"
              onClick={() => {
                if (choisi) {
                  setComposants((l) => l.filter((c) => c.id !== choisi.id))
                  setFils((l) => l.filter((f) => !f.a.startsWith(`${choisi.id}:`) && !f.b.startsWith(`${choisi.id}:`)))
                } else setFils((l) => l.filter((f) => f.id !== filChoisi.id))
                setSelection(null)
              }}
            >
              <Trash2 size={16} />
            </OutilBouton>
          )}
          <OutilBouton label="Fermer" onClick={() => setSelection(null)}>
            <X size={16} />
          </OutilBouton>
        </div>
      )}
    </div>
  )
}

function OutilBouton({ children, onClick, label, danger }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-10 min-w-10 items-center justify-center gap-1 rounded-xl border px-2.5 text-[13px] font-bold active:scale-95"
      style={danger ? { borderColor: '#FF8A9566', color: '#FF8A95' } : { borderColor: 'rgba(232,236,255,.2)' }}
    >
      {children}
    </button>
  )
}

// ---------- Page électricité : la pièce s'éclaire avec les ampoules ----------
export function Ambiance({ lumiere = 0, courtCircuit = false }) {
  const l = Math.min(1, lumiere)
  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-30 transition-[background] duration-700" style={{ background: `rgba(1,2,8,${0.18 * (1 - l)})` }} />
      <div
        className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-700"
        style={{ opacity: l, background: 'radial-gradient(ellipse at 50% 35%, rgba(255,214,120,.22), rgba(255,190,80,.06) 55%, transparent 75%)', mixBlendMode: 'screen' }}
      />
      {courtCircuit && (
        <>
          <div className="elec-alerte pointer-events-none fixed inset-0 z-30" style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(255,40,20,.9))' }} />
          <div className="pointer-events-none fixed inset-x-4 top-[max(12px,env(safe-area-inset-top))] z-40 mx-auto max-w-md rounded-2xl border-2 border-[#FF5A1F] bg-[#2A0A06]/95 px-4 py-2 text-center">
            <p className="labo-titre text-base font-black text-[#FFB08A]">🔥 COURT-CIRCUIT !</p>
            <p className="text-[13px] text-[#FFE0D6]">Les deux bornes de la pile sont reliées sans récepteur : le courant est énorme, les fils et la pile chauffent. Débranche vite un fil !</p>
          </div>
        </>
      )}
    </>
  )
}

// Petit dessin d'un composant pour le magasin
export function Vignette({ type, vue = 'photo', taille = 64 }) {
  const c = { id: 'v', type, ferme: false }
  return (
    <svg viewBox="-56 -72 112 116" width={taille} height={taille * (116 / 112)} aria-hidden="true">
      <DefsComposants />
      {vue === 'schema' ? <Symbole c={c} /> : <Photo c={c} r={{}} />}
    </svg>
  )
}

// Un circuit figé (non modifiable), en photo ou en schéma.
// apercu = true : on n'affiche pas le résultat (ampoules éteintes, pas de courant).
const RIEN = { composants: {}, fils: {}, courtCircuit: false, lumiere: 0, actif: false }
export function CircuitFige({ circuit, vue = 'photo', hauteur = 330, apercu = false, className = '', style }) {
  const banc = useMemo(
    () => ({ ...circuit, resultat: apercu ? RIEN : resoudre(circuit.composants, circuit.fils), setComposants: () => {}, setFils: () => {} }),
    [circuit, apercu],
  )
  return <Banc banc={banc} vue={vue} editable={false} cablage={false} compact silence hauteur={hauteur} className={className} style={style} />
}
