import * as THREE from 'three'

// =============================================================
//  Outils 3D de l'expérience « L'espace » :
//  textures réelles (NASA, voir PiedLabo), astres, halo du Soleil,
//  anneaux de Saturne (profil réel), atmosphère, étoiles.
// =============================================================
const BASE = '/labo/espace/'
const chargeur = new THREE.TextureLoader()
const cache = new Map()

// Texture d'un fichier de public/labo/espace (partagée entre les activités)
export function texture(nom, { srgb = true } = {}) {
  const cle = nom + (srgb ? '' : ':lin')
  if (cache.has(cle)) return cache.get(cle)
  const t = chargeur.load(`${BASE}${nom}.jpg`)
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
  t.anisotropy = 4
  cache.set(cle, t)
  return t
}

function canvasTexture(w, h, dessin) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  dessin(c.getContext('2d'), w, h)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

let texGlow
function textureGlow() {
  if (!texGlow)
    texGlow = canvasTexture(128, 128, (g, w, h) => {
      const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
      r.addColorStop(0, 'rgba(255,255,255,1)')
      r.addColorStop(0.18, 'rgba(255,255,255,.75)')
      r.addColorStop(0.45, 'rgba(255,255,255,.22)')
      r.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = r
      g.fillRect(0, 0, w, h)
    })
  return texGlow
}

let texRayons
function textureRayons() {
  if (!texRayons)
    texRayons = canvasTexture(256, 256, (g, w, h) => {
      g.translate(w / 2, h / 2)
      for (let i = 0; i < 12; i++) {
        g.save()
        g.rotate((i * Math.PI) / 6)
        const l = i % 3 === 0 ? w / 2 : w / 2.7
        const r = g.createLinearGradient(0, 0, l, 0)
        r.addColorStop(0, 'rgba(255,255,255,.55)')
        r.addColorStop(1, 'rgba(255,255,255,0)')
        g.fillStyle = r
        g.beginPath()
        g.moveTo(0, -3)
        g.lineTo(l, 0)
        g.lineTo(0, 3)
        g.fill()
        g.restore()
      }
    })
  return texRayons
}

export function halo(couleur, taille, opacite = 1, carte = null) {
  const m = new THREE.SpriteMaterial({ map: carte || textureGlow(), color: couleur, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: opacite })
  const s = new THREE.Sprite(m)
  s.scale.set(taille, taille, 1)
  return s
}

// Le Soleil : surface texturée, halo, rayons qui tournent, lumière sur tout le décor
export function creerSoleil(rayon, { lumiere = true } = {}) {
  const g = new THREE.Group()
  const corps = new THREE.Mesh(new THREE.SphereGeometry(rayon, 48, 32), new THREE.MeshBasicMaterial({ map: texture('soleil'), color: '#FFB652' }))
  g.add(corps)
  const h1 = halo('#FFB347', rayon * 5.2, 0.85)
  const h2 = halo('#FF7A2E', rayon * 10, 0.3)
  const rayons = halo('#FFD9A0', rayon * 7.5, 0.4, textureRayons())
  g.add(h2, h1, rayons)
  if (lumiere) {
    const l = new THREE.PointLight('#FFF3E0', 3.4, 0, 0)
    g.add(l)
  }
  g.userData.maj = (t) => {
    corps.rotation.y = t * 0.04
    rayons.material.rotation = t * 0.05
    const p = 1 + 0.03 * Math.sin(t * 1.7)
    h1.scale.set(rayon * 5.2 * p, rayon * 5.2 * p, 1)
  }
  return g
}

const VERT_TERRE = `
varying vec2 vUv; varying vec3 vN; varying vec3 vP;
void main(){
  vUv = uv; vN = normalize(mat3(modelMatrix) * normal);
  vec4 wp = modelMatrix * vec4(position, 1.0); vP = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`
const FRAG_TERRE = `
uniform sampler2D jour; uniform sampler2D nuit; uniform vec3 sunPos;
varying vec2 vUv; varying vec3 vN; varying vec3 vP;
void main(){
  vec3 n = normalize(vN); vec3 l = normalize(sunPos - vP); float d = dot(n, l);
  vec3 dc = texture2D(jour, vUv).rgb; vec3 nc = texture2D(nuit, vUv).rgb;
  float t = smoothstep(-0.10, 0.16, d);
  vec3 cj = dc * (0.06 + 1.15 * max(d, 0.0));
  vec3 cn = dc * 0.010 + nc * vec3(1.5, 1.05, 0.55) * 1.25;
  vec3 col = mix(cn, cj, t);
  float crep = exp(-pow(d / 0.11, 2.0));
  col += vec3(1.0, 0.42, 0.12) * crep * 0.10;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`
const VERT_ATMO = `
varying vec3 vN; varying vec3 vP;
void main(){
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 wp = modelMatrix * vec4(position, 1.0); vP = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`
const FRAG_ATMO = `
uniform vec3 couleur; uniform vec3 sunPos; uniform float force;
varying vec3 vN; varying vec3 vP;
void main(){
  vec3 n = normalize(vN); vec3 v = normalize(cameraPosition - vP); vec3 l = normalize(sunPos - vP);
  float f = pow(max(0.0, 0.70 - dot(n, v)), 3.2) * force;
  float s = smoothstep(-0.45, 0.55, dot(n, l));
  gl_FragColor = vec4(couleur * f * (0.25 + 0.75 * s), f * (0.25 + 0.75 * s));
}`

// Fine couche d'atmosphère (halo coloré qui s'estompe vers l'extérieur, plus fort côté Soleil)
export function atmosphere(rayon, couleur, sunPos, force = 0.55, epaisseur = 1.12) {
  const m = new THREE.ShaderMaterial({
    uniforms: { couleur: { value: new THREE.Color(couleur) }, sunPos: { value: sunPos }, force: { value: force } },
    vertexShader: VERT_ATMO,
    fragmentShader: FRAG_ATMO,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  })
  return new THREE.Mesh(new THREE.SphereGeometry(rayon * epaisseur, 48, 32), m)
}

// La Terre : jour / nuit (lumières des villes), crépuscule orangé, nuages, atmosphère.
// sunPos : Vector3 (position du Soleil, en coordonnées du monde, partagée et mise à jour par la scène)
// Groupe retourné : g.userData.surface (rotation de la surface), g.userData.nuages
export function creerTerre(rayon, sunPos, { nuages = true } = {}) {
  const g = new THREE.Group()
  const surface = new THREE.Mesh(
    new THREE.SphereGeometry(rayon, 64, 48),
    new THREE.ShaderMaterial({ uniforms: { jour: { value: texture('terre') }, nuit: { value: texture('nuit') }, sunPos: { value: sunPos } }, vertexShader: VERT_TERRE, fragmentShader: FRAG_TERRE }),
  )
  g.add(surface)
  g.userData.surface = surface
  if (nuages) {
    const n = new THREE.Mesh(
      new THREE.SphereGeometry(rayon * 1.012, 48, 32),
      new THREE.MeshStandardMaterial({ color: '#FFFFFF', alphaMap: texture('nuages', { srgb: false }), transparent: true, opacity: 0.85, depthWrite: false, roughness: 1, metalness: 0 }),
    )
    g.add(n)
    g.userData.nuages = n
  }
  g.add(atmosphere(rayon, '#6FB4FF', sunPos, 0.7, 1.13))
  return g
}

// Une planète ou une lune texturée (éclairée par le Soleil de la scène)
export function creerAstre(nomTexture, rayon, { atmo = null, sunPos = new THREE.Vector3(), segments = 48 } = {}) {
  const g = new THREE.Group()
  const corps = new THREE.Mesh(new THREE.SphereGeometry(rayon, segments, Math.round(segments * 0.7)), new THREE.MeshStandardMaterial({ map: texture(nomTexture), roughness: 1, metalness: 0 }))
  g.add(corps)
  g.userData.corps = corps
  if (atmo) g.add(atmosphere(rayon, atmo.couleur, sunPos, atmo.force ?? 0.5, atmo.epaisseur ?? 1.12))
  return g
}

// Anneaux de Saturne, profil réel (rayons en rayons de Saturne, d'après les mesures de Cassini) :
// anneau C (1,24–1,53) sombre · B (1,53–1,95) le plus brillant · division de Cassini (1,95–2,03) presque vide ·
// A (2,03–2,27) avec la division d'Encke (≈ 2,215).
export function creerAnneauxSaturne(rayonPlanete) {
  const interne = 1.24
  const externe = 2.27
  const tex = canvasTexture(1024, 4, (g, w, h) => {
    const x = (r) => ((r - interne) / (externe - interne)) * w
    const bande = (a, b, alpha, c1, c2) => {
      const gr = g.createLinearGradient(x(a), 0, x(b), 0)
      gr.addColorStop(0, `rgba(${c1},${alpha})`)
      gr.addColorStop(1, `rgba(${c2},${alpha})`)
      g.fillStyle = gr
      g.fillRect(x(a), 0, x(b) - x(a), h)
    }
    bande(1.24, 1.53, 0.3, '120,105,90', '150,130,110')
    bande(1.53, 1.75, 0.82, '170,148,118', '205,182,148')
    bande(1.75, 1.95, 0.92, '218,196,158', '196,172,138')
    bande(1.95, 2.03, 0.06, '120,110,100', '120,110,100')
    bande(2.03, 2.27, 0.62, '188,170,142', '168,152,128')
    g.clearRect(x(2.208), 0, x(2.222) - x(2.208), h) // division d'Encke
    // fines ondulations pour casser l'uniformité
    for (let i = 0; i < 90; i++) {
      const r = 1.3 + Math.random() * 0.95
      g.fillStyle = `rgba(0,0,0,${0.04 + Math.random() * 0.08})`
      g.fillRect(x(r), 0, 1 + Math.random() * 2, h)
    }
  })
  const geo = new THREE.RingGeometry(rayonPlanete * interne, rayonPlanete * externe, 128, 1)
  const pos = geo.attributes.position
  const uv = geo.attributes.uv
  for (let i = 0; i < pos.count; i++) {
    const r = Math.hypot(pos.getX(i), pos.getY(i))
    uv.setXY(i, (r - rayonPlanete * interne) / (rayonPlanete * (externe - interne)), 0.5)
  }
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, roughness: 1, metalness: 0, depthWrite: false }))
  m.rotation.x = -Math.PI / 2
  return m
}

// Cercle d'orbite (dans le plan horizontal)
export function orbite(rayon, couleur = '#A66BFF', opacite = 0.35, n = 200) {
  const pts = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    pts.push(new THREE.Vector3(Math.cos(a) * rayon, 0, -Math.sin(a) * rayon))
  }
  const l = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: couleur, transparent: true, opacity: opacite }))
  return l
}

// Ciel étoilé en 3D (points aux couleurs réelles : étoiles bleutées, blanches, jaunes, orangées)
export function etoiles3D(n = 900, rayon = 70) {
  const pos = new Float32Array(n * 3)
  const col = new Float32Array(n * 3)
  const palette = ['#FFFFFF', '#FFFFFF', '#CFE0FF', '#FFE9C4', '#FFD2A1', '#FFC1E8'].map((c) => new THREE.Color(c))
  for (let i = 0; i < n; i++) {
    const u = Math.random() * 2 - 1
    const a = Math.random() * Math.PI * 2
    const s = Math.sqrt(1 - u * u)
    const r = rayon * (1 + Math.random() * 0.5)
    pos[i * 3] = Math.cos(a) * s * r
    pos[i * 3 + 1] = u * r
    pos[i * 3 + 2] = Math.sin(a) * s * r
    const c = palette[Math.floor(Math.random() * palette.length)]
    const k = 0.45 + Math.random() * 0.55
    col[i * 3] = c.r * k
    col[i * 3 + 1] = c.g * k
    col[i * 3 + 2] = c.b * k
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
  const disque = canvasTexture(32, 32, (g, w, h) => {
    const r = g.createRadialGradient(16, 16, 0, 16, 16, 16)
    r.addColorStop(0, 'rgba(255,255,255,1)')
    r.addColorStop(0.4, 'rgba(255,255,255,.6)')
    r.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = r
    g.fillRect(0, 0, w, h)
  })
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 2.6, sizeAttenuation: false, vertexColors: true, map: disque, transparent: true, depthWrite: false, opacity: 0.9 }))
  pts.frustumCulled = false
  return pts
}

// Éclairage commun : lumière douce pour qu'on devine la face sombre (sans mentir : elle reste très sombre)
export function ambiance(scene, force = 0.12) {
  scene.add(new THREE.AmbientLight('#8A7BFF', force))
}

export const deg = (x) => (x * Math.PI) / 180
