import { avecCommande, fonctionne, independants, resoudre } from '../../../components/labo/electricite/circuit.js'
import Missions from './Missions.jsx'
import { comp } from './commun.jsx'

// =============================================================
//  E6 · La maison à éclairer : le projet du référentiel à l'écran.
//  Chaque pièce a son récepteur et son interrupteur ; l'élève câble
//  depuis la pile de la cave. La vérification teste TOUTES les
//  combinaisons d'interrupteurs. Attendus 110, 116.
// =============================================================
const H = 600
// coin haut-gauche des pièces
const PIECES = {
  chambre: [16, 100, 'Chambre'],
  jeux: [180, 100, 'Salle de jeux'],
  cuisine: [16, 280, 'Cuisine'],
  entree: [180, 280, 'Entrée'],
}
const recepteur = (piece, id, type) => comp(id, type, PIECES[piece][0] + 48, PIECES[piece][1] + 86, { fixe: true })
const inter = (piece, id, type = 'interrupteur') => comp(id, type, PIECES[piece][0] + 120, PIECES[piece][1] + 146, { fixe: true })
const PILE = comp('p', 'pile', 180, 545, { fixe: true })

function Maison(vue) {
  const papier = vue === 'schema'
  const mur = papier ? '#B9C4D6' : '#3A4766'
  const texte = papier ? '#5A6782' : '#8A93B8'
  return (
    <g style={{ pointerEvents: 'none' }}>
      <path d="M6 102 L180 22 L354 102 Z" fill={papier ? 'none' : '#2A1F2E'} stroke={papier ? mur : '#5A3E4E'} strokeWidth="3" strokeLinejoin="round" />
      {!papier && <rect x="16" y="100" width="328" height="360" fill="#1A2236" />}
      <rect x="16" y="100" width="328" height="360" fill="none" stroke={mur} strokeWidth="4" />
      <path d={`M16 280 L344 280 M180 100 L180 460`} stroke={mur} strokeWidth="3" />
      {/* porte d'entrée */}
      <rect x="318" y="384" width="24" height="74" rx="2" fill={papier ? 'none' : '#5A3B22'} stroke={papier ? mur : '#7A5232'} />
      <circle cx="323" cy="424" r="2" fill={papier ? mur : '#D4A93E'} />
      {/* fenêtres */}
      {[
        [26, 120],
        [190, 120],
      ].map(([x, y]) => (
        <rect key={x} x={x + 110} y={y} width="36" height="28" fill={papier ? 'none' : '#22355A'} stroke={mur} />
      ))}
      {/* sol et cave */}
      <path d="M0 460 L360 460" stroke={papier ? mur : '#4A5578'} strokeWidth="5" />
      {!papier && <rect x="0" y="462" width="360" height={H - 462} fill="#10131C" />}
      <text x="12" y="482" fontSize="11" fontWeight="800" fill={texte} letterSpacing="1">
        CAVE
      </text>
      {Object.values(PIECES).map(([x, y, nom]) => (
        <text key={nom} x={x + 8} y={y + 16} fontSize="11" fontWeight="800" fill={texte} letterSpacing=".5">
          {nom.toUpperCase()}
        </text>
      ))}
    </g>
  )
}

const MISSIONS = [
  {
    titre: 'Éclaire la chambre',
    consigne: 'Câble la lampe de la chambre et son interrupteur depuis la pile de la cave.',
    composants: [PILE, recepteur('chambre', 'a', 'ampoule'), inter('chambre', 'i')],
    test: (c, f) => independants(c, f, [['i', 'a']]),
    indices: ['Une seule boucle : pile → interrupteur → lampe → pile.', 'Trois fils suffisent.'],
    explication: 'La lampe de la chambre est commandée par son interrupteur : fermé, la boucle est complète ; ouvert, elle est coupée.',
  },
  {
    titre: 'Chambre et cuisine',
    consigne: 'Chaque pièce doit avoir SON interrupteur : allumer la cuisine ne doit pas allumer la chambre.',
    composants: [PILE, recepteur('chambre', 'a', 'ampoule'), inter('chambre', 'i'), recepteur('cuisine', 'b', 'ampoule'), inter('cuisine', 'j')],
    test: (c, f) => independants(c, f, [
      ['i', 'a'],
      ['j', 'b'],
    ]),
    indices: ['En série, un interrupteur couperait tout. Il faut deux boucles : un montage en dérivation.', 'Chaque boucle part de la pile, passe par l’interrupteur puis la lampe de la pièce, et revient à la pile.'],
    explication: 'Chaque pièce est sur sa propre branche (dérivation) avec son interrupteur. On teste toutes les combinaisons : chaque lampe obéit à son interrupteur seulement.',
  },
  {
    titre: 'Le ventilateur',
    consigne: 'La salle de jeux a un ventilateur (un moteur). Chambre, cuisine et ventilateur : chacun son interrupteur.',
    composants: [PILE, recepteur('chambre', 'a', 'ampoule'), inter('chambre', 'i'), recepteur('jeux', 'm', 'moteur'), inter('jeux', 'k'), recepteur('cuisine', 'b', 'ampoule'), inter('cuisine', 'j')],
    test: (c, f) => independants(c, f, [
      ['i', 'a'],
      ['k', 'm'],
      ['j', 'b'],
    ]),
    indices: ['Trois branches en dérivation, toutes reliées aux deux bornes de la pile.', 'Plusieurs fils peuvent partir de la même borne de la pile.'],
    explication: 'Trois récepteurs différents, trois branches en dérivation : chacun reçoit toute la tension de la pile et fonctionne seul.',
  },
  {
    titre: 'Toute la maison',
    consigne: 'Ajoute la sonnette de l’entrée avec son bouton-poussoir. Les quatre pièces doivent fonctionner séparément.',
    composants: [
      PILE,
      recepteur('chambre', 'a', 'ampoule'),
      inter('chambre', 'i'),
      recepteur('jeux', 'm', 'moteur'),
      inter('jeux', 'k'),
      recepteur('cuisine', 'b', 'ampoule'),
      inter('cuisine', 'j'),
      recepteur('entree', 's', 'sonnette'),
      inter('entree', 'q', 'poussoir'),
    ],
    test: (c, f) => independants(c, f, [
      ['i', 'a'],
      ['k', 'm'],
      ['j', 'b'],
      ['q', 's'],
    ]),
    indices: ['Une quatrième branche en dérivation, pour la sonnette.', 'Le bouton-poussoir se place dans la branche de la sonnette, comme un interrupteur.'],
    explication: 'Quatre branches en dérivation : c’est exactement le principe de l’installation électrique d’une maison.',
  },
  {
    titre: 'L’interrupteur général',
    consigne: 'Dans la cave, un interrupteur général doit tout couper. Quand il est fermé, chaque lampe obéit à son propre interrupteur.',
    composants: [PILE, comp('g', 'interrupteur', 70, 545, { fixe: true, etiquette: 'Général' }), recepteur('chambre', 'a', 'ampoule'), inter('chambre', 'i'), recepteur('cuisine', 'b', 'ampoule'), inter('cuisine', 'j')],
    test: (c, f) => {
      const ouvert = resoudre(avecCommande(avecCommande(avecCommande(c, 'g', false), 'i', true), 'j', true), f)
      return !fonctionne(ouvert, 'a') && !fonctionne(ouvert, 'b') && independants(avecCommande(c, 'g', true), f, [
        ['i', 'a'],
        ['j', 'b'],
      ])
    },
    indices: ['Tout le courant de la maison doit passer par l’interrupteur général : place-le juste à la sortie de la pile.', 'Pile + → interrupteur général → puis les deux branches partent de là.'],
    explication: 'L’interrupteur général est en série avec toutes les branches : ouvert, il coupe toute la maison. C’est le rôle du disjoncteur général d’une vraie maison.',
  },
]

export default function MaisonView() {
  return (
    <Missions
      code="E6"
      titre="La maison à éclairer"
      attendus={[110, 116]}
      couleur="#FF8AD8"
      missions={MISSIONS.map((m) => ({ ...m, hauteur: H, fond: Maison, deplacer: false }))}
      intro="Tu es l’électricien de la maison. Tire les fils depuis la pile de la cave jusqu’aux pièces. La vérification essaie toutes les positions des interrupteurs."
      conclusion="Dans une maison, les appareils sont branchés en dérivation : chacun a sa propre branche et son interrupteur, et reçoit toute la tension. Prépare maintenant ta vraie maquette en classe avec ce plan de câblage !"
    />
  )
}
