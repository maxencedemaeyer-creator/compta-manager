import { useState } from 'react'
import { Hourglass, Users } from 'lucide-react'
import { C, CarteR, Consigne, Onglets, PageRegles } from '../../../components/labo/regles/ui.jsx'

// =============================================================
//  R11 · Toute la vie — de la puberté à la ménopause.
//  - Frise : un curseur d'âge (0 à 70 ans) et ce qui se passe.
//  - Toutes différentes : 4 histoires inventées, comparées
//    (âge des premières règles, durée, cycle, abondance) + le
//    rappel que toutes les personnes n'ont pas leurs règles.
//  Repères : premières règles 9-16 ans ; ménopause vers 50 ans (45-55).
// =============================================================
const MAX_AGE = 70
const PHASES = [
  { id: 'enfance', de: 0, a: 8, nom: 'Avant la puberté', couleur: '#8DB9D9', texte: 'Pas de règles. Pourtant, dès la naissance, les ovaires contiennent déjà tous leurs ovules, tout petits et endormis.' },
  { id: 'puberte', de: 9, a: 16, nom: 'La puberté', couleur: '#F2B3C6', texte: 'Le corps change : on grandit vite, la poitrine se développe, les poils apparaissent. Les premières règles arrivent le plus souvent entre 9 et 16 ans. Chaque corps a son rythme.' },
  { id: 'cycles', de: 17, a: 44, nom: 'Les années de cycles', couleur: '#9BCBB0', texte: 'Un cycle revient environ chaque mois. Il peut s’interrompre, par exemple pendant une grossesse, et il peut varier d’une période de la vie à l’autre.' },
  { id: 'meno', de: 45, a: 54, nom: 'Vers la ménopause', couleur: '#F6C77E', texte: 'Les ovaires fabriquent moins d’hormones, les cycles deviennent irréguliers, puis les règles s’arrêtent. On parle de ménopause quand elles sont absentes depuis 12 mois. Elle arrive en général vers 50 ans, entre 45 et 55.' },
  { id: 'apres', de: 55, a: MAX_AGE, nom: 'Après la ménopause', couleur: '#C9B8E8', texte: 'Il n’y a plus de règles. Le corps continue de vivre, et d’être en bonne santé, sans cycle.' },
]
const phaseDe = (age) => PHASES.find((p) => age >= p.de && age <= p.a) || PHASES.at(-1)

export default function TouteLaVieView() {
  const [mode, setMode] = useState('frise')
  return (
    <PageRegles large>
      <Onglets
        valeur={mode}
        onChange={setMode}
        couleur="#6B55A0"
        options={[
          ['frise', Hourglass, 'La frise'],
          ['differentes', Users, 'Toutes différentes'],
        ]}
      />
      {mode === 'frise' ? <Frise /> : <Differentes />}
    </PageRegles>
  )
}

function Frise() {
  const [age, setAge] = useState(11)
  const p = phaseDe(age)
  const pct = (a) => (a / MAX_AGE) * 100
  return (
    <>
      <Consigne couleur="#6B55A0">Fais glisser le curseur de la naissance à 70 ans pour voir ce qui se passe, en général, à chaque âge.</Consigne>
      <CarteR>
        <div className="relative h-14 overflow-hidden rounded-2xl border-2" style={{ borderColor: C.bord }} aria-hidden="true">
          {PHASES.map((ph) => (
            <div key={ph.id} className="absolute top-0 h-full" style={{ left: `${pct(ph.de)}%`, width: `${pct(ph.a + 1) - pct(ph.de)}%`, background: ph.couleur }} />
          ))}
          <div className="absolute top-0 h-full w-1" style={{ left: `calc(${pct(age)}% - 2px)`, background: C.texte }} />
        </div>
        <div className="relative mt-1 flex justify-between text-[11px] font-bold" style={{ color: C.doux }}>
          {[0, 10, 20, 30, 40, 50, 60, 70].map((a) => <span key={a}>{a}</span>)}
        </div>
        <input type="range" min={0} max={MAX_AGE} value={age} onChange={(e) => setAge(+e.target.value)} aria-label="Âge, de 0 à 70 ans" className="regles-curseur mt-3" />
        <p className="mt-2 text-center text-[14px] font-bold" style={{ color: C.doux }}>{age} an{age > 1 ? 's' : ''}</p>
      </CarteR>
      <CarteR key={p.id} className="regles-apparait" couleur={p.couleur}>
        <h2 className="regles-titre text-[24px]" style={{ color: C.texte }}>{p.nom}</h2>
        <p className="mt-2 text-[15.5px] leading-relaxed" style={{ color: C.texte }}>{p.texte}</p>
      </CarteR>
    </>
  )
}

const HISTOIRES = [
  { nom: 'Inès', premieres: 10, duree: 4, cycle: 26, flux: 'moyen', texte: 'Premières règles très tôt, cycles courts.' },
  { nom: 'Lou', premieres: 15, duree: 3, cycle: 30, flux: 'léger', texte: 'Premières règles plus tard, règles courtes et légères.' },
  { nom: 'Sami', premieres: 13, duree: 7, cycle: 35, flux: 'abondant', texte: 'Règles longues et abondantes, cycles longs.' },
  { nom: 'Noa', premieres: 12, duree: 5, cycle: 28, flux: 'moyen', texte: 'Un cycle « type » de 28 jours… mais c’est juste une histoire parmi d’autres.' },
]
function Barre({ valeur, max, couleur, texte }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-3 flex-1 overflow-hidden rounded-full" style={{ background: C.bord }}>
        <div className="h-full rounded-full" style={{ width: `${(valeur / max) * 100}%`, background: couleur }} />
      </div>
      <span className="w-40 flex-none text-right text-[13px] font-bold" style={{ color: C.texte }}>{texte}</span>
    </div>
  )
}
function Differentes() {
  const flux = { léger: 1, moyen: 2, abondant: 3 }
  return (
    <>
      <Consigne couleur="#6B55A0">Quatre personnes inventées. Compare : l’âge des premières règles, leur durée, la longueur du cycle et l’abondance. <b>Aucune n’est « la bonne ».</b></Consigne>
      <div className="grid gap-3 md:grid-cols-2">
        {HISTOIRES.map((h) => (
          <CarteR key={h.nom}>
            <h2 className="regles-titre text-[20px]" style={{ color: C.texte }}>{h.nom}</h2>
            <p className="text-[13.5px]" style={{ color: C.doux }}>{h.texte}</p>
            <div className="mt-2 flex flex-col gap-1.5">
              <Barre valeur={h.premieres} max={16} couleur="#F2A3B8" texte={`1res règles : ${h.premieres} ans`} />
              <Barre valeur={h.duree} max={7} couleur="#D9647C" texte={`${h.duree} jours de règles`} />
              <Barre valeur={h.cycle} max={35} couleur="#8DB9D9" texte={`cycle : ${h.cycle} j`} />
              <Barre valeur={flux[h.flux]} max={3} couleur="#B9A6DA" texte={`flux ${h.flux}`} />
            </div>
          </CarteR>
        ))}
      </div>
      <CarteR couleur={C.sauge} fond={C.saugeClair}>
        <h3 className="regles-titre text-[18px]" style={{ color: C.texte }}>Toutes les personnes n’ont pas leurs règles</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px]" style={{ color: C.texte }}>
          <li>Certaines personnes n’en ont jamais, ou pas à certaines périodes de leur vie (grossesse, certains traitements, certaines maladies).</li>
          <li>Des personnes qui ne se sentent pas filles, comme des garçons transgenres ou des personnes non binaires, peuvent aussi avoir leurs règles.</li>
          <li>Pas de règles, ce n’est pas toujours un problème : si on se pose une question, on en parle à un médecin.</li>
        </ul>
      </CarteR>
    </>
  )
}
