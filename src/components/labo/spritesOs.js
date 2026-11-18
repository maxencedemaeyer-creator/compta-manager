import * as THREE from 'three'
import { chargerAnatomie } from './anatomie.js'

// =============================================================
//  Les VRAIS os 3D (BodyParts3D, CC BY 4.0 — les mêmes qu'à
//  l'activité A2) transformés en « images d'os » : chaque os est
//  photographié une fois (vue de face, éclairée) puis collé par
//  le miroir à rayons X (A1) sur le corps ou la main détectés.
//  Une image d'os est étirée le long de l'os (de l'articulation
//  A à l'articulation B) : raccourcie quand l'os pointe vers la
//  caméra, comme dans la vraie vie.
// =============================================================

const IVOIRE = '#EFE6CC'
let promesseCorps = null
let promesseMain = null

// ---------- Fabrication d'une image d'os ----------
// Coordonnées « modèle 2D » : x vers la droite, y vers le BAS (y du modèle inversé).
function photographier(rendu, geos, { px = 760, max = 460 } = {}) {
  const boite = new THREE.Box3()
  for (const g of geos) {
    g.computeBoundingBox()
    boite.union(g.boundingBox)
  }
  const l = boite.max.x - boite.min.x
  const h = boite.max.y - boite.min.y
  const S = Math.min(px, max / Math.max(l, h))
  const marge = 3
  const w = Math.ceil(l * S) + marge * 2
  const hh = Math.ceil(h * S) + marge * 2
  const x0 = boite.min.x - marge / S
  const y1 = boite.max.y + marge / S
  rendu.setSize(w, hh, false)
  const scene = new THREE.Scene()
  const cam = new THREE.OrthographicCamera(x0, x0 + w / S, y1, y1 - hh / S, 0.01, 20)
  cam.position.set(0, 0, 10)
  scene.add(new THREE.AmbientLight('#ffffff', 1.15))
  const d1 = new THREE.DirectionalLight('#ffffff', 1.5)
  d1.position.set(0.4, 0.7, 1)
  scene.add(d1)
  const d2 = new THREE.DirectionalLight('#9fb8ff', 0.5)
  d2.position.set(-0.8, -0.3, 0.6)
  scene.add(d2)
  const mat = new THREE.MeshStandardMaterial({ color: IVOIRE, roughness: 0.6, metalness: 0.02, side: THREE.DoubleSide })
  for (const g of geos) scene.add(new THREE.Mesh(g, mat))
  rendu.render(scene, cam)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = hh
  canvas.getContext('2d').drawImage(rendu.domElement, 0, 0)
  mat.dispose()
  return { canvas, S, origine: [x0, -y1] } // origine = coin haut-gauche en « modèle 2D »
}

function nouveauRendu() {
  const rendu = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true })
  rendu.setClearColor(0x000000, 0)
  rendu.setPixelRatio(1)
  return rendu
}

// ---------- Squelette entier (os de l'activité A2) ----------
export function chargerSpritesCorps() {
  if (!promesseCorps) {
    promesseCorps = chargerAnatomie().then(({ pieces, pivots }) => {
      const rendu = nouveauRendu()
      const geos = (groupes, cote) => pieces.filter((p) => groupes.includes(p.groupe) && (cote === undefined || p.cote === cote || p.cote === '')).map((p) => p.geo)
      const photo = (groupes, cote) => {
        const g = geos(groupes, cote)
        return g.length ? photographier(rendu, g) : null
      }
      const xy = (v) => [v.x, -v.y]
      const sprites = { pivots: {}, os: {} }
      for (const [k, v] of Object.entries(pivots)) sprites.pivots[k] = xy(v)
      sprites.os.crane = photo(['crane'])
      sprites.os.tronc = photo(['vertebres', 'disques', 'cotes', 'cartilages', 'sternum'])
      sprites.os.bassin = photo(['bassin'])
      for (const c of ['d', 'g']) {
        sprites.os[`clavicule_${c}`] = photo(['clavicule', 'omoplate'], c)
        sprites.os[`humerus_${c}`] = photo(['humerus'], c)
        sprites.os[`avantbras_${c}`] = photo(['radius', 'cubitus'], c)
        sprites.os[`main_${c}`] = photo(['main'], c)
        sprites.os[`femur_${c}`] = photo(['femur', 'rotule'], c)
        sprites.os[`jambe_${c}`] = photo(['tibia', 'perone'], c)
        sprites.os[`pied_${c}`] = photo(['pied'], c)
      }
      // Largeur du crâne (pour caler sur l'écartement des oreilles)
      const cr = pieces.find((p) => p.groupe === 'crane')
      if (cr) {
        const b = cr.geo.boundingBox
        sprites.crane = { largeur: b.max.x - b.min.x, centre: [(b.max.x + b.min.x) / 2, -(b.max.y + b.min.y) / 2] }
      }
      rendu.dispose()
      rendu.forceContextLoss?.()
      return sprites
    })
    promesseCorps.catch(() => (promesseCorps = null))
  }
  return promesseCorps
}

// ---------- Main : os de la main (BodyParts3D, os séparés) ----------
export function chargerSpritesMain() {
  if (!promesseMain) {
    promesseMain = Promise.all([fetch('/labo/anatomie/membre.json').then((r) => r.json()), fetch('/labo/anatomie/membre.bin').then((r) => r.arrayBuffer())]).then(([m, buf]) => {
      const rendu = nouveauRendu()
      const os = {}
      for (const [cle, p] of Object.entries(m.pieces)) {
        if (cle === 'humerus') continue
        const g = new THREE.BufferGeometry()
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(buf, p.positions, p.sommets * 3), 3))
        g.setIndex(new THREE.BufferAttribute(new Uint16Array(buf, p.indices, p.nIndices), 1))
        g.computeVertexNormals()
        g.computeBoundingBox()
        os[cle] = { ...photographier(rendu, [g], { max: 360 }), longueur: p.longueur, largeur: p.largeur }
      }
      rendu.dispose()
      rendu.forceContextLoss?.()
      return os
    })
    promesseMain.catch(() => (promesseMain = null))
  }
  return promesseMain
}

// ---------- Collage d'une image d'os sur l'écran ----------
// L'os va de A à B (modèle 2D) ; à l'écran il va de a à b.
// alpha = étirement le long de l'os, beta = épaisseur (échelle du corps).
function matrice(A, B, a, b, alpha, beta, reflechi) {
  const ux = B[0] - A[0]
  const uy = B[1] - A[1]
  const lm = Math.hypot(ux, uy) || 1
  const um = [ux / lm, uy / lm]
  const nm = [-um[1], um[0]]
  const l = Math.hypot(b.x - a.x, b.y - a.y) || 1
  const us = [(b.x - a.x) / l, (b.y - a.y) / l]
  const sg = reflechi ? -1 : 1
  const ns = [-us[1] * sg, us[0] * sg]
  return [
    alpha * us[0] * um[0] + beta * ns[0] * nm[0],
    alpha * us[0] * um[1] + beta * ns[0] * nm[1],
    alpha * us[1] * um[0] + beta * ns[1] * nm[0],
    alpha * us[1] * um[1] + beta * ns[1] * nm[1],
  ]
}

function coller(ctx, sprite, M, A, a) {
  if (!sprite) return
  const [ox, oy] = sprite.origine
  const S = sprite.S
  const tx = a.x + M[0] * (ox - A[0]) + M[1] * (oy - A[1])
  const ty = a.y + M[2] * (ox - A[0]) + M[3] * (oy - A[1])
  ctx.save()
  ctx.transform(M[0] / S, M[2] / S, M[1] / S, M[3] / S, tx, ty)
  ctx.drawImage(sprite.canvas, 0, 0)
  ctx.restore()
}

const ok = (p) => p && (p.visibility ?? 1) > 0.5
const milieu = (a, b, t = 0.5) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
const mil2 = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]

// Dessine tout le squelette. c = points écran (voir MiroirView : epauleG, coudeG, …, tete)
export function dessinerSquelette(ctx, sp, c) {
  const pv = sp.pivots
  if (!ok(c.epauleG) || !ok(c.epauleD)) return false
  const cou = milieu(c.epauleG, c.epauleD)
  const bassin = ok(c.hancheG) && ok(c.hancheD) ? milieu(c.hancheG, c.hancheD) : null
  const largeurEp = dist(c.epauleG, c.epauleD)
  const largeurEpModele = Math.hypot(pv.epaule_g[0] - pv.epaule_d[0], pv.epaule_g[1] - pv.epaule_d[1]) || 0.35
  const k = largeurEp / largeurEpModele // pixels par mètre du modèle (épaisseur des os)

  // Le miroir (caméra selfie) inverse la gauche et la droite
  const sModele = [1, 0]
  const hautModele = [0, -1]
  const sEcran = [c.epauleG.x - c.epauleD.x, c.epauleG.y - c.epauleD.y]
  const hautEcran = bassin ? [cou.x - bassin.x, cou.y - bassin.y] : [0, -1]
  const croix = (u, v) => u[0] * v[1] - u[1] * v[0]
  const reflechi = croix(sModele, hautModele) * croix(sEcran, hautEcran) < 0

  const segment = (nom, Aa, Bb, a, b, epaisseur = k) => {
    const sprite = sp.os[nom]
    if (!sprite || !a || !b) return
    const A = Aa
    const B = Bb
    const lm = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1
    const ls = dist(a, b)
    if (ls < 4) return
    coller(ctx, sprite, matrice(A, B, a, b, ls / lm, epaisseur, reflechi), A, a)
  }

  ctx.save()
  ctx.imageSmoothingQuality = 'high'
  ctx.shadowColor = '#8FF4FF'
  ctx.shadowBlur = 8
  ctx.globalAlpha = 0.97

  // Bassin
  if (bassin && ok(c.hancheG) && ok(c.hancheD)) {
    const A = pv.hanche_d
    const B = pv.hanche_g
    const l = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1
    coller(ctx, sp.os.bassin, matrice(A, B, c.hancheD, c.hancheG, dist(c.hancheD, c.hancheG) / l, k, reflechi), A, c.hancheD)
  }
  // Tronc : colonne, côtes, sternum, clavicules (du cou jusqu'au milieu du bassin)
  if (bassin) {
    const A = mil2(pv.epaule_d, pv.epaule_g)
    const B = mil2(pv.hanche_d, pv.hanche_g)
    const lm = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1
    coller(ctx, sp.os.tronc, matrice(A, B, cou, bassin, dist(cou, bassin) / lm, k, reflechi), A, cou)
    // clavicules / omoplates : collées au tronc
    for (const cote of ['d', 'g']) coller(ctx, sp.os[`clavicule_${cote}`], matrice(A, B, cou, bassin, dist(cou, bassin) / lm, k, reflechi), A, cou)
  }
  // Crâne : cale sur les oreilles
  if (ok(c.oreilleG) && ok(c.oreilleD) && sp.crane) {
    const ec = dist(c.oreilleG, c.oreilleD)
    const kt = ec / sp.crane.largeur
    const A = sp.crane.centre
    const B = [A[0] + 1, A[1]]
    const centre = milieu(c.oreilleD, c.oreilleG)
    const haut = ok(c.nez) ? Math.max(0, centre.y - c.nez.y) : 0
    const decalage = [-(c.oreilleG.y - c.oreilleD.y), c.oreilleG.x - c.oreilleD.x]
    const nrm = Math.hypot(decalage[0], decalage[1]) || 1
    const sens = reflechi ? 1 : -1
    const a = { x: centre.x + (decalage[0] / nrm) * sens * ec * 0.12, y: centre.y + (decalage[1] / nrm) * sens * ec * 0.12 }
    coller(ctx, sp.os.crane, matrice(A, B, a, { x: a.x + (c.oreilleG.x - c.oreilleD.x), y: a.y + (c.oreilleG.y - c.oreilleD.y) }, kt, kt, reflechi), A, a)
    void haut
  }
  // Bras
  for (const [cote, G] of [['d', 'D'], ['g', 'G']]) {
    const epaule = c[`epaule${G}`]
    const coude = c[`coude${G}`]
    const poignet = c[`poignet${G}`]
    if (ok(epaule) && ok(coude)) segment(`humerus_${cote}`, pv[`epaule_${cote}`], pv[`coude_${cote}`], epaule, coude)
    if (ok(coude) && ok(poignet)) {
      segment(`avantbras_${cote}`, pv[`coude_${cote}`], pv[`poignet_${cote}`], coude, poignet)
      // la main suit l'avant-bras (même axe, même étirement)
      segment(`main_${cote}`, pv[`coude_${cote}`], pv[`poignet_${cote}`], coude, poignet)
    }
  }
  // Jambes
  for (const [cote, G] of [['d', 'D'], ['g', 'G']]) {
    const hanche = c[`hanche${G}`]
    const genou = c[`genou${G}`]
    const cheville = c[`cheville${G}`]
    if (ok(hanche) && ok(genou)) segment(`femur_${cote}`, pv[`hanche_${cote}`], pv[`genou_${cote}`], hanche, genou)
    if (ok(genou) && ok(cheville)) {
      segment(`jambe_${cote}`, pv[`genou_${cote}`], pv[`cheville_${cote}`], genou, cheville)
      segment(`pied_${cote}`, pv[`genou_${cote}`], pv[`cheville_${cote}`], genou, cheville)
    }
  }
  ctx.restore()
  return true
}

// Dessine les os de la main. Lm = 21 points écran de MediaPipe.
export function dessinerSqueletteMain(ctx, sp, Lm) {
  ctx.imageSmoothingQuality = 'high'
  const W = Lm[0]
  const axe = { x: Lm[9].x - W.x, y: Lm[9].y - W.y }
  const longAxe = Math.hypot(axe.x, axe.y) || 1
  const hs = longAxe / 0.095 // pixels par mètre (poignet → articulation du majeur ≈ 9,5 cm)
  const travers = { x: Lm[5].x - Lm[17].x, y: Lm[5].y - Lm[17].y }
  const os = (nom, a, b) => {
    const s = sp[nom]
    if (!s) return
    const ls = dist(a, b)
    if (ls < 2) return
    const A = [0, 0]
    const B = [s.longueur, 0]
    coller(ctx, s, matrice(A, B, a, b, ls / s.longueur, hs, false), A, a)
  }
  // avant-bras : radius (côté pouce) et cubitus (côté auriculaire)
  const dirBas = { x: -axe.x / longAxe, y: -axe.y / longAxe }
  for (const [nom, k] of [['radius', 0.22], ['cubitus', -0.22]]) {
    const s = sp[nom]
    if (!s) continue
    const base = { x: W.x + travers.x * k, y: W.y + travers.y * k }
    const L = s.longueur * hs
    os(nom, { x: base.x + dirBas.x * L, y: base.y + dirBas.y * L }, base)
  }
  // poignet (8 petits os) : ≈ 3 cm le long de la main, ≈ 5 cm de large
  const carpes = sp.carpes
  if (carpes) {
    const u = { x: axe.x / longAxe, y: axe.y / longAxe }
    const cx = carpes.origine[0] + carpes.canvas.width / carpes.S / 2 // centre de l'image d'os, dans le sens de la main
    const a = { x: W.x + u.x * 0.014 * hs, y: W.y + u.y * 0.014 * hs }
    const b = { x: a.x + u.x * carpes.longueur * hs, y: a.y + u.y * carpes.longueur * hs }
    coller(ctx, carpes, matrice([cx, 0], [cx + carpes.longueur, 0], a, b, hs, hs, false), [cx, 0], a)
  }
  // pouce
  os('mc1', Lm[1], Lm[2])
  os('p11', Lm[2], Lm[3])
  os('p13', Lm[3], milieu(Lm[3], Lm[4], 0.88))
  // quatre doigts
  const doigts = [[5, 6, 7, 8, 2], [9, 10, 11, 12, 3], [13, 14, 15, 16, 4], [17, 18, 19, 20, 5]]
  for (const [mcp, pip, dip, bout, n] of doigts) {
    os(`mc${n}`, milieu(W, Lm[mcp], 0.3), Lm[mcp])
    os(`p${n}1`, Lm[mcp], Lm[pip])
    os(`p${n}2`, Lm[pip], Lm[dip])
    os(`p${n}3`, Lm[dip], milieu(Lm[dip], Lm[bout], 0.88))
  }
}
