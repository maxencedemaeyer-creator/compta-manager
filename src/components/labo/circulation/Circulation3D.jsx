import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { TOLERANCE_GLISSE, toucherTolerant } from '../toucher3D.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { BLEU, CREDIT_CIRCULATION, ROUGE, chargerCirculation, longueurs, pointSur, sangRiche } from './modele.js'

// =============================================================
//  Circulation3D : le vrai cœur et les vrais vaisseaux en 3D.
//
//  Props principales
//  - afficher   : natures ('coeur','artere','veine','organe','os') et/ou groupes affichés
//  - couleurs   : 'sang' (rouge = riche en dioxygène, bleu = pauvre) | 'type' (artères rouges,
//                 veines bleues) | 'neutre' (tout gris : pour les jeux où il faut deviner)
//  - etats      : { groupe | groupe_cote | nature : 'ok'|'erreur'|'actif'|'attenue'|'cache'|'eclaire'|'reel' }
//                 ('reel' : vraie couleur du sang, même en mode neutre)
//  - coupe      : parois du cœur transparentes, on voit les 4 cavités remplies de sang
//  - battement  : battements par minute (0 = cœur immobile)
//  - cadrage    : 'corps' | 'coeur' | 'thorax' | 'tete' | 'bras' | 'jambe' | 'ventre'
//  - vue        : 'face' | 'dos' | 'gauche'
//  - rotation / tourner : faire tourner au doigt / tout seul
//  - flux       : [{ points:[[x,y,z]…], bascule: 0..1, avant, apres, nombre, vitesse }]
//                 des globules qui voyagent dans les vaisseaux (couleur avant/après la bascule)
//  - etiquettes : [{ texte, point:[x,y,z] | groupe, cote, couleur, dx, dy (décalage en pixels) }]
//  - onChoisir(groupe, cote, nature) / onPret(outils)
//    outils.goutte(id, [x,y,z] | null, couleur, taille) : une goutte pilotée par la page
//    outils.trace(id, points | null, couleur) : un trait lumineux le long d'un chemin
// =============================================================

const COULEURS = {
  paroi: '#B9454F',
  valvule: '#F1E3C8',
  piliers: '#C7606A',
  neutre: '#C9CFE6',
  os: '#E9DFC6',
  cerveau: '#E9B7C4',
  trachee_bronches: '#E7D7C3',
  oesophage: '#E3A27A',
  estomac: '#E8A27D',
  intestin_grele: '#EDB08C',
  gros_intestin: '#D99572',
  reins: '#9B3D3D',
  muscles_jambe: '#B5333F',
}
const OPACITE = { os: 0.16, cerveau: 0.55, trachee_bronches: 0.75, oesophage: 0.6, estomac: 0.5, intestin_grele: 0.38, gros_intestin: 0.38, reins: 0.85, muscles_jambe: 0.1 }

const ETATS = {
  ok: { couleur: '#9DFF8A', emissif: '#1F6B17' },
  erreur: { couleur: '#FF6B7A', emissif: '#6B1420' },
  actif: { couleur: '#8FF4FF', emissif: '#14606C' },
}

const CADRAGES = {
  corps: { natures: ['artere', 'veine'] },
  coeur: { natures: ['coeur'], exclure: ['arteres_coeur', 'veines_coeur'] },
  thorax: { groupes: ['paroi_ventricules', 'paroi_oreillette_d', 'paroi_oreillette_g', 'aorte', 'trachee_bronches', 'veine_cave_sup', 'arteres_pulmonaires', 'veines_pulmonaires'] },
  tete: { boite: [[-0.11, 1.33, -0.12], [0.11, 1.74, 0.12]] },
  bras: { boite: [[0.05, 0.74, -0.08], [0.33, 1.46, 0.1]] },
  jambe: { boite: [[-0.02, 0.0, -0.1], [0.17, 1.05, 0.12]] },
  ventre: { boite: [[-0.16, 0.86, -0.1], [0.16, 1.4, 0.12]] },
}

const OREILLETTES = ['paroi_oreillette_d', 'paroi_oreillette_g', 'cavite_oreillette_d', 'cavite_oreillette_g']
const VENTRICULES = ['paroi_ventricules', 'cavite_ventricule_d', 'cavite_ventricule_g', 'piliers', 'arteres_coeur', 'veines_coeur', 'valvule_tricuspide', 'valvule_mitrale']

// Forme d'un battement : les oreillettes se contractent d'abord, puis les ventricules
export function contractions(t, bpm) {
  if (!bpm) return { oreillettes: 0, ventricules: 0, phase: 0 }
  const phase = ((t * bpm) / 60) % 1
  const cloche = (x, a, b) => (x < a || x > b ? 0 : Math.sin(((x - a) / (b - a)) * Math.PI))
  return { oreillettes: cloche(phase, 0, 0.16), ventricules: cloche(phase, 0.16, 0.5), phase }
}

function couleurDe(groupe, nature, mode) {
  if (nature === 'os') return COULEURS.os
  if (nature === 'organe') return COULEURS[groupe] || '#D9B8A8'
  if (groupe.startsWith('paroi_')) return COULEURS.paroi
  if (groupe.startsWith('valvule_')) return COULEURS.valvule
  if (groupe === 'piliers') return COULEURS.piliers
  if (mode === 'neutre') return COULEURS.neutre
  if (mode === 'type') return nature === 'artere' ? ROUGE : nature === 'veine' ? BLEU : sangRiche(groupe, nature) ? ROUGE : BLEU
  const riche = sangRiche(groupe, nature)
  return riche === null ? COULEURS.paroi : riche ? ROUGE : BLEU
}

export default function Circulation3D(props) {
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
    el.prepend(renderer.domElement)
    Object.assign(renderer.domElement.style, { width: '100%', height: '100%', display: 'block' })

    const scene = new THREE.Scene()
    scene.add(new THREE.HemisphereLight('#ffffff', '#40324a', 1.5))
    const lumiere = new THREE.DirectionalLight('#ffffff', 2.3)
    scene.add(lumiere)
    const contre = new THREE.DirectionalLight('#ffb3c0', 0.9)
    scene.add(contre)
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 50)
    const controles = new OrbitControls(camera, renderer.domElement)
    controles.enableDamping = true
    controles.enablePan = false

    const corps = new THREE.Group()
    scene.add(corps)
    const meshes = []
    let modele = null
    let centreCoeur = new THREE.Vector3()
    let cleCamera = ''

    function boiteGroupes(def) {
      const boite = new THREE.Box3()
      if (def.boite) return boite.set(new THREE.Vector3(...def.boite[0]), new THREE.Vector3(...def.boite[1]))
      for (const m of meshes) {
        const { groupe, nature } = m.userData
        if (def.exclure?.includes(groupe)) continue
        if (def.natures && !def.natures.includes(nature)) continue
        if (def.groupes && !def.groupes.includes(groupe)) continue
        boite.union(m.userData.boite)
      }
      return boite
    }

    // Cadrage : la caméra glisse en douceur d'un cadrage à l'autre
    let transition = null
    function cadrer() {
      const p = derniers.current
      const def = typeof p.cadrage === 'object' ? p.cadrage : CADRAGES[p.cadrage || 'corps'] || CADRAGES.corps
      const cle = `${p.vue || 'face'}|${JSON.stringify(def)}|${el.clientWidth}x${el.clientHeight}`
      if (cle === cleCamera || !meshes.length) return
      const boite = boiteGroupes(def)
      if (boite.isEmpty()) return
      const premier = !cleCamera
      const memeTaille = cleCamera.split('|')[2] === cle.split('|')[2]
      cleCamera = cle
      const centre = boite.getCenter(new THREE.Vector3())
      const taille = boite.getSize(new THREE.Vector3())
      const vue = p.vue || 'face'
      const largeur = vue === 'gauche' ? taille.z : taille.x
      const W = el.clientWidth || 300
      const H = el.clientHeight || 400
      const marge = p.marge ?? 1.12
      const demiH = Math.max(taille.y / 2, (largeur / 2) * (H / W)) * marge
      const demiW = demiH * (W / H)
      const dir = vue === 'gauche' ? new THREE.Vector3(1, 0, 0) : vue === 'dos' ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, 0, 1)
      const vers = { demiH, demiW, position: centre.clone().addScaledVector(dir, 4), cible: centre.clone() }
      const depuis = { demiH: camera.top / camera.zoom, demiW: camera.right / camera.zoom, position: camera.position.clone(), cible: controles.target.clone() }
      transition = { depuis, vers, debut: performance.now(), duree: premier || !memeTaille || p.instantane ? 0 : 900 }
      lumiere.position.copy(centre).add(new THREE.Vector3(dir.x * 3 + 1.2, 2.5, dir.z * 3 + 1.5))
      contre.position.copy(centre).add(new THREE.Vector3(-dir.x * 3 - 1, 0.5, -dir.z * 3 - 1))
    }
    function avancerTransition() {
      if (!transition) return
      const { depuis, vers, debut, duree } = transition
      const k0 = duree ? Math.min(1, (performance.now() - debut) / duree) : 1
      const k = k0 < 0.5 ? 2 * k0 * k0 : 1 - Math.pow(-2 * k0 + 2, 2) / 2
      const dH = depuis.demiH + (vers.demiH - depuis.demiH) * k
      const dW = depuis.demiW + (vers.demiW - depuis.demiW) * k
      Object.assign(camera, { left: -dW, right: dW, top: dH, bottom: -dH, zoom: 1 })
      camera.position.lerpVectors(depuis.position, vers.position, k)
      controles.target.lerpVectors(depuis.cible, vers.cible, k)
      camera.up.set(0, 1, 0)
      camera.lookAt(controles.target)
      camera.updateProjectionMatrix()
      if (k0 >= 1) transition = null
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

    // ---------- Gouttes et traces pilotées par la page ----------
    const halo = (() => {
      const c = document.createElement('canvas')
      c.width = c.height = 64
      const g = c.getContext('2d')
      const d = g.createRadialGradient(32, 32, 0, 32, 32, 32)
      d.addColorStop(0, 'rgba(255,255,255,1)')
      d.addColorStop(0.25, 'rgba(255,255,255,.75)')
      d.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = d
      g.fillRect(0, 0, 64, 64)
      return new THREE.CanvasTexture(c)
    })()
    const gouttes = new Map()
    const traces = new Map()
    function goutte(id, pos, couleur = ROUGE, taille = 0.016) {
      let s = gouttes.get(id)
      if (!pos) {
        if (s) {
          scene.remove(s)
          s.material.dispose()
          gouttes.delete(id)
        }
        return
      }
      if (!s) {
        s = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, depthTest: false, transparent: true, blending: THREE.AdditiveBlending }))
        s.renderOrder = 20
        scene.add(s)
        gouttes.set(id, s)
      }
      s.material.color.set(couleur)
      s.position.set(pos[0], pos[1], pos[2])
      s.scale.setScalar(taille * 3.2)
    }
    function trace(id, points, couleur = '#FFFFFF') {
      const ancienne = traces.get(id)
      if (ancienne) {
        scene.remove(ancienne)
        ancienne.geometry.dispose()
        ancienne.material.dispose()
        traces.delete(id)
      }
      if (!points || points.length < 2) return
      const geo = new THREE.BufferGeometry().setFromPoints(points.map((p) => (Array.isArray(p) ? new THREE.Vector3(...p) : p)))
      const l = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: couleur, transparent: true, opacity: 0.85, depthTest: false }))
      l.renderOrder = 15
      scene.add(l)
      traces.set(id, l)
    }

    // ---------- Flux de globules (animés ici, sans React) ----------
    let fluxCle = ''
    let fluxListe = []
    const fluxGeo = new THREE.BufferGeometry()
    const fluxMat = new THREE.PointsMaterial({ size: 9, map: halo, vertexColors: true, transparent: true, depthTest: false, blending: THREE.AdditiveBlending, sizeAttenuation: false })
    const fluxPoints = new THREE.Points(fluxGeo, fluxMat)
    fluxPoints.renderOrder = 18
    scene.add(fluxPoints)
    function preparerFlux(liste) {
      fluxListe = (liste || []).map((f) => {
        const pts = f.points.map((p) => (Array.isArray(p) ? new THREE.Vector3(...p) : p))
        return { ...f, pts, cumul: longueurs(pts), n: f.nombre || 18, avant: new THREE.Color(f.avant || ROUGE), apres: new THREE.Color(f.apres || f.avant || ROUGE) }
      })
      const total = fluxListe.reduce((s, f) => s + f.n, 0)
      fluxGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(total * 3), 3))
      fluxGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(total * 3), 3))
    }

    chargerCirculation()
      .then((m) => {
        if (arret) return
        modele = m
        for (const piece of m.pieces) {
          const mat = new THREE.MeshStandardMaterial({ roughness: 0.42, metalness: 0.03, side: THREE.DoubleSide })
          const mesh = new THREE.Mesh(piece.geo, mat)
          const boite = piece.geo.boundingBox.clone()
          mesh.userData = { groupe: piece.groupe, cote: piece.cote, nature: piece.nature, boite, centre: boite.getCenter(new THREE.Vector3()), echelle: 1 }
          corps.add(mesh)
          meshes.push(mesh)
        }
        centreCoeur = new THREE.Vector3(...m.points.coeur)
        cadrer()
        setEtat('pret')
        derniers.current.onPret?.({
          modele: m,
          goutte,
          trace,
          boite: (groupe, cote) => {
            const b = new THREE.Box3()
            for (const x of meshes) if (x.userData.groupe === groupe && (!cote || x.userData.cote === cote)) b.union(x.userData.boite)
            return b.isEmpty() ? null : b
          },
          versEcran: (pt) => {
            const v = new THREE.Vector3(...pt).project(camera)
            return [((v.x + 1) / 2) * el.clientWidth, ((1 - v.y) / 2) * el.clientHeight]
          },
        })
      })
      .catch((e) => {
        console.error(e)
        if (!arret) setEtat('erreur')
      })

    // ---------- Sélection au doigt (tolérante : les vaisseaux sont fins) ----------
    const raycaster = new THREE.Raycaster()
    let depart = null
    const bas = (e) => {
      depart = { x: e.clientX, y: e.clientY }
    }
    const haut = (e) => {
      if (!depart) return
      const bouge = Math.hypot(e.clientX - depart.x, e.clientY - depart.y)
      depart = null
      const p = derniers.current
      if (bouge > TOLERANCE_GLISSE || !p.onChoisir) return
      const cibles = meshes.filter((m) => m.visible && !m.userData.attenue && (!p.choisissables || p.choisissables.includes(m.userData.nature) || p.choisissables.includes(m.userData.groupe)))
      const hit = toucherTolerant(e, renderer, camera, cibles, raycaster)
      if (hit) {
        const { groupe, cote, nature } = hit.object.userData
        p.onChoisir(groupe, cote, nature, hit.point.toArray())
        return
      }
      p.onChoisir(null)
    }
    renderer.domElement.addEventListener('pointerdown', bas)
    renderer.domElement.addEventListener('pointerup', haut)

    // ---------- Boucle ----------
    const horloge = new THREE.Clock()
    const tmp = new THREE.Vector3()
    const c1 = new THREE.Color()
    function boucle() {
      raf = requestAnimationFrame(boucle)
      const p = derniers.current
      const t = horloge.getElapsedTime()
      cadrer()
      avancerTransition()
      controles.enableRotate = !!p.rotation
      controles.enableZoom = !!p.rotation
      controles.autoRotate = !!p.tourner
      controles.autoRotateSpeed = 1.4
      renderer.domElement.style.touchAction = p.rotation ? 'none' : 'pan-y'
      controles.update()

      const afficher = p.afficher || ['coeur', 'artere', 'veine', 'os']
      const { oreillettes, ventricules } = contractions(t, p.battement || 0)
      for (const m of meshes) {
        const { groupe, cote, nature } = m.userData
        const e = p.etats?.[`${groupe}_${cote}`] || p.etats?.[groupe] || p.etats?.[nature]
        const cavite = groupe.startsWith('cavite_')
        m.visible = (afficher.includes(nature) || afficher.includes(groupe)) && e !== 'cache' && (!cavite || p.coupe || afficher.includes(groupe))
        if (!m.visible) continue
        const mat = m.material
        const st = ETATS[e]
        mat.color.set(st ? st.couleur : couleurDe(groupe, nature, e === 'reel' ? 'sang' : p.couleurs || 'sang'))
        const brille = e === 'eclaire' || e === 'reel'
        mat.emissive.set(st ? st.emissif : brille ? mat.color : '#000000')
        mat.emissiveIntensity = e === 'actif' ? 0.6 + 0.4 * Math.sin(t * 5) : brille ? 0.45 + 0.25 * Math.sin(t * 4) : 1
        let opacite = 1
        if (e === 'attenue') opacite = 0.07
        else if (nature === 'os' || nature === 'organe') opacite = OPACITE[groupe] ?? OPACITE[nature] ?? 1
        else if (p.coupe && (groupe.startsWith('paroi_') || groupe === 'arteres_coeur' || groupe === 'veines_coeur')) opacite = 0.16
        const voulue = p.opacites?.[groupe] ?? p.opacites?.[nature]
        if (voulue !== undefined && e !== 'attenue') opacite = voulue
        mat.transparent = opacite < 1
        mat.opacity = opacite
        mat.depthWrite = opacite >= 1
        m.userData.attenue = opacite < 0.1
        // Battement : chaque partie du cœur se contracte autour de son propre centre
        const k = OREILLETTES.includes(groupe) ? 1 - 0.07 * oreillettes : VENTRICULES.includes(groupe) ? 1 - 0.06 * ventricules : 1
        if (nature === 'coeur' || groupe === 'arteres_coeur' || groupe === 'veines_coeur') {
          const c = m.userData.centre
          // on contracte vers le centre du cœur (mélange centre propre / centre du cœur) pour garder les pièces jointives
          tmp.copy(c).lerp(centreCoeur, 0.5)
          m.scale.setScalar(k)
          m.position.copy(tmp).multiplyScalar(1 - k)
        } else if (m.scale.x !== 1) {
          m.scale.setScalar(1)
          m.position.set(0, 0, 0)
        }
      }

      // Flux de globules
      const cleF = p.fluxCle ?? (p.flux ? p.flux.length : 0)
      if (cleF !== fluxCle) {
        fluxCle = cleF
        preparerFlux(p.flux)
      }
      fluxPoints.visible = fluxListe.length > 0
      if (fluxListe.length) {
        const pos = fluxGeo.attributes.position
        const col = fluxGeo.attributes.color
        let i = 0
        const vitesseCoeur = (p.battement || 70) / 70
        for (const f of fluxListe) {
          for (let j = 0; j < f.n; j++) {
            const u = (j / f.n + t * (f.vitesse || 0.05) * vitesseCoeur) % 1
            pointSur(f.pts, f.cumul, u, tmp)
            pos.setXYZ(i, tmp.x, tmp.y, tmp.z)
            const b = f.bascule ?? 2
            const mel = Math.min(1, Math.max(0, (u - b) / 0.04 + 0.5))
            c1.copy(f.avant).lerp(f.apres, mel)
            col.setXYZ(i, c1.r, c1.g, c1.b)
            i++
          }
        }
        pos.needsUpdate = true
        col.needsUpdate = true
        fluxMat.size = p.tailleFlux || 9
      }

      renderer.render(scene, camera)

      // Étiquettes HTML
      const etiq = p.etiquettes || []
      etiquettesRef.current.forEach((div, i) => {
        if (!div) return
        const def = etiq[i]
        let pt = def?.point
        if (def && !pt && def.groupe) {
          const b = new THREE.Box3()
          for (const x of meshes) if (x.userData.groupe === def.groupe && (!def.cote || x.userData.cote === def.cote)) b.union(x.userData.boite)
          if (!b.isEmpty()) pt = b.getCenter(new THREE.Vector3()).toArray()
        }
        if (!pt) {
          div.style.display = 'none'
          return
        }
        const ecran = tmp.set(pt[0], pt[1], pt[2]).project(camera)
        div.style.display = 'block'
        div.style.transform = `translate(-50%, -50%) translate(${((ecran.x + 1) / 2) * el.clientWidth + (def.dx || 0)}px, ${((1 - ecran.y) / 2) * el.clientHeight + (def.dy || 0)}px)`
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
      for (const m of meshes) m.material.dispose()
      for (const s of gouttes.values()) s.material.dispose()
      for (const l of traces.values()) {
        l.geometry.dispose()
        l.material.dispose()
      }
      fluxGeo.dispose()
      fluxMat.dispose()
      halo.dispose()
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
          className="pointer-events-none absolute left-0 top-0 whitespace-nowrap rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-bold"
          style={{ color: e.couleur || '#E8ECFF', display: 'none' }}
        >
          {e.texte}
        </div>
      ))}
      {etat === 'chargement' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-[#B9C1E3]">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#FF4D6D]/20 border-t-[#FF4D6D]" />
          Préparation du cœur et des vaisseaux…
        </div>
      )}
      {etat === 'erreur' && <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-[#FFD0D5]">Le modèle 3D n’a pas pu être chargé. Vérifie la connexion internet.</div>}
      {props.credit !== false && <p className="pointer-events-none absolute bottom-1 right-2 text-[9px] text-[#8A93B8]/80">{CREDIT_CIRCULATION}</p>}
    </div>
  )
}
