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
export const declinaison = (j, incl = INCLINAISON) => (Math.asin(-Math.sin(deg(incl)) * Math.cos(angleOrbite(j))) * 180) / Math.PI
// distance Terre-Soleil réelle (orbite légèrement elliptique, périhélie vers le 3 janvier), en millions de km
export const distanceSoleil = (j) => 149.6 * (1 - 0.0167 * Math.cos((2 * Math.PI * (j - 3)) / 365.25))
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
export function construireOrrery(ctx, { R = 5, rTerre = 0.7, rSoleil = 0.85, mois = true, fetes = false, axeVisible = true, trace = false }) {
  const { scene } = ctx
  const origine = new THREE.Vector3()
  scene.add(etoiles3D(1100, 90))
  ambiance(scene, 0.14)
  const soleil = creerSoleil(rSoleil)
  scene.add(soleil)
  const anneau = orbite(R, '#A66BFF', 0.45)
  scene.add(anneau)

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
      const a = angleOrbite(j)
      etiMois.push({ eti: ctx.etiquette({ texte: MOIS[i], couleur: '#C9A3FF', classe: 'espace-mois' }), p: new THREE.Vector3(Math.cos(a) * (R + 0.75), 0, -Math.sin(a) * (R + 0.75)) })
    })
    etiMois.forEach((m) => (m.eti.el.style.fontSize = '12px'))
  }
  const etiFetes = []
  if (fetes) {
    FETES.forEach((f) => {
      const a = angleOrbite(f.j)
      const p = new THREE.Vector3(Math.cos(a) * R, 0, -Math.sin(a) * R)
      const point = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshBasicMaterial({ color: '#FFA24D' }))
      point.position.copy(p)
      scene.add(point)
      const e = ctx.etiquette({ texte: f.nom, couleur: '#FFB86B' })
      e.el.style.fontSize = '12px'
      etiFetes.push({ eti: e, p: p.clone().multiplyScalar((R + 1.7) / R) })
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
    maj({ jour, spin, tilt = INCLINAISON, t = 0 }) {
      const a = angleOrbite(jour)
      pos.position.set(Math.cos(a) * R, 0, -Math.sin(a) * R)
      incl.rotation.z = -deg(tilt)
      terre.userData.surface.rotation.y = spin
      if (terre.userData.nuages) terre.userData.nuages.rotation.y = spin * 1.02
      soleil.userData.maj(t)
      etiTerre.place(v.copy(pos.position).add(new THREE.Vector3(0, -rTerre * 1.2, 0)), 0, 16)
      etiSoleil.place(v.set(0, -rSoleil * 1.1, 0), 0, 14)
      etiMois.forEach((m) => m.eti.place(m.p, 0, 0))
      etiFetes.forEach((m) => m.eti.place(m.p, 0, 0))
      if (ligne) {
        for (let k = 0; k < NP; k++) {
          const aj = angleOrbite(jour - k * 2)
          arr[k * 3] = Math.cos(aj) * R
          arr[k * 3 + 1] = 0
          arr[k * 3 + 2] = -Math.sin(aj) * R
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
