import { fonctionne } from '../../../components/labo/electricite/circuit.js'
import Missions from './Missions.jsx'
import { comp, fil } from './commun.jsx'

// =============================================================
//  E5 · Le dépanneur : des circuits en panne. L'élève observe,
//  touche les composants pour les inspecter, répare, puis nomme
//  la panne. Attendus 111, 112, 114.
// =============================================================
const P = (autres) => comp('p', 'pile', 180, 450, autres)
const marche = (r, ...ids) => !r.courtCircuit && ids.every((id) => fonctionne(r, id))
const BOUCLE = [fil('p:0', 'a:0'), fil('a:1', 'i:0'), fil('i:1', 'p:1')]

const CAUSES = ['Un fil n’était pas branché', 'L’ampoule était grillée', 'La pile était usée', 'L’interrupteur était ouvert']

const MISSIONS = [
  {
    titre: 'Panne n° 1',
    consigne: 'L’ampoule ne s’allume pas. Trouve la panne et répare-la.',
    composants: [P(), comp('a', 'ampoule', 100, 200), comp('i', 'interrupteur', 262, 230, { ferme: true })],
    fils: [fil('p:0', 'a:0'), fil('i:1', 'p:1')],
    test: (c, f, r) => marche(r, 'a'),
    indices: ['Suis le chemin du courant avec ton doigt, depuis la borne + jusqu’à la borne −.', 'Entre l’ampoule et l’interrupteur, il manque quelque chose…'],
    explication: 'La boucle était ouverte : il manquait un fil entre l’ampoule et l’interrupteur.',
    question: { texte: 'Quelle était la panne ?', choix: CAUSES, bonne: 0 },
    deplacer: false,
  },
  {
    titre: 'Panne n° 2',
    consigne: 'Tout semble bien branché… et pourtant rien ne s’allume. Touche chaque composant pour l’inspecter.',
    composants: [P(), comp('a', 'ampoule', 100, 200, { grillee: true }), comp('i', 'interrupteur', 262, 230, { ferme: true })],
    fils: BOUCLE,
    test: (c, f, r) => marche(r, 'a'),
    indices: ['Regarde bien le filament de l’ampoule.', 'Touche l’ampoule, puis « Changer ».'],
    explication: 'Le filament était cassé : l’ampoule grillée coupait la boucle. Une ampoule neuve referme le circuit.',
    question: { texte: 'Quelle était la panne ?', choix: CAUSES, bonne: 1 },
    deplacer: false,
  },
  {
    titre: 'Panne n° 3',
    consigne: 'Le circuit est complet, l’interrupteur est fermé, l’ampoule est neuve… Que se passe-t-il ?',
    composants: [P({ vide: true }), comp('a', 'ampoule', 100, 200), comp('i', 'interrupteur', 262, 230, { ferme: true })],
    fils: BOUCLE,
    test: (c, f, r) => marche(r, 'a'),
    indices: ['Il reste un seul composant que tu n’as pas inspecté.', 'Touche la pile.'],
    explication: 'La pile était usée : elle ne fournissait plus d’énergie. Sans générateur, pas de courant.',
    question: { texte: 'Quelle était la panne ?', choix: CAUSES, bonne: 2 },
    deplacer: false,
  },
  {
    titre: 'Panne n° 4',
    consigne: 'Cette fois, c’est peut-être tout simple…',
    composants: [P(), comp('a', 'ampoule', 100, 200), comp('i', 'interrupteur', 262, 230)],
    fils: BOUCLE,
    test: (c, f, r) => marche(r, 'a'),
    indices: ['Regarde la position du levier.', 'Touche le levier pour fermer l’interrupteur.'],
    explication: 'L’interrupteur était ouvert : la boucle était coupée. On le ferme et le courant passe.',
    question: { texte: 'Quelle était la panne ?', choix: CAUSES, bonne: 3 },
    deplacer: false,
  },
  {
    titre: 'Panne n° 5',
    consigne: 'Quelqu’un a remplacé un fil par un objet entre deux pinces. L’ampoule reste éteinte.',
    composants: [P(), comp('a', 'ampoule', 100, 200), comp('o', 'objet', 262, 230, { objet: 'gomme', materiau: 'isolant', remplacable: true })],
    fils: [fil('p:0', 'a:0'), fil('a:1', 'o:0'), fil('o:1', 'p:1')],
    test: (c, f, r) => marche(r, 'a'),
    indices: ['De quoi est faite une gomme ?', 'Touche l’objet entre les pinces et remplace-le par un trombone en métal.'],
    explication: 'La gomme est un isolant : elle ne laisse pas passer le courant. Le trombone en métal est un conducteur : la boucle est refermée.',
    question: { texte: 'Pourquoi l’ampoule restait-elle éteinte ?', choix: ['La gomme est un isolant', 'La gomme est trop petite', 'Il faut deux gommes'], bonne: 0 },
    deplacer: false,
  },
  {
    titre: 'Panne n° 6',
    consigne: 'La lampe LED ne s’allume pas, alors que tout est branché et que rien n’est cassé.',
    composants: [P(), comp('d', 'del', 180, 210)],
    fils: [fil('p:0', 'd:1'), fil('d:0', 'p:1')],
    test: (c, f, r) => marche(r, 'd'),
    indices: ['La lampe LED ne laisse passer le courant que dans un sens.', 'Son côté + doit être relié à la borne + de la pile : retire les deux fils et croise-les.'],
    explication: 'La lampe LED était branchée à l’envers. Dans le bon sens (+ contre +), elle laisse passer le courant et s’allume.',
    question: { texte: 'Quelle était la panne ?', choix: ['La lampe LED était branchée à l’envers', 'La lampe LED était grillée', 'Il manquait un fil'], bonne: 0 },
    deplacer: false,
  },
  {
    titre: 'Panne n° 7 : ça chauffe !',
    consigne: 'Attention : quelque chose ne va pas du tout dans ce montage. Répare-le vite !',
    composants: [P(), comp('a', 'ampoule', 180, 200)],
    fils: [fil('p:0', 'a:0'), fil('a:1', 'p:1'), fil('p:0', 'p:1')],
    test: (c, f, r) => marche(r, 'a'),
    indices: ['Un fil relie directement les deux bornes de la pile.', 'Touche ce fil (sous la pile) pour le retirer.'],
    explication: 'Un fil reliait directement le + et le − de la pile : c’est un court-circuit. Le courant passait par ce fil sans traverser l’ampoule, et la pile chauffait dangereusement.',
    question: { texte: 'Comment s’appelle cette panne dangereuse ?', choix: ['Un court-circuit', 'Un circuit en série', 'Un circuit ouvert'], bonne: 0 },
    deplacer: false,
  },
  {
    titre: 'Panne n° 8',
    consigne: 'Deux ampoules en série : aucune ne s’allume. Les fils sont tous bien branchés.',
    composants: [P(), comp('a', 'ampoule', 100, 200), comp('b', 'ampoule', 260, 200, { grillee: true })],
    fils: [fil('p:0', 'a:0'), fil('a:1', 'b:0'), fil('b:1', 'p:1')],
    test: (c, f, r) => marche(r, 'a', 'b'),
    indices: ['Il suffit d’un seul composant cassé pour couper toute la boucle.', 'Inspecte les deux ampoules.'],
    explication: 'En série, il n’y a qu’une seule boucle : une seule ampoule grillée suffit à tout éteindre.',
    question: { texte: 'Pourquoi l’ampoule en bon état restait-elle éteinte ?', choix: ['En série, l’ampoule grillée coupait toute la boucle', 'La pile était trop faible', 'Elle était grillée aussi'], bonne: 0 },
    deplacer: false,
  },
  {
    titre: 'Panne n° 9 : double panne',
    consigne: 'Le chef d’atelier te confie le pire montage de la journée. Rien ne marche !',
    composants: [P({ vide: true }), comp('a', 'ampoule', 100, 200, { grillee: true }), comp('i', 'interrupteur', 262, 230, { ferme: true })],
    fils: [fil('p:0', 'a:0'), fil('i:1', 'p:1')],
    test: (c, f, r) => marche(r, 'a'),
    indices: ['Il y a plus d’une panne : inspecte chaque composant et chaque fil.', 'Un fil manque, et deux composants sont à remplacer.'],
    explication: 'Il fallait un fil, une ampoule neuve et une pile neuve. Un bon dépanneur vérifie tout, un élément à la fois.',
    question: { texte: 'Combien y avait-il de pannes ?', choix: ['1', '2', '3'], bonne: 2 },
    deplacer: false,
  },
]

export default function DepanneurView() {
  return (
    <Missions
      code="E5"
      titre="Le dépanneur"
      attendus={[111, 112, 114]}
      couleur="#FFB86B"
      missions={MISSIONS}
      conclusion="Pour dépanner un circuit, on vérifie un élément à la fois : les fils (sont-ils tous branchés ?), l’interrupteur (est-il fermé ?), les récepteurs (l’ampoule est-elle grillée ? la lampe LED dans le bon sens ?), les matériaux (conducteurs ?) et la pile (est-elle usée ?)."
    />
  )
}
