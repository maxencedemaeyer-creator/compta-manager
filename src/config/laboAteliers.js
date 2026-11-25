import {
  Activity,
  Droplets,
  HeartPulse,
  Route,
  Stethoscope,
  Timer,
  Truck,
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
  Tags,
  Megaphone,
  ToggleLeft,
  TriangleAlert,
  Wrench,
  Zap,
  Orbit,
  RefreshCcw,
  Moon,
  Eclipse,
  Sun,
  Ruler,
  Rocket,
  Milestone,
  Telescope,
  BookA,
  CloudMoon,
  Sparkles,
  Flower2,
  Egg,
  CalendarDays,
  ShieldCheck,
  Droplet,
  Smile,
  CircleHelp,
  Users,
  Hourglass,
  Thermometer,
  Clock,
} from 'lucide-react'

// =============================================================
//  Le labo de sciences : les EXPÉRIENCES (une par chapitre) et
//  leurs ACTIVITÉS (les jeux).
//
//  Chaque activité a une identité « comme une appli » :
//    nom      : UN mot (affiché en grand, police des jeux)
//    consigne : une phrase très courte, à l'impératif
//    icon + couleur : son logo
//    test: true → l'activité « Défi » (quiz-bilan de l'expérience,
//                 carte jaune mise en évidence)
//
//  NON AFFICHÉ (gardé pour une prochaine fonctionnalité) :
//    attendus : n° des attendus du référentiel de Max liés à
//               l'activité (ex. A2 → 112 et 113)
//    niveau, chapitre, attendus de l'expérience.
//
//  Pour ajouter un chapitre : un objet dans EXPERIENCES.
//  Pour ajouter un jeu : une activité dans son expérience
//  + sa vue dans App.jsx (LABO_JEUX, clé « experience/activite »).
//  Une activité avec « pret: false » s'affiche « bientôt ».
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
    chiffres: ['206 os', '≈ 640 muscles', '≈ 360 articulations'],
    visuel: 'squelette',
    explorateur: { titre: 'Le corps humain en 3D', lien: 'explorateur' },
    vedette: { id: 'miroir', texte: 'Scanne ta main, puis un copain : leurs os apparaissent en direct.' },
    activites: [
      { id: 'miroir', code: 'A1', nom: 'Rayons X', consigne: 'Vois tes os en direct', icon: ScanFace, couleur: '#6FEFFF', attendus: [112, 113, 120, 121] },
      { id: 'puzzle', code: 'A2', nom: 'Explosion', consigne: 'Remonte un vrai squelette en 3D', icon: Bone, couleur: '#9DFF8A', attendus: [112, 113] },
      { id: 'bras', code: 'A3', nom: 'Tendons', consigne: 'Accroche les muscles', icon: Dumbbell, couleur: '#C9A3FF', attendus: [111, 117, 118, 120] },
      { id: 'qui-tire', code: 'A4', nom: 'Muscles', consigne: 'Trouve le muscle qui tire', icon: Activity, couleur: '#FFB86B', attendus: [120, 121] },
      { id: 'pantin', code: 'A5', nom: 'Danse', consigne: 'Place les articulations et danse', icon: PersonStanding, couleur: '#FF8AD8', attendus: [113, 120] },
      { id: 'protection', code: 'A6', nom: 'Bouclier', consigne: 'Soutien, mouvement ou protection ?', icon: Shield, couleur: '#7CB8FF', attendus: [115] },
      { id: 'reflexes', code: 'A7', nom: 'Réflexes', consigne: 'Teste ta vitesse', icon: Brain, couleur: '#FFD27A', attendus: [114] },
      { id: 'dissection', code: 'A8', nom: 'Scalpel', consigne: 'Dissèque couche par couche', icon: Microscope, couleur: '#FF8A95', attendus: [119, 120] },
      { id: 'cousins', code: 'A9', nom: 'Animaux', consigne: 'Trouve tes os chez les animaux', icon: Bird, couleur: '#9DE7C2', attendus: [112] },
      { id: 'urgences', code: 'A10', nom: 'Urgence', consigne: 'Soigne de vraies fractures', icon: Siren, couleur: '#FF6B7A', attendus: [112, 115] },
      { id: 'defi', code: 'A11', nom: 'Défi', consigne: 'Le grand test : bats le record !', test: true, icon: Zap, couleur: '#FFE45E', attendus: [112, 113, 116] },
      { id: 'jacques', code: 'A12', nom: 'Jacques a dit', consigne: 'Touche la bonne partie du squelette', icon: Megaphone, couleur: '#6FEFFF', attendus: [] },
      { id: 'etiqueteuse', code: 'A13', nom: 'Étiqueteuse', consigne: 'Colle les mots sur le corps', icon: Tags, couleur: '#FFB86B', attendus: [] },
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
    chiffres: ['piles de 1,5 V à 9 V', 'circuits calculés pour de vrai'],
    visuel: 'ampoule',
    vedette: { id: 'banc', texte: 'L’atelier libre : un magasin de matériel et carte blanche pour inventer tes circuits.' },
    activites: [
      {
        id: 'banc', code: 'E1', nom: 'Atelier', consigne: 'Invente tes circuits', icon: Cable, couleur: '#FFE45E', attendus: [111, 112, 116],
        detail: 'L’atelier libre : un magasin de matériel (piles, ampoules, lampes LED, moteur, sonnette, interrupteurs, bouton-poussoir, console, enceinte). On pose, on tire les fils, le circuit est calculé pour de vrai (loi d’Ohm). Série, dérivation, court-circuit avec flammes, ampoule qui grille à 9 V… et un carnet de 13 découvertes à débloquer.',
      },
      {
        id: 'testeur', code: 'E2', nom: 'Testeur', consigne: 'Conducteur ou isolant ?', icon: SearchCheck, couleur: '#3EC9FF', attendus: [113, 115],
        detail: 'Un circuit testeur avec deux pinces. On prédit, puis on glisse l’objet : clé, trombone, pièce, aluminium, cuillère, mine de crayon, gomme, règle, bois, verre, papier, liège, élastique, laine. L’ampoule répond, le tableau se remplit (la mine de crayon conduit, mais faiblement !).',
      },
      {
        id: 'interrupteur', code: 'E3', nom: 'Interrupteur', consigne: 'Ouvert ou fermé ?', icon: ToggleLeft, couleur: '#9DFF8A', attendus: [112, 116],
        detail: 'Huit missions vérifiées par le calcul du circuit : allumer, ajouter l’interrupteur, la sonnette au bouton, inverser le moteur, série, dérivation, éteindre une lampe sur deux, un interrupteur par récepteur. Indices à la demande.',
      },
      {
        id: 'schemas', code: 'E4', nom: 'Schémas', consigne: 'Traduis en symboles', icon: PenTool, couleur: '#C9A3FF', attendus: [117],
        detail: 'Photo d’un vrai montage → quel schéma ? Schéma → quel montage ? Quel est ce symbole ? Puis l’inverse : réaliser le montage à partir d’un schéma normalisé, vérifié borne par borne.',
      },
      {
        id: 'depanneur', code: 'E5', nom: 'Dépanneur', consigne: 'Trouve la panne', icon: Wrench, couleur: '#FFB86B', attendus: [111, 112, 114],
        detail: 'Neuf circuits en panne : fil débranché, ampoule grillée, pile usée, interrupteur ouvert, gomme dans la boucle, lampe LED à l’envers, court-circuit, série coupée, double panne. On inspecte, on répare, puis on nomme la panne.',
      },
      {
        id: 'maison', code: 'E6', nom: 'Maison', consigne: 'Éclaire toutes les pièces', icon: Home, couleur: '#FF8AD8', attendus: [110, 116],
        detail: 'Le projet du référentiel à l’écran : câbler depuis la pile de la cave la chambre, la cuisine, le ventilateur de la salle de jeux, la sonnette de l’entrée, puis l’interrupteur général. La vérification essaie toutes les positions des interrupteurs.',
      },
      {
        id: 'danger', code: 'E7', nom: 'Danger', consigne: 'Repère les dangers', icon: TriangleAlert, couleur: '#FF6B7A', attendus: [],
        detail: 'L’échelle des tensions, de la pile (1,5 V) à la foudre, et 14 situations « danger ou bon réflexe ? » expliquées : prise, bain, multiprises, fil abîmé, lignes à haute tension, court-circuit…',
      },
      {
        id: 'defi', code: 'E8', nom: 'Défi', consigne: 'Le grand test : bats le record !', test: true, icon: Zap, couleur: '#FFE45E', attendus: [114],
        detail: 'Des circuits tirés au hasard (le moteur de calcul donne la réponse), des symboles et du vocabulaire : générateur, récepteur, conducteur, isolant, ouvert, fermé. Tableau des records de la classe.',
      },
      {
        id: 'ampoule', code: 'E9', nom: 'Ampoule', consigne: 'Regarde à l’intérieur', icon: Lightbulb, couleur: '#FFD27A', attendus: [111],
        detail: 'La coupe d’une ampoule à filament : on touche chaque partie, on suit le trajet du courant du plot au culot, on règle la tension de 0 à 9 V (le filament rougit, blanchit, puis grille). Et la comparaison avec la lampe LED.',
      },
    ],
  },
  {
    id: 'circulation',
    numero: '03',
    titre: 'Le système circulatoire',
    accroche: 'Cœur, artères, veines et sang : le grand voyage qui nourrit chaque partie de ton corps.',
    niveau: 'P5-P6',
    chapitre: 'Les liens entre les systèmes respiratoire, circulatoire et digestif',
    attendus: '66 à 70',
    couleur: '#FF4D6D',
    couleur2: '#4DA3FF',
    rgb: '255,77,109',
    rgb2: '77,163,255',
    chiffres: ['≈ 100 000 battements par jour', '≈ 5 litres de sang'],
    visuel: 'coeur',
    explorateur: { titre: 'Le système circulatoire en 3D', lien: 'explorateur' },
    vedette: { id: 'coeur', texte: 'Un vrai cœur humain en 3D qui bat : ouvre-le et suis le sang de cavité en cavité.' },
    activites: [
      { id: 'coeur', code: 'C1', nom: 'Cœur', consigne: 'Ouvre un vrai cœur 3D', icon: HeartPulse, couleur: '#FF4D6D', attendus: [66, 70] },
      { id: 'voyage', code: 'C2', nom: 'Voyage', consigne: 'Suis une goutte de sang', icon: Route, couleur: '#FF8A5C', attendus: [66, 67, 69] },
      { id: 'artere-veine', code: 'C3', nom: 'Aller-retour', consigne: 'Artère ou veine ?', icon: Droplets, couleur: '#4DA3FF', attendus: [66, 70] },
      { id: 'pouls', code: 'C4', nom: 'Pouls', consigne: 'Mesure ton cœur', icon: Timer, couleur: '#FFD27A', attendus: [68] },
      { id: 'livreur', code: 'C5', nom: 'Livreur', consigne: 'Livre ce dont le corps a besoin', icon: Truck, couleur: '#9DFF8A', attendus: [67, 69] },
      { id: 'pompe', code: 'C6', nom: 'Pompe', consigne: 'Fais battre le cœur d’un coureur', icon: Activity, couleur: '#FF8AD8', attendus: [68, 69] },
      { id: 'animaux', code: 'C7', nom: 'Animaux', consigne: 'Écoute le cœur des animaux', icon: Stethoscope, couleur: '#9DE7C2', attendus: [68] },
      { id: 'defi', code: 'C8', nom: 'Défi', consigne: 'Le grand test : bats le record !', test: true, icon: Zap, couleur: '#FFE45E', attendus: [66, 67, 70] },
    ],
  },
  {
    id: 'espace',
    numero: '04',
    titre: 'L’espace',
    accroche: 'Soleil, Terre, Lune, planètes, comètes, galaxies : comment tout cela bouge-t-il dans le ciel ?',
    niveau: 'P5-P6',
    chapitre: 'Les mouvements de la Terre autour du Soleil',
    attendus: '99 à 109',
    couleur: '#A66BFF',
    couleur2: '#FFA24D',
    rgb: '166,107,255',
    rgb2: '255,162,77',
    chiffres: ['8 planètes', '≈ 8 min 20 s de lumière du Soleil à la Terre'],
    visuel: 'espace',
    fond: 'espace',
    vedette: { id: 'systeme', texte: 'Les 8 planètes en orbite autour du Soleil, en 3D : touche-en une pour la découvrir.' },
    activites: [
      { id: 'systeme', code: 'S1', nom: 'Système', consigne: 'Les 8 planètes en orbite', icon: Orbit, couleur: '#A66BFF', attendus: [99, 100] },
      { id: 'rotation', code: 'S2', nom: 'Rotation', consigne: 'Jour ou nuit ?', icon: RefreshCcw, couleur: '#FFA24D', attendus: [99, 102, 103, 105, 109],
        detail: 'La Terre tourne sur elle-même en 24 h. Pose un observateur (Bruxelles, l’Australie…) et dis s’il fait jour ou nuit, à quelle heure le Soleil se lève.' },
      { id: 'revolution', code: 'S3', nom: 'Révolution', consigne: 'Un tour autour du Soleil', icon: Rocket, couleur: '#FF7AC8', attendus: [99, 102, 103],
        detail: 'En une année, la Terre fait un tour autour du Soleil… et 365 tours sur elle-même. Rotation et révolution en même temps.' },
      { id: 'phases', code: 'S4', nom: 'Phases', consigne: 'Pourquoi la Lune change ?', icon: Moon, couleur: '#FFD27A', attendus: [101, 104],
        detail: 'La Lune tourne autour de la Terre en 27 jours. Vue du dessus, puis vue depuis la Terre : retrouve les 8 phases.' },
      { id: 'eclipses', code: 'S5', nom: 'Éclipses', consigne: 'Aligne Soleil, Terre, Lune', icon: Eclipse, couleur: '#FF8A6B', attendus: [101, 104],
        detail: 'Éclipse de Soleil, éclipse de Lune : pourquoi n’y en a-t-il pas tous les mois ? (l’orbite de la Lune est inclinée).' },
      { id: 'saisons', code: 'S6', nom: 'Saisons', consigne: 'Pourquoi l’été et l’hiver ?', icon: CloudMoon, couleur: '#7CFFB5', attendus: [99, 102, 107],
        detail: 'L’axe de la Terre est incliné de 23,4° : c’est lui, et non la distance au Soleil, qui fait les saisons.' },
      { id: 'planetes', code: 'S7', nom: 'Planètes', consigne: 'Range les 8 planètes', icon: Sparkles, couleur: '#C9A3FF', attendus: [100, 108],
        detail: 'Dans l’ordre, de la plus proche à la plus lointaine, de la plus petite à la plus grosse. Rocheuses ou géantes ?' },
      { id: 'echelle', code: 'S8', nom: 'Échelle', consigne: 'Vois la vraie taille', icon: Ruler, couleur: '#FFB86B', attendus: [99, 100],
        detail: 'Si le Soleil était un ballon, où serait la Terre ? Les vraies tailles et les vraies distances, et la lumière qui voyage.' },
      { id: 'cometes', code: 'S9', nom: 'Comètes', consigne: 'Suis une comète', icon: Milestone, couleur: '#FF9AE0', attendus: [],
        detail: 'Une orbite très allongée : la comète file près du Soleil, sa queue pointe toujours à l’opposé du Soleil.' },
      { id: 'galaxie', code: 'S10', nom: 'Galaxie', consigne: 'Zoome jusqu’à la Voie lactée', icon: Telescope, couleur: '#E56BFF', attendus: [100],
        detail: 'Le Soleil est une étoile parmi des centaines de milliards, dans la Voie lactée. Et il existe d’autres galaxies.' },
      { id: 'modeles', code: 'S11', nom: 'Modèles', consigne: 'Qui tourne autour de qui ?', icon: BookA, couleur: '#FFD27A', attendus: [99, 106, 107],
        detail: 'Les idées ont changé au cours de l’Histoire : la Terre au centre, puis le Soleil au centre.' },
      { id: 'mots', code: 'S12', nom: 'Mots', consigne: 'Rotation, révolution, satellite…', icon: Tags, couleur: '#A66BFF', attendus: [100, 108],
        detail: 'Le vocabulaire de l’espace : rotation, révolution, satellite, étoile, planète, modèle.' },
      { id: 'defi', code: 'S13', nom: 'Défi', consigne: 'Le grand test : bats le record !', test: true, icon: Zap, couleur: '#FFE45E', attendus: [99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109] },
    ],
  },
  {
    id: 'regles',
    numero: '05',
    titre: 'Les règles',
    accroche: 'Comprendre le cycle, le corps et les protections : mieux se connaître pour mieux comprendre les autres.',
    niveau: 'P6',
    chapitre: 'Éducation menstruelle (prolonge l’animation « Règles de 3 » de BruZelle asbl)',
    attendus: '',
    couleur: '#E0708A',
    couleur2: '#6FB39B',
    rgb: '224,112,138',
    rgb2: '111,179,155',
    chiffres: ['un cycle de 21 à 35 jours', 'des règles de 2 à 7 jours'],
    visuel: 'regles',
    // Thème clair (fond crème, schémas dessinés, pas de 3D) : salle et jeux propres, voir components/labo/regles/
    clair: true,
    // Masquée pour les élèves tant que le prof ne l'a pas activée (Espace prof)
    masqueeParDefaut: true,
    vedette: { id: 'cycle', texte: 'Fais défiler les jours d’un cycle et regarde ce qui change dans l’ovaire et l’utérus.' },
    activites: [
      { id: 'dedans', code: 'R1', nom: 'Dedans', consigne: 'Découvre l’intérieur du corps', icon: Flower2, couleur: '#F4A6A0', attendus: [] },
      { id: 'cycle', code: 'R2', nom: 'Cycle', consigne: 'Suis un cycle jour après jour', icon: Clock, couleur: '#9BCBB0', attendus: [] },
      { id: 'ovule', code: 'R3', nom: 'Ovule', consigne: 'Suis le voyage d’un ovule', icon: Egg, couleur: '#F6C77E', attendus: [] },
      {
        id: 'calendrier', code: 'R4', nom: 'Calendrier', consigne: 'Prévois les prochaines règles', icon: CalendarDays, couleur: '#8DB9D9', attendus: [], pret: false,
        detail: 'On suit des personnages fictifs sur plusieurs cycles (courts, longs, irréguliers au début) et on prédit leurs prochaines règles.',
      },
      { id: 'protections', code: 'R5', nom: 'Protections', consigne: 'Serviette, tampon, cup… qui est qui ?', icon: ShieldCheck, couleur: '#B9A6DA', attendus: [] },
      {
        id: 'absorbe', code: 'R6', nom: 'Absorbe', consigne: 'Comment ça absorbe ?', icon: Droplet, couleur: '#7FC8D6', attendus: [], pret: false,
        detail: 'Le rôle des protections avec une mini-expérience d’absorption, et une jauge pour se rendre compte de la vraie quantité de sang (quelques cuillères à soupe en tout).',
      },
      { id: 'premieres', code: 'R7', nom: 'Premières', consigne: 'Premières règles : que faire ?', icon: Sparkles, couleur: '#F2B3C6', attendus: [] },
      {
        id: 'humeurs', code: 'R8', nom: 'Humeurs', consigne: 'Pourquoi les humeurs changent ?', icon: Smile, couleur: '#F6D58E', attendus: [], pret: false,
        detail: 'Hormones, humeur, fatigue, boutons : ça varie, et pas pareil chez tout le monde.',
      },
      {
        id: 'douleurs', code: 'R9', nom: 'Douleurs', consigne: 'Normal ou à montrer ?', icon: Thermometer, couleur: '#F2A65A', attendus: [], pret: false,
        detail: 'Les crampes, ce qui aide (chaleur, mouvement, repos) et les signes qui méritent d’en parler à un adulte ou à un médecin.',
      },
      { id: 'vrai-faux', code: 'R10', nom: 'Vrai ou faux', consigne: 'Démonte les idées reçues', icon: CircleHelp, couleur: '#A8D5A2', attendus: [] },
      {
        id: 'toute-la-vie', code: 'R11', nom: 'Toute la vie', consigne: 'De la puberté à la ménopause', icon: Hourglass, couleur: '#C9B8E8', attendus: [], pret: false,
        detail: 'Une frise de vie : toutes les personnes n’ont pas leurs règles, ni au même âge, ni en même quantité, ni toute leur vie.',
      },
      {
        id: 'ensemble', code: 'R12', nom: 'Ensemble', consigne: 'Comprendre les autres', icon: Users, couleur: '#F4B8A0', attendus: [], pret: false,
        detail: 'Les dimensions sociales et culturelles, les mots justes et comment réagir avec bienveillance à l’école.',
      },
      { id: 'defi', code: 'R13', nom: 'Défi', consigne: 'Le grand test : sans chrono !', test: true, icon: Zap, couleur: '#FFE45E', attendus: [] },
    ],
  },
]

export const EXPERIENCE = Object.fromEntries(EXPERIENCES.map((e) => [e.id, e]))

// L'activité d'une adresse : /labo/locomoteur/puzzle → { experience, activite }
export function activiteDepuisAdresse(chemin) {
  const [, , exp, id] = chemin.replace(/\/+$/, '').split('/')
  const experience = EXPERIENCE[exp]
  const activite = experience?.activites.find((a) => a.id === id)
  return { experience, activite }
}

// Anciennes adresses (avant les expériences) → nouvelles, pour les QR codes déjà imprimés
export const ANCIENNES_ADRESSES = ['miroir', 'puzzle', 'bras', 'qui-tire', 'pantin', 'protection', 'reflexes', 'dissection', 'explorateur', 'cousins', 'urgences', 'defi']
