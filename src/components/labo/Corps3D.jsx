import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CHAINE, CREDIT_ANATOMIE, MUSCLES_ARTICULES, OS, chargerAnatomie } from './anatomie.js'

// =============================================================
//  Corps3D : vrai squelette (et vrais muscles) en 3D, BodyParts3D.
//
//  Props principales
//  - afficher    : liste des groupes affichés (os, muscles, 'peau')
//  - etats       : { groupe | groupe_cote : 'ok'|'actif'|'erreur'|'attenue'|'cache'|'contracte'|'relache' }
//  - decalages   : { groupe : [dx, dy, dz] } en mètres (squelette explosé)
//  - poses       : { 'coude_d': 90 | { flex, abd } } en degrés
//  - contractions: { biceps_d: 0..1 } (le muscle gonfle)
//  - vue         : 'face' | 'profil' (côté droit) | 'dos'
//  - cadrage     : 'corps' | 'bras' | 'jambe' | 'thorax' | 'pied' (côté droit)
//  - rotation    : autoriser à faire tourner le modèle au doigt
//  - marqueurs   : [{ id, pivot: 'coude_d' } | { id, point:[x,y,z], noeud:'coude_d' }, couleur, taille]
//  - tubes       : [{ de: {point, noeud}, a: {point, noeud}, epaisseur, couleur }] (muscle « fabriqué »)
//  - etiquettes  : [{ texte, pivot | point+noeud, couleur }]
//  - onChoisir(groupe, cote) / onMarqueur(id) / onPret(outils)
// =============================================================

const COULEURS = {
  os: '#E9DFC6',
  cartilage: '#BFD8E0',
  muscle: '#B5333F',
  tendon: '#EEEAE0',
  peau: '#E3AB8C',
}
const ETATS = {
  ok: { couleur: '#9DFF8A', emissif: '#1F6B17' },
  actif: { couleur: '#8FF4FF', emissif: '#14606C' },
  erreur: { couleur: '#FF6B7A', emissif: '#6B1420' },
  contracte: { couleur: '#FF4D5E', emissif: '#5A0F18' },
  relache: { couleur: '#C98A92', emissif: '#000000' },
}

function couleurBase(groupe) {
  if (groupe === 'cartilages' || groupe === 'disques') return COULEURS.cartilage
  if (groupe === 'tendon_achille') return COULEURS.tendon
  if (groupe === 'peau') return COULEURS.peau
  if (OS.includes(groupe)) return COULEURS.os
  return COULEURS.muscle
}

const CADRAGES = {
  corps: { groupes: null },
  bras: { groupes: ['humerus', 'radius', 'cubitus', 'main', 'omoplate'], cote: 'd' },
  avantbras: { groupes: ['humerus', 'radius', 'cubitus', 'main'], cote: 'd' },
  jambe: { groupes: ['femur', 'tibia', 'perone', 'pied', 'rotule'], cote: 'd' },
  genou: { groupes: ['femur', 'tibia', 'perone', 'rotule'], cote: 'd' },
  pied: { groupes: ['tibia', 'perone', 'pied'], cote: 'd' },
  thorax: { groupes: ['cotes', 'sternum', 'clavicule', 'crane', 'vertebres'] },
}

const lisse = (a, b, k) => a + (b - a) * k

export default function Corps3D(props) {
  const conteneur = useRef(null)
  const derniers = useRef(props)
  derniers.current = props
  const [etat, setEtat] = useState('chargement')
  const etiquettesRef = useRef([])

  useEffect(() => {
    const el = conteneur.current
    let arret = false
    let raf = 0
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.style.touchAction = derniers.current.rotation ? 'none' : 'pan-y'
    el.prepend(renderer.domElement)
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.display = 'block'

    const scene = new THREE.Scene()
    scene.add(new THREE.HemisphereLight('#ffffff', '#3a3550', 1.6))
    const lumiere = new THREE.DirectionalLight('#ffffff', 2.2)
    scene.add(lumiere)
    const contre = new THREE.DirectionalLight('#9fdcff', 0.8)
    scene.add(contre)
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 50)
    const controles = new OrbitControls(camera, renderer.domElement)
    controles.enableDamping = true
    controles.enablePan = false
    controles.enableZoom = true

    const corps = new THREE.Group()
    scene.add(corps)
    const noeuds = {}
    const meshes = []
    const muscles = []
    const marqueurs = new Map()
    const tubes = []
    let pivots = {}
    let cleCamera = ''

    // Cadre libre : { centre: [x, y], demiHauteur } en mètres, vue de face, avec un zoom progressif
    const libre = { cx: 0, cy: 0, dh: 1, pret: false }
    function cadrerLibre(c) {
      const W = el.clientWidth || 300
      const H = el.clientHeight || 400
      if (!libre.pret || c.instantane) {
        libre.cx = c.centre[0]
        libre.cy = c.centre[1]
        libre.dh = c.demiHauteur
        libre.pret = true
      } else {
        libre.cx = lisse(libre.cx, c.centre[0], 0.16)
        libre.cy = lisse(libre.cy, c.centre[1], 0.16)
        libre.dh = lisse(libre.dh, c.demiHauteur, 0.16)
      }
      // si la zone est plus large que l'écran, on agrandit pour la garder entière
      const dh = Math.max(libre.dh, c.demiLargeur ? (c.demiLargeur * H) / W : 0)
      camera.left = -dh * (W / H)
      camera.right = dh * (W / H)
      camera.top = dh
      camera.bottom = -dh
      const centre = tmp.set(libre.cx, libre.cy, 0).clone()
      camera.position.set(libre.cx, libre.cy, 4)
      camera.up.set(0, 1, 0)
      camera.lookAt(centre)
      camera.zoom = 1
      camera.updateProjectionMatrix()
      controles.target.copy(centre)
      lumiere.position.set(libre.cx + 1.5, libre.cy + 3, 3)
      contre.position.set(libre.cx - 1, libre.cy + 1, -3)
    }

    function cadrer() {
      const p = derniers.current
      if (p.cadre) {
        if (meshes.length) cadrerLibre(p.cadre)
        return
      }
      const cle = `${p.vue || 'face'}|${p.cadrage || 'corps'}|${el.clientWidth}x${el.clientHeight}`
      if (cle === cleCamera) return
      const def = CADRAGES[p.cadrage || 'corps'] || CADRAGES.corps
      const boite = new THREE.Box3()
      for (const m of meshes) {
        if (def.groupes && !def.groupes.includes(m.userData.groupe)) continue
        if (def.cote && m.userData.cote && m.userData.cote !== def.cote) continue
        if (m.userData.groupe === 'peau' || m.userData.groupe === 'disques') continue
        boite.union(m.geometry.boundingBox)
      }
      if (boite.isEmpty()) return
      cleCamera = cle
      const centre = boite.getCenter(new THREE.Vector3())
      const taille = boite.getSize(new THREE.Vector3())
      const vue = p.vue || 'face'
      const largeur = vue === 'profil' ? taille.z : taille.x
      const W = el.clientWidth || 300
      const H = el.clientHeight || 400
      const marge = p.marge ?? 1.15
      const demiH = Math.max(taille.y / 2, (largeur / 2) * (H / W)) * marge
      const demiW = demiH * (W / H)
      camera.left = -demiW
      camera.right = demiW
      camera.top = demiH
      camera.bottom = -demiH
      const dir = vue === 'profil' ? new THREE.Vector3(-1, 0, 0) : vue === 'dos' ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, 0, 1)
      camera.position.copy(centre).addScaledVector(dir, 4)
      camera.up.set(0, 1, 0)
      camera.lookAt(centre)
      camera.zoom = 1
      camera.updateProjectionMatrix()
      controles.target.copy(centre)
      controles.update()
      lumiere.position.copy(centre).add(new THREE.Vector3(dir.x * 3 + 1.5, 3, dir.z * 3 + 1.5))
      contre.position.copy(centre).add(new THREE.Vector3(-dir.x * 3 - 1, 1, -dir.z * 3 - 1))
    }

    function redimensionner() {
      const W = el.clientWidth
      const H = el.clientHeight
      if (!W || !H) return
      renderer.setSize(W, H, false)
      cleCamera = ''
      cadrer()
    }
    const ro = new ResizeObserver(redimensionner)
    ro.observe(el)

    // Point de repos (monde) → position actuelle, en suivant l'articulation
    const tmp = new THREE.Vector3()
    function versMonde(point, noeud) {
      const v = tmp.set(point[0], point[1], point[2])
      if (!noeud || !noeuds[noeud]) return v.clone()
      return noeuds[noeud].localToWorld(v.clone().sub(noeuds[noeud].userData.pivot))
    }

    function positionRef(ref) {
      if (!ref) return null
      if (ref.pivot) {
        const n = noeuds[ref.pivot]
        return n ? n.getWorldPosition(new THREE.Vector3()) : null
      }
      if (ref.point) return versMonde(ref.point, ref.noeud)
      return null
    }

    chargerAnatomie()
      .then((anat) => {
        if (arret) return
        pivots = anat.pivots
        // Articulations (une par côté) emboîtées : épaule > coude > poignet, hanche > genou > cheville
        for (const c of ['d', 'g']) {
          for (const [j, def] of Object.entries(CHAINE)) {
            const pv = pivots[`${j}_${c}`]
            if (!pv) continue
            const n = new THREE.Group()
            n.userData.pivot = pv.clone()
            noeuds[`${j}_${c}`] = n
          }
          for (const [j, def] of Object.entries(CHAINE)) {
            const n = noeuds[`${j}_${c}`]
            if (!n) continue
            const parent = def.parent ? noeuds[`${def.parent}_${c}`] : null
            if (parent) {
              parent.add(n)
              n.position.copy(n.userData.pivot).sub(parent.userData.pivot)
            } else {
              corps.add(n)
              n.position.copy(n.userData.pivot)
            }
          }
        }
        for (const piece of anat.pieces) {
          const materiau = new THREE.MeshStandardMaterial({ color: couleurBase(piece.groupe), roughness: 0.55, metalness: 0.02, side: THREE.DoubleSide })
          const articule = MUSCLES_ARTICULES[piece.groupe]
          const geo = articule ? piece.geo.clone() : piece.geo
          const mesh = new THREE.Mesh(geo, materiau)
          mesh.userData = { groupe: piece.groupe, cote: piece.cote, decal: new THREE.Vector3(), base: new THREE.Vector3() }
          const joint = Object.entries(CHAINE).find(([, d]) => d.os.includes(piece.groupe))?.[0]
          const noeud = joint && piece.cote ? noeuds[`${joint}_${piece.cote}`] : null
          if (noeud) {
            noeud.add(mesh)
            mesh.userData.base.copy(noeud.userData.pivot).negate()
            mesh.userData.noeud = `${joint}_${piece.cote}`
          } else {
            corps.add(mesh)
          }
          mesh.position.copy(mesh.userData.base)
          meshes.push(mesh)
          if (articule && piece.cote) {
            // Poids de chaque sommet : suit l'os du dessus ou celui du dessous
            const [jp, jd] = articule
            const pp = pivots[`${jp}_${piece.cote}`]
            const pd = pivots[`${jd}_${piece.cote}`]
            if (pp && pd) {
              const repos = Float32Array.from(geo.attributes.position.array)
              const axe = pp.clone().sub(pd).normalize()
              const poids = new Float32Array(repos.length / 3)
              const centre = geo.boundingBox.getCenter(new THREE.Vector3())
              let tMin = Infinity
              let tMax = -Infinity
              const v = new THREE.Vector3()
              for (let i = 0; i < poids.length; i++) {
                v.fromArray(repos, i * 3)
                const t = v.clone().sub(pd).dot(axe)
                poids[i] = Math.min(1, Math.max(0, (0.03 - t) / 0.06))
                const s = v.clone().sub(centre).dot(axe)
                tMin = Math.min(tMin, s)
                tMax = Math.max(tMax, s)
              }
              muscles.push({ mesh, repos, poids, axe, centre, demi: (tMax - tMin) / 2, milieu: (tMax + tMin) / 2, prox: `${jp}_${piece.cote}`, dist: `${jd}_${piece.cote}`, cle: '' })
            }
          }
        }
        cadrer()
        setEtat('pret')
        derniers.current.onPret?.({
          pivots,
          versMonde: (point, noeud) => versMonde(point, noeud).toArray(),
          // position à l'écran (pixels du cadre) d'un point du modèle, et échelle (pixels par mètre)
          projeter: (point, noeud) => {
            const e = versMonde(point, noeud).project(camera)
            return { x: ((e.x + 1) / 2) * el.clientWidth, y: ((1 - e.y) / 2) * el.clientHeight }
          },
          pixelsParMetre: () => el.clientHeight / (camera.top - camera.bottom),
          // image du squelette tel qu'il est affiché (pour fabriquer une affiche à enregistrer)
          capturer: () => {
            renderer.render(scene, camera)
            const c = document.createElement('canvas')
            c.width = renderer.domElement.width
            c.height = renderer.domElement.height
            const x = c.getContext('2d')
            const fond = x.createRadialGradient(c.width / 2, c.height * 0.4, 0, c.width / 2, c.height * 0.4, Math.max(c.width, c.height) * 0.75)
            fond.addColorStop(0, '#1A2A55')
            fond.addColorStop(1, '#070B16')
            x.fillStyle = fond
            x.fillRect(0, 0, c.width, c.height)
            x.drawImage(renderer.domElement, 0, 0)
            return c
          },
          boite: (groupe, cote) => {
            const m = meshes.find((x) => x.userData.groupe === groupe && (!cote || x.userData.cote === cote))
            return m ? m.geometry.boundingBox.clone() : null
          },
        })
      })
      .catch((e) => {
        console.error(e)
        if (!arret) setEtat('erreur')
      })

    // ---------- Sélection au doigt ----------
    const raycaster = new THREE.Raycaster()
    let depart = null
    function bas(e) {
      depart = { x: e.clientX, y: e.clientY }
    }
    function haut(e) {
      if (!depart) return
      const bouge = Math.hypot(e.clientX - depart.x, e.clientY - depart.y)
      depart = null
      if (bouge > 8) return
      const r = renderer.domElement.getBoundingClientRect()
      const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      raycaster.setFromCamera(ndc, camera)
      const p = derniers.current
      // Les marqueurs d'abord (ils sont petits) : tolérance élargie
      if (marqueurs.size && p.onMarqueur) {
        let meilleur = null
        let dmin = Infinity
        for (const [id, s] of marqueurs) {
          if (!s.visible) continue
          const ecran = s.getWorldPosition(new THREE.Vector3()).project(camera)
          const dx = ((ecran.x - ndc.x) * r.width) / 2
          const dy = ((ecran.y - ndc.y) * r.height) / 2
          const d = Math.hypot(dx, dy)
          if (d < 26 && d < dmin) {
            dmin = d
            meilleur = id
          }
        }
        if (meilleur !== null) {
          p.onMarqueur(meilleur)
          return
        }
      }
      if (!p.onChoisir) return
      const cibles = meshes.filter((m) => m.visible && !m.userData.attenue)
      const hit = raycaster.intersectObjects(cibles, false)[0]
      if (hit) p.onChoisir(hit.object.userData.groupe, hit.object.userData.cote, hit.point.toArray())
    }
    renderer.domElement.addEventListener('pointerdown', bas)
    renderer.domElement.addEventListener('pointerup', haut)

    // ---------- Boucle ----------
    const horloge = new THREE.Clock()
    const angles = {}
    function boucle() {
      raf = requestAnimationFrame(boucle)
      const p = derniers.current
      const t = horloge.getElapsedTime()
      cadrer()
      controles.enableRotate = !!p.rotation
      controles.enableZoom = !!p.rotation
      controles.autoRotate = !!p.tourner
      controles.autoRotateSpeed = 1.6
      renderer.domElement.style.touchAction = p.rotation ? 'none' : 'pan-y'
      controles.update()

      // Poses
      const vitesse = p.posesInstantanees ? 1 : 0.18
      for (const [cle, n] of Object.entries(noeuds)) {
        const [j, c] = cle.split('_')
        const val = p.poses?.[cle]
        const flex = typeof val === 'number' ? val : val?.flex || 0
        const abd = typeof val === 'object' && val ? val.abd || 0 : 0
        const a = (angles[cle] ||= { flex: 0, abd: 0 })
        a.flex = lisse(a.flex, flex, vitesse)
        a.abd = lisse(a.abd, abd, vitesse)
        const rf = THREE.MathUtils.degToRad(a.flex)
        const ra = THREE.MathUtils.degToRad(a.abd) * (c === 'd' ? -1 : 1)
        const sensFlex = j === 'genou' || j === 'cheville' ? 1 : -1
        n.rotation.set(sensFlex * rf, 0, j === 'epaule' || j === 'hanche' ? ra : 0)
      }
      corps.updateMatrixWorld(true)

      // États, visibilité, explosion
      const afficher = p.afficher || OS
      for (const m of meshes) {
        const { groupe, cote } = m.userData
        const e = p.etats?.[`${groupe}_${cote}`] || p.etats?.[groupe]
        m.visible = afficher.includes(groupe) && e !== 'cache'
        const mat = m.material
        const st = ETATS[e]
        mat.color.set(st ? st.couleur : couleurBase(groupe))
        mat.emissive.set(st ? st.emissif : '#000000')
        if (e === 'actif') mat.emissiveIntensity = 0.6 + 0.4 * Math.sin(t * 5)
        else mat.emissiveIntensity = 1
        const transparent = e === 'attenue' || (groupe === 'peau' && (p.opacitePeau ?? 1) < 1)
        mat.transparent = transparent
        mat.opacity = e === 'attenue' ? 0.12 : groupe === 'peau' ? p.opacitePeau ?? 1 : 1
        mat.depthWrite = !transparent
        m.userData.attenue = e === 'attenue' || (groupe === 'peau' && (p.opacitePeau ?? 1) < 0.3)
        const d = p.decalages?.[`${groupe}_${cote}`] || p.decalages?.[groupe]
        const cible = d ? tmp.set(d[0], d[1], d[2]) : tmp.set(0, 0, 0)
        m.userData.decal.lerp(cible, d ? 0.12 : 0.09)
        m.position.copy(m.userData.base).add(m.userData.decal)
      }

      // Muscles qui se déforment avec l'articulation (et gonflent quand ils se contractent)
      for (const mu of muscles) {
        const contraction = p.contractions?.[`${mu.mesh.userData.groupe}_${mu.mesh.userData.cote}`] ?? p.contractions?.[mu.mesh.userData.groupe] ?? 0
        mu.contraction = lisse(mu.contraction ?? 0, contraction, 0.15)
        const Mp = noeuds[mu.prox]?.matrixWorld
        const Md = noeuds[mu.dist]?.matrixWorld
        if (!Mp || !Md) continue
        const cle = `${Mp.elements.join()}|${Md.elements.join()}|${mu.contraction.toFixed(3)}`
        if (cle === mu.cle) continue
        mu.cle = cle
        const ip = noeuds[mu.prox].userData.pivot
        const id = noeuds[mu.dist].userData.pivot
        const attr = mu.mesh.geometry.attributes.position
        const v = new THREE.Vector3()
        const a = new THREE.Vector3()
        const b = new THREE.Vector3()
        for (let i = 0; i < mu.poids.length; i++) {
          v.fromArray(mu.repos, i * 3)
          // gonflement au milieu du ventre du muscle
          if (mu.contraction > 0.001) {
            const s = v.clone().sub(mu.centre).dot(mu.axe)
            const profil = Math.max(0, 1 - Math.abs(s - mu.milieu) / (mu.demi || 1))
            const surAxe = mu.centre.clone().addScaledVector(mu.axe, s)
            v.sub(surAxe).multiplyScalar(1 + 0.45 * mu.contraction * profil * profil).add(surAxe)
          }
          a.copy(v).sub(ip).applyMatrix4(Mp)
          b.copy(v).sub(id).applyMatrix4(Md)
          const w = mu.poids[i]
          attr.setXYZ(i, a.x * (1 - w) + b.x * w, a.y * (1 - w) + b.y * w, a.z * (1 - w) + b.z * w)
        }
        attr.needsUpdate = true
        mu.mesh.geometry.computeVertexNormals()
        mu.mesh.geometry.computeBoundingSphere()
        mu.mesh.position.set(0, 0, 0)
      }

      // Marqueurs (petites sphères touchables)
      const ids = new Set()
      for (const mq of p.marqueurs || []) {
        ids.add(mq.id)
        let s = marqueurs.get(mq.id)
        if (!s) {
          s = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshBasicMaterial({ color: mq.couleur || '#FF8AD8', depthTest: false, transparent: true }))
          s.renderOrder = 10
          scene.add(s)
          marqueurs.set(mq.id, s)
        }
        s.material.color.set(mq.couleur || '#FF8AD8')
        const pos = positionRef(mq)
        s.visible = !!pos
        if (pos) s.position.copy(pos)
        const taille = (mq.taille || 0.014) * (mq.pulse === false ? 1 : 1 + 0.25 * Math.sin(t * 4 + mq.id.length))
        s.scale.setScalar(taille)
      }
      for (const [id, s] of marqueurs) {
        if (!ids.has(id)) {
          scene.remove(s)
          s.geometry.dispose()
          s.material.dispose()
          marqueurs.delete(id)
        }
      }

      // Tubes : muscle « fabriqué » par l'élève (bras mécanique)
      const listeTubes = p.tubes || []
      while (tubes.length > listeTubes.length) {
        const tb = tubes.pop()
        scene.remove(tb)
        tb.geometry.dispose()
      }
      listeTubes.forEach((def, i) => {
        const A = positionRef(def.de)
        const B = positionRef(def.a)
        if (!A || !B) return
        let tb = tubes[i]
        if (!tb) {
          tb = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ roughness: 0.5 }))
          scene.add(tb)
          tubes[i] = tb
        }
        tb.material.color.set(def.couleur || COULEURS.muscle)
        const L = A.distanceTo(B)
        const ventre = (def.epaisseur || 0.012) + L * 0.05
        const cote = new THREE.Vector3().subVectors(B, A).cross(camera.position.clone().sub(A)).normalize()
        const mil = A.clone().lerp(B, 0.5).addScaledVector(cote, (def.bombe || 0) * ventre)
        const courbe = new THREE.QuadraticBezierCurve3(A, mil, B)
        tb.geometry.dispose()
        const geo = new THREE.TubeGeometry(courbe, 24, 1, 12, false)
        // rayon variable : fin aux tendons, épais au milieu
        const pos = geo.attributes.position
        const centre = new THREE.Vector3()
        for (let k = 0; k < pos.count; k++) {
          const seg = Math.floor(k / 13)
          const u = seg / 24
          courbe.getPointAt(Math.min(1, u), centre)
          const r = u < 0.15 || u > 0.85 ? 0.0035 : ventre * Math.sin(((u - 0.15) / 0.7) * Math.PI) + 0.004
          const v = new THREE.Vector3(pos.getX(k), pos.getY(k), pos.getZ(k)).sub(centre).normalize().multiplyScalar(r).add(centre)
          pos.setXYZ(k, v.x, v.y, v.z)
        }
        geo.computeVertexNormals()
        tb.geometry = geo
      })

      renderer.render(scene, camera)

      // Étiquettes HTML
      const etiq = p.etiquettes || []
      etiquettesRef.current.forEach((div, i) => {
        if (!div) return
        const def = etiq[i]
        const pos = def && positionRef(def)
        if (!pos) {
          div.style.display = 'none'
          return
        }
        const ecran = pos.clone().project(camera)
        div.style.display = 'block'
        div.style.transform = `translate(-50%, -50%) translate(${((ecran.x + 1) / 2) * el.clientWidth + (def.decalage ? -16 : 0)}px, ${((1 - ecran.y) / 2) * el.clientHeight + (def.decalage ? -14 : 0)}px)`
      })
    }
    boucle()

    return () => {
      arret = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      controles.dispose()
      renderer.domElement.removeEventListener('pointerdown', bas)
      renderer.domElement.removeEventListener('pointerup', haut)
      for (const m of meshes) {
        m.material.dispose()
        if (MUSCLES_ARTICULES[m.userData.groupe]) m.geometry.dispose()
      }
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return (
    <div ref={conteneur} className={`relative overflow-hidden ${props.className || ''}`} style={props.style}>
      {(props.etiquettes || []).map((e, i) => (
        <div
          key={i}
          ref={(d) => (etiquettesRef.current[i] = d)}
          className="pointer-events-none absolute left-0 top-0 whitespace-nowrap rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-bold"
          style={{ color: e.couleur || '#E8ECFF', display: 'none' }}
        >
          {e.texte}
        </div>
      ))}
      {etat === 'chargement' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-[#B9C1E3]">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#7CFF6B]/20 border-t-[#7CFF6B]" />
          Préparation du squelette…
        </div>
      )}
      {etat === 'erreur' && <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-[#FFD0D5]">Le modèle 3D n’a pas pu être chargé. Vérifie la connexion internet.</div>}
      {props.credit !== false && <p className="pointer-events-none absolute bottom-1 right-2 text-[9px] text-[#8A93B8]/80">{CREDIT_ANATOMIE}</p>}
    </div>
  )
}
