import { useEffect, useRef, useState } from 'react'
import { Check, Sun, Sunrise, Sunset, Moon } from 'lucide-react'
import { Carte, Duo, Eclat } from '../../../components/labo/CadreJeu.jsx'
import { ambiance, creerTerre, deg, etoiles3D, halo } from '../../../components/labo/espace/outils3d.js'
import { ORANGE } from '../../../components/labo/espace/donnees.js'
import { BoutonLecture, Curseur, PageEspace, Vitesses, Vue3D, useLecture } from './commun.jsx'

// =============================================================
//  S2 · Rotation — la Terre tourne sur elle-même (24 h) : jour ou nuit ?
//  Le Soleil est à droite (hors cadre). On pose un observateur (Bruxelles au départ)
//  et on lit l'heure solaire locale. Calcul exact (équinoxe, Soleil au-dessus de l'équateur) :
//    heure locale = 12 h + (longitude + rotation)/15°   ;   hauteur du Soleil : sin h = cos(lat)·cos(longitude + rotation)
//  Attendus 99, 102, 103, 105, 109 (voir le référentiel P5-P6 §3.1).
// =============================================================
const VILLES = [
  { nom: 'Bruxelles', lat: 50.85, lon: 4.35 },
  { nom: 'New York', lat: 40.7, lon: -74 },
  { nom: 'Rio', lat: -22.9, lon: -43.2 },
  { nom: 'Le Caire', lat: 30, lon: 31.2 },
  { nom: 'Tokyo', lat: 35.7, lon: 139.7 },
  { nom: 'Sydney', lat: -33.9, lon: 151.2 },
]
const BXL = VILLES[0]
const DEG_SEC = { lent: 9, normal: 20, rapide: 55 }
const mod = (x, n) => ((x % n) + n) % n

function lire(e) {
  const d = e.rot + e.pin.lon // angle entre le Soleil et l'observateur (degrés, vers l'est)
  const hauteur = (Math.asin(Math.cos(deg(e.pin.lat)) * Math.cos(deg(d))) * 180) / Math.PI
  const heure = mod(12 + d / 15, 24)
  const db = e.rot + BXL.lon
  const hautB = (Math.asin(Math.cos(deg(BXL.lat)) * Math.cos(deg(db))) * 180) / Math.PI
  return { heure, hauteur, heureB: mod(12 + db / 15, 24), hautB, nom: e.pin.nom }
}
const etatCiel = (h, heure) => (h > 6 ? 'jour' : h < -6 ? 'nuit' : heure < 12 ? 'lever' : 'coucher')
const fmtH = (h) => `${Math.floor(h)} h ${String(Math.floor((h % 1) * 60)).padStart(2, '0')}`

const MISSIONS = [
  { id: 'jourB', texte: 'Il fait jour à Bruxelles', ok: (l) => etatCiel(l.hautB, l.heureB) === 'jour' },
  { id: 'nuitB', texte: 'Il fait nuit à Bruxelles', ok: (l) => etatCiel(l.hautB, l.heureB) === 'nuit' },
  { id: 'midi', texte: 'Il est midi à Bruxelles', ok: (l) => Math.abs(l.heureB - 12) < 0.3 },
  { id: 'lever', texte: 'Le Soleil se lève quelque part', ok: (l) => etatCiel(l.hauteur, l.heure) === 'lever' },
  { id: 'oppose', texte: 'Jour à Bruxelles, nuit ailleurs', ok: (l, e) => e.pin.nom !== 'Bruxelles' && etatCiel(l.hautB, l.heureB) === 'jour' && etatCiel(l.hauteur, l.heure) === 'nuit' },
  { id: 'oppose2', texte: 'Nuit à Bruxelles, jour ailleurs', ok: (l, e) => e.pin.nom !== 'Bruxelles' && etatCiel(l.hautB, l.heureB) === 'nuit' && etatCiel(l.hauteur, l.heure) === 'jour' },
]

function construire(ctx) {
  const { THREE, scene, camera } = ctx
  const R = 1.7
  const sunPos = new THREE.Vector3(30, 0, 0)
  scene.add(etoiles3D(1000, 90))
  ambiance(scene, 0.1)
  const lum = new THREE.PointLight('#FFF3E0', 3.4, 0, 0)
  lum.position.copy(sunPos)
  scene.add(lum)
  const lueur = halo('#FFB347', 10, 0.5)
  lueur.position.set(6.3, 0.4, -2)
  scene.add(lueur)

  const incl = new THREE.Group()
  incl.rotation.x = deg(23.4)
  scene.add(incl)
  const terre = creerTerre(R, sunPos)
  incl.add(terre)
  const surface = terre.userData.surface
  // axe de rotation
  const axe = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -R * 1.55, 0), new THREE.Vector3(0, R * 1.55, 0)]), new THREE.LineDashedMaterial({ color: '#FFA24D', dashSize: 0.12, gapSize: 0.08, transparent: true, opacity: 0.85 }))
  axe.computeLineDistances()
  incl.add(axe)
  const etiN = ctx.etiquette({ texte: 'Nord', couleur: '#FFA24D' })
  const vN = new THREE.Vector3()

  // épingle de l'observateur (dans le repère de la surface : elle tourne avec la Terre)
  const pin = new THREE.Group()
  const tige = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.22, 8), new THREE.MeshBasicMaterial({ color: '#FFFFFF' }))
  tige.position.y = 0.11
  const tete = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), new THREE.MeshBasicMaterial({ color: '#FFE27A' }))
  tete.position.y = 0.24
  const lueurPin = halo('#FFD27A', 0.7, 0.9)
  lueurPin.position.y = 0.24
  pin.add(tige, tete, lueurPin)
  surface.add(pin)
  const etiPin = ctx.etiquette({ texte: '', couleur: '#FFE27A' })
  let derniere = ''
  const vecteur = new THREE.Vector3()
  const monde = new THREE.Vector3()
  function placerPin(lat, lon) {
    const phi = deg(lat)
    const lam = deg(lon)
    vecteur.set(Math.cos(phi) * Math.cos(lam), Math.sin(phi), -Math.cos(phi) * Math.sin(lam))
    pin.position.copy(vecteur).multiplyScalar(R)
    pin.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vecteur)
  }

  const rayon = new THREE.Raycaster()
  ctx.surClic((ndc) => {
    rayon.setFromCamera(ndc, camera)
    const h = rayon.intersectObject(surface, false)[0]
    if (!h) return
    const p = surface.worldToLocal(h.point.clone()).normalize()
    ctx.d().placer({ nom: 'Ton observateur', lat: (Math.asin(p.y) * 180) / Math.PI, lon: (Math.atan2(-p.z, p.x) * 180) / Math.PI })
  })

  return {
    maj(dt) {
      const e = ctx.d().etat
      if (e.joue) e.rot += dt * DEG_SEC[e.vitesse]
      surface.rotation.y = deg(e.rot)
      if (terre.userData.nuages) terre.userData.nuages.rotation.y = deg(e.rot) * 1.0 + 0.02
      const cle = `${e.pin.lat}|${e.pin.lon}`
      if (cle !== derniere) {
        placerPin(e.pin.lat, e.pin.lon)
        derniere = cle
        etiPin.el.textContent = e.pin.nom
      }
      pin.getWorldPosition(monde)
      monde.addScaledVector(monde.clone().normalize(), 0.5)
      etiPin.place(monde, 0, -4)
      // masquer l'étiquette quand l'épingle passe derrière la Terre
      const cam = camera.position.clone().sub(pin.getWorldPosition(vN)).normalize()
      const n = pin.getWorldPosition(vN).normalize()
      etiPin.el.style.opacity = n.dot(cam) > 0.05 ? '1' : '0.15'
      etiN.place(vN.set(0, R * 1.6, 0).applyMatrix4(incl.matrixWorld), 0, 0)
    },
  }
}

export default function RotationView() {
  const etat = useRef({ rot: 25, joue: true, vitesse: 'normal', pin: { ...BXL } })
  const [vitesse, setVitesse] = useState('normal')
  const [joue, setJoue] = useState(true)
  const [pin, setPin] = useState(BXL.nom)
  const [faites, setFaites] = useState([])
  const [glisse, setGlisse] = useState(null)
  const minuteur = useRef(null)
  const [eclat, setEclat] = useState({ message: '', cle: 0 })
  const donnees = useRef({})
  donnees.current = { etat: etat.current, placer: (p) => { etat.current.pin = p; setPin(p.nom) } }
  const l = useLecture(etat, lire)

  useEffect(() => {
    const id = setInterval(() => {
      const e = etat.current
      const x = lire(e)
      setFaites((f) => {
        const nouveaux = MISSIONS.filter((m) => !f.includes(m.id) && m.ok(x, e))
        if (!nouveaux.length) return f
        setEclat((c) => ({ message: 'Mission réussie !', cle: c.cle + 1 }))
        return [...f, ...nouveaux.map((m) => m.id)]
      })
    }, 200)
    return () => clearInterval(id)
  }, [])

  const ciel = etatCiel(l.hauteur, l.heure)
  const Icone = { jour: Sun, nuit: Moon, lever: Sunrise, coucher: Sunset }[ciel]
  const mot = { jour: 'Jour', nuit: 'Nuit', lever: 'Lever du Soleil', coucher: 'Coucher du Soleil' }[ciel]
  const coul = ciel === 'nuit' ? '#C9A3FF' : '#FFD27A'
  const heureB = l.heureB

  function regler(h) {
    // fait tourner la Terre pour qu'il soit l'heure h à Bruxelles
    etat.current.rot = (h - 12) * 15 - BXL.lon
    etat.current.joue = false
    setJoue(false)
    setGlisse(h)
    clearTimeout(minuteur.current)
    minuteur.current = setTimeout(() => setGlisse(null), 700)
  }

  return (
    <PageEspace code="S2" titre="Rotation" attendus={[99,102,103,105,109]} ecran large>
      <Eclat message={eclat.message} cle={eclat.cle} couleur="#FFA24D" />
      <Duo
        visuelDabord
        commandes={
          <>
            <div className="flex flex-wrap gap-1.5">
              {VILLES.map((v) => (
                <button key={v.nom} type="button" onClick={() => { etat.current.pin = { ...v }; setPin(v.nom) }} className="min-h-[40px] rounded-full border px-3 text-[13px] font-bold active:scale-95" style={pin === v.nom ? { background: ORANGE, color: '#12062A', borderColor: ORANGE } : { color: '#FFD9B0', borderColor: '#FFA24D66', background: 'rgba(11,10,30,.8)' }}>
                  {v.nom}
                </button>
              ))}
            </div>
            <Carte couleur={`${coul}66`} className="!p-3">
              <div className="flex items-center gap-3">
                <span className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl" style={{ background: coul, color: '#12062A' }}>
                  <Icone size={32} strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="labo-mono truncate text-[11px] text-[#B9C1E3]">{l.nom.toUpperCase()}</p>
                  <p className="labo-jeu text-[34px] leading-none text-white">{fmtH(l.heure)}</p>
                </div>
                <p className="labo-jeu text-right text-[22px] leading-tight" style={{ color: coul }}>
                  {mot}
                </p>
              </div>
            </Carte>
            <Curseur label="Heure à Bruxelles" valeur={glisse ?? Math.round(heureB * 4) / 4} min={0} max={24} step={0.25} onChange={regler} format={(v) => fmtH(mod(v, 24))} couleur={ORANGE} gauche="minuit" droite="minuit" />
            <div className="flex items-center gap-2">
              <BoutonLecture joue={joue} couleur={ORANGE} onClick={() => { etat.current.joue = !joue; setJoue(!joue) }} />
              <div className="flex-1">
                <Vitesses valeur={vitesse} onChange={(v) => { etat.current.vitesse = v; setVitesse(v) }} couleur={ORANGE} />
              </div>
            </div>
            <ul className="grid gap-1.5">
              {MISSIONS.map((m) => {
                const ok = faites.includes(m.id)
                return (
                  <li key={m.id} className="flex items-center gap-2.5 rounded-2xl border px-3 py-2 text-[13px]" style={{ borderColor: ok ? '#9DFF8A88' : 'rgba(232,236,255,.14)', background: ok ? 'rgba(157,255,138,.1)' : 'rgba(11,10,30,.8)', color: ok ? '#C8FFC0' : '#E8ECFF' }}>
                    <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full" style={{ background: ok ? '#9DFF8A' : 'rgba(255,255,255,.1)', color: '#06210A' }}>{ok && <Check size={15} strokeWidth={3} />}</span>
                    {m.texte}
                  </li>
                )
              })}
            </ul>
            <p className="labo-mono text-[10px] leading-snug text-[#8A93B8]">Un tour complet de la Terre sur elle-même = 24 h = 1 jour. La Terre tourne vers l’est : le Soleil « se lève » à l’est.</p>
          </>
        }
      >
        <Vue3D construire={construire} donnees={donnees.current} position={[0.6, 1.4, 8.2]} fov={38} orbite={{ min: 5.5, max: 13 }}>
          <span className="labo-mono pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1.5 text-[11px] text-[#FFD27A]">
            <Sun size={14} /> Soleil →
          </span>
        </Vue3D>
      </Duo>
    </PageEspace>
  )
}
