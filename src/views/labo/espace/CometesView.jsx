import { useRef, useState } from 'react'
import { Gauge, Snowflake, Flame } from 'lucide-react'
import { Carte, Duo } from '../../../components/labo/CadreJeu.jsx'
import { ambiance, creerSoleil, deg, etoiles3D, orbite } from '../../../components/labo/espace/outils3d.js'
import { nombre, OR, ORANGE, LILAS } from '../../../components/labo/espace/donnees.js'
import { BoutonLecture, Curseur, PageEspace, PasEchelle, Vitesses, Vue3D, useLecture } from './commun.jsx'

// =============================================================
//  S9 · Comètes — la comète de Halley : une boule de glace et de poussière sur une orbite très allongée.
//  Orbite réelle : demi‑grand axe a = 17,834 UA, excentricité e = 0,967 → périhélie 0,586 UA, aphélie 35,08 UA, période ≈ 75,3 ans.
//  Dernier périhélie : 9 février 1986 (≈ 1986,11) ; prochain : vers 2061. Aphélie : décembre 2023.
//  Mouvement : équation de Kepler M = E − e·sin E ; vitesse : v = √(GM(2/r − 1/a)), GM = 1,327·10¹¹ km³/s² (de 54,5 km/s au périhélie à 0,9 km/s à l'aphélie).
//  Queue : toujours à l'opposé du Soleil (vent solaire + pression de la lumière), seulement quand la comète est assez proche (< ≈ 5 UA).
//  Dessin : distance au Soleil dilatée r' = 2,2·√r (UA) pour voir à la fois les planètes et l'aphélie (pas à l'échelle) ; orbite dessinée dans le plan (en vrai elle est inclinée de 162° : Halley tourne « à l'envers »).
//  Attendus aucun (hors référentiel : comètes) (voir le référentiel P5-P6 §3.1).
// =============================================================
const A = 17.834
const E = 0.967
const P = Math.pow(A, 1.5) // 75,3 ans
const T_PERI = 1986.11
const GM = 1.327e11
const UA_KM = 1.496e8
const remap = (r) => 2.2 * Math.sqrt(r)
const PLAN = [
  ['Terre', 1, '#7FE3A0'],
  ['Jupiter', 5.2, '#D9A066'],
  ['Saturne', 9.58, '#E8D3A2'],
  ['Uranus', 19.2, '#9FE0E6'],
  ['Neptune', 30.07, '#9B8CFF'],
]

// Résolution de l'équation de Kepler (Newton)
function kepler(M) {
  let Ea = M + E * Math.sin(M)
  for (let i = 0; i < 12; i++) Ea -= (Ea - E * Math.sin(Ea) - M) / (1 - E * Math.cos(Ea))
  return Ea
}
export function etatComete(an) {
  const M = ((2 * Math.PI * (an - T_PERI)) / P) % (2 * Math.PI)
  const Ea = kepler(M < 0 ? M + 2 * Math.PI : M)
  const x = A * (Math.cos(Ea) - E)
  const y = A * Math.sqrt(1 - E * E) * Math.sin(Ea)
  const r = A * (1 - E * Math.cos(Ea))
  const nu = Math.atan2(y, x)
  const v = Math.sqrt(GM * (2 / (r * UA_KM) - 1 / (A * UA_KM)))
  return { r, nu, v }
}
const posScene = (r, nu, THREE) => new THREE.Vector3(Math.cos(nu) * remap(r), 0, -Math.sin(nu) * remap(r))

function texPoint(THREE) {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  r.addColorStop(0, 'rgba(255,255,255,1)')
  r.addColorStop(0.35, 'rgba(255,255,255,.4)')
  r.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = r
  g.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(c)
}

function construire(ctx) {
  const { THREE, scene } = ctx
  scene.add(etoiles3D(1100, 95))
  ambiance(scene, 0.25)
  scene.add(creerSoleil(0.5))
  const etisPlan = []
  PLAN.forEach(([nom, r, c]) => {
    scene.add(orbite(remap(r), c, 0.28))
    const e = ctx.etiquette({ texte: nom, couleur: c })
    e.el.style.fontSize = '12px'
    e.p = new THREE.Vector3(remap(r) * Math.cos(deg(-62)), 0, -remap(r) * Math.sin(deg(-62)))
    etisPlan.push(e)
  })

  // orbite de la comète (ellipse réelle, distances dilatées)
  const pts = []
  for (let i = 0; i <= 360; i++) {
    const Ea = (i / 360) * 2 * Math.PI
    const x = A * (Math.cos(Ea) - E)
    const y = A * Math.sqrt(1 - E * E) * Math.sin(Ea)
    pts.push(posScene(Math.hypot(x, y), Math.atan2(y, x), THREE))
  }
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#FFA24D', transparent: true, opacity: 0.7 })))

  // noyau + coma
  const noyau = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 1), new THREE.MeshStandardMaterial({ color: '#8C8577', roughness: 1, flatShading: true }))
  scene.add(noyau)
  const tex = texPoint(THREE)
  const coma = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: '#FFF1D0', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.9 }))
  scene.add(coma)

  const NB = 300
  function queue(couleur, taille) {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NB * 3), 3))
    const m = new THREE.PointsMaterial({ map: tex, color: couleur, size: taille, sizeAttenuation: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.55 })
    const p = new THREE.Points(g, m)
    p.frustumCulled = false
    scene.add(p)
    return p
  }
  const ion = queue('#E6DFFF', 0.3)
  const poussiere = queue('#FFE2A8', 0.38)
  const hasard = Array.from({ length: NB }, () => [Math.random() - 0.5, Math.random() - 0.5, Math.random()])

  const etiC = ctx.etiquette({ texte: 'Comète de Halley', couleur: '#FFE2A8' })
  const etiS = ctx.etiquette({ texte: 'Soleil', couleur: '#FFD27A' })
  const v = new THREE.Vector3()
  const dir = new THREE.Vector3()
  const vit = new THREE.Vector3()
  const perp = new THREE.Vector3()
  const up = new THREE.Vector3(0, 1, 0)

  return {
    maj(dt, t) {
      const s = ctx.d().etat
      if (s.joue) {
        s.an += dt * s.vit[s.vitesse]
        if (s.an > 2062) s.an = 1986
      }
      const c = etatComete(s.an)
      const c2 = etatComete(s.an + 0.02)
      const p = posScene(c.r, c.nu, THREE)
      const p2 = posScene(c2.r, c2.nu, THREE)
      noyau.position.copy(p)
      noyau.rotation.y = t * 0.8
      coma.position.copy(p)
      // activité : la queue n'existe que près du Soleil
      const act = THREE.MathUtils.smoothstep(6.5 - c.r, 0, 4.5) // 0 au‑delà de 6,5 UA, 1 en dessous de 2 UA
      const L = act * Math.min(8, 7 / Math.pow(c.r, 0.55))
      coma.scale.setScalar(0.35 + act * 0.9)
      coma.material.opacity = 0.25 + 0.65 * act
      dir.copy(p).normalize() // loin du Soleil
      vit.copy(p2).sub(p).normalize()
      perp.crossVectors(dir, up).normalize()
      const a1 = ion.geometry.attributes.position
      const a2 = poussiere.geometry.attributes.position
      for (let i = 0; i < NB; i++) {
        const [hx, hy, hz] = hasard[i]
        const sIon = (i / NB) * (0.85 + 0.15 * hz)
        const w = sIon * 0.22 * L
        a1.setXYZ(i, p.x + dir.x * L * sIon + perp.x * hx * w, p.y + hy * w, p.z + dir.z * L * sIon + perp.z * hx * w)
        const sD = (i / NB) * (0.6 + 0.4 * hz)
        const arc = sD * sD * L * 0.45
        const wd = sD * 0.35 * L
        a2.setXYZ(i, p.x + dir.x * L * sD * 0.9 - vit.x * arc + perp.x * hx * wd, p.y + hy * wd * 0.6, p.z + dir.z * L * sD * 0.9 - vit.z * arc + perp.z * hx * wd)
      }
      a1.needsUpdate = true
      a2.needsUpdate = true
      ion.material.opacity = 0.85 * act
      poussiere.material.opacity = 0.7 * act
      etiC.place(v.copy(p).add(new THREE.Vector3(0, 0.9, 0)), 0, -8)
      etiS.place(v.set(0, -0.75, 0), 0, 0)
      etisPlan.forEach((e) => e.place(e.p, 0, 0))
    },
  }
}

export default function CometesView() {
  const etat = useRef({ an: 1986.11, joue: false, vitesse: 'normal', vit: { lent: 3, normal: 7, rapide: 16 } })
  const [joue, setJoue] = useState(false)
  const [vitesse, setVitesse] = useState('normal')
  const [glisse, setGlisse] = useState(null)
  const donnees = useRef({})
  donnees.current = { etat: etat.current }
  const l = useLecture(etat, (s) => ({ an: s.an }))
  const an = glisse ?? l.an
  const c = etatComete(an)
  const proche = c.r < 5
  const vNorm = Math.min(1, Math.log(c.v / 0.8) / Math.log(56 / 0.8))

  function aller(a) {
    etat.current.an = a
    etat.current.joue = false
    setJoue(false)
  }

  return (
    <PageEspace code="S9" titre="Comètes" attendus={[]} ecran large>
      <Duo
        visuelDabord
        commandes={
          <>
            <Carte couleur="rgba(255,226,168,.45)" className="!p-3">
              <p className="labo-jeu text-[22px] leading-tight" style={{ color: '#FFE2A8' }}>Comète de Halley</p>
              <p className="mt-1 text-[13px] leading-snug text-[#E8ECFF]">Une boule de glace et de poussière d’environ 11 km. Elle revient près de la Terre tous les <b className="text-white">75 ans</b> : vue en 1986, retour vers <b className="text-white">2061</b>.</p>
            </Carte>
            <div className="grid grid-cols-2 gap-2">
              <Carte couleur="rgba(255,162,77,.4)" className="!p-3">
                <p className="labo-mono text-[10px] text-[#B9C1E3]">DISTANCE AU SOLEIL</p>
                <p className="labo-jeu text-[24px] leading-none" style={{ color: OR }}>{nombre(c.r, 1)} <span className="text-[13px] text-[#B9C1E3]">UA</span></p>
                <p className="mt-0.5 text-[11px] text-[#B9C1E3]">{nombre(c.r * 149.6, 0)} millions de km</p>
              </Carte>
              <Carte couleur="rgba(255,162,77,.4)" className="!p-3">
                <p className="labo-mono flex items-center gap-1 text-[10px] text-[#B9C1E3]"><Gauge size={12} /> VITESSE</p>
                <p className="labo-jeu text-[24px] leading-none" style={{ color: OR }}>{nombre(c.v, c.v < 10 ? 1 : 0)} <span className="text-[13px] text-[#B9C1E3]">km/s</span></p>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#1B1440]"><div className="h-full rounded-full" style={{ width: `${Math.max(3, vNorm * 100)}%`, background: 'linear-gradient(90deg,#C9A3FF,#FFA24D)' }} /></div>
              </Carte>
            </div>
            <Carte couleur={proche ? 'rgba(255,162,77,.5)' : 'rgba(201,163,255,.4)'} className="!p-3">
              <p className="flex items-center gap-2 labo-jeu text-[18px]" style={{ color: proche ? ORANGE : LILAS }}>{proche ? <Flame size={20} /> : <Snowflake size={20} />}{proche ? 'La queue se forme !' : 'Loin du Soleil : pas de queue'}</p>
              <p className="mt-1 text-[12.5px] leading-snug text-[#E8ECFF]">{proche ? 'La chaleur transforme la glace en gaz. Le vent du Soleil pousse ce gaz et cette poussière : la queue pointe toujours à l’opposé du Soleil.' : 'La comète est gelée : un simple noyau sombre. Elle va très lentement.'}</p>
            </Carte>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => aller(1986.11)} className="min-h-[46px] rounded-2xl border text-[13px] font-bold active:scale-95" style={{ color: '#FFD9B0', borderColor: '#FFA24D88', background: 'rgba(11,10,30,.85)' }}>Au plus près (1986)</button>
              <button type="button" onClick={() => aller(2023.76)} className="min-h-[46px] rounded-2xl border text-[13px] font-bold active:scale-95" style={{ color: '#E5D6FF', borderColor: '#C9A3FF88', background: 'rgba(11,10,30,.85)' }}>Au plus loin (2023)</button>
            </div>
            <Curseur label="Année" valeur={Math.round(an * 10) / 10} min={1986} max={2062} step={0.1} onChange={(v) => { aller(v); setGlisse(v); clearTimeout(donnees.current.t); donnees.current.t = setTimeout(() => setGlisse(null), 400) }} format={(v) => nombre(v, 1)} couleur={ORANGE} />
            <div className="flex items-center gap-2">
              <BoutonLecture joue={joue} couleur={ORANGE} onClick={() => { etat.current.joue = !joue; setJoue(!joue) }} />
              <div className="flex-1">
                <Vitesses valeur={vitesse} onChange={(v) => { etat.current.vitesse = v; setVitesse(v) }} couleur={ORANGE} />
              </div>
            </div>
            <p className="labo-mono text-[10px] leading-snug text-[#8A93B8]">1 UA = distance Terre‑Soleil (150 millions de km). Une comète n’est pas une étoile filante : l’étoile filante est un grain de poussière qui brûle dans l’atmosphère.</p>
          </>
        }
      >
        <Vue3D construire={construire} donnees={donnees.current} position={[-1.5, 21, 19]} cible={[-1.5, 0, 0]} fov={40} orbite={{ min: 8, max: 40 }}>
          <PasEchelle texte="Distances dilatées · pas à l’échelle" />
        </Vue3D>
      </Duo>
    </PageEspace>
  )
}
