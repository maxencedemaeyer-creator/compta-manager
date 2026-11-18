import { useRef, useState } from 'react'
import { Sun } from 'lucide-react'
import { Duo } from '../../../components/labo/CadreJeu.jsx'
import { ambiance, atmosphere, creerAnneauxSaturne, creerAstre, creerSoleil, creerTerre, deg, etoiles3D, halo, orbite } from '../../../components/labo/espace/outils3d.js'
import { PLANETES, PLANETE, SOLEIL, TYPE_COURT, dureeAnnee, dureeJour, dureeLumiere, nombre, rayonAffiche, rayonOrbite, VIOLET } from '../../../components/labo/espace/donnees.js'
import { Faits, PageEspace, PasEchelle, Vitesses, Vue3D } from './commun.jsx'

// =============================================================
//  S1 · Système — les 8 planètes autour du Soleil (3D, textures réelles).
//  Modèle « lisible » : tailles et distances NON à l'échelle (écrit à l'écran).
//  Les vitesses, elles, sont proportionnelles aux vraies durées d'une année.
//  Attendus 99 et 100 (non affichés) + planètes (hors référentiel).
// =============================================================
const ATMOS = {
  venus: { couleur: '#FFD9A0', force: 0.5 },
  mars: { couleur: '#FF9A6B', force: 0.22 },
  jupiter: { couleur: '#FFE0B0', force: 0.2 },
  saturne: { couleur: '#FFE7B8', force: 0.2 },
  uranus: { couleur: '#9FE9F0', force: 0.5 },
  neptune: { couleur: '#6C8CFF', force: 0.6 },
}
const ANNEE_SEC = { lent: 26, normal: 14, rapide: 5 } // durée d'une année terrestre à l'écran, en secondes

function construire(ctx) {
  const { THREE, scene, camera } = ctx
  const origine = new THREE.Vector3()
  scene.add(etoiles3D(1100, 90))
  ambiance(scene, 0.16)
  const soleil = creerSoleil(0.9)
  scene.add(soleil)
  const cibles = []
  const objets = []
  const rayon = new THREE.Raycaster()

  const pickSoleil = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 8), new THREE.MeshBasicMaterial({ visible: false }))
  pickSoleil.userData.id = 'soleil'
  scene.add(pickSoleil)
  cibles.push(pickSoleil)
  const etiSoleil = ctx.etiquette({ texte: 'Soleil', couleur: '#FFD27A' })

  PLANETES.forEach((p, i) => {
    const R = rayonOrbite(p)
    const r = rayonAffiche(p)
    scene.add(orbite(R, VIOLET, 0.3))
    const pivot = new THREE.Group()
    scene.add(pivot)
    const portee = new THREE.Group()
    portee.position.set(R, 0, 0)
    pivot.add(portee)
    const incl = new THREE.Group()
    incl.rotation.z = deg(p.axe)
    portee.add(incl)
    const astre = p.id === 'terre' ? creerTerre(r, origine) : creerAstre(p.texture, r, { atmo: ATMOS[p.id], sunPos: origine })
    const tourne = astre.userData.surface || astre.userData.corps
    incl.add(astre)
    if (p.anneaux) incl.add(creerAnneauxSaturne(r))
    const pick = new THREE.Mesh(new THREE.SphereGeometry(Math.max(r * 1.5, 0.5), 10, 8), new THREE.MeshBasicMaterial({ visible: false }))
    pick.userData.id = p.id
    portee.add(pick)
    cibles.push(pick)
    const eti = ctx.etiquette({ texte: p.nom, couleur: p.couleur })
    objets.push({ p, pivot, portee, tourne, nuages: astre.userData.nuages, eti, a0: (i * 2.399) % (Math.PI * 2), r })
  })

  // anneau de sélection
  const selection = halo('#FFFFFF', 1, 0.0)
  scene.add(selection)

  ctx.surClic((ndc) => {
    rayon.setFromCamera(ndc, camera)
    const h = rayon.intersectObjects(cibles, false)[0]
    if (h) ctx.d().choisir(h.object.userData.id)
  })

  let annees = 0
  const v = new THREE.Vector3()
  return {
    maj(dt, t) {
      const d = ctx.d()
      if (!d.pause) annees += dt / ANNEE_SEC[d.vitesse]
      soleil.userData.maj(t)
      for (const o of objets) {
        o.pivot.rotation.y = o.a0 + (Math.PI * 2 * annees) / (o.p.anneeJ / 365.25)
        o.tourne.rotation.y += dt * 0.5 * (o.p.sens === 'rétrograde' ? -1 : 1)
        if (o.nuages) o.nuages.rotation.y += dt * 0.58
        o.portee.getWorldPosition(v)
        v.y -= o.r + 0.05
        o.eti.place(v, 0, o.p.distMkm < 300 ? (objets.indexOf(o) % 2 ? 16 : -2 - o.r * 40) : 14)
        o.eti.el.style.opacity = d.selection && d.selection !== o.p.id ? '0.55' : '1'
      }
      etiSoleil.place(v.set(0, -1.1, 0), 0, 14)
      // sélection
      const o = objets.find((x) => x.p.id === d.selection)
      if (o) {
        o.portee.getWorldPosition(v)
        selection.position.copy(v)
        const s = Math.max(o.r * 3.4, 1.1) * (1 + 0.05 * Math.sin(t * 5))
        selection.scale.set(s, s, 1)
        selection.material.opacity = 0.55
      } else if (d.selection === 'soleil') {
        selection.position.set(0, 0, 0)
        selection.scale.set(5.5, 5.5, 1)
        selection.material.opacity = 0.22
      } else selection.material.opacity = 0
    },
  }
}

function Fiche({ id }) {
  if (id === 'soleil')
    return (
      <div className="rounded-3xl border p-4" style={{ borderColor: '#FFD27A66', background: 'rgba(11,10,30,.9)' }}>
        <p className="labo-mono text-[11px] text-[#FFD27A]">ÉTOILE</p>
        <p className="labo-jeu text-[34px] leading-none text-[#FFD27A]">Soleil</p>
        <p className="mt-1 text-[13px] text-[#DDE2F7]">{SOLEIL.fait}</p>
        <div className="mt-3">
          <Faits
            couleur="#FFD27A"
            lignes={[
              ['Diamètre', `${nombre(SOLEIL.diamKm)} km`, `${nombre(SOLEIL.diamKm / 12742)} × la Terre`],
              ['Surface', '≈ 5 500 °C', 'Cœur : 15 millions °C'],
              ['Lumière → Terre', '8 min 19 s', 'à 300 000 km/s'],
              ['Il contient', '99,8 % de la masse', 'du système solaire'],
            ]}
          />
        </div>
      </div>
    )
  const p = PLANETE[id]
  if (!p) return null
  const fois = p.diamKm / 12742
  return (
    <div className="rounded-3xl border p-4" style={{ borderColor: `${p.couleur}77`, background: 'rgba(11,10,30,.9)' }}>
      <p className="labo-mono text-[11px]" style={{ color: p.couleur }}>
        PLANÈTE · {TYPE_COURT[p.type].toUpperCase()}
      </p>
      <p className="labo-jeu text-[34px] leading-none" style={{ color: p.couleur }}>
        {p.nom}
      </p>
      <p className="mt-1 text-[13px] leading-snug text-[#DDE2F7]">{p.fait}</p>
      <div className="mt-3">
        <Faits
          couleur={p.couleur}
          lignes={[
            ['Diamètre', `${nombre(p.diamKm)} km`, p.id === 'terre' ? 'notre planète' : `${nombre(fois, fois < 1 ? 2 : fois < 10 ? 1 : 0)} × la Terre`],
            ['Distance au Soleil', `${nombre(p.distMkm, p.distMkm < 1000 ? 1 : 0)} M km`, `${nombre(p.distMkm / 149.6, 2)} × la Terre`],
            ['Une année', dureeAnnee(p.anneeJ), 'un tour autour du Soleil'],
            ['Un jour', dureeJour(p.jourH), p.sens ? 'tourne à l’envers' : 'un tour sur elle-même'],
            ['Lumière du Soleil', dureeLumiere(p.distMkm), 'pour arriver ici'],
            ['Lunes', p.lunes, p.anneaux ? 'et des anneaux' : ''],
          ]}
        />
      </div>
    </div>
  )
}

export default function SystemeView() {
  const [selection, setSelection] = useState('terre')
  const [vitesse, setVitesse] = useState('normal')
  const [pause, setPause] = useState(false)
  const donnees = useRef({})
  donnees.current = { selection, vitesse, pause, choisir: setSelection }

  const puces = (
    <div className="flex flex-wrap gap-1.5">
      {[{ id: 'soleil', nom: 'Soleil', couleur: '#FFD27A' }, ...PLANETES].map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => setSelection(p.id)}
          className="flex min-h-[40px] items-center gap-1.5 rounded-full border px-3 text-[13px] font-bold active:scale-95"
          style={selection === p.id ? { background: p.couleur, color: '#12062A', borderColor: p.couleur } : { color: p.couleur, borderColor: `${p.couleur}66`, background: 'rgba(11,10,30,.8)' }}
        >
          {p.id === 'soleil' ? <Sun size={14} /> : <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.couleur }} />}
          {p.nom}
        </button>
      ))}
    </div>
  )

  return (
    <PageEspace code="S1" titre="Système" attendus={[99, 100]} ecran large>
      <Duo
        visuelDabord
        commandes={
          <>
            {puces}
            <Fiche id={selection} />
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Vitesses valeur={vitesse} onChange={setVitesse} />
              </div>
              <button type="button" onClick={() => setPause((x) => !x)} className="h-12 rounded-2xl border border-white/15 bg-[#0B0A1E]/90 px-4 text-[13px] font-bold text-[#E8ECFF]">
                {pause ? 'Lancer' : 'Pause'}
              </button>
            </div>
          </>
        }
      >
        <Vue3D construire={construire} donnees={donnees.current} position={[0, 11, 19]} fov={42} orbite={{ min: 7, max: 34, polaireMax: Math.PI * 0.6 }}>
          <PasEchelle texte="Tailles et distances pas à l’échelle" />
        </Vue3D>
      </Duo>
    </PageEspace>
  )
}
