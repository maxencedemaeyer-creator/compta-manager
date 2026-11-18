import { useState } from 'react'
import { ArrowRight, Check, Hammer, Languages, RotateCcw, X } from 'lucide-react'
import Banc, { useBanc } from '../../../components/labo/electricite/Banc.jsx'
import { COMPOSANTS, memesBranchements } from '../../../components/labo/electricite/circuit.js'
import { Bouton, Carte, Eclat, melanger } from '../../../components/labo/CadreJeu.jsx'
import { CircuitFige, Vignette } from '../../../components/labo/electricite/Banc.jsx'
import { AideSymboles, PageElec, comp, fil } from './commun.jsx'

// =============================================================
//  E4 · Le traducteur de schémas.
//  1) Quiz : photo d'un montage ↔ son schéma normalisé (et les symboles).
//  2) Construction : réaliser le montage à partir d'un schéma ;
//     la vérification compare les nœuds du circuit (même schéma).
//  Bouton « Symboles » (en haut à droite du montage à analyser) :
//  fenêtre de rappel photo → symbole de chaque objet.
//  Attendu 117.
// =============================================================
const VIOLET = '#C9A3FF'
const H = 330

// ---------- Fabriques de circuits (mêmes positions pour comparer) ----------
const pile = () => comp('p', 'pile', 180, 285)
function serie(t1, t2, o1 = {}, o2 = {}) {
  return {
    composants: [pile(), comp('x', t1, 86, 110, o1), comp('y', t2, 274, 110, o2)],
    fils: [fil('p:0', 'x:0'), fil('x:1', 'y:0'), fil('y:1', 'p:1')],
  }
}
function derivation(t1, t2) {
  return {
    composants: [pile(), comp('x', t1, 86, 110), comp('y', t2, 274, 110)],
    fils: [fil('p:0', 'x:0'), fil('x:1', 'p:1'), fil('p:0', 'y:0'), fil('y:1', 'p:1')],
  }
}
function seul(t) {
  return { composants: [pile(), comp('x', t, 180, 110)], fils: [fil('p:0', 'x:0'), fil('x:1', 'p:1')] }
}

const SERIES = [
  [serie('ampoule', 'interrupteur', {}, { ferme: true }), serie('ampoule', 'interrupteur'), serie('moteur', 'interrupteur', {}, { ferme: true })],
  [serie('ampoule', 'ampoule'), derivation('ampoule', 'ampoule'), serie('ampoule', 'moteur')],
  [seul('moteur'), seul('ampoule'), seul('sonnette')],
  [serie('del', 'interrupteur', {}, { ferme: true }), serie('ampoule', 'interrupteur', {}, { ferme: true }), serie('del', 'poussoir')],
  [serie('sonnette', 'poussoir'), serie('sonnette', 'interrupteur'), serie('moteur', 'poussoir')],
  [derivation('ampoule', 'moteur'), serie('ampoule', 'moteur'), derivation('ampoule', 'ampoule')],
]

const SYMBOLES = ['pile', 'ampoule', 'moteur', 'sonnette', 'del', 'interrupteur', 'poussoir']
const NOMS_SYMBOLES = {
  pile: 'Pile (générateur)',
  ampoule: 'Ampoule',
  moteur: 'Moteur',
  sonnette: 'Sonnette',
  del: 'Lampe LED',
  interrupteur: 'Interrupteur ouvert',
  poussoir: 'Bouton-poussoir',
}

function creerQuiz() {
  const circuits = SERIES.map((s) => {
    const sens = Math.random() < 0.6 ? 'photo' : 'schema'
    const ordre = melanger([0, 1, 2])
    return { type: 'circuit', sens, serie: s, ordre }
  })
  const symboles = melanger(SYMBOLES)
    .slice(0, 4)
    .map((t) => ({ type: 'symbole', cible: t, choix: melanger([t, ...melanger(SYMBOLES.filter((x) => x !== t)).slice(0, 3)]) }))
  return melanger([...circuits, ...symboles])
}

const Fige = ({ circuit, vue, hauteur = H, className = 'w-full' }) => <CircuitFige circuit={circuit} vue={vue} hauteur={hauteur} className={className} />

// ---------- Défis de construction ----------
const DEFIS = [
  { titre: 'Une ampoule et un interrupteur', modele: serie('ampoule', 'interrupteur', {}, { ferme: true }) },
  { titre: 'Deux ampoules en série', modele: serie('ampoule', 'ampoule') },
  { titre: 'Une ampoule et un moteur en dérivation', modele: derivation('ampoule', 'moteur') },
  {
    titre: 'Une lampe LED commandée par un bouton-poussoir',
    modele: serie('del', 'poussoir'),
  },
  {
    titre: 'Deux branches, un interrupteur',
    modele: {
      composants: [pile(), comp('x', 'ampoule', 70, 110), comp('y', 'ampoule', 180, 110), comp('z', 'interrupteur', 290, 110, { ferme: true })],
      fils: [fil('p:0', 'x:0'), fil('x:1', 'p:1'), fil('p:0', 'y:0'), fil('y:1', 'z:0'), fil('z:1', 'p:1')],
    },
  },
]

function Construction() {
  const [n, setN] = useState(0)
  const d = DEFIS[n]
  const depart = d.modele.composants.map((c) => ({ ...c, fixe: true, ferme: c.type === 'interrupteur' ? false : c.ferme }))
  const banc = useBanc({ composants: depart, fils: [] })
  const [eclat, setEclat] = useState({ message: '', cle: 0 })
  const [verif, setVerif] = useState(null)

  function aller(i) {
    setN(i)
    setVerif(null)
    banc.charger(
      DEFIS[i].modele.composants.map((c) => ({ ...c, fixe: true, ferme: c.type === 'interrupteur' ? false : c.ferme })),
      [],
    )
  }
  function verifier() {
    const ok = memesBranchements(banc.composants, banc.fils, d.modele.fils)
    setVerif(ok)
    if (ok) setEclat((e) => ({ message: 'Montage conforme !', cle: e.cle + 1 }))
  }

  return (
    <>
      <Eclat message={eclat.message} cle={eclat.cle} couleur={VIOLET} />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 tab:min-h-0 tab:flex-1">
        <Carte couleur={`${VIOLET}66`} className="relative tab:flex tab:min-h-0 tab:flex-col">
          <AideSymboles couleur={VIOLET} className="absolute right-3 top-3 z-10" />
          <p className="labo-mono pr-28 text-[11px]" style={{ color: VIOLET }}>
            SCHÉMA {n + 1}/{DEFIS.length} · {d.titre.toUpperCase()}
          </p>
          <div className="mt-2 flex justify-center tab:min-h-0 tab:flex-1">
            <Fige circuit={d.modele} vue="schema" className="w-full tab:h-[calc(100dvh-93px)] tab:w-auto tab:max-w-full" />
          </div>
        </Carte>
        <div className="flex min-w-0 flex-col gap-2 tab:min-h-0">
          <div className="flex justify-center tab:min-h-0 tab:flex-1">
            <Banc banc={banc} vue="photo" editable={false} cablage hauteur={H} className="w-full tab:h-[calc(100dvh-93px)] tab:w-auto tab:max-w-full" />
          </div>
          {verif === false && (
            <p className="rounded-xl bg-[#FF8A95]/10 px-3 py-2 text-[13px] text-[#FFC2C8]">
              Pas encore : compare chaque fil du schéma avec ton montage. Chaque trait du schéma est un fil qui relie deux bornes.
            </p>
          )}
          {verif ? (
            <Bouton couleur={VIOLET} onClick={() => aller((n + 1) % DEFIS.length)}>
              {n + 1 < DEFIS.length ? 'Schéma suivant' : 'Recommencer'} <ArrowRight size={18} />
            </Bouton>
          ) : (
            <Bouton couleur={VIOLET} onClick={verifier}>
              <Check size={18} /> Vérifier mon montage
            </Bouton>
          )}
        </div>
      </div>
    </>
  )
}

// ---------- Quiz ----------
function Quiz() {
  const [questions, setQuestions] = useState(creerQuiz)
  const [n, setN] = useState(0)
  const [rep, setRep] = useState(null)
  const [score, setScore] = useState(0)
  const q = questions[n]

  if (!q)
    return (
      <Carte couleur={`${VIOLET}88`} className="text-center">
        <p className="labo-titre text-3xl font-black text-white">
          {score}/{questions.length}
        </p>
        <p className="mt-1 text-[15px] text-[#B9C1E3]">{score >= 8 ? 'Tu parles couramment le langage des schémas !' : 'Revois les symboles et retente ta chance.'}</p>
        <Bouton
          className="mx-auto mt-4"
          couleur={VIOLET}
          onClick={() => {
            setQuestions(creerQuiz())
            setN(0)
            setScore(0)
            setRep(null)
          }}
        >
          <RotateCcw size={18} /> Rejouer
        </Bouton>
      </Carte>
    )

  const repondre = (i, bon) => {
    if (rep !== null) return
    setRep(i)
    if (bon) setScore((s) => s + 1)
  }
  const suivant = () => {
    setRep(null)
    setN(n + 1)
  }

  const progression = (
    <div className="flex items-center justify-between text-[12px] text-[#8A93B8]">
      <span className="labo-mono">
        QUESTION {n + 1}/{questions.length}
      </span>
      <span className="labo-mono" style={{ color: VIOLET }}>
        {score} pt
      </span>
    </div>
  )

  if (q.type === 'symbole') {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
        {progression}
        <Carte couleur={`${VIOLET}66`} className="text-center">
          <p className="text-[14px] text-[#B9C1E3]">Quel composant représente ce symbole ?</p>
          <div className="mx-auto mt-2 w-40 rounded-2xl bg-[#F7F5EE] p-2">
            <Vignette type={q.cible} vue="schema" taille={140} />
          </div>
        </Carte>
        <div className="grid grid-cols-2 gap-2">
          {q.choix.map((t) => {
            const bon = t === q.cible
            return (
              <button
                key={t}
                type="button"
                onClick={() => repondre(t, bon)}
                className="min-h-[56px] rounded-2xl border-2 px-2 text-[14px] font-bold text-white"
                style={{ borderColor: rep !== null && bon ? '#9DFF8A' : rep === t ? '#FF8A95' : `${VIOLET}55`, background: 'rgba(18,26,48,.9)' }}
              >
                {NOMS_SYMBOLES[t]}
              </button>
            )
          })}
        </div>
        {rep !== null && (
          <Bouton couleur={VIOLET} onClick={suivant}>
            Suivant <ArrowRight size={18} />
          </Bouton>
        )}
      </div>
    )
  }

  const autre = q.sens === 'photo' ? 'schema' : 'photo'
  return (
    <div className="grid grid-cols-1 gap-3 tab:min-h-0 tab:flex-1 tab:grid-cols-[minmax(0,.9fr)_minmax(0,1.6fr)]">
    <div className="flex flex-col gap-3 tab:min-h-0">
      {progression}
      <Carte couleur={`${VIOLET}66`} className="relative">
        <AideSymboles couleur={VIOLET} className="absolute right-3 top-3 z-10" />
        <p className="mb-2 pr-28 text-[14px] text-[#B9C1E3]">{q.sens === 'photo' ? 'Quel est son schéma ?' : 'Quel montage lui correspond ?'}</p>
        <div className="mx-auto max-w-[420px]">
          <Fige circuit={q.serie[0]} vue={q.sens} />
        </div>
      </Carte>
    </div>
    <div className="flex flex-col gap-3 tab:min-h-0 tab:overflow-y-auto">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {q.ordre.map((k, i) => {
          const bon = k === 0
          return (
            <button
              key={k}
              type="button"
              onClick={() => repondre(k, bon)}
              className="relative rounded-[24px] border-[3px] p-1 text-left"
              style={{ borderColor: rep !== null && bon ? '#9DFF8A' : rep === k ? '#FF8A95' : 'rgba(255,255,255,.12)' }}
            >
              <span className="labo-mono absolute left-3 top-2 z-10 rounded-full bg-[#0B1122] px-2 text-[12px] font-bold" style={{ color: VIOLET }}>
                {'ABC'[i]}
              </span>
              {rep !== null && (bon || rep === k) && (
                <span className="absolute right-3 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full" style={{ background: bon ? '#9DFF8A' : '#FF8A95', color: '#0B1122' }}>
                  {bon ? <Check size={16} strokeWidth={3} /> : <X size={16} strokeWidth={3} />}
                </span>
              )}
              <div className="pointer-events-none">
                <Fige circuit={q.serie[k]} vue={autre} />
              </div>
            </button>
          )
        })}
      </div>
      {rep !== null && (
        <>
          <p className="rounded-xl bg-white/5 px-3 py-2 text-[13px] leading-snug text-[#DDE2F7]">
            Sur un schéma, chaque composant a son symbole, les fils sont des traits droits et le circuit est dessiné bien fermé.{' '}
            {q.serie[0].composants
              .filter((c) => c.type !== 'pile')
              .map((c) => `${COMPOSANTS[c.type].nom}${c.type === 'interrupteur' ? (c.ferme ? ' (fermé)' : ' (ouvert)') : ''}`)
              .join(' + ')}
            .
          </p>
          <Bouton couleur={VIOLET} onClick={suivant}>
            Suivant <ArrowRight size={18} />
          </Bouton>
        </>
      )}
    </div>
    </div>
  )
}

export default function SchemasView() {
  const [mode, setMode] = useState('quiz')
  return (
    <PageElec code="E4" titre="Le traducteur de schémas" attendus={[117]} couleur={VIOLET} large>
      <div className="flex rounded-2xl border border-white/15 bg-[#0B1122]/90 p-1">
        {[
          ['quiz', Languages, 'Traduire'],
          ['construire', Hammer, 'Construire'],
        ].map(([m, Icone, nom]) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className="flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl px-2 text-[13px] font-bold"
            style={mode === m ? { background: VIOLET, color: '#170B2A' } : { color: '#B9C1E3' }}
          >
            <Icone size={15} /> {nom}
          </button>
        ))}
      </div>
      {mode === 'quiz' ? <Quiz /> : <Construction />}
    </PageElec>
  )
}
