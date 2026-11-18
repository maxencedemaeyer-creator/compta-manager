import { melanger } from '../../../components/labo/CadreJeu.jsx'
import DefiEclair from '../../../components/labo/defi/DefiEclair.jsx'
import { famille, paquet, questionQCM, questionVF } from '../../../components/labo/defi/tirage.js'
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

// Banques de questions. VRAIS et FAUX : deux paquets tirés à 50/50 ; chaque notion est
// posée de plusieurs façons (vrai/faux, à choix, circuit à observer, symbole).
// [activité, affirmation]
const VRAIS = [
  ['banc', 'La pile est un générateur.'],
  ['banc', 'Le moteur et la sonnette sont des récepteurs.'],
  ['banc', 'En série, si une ampoule grille, les autres s’éteignent.'],
  ['banc', 'Avec deux piles en série, l’ampoule brille plus fort qu’avec une seule.'],
  ['banc', 'Une pile fournit l’énergie au circuit.'],
  ['banc', 'Une lampe LED a un côté + et un côté −.'],
  ['maison', 'En dérivation, si une ampoule grille, les autres restent allumées.'],
  ['maison', 'Dans une maison, les lampes sont branchées en dérivation.'],
  ['maison', 'Un interrupteur peut éteindre une seule pièce de la maison.'],
  ['testeur', 'Le métal est un conducteur.'],
  ['testeur', 'Le bois sec est un isolant.'],
  ['testeur', 'La mine de crayon laisse passer le courant.'],
  ['testeur', 'Le plastique est un isolant.'],
  ['testeur', 'Le verre est un isolant.'],
  ['testeur', 'Une pièce de monnaie laisse passer le courant.'],
  ['testeur', 'Les fils électriques sont entourés de plastique pour isoler.'],
  ['interrupteur', 'Un interrupteur fermé laisse passer le courant.'],
  ['interrupteur', 'Un circuit doit être fermé pour fonctionner.'],
  ['interrupteur', 'Un interrupteur ouvert coupe le circuit.'],
  ['interrupteur', 'Un bouton-poussoir ferme le circuit tant qu’on appuie.'],
  ['depanneur', 'Une lampe LED s’allume dans un seul sens.'],
  ['depanneur', 'Une pile usée peut empêcher l’ampoule de briller.'],
  ['depanneur', 'Un fil coupé empêche le courant de passer.'],
  ['depanneur', 'Un mauvais contact peut éteindre l’ampoule.'],
  ['danger', 'Relier les deux bornes d’une pile par un fil, c’est un court-circuit.'],
  ['danger', 'On ne touche jamais une prise avec les mains mouillées.'],
  ['danger', 'Un court-circuit peut faire chauffer les fils.'],
  ['danger', 'L’eau laisse passer le courant électrique.'],
  ['danger', 'Le courant de la prise du mur peut être mortel.'],
  ['ampoule', 'Dans l’ampoule, c’est le filament qui brille.'],
  ['ampoule', 'Avec une pile trop forte, le filament peut griller.'],
  ['ampoule', 'Le filament de l’ampoule est un fil très fin.'],
  ['schemas', 'Un schéma électrique utilise des symboles.'],
  ['schemas', 'Le symbole de la pile a un trait long et un trait court.'],
]
const FAUX = [
  ['banc', 'L’ampoule est un générateur.'],
  ['banc', 'Le moteur est un générateur.'],
  ['banc', 'Avec deux piles en série, l’ampoule brille moins fort qu’avec une seule.'],
  ['banc', 'Une ampoule peut s’allumer sans aucune pile.'],
  ['banc', 'La sonnette fournit l’énergie au circuit.'],
  ['banc', 'Une lampe LED s’allume dans les deux sens.'],
  ['maison', 'En dérivation, si une ampoule grille, les autres s’éteignent.'],
  ['maison', 'Dans une maison, toutes les lampes sont branchées en série.'],
  ['maison', 'Une ampoule grillée éteint toute la maison.'],
  ['testeur', 'Le plastique est un conducteur.'],
  ['testeur', 'Le bois sec laisse passer le courant.'],
  ['testeur', 'La laine est un conducteur.'],
  ['testeur', 'Le verre laisse passer le courant.'],
  ['testeur', 'Le papier est un conducteur.'],
  ['testeur', 'Une gomme laisse passer le courant.'],
  ['testeur', 'Les métaux sont tous des isolants.'],
  ['interrupteur', 'Dans un circuit ouvert, le courant circule.'],
  ['interrupteur', 'Un interrupteur ouvert laisse passer le courant.'],
  ['interrupteur', 'Une ampoule brille même si le circuit est ouvert.'],
  ['interrupteur', 'Relier une seule borne de la pile à l’ampoule suffit à l’allumer.'],
  ['depanneur', 'Un fil coupé laisse quand même passer le courant.'],
  ['depanneur', 'Une pile vide fait briller l’ampoule plus fort.'],
  ['depanneur', 'La lampe LED fonctionne pareil dans les deux sens.'],
  ['danger', 'La prise du mur (230 V) est sans danger.'],
  ['danger', 'Un court-circuit est sans danger pour la pile.'],
  ['danger', 'On peut toucher un fil abîmé si on porte des chaussettes.'],
  ['danger', 'L’eau est un isolant.'],
  ['danger', 'Une petite pile plate est aussi dangereuse que la prise du mur.'],
  ['ampoule', 'Le filament de l’ampoule est en plastique.'],
  ['ampoule', 'Une ampoule brille même si son filament est coupé.'],
  ['ampoule', 'Le filament ne chauffe pas du tout.'],
  ['schemas', 'Dans un schéma, on dessine chaque objet comme sur une photo.'],
  ['schemas', 'La pile et l’ampoule ont le même symbole.'],
]
// [activité, question, bonne réponse, choix]
const QCM = [
  ['banc', 'Quel objet fournit l’énergie au circuit ?', 'La pile', ['La pile', 'L’ampoule', 'L’interrupteur']],
  ['banc', 'Lequel est un récepteur ?', 'Le moteur', ['Le moteur', 'La pile', 'Le fil']],
  ['banc', 'Que fait un récepteur ?', 'Il utilise l’énergie', ['Il utilise l’énergie', 'Il fabrique l’énergie', 'Il coupe le circuit']],
  ['banc', 'Deux ampoules l’une derrière l’autre : c’est un montage…', 'en série', ['en série', 'en dérivation', 'en court-circuit']],
  ['maison', 'Dans une maison, les lampes sont branchées…', 'en dérivation', ['en dérivation', 'en série', 'sans fil']],
  ['maison', 'Chaque lampe a sa propre branche : c’est un montage…', 'en dérivation', ['en dérivation', 'en série', 'ouvert']],
  ['testeur', 'Quel matériau est un isolant ?', 'Le plastique', ['Le plastique', 'Le cuivre', 'Le fer']],
  ['testeur', 'Quel matériau est un conducteur ?', 'L’aluminium', ['L’aluminium', 'Le bois sec', 'Le verre']],
  ['testeur', 'Pourquoi les fils sont-ils en métal ?', 'Il laisse passer le courant', ['Il laisse passer le courant', 'Il arrête le courant', 'Il est transparent']],
  ['testeur', 'Pourquoi les fils sont-ils recouverts de plastique ?', 'Pour isoler', ['Pour isoler', 'Pour chauffer', 'Pour briller']],
  ['interrupteur', 'Pour éteindre la lampe, on… le circuit.', 'ouvre', ['ouvre', 'ferme', 'allonge']],
  ['interrupteur', 'Pour allumer la lampe, on… le circuit.', 'ferme', ['ferme', 'ouvre', 'plie']],
  ['depanneur', 'La lampe LED reste éteinte. Que vérifier ?', 'Son sens', ['Son sens', 'Sa couleur', 'Son poids']],
  ['depanneur', 'Le circuit est coupé. Que faire ?', 'Réparer le fil', ['Réparer le fil', 'Ajouter de l’eau', 'Éteindre la lumière']],
  ['danger', 'Relier les deux bornes d’une pile avec un fil, c’est un…', 'court-circuit', ['court-circuit', 'interrupteur', 'récepteur']],
  ['danger', 'Que fait-on avec une prise du mur ?', 'On n’y met rien', ['On n’y met rien', 'On y glisse un clou', 'On la touche mouillé']],
  ['danger', 'Quelle tension a la prise du mur ?', '230 V', ['230 V', '4,5 V', '1 V']],
  ['ampoule', 'Quelle partie de l’ampoule devient lumineuse ?', 'Le filament', ['Le filament', 'Le culot', 'Le plot']],
  ['ampoule', 'Que se passe-t-il si le filament est coupé ?', 'L’ampoule ne brille plus', ['L’ampoule ne brille plus', 'Elle brille plus fort', 'Elle change de couleur']],
]
const tirerVrai = paquet(VRAIS)
const tirerFaux = paquet(FAUX)
const tirerQcm = paquet(QCM)
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

const tirerSymbole = paquet(Object.keys(SYMBOLES))

function question() {
  return famille([
    [35, circuitAuHasard],
    [12, () => {
      const cible = tirerSymbole()
      return { act: 'schemas', type: 'symbole', cible, choix: melanger([cible, ...melanger(Object.keys(SYMBOLES).filter((x) => x !== cible)).slice(0, 3)]), bonne: cible }
    }],
    [33, () => questionVF(tirerVrai, tirerFaux)],
    [20, () => questionQCM(tirerQcm)],
  ])
}

const nomChoix = (q, c) => (q.type === 'symbole' ? SYMBOLES[c] : ({ oui: 'Oui', non: 'Non', vrai: 'Vrai', faux: 'Faux' }[c] || c))

function rendu(q, flash) {
  return (
    <>
      {(q.type === 'vf' || q.type === 'qcm') && <p className="labo-titre flex min-h-[200px] items-center justify-center text-center text-xl font-bold text-white">{q.texte}</p>}
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
