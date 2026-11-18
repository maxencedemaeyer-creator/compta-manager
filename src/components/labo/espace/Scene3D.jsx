import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// =============================================================
//  Scene3D : une scène three.js prête à l'emploi pour les activités
//  de l'expérience « L'espace ».
//    construire(ctx) → { maj(dt, t), apresRendu(), nettoyer() }
//    ctx : { THREE, renderer, scene, camera, controles, el, d() (données React à jour),
//            etiquette({texte, couleur, classe}) → { el, place(vecteur, dx, dy), cacher() },
//            surClic(fn(ndc, ev)) (clic net, pas un glissé), taille() }
//  - le canvas est transparent : le ciel étoilé de la page se voit derrière
//  - l'angle de vue s'élargit tout seul sur écran étroit (smartphone)
//  - tout est libéré quand on quitte l'activité (pas de fuite de mémoire)
// =============================================================
export default function Scene3D({ construire, donnees, className = '', fov = 40, position = [0, 6, 12], cible = [0, 0, 0], orbite = {}, pixelMax = 1.75, rotationAuto = 0, children }) {
  const conteneur = useRef(null)
  const dRef = useRef(donnees)
  dRef.current = donnees
  const [erreur, setErreur] = useState(false)

  useEffect(() => {
    const el = conteneur.current
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    } catch (e) {
      setErreur(true)
      return undefined
    }
    renderer.setPixelRatio(Math.min(pixelMax, window.devicePixelRatio || 1))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setClearColor(0x000000, 0)
    Object.assign(renderer.domElement.style, { width: '100%', height: '100%', display: 'block', touchAction: 'none' })
    el.prepend(renderer.domElement)

    const calque = document.createElement('div')
    Object.assign(calque.style, { position: 'absolute', inset: '0', pointerEvents: 'none', overflow: 'hidden' })
    el.appendChild(calque)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(fov, 1.4, 0.05, 400)
    camera.position.set(...position)
    const controles = new OrbitControls(camera, renderer.domElement)
    controles.target.set(...cible)
    controles.enableDamping = true
    controles.dampingFactor = 0.08
    controles.enablePan = false
    controles.rotateSpeed = 0.7
    controles.minDistance = orbite.min ?? 3
    controles.maxDistance = orbite.max ?? 40
    if (orbite.polaireMin != null) controles.minPolarAngle = orbite.polaireMin
    if (orbite.polaireMax != null) controles.maxPolarAngle = orbite.polaireMax
    if (orbite.azimut) {
      controles.minAzimuthAngle = orbite.azimut[0]
      controles.maxAzimuthAngle = orbite.azimut[1]
    }
    if (orbite.rotation === false) controles.enableRotate = false
    if (orbite.zoom === false) controles.enableZoom = false
    controles.autoRotate = rotationAuto !== 0
    controles.autoRotateSpeed = rotationAuto

    const nettoyages = []
    const etiquettes = []

    const ctx = {
      THREE,
      renderer,
      scene,
      camera,
      controles,
      el,
      calque,
      d: () => dRef.current,
      taille: () => ({ w: el.clientWidth || 1, h: el.clientHeight || 1 }),
      etiquette({ texte = '', couleur = '#fff', classe = '' } = {}) {
        const e = document.createElement('div')
        e.className = `labo-jeu ${classe}`
        e.textContent = texte
        Object.assign(e.style, { position: 'absolute', left: '0', top: '0', color: couleur, whiteSpace: 'nowrap', fontSize: '15px', lineHeight: '1', textShadow: '0 1px 6px #000, 0 0 3px #000', willChange: 'transform' })
        calque.appendChild(e)
        const v = new THREE.Vector3()
        const o = {
          el: e,
          place(p, dx = 0, dy = 0) {
            const { w, h } = ctx.taille()
            v.copy(p).project(camera)
            if (v.z > 1 || v.z < -1) {
              e.style.display = 'none'
              return
            }
            e.style.display = ''
            e.style.transform = `translate(${(v.x * 0.5 + 0.5) * w + dx}px, ${(-v.y * 0.5 + 0.5) * h + dy}px) translate(-50%, -50%)`
          },
          cacher() {
            e.style.display = 'none'
          },
        }
        etiquettes.push(e)
        return o
      },
      surClic(fn) {
        let dep = null
        const bas = (ev) => {
          dep = { x: ev.clientX, y: ev.clientY, t: performance.now() }
        }
        const haut = (ev) => {
          if (!dep) return
          const dist = Math.hypot(ev.clientX - dep.x, ev.clientY - dep.y)
          const duree = performance.now() - dep.t
          dep = null
          if (dist > 9 || duree > 600) return
          const r = renderer.domElement.getBoundingClientRect()
          fn(new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1), ev)
        }
        renderer.domElement.addEventListener('pointerdown', bas)
        renderer.domElement.addEventListener('pointerup', haut)
        nettoyages.push(() => {
          renderer.domElement.removeEventListener('pointerdown', bas)
          renderer.domElement.removeEventListener('pointerup', haut)
        })
      },
    }

    const app = construire(ctx) || {}

    // Taille et angle de vue : sur écran étroit (smartphone), on élargit pour que tout reste visible
    const tanBase = Math.tan(THREE.MathUtils.degToRad(fov) / 2)
    function redimensionner() {
      const w = el.clientWidth
      const h = el.clientHeight
      if (!w || !h) return
      renderer.setSize(w, h, false)
      const aspect = w / h
      camera.aspect = aspect
      const t = tanBase * Math.max(1, 1.9 / aspect)
      camera.fov = Math.min(110, THREE.MathUtils.radToDeg(2 * Math.atan(t)))
      camera.updateProjectionMatrix()
      app.redim?.(w, h)
    }
    const obs = new ResizeObserver(redimensionner)
    obs.observe(el)
    redimensionner()

    let raf = 0
    let dernier = performance.now()
    let t = 0
    const boucle = (now) => {
      raf = requestAnimationFrame(boucle)
      const dt = Math.min(0.05, (now - dernier) / 1000)
      dernier = now
      t += dt
      controles.update()
      app.maj?.(dt, t)
      renderer.render(scene, camera)
      app.apresRendu?.()
    }
    raf = requestAnimationFrame(boucle)

    return () => {
      cancelAnimationFrame(raf)
      obs.disconnect()
      nettoyages.forEach((f) => f())
      app.nettoyer?.()
      controles.dispose()
      scene.traverse((o) => {
        o.geometry?.dispose?.()
        const m = o.material
        if (m) (Array.isArray(m) ? m : [m]).forEach((x) => x.dispose?.())
      })
      renderer.dispose()
      renderer.forceContextLoss?.()
      renderer.domElement.remove()
      etiquettes.forEach((e) => e.remove())
      calque.remove()
    }
    // la scène se construit une seule fois ; les données changeantes passent par d()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div ref={conteneur} className={`relative overflow-hidden ${className}`}>
      {erreur && <p className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-[#B9C1E3]">La 3D n’est pas disponible sur cet appareil.</p>}
      {children}
    </div>
  )
}
