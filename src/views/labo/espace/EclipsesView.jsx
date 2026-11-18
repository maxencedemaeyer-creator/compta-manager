import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Moon, Sun } from 'lucide-react'
import { Carte, Duo } from '../../../components/labo/CadreJeu.jsx'
import { ambiance, creerAstre, creerTerre, deg, etoiles3D, halo } from '../../../components/labo/espace/outils3d.js'
import { LUNE, dateDuJour, nombre, ORANGE, OR, ROSE, CORAIL } from '../../../components/labo/espace/donnees.js'
import { BoutonLecture, Curseur, PageEspace, PasEchelle, Vitesses, Vue3D, useLecture } from './commun.jsx'

// =============================================================
//  S5 · Éclipses — la Lune tourne autour de la Terre sur une orbite inclinée de 5,1° par rapport à celle de la Terre.
//  À chaque Nouvelle Lune elle passe presque toujours trop haut ou trop bas pour cacher le Soleil ; idem à la Pleine Lune (ombre de la Terre).
//  Il y a éclipse seulement quand Soleil – Terre – Lune sont presque alignés, c'est‑à‑dire près d'un « nœud » (là où l'orbite de la Lune traverse le plan de l'orbite terrestre).
//
//  Modèle : repère « tournant » (Soleil toujours à gauche, −x). Année d'exemple : nœud ascendant à la longitude Ω = 20° ;
//    longitude du Soleil λs(T) = 360°·(T − 78)/365,25 (T = jour de l'année, 0 = 1er janv.)
//    élongation de la Lune e(T) = 360°·(T − 2)/29,53 (nouvelle Lune à T = 2 + 29,53·n)
//    latitude écliptique de la Lune β = 5,1°·sin(λs − Ω + e)
//  Limites (latitude de la Lune au moment de la syzygie) :
//    Soleil : centrale |β| < 1,04° · partielle |β| < 1,5°        Lune : totale 0,44° · partielle 0,96° · pénombre 1,45°
//    (rayons angulaires : Soleil 0,27°, Lune 0,26°, ombre de la Terre à la distance de la Lune 0,70°, pénombre 1,2°)
//  Dessin : inclinaison exagérée (hauteur = K·β) pour que ce soit lisible ; les cônes d'ombre sont dessinés avec la même échelle,
//  donc ce qu'on voit « toucher » correspond bien aux limites ci‑dessus.
//  Attendus 101, 104 (voir le référentiel P5-P6 §3.1).
// =============================================================
const I = LUNE.inclinaisonOrbite
const OMEGA = 20
const SYNODIQUE = LUNE.moisSynodiqueJ
const T_NOUVELLE = 2
const Rm = 5.2
const K = 0.385 // unités du dessin par degré de latitude
const R_TERRE = 0.4
const R_LUNE = 0.1

const lambdaS = (T) => (360 * (T - 78)) / 365.25
const elong = (T) => (((360 * (T - T_NOUVELLE)) / SYNODIQUE) % 360 + 360) % 360
const beta = (Delta, e) => I * Math.sin(deg(Delta + e))
const Delta = (T) => lambdaS(T) - OMEGA

function verdict(type, b) {
  const a = Math.abs(b)
  const cote = b > 0 ? 'au‑dessus' : 'en dessous'
  if (type === 'nouvelle') {
    if (a < 1.04) return { id: 'sc', court: 'Éclipse de Soleil', titre: 'Éclipse centrale de Soleil', texte: 'La Lune cache tout le Soleil, ou presque : totale (jour qui devient nuit) ou annulaire.', couleur: ORANGE, eclipse: true }
    if (a < 1.5) return { id: 'sp', court: 'Éclipse de Soleil', titre: 'Éclipse partielle de Soleil', texte: 'La Lune ne cache qu’une partie du Soleil : on voit un croissant de Soleil.', couleur: ORANGE, eclipse: true }
    return { id: 'non', court: 'Pas d’éclipse', titre: 'Pas d’éclipse', texte: `La Lune passe ${cote} du Soleil : l’alignement n’est pas assez bon.`, couleur: '#8A93B8', eclipse: false }
  }
  if (a < 0.44) return { id: 'lt', court: 'Éclipse de Lune', titre: 'Éclipse totale de Lune', texte: 'La Lune est entièrement dans l’ombre de la Terre : elle devient rouge‑orangé.', couleur: CORAIL, eclipse: true }
  if (a < 0.96) return { id: 'lp', court: 'Éclipse de Lune', titre: 'Éclipse partielle de Lune', texte: 'Une partie de la Lune entre dans l’ombre de la Terre : on voit une « morsure » sombre.', couleur: ROSE, eclipse: true }
  if (a < 1.45) return { id: 'ln', court: 'Éclipse de Lune', titre: 'Éclipse par la pénombre', texte: 'La Lune traverse la pénombre : elle ne s’assombrit que très légèrement.', couleur: '#C9A3FF', eclipse: true }
  return { id: 'non', court: 'Pas d’éclipse', titre: 'Pas d’éclipse', texte: `La Lune passe ${cote} de l’ombre de la Terre : elle reste pleinement éclairée.`, couleur: '#8A93B8', eclipse: false }
}

// toutes les Nouvelles et Pleines Lunes de l'année d'exemple
const EVENEMENTS = (() => {
  const l = []
  for (let k = 0; ; k++) {
    const T = T_NOUVELLE + k * (SYNODIQUE / 2)
    if (T > 365.25) break
    const type = k % 2 === 0 ? 'nouvelle' : 'pleine'
    const b = beta(Delta(T), type === 'nouvelle' ? 0 : 180)
    l.push({ k, T, type, beta: b, verdict: verdict(type, b) })
  }
  return l
})()
const plusProche = (T) => EVENEMENTS.reduce((m, e) => (Math.abs(e.T - T) < Math.abs(m.T - T) ? e : m), EVENEMENTS[0])

function construire(ctx) {
  const { THREE, scene } = ctx
  scene.add(etoiles3D(1000, 90))
  ambiance(scene, 0.08)
  const soleilPos = new THREE.Vector3(-30, 0, 0)
  const lum = new THREE.PointLight('#FFF3E0', 3.6, 0, 0)
  lum.position.copy(soleilPos)
  scene.add(lum)
  const lueur = halo('#FFB347', 5, 0.9)
  lueur.position.set(-7.4, 0, 0)
  const lueur2 = halo('#FF7A2E', 9, 0.3)
  lueur2.position.copy(lueur.position)
  scene.add(lueur, lueur2)

  const terre = creerTerre(R_TERRE, soleilPos)
  terre.rotation.x = deg(23.4)
  scene.add(terre)
  const lune = creerAstre('lune', R_LUNE, { sunPos: soleilPos, segments: 32 })
  scene.add(lune)

  // plan de l'orbite de la Terre (écliptique) : cercle de référence
  const ref = []
  for (let i = 0; i <= 120; i++) ref.push(new THREE.Vector3(-Rm * Math.cos((i / 120) * Math.PI * 2), 0, Rm * Math.sin((i / 120) * Math.PI * 2)))
  const refLigne = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ref), new THREE.LineDashedMaterial({ color: '#FFA24D', dashSize: 0.14, gapSize: 0.1, transparent: true, opacity: 0.55 }))
  refLigne.computeLineDistances()
  scene.add(refLigne)

  // orbite inclinée de la Lune (recalculée selon la date : les nœuds ne sont pas à la même place dans l'année)
  const N = 180
  const pts = new Float32Array((N + 1) * 3)
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pts, 3))
  const ringMat = new THREE.LineBasicMaterial({ color: '#C9A3FF', transparent: true, opacity: 0.85 })
  const ring = new THREE.Line(geo, ringMat)
  ring.frustumCulled = false
  scene.add(ring)
  const noeudMat = new THREE.MeshBasicMaterial({ color: '#FFE27A' })
  const n1 = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), noeudMat)
  const n2 = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), noeudMat)
  scene.add(n1, n2)
  const etiN1 = ctx.etiquette({ texte: 'nœud', couleur: '#FFE27A' })
  const etiN2 = ctx.etiquette({ texte: 'nœud', couleur: '#FFE27A' })

  // ombre de la Terre (cônes, même échelle que la Lune)
  const cone = (r0, r1, long, couleur, op) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, long, 32, 1, true), new THREE.MeshBasicMaterial({ color: couleur, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide }))
    m.rotation.z = -Math.PI / 2
    return m
  }
  const LT = 9
  const umbra = cone(R_TERRE, R_TERRE - (0.13 * LT) / Rm, LT, '#7B4DFF', 0.3)
  umbra.position.x = LT / 2
  const penombre = cone(R_TERRE, R_TERRE + (0.06 * LT) / Rm, LT, '#FFA24D', 0.1)
  penombre.position.x = LT / 2
  scene.add(umbra, penombre)
  // ombre de la Lune (utile à la Nouvelle Lune)
  const umbraL = cone(R_LUNE, 0.004, Rm * 1.0, '#FF8A6B', 0.5)
  const penombreL = cone(R_LUNE, R_LUNE + 0.08, Rm * 1.0, '#FFA24D', 0.14)
  const grpL = new THREE.Group()
  umbraL.position.x = (Rm * 1.0) / 2
  penombreL.position.x = (Rm * 1.0) / 2
  grpL.add(umbraL, penombreL)
  scene.add(grpL)

  const etiT = ctx.etiquette({ texte: 'Terre', couleur: '#7FE3A0' })
  const etiL = ctx.etiquette({ texte: 'Lune', couleur: '#FFE9B8' })
  const etiS = ctx.etiquette({ texte: 'Soleil', couleur: '#FFD27A' })
  const v = new THREE.Vector3()
  let derniereD = null

  function orbiteInclinee(D) {
    for (let i = 0; i <= N; i++) {
      const e = (i / N) * 360
      const b = beta(D, e)
      pts[i * 3] = -Rm * Math.cos(deg(e))
      pts[i * 3 + 1] = K * b
      pts[i * 3 + 2] = Rm * Math.sin(deg(e))
    }
    geo.attributes.position.needsUpdate = true
    n1.position.set(-Rm * Math.cos(deg(-D)), 0, Rm * Math.sin(deg(-D)))
    n2.position.set(-Rm * Math.cos(deg(180 - D)), 0, Rm * Math.sin(deg(180 - D)))
  }

  return {
    maj(dt, t) {
      const s = ctx.d().etat
      if (s.joue) s.T = (s.T + dt * s.vit[s.vitesse]) % 365.25
      const D = Delta(s.T)
      if (derniereD === null || Math.abs(D - derniereD) > 0.05) {
        orbiteInclinee(D)
        derniereD = D
      }
      const e = elong(s.T)
      const b = beta(D, e)
      lune.position.set(-Rm * Math.cos(deg(e)), K * b, Rm * Math.sin(deg(e)))
      lune.rotation.y = deg(e)
      grpL.position.copy(lune.position)
      terre.userData.surface.rotation.y = t * 0.3
      if (terre.userData.nuages) terre.userData.nuages.rotation.y = t * 0.32
      etiT.place(v.set(0, -0.75, 0), 0, 0)
      etiS.place(v.copy(lueur.position).add(new THREE.Vector3(0, -1.6, 0)), 0, 0)
      etiL.place(v.copy(lune.position).add(new THREE.Vector3(0, 0.38, 0)), 0, 0)
      etiN1.place(v.copy(n1.position).add(new THREE.Vector3(0, -0.28, 0)), 0, 0)
      etiN2.place(v.copy(n2.position).add(new THREE.Vector3(0, -0.28, 0)), 0, 0)
    },
  }
}

// Ce qu'on verrait depuis la Terre (dessin 2D, même échelle angulaire pour le Soleil, la Lune et l'ombre)
function CielEclipse({ type, rel, b, taille }) {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const g = c.getContext('2d')
    const W = c.width
    const s = W / 4.2 // pixels par degré
    const cx = W / 2
    const cy = W / 2
    g.clearRect(0, 0, W, W)
    const bg = g.createRadialGradient(cx, cy, 0, cx, cy, W * 0.75)
    bg.addColorStop(0, '#120A2E')
    bg.addColorStop(1, '#05031A')
    g.fillStyle = bg
    g.fillRect(0, 0, W, W)
    // repère de la latitude (écliptique)
    g.strokeStyle = 'rgba(255,162,77,.35)'
    g.setLineDash([5, 5])
    g.beginPath()
    g.moveTo(0, cy + 0.0)
    g.lineTo(W, cy)
    g.stroke()
    g.setLineDash([])
    const mx = cx + rel * s
    const my = cy - b * s
    if (type === 'nouvelle') {
      // Soleil
      const rs = 0.267 * s
      const gl = g.createRadialGradient(cx, cy, rs * 0.6, cx, cy, rs * 3.2)
      gl.addColorStop(0, 'rgba(255,200,100,.9)')
      gl.addColorStop(1, 'rgba(255,160,60,0)')
      g.fillStyle = gl
      g.beginPath()
      g.arc(cx, cy, rs * 3.2, 0, 7)
      g.fill()
      g.fillStyle = '#FFD27A'
      g.beginPath()
      g.arc(cx, cy, rs, 0, 7)
      g.fill()
      // Lune (disque sombre)
      g.fillStyle = '#0A0720'
      g.strokeStyle = 'rgba(255,255,255,.25)'
      g.beginPath()
      g.arc(mx, my, 0.26 * s, 0, 7)
      g.fill()
      g.stroke()
    } else {
      // ombre de la Terre : pénombre puis ombre, au centre ; la Lune passe devant
      const ro = 0.7 * s
      const rp = 1.2 * s
      g.fillStyle = 'rgba(255,255,255,.08)'
      g.beginPath()
      g.arc(cx, cy, rp, 0, 7)
      g.fill()
      g.fillStyle = 'rgba(40,10,70,.6)'
      g.beginPath()
      g.arc(cx, cy, ro, 0, 7)
      g.fill()
      g.strokeStyle = 'rgba(255,255,255,.18)'
      g.beginPath()
      g.arc(cx, cy, ro, 0, 7)
      g.stroke()
      const rl = 0.26 * s
      g.save()
      g.beginPath()
      g.arc(mx, my, rl, 0, 7)
      g.clip()
      g.fillStyle = '#EFE6D2'
      g.fillRect(mx - rl, my - rl, rl * 2, rl * 2)
      g.fillStyle = 'rgba(0,0,0,.28)'
      g.beginPath()
      g.arc(cx, cy, rp, 0, 7)
      g.fill()
      g.fillStyle = 'rgba(150,35,15,.88)'
      g.beginPath()
      g.arc(cx, cy, ro, 0, 7)
      g.fill()
      g.restore()
      g.strokeStyle = 'rgba(255,255,255,.35)'
      g.beginPath()
      g.arc(mx, my, rl, 0, 7)
      g.stroke()
    }
  }, [type, rel, b])
  return <canvas ref={ref} width={260} height={260} className="rounded-2xl border border-white/15" style={{ width: taille, height: taille }} />
}

export default function EclipsesView() {
  const etat = useRef({ T: 90.6, joue: false, vitesse: 'normal', vit: { lent: 10, normal: 22, rapide: 55 } })
  const [joue, setJoue] = useState(false)
  const [vitesse, setVitesse] = useState('normal')
  const [glisse, setGlisse] = useState(null)
  const donnees = useRef({})
  donnees.current = { etat: etat.current }
  const l = useLecture(etat, (s) => ({ T: s.T }))
  const T = glisse ?? l.T
  const ev = plusProche(T)
  const e = elong(T)
  const relE = ((e - (ev.type === 'nouvelle' ? 0 : 180) + 540) % 360) - 180
  const bNow = beta(Delta(T), e)

  function aller(Tn) {
    etat.current.T = ((Tn % 365.25) + 365.25) % 365.25
    etat.current.joue = false
    setJoue(false)
  }
  function saut(sens) {
    const t0 = etat.current.T
    const liste = EVENEMENTS
    let cible
    if (sens > 0) cible = liste.find((x) => x.T > t0 + 0.4) || liste[0]
    else cible = [...liste].reverse().find((x) => x.T < t0 - 0.4) || liste[liste.length - 1]
    aller(cible.T)
  }
  const exact = Math.abs(ev.T - T) < 0.3

  return (
    <PageEspace code="S5" titre="Éclipses" attendus={[101,104]} ecran large>
      <Duo
        visuelDabord
        commandes={
          <>
            <Carte couleur={`${ev.verdict.couleur}88`} className="!p-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl" style={{ background: ev.verdict.couleur, color: '#12062A' }}>
                  {ev.type === 'nouvelle' ? <Sun size={26} /> : <Moon size={26} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="labo-mono text-[10px] text-[#B9C1E3]">{ev.type === 'nouvelle' ? 'NOUVELLE LUNE' : 'PLEINE LUNE'} · {dateDuJour(Math.round(ev.T))}</p>
                  <p className="labo-jeu text-[22px] leading-tight" style={{ color: ev.verdict.couleur }}>{ev.verdict.titre}</p>
                </div>
              </div>
              <p className="mt-2 text-[13px] leading-snug text-[#E8ECFF]">{ev.verdict.texte}</p>
              <div className="mt-2.5 flex items-center gap-3">
                <CielEclipse type={ev.type} rel={exact ? 0 : relE} b={exact ? ev.beta : bNow} taille={104} />
                <p className="text-[11px] leading-snug text-[#B9C1E3]">
                  {ev.type === 'nouvelle' ? 'Vu depuis la Terre : le Soleil, et la Lune qui passe devant.' : 'Vu depuis la Terre : l’ombre de la Terre, et la Lune qui la traverse.'}
                  <br />
                  <span className="text-white">Écart à l’alignement : {nombre(Math.abs(ev.beta), 1)}°</span>
                </p>
              </div>
            </Carte>
            <div className="flex gap-2">
              <button type="button" onClick={() => saut(-1)} className="flex min-h-[48px] flex-1 items-center justify-center gap-1 rounded-2xl border border-white/20 bg-[#0B0A1E]/85 text-[13px] font-bold text-white active:scale-95">
                <ChevronLeft size={18} /> Avant
              </button>
              <button type="button" onClick={() => saut(1)} className="flex min-h-[48px] flex-[1.3] items-center justify-center gap-1 rounded-2xl text-[14px] font-bold active:scale-95" style={{ background: ORANGE, color: '#12062A' }}>
                Nouvelle / Pleine Lune <ChevronRight size={18} />
              </button>
            </div>
            <Carte couleur="rgba(166,107,255,.35)" className="!p-3">
              <p className="labo-mono mb-1.5 text-[10px] text-[#B9C1E3]">TOUTES LES NOUVELLES ET PLEINES LUNES DE L’ANNÉE</p>
              <div className="relative h-14">
                <div className="absolute left-0 right-0 top-[26px] h-[2px] bg-white/15" />
                {EVENEMENTS.map((x) => {
                  const actif = x.k === ev.k
                  return (
                    <button key={x.k} type="button" onClick={() => aller(x.T)} aria-label={`${x.type} ${dateDuJour(Math.round(x.T))}`} className="absolute top-[14px] h-6 w-6 -translate-x-1/2 rounded-full" style={{ left: `${(x.T / 365.25) * 100}%` }}>
                      <span className="block h-full w-full rounded-full border-2" style={{ background: x.verdict.eclipse ? x.verdict.couleur : x.type === 'nouvelle' ? '#1B1440' : '#4A4570', borderColor: actif ? '#FFFFFF' : x.verdict.eclipse ? x.verdict.couleur : 'rgba(232,236,255,.35)', boxShadow: actif ? '0 0 10px #fff' : 'none', transform: `scale(${x.verdict.eclipse ? 1 : 0.62})` }} />
                    </button>
                  )
                })}
                <span className="absolute top-[6px] h-10 w-[2px] -translate-x-1/2 bg-white/70" style={{ left: `${(T / 365.25) * 100}%` }} />
                <div className="absolute inset-x-0 bottom-0 flex justify-between text-[9px] text-[#8A93B8]">
                  <span>janv.</span><span>avr.</span><span>juil.</span><span>oct.</span><span>déc.</span>
                </div>
              </div>
              <p className="mt-1 text-[11px] leading-snug text-[#B9C1E3]">Presque toutes passent à côté : <b className="text-white">seulement {EVENEMENTS.filter((x) => x.verdict.eclipse).length} éclipses</b> sur {EVENEMENTS.length} !</p>
            </Carte>
            <Curseur label="Date" valeur={Math.round(T)} min={0} max={365} onChange={(v) => { aller(v); setGlisse(v); clearTimeout(donnees.current.t); donnees.current.t = setTimeout(() => setGlisse(null), 400) }} format={(v) => dateDuJour(v)} couleur={ORANGE} />
            <div className="flex items-center gap-2">
              <BoutonLecture joue={joue} couleur={ORANGE} onClick={() => { etat.current.joue = !joue; setJoue(!joue) }} />
              <div className="flex-1">
                <Vitesses valeur={vitesse} onChange={(v) => { etat.current.vitesse = v; setVitesse(v) }} couleur={ORANGE} />
              </div>
            </div>
            <p className="labo-mono text-[10px] leading-snug text-[#8A93B8]">Année d’exemple. L’orbite de la Lune (violet) est inclinée de 5° sur celle de la Terre (orange, pointillés) : ici l’inclinaison est exagérée. Les points jaunes sont les « nœuds », là où la Lune traverse le plan.</p>
          </>
        }
      >
        <Vue3D construire={construire} donnees={donnees.current} position={[0.3, 3.0, 11.4]} fov={38} orbite={{ min: 8, max: 20 }}>
          <PasEchelle texte="Pas à l’échelle · inclinaison exagérée" />
          <span className="labo-mono pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px]" style={{ color: OR }}>
            {dateDuJour(Math.round(T))}
          </span>
        </Vue3D>
      </Duo>
    </PageEspace>
  )
}
