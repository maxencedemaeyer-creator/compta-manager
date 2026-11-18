import * as THREE from 'three'
import { PLANETE } from './donnees.js'
import { ambiance, creerAnneauxSaturne, creerAstre, creerTerre, deg, etoiles3D, orbite } from './outils3d.js'

// =============================================================
//  Fiches des planètes (S7, onglet « Fiches ») : données + scène 3D d'une planète seule, avec ses lunes principales.
//  Sources : NASA Planetary Fact Sheet (températures à 1 bar pour les géantes, pesanteur à l'équateur), NASA Solar System Exploration (lunes).
//  Pas à l'échelle : les distances des lunes sont comprimées (échelle logarithmique) et les petites lunes agrandies ; vitesses symboliques.
// =============================================================
export const FICHES = {
  mercure: {
    temp: '167 °C', tempSous: '−173 °C la nuit · 427 °C le jour', g: 3.7,
    atmo: 'Presque aucune : quelques atomes seulement. Le ciel y est noir, même de jour.',
    faits: ['Un jour solaire y dure 176 jours terrestres : plus longtemps que son année (88 jours) !', 'Elle rétrécit : en refroidissant, sa surface se plisse.', 'Elle est couverte de cratères, comme la Lune.'],
    lunes: [],
  },
  venus: {
    temp: '464 °C', tempSous: 'la plus chaude, plus que Mercure', g: 8.87,
    atmo: '96 % de dioxyde de carbone, avec des nuages d’acide sulfurique. L’air y écrase 90 fois plus que sur Terre.',
    faits: ['Un jour (243 jours terrestres) y dure plus longtemps que son année (225 jours).', 'Elle tourne à l’envers : le Soleil s’y lève à l’ouest.', 'Après le Soleil et la Lune, c’est l’astre le plus brillant de notre ciel.'],
    lunes: [],
  },
  terre: {
    temp: '15 °C', tempSous: 'moyenne à la surface', g: 9.81,
    atmo: '78 % d’azote et 21 % d’oxygène : un air respirable.',
    faits: ['71 % de sa surface est couverte d’eau.', 'C’est la seule planète où l’on connaît la vie.', 'Elle est un peu aplatie aux pôles : elle n’est pas parfaitement ronde.'],
    lunes: [{ nom: 'Lune', dist: 384400, rayon: 1737.4, periode: 27.32, texture: 'lune' }],
  },
  mars: {
    temp: '−63 °C', tempSous: 'de −140 °C à 20 °C', g: 3.71,
    atmo: '95 % de dioxyde de carbone, mais très mince : 100 fois moins d’air que sur Terre.',
    faits: ['Son volcan Olympus Mons mesure 22 km de haut : presque 2,5 fois l’Everest.', 'Des robots y roulent : Curiosity, Perseverance…', 'Son ciel est rose‑orangé le jour, et bleu au coucher du Soleil.'],
    lunes: [
      { nom: 'Phobos', dist: 9376, rayon: 11.3, periode: 0.319, couleur: '#8C7B6B' },
      { nom: 'Déimos', dist: 23463, rayon: 6.2, periode: 1.263, couleur: '#A39382' },
    ],
  },
  jupiter: {
    temp: '−108 °C', tempSous: 'au sommet des nuages', g: 24.79,
    atmo: 'Hydrogène (environ 90 %) et hélium (environ 10 %), en bandes de nuages.',
    faits: ['Elle tourne le plus vite : un jour n’y dure que 10 heures.', 'Sa Grande Tache rouge est une tempête plus large que la Terre, observée depuis plus de 150 ans.', 'Galilée a découvert ses quatre grosses lunes en 1610.'],
    lunes: [
      { nom: 'Io', dist: 421800, rayon: 1821.6, periode: 1.769, couleur: '#E8D36A' },
      { nom: 'Europe', dist: 671100, rayon: 1560.8, periode: 3.551, couleur: '#D9CDB8' },
      { nom: 'Ganymède', dist: 1070400, rayon: 2631.2, periode: 7.155, couleur: '#A59A8C' },
      { nom: 'Callisto', dist: 1882700, rayon: 2410.3, periode: 16.689, couleur: '#6F675F' },
    ],
  },
  saturne: {
    temp: '−139 °C', tempSous: 'au sommet des nuages', g: 10.44,
    atmo: 'Hydrogène et hélium, comme Jupiter. Elle est moins dense que l’eau !',
    faits: ['Ses anneaux font 280 000 km de large, mais souvent seulement 10 mètres d’épaisseur.', 'Ils sont faits de milliards de blocs de glace : du grain de poussière jusqu’à la taille d’une maison.', 'Elle flotterait dans une baignoire géante, car elle est moins dense que l’eau.'],
    lunes: [
      { nom: 'Mimas', dist: 185540, rayon: 198.2, periode: 0.942, couleur: '#B8B4AE' },
      { nom: 'Encelade', dist: 238040, rayon: 252.1, periode: 1.37, couleur: '#F2F2F2' },
      { nom: 'Téthys', dist: 294670, rayon: 531.1, periode: 1.888, couleur: '#DAD6D0' },
      { nom: 'Dioné', dist: 377420, rayon: 561.4, periode: 2.737, couleur: '#C9C5BF' },
      { nom: 'Rhéa', dist: 527070, rayon: 763.8, periode: 4.518, couleur: '#BDB8B0' },
      { nom: 'Titan', dist: 1221870, rayon: 2574.7, periode: 15.945, couleur: '#D9A441' },
    ],
  },
  uranus: {
    temp: '−197 °C', tempSous: 'au sommet des nuages', g: 8.69,
    atmo: 'Hydrogène, hélium et un peu de méthane, qui lui donne sa couleur bleu‑vert.',
    faits: ['Elle roule sur son orbite, couchée sur le côté (axe incliné de 98°).', 'Chaque pôle reçoit le Soleil pendant 42 ans, puis reste dans la nuit pendant 42 ans.', 'Elle a été découverte en 1781 par William Herschel, avec un télescope.'],
    lunes: [
      { nom: 'Miranda', dist: 129900, rayon: 235.8, periode: 1.413, couleur: '#B9B7B2' },
      { nom: 'Ariel', dist: 190900, rayon: 578.9, periode: 2.52, couleur: '#CFCBC4' },
      { nom: 'Umbriel', dist: 266000, rayon: 584.7, periode: 4.144, couleur: '#8F8C87' },
      { nom: 'Titania', dist: 436300, rayon: 788.4, periode: 8.706, couleur: '#B5AEA4' },
      { nom: 'Obéron', dist: 583500, rayon: 761.4, periode: 13.46, couleur: '#A39A90' },
    ],
  },
  neptune: {
    temp: '−201 °C', tempSous: 'au sommet des nuages', g: 11.15,
    atmo: 'Hydrogène, hélium et méthane : un bleu profond.',
    faits: ['Ses vents soufflent jusqu’à 2 000 km/h : les plus rapides du Système solaire.', 'Elle a été découverte par le calcul en 1846, avant d’être vue au télescope.', 'Une année y dure 165 ans : elle n’a fait qu’un seul tour depuis sa découverte (en 2011).'],
    lunes: [
      { nom: 'Larissa', dist: 73548, rayon: 97, periode: 0.555, couleur: '#8F8A84' },
      { nom: 'Protée', dist: 117647, rayon: 210, periode: 1.122, couleur: '#8A8580' },
      { nom: 'Triton', dist: 354759, rayon: 1353.4, periode: 5.877, couleur: '#E6D5CC', retro: true },
    ],
  },
}
export const RAYON_KM = { mercure: 2439.7, venus: 6051.8, terre: 6371, mars: 3389.5, jupiter: 69911, saturne: 58232, uranus: 25362, neptune: 24622 }

const R = 1.6 // rayon de la planète dans la scène
const rayonVisuelLune = (distKm, rKm) => (1.35 + 1.2 * Math.log(distKm / rKm)) * R // distance comprimée (échelle logarithmique)
export function cameraFiche(id) {
  const f = FICHES[id]
  const vmax = f.lunes.length ? Math.max(...f.lunes.map((m) => rayonVisuelLune(m.dist, RAYON_KM[id]))) : 0
  const base = id === 'saturne' ? 7 : 5.2
  const dist = Math.min(24, Math.max(base, vmax * 1.8))
  return { dist, position: [0, dist * 0.16, dist], max: Math.max(dist * 1.8, 14) }
}

// Anneaux de Saturne : milliards de blocs → ici ~6 500 blocs bien visibles (agrandis), qui tournent chacun à leur vitesse (plus vite près de la planète).
function creerGrainsSaturne() {
  const groupe = new THREE.Group()
  const bandes = [
    [1.24, 1.53, 0.25, '#9C8A74'], [1.53, 1.75, 0.8, '#CDB894'], [1.75, 1.95, 1, '#E2D3B4'], [2.03, 2.27, 0.55, '#C7B99E'],
  ]
  const sous = []
  bandes.forEach(([a, b, dens, c]) => {
    const n = Math.max(1, Math.round((b - a) / 0.06))
    for (let i = 0; i < n; i++) {
      const x0 = a + ((b - a) * i) / n
      const x1 = a + ((b - a) * (i + 1)) / n
      sous.push({ x0, x1, poids: dens * (x1 * x1 - x0 * x0), c })
    }
  })
  const total = sous.reduce((s, x) => s + x.poids, 0)
  const geo = new THREE.IcosahedronGeometry(1, 0)
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.95, metalness: 0, flatShading: true })
  const m4 = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const e = new THREE.Euler()
  const pos = new THREE.Vector3()
  const sc = new THREE.Vector3()
  const col = new THREE.Color()
  const bandesRot = []
  sous.forEach((sb) => {
    const n = Math.round((sb.poids / total) * 6500)
    if (n < 1) return
    const mesh = new THREE.InstancedMesh(geo, mat, n)
    for (let i = 0; i < n; i++) {
      const r = (sb.x0 + Math.random() * (sb.x1 - sb.x0)) * R
      const a = Math.random() * Math.PI * 2
      pos.set(Math.cos(a) * r, (Math.random() - 0.5) * 0.035 * R, -Math.sin(a) * r)
      const taille = R * (0.009 + Math.pow(Math.random(), 3) * 0.024)
      sc.set(taille * (0.7 + Math.random() * 0.6), taille * (0.6 + Math.random() * 0.5), taille * (0.7 + Math.random() * 0.6))
      e.set(Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28)
      q.setFromEuler(e)
      m4.compose(pos, q, sc)
      mesh.setMatrixAt(i, m4)
      col.set(sb.c).offsetHSL(0, (Math.random() - 0.5) * 0.08, (Math.random() - 0.5) * 0.22)
      mesh.setColorAt(i, col)
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.frustumCulled = false
    groupe.add(mesh)
    bandesRot.push({ mesh, w: ((2 * Math.PI) / 70) * Math.pow(1.24 / ((sb.x0 + sb.x1) / 2), 1.5) })
  })
  groupe.userData.maj = (dt) => bandesRot.forEach((b) => { b.mesh.rotation.y += dt * b.w })
  groupe.userData.nettoyer = () => { geo.dispose(); mat.dispose() }
  return groupe
}

export function construireFiche(ctx) {
  const { scene } = ctx
  const id = ctx.d().id
  const p = PLANETE[id]
  const f = FICHES[id]
  scene.add(etoiles3D(900, 90))
  ambiance(scene, 0.32)
  const sunPos = new THREE.Vector3(30, 6, 18)
  const lum = new THREE.PointLight('#FFF3E0', 3.3, 0, 0)
  lum.position.copy(sunPos)
  scene.add(lum)

  const incl = new THREE.Group()
  incl.rotation.z = -deg(p.axe) // l'inclinaison réelle de l'axe (Uranus : couchée sur le côté ; Vénus : presque à l'envers)
  scene.add(incl)
  const astre = id === 'terre' ? creerTerre(R, sunPos, { nuages: true }) : creerAstre(p.texture, R, { sunPos, segments: 64 })
  incl.add(astre)
  const tourne = astre.userData.surface || astre.userData.corps
  const nuages = astre.userData.nuages
  const periodeSpin = Math.min(60, Math.max(10, p.jourH)) // secondes par tour : symbolique
  let grains = null
  if (id === 'saturne') {
    incl.add(creerAnneauxSaturne(R))
    grains = creerGrainsSaturne()
    incl.add(grains)
  }

  const periodeMin = f.lunes.length ? Math.min(...f.lunes.map((m) => m.periode)) : 1
  const lunes = f.lunes.map((m, i) => {
    const r = rayonVisuelLune(m.dist, RAYON_KM[id])
    const rat = m.rayon / RAYON_KM[id]
    const rm = rat < 0.1 ? Math.max(rat * 1.8, 0.045) * R : rat * R
    const mesh = m.texture ? creerAstre(m.texture, rm, { sunPos, segments: 32 }) : new THREE.Mesh(new THREE.SphereGeometry(rm, 24, 16), new THREE.MeshStandardMaterial({ color: m.couleur, roughness: 1 }))
    incl.add(mesh)
    incl.add(orbite(r, '#C9A3FF', 0.28, 160))
    const eti = ctx.etiquette({ texte: m.nom, couleur: '#FFE9B8' })
    eti.el.style.fontSize = '12px'
    const duree = f.lunes.length === 1 ? 20 : 12 * Math.sqrt(m.periode / periodeMin) // secondes par tour : symbolique
    return { m, r, rm, mesh, eti, a: i * 2.1 + 0.6, w: ((m.retro ? -1 : 1) * 2 * Math.PI) / duree, v: new THREE.Vector3() }
  })

  return {
    maj(dt) {
      if (tourne) tourne.rotation.y += (dt * 2 * Math.PI) / periodeSpin
      if (nuages) nuages.rotation.y += (dt * 2 * Math.PI) / periodeSpin * 1.05
      if (grains) grains.userData.maj(dt)
      incl.updateMatrixWorld()
      lunes.forEach((l) => {
        l.a += dt * l.w
        l.mesh.position.set(Math.cos(l.a) * l.r, 0, -Math.sin(l.a) * l.r)
        l.v.copy(l.mesh.position).add(new THREE.Vector3(0, l.rm + 0.3, 0)).applyMatrix4(incl.matrixWorld)
        l.eti.place(l.v, 0, 0)
      })
    },
    nettoyer() {
      if (grains) grains.userData.nettoyer()
    },
  }
}
