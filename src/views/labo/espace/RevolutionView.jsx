import { useRef, useState } from 'react'
import { Calendar, RefreshCcw, Orbit, Sun as SunIcon } from 'lucide-react'
import { Carte, Duo } from '../../../components/labo/CadreJeu.jsx'
import { construireOrrery, distanceSoleil, vitesseOrbitale } from '../../../components/labo/espace/orrery.js'
import { dateDuJour, nombre, ORANGE, OR } from '../../../components/labo/espace/donnees.js'
import { BoutonLecture, Curseur, Onglets, PageEspace, PasEchelle, Vitesses, Vue3D, useLecture } from './commun.jsx'

// =============================================================
//  S3 · Révolution — la Terre fait le tour du Soleil en 365,25 jours (1 an), en tournant sur elle-même (1 tour = 1 jour).
//  Deux modes : « Un an » (rotation ralentie pour qu'on la voie) et « Un jour » (temps réel d'une rotation, la Terre avance à peine).
//  Attendus 99, 102, 103 (voir le référentiel P5-P6 §3.1).
// =============================================================
const AN_SEC = { lent: 30, normal: 16, rapide: 7 } // secondes pour une année
const JOUR_SEC = { lent: 12, normal: 7, rapide: 3.5 } // secondes pour un jour

function construire(ctx) {
  const { THREE } = ctx
  const o = construireOrrery(ctx, { R: 5, rTerre: 0.62, rSoleil: 0.8, mois: true, fetes: true, trace: true, axeVisible: true, ellipse: true })
  // un drapeau sur la Terre (Bruxelles) pour voir les tours
  const surface = o.terre.userData.surface
  const phi = (50.85 * Math.PI) / 180
  const lam = (4.35 * Math.PI) / 180
  const p = new THREE.Vector3(Math.cos(phi) * Math.cos(lam), Math.sin(phi), -Math.cos(phi) * Math.sin(lam))
  const mat = new THREE.MeshBasicMaterial({ color: '#FFE27A' })
  const tige = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 6), mat)
  const tete = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 8), mat)
  const flag = new THREE.Group()
  tige.position.y = 0.1
  tete.position.y = 0.21
  flag.add(tige, tete)
  flag.position.copy(p).multiplyScalar(0.62)
  flag.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p)
  surface.add(flag)
  return {
    maj(dt, t) {
      const e = ctx.d().etat
      // l'orbite se déforme doucement entre « vraie » (e = 0,0167) et « exagérée » (e = 0,2)
      if (Math.abs(e.exc - e.excCible) > 0.0003 || !e.dessinee) {
        e.exc += (e.excCible - e.exc) * Math.min(1, dt * 5)
        if (Math.abs(e.exc - e.excCible) <= 0.0003) e.exc = e.excCible
        o.reglerExcentricite(e.exc)
        e.dessinee = true
      }
      if (e.joue) e.total += e.mode === 'an' ? (dt * 365.25) / AN_SEC[e.vitesse] : dt / JOUR_SEC[e.vitesse]
      const jour = e.total % 365.25
      const spin = e.mode === 'an' ? jour * 2 * Math.PI * 0.09 : e.total * 2 * Math.PI
      o.maj({ jour, spin, t })
    },
  }
}

export default function RevolutionView() {
  const etat = useRef({ total: 171, joue: true, mode: 'an', vitesse: 'normal', exc: 0.2, excCible: 0.2, dessinee: false })
  const [joue, setJoue] = useState(true)
  const [vitesse, setVitesse] = useState('normal')
  const [mode, setMode] = useState('an')
  const [exagere, setExagere] = useState(true)
  const [glisse, setGlisse] = useState(null)
  const donnees = useRef({})
  donnees.current = { etat: etat.current }
  const l = useLecture(etat, (e) => ({ total: e.total }))
  const jour = glisse ?? l.total % 365.25
  const dSoleil = distanceSoleil(jour)
  const tours = Math.floor(l.total)
  const heure = Math.floor(((l.total % 1) * 24) % 24)

  return (
    <PageEspace code="S3" titre="Révolution" attendus={[99,102,103]} ecran large>
      <Duo
        visuelDabord
        commandes={
          <>
            <Onglets valeur={mode} onChange={(m) => { etat.current.mode = m; setMode(m) }} couleur={ORANGE} options={[['an', Calendar, 'Un an'], ['jour', RefreshCcw, 'Un jour']]} />
            <div className="grid grid-cols-2 gap-2">
              <Carte couleur="rgba(255,122,200,.45)" className="!p-3">
                <RefreshCcw size={22} color="#FF7AC8" />
                <p className="labo-jeu mt-1 text-[19px] leading-tight text-[#FF9BD6]">Rotation</p>
                <p className="mt-0.5 text-[12px] leading-snug text-[#DDE2F7]">La Terre tourne sur elle‑même.<br /><b className="text-white">1 tour = 1 jour</b></p>
              </Carte>
              <Carte couleur="rgba(255,162,77,.45)" className="!p-3">
                <Orbit size={22} color="#FFA24D" />
                <p className="labo-jeu mt-1 text-[19px] leading-tight" style={{ color: ORANGE }}>Révolution</p>
                <p className="mt-0.5 text-[12px] leading-snug text-[#DDE2F7]">La Terre tourne autour du Soleil.<br /><b className="text-white">1 tour = 1 an</b></p>
              </Carte>
            </div>
            <Carte couleur="rgba(166,107,255,.4)" className="!p-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="labo-mono text-[10px] text-[#B9C1E3]">DATE</p>
                  <p className="labo-jeu text-[22px] leading-tight text-white">{dateDuJour(Math.floor(jour))}</p>
                </div>
                <div>
                  <p className="labo-mono text-[10px] text-[#B9C1E3]">TOURS SUR ELLE</p>
                  <p className="labo-jeu text-[22px] leading-tight text-[#FF9BD6]">{tours}</p>
                </div>
                <div>
                  <p className="labo-mono text-[10px] text-[#B9C1E3]">TOUR DU SOLEIL</p>
                  <p className="labo-jeu text-[22px] leading-tight" style={{ color: ORANGE }}>{nombre((jour / 365.25), 2)}</p>
                </div>
              </div>
              {mode === 'jour' && <p className="mt-1.5 text-center text-[12px] text-[#DDE2F7]">Il est <b className="text-white">{heure} h</b> : la Terre a tourné de {nombre(((l.total % 1) * 360), 0)}° et avancé de {nombre(360 / 365.25, 1)}° sur son orbite seulement.</p>}
            </Carte>
            <Carte couleur="rgba(166,107,255,.4)" className="!p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="labo-mono text-[10px] text-[#B9C1E3]">DISTANCE AU SOLEIL</p>
                  <p className="labo-jeu text-[24px] leading-none" style={{ color: ORANGE }}>{nombre(dSoleil, 1)} <span className="text-[14px]">millions de km</span></p>
                </div>
                <div className="text-right">
                  <p className="labo-mono text-[10px] text-[#B9C1E3]">VITESSE</p>
                  <p className="labo-jeu text-[24px] leading-none text-white">{nombre(vitesseOrbitale(dSoleil), 1)} <span className="text-[14px]">km/s</span></p>
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                {[[true, 'Ellipse exagérée'], [false, 'Vraie orbite']].map(([v, nom]) => (
                  <button key={nom} type="button" onClick={() => { etat.current.excCible = v ? 0.2 : 0.0167; setExagere(v) }} className="min-h-[40px] flex-1 rounded-2xl border text-[13px] font-bold active:scale-95" style={exagere === v ? { background: ORANGE, color: '#12062A', borderColor: ORANGE } : { color: '#FFD9B0', borderColor: '#FFA24D66', background: 'rgba(11,10,30,.85)' }}>{nom}</button>
                ))}
              </div>
              <p className="mt-1.5 text-[12px] leading-snug text-[#DDE2F7]">{exagere ? <>Ici l’ellipse est <b className="text-white">exagérée 12 fois</b> pour qu’on la voie. </> : <>La vraie orbite est <b className="text-white">presque ronde</b> : seulement 3 % d’écart. </>}Plus près vers le <b className="text-white">3 janvier</b> (147,1 M km), plus loin vers le <b className="text-white">4 juillet</b> (152,1 M km).</p>
            </Carte>
            <Curseur label="Jour de l’année" valeur={Math.round(jour)} min={0} max={364} onChange={(v) => { etat.current.total = v; etat.current.joue = false; setJoue(false); setGlisse(v); clearTimeout(donnees.current.t); donnees.current.t = setTimeout(() => setGlisse(null), 400) }} format={(v) => dateDuJour(v)} couleur={ORANGE} />
            <div className="flex items-center gap-2">
              <BoutonLecture joue={joue} couleur={ORANGE} onClick={() => { etat.current.joue = !joue; setJoue(!joue) }} />
              <div className="flex-1">
                <Vitesses valeur={vitesse} onChange={(v) => { etat.current.vitesse = v; setVitesse(v) }} couleur={ORANGE} />
              </div>
            </div>
            <p className="labo-mono text-[10px] leading-snug text-[#8A93B8]">La Terre met 365 jours et un quart pour faire le tour du Soleil : tous les 4 ans, on ajoute un jour (29 février).</p>
          </>
        }
      >
        <Vue3D construire={construire} donnees={donnees.current} position={[0, 11.5, 11.5]} fov={40} orbite={{ min: 7, max: 24 }}>
          <PasEchelle texte={mode === 'an' ? 'Rotation ralentie · pas à l’échelle' : 'Pas à l’échelle'} className="!top-auto bottom-3" />
          <span className="labo-mono pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-[11px]" style={{ color: OR }}>
            <SunIcon size={13} /> vue du dessus, depuis le pôle Nord
          </span>
        </Vue3D>
      </Duo>
    </PageEspace>
  )
}
