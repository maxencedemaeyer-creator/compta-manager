import { useEffect, useMemo, useState } from 'react'
import { Music, RotateCcw } from 'lucide-react'
import CadreJeu, { Bouton, Carte, Eclat, melanger, Duo } from '../../components/labo/CadreJeu.jsx'
import Corps3D from '../../components/labo/Corps3D.jsx'
import { NOMS_ARTICULATIONS } from '../../components/labo/anatomie.js'

// =============================================================
//  A5 · Le pantin du savant fou (vrai squelette 3D)
//  L'élève pose les 6 articulations, puis fait danser le squelette.
//  Seules les articulations bien placées bougent ; une articulation
//  posée au milieu d'un os… l'os ne plie pas : CRAC !
//  Attendus 113, 120.
// =============================================================
const ORDRE = ['epaule', 'coude', 'poignet', 'hanche', 'genou', 'cheville']

const NOEUD_DE_OS = { humerus: 'epaule_d', radius: 'coude_d', main: 'poignet_d', femur: 'hanche_d', tibia: 'genou_d', pied: 'cheville_d' }

function candidats(pv) {
  if (!pv) return {}
  const L = (a, b, t) => a.clone().lerp(b, t).toArray()
  const plus = (a, x, y, z) => a.clone().add({ x, y, z }).toArray()
  const e = pv.epaule_d, c = pv.coude_d, p = pv.poignet_d, h = pv.hanche_d, g = pv.genou_d, ch = pv.cheville_d
  const liste = {
    epaule: [{ id: 'ok', point: e.toArray(), os: null }, { id: 'f1', point: L(e, c, 0.5), os: 'humerus' }, { id: 'f2', point: plus(e, 0.07, 0.03, 0.02), os: 'clavicule' }],
    coude: [{ id: 'ok', point: c.toArray(), os: null }, { id: 'f1', point: L(c, p, 0.5), os: 'radius' }, { id: 'f2', point: L(e, c, 0.4), os: 'humerus' }],
    poignet: [{ id: 'ok', point: p.toArray(), os: null }, { id: 'f1', point: L(c, p, 0.65), os: 'radius' }, { id: 'f2', point: plus(p, 0, -0.08, 0), os: 'main' }],
    hanche: [{ id: 'ok', point: h.toArray(), os: null }, { id: 'f1', point: L(h, g, 0.5), os: 'femur' }, { id: 'f2', point: plus(h, 0.0, 0.09, 0), os: 'bassin' }],
    genou: [{ id: 'ok', point: g.toArray(), os: null }, { id: 'f1', point: L(h, g, 0.6), os: 'femur' }, { id: 'f2', point: L(g, ch, 0.5), os: 'tibia' }],
    cheville: [{ id: 'ok', point: ch.toArray(), os: null }, { id: 'f1', point: L(g, ch, 0.6), os: 'tibia' }, { id: 'f2', point: plus(ch, 0, -0.04, 0.09), os: 'pied' }],
  }
  for (const l of Object.values(liste)) for (const o of l) o.noeud = NOEUD_DE_OS[o.os]
  return liste
}

export default function PantinView() {
  const [outils, setOutils] = useState(null)
  const [choix, setChoix] = useState({})
  const [danse, setDanse] = useState(false)
  const [t, setT] = useState(0)
  const [eclat, setEclat] = useState({ message: '', cle: 0 })
  const cands = useMemo(() => candidats(outils?.pivots), [outils])
  const etape = ORDRE.find((j) => !choix[j])
  const options = useMemo(() => (etape && cands[etape] ? melanger(cands[etape]) : []), [etape, cands])

  useEffect(() => {
    if (!danse) return
    let raf
    const debut = performance.now()
    const boucle = (m) => {
      setT((m - debut) / 1000)
      raf = requestAnimationFrame(boucle)
    }
    raf = requestAnimationFrame(boucle)
    return () => cancelAnimationFrame(raf)
  }, [danse])

  const erreurs = ORDRE.filter((j) => choix[j] && choix[j].id !== 'ok')
  const bon = (j) => choix[j]?.id === 'ok'

  function placer(id) {
    const o = options.find((x) => `${etape}-${x.id}` === id)
    if (o) setChoix((c) => ({ ...c, [etape]: o }))
  }

  const s = Math.sin(t * 3)
  const poses = {}
  if (danse) {
    for (const c of ['d', 'g']) {
      const ph = c === 'd' ? 0 : Math.PI
      if (bon('epaule')) poses[`epaule_${c}`] = { flex: 20 + 25 * Math.sin(t * 3 + ph), abd: 55 + 45 * s }
      if (bon('coude')) poses[`coude_${c}`] = 55 + 45 * Math.sin(t * 3 + 1 + ph)
      if (bon('poignet')) poses[`poignet_${c}`] = 30 * Math.sin(t * 6 + ph)
      if (bon('hanche')) poses[`hanche_${c}`] = { flex: 25 + 25 * Math.sin(t * 3 + ph), abd: 8 + 8 * s }
      if (bon('genou')) poses[`genou_${c}`] = 35 + 35 * Math.sin(t * 3 + ph)
      if (bon('cheville')) poses[`cheville_${c}`] = 20 * Math.sin(t * 6 + ph)
    }
  }

  const etats = {}
  for (const j of erreurs) if (danse && choix[j].os) etats[`${choix[j].os}_d`] = Math.sin(t * 8) > 0 ? 'erreur' : undefined

  const marqueurs = [
    ...Object.entries(choix).map(([j, o]) => ({ id: `place-${j}`, point: o.point, noeud: o.noeud, couleur: o.id === 'ok' ? '#9DFF8A' : '#FF6B7A', taille: 0.022, pulse: false })),
    ...(!danse && etape ? options.map((o) => ({ id: `${etape}-${o.id}`, point: o.point, couleur: '#FF8AD8', taille: 0.024 })) : []),
  ]
  // Une fois placée correctement, la bille suit l'articulation pendant la danse
  for (const m of marqueurs) {
    const j = m.id.startsWith('place-') ? m.id.slice(6) : null
    if (j && bon(j)) {
      delete m.point
      m.pivot = `${j}_d`
    }
  }

  const etiquettes = danse ? erreurs.map((j) => ({ texte: 'CRAC !', point: choix[j].point, noeud: choix[j].noeud, couleur: '#FF6B7A' })) : []

  function lancer() {
    setDanse(true)
    if (erreurs.length === 0) setEclat((x) => ({ message: 'Danse parfaite !', cle: x.cle + 1 }))
  }

  return (
    <CadreJeu code="A5" titre="Le pantin du savant fou" attendus={[113, 120]} couleur="#FF8AD8" ecran large>
      <Eclat message={eclat.message} cle={eclat.cle} couleur="#FF8AD8" />
      <Duo
        commandes={
          <>
      <Carte couleur="rgba(255,138,216,.45)">
        {etape ? (
          <>
            <p className="labo-mono text-[11px] text-[#FF8AD8]">ARTICULATION {ORDRE.indexOf(etape) + 1} / 6 · côté droit du squelette (à gauche de l’écran)</p>
            <p className="labo-titre mt-1 text-2xl font-black text-white">Place : {NOMS_ARTICULATIONS[etape].toLowerCase()}</p>
            <p className="mt-1 text-sm text-[#B9C1E3]">Touche la bille rose au bon endroit : là où deux os se rejoignent.</p>
          </>
        ) : !danse ? (
          <>
            <p className="labo-titre text-xl font-bold text-white">Le pantin est prêt.</p>
            <p className="mt-1 text-sm text-[#B9C1E3]">Fais-le danser : il ne pourra bouger qu’aux articulations que tu as bien placées.</p>
            <Bouton className="mt-3 w-full" couleur="#FF8AD8" onClick={lancer}>
              <Music size={18} /> Faire danser
            </Bouton>
          </>
        ) : erreurs.length ? (
          <>
            <p className="labo-titre text-lg font-bold text-[#FF8A95]">CRAC ! Un os ne se plie pas.</p>
            <p className="mt-1 text-sm text-[#E8ECFF]">
              Un os est rigide : le mouvement se fait seulement aux articulations. Ces parties restent bloquées : {erreurs.map((j) => NOMS_ARTICULATIONS[j].toLowerCase()).join(', ')}.
            </p>
          </>
        ) : (
          <>
            <p className="labo-titre text-lg font-bold text-[#9DFF8A]">Six articulations parfaites !</p>
            <p className="mt-1 text-sm text-[#E8ECFF]">Les os restent rigides, et tout le mouvement se fait aux articulations : épaule, coude, poignet, hanche, genou, cheville.</p>
          </>
        )}
        {Object.keys(choix).length > 0 && (
          <Bouton variante="secondaire" className="mt-3 w-full" onClick={() => { setChoix({}); setDanse(false) }}>
            <RotateCcw size={16} /> Recommencer
          </Bouton>
        )}
      </Carte>

          </>
        }
      >
      <div className="rounded-3xl border border-white/10 bg-[#070B16]/70 tab:min-h-0 tab:flex-1">
        <Corps3D
          className="h-[62vh] max-h-[660px] w-full tab:h-full tab:max-h-none"
          marge={danse ? 1.35 : 1.08}
          etats={etats}
          poses={poses}
          posesInstantanees={danse}
          marqueurs={marqueurs}
          etiquettes={etiquettes}
          onMarqueur={placer}
          onPret={setOutils}
        />
      </div>
      </Duo>
    </CadreJeu>
  )
}
