import { useEffect, useRef, useState } from 'react'
import { Gamepad2, Compass } from 'lucide-react'
import { Carte, Duo, Eclat, melanger } from '../../../components/labo/CadreJeu.jsx'
import { creerAstre, creerTerre, etoiles3D, ambiance, halo, orbite, deg } from '../../../components/labo/espace/outils3d.js'
import { LUNE, PHASES, nombre, phaseDe, OR, ORANGE } from '../../../components/labo/espace/donnees.js'
import { BoutonLecture, Curseur, Onglets, PageEspace, PasEchelle, Vitesses, Vue3D, useLecture } from './commun.jsx'

// =============================================================
//  S4 · Phases de la Lune — la Lune est toujours à moitié éclairée par le Soleil ;
//  selon sa place sur son orbite, on en voit une partie plus ou moins grande depuis la Terre.
//  e = élongation (angle Soleil–Terre–Lune), 0° = nouvelle Lune, 180° = pleine Lune. Cycle : 29,53 jours.
//  Position de la Lune : (−cos e, 0, sin e)·Rm, Soleil à gauche (−x), vu du pôle Nord (la Lune tourne dans le sens inverse des aiguilles d'une montre).
//  Attendus 101, 104 (voir le référentiel P5-P6 §3.1).
// =============================================================
const TEXTES = {
  nouvelle: 'La Lune est entre la Terre et le Soleil : sa face éclairée est de l’autre côté. On ne la voit pas.',
  'premier-croissant': 'On commence à voir un fin croissant éclairé, le soir, à l’ouest.',
  'premier-quartier': 'La moitié droite est éclairée : un quart du tour est fait. On la voit en soirée.',
  'gibbeuse-croissante': 'Plus de la moitié est éclairée, et ça grandit chaque soir.',
  pleine: 'La Terre est entre le Soleil et la Lune : on voit toute la face éclairée, toute la nuit.',
  'gibbeuse-decroissante': 'Plus de la moitié est éclairée, mais ça diminue chaque nuit.',
  'dernier-quartier': 'La moitié gauche est éclairée. On la voit en fin de nuit et le matin.',
  'dernier-croissant': 'Un fin croissant, juste avant l’aube. Bientôt la nouvelle Lune.',
}
const VITESSE = { lent: 20, normal: 9, rapide: 4 } // secondes pour un cycle
const Rm = 3.5

// Petite icône de phase (SVG), vue de l'hémisphère Nord : croissant qui grossit = éclairé à droite
export function IconePhase({ e, taille = 44, couleur = '#FFE9B8' }) {
  const r = taille / 2 - 1.5
  const c = taille / 2
  const a = ((e % 360) + 360) % 360
  const cosE = Math.cos(deg(a))
  const rx = Math.abs(cosE) * r
  const croissante = a <= 180
  const s1 = croissante ? 1 : 0
  const s2 = croissante ? (cosE > 0 ? 0 : 1) : cosE > 0 ? 1 : 0
  const d = `M ${c} ${c - r} A ${r} ${r} 0 0 ${s1} ${c} ${c + r} A ${rx} ${r} 0 0 ${s2} ${c} ${c - r} Z`
  return (
    <svg width={taille} height={taille} viewBox={`0 0 ${taille} ${taille}`} aria-hidden="true">
      <circle cx={c} cy={c} r={r} fill="#241B4A" stroke="rgba(255,255,255,.25)" strokeWidth="1" />
      {a > 1 && a < 359 && <path d={d} fill={couleur} />}
      {a >= 179.5 && a <= 180.5 && <circle cx={c} cy={c} r={r} fill={couleur} />}
    </svg>
  )
}

function construire(ctx) {
  const { THREE, scene, renderer } = ctx
  scene.add(etoiles3D(1000, 90))
  ambiance(scene, 0.07)
  const soleilPos = new THREE.Vector3(-30, 0, 0)
  const lum = new THREE.PointLight('#FFF3E0', 3.6, 0, 0)
  lum.position.copy(soleilPos)
  scene.add(lum)
  const lueur = halo('#FFB347', 3.6, 0.95)
  lueur.position.set(-6.4, 0, 0)
  const lueur2 = halo('#FF7A2E', 7, 0.3)
  lueur2.position.copy(lueur.position)
  scene.add(lueur, lueur2)
  // rayons de lumière (parallèles)
  const rayons = new THREE.Group()
  ;[-2.2, -1.1, 0, 1.1, 2.2].forEach((z) => {
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-5.5, 0, z), new THREE.Vector3(-4.3, 0, z)]), new THREE.LineBasicMaterial({ color: '#FFD27A', transparent: true, opacity: 0.55 }))
    rayons.add(l)
  })
  scene.add(rayons)

  const terre = creerTerre(1, soleilPos, { nuages: true })
  terre.rotation.x = deg(23.4)
  scene.add(terre)
  const ring = orbite(Rm, '#C9A3FF', 0.5)
  scene.add(ring)
  const lune = creerAstre('lune', 0.36, { sunPos: soleilPos })
  scene.add(lune)
  // point orange : la face de la Lune tournée vers la Terre (toujours la même)
  const repere = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshBasicMaterial({ color: '#FFA24D' }))
  repere.position.set(0.37, 0, 0)
  lune.add(repere)

  const etiT = ctx.etiquette({ texte: 'Terre', couleur: '#7FE3A0' })
  const etiL = ctx.etiquette({ texte: 'Lune', couleur: '#FFE9B8' })
  const etiS = ctx.etiquette({ texte: 'Soleil', couleur: '#FFD27A' })
  const v = new THREE.Vector3()

  const cam2 = new THREE.PerspectiveCamera(13, 1, 0.5, 100)

  return {
    maj(dt, t) {
      const e = ctx.d().etat
      if (e.joue) e.e = (e.e + (dt * 360) / VITESSE[e.vitesse]) % 360
      const a = deg(e.e)
      lune.position.set(-Math.cos(a) * Rm, 0, Math.sin(a) * Rm)
      lune.rotation.y = a
      terre.userData.surface.rotation.y = t * 0.25
      if (terre.userData.nuages) terre.userData.nuages.rotation.y = t * 0.27
      etiT.place(v.set(0, -1.5, 0), 0, 0)
      etiS.place(lueur.position.clone().add(new THREE.Vector3(0, -1.3, 0)), 0, 0)
      etiL.place(v.copy(lune.position).add(new THREE.Vector3(0, 0.72, 0)), 0, 0)
    },
    apresRendu() {
      const d = ctx.d()
      const place = d.encart.current
      if (!place || !d.etat.encartVisible) return
      const cr = renderer.domElement.getBoundingClientRect()
      const ir = place.getBoundingClientRect()
      const w = ir.width
      const h = ir.height
      if (w < 30 || h < 30) return
      const x = ir.left - cr.left
      const y = cr.bottom - ir.bottom
      // caméra posée sur la Terre, qui regarde la Lune (hémisphère Nord : le haut = le Nord)
      cam2.position.set(0, 0, 0)
      cam2.up.set(0, 1, 0)
      cam2.lookAt(lune.position)
      cam2.aspect = w / h
      cam2.updateProjectionMatrix()
      terre.visible = false
      ring.visible = false
      rayons.visible = false
      lueur.visible = false
      lueur2.visible = false
      repere.visible = false
      renderer.setScissorTest(true)
      renderer.setViewport(x, y, w, h)
      renderer.setScissor(x, y, w, h)
      renderer.setClearColor(0x05031a, 0.97)
      renderer.clear()
      renderer.render(scene, cam2)
      renderer.setScissorTest(false)
      renderer.setViewport(0, 0, cr.width, cr.height)
      renderer.setClearColor(0x000000, 0)
      terre.visible = true
      ring.visible = true
      rayons.visible = true
      lueur.visible = true
      lueur2.visible = true
      repere.visible = true
    },
  }
}

function nouvelleQuestion() {
  const p = PHASES[Math.floor(Math.random() * PHASES.length)]
  const e = (p.a + (Math.random() - 0.5) * 16 + 360) % 360
  const autres = melanger(PHASES.filter((x) => x.id !== p.id)).slice(0, 3)
  return { e, bonne: p.id, choix: melanger([p, ...autres]).map((x) => x.id) }
}

export default function PhasesView() {
  const etat = useRef({ e: 90, joue: false, vitesse: 'normal', encartVisible: true })
  const encart = useRef(null)
  const [mode, setMode] = useState('explorer')
  const [joue, setJoue] = useState(false)
  const [vitesse, setVitesse] = useState('normal')
  const [q, setQ] = useState(null)
  const [num, setNum] = useState(0)
  const [score, setScore] = useState(0)
  const [reponse, setReponse] = useState(null)
  const [eclat, setEclat] = useState({ message: '', cle: 0 })
  const [glisse, setGlisse] = useState(null)
  const donnees = useRef({})
  donnees.current = { etat: etat.current, encart }
  const l = useLecture(etat, (s) => ({ e: s.e }))
  const e = glisse ?? l.e
  const phase = phaseDe(e)
  const jeu = mode === 'jeu'
  const termine = jeu && num >= 8

  useEffect(() => {
    // en jeu, l'encart (vue depuis la Terre) n'apparaît qu'après la réponse
    etat.current.encartVisible = !jeu || reponse != null || termine
  }, [jeu, reponse, termine])

  function commencer() {
    setMode('jeu')
    setNum(0)
    setScore(0)
    setReponse(null)
    etat.current.joue = false
    setJoue(false)
    const n = nouvelleQuestion()
    setQ(n)
    etat.current.e = n.e
  }
  function repondre(id) {
    if (reponse != null || !q) return
    setReponse(id)
    if (id === q.bonne) {
      setScore((s) => s + 1)
      setEclat((c) => ({ message: 'Bravo !', cle: c.cle + 1 }))
    }
    const suivant = num + 1
    setTimeout(() => {
      if (suivant < 8) {
        const nq = nouvelleQuestion()
        setQ(nq)
        etat.current.e = nq.e
      }
      setNum(suivant)
      setReponse(null)
    }, 1700)
  }

  const nomPhase = (id) => PHASES.find((p) => p.id === id).nom
  const jourCycle = (e / 360) * LUNE.moisSynodiqueJ

  return (
    <PageEspace code="S4" titre="Phases" attendus={[101,104]} ecran large>
      <Eclat message={eclat.message} cle={eclat.cle} couleur="#FFE27A" />
      <Duo
        visuelDabord
        commandes={
          <>
            <Onglets valeur={mode} onChange={(m) => (m === 'jeu' ? commencer() : (setMode('explorer'), setQ(null)))} couleur={ORANGE} options={[['explorer', Compass, 'Explorer'], ['jeu', Gamepad2, 'Jeu']]} />
            {!jeu && (
              <>
                <Carte couleur="rgba(255,233,184,.4)" className="!p-3">
                  <div className="flex items-center gap-3">
                    <IconePhase e={e} taille={58} />
                    <div className="min-w-0 flex-1">
                      <p className="labo-jeu text-[24px] leading-tight text-[#FFE9B8]">{phase.nom}</p>
                      <p className="labo-mono text-[11px] text-[#B9C1E3]">jour {nombre(jourCycle, 1)} sur {nombre(LUNE.moisSynodiqueJ, 2)}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-[13px] leading-snug text-[#E8ECFF]">{TEXTES[phase.id]}</p>
                </Carte>
                <Curseur label="Place de la Lune sur son orbite" valeur={Math.round(e)} min={0} max={359} onChange={(v) => { etat.current.e = v; etat.current.joue = false; setJoue(false); setGlisse(v); clearTimeout(donnees.current.t); donnees.current.t = setTimeout(() => setGlisse(null), 300) }} format={(v) => `${v}°`} couleur={ORANGE} gauche="nouvelle" droite="nouvelle" />
                <div className="grid grid-cols-4 gap-1.5">
                  {PHASES.map((p) => (
                    <button key={p.id} type="button" onClick={() => { etat.current.e = p.a; etat.current.joue = false; setJoue(false) }} aria-label={p.nom} className="flex min-h-[54px] items-center justify-center rounded-2xl border active:scale-95" style={phase.id === p.id ? { borderColor: ORANGE, background: 'rgba(255,162,77,.18)' } : { borderColor: 'rgba(232,236,255,.16)', background: 'rgba(11,10,30,.85)' }}>
                      <IconePhase e={p.a} taille={38} />
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <BoutonLecture joue={joue} couleur={ORANGE} onClick={() => { etat.current.joue = !joue; setJoue(!joue) }} />
                  <div className="flex-1">
                    <Vitesses valeur={vitesse} onChange={(v) => { etat.current.vitesse = v; setVitesse(v) }} couleur={ORANGE} />
                  </div>
                </div>
                <p className="labo-mono text-[10px] leading-snug text-[#8A93B8]">Le Soleil éclaire toujours la moitié de la Lune. Le point orange montre qu’on voit toujours la même face. Il faut 29,5 jours pour revenir à la même phase.</p>
              </>
            )}
            {jeu && !termine && q && (
              <>
                <Carte couleur="rgba(255,162,77,.4)" className="!p-3">
                  <div className="flex items-center justify-between">
                    <p className="labo-mono text-[11px] text-[#B9C1E3]">QUESTION {num + 1} / 8</p>
                    <p className="labo-jeu text-[18px]" style={{ color: OR }}>{score} ★</p>
                  </div>
                  <p className="labo-jeu mt-1 text-[22px] leading-tight text-white">Quelle phase voit-on depuis la Terre ?</p>
                </Carte>
                <div className="grid grid-cols-2 gap-2">
                  {q.choix.map((id) => {
                    const bon = reponse != null && id === q.bonne
                    const mauvais = reponse === id && id !== q.bonne
                    return (
                      <button key={id} type="button" onClick={() => repondre(id)} className={`flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-2xl border-2 px-2 py-2 text-center active:scale-95 ${mauvais ? 'espace-secoue' : ''}`} style={{ borderColor: bon ? '#9DFF8A' : mauvais ? '#FF6B7A' : 'rgba(255,162,77,.4)', background: bon ? 'rgba(157,255,138,.15)' : 'rgba(11,10,30,.88)' }}>
                        <IconePhase e={PHASES.find((p) => p.id === id).a} taille={30} />
                        <span className="labo-jeu text-[14px] leading-tight text-white">{nomPhase(id)}</span>
                      </button>
                    )
                  })}
                </div>
                {reponse != null && <Consigne2 texte={TEXTES[q.bonne]} />}
              </>
            )}
            {termine && (
              <Carte couleur="rgba(255,226,122,.5)" className="!p-4 text-center">
                <p className="labo-jeu text-[34px] leading-none" style={{ color: OR }}>{score} / 8</p>
                <p className="mt-1 text-[14px] text-[#E8ECFF]">{score >= 7 ? 'Tu connais bien la Lune !' : score >= 4 ? 'Pas mal ! Explore encore l’orbite.' : 'Reviens à « Explorer » pour t’entraîner.'}</p>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={commencer} className="min-h-[48px] flex-1 rounded-2xl text-[15px] font-bold active:scale-95" style={{ background: ORANGE, color: '#12062A' }}>Rejouer</button>
                  <button type="button" onClick={() => { setMode('explorer'); setQ(null) }} className="min-h-[48px] flex-1 rounded-2xl border border-white/20 text-[15px] font-bold text-white active:scale-95">Explorer</button>
                </div>
              </Carte>
            )}
          </>
        }
      >
        <Vue3D construire={construire} donnees={donnees.current} position={[0, 7.2, 7.4]} fov={42} orbite={{ min: 6, max: 16 }}>
          <PasEchelle texte="Pas à l’échelle · vue du dessus" />
          {(!jeu || reponse != null || termine) && (
            <div ref={encart} className="pointer-events-none absolute bottom-3 right-3 aspect-square w-[32%] max-w-[220px] min-w-[110px] rounded-2xl border-2" style={{ borderColor: 'rgba(255,233,184,.7)' }}>
              <span className="labo-jeu absolute left-2 top-1.5 text-[12px] text-[#FFE9B8]">Vue depuis la Terre</span>
            </div>
          )}
        </Vue3D>
      </Duo>
    </PageEspace>
  )
}

function Consigne2({ texte }) {
  return <p className="rounded-2xl border border-white/15 bg-[#0B0A1E]/85 px-3 py-2 text-[13px] leading-snug text-[#E8ECFF]">{texte}</p>
}
