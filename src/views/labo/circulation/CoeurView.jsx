import { useEffect, useMemo, useRef, useState } from 'react'
import { Eye, Footprints, HeartPulse, Pause, Play, Scissors, SkipForward, Target, Volume2, VolumeX } from 'lucide-react'
import { Bouton, Carte, Eclat, melanger } from '../../../components/labo/CadreJeu.jsx'
import Circulation3D from '../../../components/labo/circulation/Circulation3D.jsx'
import { BLEU, COULEUR_PART, COULEUR_REVIENT, NOMS, ROUGE, construireChemin, fluxSens, longueurs, pointSur, sangRiche } from '../../../components/labo/circulation/modele.js'
import { FICHES } from '../../../components/labo/circulation/fiches.js'
import { Onglets, PageCirc, boumTac } from './commun.jsx'

// =============================================================
//  C1 · Le cœur qui bat (paillasse vedette)
//  Un vrai cœur humain en 3D (BodyParts3D) qui bat au rythme choisi.
//  - Explorer : toucher chaque partie (cavités, valvules, vaisseaux)
//  - Ouvrir : parois transparentes, les 4 cavités remplies de sang
//  - Suivre le sang : une goutte traverse le cœur, va aux poumons et revient
//  - Mission : retrouver les parties demandées
//  Son « boum-tac » synthétisé. Attendus 66, 70.
// =============================================================
const VAISSEAUX_COEUR = ['coeur', 'aorte', 'tronc_pulmonaire', 'arteres_pulmonaires', 'veines_pulmonaires', 'veine_cave_sup', 'veine_cave_inf', 'tronc_brachiocephalique', 'carotide', 'sous_claviere_a', 'veines_brachiocephaliques', 'jugulaire', 'sous_claviere_v']
const CADRAGE = { groupes: ['paroi_ventricules', 'paroi_oreillette_d', 'paroi_oreillette_g', 'tronc_pulmonaire', 'veine_cave_sup', 'aorte'] }
const CADRAGE_SERRE = { groupes: ['paroi_ventricules', 'paroi_oreillette_d', 'paroi_oreillette_g', 'tronc_pulmonaire', 'veine_cave_sup'] }

const ETAPES = [
  ['L:veine_cave_sup', 'veine_cave_sup', 'Le sang pauvre en dioxygène revient de tout le corps par les veines caves.'],
  ['P:oreillette_d', 'cavite_oreillette_d', 'Il entre dans l’oreillette droite.'],
  ['P:ventricule_d', 'cavite_ventricule_d', 'La valvule s’ouvre : il descend dans le ventricule droit.'],
  ['L:tronc_pulmonaire', 'tronc_pulmonaire', 'Le ventricule droit se contracte et le chasse dans l’artère pulmonaire…'],
  ['L:artere_pulmonaire_g', 'arteres_pulmonaires', '… direction les poumons.'],
  ['P:poumon_g', 'arteres_pulmonaires', 'Dans les poumons, le sang rejette le dioxyde de carbone et se charge en dioxygène : il devient rouge vif.'],
  ['L:veine_pulmonaire_g', 'veines_pulmonaires', 'Il revient au cœur par une veine pulmonaire, riche en dioxygène.'],
  ['P:oreillette_g', 'cavite_oreillette_g', 'Il entre dans l’oreillette gauche…'],
  ['P:ventricule_g', 'cavite_ventricule_g', '… puis dans le ventricule gauche, le plus musclé des quatre.'],
  ['L:aorte_ascendante', 'aorte', 'Le ventricule gauche se contracte : le sang part dans l’aorte…'],
  ['L:crosse_aorte', 'aorte', '… vers tout le corps. C’est le grand voyage (activité « Voyage », C2) !'],
]

// Vaisseaux autour du cœur où l'on montre le sens du sang
const LIGNES_COEUR = ['veine_cave_sup', 'veine_cave_inf_haut', 'aorte_ascendante', 'crosse_aorte', 'tronc_pulmonaire', 'artere_pulmonaire_g', 'artere_pulmonaire_d', 'veine_pulmonaire_g', 'veine_pulmonaire_d', 'carotide_commune', 'jugulaire_interne', 'sous_claviere_a', 'sous_claviere_v', 'brachiocephalique_v']

const MISSIONS = [
  { texte: 'le ventricule gauche', bons: ['cavite_ventricule_g'] },
  { texte: 'le ventricule droit', bons: ['cavite_ventricule_d'] },
  { texte: 'l’oreillette droite', bons: ['cavite_oreillette_d'] },
  { texte: 'l’oreillette gauche', bons: ['cavite_oreillette_g'] },
  { texte: 'l’aorte', bons: ['aorte'] },
  { texte: 'une veine cave', bons: ['veine_cave_sup', 'veine_cave_inf'] },
]
const CHOISISSABLES_MISSION = ['cavite_ventricule_g', 'cavite_ventricule_d', 'cavite_oreillette_d', 'cavite_oreillette_g', 'aorte', 'tronc_pulmonaire', 'arteres_pulmonaires', 'veine_cave_sup', 'veine_cave_inf', 'veines_pulmonaires', 'valvule_tricuspide', 'valvule_mitrale', 'valvule_pulmonaire', 'valvule_aortique', 'tronc_brachiocephalique', 'carotide', 'sous_claviere_a', 'veines_brachiocephaliques']

const ETIQUETTES_CAVITES = [
  { texte: 'Oreillette droite', groupe: 'cavite_oreillette_d', couleur: '#9FB8FF', dx: -14 },
  { texte: 'Ventricule droit', groupe: 'cavite_ventricule_d', couleur: '#9FB8FF', dx: -34, dy: 34 },
  { texte: 'Oreillette gauche', groupe: 'cavite_oreillette_g', couleur: '#FF9AA6' },
  { texte: 'Ventricule gauche', groupe: 'cavite_ventricule_g', couleur: '#FF9AA6', dx: 26, dy: 6 },
]

export default function CoeurView() {
  const [mode, setMode] = useState('explorer')
  const [bpm, setBpm] = useState(70)
  const [son, setSon] = useState(false)
  const [voirSens, setVoirSens] = useState(true)
  const [choisi, setChoisi] = useState(null)
  const [outils, setOutils] = useState(null)
  const [etape, setEtape] = useState(0)
  const [lecture, setLecture] = useState(true)
  const [missions, setMissions] = useState(() => melanger(MISSIONS).slice(0, 6))
  const [nMission, setNMission] = useState(0)
  const [score, setScore] = useState(0)
  const [retour, setRetour] = useState(null)
  const [eclat, setEclat] = useState({ message: '', cle: 0 })
  const anim = useRef({ u: 0, dernier: 0 })

  // Son des battements
  useEffect(() => {
    if (!son || !bpm) return
    boumTac(0.9, Math.min(0.32, 22 / bpm))
    const id = setInterval(() => boumTac(0.9, Math.min(0.32, 22 / bpm)), 60000 / bpm)
    return () => clearInterval(id)
  }, [son, bpm])

  // Chemin de la goutte à travers le cœur
  const chemin = useMemo(() => {
    if (!outils) return null
    const { points, reperes } = construireChemin(outils.modele, ETAPES.map((e) => e[0]))
    const cumul = longueurs(points)
    const total = cumul[cumul.length - 1]
    const debuts = reperes.map((r) => cumul[r.index] / total)
    return { points, cumul, debuts, poumon: debuts[5] }
  }, [outils])

  // Globules qui montrent le sens du sang (mode Explorer)
  const flux = useMemo(() => (outils && mode === 'explorer' && voirSens ? fluxSens(outils.modele, { lignes: LIGNES_COEUR, vitesse: 0.05 }) : []), [outils, mode, voirSens])

  // Animation de la goutte (mode « suivre le sang »)
  useEffect(() => {
    if (!outils || !chemin) return
    if (mode !== 'suivre') {
      outils.goutte('sang', null)
      outils.trace('sang', null)
      return
    }
    let raf
    const boucle = (t) => {
      raf = requestAnimationFrame(boucle)
      const a = anim.current
      const dt = a.dernier ? Math.min(0.05, (t - a.dernier) / 1000) : 0
      a.dernier = t
      if (lecture) a.u = (a.u + dt * 0.045) % 1
      const p = pointSur(chemin.points, chemin.cumul, a.u)
      outils.goutte('sang', p.toArray(), a.u < chemin.poumon ? '#7FA3FF' : '#FF5A6B', 0.011)
      let e = 0
      while (e < chemin.debuts.length - 1 && chemin.debuts[e + 1] <= a.u) e++
      setEtape((x) => (x === e ? x : e))
    }
    raf = requestAnimationFrame(boucle)
    return () => cancelAnimationFrame(raf)
  }, [outils, chemin, mode, lecture])

  function changerMode(m) {
    setMode(m)
    setChoisi(null)
    setRetour(null)
    anim.current.u = 0
    setLecture(true)
    if (m === 'mission') {
      setMissions(melanger(MISSIONS).slice(0, 6))
      setNMission(0)
      setScore(0)
    }
  }

  function etapeSuivante() {
    if (!chemin) return
    const e = (etape + 1) % chemin.debuts.length
    anim.current.u = chemin.debuts[e] + 0.001
    setEtape(e)
  }

  function choisir(groupe, cote, nature) {
    if (mode === 'mission') {
      if (!groupe || nMission >= missions.length) return
      const m = missions[nMission]
      const bon = m.bons.includes(groupe)
      setRetour({ bon, groupe, cote })
      if (bon) {
        setScore((s) => s + 1)
        setEclat((x) => ({ message: 'Bien trouvé !', cle: x.cle + 1 }))
        setTimeout(() => {
          setRetour(null)
          setNMission((n) => n + 1)
        }, 1300)
      }
      return
    }
    setChoisi(groupe ? { groupe, cote, nature } : null)
  }

  const coupe = mode !== 'explorer'
  const finMission = mode === 'mission' && nMission >= missions.length
  const etatsMission = retour ? { [retour.groupe]: retour.bon ? 'ok' : 'erreur' } : {}
  const etatsSuivre = mode === 'suivre' ? { [ETAPES[etape]?.[1]]: 'eclaire' } : {}
  const etats = mode === 'explorer' ? (choisi ? { [`${choisi.groupe}_${choisi.cote}`]: 'actif' } : {}) : mode === 'mission' ? etatsMission : etatsSuivre
  const riche = choisi ? sangRiche(choisi.groupe, choisi.nature) : null

  return (
    <PageCirc code="C1" titre="Le cœur qui bat" attendus={[66, 70]} large ecran>
      <Eclat message={eclat.message} cle={eclat.cle} couleur="#FF4D6D" />
      <Onglets
        valeur={mode}
        onChange={changerMode}
        options={[
          ['explorer', Eye, 'Explorer'],
          ['ouvrir', Scissors, 'Ouvrir'],
          ['suivre', Footprints, 'Suivre le sang'],
          ['mission', Target, 'Mission'],
        ]}
      />

      <div className="grid gap-3 lg:grid-cols-[1fr_340px] tab:min-h-0 tab:flex-1 tab:grid-rows-[minmax(0,1fr)]">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#070B16]/80 tab:min-h-0">
          <Circulation3D
            className="h-[58vh] min-h-[380px] max-h-[640px] w-full tab:h-full tab:max-h-none tab:min-h-0"
            rotation
            afficher={VAISSEAUX_COEUR}
            cadrage={mode === 'explorer' ? CADRAGE : CADRAGE_SERRE}
            coupe={coupe}
            battement={mode === 'suivre' ? Math.min(bpm, 60) : bpm}
            etats={etats}
            choisissables={mode === 'mission' ? CHOISISSABLES_MISSION : undefined}
            etiquettes={mode === 'ouvrir' ? ETIQUETTES_CAVITES : []}
            onChoisir={choisir}
            onPret={setOutils}
            flux={flux}
            fluxCle={`${mode}-${voirSens}-${outils ? 1 : 0}`}
            tailleFlux={10}
          />
          <div className="pointer-events-none absolute left-3 top-3 rounded-xl bg-black/55 px-2 py-1 text-[11px] leading-tight text-[#B9C1E3]">
            Vu de face : le côté <b className="text-white">droit</b> de la personne
            <br />
            est à <b className="text-white">ta gauche</b> !
          </div>
        </div>

        <div className="flex flex-col gap-3 tab:min-h-0 tab:overflow-y-auto">
          {/* Rythme */}
          <Carte couleur="rgba(255,77,109,.45)">
            <div className="flex items-center justify-between">
              <p className="labo-mono flex items-center gap-1.5 text-[11px] text-[#FF8A9C]">
                <HeartPulse size={14} className="labo-pulse" /> RYTHME CARDIAQUE
              </p>
              <button type="button" onClick={() => setSon((s) => !s)} className="flex h-9 items-center gap-1 rounded-xl border border-white/15 px-2 text-[12px] font-bold" aria-label={son ? 'Couper le son' : 'Écouter le cœur'}>
                {son ? <Volume2 size={15} /> : <VolumeX size={15} />} {son ? 'Son' : 'Muet'}
              </button>
            </div>
            <p className="labo-titre mt-1 text-3xl font-black text-white">
              {bpm} <span className="text-base font-bold text-[#B9C1E3]">battements / minute</span>
            </p>
            <input type="range" min="40" max="190" value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="mt-2 w-full accent-[#FF4D6D]" aria-label="Rythme cardiaque" />
            <div className="mt-2 grid grid-cols-3 gap-1.5 text-[12px] font-bold">
              {[
                [60, 'Sommeil'],
                [75, 'Repos'],
                [160, 'Effort'],
              ].map(([v, n]) => (
                <button key={n} type="button" onClick={() => setBpm(v)} className="h-9 rounded-xl border border-white/15" style={bpm === v ? { background: '#FF4D6D', color: '#1A0508' } : {}}>
                  {n}
                </button>
              ))}
            </div>
          </Carte>

          {mode === 'explorer' && (
            <Carte couleur="rgba(255,255,255,.14)">
              <div className="flex items-center justify-between gap-2">
                <p className="labo-mono text-[11px] text-[#B9C1E3]">LE SENS DU SANG</p>
                <button type="button" onClick={() => setVoirSens((v) => !v)} className="h-9 rounded-xl border border-white/15 px-3 text-[12px] font-bold" style={voirSens ? { background: '#FF4D6D', color: '#1A0508' } : {}}>
                  {voirSens ? 'Visible' : 'Caché'}
                </button>
              </div>
              {voirSens && (
                <p className="mt-1.5 text-[13px] leading-snug text-[#E8ECFF]">
                  <b style={{ color: COULEUR_PART }}>● Jaune</b> : le sang <b>part du cœur</b> (artères).
                  <br />
                  <b style={{ color: COULEUR_REVIENT }}>● Bleu clair</b> : le sang <b>revient au cœur</b> (veines).
                </p>
              )}
            </Carte>
          )}

          {mode === 'explorer' && (
            <Carte couleur="rgba(255,77,109,.35)">
              {choisi ? (
                <>
                  {riche !== null && (
                    <p className="labo-mono text-[11px]" style={{ color: riche ? '#FF8A9C' : '#8FB2FF' }}>
                      SANG {riche ? 'RICHE' : 'PAUVRE'} EN DIOXYGÈNE
                    </p>
                  )}
                  <p className="labo-titre text-lg font-bold text-white">{NOMS[choisi.groupe]}</p>
                  <p className="mt-1 text-[14px] leading-snug text-[#DDE2F7]">{FICHES[choisi.groupe]}</p>
                </>
              ) : (
                <p className="text-[14px] leading-snug text-[#E8ECFF]">
                  Voici un vrai cœur humain, gros comme un poing. Fais-le tourner et touche une partie pour savoir ce que c’est. Les vaisseaux qui partent du cœur sont des <b>artères</b>, ceux qui y reviennent sont des <b>veines</b>.
                </p>
              )}
            </Carte>
          )}

          {mode === 'ouvrir' && (
            <Carte couleur="rgba(255,77,109,.35)">
              <p className="text-[14px] leading-snug text-[#E8ECFF]">
                On a rendu les parois transparentes : voici les <b>4 cavités</b> remplies de sang. En haut, les <b>oreillettes</b> reçoivent le sang ; en bas, les <b>ventricules</b> le chassent.
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[13px]">
                <div className="rounded-2xl p-2" style={{ background: `${BLEU}26`, border: `1px solid ${BLEU}88` }}>
                  <b className="text-[#9FB8FF]">Cœur droit</b>
                  <p className="text-[#DDE2F7]">sang pauvre en dioxygène → poumons</p>
                </div>
                <div className="rounded-2xl p-2" style={{ background: `${ROUGE}26`, border: `1px solid ${ROUGE}88` }}>
                  <b className="text-[#FF9AA6]">Cœur gauche</b>
                  <p className="text-[#DDE2F7]">sang riche en dioxygène → tout le corps</p>
                </div>
              </div>
              <p className="mt-2 text-[13px] text-[#B9C1E3]">Les deux côtés ne se mélangent jamais : une paroi les sépare.</p>
            </Carte>
          )}

          {mode === 'suivre' && (
            <Carte couleur="rgba(255,77,109,.35)">
              <p className="labo-mono text-[11px] text-[#FF8A9C]">
                ÉTAPE {etape + 1} / {ETAPES.length}
              </p>
              <p className="labo-apparait mt-1 min-h-[66px] text-[15px] font-bold leading-snug text-white" key={etape}>
                {ETAPES[etape][2]}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full transition-all" style={{ width: `${((etape + 1) / ETAPES.length) * 100}%`, background: 'linear-gradient(90deg,#3D6FF0,#E8394A)' }} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Bouton variante="secondaire" onClick={() => setLecture((l) => !l)}>
                  {lecture ? <Pause size={17} /> : <Play size={17} />} {lecture ? 'Pause' : 'Lecture'}
                </Bouton>
                <Bouton couleur="#FF4D6D" onClick={etapeSuivante}>
                  <SkipForward size={17} /> Étape
                </Bouton>
              </div>
            </Carte>
          )}

          {mode === 'mission' && (
            <Carte couleur="rgba(255,77,109,.35)">
              {finMission ? (
                <div className="text-center">
                  <p className="labo-titre text-2xl font-black text-white">
                    {score} / {missions.length}
                  </p>
                  <p className="mt-1 text-[14px] text-[#DDE2F7]">{score === missions.length ? 'Parfait, tu connais le cœur par cœur !' : 'Encore une fois pour tout trouver ?'}</p>
                  <Bouton className="mt-3 w-full" couleur="#FF4D6D" onClick={() => changerMode('mission')}>
                    Rejouer
                  </Bouton>
                </div>
              ) : (
                <>
                  <p className="labo-mono text-[11px] text-[#FF8A9C]">
                    MISSION {nMission + 1} / {missions.length} · {score} PT
                  </p>
                  <p className="labo-titre mt-1 text-lg font-bold text-white">Touche {missions[nMission].texte}.</p>
                  {retour && !retour.bon && (
                    <p className="labo-apparait mt-1 text-[14px] text-[#FFB3BD]">
                      Non, ça c’est : <b>{NOMS[retour.groupe]}</b>. Essaie encore !
                    </p>
                  )}
                  <p className="mt-2 text-[12px] text-[#8A93B8]">Astuce : fais tourner le cœur. Le côté gauche de la personne est à ta droite.</p>
                </>
              )}
            </Carte>
          )}
        </div>
      </div>
    </PageCirc>
  )
}
