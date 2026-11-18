import { avecCommande, commandePar, enSerie, fonctionne, independants, resoudre } from '../../../components/labo/electricite/circuit.js'
import Missions from './Missions.jsx'
import { comp, fil } from './commun.jsx'

// =============================================================
//  E3 · Ouvert ou fermé ? Huit missions d'électricien, vérifiées
//  par le calcul réel du circuit. Attendus 112, 116.
//  Les missions avec interrupteur ne sont réussies que quand le
//  montage est juste ET que l'élève l'a essayé (récepteur en marche).
// =============================================================
const P = () => comp('p', 'pile', 180, 460)
const ok = (res, ...ids) => !res.courtCircuit && ids.every((id) => fonctionne(res, id))

const MISSIONS = [
  {
    titre: 'Allume l’ampoule',
    consigne: 'Relie la pile et l’ampoule avec des fils pour que l’ampoule s’allume.',
    composants: [P(), comp('a', 'ampoule', 180, 200)],
    test: (c, f, r) => ok(r, 'a'),
    indices: ['Il faut une boucle complète : de la borne + de la pile jusqu’à l’ampoule, puis de l’ampoule jusqu’à la borne −.', 'Deux fils suffisent : un pour chaque borne de l’ampoule.'],
    explication: 'Le circuit est fermé : le courant sort par la borne +, traverse l’ampoule et revient par la borne −.',
  },
  {
    titre: 'L’interrupteur',
    consigne: 'Ajoute l’interrupteur dans la boucle : il doit allumer ET éteindre l’ampoule. Ferme-le pour allumer !',
    composants: [P(), comp('a', 'ampoule', 100, 190), comp('i', 'interrupteur', 262, 230)],
    // réussi quand le montage est bon ET que l'élève a fermé l'interrupteur (ampoule allumée)
    test: (c, f, r) => commandePar(c, f, 'i', 'a') && ok(r, 'a'),
    indices: ['L’interrupteur doit être sur le chemin du courant, comme un pont qu’on lève et qu’on baisse.', 'Pile + → ampoule → interrupteur → pile − : trois fils.'],
    explication: 'Interrupteur fermé : la boucle est complète, le courant passe. Ouvert : la boucle est coupée, plus de courant, l’ampoule s’éteint.',
  },
  {
    titre: 'Sonne à la porte',
    consigne: 'La sonnette ne doit sonner QUE quand on appuie sur le bouton-poussoir. Appuie pour la faire sonner !',
    composants: [P(), comp('s', 'sonnette', 110, 200), comp('b', 'poussoir', 262, 230)],
    // réussi quand le montage est bon ET qu'on appuie (la sonnette sonne)
    test: (c, f, r) => commandePar(c, f, 'b', 's') && ok(r, 's'),
    indices: ['Le bouton-poussoir est un interrupteur qui ne reste fermé que pendant qu’on appuie.', 'Place-le en série avec la sonnette, dans la même boucle.'],
    explication: 'Tant qu’on appuie, le bouton ferme le circuit et la sonnette sonne. On relâche : le circuit s’ouvre.',
  },
  {
    titre: 'Demi-tour !',
    consigne: 'L’hélice tourne dans le sens ↻. Fais-la tourner dans l’autre sens (↺) sans toucher au moteur.',
    composants: [P(), comp('m', 'moteur', 180, 200)],
    fils: [fil('p:0', 'm:0'), fil('p:1', 'm:1')],
    test: (c, f, r) => ok(r, 'm') && r.composants.m.vitesse < 0,
    indices: ['Le sens de rotation dépend du sens du courant dans le moteur.', 'Touche un fil pour le retirer, puis croise les branchements : la borne + de la pile va sur l’autre borne du moteur.'],
    explication: 'En inversant les branchements, le courant traverse le moteur dans l’autre sens : il tourne à l’envers.',
  },
  {
    titre: 'Deux ampoules en série',
    consigne: 'Allume les deux ampoules sur UNE SEULE boucle : si on retire l’une, l’autre doit s’éteindre.',
    composants: [P(), comp('a', 'ampoule', 100, 200), comp('b', 'ampoule', 260, 200)],
    test: (c, f, r) => ok(r, 'a', 'b') && enSerie(c, f, 'a', 'b') && enSerie(c, f, 'b', 'a'),
    indices: ['Le courant doit traverser une ampoule, puis l’autre, avant de revenir à la pile.', 'Pile + → ampoule 1 → ampoule 2 → pile − (3 fils).'],
    explication: 'En série, les ampoules se partagent la tension de la pile : elles brillent moins fort. Et si une ampoule est retirée ou grillée, la boucle est coupée : tout s’éteint.',
  },
  {
    titre: 'Deux ampoules en dérivation',
    consigne: 'Allume les deux ampoules pour qu’elles brillent FORT toutes les deux : chacune doit avoir sa propre boucle avec la pile.',
    composants: [P(), comp('a', 'ampoule', 100, 200), comp('b', 'ampoule', 260, 200)],
    test: (c, f, r) => ok(r, 'a', 'b') && !enSerie(c, f, 'a', 'b') && !enSerie(c, f, 'b', 'a'),
    indices: ['Chaque ampoule doit être reliée directement aux deux bornes de la pile.', 'On peut brancher plusieurs fils sur la même borne : 4 fils au total.'],
    explication: 'En dérivation, chaque ampoule reçoit toute la tension de la pile : elles brillent normalement. Si l’une est retirée, l’autre reste allumée. C’est le montage de nos maisons.',
  },
  {
    titre: 'Une lampe sur deux',
    consigne: 'Deux ampoules et un seul interrupteur : quand on l’ouvre, UNE SEULE ampoule doit s’éteindre, l’autre reste allumée.',
    composants: [P(), comp('a', 'ampoule', 90, 170), comp('b', 'ampoule', 270, 170), comp('i', 'interrupteur', 180, 310)],
    // réussi quand le montage est bon ET qu'on a fermé l'interrupteur (les deux brillent)
    test: (c, f, r) => {
      const ferme = resoudre(avecCommande(c, 'i', true), f)
      const ouvert = resoudre(avecCommande(c, 'i', false), f)
      return ok(ferme, 'a', 'b') && fonctionne(ouvert, 'a') !== fonctionne(ouvert, 'b') && ok(r, 'a', 'b')
    },
    indices: ['Il faut un montage en dérivation : deux boucles séparées.', 'Mets l’interrupteur dans la boucle d’UNE seule des deux ampoules.'],
    explication: 'L’interrupteur ne coupe que la boucle où il se trouve. L’autre ampoule a sa propre boucle avec la pile : elle reste allumée.',
  },
  {
    titre: 'Chacun son interrupteur',
    consigne: 'Une ampoule et un moteur, deux interrupteurs : chaque interrupteur doit commander son récepteur, sans toucher à l’autre.',
    composants: [P(), comp('a', 'ampoule', 80, 160), comp('m', 'moteur', 280, 160), comp('i', 'interrupteur', 80, 320, { etiquette: 'A' }), comp('j', 'interrupteur', 280, 320, { etiquette: 'B' })],
    // réussi quand le montage est bon ET que l'ampoule et le moteur marchent en même temps
    test: (c, f, r) =>
      independants(c, f, [
        ['i', 'a'],
        ['j', 'm'],
      ]) && ok(r, 'a', 'm'),
    indices: ['Deux boucles en dérivation : une pour l’ampoule, une pour le moteur.', 'Dans chaque boucle : pile → interrupteur → récepteur → pile. Les deux boucles partagent les bornes de la pile.'],
    explication: 'Chaque récepteur est sur sa propre branche avec son interrupteur : on les commande séparément. C’est ainsi qu’on câble les pièces d’une maison.',
  },
]

export default function InterrupteurView() {
  return (
    <Missions
      code="E3"
      titre="Ouvert ou fermé ?"
      attendus={[112, 116]}
      couleur="#9DFF8A"
      missions={MISSIONS}
      conclusion="Un circuit électrique doit être fermé pour que le courant circule. L’interrupteur ouvre ou ferme la boucle où il est placé. En série, une seule boucle : tout s’arrête si on l’ouvre. En dérivation, chaque branche a sa boucle : on peut commander chaque récepteur séparément."
    />
  )
}
