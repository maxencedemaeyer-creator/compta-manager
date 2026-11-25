// =============================================================
//  Les fiches de l'expérience « Les règles » : textes courts,
//  vérifiés, à la portée d'un élève de 10-12 ans.
//  Repères chiffrés (ordres de grandeur) :
//   - cycle : 21 à 35 jours en général, jour 1 = 1er jour des règles
//   - règles : 2 à 7 jours ; en tout, quelques cuillères à soupe de liquide
//   - ovulation : environ 14 jours avant les règles suivantes ; l'ovule vit 12 à 24 h
//   - premières règles : le plus souvent entre 9 et 16 ans
//   - ménopause : les règles s'arrêtent, vers 50 ans en général
// =============================================================

// Les parties du dessin (id = celui d'Anatomie.jsx)
export const PARTIES = {
  ovaire: {
    nom: 'Ovaire',
    phrase: 'Touche un ovaire',
    taille: 'à peu près comme une amande',
    texte: 'Il y en a deux, un de chaque côté. Les ovaires contiennent les ovules, des cellules minuscules (environ 0,1 mm), et fabriquent des hormones.',
    retiens: 'Environ une fois par cycle, un ovule mûrit et quitte un ovaire : c’est l’ovulation.',
  },
  trompe: {
    nom: 'Trompe utérine',
    phrase: 'Touche une trompe utérine',
    taille: 'un tube fin d’environ 10 cm',
    texte: 'Une trompe part de chaque côté de l’utérus. Son bout en forme de franges (le pavillon) attrape l’ovule quand il sort de l’ovaire, puis l’ovule avance dans la trompe vers l’utérus.',
    retiens: 'C’est dans la trompe qu’un ovule peut rencontrer un spermatozoïde.',
  },
  uterus: {
    nom: 'Utérus',
    phrase: 'Touche l’utérus',
    taille: 'en forme de poire renversée',
    texte: 'Un organe creux, fait de muscle solide mais souple. S’il y a une grossesse, c’est là que le bébé grandit.',
    retiens: 'Pendant les règles, ses muscles se contractent : ce sont parfois les crampes.',
  },
  endometre: {
    nom: 'Endomètre',
    phrase: 'Touche l’endomètre',
    taille: 'la couche douce à l’intérieur de l’utérus',
    texte: 'Il tapisse l’intérieur de l’utérus. Au fil du cycle, il s’épaissit, comme un petit nid prêt à accueillir un embryon.',
    retiens: 'Si aucun embryon ne s’y installe, l’endomètre se détache : ce sont les règles.',
  },
  col: {
    nom: 'Col de l’utérus',
    phrase: 'Touche le col de l’utérus',
    taille: 'le bas de l’utérus, étroit',
    texte: 'Un passage très étroit qui relie l’utérus au vagin. Le sang des règles passe par là pour sortir du corps.',
    retiens: 'Il est tellement étroit qu’un tampon ne peut jamais le traverser ni « se perdre » dans le corps.',
  },
  vagin: {
    nom: 'Vagin',
    phrase: 'Touche le vagin',
    taille: 'un conduit souple d’environ 8 à 10 cm',
    texte: 'Un conduit musclé et souple qui va de l’utérus jusqu’à l’extérieur du corps. Ses parois peuvent s’étirer.',
    retiens: 'Les règles sortent par le vagin, pas par le trou du pipi : ce sont deux ouvertures différentes.',
  },
}
export const ORDRE_PARTIES = ['ovaire', 'trompe', 'uterus', 'endometre', 'col', 'vagin']

// Les 4 étapes du cycle
export const ETAPES = {
  regles: {
    nom: 'Les règles',
    savant: 'menstruation',
    couleur: '#D9647C',
    fond: '#FBE3E6',
    texte: '#A3324C',
    resume: 'L’endomètre se détache et sort par le vagin avec un peu de sang.',
    detail:
      'C’est le début d’un nouveau cycle : le jour 1 est le premier jour des règles. Elles durent en général de 2 à 7 jours. Ce qui s’écoule, c’est du sang et de petits morceaux de l’endomètre. Il y en a seulement quelques cuillères à soupe en tout.',
  },
  avant: {
    nom: 'Avant l’ovulation',
    savant: 'phase folliculaire',
    couleur: '#5E9C86',
    fond: '#E3F1EA',
    texte: '#2F6F5C',
    resume: 'Dans l’ovaire, des follicules grossissent. L’endomètre se reconstruit.',
    detail:
      'Plusieurs petits follicules (des poches qui contiennent chacune un ovule) commencent à grossir, mais un seul devient le plus gros. En même temps, l’endomètre s’épaissit de nouveau. Les spécialistes disent que la phase folliculaire commence dès le jour 1 : elle comprend donc aussi les règles.',
  },
  ovulation: {
    nom: 'L’ovulation',
    savant: 'ovulation',
    couleur: '#E59A2E',
    fond: '#FDEBD3',
    texte: '#8A4F0C',
    resume: 'Un ovule mûr sort de l’ovaire et entre dans la trompe.',
    detail:
      'Le plus gros follicule s’ouvre et libère son ovule. Les franges de la trompe l’attrapent. L’ovule ne vit que 12 à 24 heures. L’ovulation a lieu environ 14 jours avant les règles suivantes : c’est pour ça qu’elle n’est pas toujours « au milieu » du cycle.',
  },
  apres: {
    nom: 'Après l’ovulation',
    savant: 'phase lutéale',
    couleur: '#8B74C4',
    fond: '#EEE8F8',
    texte: '#5A4590',
    resume: 'Le follicule vide devient le corps jaune. L’endomètre est prêt.',
    detail:
      'Le follicule vide se transforme en corps jaune, qui fabrique des hormones pour garder l’endomètre épais. Cette phase dure à peu près 14 jours. S’il n’y a pas de grossesse, le corps jaune s’éteint, l’endomètre se détache : de nouvelles règles commencent.',
  },
}
export const ORDRE_ETAPES = ['regles', 'avant', 'ovulation', 'apres']

// Les 5 protections
export const PROTECTIONS = {
  serviette: {
    nom: 'Serviette jetable',
    court: 'Se colle dans la culotte',
    qui: 'Je me colle dans la culotte et je suis jetable.',
    comment: 'On la colle au milieu de la culotte. Elle absorbe le sang. Il en existe de plusieurs tailles et épaisseurs (jour, nuit).',
    duree: 'Se change environ toutes les 4 heures',
    plus: ['Facile à utiliser, rien à introduire dans le corps', 'Pratique pour débuter'],
    savoir: ['On l’enveloppe et on la jette à la poubelle, pas dans les toilettes', 'Elle produit des déchets'],
    jetable: true,
  },
  lavable: {
    nom: 'Serviette lavable',
    court: 'En tissu, se lave',
    qui: 'Je suis en tissu, je me clipse autour de la culotte et je me lave.',
    comment: 'Une serviette en tissu qui se ferme avec des petits boutons-pression autour de la culotte. Après usage, on la rince puis on la lave.',
    duree: 'Se change comme une serviette jetable (environ 4 heures)',
    plus: ['Réutilisable pendant des années', 'Moins de déchets'],
    savoir: ['Il faut un petit sac pour emporter celle qui est sale', 'Il faut la rincer et la laver'],
    jetable: false,
  },
  tampon: {
    nom: 'Tampon',
    court: 'S’introduit dans le vagin',
    qui: 'J’ai un petit fil pour me retirer et je m’introduis dans le vagin.',
    comment: 'Un petit cylindre qui absorbe le sang à l’intérieur du vagin. Le petit fil permet de le retirer. On choisit la plus petite taille qui suffit.',
    duree: 'Se change toutes les 4 à 6 heures, jamais plus de 8 heures',
    plus: ['Invisible, on peut nager', 'Confortable quand on bouge'],
    savoir: ['Respecter la durée est important : cela évite une infection rare mais grave', 'Il ne peut pas se perdre : le col est trop étroit', 'Rien n’oblige à l’utiliser'],
    jetable: true,
  },
  cup: {
    nom: 'Cup menstruelle',
    court: 'Une petite coupe en silicone',
    qui: 'Je recueille le sang au lieu de l’absorber.',
    comment: 'Une petite coupe souple en silicone médical. On la plie, on la place dans le vagin : elle recueille le sang au lieu de l’absorber. On la vide, on la rince.',
    duree: 'Se vide environ toutes les 8 à 12 heures, selon l’abondance des règles',
    plus: ['Réutilisable pendant des années', 'Peu de déchets'],
    savoir: ['Il faut un peu d’entraînement', 'Il existe plusieurs tailles', 'Il faut la nettoyer avant chaque nouvelle période de règles'],
    jetable: false,
  },
  culotte: {
    nom: 'Culotte menstruelle',
    court: 'Une culotte qui absorbe',
    qui: 'Je suis une culotte qui absorbe le sang.',
    comment: 'Une culotte avec plusieurs couches qui absorbent le sang. On la porte comme une culotte normale, puis on la rince et on la lave.',
    duree: 'Selon le modèle : de quelques heures à une journée',
    plus: ['Confortable, rien à introduire', 'Réutilisable, moins de déchets'],
    savoir: ['Elle s’adapte à l’abondance des règles selon le modèle', 'On la rince à l’eau froide avant de la laver', 'Il faut en avoir plusieurs'],
    jetable: false,
  },
}
export const ORDRE_PROTECTIONS = ['serviette', 'lavable', 'tampon', 'cup', 'culotte']

// Idées reçues (Vrai ou faux). vrai = la bonne réponse à l'affirmation
export const IDEES = [
  { id: 'baignade', vrai: true, texte: 'On peut se baigner ou aller à la piscine pendant ses règles.', expl: 'Oui ! Il suffit d’avoir une protection adaptée à l’eau, comme un tampon, une cup ou un maillot menstruel.' },
  { id: 'sport', vrai: false, texte: 'Pendant les règles, il vaut mieux ne pas faire de sport.', expl: 'Faux. On peut faire du sport si on en a envie : bouger aide même souvent contre les crampes. Et si on est fatigué·e, on s’écoute.' },
  { id: 'pareil', vrai: false, texte: 'Tout le monde a ses règles exactement de la même façon.', expl: 'Faux. Le nombre de jours, la quantité, les douleurs, les humeurs : tout varie d’une personne à l’autre.' },
  { id: 'quantite', vrai: false, texte: 'Pendant les règles, on perd énormément de sang.', expl: 'Faux. En tout, c’est seulement quelques cuillères à soupe (environ 30 à 80 ml), étalées sur plusieurs jours.' },
  { id: 'tous', vrai: false, texte: 'Seules les filles ont besoin de comprendre les règles.', expl: 'Faux. Les comprendre aide à respecter les autres et à les soutenir : une sœur, une copine, une maman… Cela concerne tout le monde.' },
  { id: 'sale', vrai: false, texte: 'Les règles, c’est sale.', expl: 'Faux. C’est une partie normale du fonctionnement du corps : du sang et de petits morceaux de l’endomètre. On se lave comme d’habitude.' },
  { id: 'age', vrai: false, texte: 'Les premières règles arrivent au même âge pour tout le monde.', expl: 'Faux. Elles arrivent le plus souvent entre 9 et 16 ans. Chaque corps a son rythme.' },
  { id: 'vingthuit', vrai: false, texte: 'Un cycle dure toujours exactement 28 jours.', expl: 'Faux. 28 jours, c’est une moyenne. Un cycle dure en général de 21 à 35 jours, et il est souvent irrégulier au début.' },
  { id: 'grossesse', vrai: true, texte: 'Pendant une grossesse, on n’a plus de règles.', expl: 'Vrai. L’endomètre reste en place pour accueillir le bébé : il ne se détache plus.' },
  { id: 'douleur', vrai: false, texte: 'Avoir très mal pendant les règles, c’est toujours normal : il faut s’y habituer.', expl: 'Faux. Un peu de crampes, c’est fréquent. Mais si la douleur est forte ou empêche d’aller à l’école, il faut en parler à un adulte ou à un médecin.' },
  { id: 'perdu', vrai: false, texte: 'Un tampon peut se perdre dans le corps.', expl: 'Faux. Le col de l’utérus est trop étroit : un tampon ne peut pas aller plus loin que le vagin.' },
  { id: 'vie', vrai: false, texte: 'On a ses règles toute sa vie.', expl: 'Faux. Elles s’arrêtent à la ménopause, vers 50 ans en général.' },
  { id: 'pipi', vrai: false, texte: 'Le sang des règles sort par le même trou que le pipi.', expl: 'Faux. Les règles sortent par le vagin ; le pipi sort par l’urètre. Ce sont deux ouvertures différentes.' },
  { id: 'changer', vrai: true, texte: 'Il faut changer sa protection régulièrement, même si elle n’est pas pleine.', expl: 'Vrai. Selon la protection, on la change ou on la vide toutes les quelques heures, pour rester au propre et au sec.' },
  { id: 'parler', vrai: true, texte: 'Parler des règles, c’est normal et utile.', expl: 'Vrai. Poser des questions et partager ce qu’on ressent aide à mieux comprendre son corps, et celui des autres.' },
  { id: 'ecole', vrai: false, texte: 'Pendant les règles, on ne peut pas aller à l’école ni faire ses activités.', expl: 'Faux. On peut faire tout ce qu’on fait d’habitude. Si on a besoin d’une pause ou d’une protection, on peut le dire à un adulte.' },
]
