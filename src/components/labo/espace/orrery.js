import * as THREE from 'three'
import { ambiance, creerSoleil, creerTerre, deg, etoiles3D, orbite } from './outils3d.js'
import { JOURS_MOIS, MOIS } from './donnees.js'

// =============================================================
//  Terre qui tourne autour du Soleil (S3 Révolution, S6 Saisons)
//  Repère : plan de l'orbite = XZ, Nord = +Y, Soleil au centre.
//  Jour de l'année j (0 = 1er janvier) → angle de la Terre
//     a(j) = 2π (j − 171)/365,25 + π      (solstice de juin = j 171 : Terre à gauche, a = π)
//  Position : (R cos a, 0, −R sin a) ; sens inverse des aiguilles d'une montre vu du Nord (réel).
//  L'axe de la Terre pointe toujours vers la MÊME direction de l'espace : (sin i, cos i, 0).
//  Au solstice de juin le pôle Nord est penché vers le Soleil ; en décembre, à l'opposé.
// =============================================================
export const INCLINAISON = 23.4
export const J_SOLSTICE_ETE = 171 // 21 juin
export const angleOrbite = (j) => (2 * Math.PI * (j - J_SOLSTICE_ETE)) / 365.25 + Math.PI
// déclinaison du Soleil (latitude où il est au zénith) en degrés ; incl = inclinaison de l'axe (0 = axe droit)
// distance Terre-Soleil réelle (orbite légèrement elliptique, périhélie vers le 3 janvier), en millions de km
export const distanceSoleil = (j) => 149.6 * (1 - 0.0167 * Math.cos((2 * Math.PI * (j - 3)) / 365.25))
// ---- Orbite réelle (ellipse de Kepler, Soleil à un foyer) : utilisée par S3 ----
//  Excentricité réelle e = 0,0167 ; périhélie (Terre au plus près, 147,1 M km) vers le 3 janvier ; aphélie (152,1 M km) vers le 4 juillet.
//  La Terre va un peu plus vite près du Soleil (loi des aires). Angle = mouvement moyen + équation du centre (2e sin M + 1,25 e² sin 2M),
//  recalé pour que le solstice de juin tombe au jour 171 : équinoxes et solstices retombent alors aux bonnes dates (à ±0,3°).
export const EXCENTRICITE = 0.0167
export const J_PERIHELIE = 3
const OMEGA = (2 * Math.PI) / 365.25
const eqCentre = (j) => {
  const M = OMEGA * (j - J_PERIHELIE)
  return 2 * EXCENTRICITE * Math.sin(M) + 1.25 * EXCENTRICITE * EXCENTRICITE * Math.sin(2 * M)
}
export const angleReel = (j) => Math.PI + OMEGA * (j - J_SOLSTICE_ETE) + eqCentre(j) - eqCentre(J_SOLSTICE_ETE)
export const declinaison = (j, incl = INCLINAISON) => (Math.asin(-Math.sin(deg(incl)) * Math.cos(angleReel(j))) * 180) / Math.PI
// jour de l'année correspondant à un angle sur l'orbite (inverse de angleReel, par itérations)
export function jourDepuisAngle(a) {
  let j = ((a - Math.PI) / OMEGA + J_SOLSTICE_ETE)
  for (let k = 0; k < 4; k++) {
    const d = Math.atan2(Math.sin(angleReel(j) - a), Math.cos(angleReel(j) - a))
    j -= d / OMEGA
  }
  return ((j % 365.25) + 365.25) % 365.25
}
// vitesse orbitale de la Terre (km/s) à la distance distMkm (millions de km) — équation de la vis-viva
export const vitesseOrbitale = (distMkm) => Math.sqrt(1.32712e11 * (2 / (distMkm * 1e6) - 1 / 149.598e6))

export const FETES = [
  { j: 78, nom: 'Équinoxe', date: '20 mars' },
  { j: 171, nom: 'Solstice', date: '21 juin' },
  { j: 264, nom: 'Équinoxe', date: '22 sept.' },
  { j: 354, nom: 'Solstice', date: '21 déc.' },
]
// saisons de l'hémisphère Nord (dates astronomiques) ; Sud = décalé de deux saisons
export const SAISONS = ['printemps', 'été', 'automne', 'hiver']
export function saisonNord(j) {
  const x = ((j % 365.25) + 365.25) % 365.25
  if (x >= 78 && x < 171) return 0
  if (x >= 171 && x < 264) return 1
  if (x >= 264 && x < 354) return 2
  return 3
}

// Durée du jour et hauteur du Soleil à midi, à la latitude lat (degrés), pour la déclinaison dec
export function ensoleillement(lat, dec) {
  const t = Math.tan(deg(lat)) * Math.tan(deg(dec))
  let heures
  if (t <= -1) heures = 24
  else if (t >= 1) heures = 0
  else heures = (2 * Math.acos(-t) * 180) / Math.PI / 15
  const midi = 90 - Math.abs(lat - dec)
  return { heures, midi }
}
export const fmtDuree = (h) => (h >= 23.99 ? '24 h' : h <= 0.01 ? '0 h' : `${Math.floor(h)} h ${String(Math.round((h % 1) * 60) % 60).padStart(2, '0')}`)

// Construit la scène Soleil + orbite + Terre inclinée. Retourne { maj(jour, spin), terre, ... }
export function construireOrrery(ctx, { R = 5, rTerre = 0.7, rSoleil = 0.85, mois = true, fetes = false, axeVisible = true, trace = false, ellipse = false }) {
  const { scene } = ctx
  const origine = new THREE.Vector3()
  scene.add(etoiles3D(1100, 90))
  ambiance(scene, 0.14)
  const soleil = creerSoleil(rSoleil)
  scene.add(soleil)
  // position sur l'orbite (cercle, ou ellipse d'excentricité exc dont le Soleil est un foyer), à `extra` de plus vers l'extérieur
  let exc = 0
  const aPeri = angleReel(J_PERIHELIE)
  const ang = (j) => (ellipse ? angleReel(j) : angleOrbite(j))
  const rayonA = (a) => (ellipse ? (R * (1 - exc * exc)) / (1 + exc * Math.cos(a - aPeri)) : R)
  const placerA = (a, extra, out) => {
    const r = rayonA(a) + extra
    return out.set(Math.cos(a) * r, 0, -Math.sin(a) * r)
  }
  const anneau = orbite(R, '#A66BFF', 0.45, ellipse ? 260 : 200)
  scene.add(anneau)
  function dessinerOrbite() {
    const pa = anneau.geometry.attributes.position
    for (let i = 0; i < pa.count; i++) {
      const a = (i / pa.count) * Math.PI * 2
      const r = rayonA(a)
      pa.setXYZ(i, Math.cos(a) * r, 0, -Math.sin(a) * r)
    }
    pa.needsUpdate = true
  }

  const pos = new THREE.Group()
  scene.add(pos)
  const incl = new THREE.Group()
  pos.add(incl)
  const terre = creerTerre(rTerre, origine)
  incl.add(terre)
  const axe = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -rTerre * 1.9, 0), new THREE.Vector3(0, rTerre * 1.9, 0)]), new THREE.LineBasicMaterial({ color: '#FFA24D', transparent: true, opacity: 0.95 }))
  axe.visible = axeVisible
  incl.add(axe)
  // pointe de flèche au pôle Nord
  const nord = new THREE.Mesh(new THREE.ConeGeometry(rTerre * 0.1, rTerre * 0.28, 12), new THREE.MeshBasicMaterial({ color: '#FFA24D' }))
  nord.position.y = rTerre * 1.9
  nord.visible = axeVisible
  incl.add(nord)

  const etiTerre = ctx.etiquette({ texte: 'Terre', couleur: '#7FE3A0' })
  const etiSoleil = ctx.etiquette({ texte: 'Soleil', couleur: '#FFD27A' })
  const etiMois = []
  if (mois) {
    let cumul = 0
    JOURS_MOIS.forEach((n, i) => {
      const j = cumul + n / 2
      cumul += n
      const a = ang(j)
      etiMois.push({ eti: ctx.etiquette({ texte: MOIS[i], couleur: '#C9A3FF', classe: 'espace-mois' }), a, p: new THREE.Vector3() })
    })
    etiMois.forEach((m) => (m.eti.el.style.fontSize = '12px'))
  }
  const etiFetes = []
  if (fetes) {
    FETES.forEach((f) => {
      const a = ang(f.j)
      const point = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshBasicMaterial({ color: '#FFA24D' }))
      scene.add(point)
      const e = ctx.etiquette({ texte: f.nom, couleur: '#FFB86B' })
      e.el.style.fontSize = '12px'
      etiFetes.push({ eti: e, a, point, p: new THREE.Vector3() })
    })
  }

  // périhélie / aphélie (orbite réelle seulement)
  const reperes = []
  if (ellipse) {
    ;[['Périhélie', 0, '#FFE27A'], ['Aphélie', Math.PI, '#9FB4FF']].forEach(([nom, dec, c]) => {
      const point = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), new THREE.MeshBasicMaterial({ color: c }))
      scene.add(point)
      const e = ctx.etiquette({ texte: nom, couleur: c })
      e.el.style.fontSize = '12px'
      reperes.push({ eti: e, a: aPeri + dec, point, p: new THREE.Vector3() })
    })
  }

  // traînée de la Terre (les 365 derniers jours), qui s'estompe
  let ligne = null
  const NP = 183
  const arr = new Float32Array(NP * 3)
  const col = new Float32Array(NP * 3)
  if (trace) {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3))
    g.setAttribute('color', new THREE.BufferAttribute(col, 3))
    ligne = new THREE.Line(g, new THREE.LineBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }))
    ligne.frustumCulled = false
    scene.add(ligne)
  }

  const v = new THREE.Vector3()
  return {
    soleil,
    anneau,
    ligne,
    terre,
    pos,
    incl,
    axe,
    nord,
    R,
    reglerExcentricite(e) {
      exc = e
      dessinerOrbite()
    },
    maj({ jour, spin, tilt = INCLINAISON, t = 0 }) {
      const a = ang(jour)
      placerA(a, 0, pos.position)
      incl.rotation.z = -deg(tilt)
      terre.userData.surface.rotation.y = spin
      if (terre.userData.nuages) terre.userData.nuages.rotation.y = spin * 1.02
      soleil.userData.maj(t)
      etiTerre.place(v.copy(pos.position).add(new THREE.Vector3(0, -rTerre * 1.2, 0)), 0, 16)
      etiSoleil.place(v.set(0, -rSoleil * 1.1, 0), 0, 14)
      etiMois.forEach((m) => m.eti.place(placerA(m.a, 0.75, m.p), 0, 0))
      etiFetes.forEach((m) => {
        placerA(m.a, 0, m.point.position)
        m.eti.place(placerA(m.a, 1.7, m.p), 0, 0)
      })
      reperes.forEach((m) => {
        placerA(m.a, 0, m.point.position)
        m.eti.place(placerA(m.a, -1.7, m.p), 0, -16)
      })
      if (ligne) {
        for (let k = 0; k < NP; k++) {
          const aj = ang(jour - k * 2)
          const rj = rayonA(aj)
          arr[k * 3] = Math.cos(aj) * rj
          arr[k * 3 + 1] = 0
          arr[k * 3 + 2] = -Math.sin(aj) * rj
          const f = Math.pow(1 - k / NP, 1.6)
          col[k * 3] = 1 * f
          col[k * 3 + 1] = 0.64 * f
          col[k * 3 + 2] = 0.3 * f
        }
        ligne.geometry.attributes.position.needsUpdate = true
        ligne.geometry.attributes.color.needsUpdate = true
      }
    },
  }
}
