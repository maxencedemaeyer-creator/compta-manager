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
    chiffres: ['1 circuit fermé = 1 ampoule allumée'],
    visuel: 'ampoule',
    paillasses: [
      {
        id: 'banc', code: 'E1', titre: 'Le banc d’essai', icon: Cable, couleur: '#FFE45E', attendus: [111, 112, 116], pret: false,
        texte: 'Construis des circuits avec de vrais composants',
        detail: 'Une table de travail avec pile, fils, ampoules, moteur, sonnette et interrupteur, en photos réelles. On glisse et on branche : le circuit est calculé pour de vrai. Fermé, l’ampoule s’allume et le moteur tourne ; ouvert, rien.',
      },
      {
        id: 'testeur', code: 'E2', titre: 'Conducteur ou isolant ?', icon: SearchCheck, couleur: '#3EC9FF', attendus: [113, 115], pret: false,
        texte: 'Le testeur de matériaux',
        detail: 'Un circuit testeur avec deux pinces. On y glisse des objets photographiés : clé, trombone, gomme, mine de crayon, pièce, bois, verre, eau salée, papier d’aluminium… L’ampoule répond. Les élèves classent, puis découvrent les surprises (la mine de crayon conduit !).',
      },
      {
        id: 'interrupteur', code: 'E3', titre: 'Ouvert ou fermé ?', icon: ToggleLeft, couleur: '#9DFF8A', attendus: [112, 116], pret: false,
        texte: 'Voir le courant passer… ou pas',
        detail: 'Un circuit animé : quand on ferme l’interrupteur, on voit le courant parcourir la boucle et l’ampoule s’allumer. On ouvre : tout s’arrête. Défis : où placer l’interrupteur pour éteindre une seule lampe sur deux ?',
      },
      {
        id: 'schemas', code: 'E4', titre: 'Le traducteur de schémas', icon: PenTool, couleur: '#C9A3FF', attendus: [117], pret: false,
        texte: 'Des photos de circuits aux symboles',
        detail: 'D’un côté, la photo d’un vrai montage ; de l’autre, l’élève le dessine avec les symboles officiels (pile, ampoule, interrupteur, moteur, fil). Et l’inverse : construire le montage à partir d’un schéma.',
      },
      {
        id: 'depanneur', code: 'E5', titre: 'Le dépanneur', icon: Wrench, couleur: '#FFB86B', attendus: [111, 112, 114], pret: false,
        texte: 'Ça ne s’allume pas : trouve la panne',
        detail: 'Des circuits en panne : fil débranché, ampoule grillée, pile vide, interrupteur ouvert, matériau isolant dans la boucle. L’élève teste, observe et répare, avec des indices du chef d’atelier.',
      },
      {
        id: 'maison', code: 'E6', titre: 'La maison à éclairer', icon: Home, couleur: '#FF8AD8', attendus: [110, 116], pret: false,
        texte: 'Le projet : câbler une maison miniature',
        detail: 'Le projet du référentiel en version écran : éclairer chaque pièce d’une maison avec ses interrupteurs, une sonnette à la porte, un ventilateur… Prépare la vraie réalisation en classe.',
      },
      {
        id: 'danger', code: 'E7', titre: 'Danger, électricité !', icon: TriangleAlert, couleur: '#FF6B7A', attendus: [], pret: false,
        texte: 'Bonus sécurité : repère les dangers',
        detail: 'Une maison en photos : prises surchargées, appareil près de l’eau, fil abîmé… Pourquoi une pile de 4,5 V est sans danger, mais jamais la prise du mur.',
      },
      {
        id: 'defi', code: 'E8', titre: 'Défi éclair', icon: Zap, couleur: '#FFE45E', attendus: [114], pret: false,
        texte: '60 secondes de vocabulaire électrique',
        detail: 'Générateur, récepteur, conducteur, isolant, circuit ouvert ou fermé : le même défi chronométré, avec son tableau des records.',
      },
      {
        id: 'ampoule', code: 'E9', titre: 'Au cœur de l’ampoule', icon: Lightbulb, couleur: '#FFD27A', attendus: [111], pret: false,
        texte: 'Ce qui se passe à l’intérieur',
        detail: 'Vraies photos au macro d’une ampoule à filament et d’une LED : le chemin du courant à l’intérieur, et pourquoi l’ampoule chauffe autant.',
      },
    ],
  },
]

export const EXPERIENCE = Object.fromEntries(EXPERIENCES.map((e) => [e.id, e]))

// Anciennes adresses (avant les expériences) → nouvelles, pour les QR codes déjà imprimés
export const ANCIENNES_ADRESSES = ['miroir', 'puzzle', 'bras', 'qui-tire', 'pantin', 'protection', 'reflexes', 'dissection', 'explorateur', 'cousins', 'urgences', 'defi']
