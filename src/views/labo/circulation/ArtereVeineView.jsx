import { useMemo, useState } from 'react'
import { ArrowRight, RotateCcw, TriangleAlert } from 'lucide-react'
import * as THREE from 'three'
import { Bouton, Carte, Eclat, melanger } from '../../../components/labo/CadreJeu.jsx'
import Circulation3D from '../../../components/labo/circulation/Circulation3D.jsx'
import { FICHES } from '../../../components/labo/circulation/fiches.js'
import { Consigne, PageCirc } from './commun.jsx'

// =============================================================
//  C3 · Artère ou veine ?
//  Tout le réseau est gris : un vaisseau s'allume et des globules
//  y circulent DANS LE VRAI SENS du sang. S'éloignent-ils du cœur
//  (artère) ou y reviennent-ils (veine) ? Puis on révèle la couleur.
//  Pièges : l'artère pulmonaire (sang pauvre en dioxygène) et la
//  veine pulmonaire (sang riche) : c'est le SENS qui compte.
//  Attendus 66, 70.
// =============================================================
const VAISSEAUX = [
  { ligne: 'carotide_commune', groupe: 'carotide', cote: 'g', type: 'artere', cadre: 'tete', nom: 'Artère carotide' },
  { ligne: 'jugulaire_interne', groupe: 'jugulaire', cote: 'g', type: 'veine', cadre: 'tete', nom: 'Veine jugulaire' },
  { ligne: 'aorte_descendante', groupe: 'aorte', cote: '', type: 'artere', cadre: 'corps', nom: 'Aorte' },
  { ligne: 'veine_cave_inf_bas', groupe: 'veine_cave_inf', cote: '', type: 'veine', cadre: 'ventre', nom: 'Veine cave inférieure' },
  { ligne: 'veine_cave_sup', groupe: 'veine_cave_sup', cote: '', type: 'veine', cadre: 'thorax', nom: 'Veine cave supérieure' },
  { ligne: 'tronc_pulmonaire', groupe: 'tronc_pulmonaire', cote: '', type: 'artere', cadre: 'thorax', nom: 'Artère pulmonaire', piege: 'Piège ! Son sang est pauvre en dioxygène (il va se recharger dans les poumons)… mais elle PART du cœur : c’est bien une artère.' },
  { ligne: 'veine_pulmonaire_g', groupe: 'veines_pulmonaires', cote: 'g', type: 'veine', cadre: 'thorax', nom: 'Veine pulmonaire', piege: 'Piège ! Son sang est riche en dioxygène (il revient des poumons)… mais il REVIENT au cœur : c’est bien une veine.' },
  { ligne: 'humerale_a', groupe: 'artere_humerale', cote: 'g', type: 'artere', cadre: 'bras', nom: 'Artère humérale' },
  { ligne: 'radiale_a', groupe: 'artere_radiale', cote: 'g', type: 'artere', cadre: 'bras', nom: 'Artère radiale' },
  { ligne: 'axillaire_v', groupe: 'axillaire_v', cote: 'g', type: 'veine', cadre: 'bras', nom: 'Veine axillaire' },
  { ligne: 'femorale_a', groupe: 'artere_femorale', cote: 'g', type: 'artere', cadre: 'jambe', nom: 'Artère fémorale' },
  { ligne: 'femorale_v', groupe: 'veine_femorale', cote: 'g', type: 'veine', cadre: 'jambe', nom: 'Veine fémorale' },
  { ligne: 'poplitee_v', groupe: 'veine_poplitee', cote: 'g', type: 'veine', cadre: 'jambe', nom: 'Veine poplitée (derrière le genou)' },
  { ligne: 'renale_a', groupe: 'arteres_reins', cote: 'g', type: 'artere', cadre: 'ventre', nom: 'Artère rénale' },
  { ligne: 'renale_v', groupe: 'veines_reins', cote: 'g', type: 'veine', cadre: 'ventre', nom: 'Veine rénale' },
]
const N = 8

function tirage() {
  // toujours au moins un des deux pièges pulmonaires
  const pieges = VAISSEAUX.filter((v) => v.piege)
  const autres = VAISSEAUX.filter((v) => !v.piege)
  return melanger([melanger(pieges)[0], ...melanger(autres).slice(0, N - 1)])
}

export default function ArtereVeineView() {
  const [serie, setSerie] = useState(tirage)
  const [n, setN] = useState(0)
  const [reponse, setReponse] = useState(null)
  const [score, setScore] = useState(0)
  const [outils, setOutils] = useState(null)
  const [eclat, setEclat] = useState({ message: '', cle: 0 })
  const fini = n >= serie.length
  const v = serie[Math.min(n, serie.length - 1)]

  // Globules qui circulent dans le vrai sens : artère = en partant du cœur, veine = vers le cœur
  const flux = useMemo(() => {
    if (!outils || fini) return []
    const coeur = new THREE.Vector3(...outils.modele.points.coeur)
    let pts = outils.modele.lignes[v.ligne].map((p) => new THREE.Vector3(...p))
    const debutPres = pts[0].distanceTo(coeur) < pts[pts.length - 1].distanceTo(coeur)
    if ((v.type === 'artere') !== debutPres) pts = pts.reverse()
    return [{ points: pts, avant: '#FFFFFF', nombre: Math.max(6, Math.round(pts.length / 2)), vitesse: 0.35 }]
  }, [outils, v, fini])

  function repondre(type) {
    if (reponse) return
    const bon = type === v.type
    setReponse(type)
    if (bon) {
      setScore((s) => s + 1)
      setEclat((x) => ({ message: v.piege ? 'Piège déjoué !' : 'Exact !', cle: x.cle + 1 }))
    }
  }

  function suivant() {
    setReponse(null)
    setN((x) => x + 1)
  }

  function rejouer() {
    setSerie(tirage())
    setN(0)
    setScore(0)
    setReponse(null)
  }

  const etats = fini ? {} : { [`${v.groupe}${v.cote ? `_${v.cote}` : ''}`]: reponse ? 'reel' : 'actif' }

  return (
    <PageCirc code="C3" titre="Artère ou veine ?" attendus={[66, 70]} large>
      <Eclat message={eclat.message} cle={eclat.cle} couleur="#4DA3FF" />
      <div className="grid gap-3 lg:grid-cols-[1fr_360px]">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#070B16]/80">
          <Circulation3D
            className="h-[58vh] min-h-[380px] max-h-[680px] w-full"
            rotation
            couleurs={fini ? 'type' : 'neutre'}
            afficher={['coeur', 'artere', 'veine', 'os']}
            opacites={{ os: 0.1 }}
            cadrage={fini ? 'corps' : v.cadre}
            battement={64}
            etats={etats}
            flux={flux}
            fluxCle={fini ? 'fin' : `${n}-${outils ? 1 : 0}`}
            tailleFlux={11}
            onPret={setOutils}
          />
          {!fini && (
            <div className="pointer-events-none absolute left-3 top-3 rounded-xl bg-black/60 px-2 py-1 text-[11px] text-[#B9C1E3]">
              Le <b className="text-[#FF8A9C]">cœur</b> est en rouge. Regarde dans quel sens vont les globules <b className="text-white">blancs</b>.
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {fini ? (
            <Carte couleur="rgba(77,163,255,.5)">
              <p className="labo-titre text-3xl font-black text-white">
                {score} / {serie.length}
              </p>
              <p className="mt-1 text-[15px] leading-snug text-[#DDE2F7]">
                Voici tout le réseau : les <b className="text-[#FF8A9C]">artères</b> partent du cœur, les <b className="text-[#8FB2FF]">veines</b> y reviennent. Partout dans le corps, entre les deux, de tout petits vaisseaux (les capillaires) relient les artères aux veines.
              </p>
              <Bouton className="mt-3 w-full" couleur="#4DA3FF" onClick={rejouer}>
                <RotateCcw size={17} /> Rejouer
              </Bouton>
            </Carte>
          ) : (
            <>
              <Consigne couleur="#4DA3FF">
                <span className="labo-mono text-[11px] text-[#8FC4FF]">
                  VAISSEAU {n + 1} / {serie.length} · {score} PT
                </span>
                <br />
                Le vaisseau qui clignote : le sang <b>part du cœur</b> ou <b>revient au cœur</b> ?
              </Consigne>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['artere', 'Il part du cœur', 'ARTÈRE', '#E8394A'],
                  ['veine', 'Il revient au cœur', 'VEINE', '#3D6FF0'],
                ].map(([t, phrase, mot, c]) => {
                  const st = !reponse ? { borderColor: `${c}99` } : t === v.type ? { background: '#9DFF8A', color: '#06210A', borderColor: '#9DFF8A' } : t === reponse ? { background: '#FF6B7A', color: '#2A0509', borderColor: '#FF6B7A' } : { opacity: 0.45 }
                  return (
                    <button key={t} type="button" onClick={() => repondre(t)} className="flex min-h-[86px] flex-col items-center justify-center gap-1 rounded-2xl border-2 bg-[#0B1122] px-2 text-center active:scale-[.97]" style={st}>
                      <span className="text-[13px] font-bold">{phrase}</span>
                      <span className="labo-titre text-lg font-black" style={!reponse ? { color: c } : {}}>
                        → {mot}
                      </span>
                    </button>
                  )
                })}
              </div>
              {reponse && (
                <Carte couleur={reponse === v.type ? '#9DFF8A' : '#FF6B7A'} className="labo-apparait">
                  <p className="labo-titre text-lg font-bold text-white">{v.nom}</p>
                  <p className="mt-1 text-[14px] leading-snug text-[#DDE2F7]">{FICHES[v.groupe]}</p>
                  {v.piege && (
                    <p className="mt-2 flex gap-2 rounded-xl bg-[#FFD27A]/10 p-2 text-[13px] leading-snug text-[#FFE3A8]">
                      <TriangleAlert size={16} className="mt-0.5 flex-none" /> {v.piege}
                    </p>
                  )}
                  <Bouton className="mt-3 w-full" couleur="#4DA3FF" onClick={suivant}>
                    Suivant <ArrowRight size={17} />
                  </Bouton>
                </Carte>
              )}
            </>
          )}
          <p className="text-[12px] leading-snug text-[#8A93B8]">
            À retenir : ce n’est pas la couleur qui fait une artère ou une veine, c’est le <b>sens</b> du sang. Artère = part du cœur. Veine = revient au cœur.
          </p>
        </div>
      </div>
    </PageCirc>
  )
}
