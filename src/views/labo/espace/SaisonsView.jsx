import { useRef, useState } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { Carte, Duo } from '../../../components/labo/CadreJeu.jsx'
import { construireOrrery, declinaison, distanceSoleil, ensoleillement, fmtDuree, FETES, saisonNord } from '../../../components/labo/espace/orrery.js'
import { dateDuJour, nombre, ORANGE, MENTHE, OR, CORAIL, LILAS } from '../../../components/labo/espace/donnees.js'
import { Curseur, PageEspace, Vitesses, Vue3D, useLecture } from './commun.jsx'

// =============================================================
//  S6 · Saisons — la Terre autour du Soleil, avec son axe incliné (23,4°) qui pointe toujours vers le même endroit.
//  Interactif : on déplace la Terre sur son orbite (curseur, dates clés, clic sur l'orbite),
//  on change l'inclinaison de l'axe, on regarde la Terre « de côté », on choisit une latitude.
//  Calculs : déclinaison du Soleil δ = asin(−sin(i)·cos a) ; durée du jour : cos H = −tan(lat)·tan(δ) ; hauteur à midi = 90° − |lat − δ|.
//  Attendus 99, 102, 107 (voir le référentiel P5-P6 §3.1).
// =============================================================
const SAISONS = [
  { nom: 'Printemps', couleur: MENTHE },
  { nom: 'Été', couleur: OR },
  { nom: 'Automne', couleur: CORAIL },
  { nom: 'Hiver', couleur: LILAS },
]
const LIEUX = [
  { nom: 'Pôle Nord', lat: 90 },
  { nom: 'Bruxelles', lat: 50.85 },
  { nom: 'Équateur', lat: 0 },
  { nom: 'Sydney', lat: -33.9 },
]
const JOURS_SEC = { lent: 26, normal: 13, rapide: 5 } // secondes pour une année
const INCL_REELLE = 23.4

function construire(ctx) {
  const { THREE, scene, camera, renderer } = ctx
  const o = construireOrrery(ctx, { R: 5, rTerre: 0.72, rSoleil: 0.8, mois: true, fetes: true, trace: true })
  // aide visuelle : direction fixe de l'axe (repère au centre, ne bouge pas)
  const plan = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  const rayon = new THREE.Raycaster()
  const pt = new THREE.Vector3()
  ctx.surClic((ndc) => {
    rayon.setFromCamera(ndc, camera)
    if (!rayon.ray.intersectPlane(plan, pt)) return
    const a = Math.atan2(-pt.z, pt.x)
    // a = 2π (j − 171)/365,25 + π  →  j
    let j = ((a - Math.PI) / (2 * Math.PI)) * 365.25 + 171
    j = ((j % 365.25) + 365.25) % 365.25
    ctx.d().aller(Math.round(j))
  })

  // vue de côté de la Terre (encart)
  const cam2 = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
  const up = new THREE.Vector3(0, 1, 0)
  const s = new THREE.Vector3()
  const cote = new THREE.Vector3()
  const f = new THREE.Vector3()
  const r = new THREE.Vector3()

  return {
    maj(dt, t) {
      const e = ctx.d().etat
      if (e.joue) e.jour = (e.jour + (dt * 365.25) / JOURS_SEC[e.vitesse]) % 365.25
      o.maj({ jour: e.jour, spin: t * 0.7, tilt: e.incl, t })
    },
    apresRendu() {
      const d = ctx.d()
      const place = d.encart.current
      if (!place) return
      const cr = renderer.domElement.getBoundingClientRect()
      const ir = place.getBoundingClientRect()
      const w = ir.width
      const h = ir.height
      if (w < 30 || h < 30) return
      const x = ir.left - cr.left
      const y = cr.bottom - ir.bottom
      // caméra de côté : on regarde la Terre perpendiculairement à la direction du Soleil, le Soleil à gauche
      const P = o.pos.position
      s.set(-P.x, 0, -P.z).normalize()
      cote.crossVectors(up, s)
      f.copy(cote).negate()
      r.crossVectors(f, up)
      if (r.dot(s) > 0) cote.negate()
      cam2.position.copy(P).addScaledVector(cote, 5.6)
      cam2.up.copy(up)
      cam2.lookAt(P)
      cam2.aspect = w / h
      cam2.updateProjectionMatrix()
      o.anneau.visible = false
      if (o.ligne) o.ligne.visible = false
      renderer.setScissorTest(true)
      renderer.setViewport(x, y, w, h)
      renderer.setScissor(x, y, w, h)
      renderer.setClearColor(0x08051c, 0.94)
      renderer.clear()
      renderer.render(scene, cam2)
      renderer.setScissorTest(false)
      renderer.setViewport(0, 0, cr.width, cr.height)
      renderer.setClearColor(0x000000, 0)
      o.anneau.visible = true
      if (o.ligne) o.ligne.visible = true
    },
  }
}

export default function SaisonsView() {
  const etat = useRef({ jour: 171, joue: false, vitesse: 'normal', incl: INCL_REELLE })
  const encart = useRef(null)
  const [joue, setJoue] = useState(false)
  const [vitesse, setVitesse] = useState('normal')
  const [incl, setIncl] = useState(INCL_REELLE)
  const [lieu, setLieu] = useState(1)
  const [glisse, setGlisse] = useState(null)
  const donnees = useRef({})
  donnees.current = { etat: etat.current, encart, aller: (j) => { etat.current.jour = j; etat.current.joue = false; setJoue(false) } }
  const l = useLecture(etat, (e) => ({ jour: e.jour, incl: e.incl }))

  const jour = glisse ?? l.jour
  const dec = declinaison(jour, l.incl)
  const sN = saisonNord(jour)
  const sS = (sN + 2) % 4
  const place = LIEUX[lieu]
  const { heures, midi } = ensoleillement(place.lat, dec)
  const dist = distanceSoleil(jour)
  const sansSaison = l.incl < 3

  function allerA(j) {
    etat.current.jour = j
    etat.current.joue = false
    setJoue(false)
  }

  return (
    <PageEspace code="S6" titre="Saisons" attendus={[99,102,107]} ecran large>
      <Duo
        visuelDabord
        commandes={
          <>
            <Carte couleur="rgba(166,107,255,.45)" className="!p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="labo-jeu text-[30px] leading-none text-white">{dateDuJour(Math.round(jour))}</p>
                <p className="labo-mono text-[10px] text-[#B9C1E3]">Soleil au-dessus de {Math.abs(dec) < 0.5 ? 'l’équateur' : `${nombre(Math.abs(dec), 1)}° ${dec > 0 ? 'Nord' : 'Sud'}`}</p>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {[['Hémisphère Nord', sN], ['Hémisphère Sud', sS]].map(([nom, k]) => (
                  <div key={nom} className="rounded-2xl px-3 py-2 text-center" style={{ background: sansSaison ? 'rgba(255,255,255,.07)' : `${SAISONS[k].couleur}22`, border: `1.5px solid ${sansSaison ? 'rgba(255,255,255,.18)' : SAISONS[k].couleur}` }}>
                    <p className="labo-mono text-[10px] text-[#B9C1E3]">{nom}</p>
                    <p className="labo-jeu text-[22px] leading-tight" style={{ color: sansSaison ? '#E8ECFF' : SAISONS[k].couleur }}>{sansSaison ? 'Pas de saison' : SAISONS[k].nom}</p>
                  </div>
                ))}
              </div>
            </Carte>
            <div className="grid grid-cols-4 gap-1.5">
              {FETES.map((fe) => (
                <button key={fe.j} type="button" onClick={() => allerA(fe.j)} className="min-h-[50px] rounded-2xl border px-1 py-1 text-center active:scale-95" style={Math.abs(jour - fe.j) < 2 ? { background: ORANGE, color: '#12062A', borderColor: ORANGE } : { color: '#FFD9B0', borderColor: '#FFA24D66', background: 'rgba(11,10,30,.85)' }}>
                  <span className="labo-jeu block text-[13px] leading-tight">{fe.nom}</span>
                  <span className="block text-[10px] leading-tight opacity-80">{fe.date}</span>
                </button>
              ))}
            </div>
            <Curseur label="Jour de l’année" valeur={Math.round(jour)} min={0} max={364} onChange={(v) => { allerA(v); setGlisse(v); clearTimeout(donnees.current.t); donnees.current.t = setTimeout(() => setGlisse(null), 400) }} format={(v) => dateDuJour(v)} couleur={ORANGE} gauche="1er janv." droite="31 déc." />
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => { etat.current.joue = !joue; setJoue(!joue) }} aria-label={joue ? 'Pause' : 'Lecture'} className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl active:scale-95" style={{ background: ORANGE, color: '#12062A' }}>
                {joue ? <Pause size={22} /> : <Play size={22} />}
              </button>
              <div className="flex-1">
                <Vitesses valeur={vitesse} onChange={(v) => { etat.current.vitesse = v; setVitesse(v) }} couleur={ORANGE} />
              </div>
            </div>
            <Curseur label="Inclinaison de l’axe" valeur={incl} min={0} max={60} step={0.5} onChange={(v) => { etat.current.incl = v; setIncl(v) }} format={(v) => `${nombre(v, 1)}°`} couleur="#C9A3FF" gauche="droit : 0°" droite="réelle : 23,4°" />
            {incl !== INCL_REELLE && (
              <button type="button" onClick={() => { etat.current.incl = INCL_REELLE; setIncl(INCL_REELLE) }} className="flex min-h-[42px] items-center justify-center gap-2 rounded-2xl border border-white/20 bg-[#0B0A1E]/85 text-[13px] font-bold text-[#E8ECFF] active:scale-95">
                <RotateCcw size={16} /> Remettre l’inclinaison réelle
              </button>
            )}
            <Carte couleur="rgba(255,162,77,.35)" className="!p-3">
              <div className="flex flex-wrap gap-1.5">
                {LIEUX.map((x, i) => (
                  <button key={x.nom} type="button" onClick={() => setLieu(i)} className="min-h-[38px] rounded-full border px-3 text-[13px] font-bold active:scale-95" style={lieu === i ? { background: ORANGE, color: '#12062A', borderColor: ORANGE } : { color: '#FFD9B0', borderColor: '#FFA24D66' }}>
                    {x.nom}
                  </button>
                ))}
              </div>
              <div className="mt-2.5 flex items-end justify-between gap-2">
                <div>
                  <p className="labo-mono text-[10px] text-[#B9C1E3]">JOUR (SOLEIL LEVÉ)</p>
                  <p className="labo-jeu text-[26px] leading-none" style={{ color: OR }}>{fmtDuree(heures)}</p>
                </div>
                <div className="text-right">
                  <p className="labo-mono text-[10px] text-[#B9C1E3]">SOLEIL À MIDI</p>
                  <p className="labo-jeu text-[26px] leading-none" style={{ color: OR }}>{heures <= 0 ? '—' : `${nombre(Math.max(0, midi), 0)}°`}</p>
                </div>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#1B1440]">
                <div className="h-full rounded-full" style={{ width: `${(heures / 24) * 100}%`, background: 'linear-gradient(90deg,#FFB347,#FFE27A)' }} />
              </div>
              <p className="mt-1.5 text-[11px] leading-snug text-[#B9C1E3]">
                {heures >= 23.99 ? 'Le Soleil ne se couche pas : jour polaire.' : heures <= 0.01 ? 'Le Soleil ne se lève pas : nuit polaire.' : 'Plus le Soleil est haut à midi, plus ses rayons chauffent.'}
              </p>
            </Carte>
            <Carte couleur="rgba(201,163,255,.35)" className="!p-3">
              <p className="labo-mono text-[10px] text-[#B9C1E3]">DISTANCE TERRE – SOLEIL</p>
              <p className="labo-jeu text-[24px] leading-none text-white">{nombre(dist, 1)} <span className="text-[14px] text-[#B9C1E3]">millions de km</span></p>
              <p className="mt-1.5 text-[11px] leading-snug text-[#B9C1E3]">C’est en janvier que la Terre est la plus proche du Soleil, et pourtant c’est l’hiver chez nous. <b className="text-white">Ce n’est pas la distance qui fait les saisons : c’est l’inclinaison de l’axe.</b></p>
            </Carte>
          </>
        }
      >
        <Vue3D construire={construire} donnees={donnees.current} position={[0, 8.6, 10.5]} fov={40} orbite={{ min: 7, max: 22 }}>
          <div ref={encart} className="pointer-events-none absolute left-3 top-3 aspect-square w-[26%] max-w-[200px] min-w-[120px] rounded-2xl border-2" style={{ borderColor: 'rgba(255,162,77,.7)' }}>
            <span className="labo-jeu absolute left-2 top-1.5 text-[12px] text-[#FFD9B0]">Vue de côté</span>
            <span className="labo-jeu absolute bottom-1.5 left-2 text-[12px] text-[#FFD27A]">← Soleil</span>
          </div>
        </Vue3D>
      </Duo>
    </PageEspace>
  )
}
