import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { TOLERANCE_GLISSE, toucherTolerant } from './toucher3D.js'

// =============================================================
//  Membres3D : les membres antérieurs de 4 animaux, construits
//  avec les VRAIS os 3D (BodyParts3D, CC BY 4.0) : humérus,
//  radius, cubitus, os du poignet, métacarpiens, phalanges.
//  Chaque os est mis à la longueur et à l'épaisseur qu'il a chez
//  l'animal (proportions d'après les squelettes réels) : mêmes os,
//  formes différentes. Une rangée par animal, épaule à gauche.
// =============================================================
export const GROUPES = {
  humerus: { nom: 'Humérus', couleur: '#FFD27A' },
  radius: { nom: 'Radius', couleur: '#9DFF8A' },
  cubitus: { nom: 'Cubitus', couleur: '#6FEFFF' },
  carpes: { nom: 'Os du poignet', couleur: '#FF8AD8' },
  doigts: { nom: 'Os de la main et des doigts', couleur: '#C9A3FF' },
}
const IVOIRE = '#E9DFC6'

// Segment : [os source, longueur (cm), épaisseur (× l'os humain), angle (degrés, 0 = vers la droite)]
// Doigt : { base: [x, y] relatif au poignet, segments }
function humain() {
  return {
    bras: [['humerus', 30.9, 1, 0]],
    radius: { dy: 1.3, seg: ['radius', 23.7, 1] },
    cubitus: { dy: -1.3, recul: 1.6, seg: ['cubitus', 25.5, 1] },
    carpes: 1,
    doigts: [
      { base: [0.5, 2.4], angle: 32, os: [['mc1', 4.7, 1], ['p11', 3.2, 1], ['p13', 2.5, 1]] },
      { base: [1, 1.2], angle: 6, os: [['mc2', 7.1, 1], ['p21', 4, 1], ['p22', 2.5, 1], ['p23', 1.9, 1]] },
      { base: [1, 0.1], angle: 0, os: [['mc3', 6.8, 1], ['p31', 4.5, 1], ['p32', 3, 1], ['p33', 1.8, 1]] },
      { base: [1, -1], angle: -6, os: [['mc4', 6.1, 1], ['p41', 4.2, 1], ['p42', 3, 1], ['p43', 1.6, 1]] },
      { base: [0.8, -2], angle: -12, os: [['mc5', 5.7, 1], ['p51', 3.4, 1], ['p52', 2.3, 1], ['p53', 1.6, 1]] },
    ],
  }
}
function chauveSouris() {
  return {
    bras: [['humerus', 22, 1.2, 8]],
    radius: { dy: 0, seg: ['radius', 36, 1.1] },
    cubitus: { dy: -0.9, recul: 1, seg: ['cubitus', 10, 0.7] },
    carpes: 0.7,
    doigts: [
      { base: [0.3, 1.2], angle: 55, os: [['mc1', 2.5, 1.0], ['p11', 2.5, 1.0], ['p13', 2, 1.2]] },
      { base: [0.6, 0.6], angle: 14, os: [['mc2', 30, 0.7], ['p21', 5, 0.6]] },
      { base: [0.6, 0], angle: 0, os: [['mc3', 33, 0.7], ['p31', 12, 0.6], ['p32', 13, 0.5], ['p33', 5, 0.5]] },
      { base: [0.6, -0.6], angle: -24, os: [['mc4', 28, 0.66], ['p41', 9, 0.6], ['p42', 8, 0.5]] },
      { base: [0.5, -1.1], angle: -50, os: [['mc5', 26, 0.66], ['p51', 8, 0.6], ['p52', 7, 0.5]] },
    ],
  }
}
function baleine() {
  const doigt = (mc, p, n, ep) => [[mc, 7, ep], ...Array.from({ length: n }, (_, i) => [p[i % p.length], 4.2 - i * 0.35, ep * (1 - i * 0.08)])]
  return {
    bras: [['humerus', 13, 2.6, 0]],
    radius: { dy: 2.2, seg: ['radius', 15, 2.1] },
    cubitus: { dy: -2.2, recul: 0.5, seg: ['cubitus', 15, 2.1] },
    carpes: 1.7,
    doigts: [
      { base: [2.5, 3.2], angle: 7, os: doigt('mc2', ['p21', 'p22'], 7, 1.7) },
      { base: [2.5, 1.1], angle: 2, os: doigt('mc3', ['p31', 'p32'], 8, 1.7) },
      { base: [2.5, -1.1], angle: -3, os: doigt('mc4', ['p41', 'p42'], 7, 1.7) },
      { base: [2.5, -3.2], angle: -8, os: doigt('mc5', ['p51', 'p52'], 5, 1.6) },
    ],
  }
}
function oiseau() {
  return {
    bras: [['humerus', 24, 1.05, 4]],
    radius: { dy: 0.9, seg: ['radius', 28, 0.55] },
    cubitus: { dy: -0.9, recul: 1.2, seg: ['cubitus', 29, 0.95] },
    carpes: 0.7,
    doigts: [
      { base: [0.8, 1.4], angle: 22, os: [['p11', 4, 0.7], ['p13', 1.5, 0.6]] },
      { base: [1, 0.35], angle: 0, os: [['mc2', 13, 0.95], ['p21', 6, 0.7], ['p22', 3.5, 0.55]] },
      { base: [1, -0.6], angle: -1, os: [['mc3', 12.5, 0.5]] },
      { base: [13.4, -0.6], angle: -6, os: [['p31', 2.5, 0.5]] },
    ],
  }
}

export const ANIMAUX = [
  { id: 'humain', nom: 'Humain', usage: 'saisir, lancer', recette: humain },
  { id: 'chauvesouris', nom: 'Chauve-souris', usage: 'voler', recette: chauveSouris },
  { id: 'baleine', nom: 'Baleine', usage: 'nager', recette: baleine },
  { id: 'oiseau', nom: 'Oiseau', usage: 'voler', recette: oiseau },
]

let cache = null
function chargerMembre() {
  if (!cache) {
    cache = Promise.all([fetch('/labo/anatomie/membre.json').then((r) => r.json()), fetch('/labo/anatomie/membre.bin').then((r) => r.arrayBuffer())]).then(
      ([m, buf]) => {
        const geos = {}
        for (const [cle, p] of Object.entries(m.pieces)) {
          const g = new THREE.BufferGeometry()
          g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(buf, p.positions, p.sommets * 3), 3))
          g.setIndex(new THREE.BufferAttribute(new Uint16Array(buf, p.indices, p.nIndices), 1))
          g.computeVertexNormals()
          geos[cle] = { geo: g, longueur: p.longueur * 100 }
        }
        return geos
      }
    )
    cache.catch(() => (cache = null))
  }
  return cache
}

const groupeDe = (os) => (os === 'humerus' || os === 'radius' || os === 'cubitus' || os === 'carpes' ? os : 'doigts')

function construire(recette, geos, materiau) {
  const g = new THREE.Group()
  const r = recette()
  const ajouter = (os, longueur, epaisseur, angle, x, y) => {
    const src = geos[os]
    const m = new THREE.Mesh(src.geo, materiau(groupeDe(os)))
    const s = longueur / src.longueur
    const ep = epaisseur * Math.max(0.55, Math.sqrt(longueur / src.longueur))
    m.scale.set(s * 100, ep * 100, ep * 100)
    m.rotation.z = (angle * Math.PI) / 180
    m.position.set(x, y, 0)
    m.userData.groupe = groupeDe(os)
    g.add(m)
    return [x + Math.cos(m.rotation.z) * longueur, y + Math.sin(m.rotation.z) * longueur]
  }
  let p = [0, 0]
  for (const [os, L, e, a] of r.bras) p = ajouter(os, L, e, a, p[0], p[1])
  const coude = p
  const fR = ajouter(r.radius.seg[0], r.radius.seg[1], r.radius.seg[2], 0, coude[0] + 0.6, coude[1] + r.radius.dy)
  ajouter(r.cubitus.seg[0], r.cubitus.seg[1], r.cubitus.seg[2], 0, coude[0] - (r.cubitus.recul || 0), coude[1] + r.cubitus.dy)
  const poignet = [fR[0] + 0.6, coude[1]]
  const carpes = new THREE.Mesh(geos.carpes.geo, materiau('carpes'))
  carpes.scale.setScalar(100 * r.carpes)
  carpes.position.set(poignet[0] + 1.5 * r.carpes, poignet[1], 0)
  carpes.rotation.z = Math.PI / 2
  carpes.userData.groupe = 'carpes'
  g.add(carpes)
  const main = [poignet[0] + 3 * r.carpes, poignet[1]]
  for (const d of r.doigts) {
    let q = [main[0] + d.base[0], main[1] + d.base[1]]
    for (const [os, L, e] of d.os) q = ajouter(os, L, e, d.angle, q[0], q[1])
  }
  return g
}

export default function Membres3D({ etats = {}, couleurs = true, onChoisir, className = '' }) {
  const ref = useRef(null)
  const derniers = useRef({ etats, couleurs, onChoisir })
  derniers.current = { etats, couleurs, onChoisir }
  const [pret, setPret] = useState(false)
  const etiquettes = useRef([])

  useEffect(() => {
    const el = ref.current
    let arret = false
    let raf = 0
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;touch-action:pan-y'
    el.prepend(renderer.domElement)
    const scene = new THREE.Scene()
    scene.add(new THREE.HemisphereLight('#ffffff', '#3a3550', 1.7))
    const soleil = new THREE.DirectionalLight('#ffffff', 2.2)
    soleil.position.set(30, 60, 120)
    scene.add(soleil)
    const camera = new THREE.OrthographicCamera(-50, 50, 50, -50, 0.1, 1000)
    camera.position.set(0, 0, 300)
    const rangees = []
    const meshes = []

    function materiau(groupe) {
      const m = new THREE.MeshStandardMaterial({ color: IVOIRE, roughness: 0.5, side: THREE.DoubleSide })
      m.userData.groupe = groupe
      return m
    }

    function disposer() {
      const W = el.clientWidth || 360
      const H = el.clientHeight || 480
      renderer.setSize(W, H, false)
      const hauteurRangee = 100 / ANIMAUX.length
      camera.left = 0
      camera.right = (100 * W) / H
      camera.top = 100
      camera.bottom = 0
      camera.updateProjectionMatrix()
      rangees.forEach(({ groupe, taille }, i) => {
        const largeurDispo = camera.right * 0.9
        const echelle = Math.min(largeurDispo / taille.x, (hauteurRangee * 0.72) / taille.y)
        groupe.scale.setScalar(echelle)
        groupe.position.set(camera.right * 0.05 - groupe.userData.minX * echelle, 100 - hauteurRangee * (i + 0.58) - groupe.userData.centreY * echelle, 0)
      })
    }

    chargerMembre()
      .then((geos) => {
        if (arret) return
        ANIMAUX.forEach((a) => {
          const pivot = new THREE.Group()
          const g = construire(a.recette, geos, materiau)
          const boite = new THREE.Box3().setFromObject(g)
          const taille = boite.getSize(new THREE.Vector3())
          pivot.add(g)
          pivot.userData.minX = boite.min.x
          pivot.userData.centreY = (boite.min.y + boite.max.y) / 2
          g.traverse((o) => {
            if (o.isMesh) {
              o.userData.animal = a.id
              meshes.push(o)
            }
          })
          scene.add(pivot)
          rangees.push({ groupe: pivot, taille, interne: g })
        })
        disposer()
        setPret(true)
      })
      .catch(() => {})

    const ro = new ResizeObserver(disposer)
    ro.observe(el)

    const raycaster = new THREE.Raycaster()
    let depart = null
    const bas = (e) => (depart = { x: e.clientX, y: e.clientY })
    const haut = (e) => {
      if (!depart || Math.hypot(e.clientX - depart.x, e.clientY - depart.y) > TOLERANCE_GLISSE) return
      depart = null
      // zone de toucher élargie : les petits os (phalanges…) restent faciles à toucher sur tablette
      const hit = toucherTolerant(e, renderer, camera, meshes, raycaster)
      if (hit) derniers.current.onChoisir?.(hit.object.userData.animal, hit.object.userData.groupe)
    }
    renderer.domElement.addEventListener('pointerdown', bas)
    renderer.domElement.addEventListener('pointerup', haut)

    const horloge = new THREE.Clock()
    function boucle() {
      raf = requestAnimationFrame(boucle)
      const t = horloge.getElapsedTime()
      const { etats: e, couleurs: c } = derniers.current
      // chaque membre pivote doucement sur lui-même : on voit le volume des os
      rangees.forEach(({ interne }, i) => {
        interne.rotation.x = Math.sin(t * 0.8 + i) * 0.45
      })
      for (const m of meshes) {
        const etat = e[`${m.userData.animal}_${m.userData.groupe}`] || e[m.userData.groupe]
        const base = c ? GROUPES[m.userData.groupe].couleur : IVOIRE
        m.material.color.set(etat === 'erreur' ? '#FF6B7A' : etat === 'ok' ? '#9DFF8A' : etat === 'actif' ? GROUPES[m.userData.groupe].couleur : base)
        m.material.emissive.set(etat === 'actif' || etat === 'ok' ? '#333333' : '#000000')
        m.material.transparent = etat === 'attenue'
        m.material.opacity = etat === 'attenue' ? 0.25 : 1
      }
      renderer.render(scene, camera)
      const H = el.clientHeight
      etiquettes.current.forEach((d, i) => {
        if (d) d.style.top = `${(H / ANIMAUX.length) * i + 4}px`
      })
    }
    boucle()

    return () => {
      arret = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      renderer.domElement.removeEventListener('pointerdown', bas)
      renderer.domElement.removeEventListener('pointerup', haut)
      meshes.forEach((m) => m.material.dispose())
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {ANIMAUX.map((a, i) => (
        <div key={a.id} ref={(d) => (etiquettes.current[i] = d)} className="pointer-events-none absolute left-3 text-xs">
          <span className="labo-titre font-bold text-white">{a.nom}</span> <span className="text-[#8A93B8]">· pour {a.usage}</span>
        </div>
      ))}
      {!pret && <div className="absolute inset-0 flex items-center justify-center text-sm text-[#B9C1E3]">Préparation des squelettes…</div>}
      <p className="pointer-events-none absolute bottom-1 right-2 text-[9px] text-[#8A93B8]/80">Os 3D : BodyParts3D, © DBCLS, CC BY 4.0 · proportions de chaque animal</p>
    </div>
  )
}
