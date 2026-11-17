import {
  Activity,
  Bird,
  Bone,
  Brain,
  Cable,
  Dumbbell,
  Home,
  Lightbulb,
  Microscope,
  PenTool,
  PersonStanding,
  ScanFace,
  SearchCheck,
  Shield,
  Siren,
  ToggleLeft,
  TriangleAlert,
  Wrench,
  Zap,
} from 'lucide-react'

// =============================================================
//  Le labo de sciences : les EXPÉRIENCES (une par chapitre) et
//  leurs PAILLASSES (les jeux).
//
//  Pour ajouter un chapitre : un objet dans EXPERIENCES.
//  Pour ajouter un jeu : une paillasse dans son expérience
//  + sa vue dans App.jsx (LABO_JEUX, clé « experience/paillasse »).
//  Une paillasse avec « pret: false » s'affiche « en préparation ».
// =============================================================
export const EXPERIENCES = [
  {
    id: 'locomoteur',
    numero: '01',
    titre: 'Le système locomoteur',
    accroche: 'Os, muscles, tendons et articulations : comment ton corps bouge-t-il ?',
    niveau: 'P3-P4',
    chapitre: 'Les forces de l’appareil moteur',
    attendus: '111 à 121',
    couleur: '#7CFF6B',
    couleur2: '#B57BFF',
    rgb: '124,255,107',
    rgb2: '181,123,255',
    chiffres: ['206 os', 'plus de 600 muscles'],
    visuel: 'squelette',
    explorateur: { titre: 'Le corps humain en 3D', lien: 'explorateur' },
    vedette: { id: 'miroir', texte: 'Scanne ta main, puis un copain : leurs os apparaissent en direct.' },
    paillasses: [
      { id: 'miroir', code: 'A1', titre: 'Le miroir à rayons X', texte: 'Ton propre squelette, en direct', icon: ScanFace, couleur: '#6FEFFF', attendus: [112, 113, 120, 121] },
      { id: 'puzzle', code: 'A2', titre: 'Squelette explosé', texte: 'Un vrai squelette 3D à remonter', icon: Bone, couleur: '#9DFF8A', attendus: [112, 113] },
      { id: 'bras', code: 'A3', titre: 'Le bras mécanique', texte: 'Accroche le muscle, fais bouger le bras', icon: Dumbbell, couleur: '#C9A3FF', attendus: [111, 117, 118, 120] },
      { id: 'qui-tire', code: 'A4', titre: 'Qui tire ?', texte: 'Vrais muscles 3D en mouvement', icon: Activity, couleur: '#FFB86B', attendus: [120, 121] },
      { id: 'pantin', code: 'A5', titre: 'Le pantin du savant fou', texte: 'Place les articulations… et danse', icon: PersonStanding, couleur: '#FF8AD8', attendus: [113, 120] },
      { id: 'protection', code: 'A6', titre: 'Mission protection', texte: 'Soutien, locomotion ou protection ?', icon: Shield, couleur: '#7CB8FF', attendus: [115] },
      { id: 'reflexes', code: 'A7', titre: 'Message express', texte: 'Du cerveau au muscle + test de réflexes', icon: Brain, couleur: '#FFD27A', attendus: [114] },
      { id: 'dissection', code: 'A8', titre: 'Le scalpel', texte: 'Dissèque couche par couche', icon: Microscope, couleur: '#FF8A95', attendus: [119, 120] },
      { id: 'cousins', code: 'A9', titre: 'Les cousins cachés', texte: 'Mêmes os 3D chez l’oiseau, la baleine…', icon: Bird, couleur: '#9DE7C2', attendus: [112] },
      { id: 'urgences', code: 'A10', titre: 'Service des urgences', texte: 'De vraies radios de fractures', icon: Siren, couleur: '#FF6B7A', attendus: [112, 115] },
      { id: 'defi', code: 'A11', titre: 'Défi éclair', texte: '60 secondes, tableau des records', icon: Zap, couleur: '#FFE45E', attendus: [112, 113, 116] },
    ],
  },
  {
    id: 'electricite',
    numero: '02',
    titre: 'L’électricité',
    accroche: 'Piles, fils, ampoules et interrupteurs : comment le courant circule-t-il ?',
    niveau: 'P5-P6',
    chapitre: 'Le circuit électrique',
    attendus: '110 à 117',
    couleur: '#FFE45E',
    couleur2: '#3EC9FF',
    rgb: '255,228,94',
    rgb2: '62,201,255',
    chiffres: ['9 paillasses', 'circuits calculés pour de vrai'],
    visuel: 'ampoule',
    vedette: { id: 'banc', texte: 'L’atelier libre : un magasin de matériel et carte blanche pour inventer tes circuits.' },
    paillasses: [
      {
        id: 'banc', code: 'E1', titre: 'Le banc d’essai', icon: Cable, couleur: '#FFE45E', attendus: [111, 112, 116],
        texte: 'Carte blanche : construis tes propres circuits',
        detail: 'L’atelier libre : un magasin de matériel (piles, ampoules, DEL, moteur, sonnette, interrupteurs, bouton-poussoir). On pose, on tire les fils, le circuit est calculé pour de vrai (loi d’Ohm). Série, dérivation, court-circuit avec flammes, ampoule qui grille à 9 V… et un carnet de 13 découvertes à débloquer.',
      },
      {
        id: 'testeur', code: 'E2', titre: 'Conducteur ou isolant ?', icon: SearchCheck, couleur: '#3EC9FF', attendus: [113, 115],
        texte: 'Le testeur de matériaux',
        detail: 'Un circuit testeur avec deux pinces. On prédit, puis on glisse l’objet : clé, trombone, pièce, aluminium, cuillère, mine de crayon, gomme, règle, bois, verre, papier, liège, élastique, laine. L’ampoule répond, le tableau se remplit (la mine de crayon conduit, mais faiblement !).',
      },
      {
        id: 'interrupteur', code: 'E3', titre: 'Ouvert ou fermé ?', icon: ToggleLeft, couleur: '#9DFF8A', attendus: [112, 116],
        texte: '8 missions d’électricien',
        detail: 'Huit missions vérifiées par le calcul du circuit : allumer, ajouter l’interrupteur, la sonnette au bouton, inverser le moteur, série, dérivation, éteindre une lampe sur deux, un interrupteur par récepteur. Indices à la demande.',
      },
      {
        id: 'schemas', code: 'E4', titre: 'Le traducteur de schémas', icon: PenTool, couleur: '#C9A3FF', attendus: [117],
        texte: 'Des photos de circuits aux symboles',
        detail: 'Photo d’un vrai montage → quel schéma ? Schéma → quel montage ? Quel est ce symbole ? Puis l’inverse : réaliser le montage à partir d’un schéma normalisé, vérifié borne par borne.',
      },
      {
        id: 'depanneur', code: 'E5', titre: 'Le dépanneur', icon: Wrench, couleur: '#FFB86B', attendus: [111, 112, 114],
        texte: 'Ça ne s’allume pas : trouve la panne',
        detail: 'Neuf circuits en panne : fil débranché, ampoule grillée, pile usée, interrupteur ouvert, gomme dans la boucle, DEL à l’envers, court-circuit, série coupée, double panne. On inspecte, on répare, puis on nomme la panne.',
      },
      {
        id: 'maison', code: 'E6', titre: 'La maison à éclairer', icon: Home, couleur: '#FF8AD8', attendus: [110, 116],
        texte: 'Le projet : câbler une maison miniature',
        detail: 'Le projet du référentiel à l’écran : câbler depuis la pile de la cave la chambre, la cuisine, le ventilateur de la salle de jeux, la sonnette de l’entrée, puis l’interrupteur général. La vérification essaie toutes les positions des interrupteurs.',
      },
      {
        id: 'danger', code: 'E7', titre: 'Danger, électricité !', icon: TriangleAlert, couleur: '#FF6B7A', attendus: [],
        texte: 'Bonus sécurité : repère les dangers',
        detail: 'L’échelle des tensions, de la pile (1,5 V) à la foudre, et 14 situations « danger ou bon réflexe ? » expliquées : prise, bain, multiprises, fil abîmé, lignes à haute tension, court-circuit…',
      },
      {
        id: 'defi', code: 'E8', titre: 'Défi éclair', icon: Zap, couleur: '#FFE45E', attendus: [114],
        texte: '60 secondes : ça marche ou pas ?',
        detail: 'Des circuits tirés au hasard (le moteur de calcul donne la réponse), des symboles et du vocabulaire : générateur, récepteur, conducteur, isolant, ouvert, fermé. Tableau des records de la classe.',
      },
      {
        id: 'ampoule', code: 'E9', titre: 'Au cœur de l’ampoule', icon: Lightbulb, couleur: '#FFD27A', attendus: [111],
        texte: 'Ce qui se passe à l’intérieur',
        detail: 'La coupe d’une ampoule à filament : on touche chaque partie, on suit le trajet du courant du plot au culot, on règle la tension de 0 à 9 V (le filament rougit, blanchit, puis grille). Et la comparaison avec la DEL.',
      },
    ],
  },
]

export const EXPERIENCE = Object.fromEntries(EXPERIENCES.map((e) => [e.id, e]))

// Anciennes adresses (avant les expériences) → nouvelles, pour les QR codes déjà imprimés
export const ANCIENNES_ADRESSES = ['miroir', 'puzzle', 'bras', 'qui-tire', 'pantin', 'protection', 'reflexes', 'dissection', 'explorateur', 'cousins', 'urgences', 'defi']
