import { useEffect, useMemo, useRef, useState } from 'react'
import { Brain, Check, Footprints, Gauge, Hand, Pause, Play, RotateCcw, Stamp, Video } from 'lucide-react'
import { Bouton, Carte, Eclat } from '../../../components/labo/CadreJeu.jsx'
import Circulation3D from '../../../components/labo/circulation/Circulation3D.jsx'
import { TRAJETS, construireChemin, longueurs, pointSur } from '../../../components/labo/circulation/modele.js'
import { Consigne, PageCirc } from './commun.jsx'

// =============================================================
//  C2 · Le grand voyage
//  Une goutte de sang part du ventricule gauche et voyage dans les
//  VRAIS vaisseaux du modèle 3D (lignes centrales calculées dans
//  l'aorte, les artères, les veines…) jusqu'à l'organe choisi, puis
//  revient au cœur, passe par les poumons et rentre au ventricule gauche.
//  Rouge = riche en dioxygène, bleu = pauvre. Ce qu'elle transporte
//  change en route (dioxygène, nutriments, dioxyde de carbone).
//  Carnet de voyage à compléter + 3 questions au retour.
//  Attendus 66, 67, 69.
// =============================================================
const DESTINATIONS = [
  { id: 'cerveau', nom: 'Le cerveau', icone: Brain, organe: 'cerveau', cadre: 'tete' },
  { id: 'bras', nom: 'La main', icone: Hand, organe: 'main' },
  { id: 'jambe', nom: 'Le pied', icone: Footprints, organe: 'pied' },
  { id: 'intestin', nom: 'L’intestin', icone: IconeIntestin, organe: 'intestin' },
  { id: 'rein', nom: 'Le rein', icone: IconeRein, organe: 'rein_g' },
]

function IconeIntestin({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M5 5h14v4H6v4h12v4H5" />
    </svg>
  )
}
function IconeRein({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M15 3c-4 0-8 3-8 9s4 9 8 9c3 0 4-3 2-6-1-2-1-4 0-6 2-3 1-6-2-6z" />
    </svg>
  )
}

// Ce que dit chaque étape du trajet
const LEGENDES = {
  ventricule_g: ['Ventricule gauche', 'Le cœur se contracte et chasse le sang riche en dioxygène.'],
  aorte_ascendante: ['Aorte', 'La plus grosse artère : elle part du cœur.'],
  crosse_aorte: ['Crosse de l’aorte', 'L’aorte fait un virage au-dessus du cœur.'],
  aorte_descendante: ['Aorte', 'Elle descend le long de la colonne vertébrale.'],
  carotide_commune: ['Artère carotide', 'Elle monte dans le cou.'],
  carotide_interne: ['Artère carotide', 'Elle entre dans le crâne.'],
  cerveau: ['Le cerveau', 'Échanges ! Le sang dépose dioxygène et nutriments, il emporte le dioxyde de carbone.'],
  jugulaire_interne: ['Veine jugulaire', 'Le sang, devenu pauvre en dioxygène, redescend vers le cœur.'],
  brachiocephalique_v: ['Veine brachiocéphalique', 'Les veines de la tête et du bras se rejoignent.'],
  veine_cave_sup: ['Veine cave supérieure', 'Elle ramène le sang du haut du corps au cœur.'],
  sous_claviere_a: ['Artère sous-clavière', 'Elle passe sous la clavicule.'],
  axillaire_a: ['Artère axillaire', 'Sous l’aisselle.'],
  humerale_a: ['Artère humérale', 'Elle longe l’humérus.'],
  radiale_a: ['Artère radiale', 'C’est elle qu’on sent battre au poignet !'],
  main: ['La main', 'Échanges ! Dioxygène et nutriments pour les muscles et la peau de la main.'],
  radiale_v: ['Veine radiale', 'Retour vers le cœur.'],
  humerale_v: ['Veine humérale', 'Elle remonte le bras.'],
  axillaire_v: ['Veine axillaire', 'Sous l’aisselle.'],
  sous_claviere_v: ['Veine sous-clavière', 'Sous la clavicule.'],
  iliaque_commune_a: ['Artère iliaque', 'L’aorte se divise en deux : une branche par jambe.'],
  iliaque_externe_a: ['Artère iliaque', 'Vers la cuisse.'],
  femorale_a: ['Artère fémorale', 'Elle descend dans la cuisse.'],
  poplitee_a: ['Artère poplitée', 'Derrière le genou.'],
  tibiale_a: ['Artère tibiale', 'Le long du tibia, jusqu’au pied.'],
  pied: ['Le pied', 'Échanges ! Les muscles reçoivent dioxygène et nutriments, le sang emporte le dioxyde de carbone.'],
  tibiale_v: ['Veine tibiale', 'Le sang remonte : des valvules l’empêchent de redescendre.'],
  poplitee_v: ['Veine poplitée', 'Derrière le genou.'],
  femorale_v: ['Veine fémorale', 'Elle remonte la cuisse.'],
  iliaque_externe_v: ['Veine iliaque', 'Dans le bassin.'],
  iliaque_commune_v: ['Veine iliaque', 'Les veines des deux jambes se rejoignent.'],
  veine_cave_inf_bas: ['Veine cave inférieure', 'La plus grosse veine du corps.'],
  veine_cave_inf_haut: ['Veine cave inférieure', 'Elle remonte vers le cœur.'],
  mesenterique_a: ['Artère de l’intestin', 'Elle part de l’aorte vers l’intestin grêle.'],
  intestin: ['L’intestin grêle', 'Échanges ! Le sang dépose du dioxygène… et se charge en NUTRIMENTS absorbés par l’intestin.'],
  mesenterique_v: ['Veine de l’intestin', 'Elle emporte les nutriments.'],
  porte: ['Veine porte', 'Les nutriments passent d’abord par le foie.'],
  foie: ['Le foie', 'Il trie et stocke une partie des nutriments.'],
  hepatique_v: ['Veine du foie', 'Vers la veine cave inférieure.'],
  renale_a: ['Artère rénale', 'Vers le rein.'],
  rein_g: ['Le rein', 'Échanges ! Le rein filtre le sang et retire certains déchets (ils partiront dans l’urine).'],
  renale_v: ['Veine rénale', 'Le sang nettoyé repart vers le cœur.'],
  oreillette_d: ['Oreillette droite', 'Le sang pauvre en dioxygène revient au cœur…'],
  ventricule_d: ['Ventricule droit', '… qui l’envoie vers les poumons.'],
  tronc_pulmonaire: ['Artère pulmonaire', 'Direction les poumons.'],
  artere_pulmonaire_g: ['Artère pulmonaire', 'Elle entre dans le poumon.'],
  poumon_g: ['Les poumons', 'Échanges ! Le sang rejette le dioxyde de carbone (tu l’expires) et se recharge en dioxygène.'],
  veine_pulmonaire_g: ['Veine pulmonaire', 'Le sang riche en dioxygène revient au cœur.'],
  oreillette_g: ['Oreillette gauche', 'Presque arrivé…'],
}

// Chargement transporté selon l'étape : O2 = dioxygène, CO2 = dioxyde de carbone, N = nutriments
function chargement(nom, avant, dest) {
  const c = { ...avant }
  if (nom === 'poumon_g') return { o2: true, co2: false, n: c.n }
  if (['cerveau', 'main', 'pied', 'rein_g'].includes(nom)) return { o2: false, co2: true, n: dest === 'rein' ? c.n : false }
  if (nom === 'intestin') return { o2: false, co2: true, n: true }
  if (nom === 'foie') return { ...c, n: true }
  return c
}

const QUESTIONS = [
  { q: 'Pour aller du cœur vers l’organe, la goutte a voyagé dans…', choix: ['des artères', 'des veines'], bonne: 0, expl: 'Les artères partent du cœur.' },
  { q: 'Pour revenir de l’organe vers le cœur, elle a voyagé dans…', choix: ['des artères', 'des veines'], bonne: 1, expl: 'Les veines reviennent au cœur.' },
  { q: 'Où s’est-elle rechargée en dioxygène ?', choix: ['Dans le cœur', 'Dans les poumons', 'Dans l’intestin'], bonne: 1, expl: 'Dans les poumons, au contact de l’air des alvéoles.' },
]

// La caméra suit la goutte : région du corps de chaque étape
const REGIONS = {
  tete: ['carotide_interne', 'cerveau', 'jugulaire_interne'],
  bras: ['axillaire_a', 'humerale_a', 'radiale_a', 'main', 'radiale_v', 'humerale_v', 'axillaire_v'],
  jambe: ['femorale_a', 'poplitee_a', 'tibiale_a', 'pied', 'tibiale_v', 'poplitee_v', 'femorale_v'],
  ventre: ['mesenterique_a', 'intestin', 'mesenterique_v', 'porte', 'foie', 'hepatique_v', 'renale_a', 'rein_g', 'renale_v'],
  thorax: ['ventricule_g', 'aorte_ascendante', 'crosse_aorte', 'oreillette_d', 'ventricule_d', 'tronc_pulmonaire', 'artere_pulmonaire_g', 'poumon_g', 'veine_pulmonaire_g', 'oreillette_g'],
}
const regionDe = (nom) => Object.entries(REGIONS).find(([, l]) => l.includes(nom))?.[0] || 'corps'

// Vitesse du film : volontairement lente, pour avoir le temps de lire chaque étape
// (en vrai, le sang va jusqu'à ~0,4 m/s dans l'aorte). Trois allures au choix.
const VITESSE = 0.13 // mètres de modèle par seconde
const ALLURES = [
  { nom: 'Lent', k: 0.6 },
  { nom: 'Normal', k: 1 },
  { nom: 'Rapide', k: 2 },
]
// Temps d'arrêt à chaque nouvelle étape : proportionnel à la longueur du texte à lire
const pauseEtape = (nom) => Math.min(3.6, 0.9 + (LEGENDES[nom]?.[1]?.length || 20) / 34)

export default function VoyageView() {
  const [outils, setOutils] = useState(null)
  const [dest, setDest] = useState(null)
  const [phase, setPhase] = useState('choix') // choix | voyage | questions | fin
  const [lecture, setLecture] = useState(true)
  const [suivre, setSuivre] = useState(true)
  const [allure, setAllure] = useState(1)
  const [repere, setRepere] = useState(null)
  const [charge, setCharge] = useState({ o2: true, co2: false, n: false })
  const [distance, setDistance] = useState(0)
  const [nq, setNq] = useState(0)
  const [reponse, setReponse] = useState(null)
  const [carnet, setCarnet] = useState([])
  const [eclat, setEclat] = useState({ message: '', cle: 0 })
  const anim = useRef({ d: 0, pause: 0, dernier: 0, iRep: -1, trace: 0 })
  const lectureRef = useRef(lecture)
  lectureRef.current = lecture
  const allureRef = useRef(allure)
  allureRef.current = allure

  const chemin = useMemo(() => {
    if (!outils || !dest) return null
    const etapes = [...TRAJETS.aorte, ...TRAJETS[dest], ...TRAJETS.poumons]
    const { points, reperes } = construireChemin(outils.modele, etapes)
    const cumul = longueurs(points)
    return { points, cumul, reperes, total: cumul[cumul.length - 1] }
  }, [outils, dest])

  useEffect(() => {
    if (!outils || !chemin || phase !== 'voyage') return
    let raf
    const a = anim.current
    Object.assign(a, { d: 0, pause: 0, dernier: 0, iRep: -1, trace: 0 })
    let ch = { o2: true, co2: false, n: false }
    setCharge(ch)
    const boucle = (t) => {
      raf = requestAnimationFrame(boucle)
      const dt = a.dernier ? Math.min(0.05, (t - a.dernier) / 1000) : 0
      a.dernier = t
      if (lectureRef.current) {
        const k = ALLURES[allureRef.current].k
        if (a.pause > 0) a.pause -= dt * k
        else a.d += dt * VITESSE * k
      }
      const u = a.d / chemin.total
      const p = pointSur(chemin.points, chemin.cumul, u)
      // Repère courant
      let i = a.iRep
      while (i + 1 < chemin.reperes.length && chemin.cumul[chemin.reperes[i + 1].index] <= a.d) {
        i++
        const nom = chemin.reperes[i].nom
        ch = chargement(nom, ch, dest)
        setCharge(ch)
        setRepere(nom)
        a.pause = ['cerveau', 'main', 'pied', 'intestin', 'rein_g', 'poumon_g'].includes(nom) ? Math.max(3.4, pauseEtape(nom)) : pauseEtape(nom)
      }
      a.iRep = i
      outils.goutte('sang', p.toArray(), ch.o2 ? '#FF4D5E' : '#5B8CFF', 0.026)
      if (t - a.trace > 120) {
        a.trace = t
        const k = chemin.cumul.findIndex((c) => c > a.d)
        outils.trace('sang', [...chemin.points.slice(0, k < 0 ? chemin.points.length : k), p], '#FFFFFF')
        setDistance(a.d)
      }
      if (a.d >= chemin.total) {
        cancelAnimationFrame(raf)
        setDistance(chemin.total)
        setTimeout(() => setPhase('questions'), 600)
      }
    }
    raf = requestAnimationFrame(boucle)
    return () => cancelAnimationFrame(raf)
  }, [outils, chemin, phase, dest])

  function partir(id) {
    setDest(id)
    setRepere('ventricule_g')
    setNq(0)
    setReponse(null)
    setLecture(true)
    setPhase('voyage')
  }

  function repondre(i) {
    if (reponse !== null) return
    setReponse(i)
    if (i === QUESTIONS[nq].bonne) setEclat((x) => ({ message: 'Exact !', cle: x.cle + 1 }))
  }

  function questionSuivante() {
    if (nq + 1 < QUESTIONS.length) {
      setNq(nq + 1)
      setReponse(null)
      return
    }
    setCarnet((c) => (c.includes(dest) ? c : [...c, dest]))
    setPhase('fin')
    setEclat((x) => ({ message: 'Tampon gagné !', cle: x.cle + 1 }))
  }

  function recommencer() {
    outils?.goutte('sang', null)
    outils?.trace('sang', null)
    setPhase('choix')
    setDest(null)
    setRepere(null)
  }

  const d = DESTINATIONS.find((x) => x.id === dest)
  const leg = repere && LEGENDES[repere]
  const echange = ['cerveau', 'main', 'pied', 'intestin', 'rein_g', 'poumon_g'].includes(repere)

  return (
    <PageCirc code="C2" titre="Le grand voyage" attendus={[66, 67, 69]} large>
      <Eclat message={eclat.message} cle={eclat.cle} couleur="#FF8A5C" />
      <div className="grid gap-3 lg:grid-cols-[1fr_360px]">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#070B16]/80">
          <Circulation3D
            className="h-[64vh] min-h-[420px] max-h-[720px] w-full"
            rotation
            afficher={['coeur', 'artere', 'veine', 'organe', 'os']}
            opacites={{ os: 0.1 }}
            etats={{ arteres_tete: 'attenue', veines_tronc: 'attenue', arteres_tronc: 'attenue', arteres_digestives: 'attenue', veines_digestives: 'attenue' }}
            battement={phase === 'voyage' ? 70 : 60}
            cadrage={phase === 'voyage' && suivre && repere ? regionDe(repere) : 'corps'}
            onPret={setOutils}
          />
          {phase === 'voyage' && (
            <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1">
              <span className="labo-mono rounded-lg bg-black/60 px-2 py-1 text-[11px] text-[#FFD2B8]">DISTANCE : {(distance * 100).toFixed(0)} cm</span>
              <span className="flex max-w-[280px] flex-wrap gap-1">
                <Pastille actif={charge.o2} couleur="#FF4D5E" texte="Dioxygène" />
                <Pastille actif={charge.co2} couleur="#A9B4CC" texte="Dioxyde de carbone" />
                <Pastille actif={charge.n} couleur="#FFD27A" texte="Nutriments" />
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {phase === 'choix' && (
            <>
              <Consigne couleur="#FF8A5C">
                Tu es une goutte de sang dans le <b>ventricule gauche</b>. Choisis ta destination : tu voyageras dans les vrais vaisseaux d’un corps humain, puis tu reviendras au cœur.
              </Consigne>
              <div className="grid grid-cols-2 gap-2">
                {DESTINATIONS.map((x) => (
                  <button
                    key={x.id}
                    type="button"
                    onClick={() => partir(x.id)}
                    disabled={!outils}
                    className="flex min-h-[64px] items-center gap-2 rounded-2xl border border-[#FF8A5C]/50 bg-[#121A30]/90 px-3 text-left text-[14px] font-bold text-white active:scale-[.97] disabled:opacity-40"
                  >
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[#FF8A5C]/20 text-[#FF8A5C]">
                      <x.icone size={19} />
                    </span>
                    {x.nom}
                    {carnet.includes(x.id) && <Check size={16} className="ml-auto text-[#9DFF8A]" />}
                  </button>
                ))}
              </div>
            </>
          )}

          {phase === 'voyage' && leg && (
            <Carte couleur={echange ? '#FFD27A' : 'rgba(255,138,92,.45)'}>
              <p className="labo-mono text-[11px] text-[#FF8A5C]">EN ROUTE VERS : {d?.nom.toUpperCase()}</p>
              <p className="labo-titre labo-apparait mt-1 text-xl font-bold text-white" key={repere}>
                {leg[0]}
              </p>
              <p className="mt-1 min-h-[60px] text-[15px] leading-snug text-[#DDE2F7]">{leg[1]}</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <Bouton variante="secondaire" className="!px-2 !text-[14px]" onClick={() => setLecture((l) => !l)}>
                  {lecture ? <Pause size={17} /> : <Play size={17} />} {lecture ? 'Pause' : 'Reprendre'}
                </Bouton>
                <Bouton variante="secondaire" className="!px-2 !text-[14px]" onClick={() => setAllure((x) => (x + 1) % ALLURES.length)}>
                  <Gauge size={17} /> {ALLURES[allure].nom}
                </Bouton>
                <Bouton variante="secondaire" className="!px-2 !text-[14px]" onClick={() => setSuivre((x) => !x)}>
                  <Video size={17} /> {suivre ? 'Caméra' : 'Fixe'}
                </Bouton>
              </div>
            </Carte>
          )}

          {phase === 'questions' && (
            <Carte couleur="rgba(255,138,92,.45)">
              <p className="labo-mono text-[11px] text-[#FF8A5C]">
                RETOUR AU CŒUR · {(chemin.total * 100).toFixed(0)} CM PARCOURUS · QUESTION {nq + 1}/{QUESTIONS.length}
              </p>
              <p className="labo-titre mt-1 text-lg font-bold text-white">{QUESTIONS[nq].q}</p>
              <div className="mt-2 flex flex-col gap-2">
                {QUESTIONS[nq].choix.map((c, i) => {
                  const st = reponse === null ? {} : i === QUESTIONS[nq].bonne ? { background: '#9DFF8A', color: '#06210A' } : i === reponse ? { background: '#FF6B7A', color: '#2A0509' } : { opacity: 0.5 }
                  return (
                    <button key={c} type="button" onClick={() => repondre(i)} className="h-12 rounded-2xl border border-white/15 bg-[#0B1122] text-[15px] font-bold" style={st}>
                      {c}
                    </button>
                  )
                })}
              </div>
              {reponse !== null && (
                <>
                  <p className="labo-apparait mt-2 text-[14px] text-[#DDE2F7]">{QUESTIONS[nq].expl}</p>
                  <Bouton className="mt-2 w-full" couleur="#FF8A5C" onClick={questionSuivante}>
                    Suite
                  </Bouton>
                </>
              )}
            </Carte>
          )}

          {phase === 'fin' && (
            <Carte couleur="rgba(255,138,92,.45)">
              <p className="labo-titre text-lg font-bold text-white">Voyage terminé : {d?.nom.toLowerCase()} !</p>
              <p className="mt-1 text-[14px] leading-snug text-[#DDE2F7]">
                Ta goutte a parcouru <b>{(chemin.total * 100).toFixed(0)} cm</b> : du cœur à l’organe par les <b className="text-[#FF8A9C]">artères</b>, retour par les <b className="text-[#9FB8FF]">veines</b>, puis un détour par les poumons. En vrai, ce tour complet prend environ <b>une minute</b> au repos… et bien moins pendant un effort !
              </p>
              <Bouton className="mt-3 w-full" couleur="#FF8A5C" onClick={recommencer}>
                <RotateCcw size={17} /> Nouveau voyage
              </Bouton>
            </Carte>
          )}

          <Carte couleur="rgba(255,255,255,.12)">
            <p className="labo-mono flex items-center gap-1.5 text-[11px] text-[#FFD27A]">
              <Stamp size={13} /> CARNET DE VOYAGE · {carnet.length}/{DESTINATIONS.length}
            </p>
            <div className="mt-2 flex gap-2">
              {DESTINATIONS.map((x) => (
                <span
                  key={x.id}
                  title={x.nom}
                  className="flex h-11 flex-1 items-center justify-center rounded-xl border"
                  style={carnet.includes(x.id) ? { borderColor: '#FFD27A', background: 'rgba(255,210,122,.15)', color: '#FFD27A' } : { borderColor: 'rgba(255,255,255,.12)', color: '#4A5375', borderStyle: 'dashed' }}
                >
                  <x.icone size={20} />
                </span>
              ))}
            </div>
            {carnet.length === DESTINATIONS.length && <p className="mt-2 text-[13px] text-[#FFD27A]">Carnet complet : tu as visité tout le corps !</p>}
          </Carte>
        </div>
      </div>
    </PageCirc>
  )
}

function Pastille({ actif, couleur, texte }) {
  return (
    <span className="whitespace-nowrap rounded-lg px-1.5 py-0.5 text-[10px] font-bold transition" style={actif ? { background: couleur, color: '#0A0E1A' } : { background: 'rgba(0,0,0,.55)', color: '#5B6485', textDecoration: 'line-through' }}>
      {texte}
    </span>
  )
}
