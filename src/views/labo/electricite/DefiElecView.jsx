import { melanger } from '../../../components/labo/CadreJeu.jsx'
import DefiEclair from '../../../components/labo/defi/DefiEclair.jsx'
import { CircuitFige, Vignette } from '../../../components/labo/electricite/Banc.jsx'
import { fonctionne, resoudre } from '../../../components/labo/electricite/circuit.js'
import { OBJETS } from '../../../components/labo/electricite/objets.jsx'
import { JAUNE, PageElec, comp, fil } from './commun.jsx'

// =============================================================
//  E8 · Défi — le grand test de l'électricité (60 s).
//  « Ça marche ? » sur des circuits tirés au hasard (la réponse
//  est calculée par le moteur du circuit), symboles, vrai/faux.
//  Chaque question est liée à une activité (act) → bilan final.
//  Records du jour / de tous les temps (Firebase, laboDefiElec).
//  Moteur : components/labo/defi/DefiEclair.jsx. Attendu 114.
// =============================================================
const H = 315

// [activité, affirmation, vrai ?]
const AFFIRMATIONS = [
  ['banc', 'La pile est un générateur.', true],
  ['banc', 'L’ampoule est un générateur.', false],
  ['banc', 'Le moteur et la sonnette sont des récepteurs.', true],
  ['banc', 'En série, si une ampoule grille, les autres s’éteignent.', true],
  ['maison', 'En dérivation, si une ampoule grille, les autres s’éteignent.', false],
  ['maison', 'Un interrupteur peut éteindre une seule pièce de la maison.', true],
  ['testeur', 'Le métal est un conducteur.', true],
  ['testeur', 'Le plastique est un conducteur.', false],
  ['testeur', 'Le bois sec est un isolant.', true],
  ['testeur', 'La mine de crayon conduit le courant.', true],
  ['interrupteur', 'Dans un circuit ouvert, le courant circule.', false],
  ['interrupteur', 'Un interrupteur fermé laisse passer le courant.', true],
  ['interrupteur', 'Un circuit doit être fermé pour fonctionner.', true],
  ['depanneur', 'Une lampe LED s’allume dans les deux sens.', false],
  ['depanneur', 'Une pile usée peut empêcher l’ampoule de briller.', true],
  ['danger', 'Relier les deux bornes d’une pile par un fil, c’est un court-circuit.', true],
  ['danger', 'La prise du mur (230 V) est sans danger.', false],
  ['danger', 'On ne touche jamais une prise avec les mains mouillées.', true],
  ['ampoule', 'Dans l’ampoule, c’est le filament qui brille.', true],
  ['ampoule', 'Avec une pile trop forte, le filament peut griller.', true],
]
const SYMBOLES = { pile: 'Pile', ampoule: 'Ampoule', moteur: 'Moteur', sonnette: 'Sonnette', del: 'Lampe LED', interrupteur: 'Interrupteur', poussoir: 'Bouton-poussoir' }
const QUESTION_RECEPTEUR = { ampoule: 'L’ampoule s’allume-t-elle ?', moteur: 'Le moteur tourne-t-il ?', del: 'La lampe LED s’allume-t-elle ?', sonnette: 'La sonnette sonne-t-elle ?' }
const hasard = (l) => l[Math.floor(Math.random() * l.length)]

function circuitAuHasard() {
  const type = hasard(['ampoule', 'ampoule', 'moteur', 'del', 'sonnette'])
  const composants = [comp('p', 'pile', 180, 255), comp('x', type, 86, 95)]
  const second = hasard(['interrupteur', 'interrupteur', 'objet', 'ampoule', 'aucun'])
  let fils
  if (second === 'aucun') fils = [fil('p:0', 'x:0'), fil('x:1', 'p:1')]
  else {
    const o = second === 'objet' ? hasard(OBJETS) : null
    composants.push(comp('y', second, 274, 95, second === 'interrupteur' ? { ferme: Math.random() < 0.5 } : o ? { objet: o.id, materiau: o.materiau } : {}))
    fils = [fil('p:0', 'x:0'), fil('x:1', 'y:0'), fil('y:1', 'p:1')]
  }
  const t = Math.random()
  if (t < 0.22) fils.splice(Math.floor(Math.random() * fils.length), 1) // un fil manque
  else if (t < 0.3) fils.push(fil('p:0', 'p:1')) // court-circuit
  if (type === 'del' && Math.random() < 0.5) fils = fils.map((f) => ({ ...f, a: f.a.replace(/^x:(\d)$/, (m, b) => `x:${1 - b}`), b: f.b.replace(/^x:(\d)$/, (m, b) => `x:${1 - b}`) }))
  const circuit = { composants, fils }
  const marche = fonctionne(resoudre(composants, fils), 'x')
  // activité liée : un objet à tester → Testeur ; un interrupteur → Interrupteur ;
  // une panne (fil manquant, court-circuit, lampe LED à l'envers) → Dépanneur ; sinon Atelier
  const act = t < 0.3 || type === 'del' ? 'depanneur' : second === 'objet' ? 'testeur' : second === 'interrupteur' ? 'interrupteur' : 'banc'
  return { act, type: 'circuit', circuit, texte: QUESTION_RECEPTEUR[type], vue: Math.random() < 0.65 ? 'photo' : 'schema', choix: ['oui', 'non'], bonne: marche ? 'oui' : 'non' }
}

function question() {
  const t = Math.random()
  if (t < 0.5) return circuitAuHasard()
  if (t < 0.72) {
    const cible = hasard(Object.keys(SYMBOLES))
    return { act: 'schemas', type: 'symbole', cible, choix: melanger([cible, ...melanger(Object.keys(SYMBOLES).filter((x) => x !== cible)).slice(0, 3)]), bonne: cible }
  }
  const [act, texte, vrai] = hasard(AFFIRMATIONS)
  return { act, type: 'vf', texte, choix: ['vrai', 'faux'], bonne: vrai ? 'vrai' : 'faux' }
}

const nomChoix = (q, c) => (q.type === 'symbole' ? SYMBOLES[c] : { oui: 'Oui', non: 'Non', vrai: 'Vrai', faux: 'Faux' }[c])

function rendu(q, flash) {
  return (
    <>
      {q.type === 'vf' && <p className="labo-titre flex min-h-[200px] items-center justify-center text-center text-xl font-bold text-white">{q.texte}</p>}
      {q.type === 'symbole' && (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-2">
          <p className="text-sm text-[#B9C1E3]">Quel est ce symbole ?</p>
          <div className="rounded-2xl bg-[#F7F5EE] p-2">
            <Vignette type={q.cible} vue="schema" taille={130} />
          </div>
        </div>
      )}
      {q.type === 'circuit' && (
        <div>
          <p className="mb-2 text-center text-[15px] font-bold text-white">{q.texte}</p>
          {/* pendant la question, le circuit est montré éteint ; la réponse s'allume après */}
          <CircuitFige circuit={q.circuit} vue={q.vue} hauteur={H} apercu={!flash} className="mx-auto w-full tab:h-[42dvh] tab:w-auto tab:max-w-full" />
        </div>
      )}
    </>
  )
}

export default function DefiElecView() {
  return (
    <DefiEclair
      Page={PageElec}
      cadre={{ code: 'E8', titre: 'Défi', attendus: [114], couleur: JAUNE }}
      experience="electricite"
      nomCollection="laboDefiElec"
      question={question}
      rendu={rendu}
      nomChoix={nomChoix}
      annonce="Circuits, symboles, conducteurs : montre tout ce que tu as appris !"
      delaiErreur={(q) => (q.type === 'circuit' ? 1400 : 700)}
    />
  )
}
