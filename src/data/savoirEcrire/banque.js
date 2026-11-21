// =============================================================
//  Savoir écrire — banque d'idées
//
//  Une idée = un SUJET (consigne) + une FORME (type d'écrit) + un DÉFI.
//  - POOLS      : listes de lieux, personnages, objets… tirées au hasard
//                 pour remplir les {trous} des consignes.
//  - GABARITS   : consignes liées à une compétence (tags : voir tags.js).
//                 Un {nom} est remplacé par un élément du pool du même nom ;
//                 {lieu} et {lieu2} donnent deux éléments différents.
//  - THEMES     : sujets libres quand aucune compétence précise n'est visée.
//  - FORMES     : types d'écrits (lettre, article, dialogue…).
//  - CONTRAINTES: défis ludiques valables pour tous les textes.
//
//  ⚠️ Règle de grammaire des pools : les éléments portent leur déterminant
//  (« un vieux pirate », « la cour de récréation »). Dans les consignes, ne
//  jamais les mettre après « de », « du », « à » suivis de l'article défini
//  (pas de « de {lieu} ») : préférer un verbe direct (« Décris {lieu} »)
//  ou « sur », « devant », « avec », « pour ». Un test vérifie les trous.
// =============================================================

export const POOLS = {
  lieu: [
    'la cour de récréation',
    'une forêt enneigée',
    'un vieux grenier',
    'la plage au lever du soleil',
    'un marché très animé',
    'une gare bondée',
    'la cantine à midi',
    'une bibliothèque silencieuse',
    'un parc d’attractions désert',
    'la montagne en été',
    'un petit port de pêche',
    'une grotte mystérieuse',
    'la chambre de tes grands-parents',
    'un champ de blé en été',
    'une station spatiale',
    'un château en ruines',
    'une rue pendant l’orage',
    'une piscine un jour de canicule',
    'la salle de classe un lundi matin',
    'un jardin le soir',
  ],
  personnage: [
    'un vieux pirate',
    'une institutrice très stricte',
    'un robot maladroit',
    'une championne de natation',
    'un chat qui parle',
    'un explorateur perdu',
    'une fée fatiguée',
    'un grand-père farceur',
    'une détective de dix ans',
    'un astronaute timide',
    'une boulangère très matinale',
    'un dragon végétarien',
    'un jardinier distrait',
    'une sorcière allergique à la magie',
    'un facteur pressé',
    'un musicien ambulant',
  ],
  objet: [
    'un coffre fermé à clé',
    'une vieille montre arrêtée',
    'un parapluie magique',
    'une lampe de poche',
    'un carnet trouvé sur un banc',
    'une valise abandonnée',
    'un cerf-volant',
    'une boussole détraquée',
    'un sac à dos oublié',
    'une bouteille jetée à la mer',
    'un miroir étrange',
    'une clé rouillée',
    'un ballon rouge',
    'une carte au trésor déchirée',
  ],
  animal: [
    'un hérisson',
    'une tortue centenaire',
    'un perroquet bavard',
    'un renard',
    'une chouette',
    'un chien errant',
    'un petit poisson rouge',
    'une araignée tisseuse',
    'un cheval sauvage',
    'un chat de gouttière',
    'une cigogne',
    'un écureuil',
  ],
  evenement: [
    'le premier jour d’école',
    'une panne d’électricité',
    'une tempête de neige',
    'une fête d’anniversaire ratée',
    'un déménagement',
    'une sortie scolaire',
    'un match important',
    'une journée sans écran',
    'la rentrée',
    'la kermesse de l’école',
    'une visite surprise',
    'un voyage en train',
  ],
  epoque: [
    'au Moyen Âge',
    'à l’époque des dinosaures',
    'il y a cent ans',
    'dans cinquante ans',
    'au temps des grands-parents',
    'à l’âge de pierre',
    'au temps des chevaliers',
    'en l’an 3000',
  ],
  metier: [
    'pompier',
    'astronaute',
    'boulanger',
    'vétérinaire',
    'détective',
    'archéologue',
    'capitaine de navire',
    'pilote de course',
    'journaliste',
    'chef cuisinier',
  ],
  emotion: [
    'la joie',
    'la peur',
    'la surprise',
    'la colère',
    'la fierté',
    'la tristesse',
    'la honte',
    'l’impatience',
    'la curiosité',
    'le soulagement',
  ],
  meteo: [
    'un orage violent',
    'un brouillard épais',
    'une canicule',
    'une tempête de vent',
    'un grand soleil',
    'une pluie fine',
    'une journée de neige',
  ],
  science: [
    'le cœur',
    'le cycle de l’eau',
    'un volcan',
    'une éolienne',
    'le recyclage',
    'la digestion',
    'un circuit électrique',
    'le système solaire',
    'la photosynthèse',
    'le squelette',
  ],
  trois_mots: [
    'lanterne, brouillard, escalier',
    'miroir, silence, trésor',
    'fenêtre, courir, secret',
    'étoile, valise, mystère',
    'tempête, tricot, réveil',
    'horloge, jardin, murmure',
    'pont, cadeau, lumière',
    'chapeau, tonnerre, rire',
    'sentier, carnet, fatigue',
    'radio, neige, cachette',
    'île, orange, promesse',
    'bibliothèque, éclair, pantoufles',
  ],
}

// Types d'écrits. `genres` = les genres de consignes avec lesquels ils vont bien.
export const FORMES = [
  { id: 'recit', nom: 'Un petit récit', genres: ['recit'] },
  { id: 'journal', nom: 'Une page de journal intime', genres: ['recit', 'description', 'reflexif'] },
  { id: 'lettre', nom: 'Une lettre', genres: ['courrier', 'recit', 'argumenter', 'reflexif'] },
  { id: 'courriel', nom: 'Un courriel', genres: ['courrier', 'argumenter'] },
  { id: 'article', nom: 'Un article de journal', genres: ['expliquer', 'recit'] },
  { id: 'dialogue', nom: 'Un dialogue', genres: ['dialogue', 'recit'] },
  { id: 'carte', nom: 'Une carte postale', genres: ['description', 'recit', 'courrier'] },
  { id: 'affiche', nom: 'Une affiche publicitaire', genres: ['argumenter'] },
  { id: 'mode_emploi', nom: 'Un mode d’emploi', genres: ['consigne'] },
  { id: 'regles', nom: 'Une affiche de règles à respecter', genres: ['consigne'] },
  { id: 'guide', nom: 'Un petit guide illustré', genres: ['consigne'] },
  { id: 'fiche', nom: 'Une fiche documentaire', genres: ['expliquer', 'description'] },
  { id: 'portrait', nom: 'Un portrait', genres: ['description'] },
  { id: 'critique', nom: 'Un avis ou une critique', genres: ['argumenter'] },
  { id: 'discours', nom: 'Un petit discours', genres: ['argumenter'] },
  { id: 'bd', nom: 'Une bande dessinée (bulles et légendes)', genres: ['dialogue', 'recit'] },
  { id: 'bulletin', nom: 'Un bulletin radio ou télé', genres: ['expliquer', 'recit'] },
  { id: 'rapport', nom: 'Un rapport d’enquête', genres: ['recit', 'expliquer'] },
  { id: 'conte', nom: 'Un début de conte', genres: ['recit'] },
  { id: 'legendes', nom: 'Des légendes pour une série de photos', genres: ['description'] },
  { id: 'interview', nom: 'Une interview (questions et réponses)', genres: ['dialogue', 'expliquer'] },
  { id: 'scene', nom: 'Une scène de théâtre', genres: ['dialogue'] },
  { id: 'recit_je', nom: 'Un récit à la première personne', genres: ['recit', 'reflexif'] },
]

// Longueur conseillée selon le genre et le niveau
export const LONGUEURS = {
  recit: { P5: '6 à 8 lignes', P6: '8 à 12 lignes' },
  description: { P5: '5 à 7 lignes', P6: '6 à 10 lignes' },
  argumenter: { P5: '6 à 8 lignes', P6: '8 à 10 lignes' },
  dialogue: { P5: '6 répliques', P6: '8 répliques' },
  expliquer: { P5: '5 à 7 lignes', P6: '6 à 10 lignes' },
  courrier: { P5: '6 à 8 lignes', P6: '8 à 10 lignes' },
  reflexif: { P5: '4 à 6 lignes', P6: '5 à 8 lignes' },
  consigne: { P5: '5 à 6 consignes', P6: '6 à 8 consignes' },
}

// Sujets libres (pas de compétence précise) — des phrases complètes, sans trou
export const THEMES = [
  'le jour où l’école a été envahie par des fourmis',
  'un nouvel élève mystérieux arrive en cours d’année',
  'la journée où tous les devoirs ont disparu',
  'le sac à dos qui contenait un secret',
  'la récréation la plus folle de l’histoire',
  'quand la classe a changé de planète',
  'le maître qui s’est endormi en plein cours',
  'une cabane construite dans la forêt',
  'le dernier jour avant les grandes vacances',
  'un chien qui conduit un autobus',
  'la découverte d’un tunnel sous la cour de l’école',
  'une lettre qui arrive cent ans trop tard',
  'le robot qui voulait apprendre à rire',
  'la nuit où toutes les lumières de la ville se sont éteintes',
  'un voyage dans un livre',
  'les aventures d’une goutte d’eau',
  'le tour du monde en ballon',
  'un repas de famille qui tourne mal',
  'un match où tout peut arriver',
  'une journée dans la vie d’un nuage',
  'l’invention qui change tout',
  'le jour où les animaux ont pris la parole',
  'la maison où tout est à l’envers',
  'une chasse au trésor dans le quartier',
  'le secret de la bibliothèque',
  'une promesse difficile à tenir',
  'un cadeau inattendu',
  'la plus grande peur de ma vie',
  'un jour de pluie sans fin',
  'un nouveau voisin très étrange',
  'la forêt qui chuchote',
  'un trésor caché dans le jardin',
  'le tableau qui prend vie',
  'un anniversaire sur la Lune',
  'le jour où j’ai tout compris',
  'la grande évasion du hamster de la classe',
  'une fête surprise',
  'le dernier train de la soirée',
  'un cirque qui arrive dans le village',
  'une rencontre au bord de la rivière',
  'le mystère du goûter disparu',
  'une équipe de super-héros très ordinaires',
  'un vieux phare au bout du monde',
  'le message trouvé dans une bouteille',
  'un été à la ferme',
  'la classe de neige',
  'une chose que je n’ose dire à personne',
  'le jour où le temps s’est arrêté',
  'le concours de la plus grande invention',
  'une journée sans mots',
]

// Défis ludiques valables pour n'importe quel texte
export const CONTRAINTES = [
  'Commence par une question.',
  'Termine par une phrase surprenante.',
  'Utilise ces trois mots : {trois_mots}.',
  'Écris exactement 7 phrases.',
  'Commence ton texte par « Soudain, ».',
  'Inclus au moins une comparaison (comme, pareil à, tel…).',
  'Raconte du point de vue d’un objet.',
  'Utilise les cinq sens (vue, ouïe, odorat, goût, toucher).',
  'Donne un titre mystérieux à ton texte.',
  'Inclus un nombre et un prénom dans ton texte.',
  'Termine par une question.',
  'Écris en alternant phrases courtes et phrases longues.',
  'Place un mot que tu as appris cette semaine.',
  'Écris comme si tu parlais à un enfant de 6 ans.',
  'Cache un mot du thème dans chaque phrase.',
  'Utilise au moins deux mots de la liste du vocabulaire de la classe.',
  'Interdit d’utiliser le mot « très ».',
  'Fais parler un personnage à voix haute au moins une fois.',
  'Ajoute une phrase qui exprime une émotion.',
  'Écris ton texte en trois paragraphes.',
  'Utilise un mot que personne d’autre ne choisira dans la classe.',
  'Commence chaque phrase par un mot différent.',
  'Fais apparaître un élément de nature (arbre, vent, rivière…).',
  'Écris une phrase de plus de quinze mots.',
  'Imagine une fin ouverte qui donne envie de lire la suite.',
]

/*
 * GABARITS : { tags, genre: [...], texte, niveau? ('P5' ou 'P6'), forme? }
 *  - genre : famille de consigne (recit, description, argumenter, dialogue, expliquer, courrier, reflexif)
 *  - forme : si la consigne impose déjà son type d'écrit (ex. « Écris un dialogue… »)
 */
export const GABARITS = [
  // ---------------- Imparfait ----------------
  { tags: ['imparfait'], genre: ['description'], texte: 'Décris ton école il y a cent ans : que voyait-on, qu’entendait-on, que faisaient les élèves et les maîtres ?' },
  { tags: ['imparfait'], genre: ['recit', 'description'], texte: 'Raconte comment tu vivais quand tu avais cinq ans : ce que tu aimais, ce que tu craignais, tes habitudes.' },
  { tags: ['imparfait'], genre: ['description'], texte: 'Imagine que tu voyages {epoque} : décris ce que tu voyais, ce que tu entendais et ce que les gens faisaient chaque jour.' },
  { tags: ['imparfait'], genre: ['recit', 'description'], texte: 'Un vieil habitant raconte ses souvenirs sur {evenement}. Écris son récit en décrivant l’ambiance et ce que chacun faisait.' },
  { tags: ['imparfait'], genre: ['description'], texte: 'Imagine {personnage} à l’âge de dix ans : décris comment cette personne était, ce qu’elle aimait et ce qu’elle faisait chaque jour.' },
  { tags: ['imparfait'], genre: ['recit', 'reflexif'], texte: 'Tu retrouves {objet} dans un vieux tiroir. Écris tes souvenirs : quand tu t’en servais, ce qui se passait autour de toi, ce que tu ressentais.' },
  { tags: ['imparfait'], genre: ['description'], texte: 'Décris {meteo} dans ton village il y a longtemps : ce qu’on voyait, ce qu’on faisait pour s’en protéger.' },

  // ---------------- Passé composé ----------------
  { tags: ['passe_compose'], genre: ['recit'], texte: 'Raconte ta journée d’hier du réveil au coucher, avec des mots de temps (d’abord, puis, ensuite, enfin).' },
  { tags: ['passe_compose'], genre: ['recit', 'expliquer'], texte: 'Raconte {evenement} comme un reporter : qui a fait quoi, ce qui s’est passé, comment cela s’est terminé.' },
  { tags: ['passe_compose'], genre: ['recit'], texte: 'Ce matin, tu as rencontré {personnage}. Raconte ce qui s’est passé.' },
  { tags: ['passe_compose'], genre: ['recit', 'description'], texte: 'Raconte tes dernières vacances (ou ton dernier week-end) : où tu es allé(e), ce que tu as vu, ce que tu as mangé.' },
  { tags: ['passe_compose'], genre: ['recit'], texte: 'Un enfant a trouvé {objet}. Raconte toute l’enquête : ce qu’il a fait, ce qu’il a découvert.' },
  { tags: ['passe_compose'], genre: ['courrier', 'recit'], forme: 'Une carte postale', texte: 'Écris une carte postale : tu as visité {lieu}. Raconte ce que tu as fait.' },

  // ---------------- Futur ----------------
  { tags: ['futur'], genre: ['description', 'reflexif'], texte: 'Imagine ta vie dans vingt ans : où habiteras-tu, que feras-tu, qui seras-tu ?' },
  { tags: ['futur'], genre: ['expliquer'], texte: 'Écris la météo de demain pour {lieu} : que verra-t-on, qu’entendra-t-on, que ressentira-t-on ?' },
  { tags: ['futur'], genre: ['expliquer'], texte: 'Prédis ce qui va se passer demain à l’école, comme un voyant : écris au moins 6 prévisions.' },
  { tags: ['futur'], genre: ['expliquer', 'recit'], texte: 'Tu es {metier}. Écris ton programme de la semaine prochaine : ce que tu feras chaque jour.' },
  { tags: ['futur'], genre: ['description'], texte: 'Décris l’école de l’an 3000 : comment sera la classe, que fera-t-on, qu’apprendra-t-on ?' },
  { tags: ['futur'], genre: ['courrier', 'reflexif'], forme: 'Une lettre à toi-même', texte: 'Écris une lettre à toi-même, à ouvrir dans dix ans : dis ce que tu espères et ce que tu auras fait.' },

  // ---------------- Conditionnel ----------------
  { tags: ['conditionnel'], genre: ['recit'], texte: 'Si tu devenais {personnage} pendant une journée, que ferais-tu ? Écris ta journée.' },
  { tags: ['conditionnel'], genre: ['recit'], texte: 'Si tu trouvais {objet}, qu’en ferais-tu ? Écris ce qui arriverait ensuite.' },
  { tags: ['conditionnel'], genre: ['argumenter'], texte: 'Si tu pouvais changer une règle de l’école, laquelle choisirais-tu et pourquoi ? Écris au moins 4 phrases qui commencent par « Si… ».' },
  { tags: ['conditionnel'], genre: ['argumenter'], texte: 'Si tu étais maire de ta commune, que ferais-tu ? Écris ton programme.' },
  { tags: ['conditionnel'], genre: ['dialogue'], forme: 'Un dialogue', texte: 'Si les animaux pouvaient parler, que diraient-ils ? Écris la conversation avec {animal}.' },
  { tags: ['conditionnel'], genre: ['recit', 'description'], texte: 'Si tu voyageais {epoque}, que verrais-tu et que ferais-tu ?' },

  // ---------------- Plus-que-parfait (P6) ----------------
  { tags: ['plus_que_parfait'], niveau: 'P6', genre: ['recit'], texte: 'Un détective arrive devant {lieu}. Écris ce qui s’était passé avant son arrivée.' },
  { tags: ['plus_que_parfait'], niveau: 'P6', genre: ['recit'], texte: 'Raconte {evenement} en commençant par la fin, puis explique tout ce qui s’était passé avant.' },
  { tags: ['plus_que_parfait'], niveau: 'P6', genre: ['recit'], texte: 'Tu retrouves {objet} dans un vieux tiroir. Écris ce qui s’était passé avant ta découverte.' },
  { tags: ['plus_que_parfait'], niveau: 'P6', genre: ['recit'], texte: 'Il était trop tard : quand {personnage} est arrivé(e), tout avait déjà changé. Raconte.' },

  // ---------------- Passé simple ----------------
  { tags: ['passe_simple'], genre: ['recit'], forme: 'Un début de conte', texte: 'Écris le début d’un conte : un matin, {personnage} partit vers {lieu}…' },
  { tags: ['passe_simple'], genre: ['recit'], texte: 'Raconte au passé simple une légende où apparaît {objet}.' },
  { tags: ['passe_simple'], genre: ['recit'], texte: 'Raconte au passé simple une rencontre entre {personnage} et {personnage2}.' },
  { tags: ['passe_simple'], genre: ['recit'], texte: 'Réécris le début d’un conte que tu connais en changeant le héros : ce sera {personnage}.' },

  // ---------------- Impératif ----------------
  { tags: ['imperatif'], genre: ['consigne'], forme: 'Un mode d’emploi', texte: 'Écris les conseils pour bien accueillir {animal} chez soi : 6 consignes à l’impératif.' },
  { tags: ['imperatif'], genre: ['consigne'], texte: 'Tu es {metier}. Écris 6 consignes de sécurité pour les enfants.' },
  { tags: ['imperatif'], genre: ['consigne'], forme: 'Une recette', texte: 'Écris une recette (vraie ou inventée) pour fabriquer {objet}.' },
  { tags: ['imperatif'], genre: ['consigne'], texte: 'Écris 6 conseils pour bien vivre {evenement}.' },
  { tags: ['imperatif'], genre: ['consigne'], forme: 'Une règle du jeu', texte: 'Écris les consignes d’un jeu que tu inventes pour la cour de récréation.' },

  // ---------------- Cohérence des temps ----------------
  { tags: ['concordance'], genre: ['recit'], texte: 'Écris une histoire : le décor est {lieu} (imparfait), puis un événement surprenant arrive (passé composé).' },
  { tags: ['concordance'], genre: ['recit'], texte: 'Termine l’histoire qui commence par « Il pleuvait quand… » : qui est arrivé, qu’a-t-il fait, comment cela s’est-il terminé ?' },
  { tags: ['concordance'], genre: ['recit'], texte: 'Raconte une journée pendant {meteo} : ce qu’on faisait d’habitude, puis ce qui est arrivé ce jour-là.' },
  { tags: ['concordance'], genre: ['recit'], texte: 'Raconte comment {personnage} est arrivé(e) un jour dans ton école. Décris d’abord ce qu’on faisait, puis ce qui s’est passé.' },

  // ---------------- Accords du groupe du nom ----------------
  { tags: ['accord_gn'], genre: ['description'], texte: 'Décris {personnage} avec au moins 6 adjectifs : n’oublie aucun accord !' },
  { tags: ['accord_gn'], genre: ['description'], texte: 'Décris {lieu} en utilisant au moins 6 adjectifs bien accordés.' },
  { tags: ['accord_gn'], genre: ['expliquer'], texte: 'Fais l’inventaire d’un sac à dos magique : 8 objets au pluriel, chacun avec un déterminant et au moins un adjectif.' },
  { tags: ['accord_gn'], genre: ['description', 'expliquer'], texte: 'Présente {animal} comme dans une fiche d’identité : aspect, qualités, habitudes. Attention aux accords !' },
  { tags: ['accord_gn'], genre: ['description'], texte: 'Décris {meteo} avec des adjectifs et des noms au pluriel (des nuages gris, des gouttes froides…).' },

  // ---------------- Accord sujet-verbe ----------------
  { tags: ['accord_sv'], genre: ['description'], texte: 'Décris la récréation : ce que font les élèves, le surveillant, les ballons… Accorde bien chaque verbe avec son sujet.' },
  { tags: ['accord_sv'], genre: ['recit', 'expliquer'], texte: 'Écris ce que préparent {personnage} et {personnage2} pour une fête : attention au verbe avec deux sujets !' },
  { tags: ['accord_sv'], genre: ['expliquer'], texte: 'Écris 8 phrases où le sujet est séparé de son verbe (« Les enfants de la classe voisine jouent… »).' },
  { tags: ['accord_sv'], genre: ['recit'], texte: 'Raconte {evenement} en alternant « il », « ils », « nous » et « vous ».' },

  // ---------------- Accord du participe passé ----------------
  { tags: ['participe'], genre: ['recit'], texte: 'Raconte ton week-end au passé composé avec des sujets féminins pluriels : « Mes amies sont arrivées… ».' },
  { tags: ['participe'], genre: ['expliquer'], texte: 'Écris 6 phrases sur des photos de vacances, avec un complément placé avant le verbe (« les photos que j’ai prises »).' },
  { tags: ['participe'], genre: ['recit', 'expliquer'], texte: 'Un reporter résume {evenement} : écris son article au passé composé, avec des participes bien accordés.' },
  { tags: ['participe'], genre: ['description'], texte: 'Décris une porte, une fenêtre et un toit abîmés après {meteo}, avec des participes employés comme adjectifs (« une porte cassée »).' },

  // ---------------- Adverbes en -ment ----------------
  { tags: ['adverbes'], genre: ['description'], texte: 'Décris la façon dont {personnage} marche, parle et mange, avec 6 adverbes en -ment.' },
  { tags: ['adverbes'], genre: ['recit'], texte: 'Raconte une course : comment chaque participant a couru, sauté, respiré, avec des adverbes en -ment.' },
  { tags: ['adverbes'], genre: ['dialogue'], forme: 'Un dialogue', texte: 'Écris un dialogue où {personnage} répond à {personnage2}, avec un adverbe dans chaque réplique.' },
  { tags: ['adverbes'], genre: ['consigne'], texte: 'Écris un mode d’emploi pour bien vivre {evenement} : « Parle doucement, avance prudemment… ».' },

  // ---------------- La phrase ----------------
  { tags: ['phrase'], genre: ['description'], texte: 'Décris {lieu} en 5 phrases : chacune doit avoir un sujet, un verbe et un complément de phrase (où, quand ou comment).' },
  { tags: ['phrase'], genre: ['recit'], texte: 'Raconte {evenement} en exactement 6 phrases courtes et claires. Une idée par phrase.' },
  { tags: ['phrase'], genre: ['recit', 'description'], texte: 'Écris trois phrases (une courte, une moyenne, une longue) où {animal} est le héros. Elles doivent toutes être correctes.' },
  { tags: ['phrase'], genre: ['expliquer', 'description'], texte: 'Écris 6 phrases sur {personnage}. Chaque phrase commence par un début différent (qui ? quand ? où ? comment ?).' },
  { tags: ['phrase'], genre: ['expliquer'], texte: 'Écris en une seule phrase bien construite la consigne pour expliquer à un robot comment prendre {objet}.' },
  { tags: ['phrase'], genre: ['expliquer'], texte: 'Transforme ce texte mal écrit en 4 vraies phrases : « il pleut les enfants jouent pas dehors alors ils jouent dedans ».' },

  // ---------------- Ponctuation ----------------
  { tags: ['ponctuation'], genre: ['dialogue'], forme: 'Un dialogue', texte: 'Écris un dialogue entre {personnage} et {personnage2}. Utilise les deux-points, les guillemets (ou les tirets), un « ! » et un « ? ».' },
  { tags: ['ponctuation'], genre: ['expliquer', 'recit'], texte: 'Écris un petit texte avec toutes les ponctuations apprises : point, virgule, point d’exclamation, point d’interrogation, deux-points, points de suspension.' },
  { tags: ['ponctuation'], genre: ['recit'], texte: 'Raconte {evenement} avec des phrases qui expriment la surprise, la peur et la joie. Choisis la bonne ponctuation.' },
  { tags: ['ponctuation'], genre: ['expliquer'], texte: 'Remets de la ponctuation et des majuscules dans ce texte : « hier nous sommes allés au parc il y avait du soleil tu viens avec nous a demandé léa ».' },

  // ---------------- Connecteurs ----------------
  { tags: ['connecteurs'], genre: ['argumenter'], texte: 'Écris pourquoi {personnage} devrait absolument visiter {lieu}. Utilise « mais », « donc » et « enfin ».' },
  { tags: ['connecteurs'], genre: ['recit'], texte: 'Raconte {evenement} en reliant tes phrases avec au moins 5 connecteurs différents (d’abord, puis, pourtant, alors, enfin…).' },
  { tags: ['connecteurs'], genre: ['argumenter'], texte: 'Écris un texte pour ou contre les devoirs à la maison, avec « d’abord… ensuite… cependant… en conclusion… ».' },
  { tags: ['connecteurs'], genre: ['expliquer'], texte: 'Explique comment fonctionne {science} avec des connecteurs de conséquence (donc, c’est pourquoi, alors).' },
  { tags: ['connecteurs'], genre: ['argumenter'], texte: 'Faut-il une journée sans écran à l’école ? Donne ton avis avec un connecteur d’opposition, un de conséquence et un de conclusion.' },

  // ---------------- Reprises d'information ----------------
  { tags: ['reprises'], genre: ['description'], texte: 'Présente {personnage} en 6 phrases sans jamais répéter deux fois le même mot pour parler de lui ou d’elle : utilise des pronoms et des synonymes.' },
  { tags: ['reprises'], genre: ['recit'], texte: 'Raconte une histoire dont {animal} est le héros, sans répéter son nom plus de deux fois.' },
  { tags: ['reprises'], genre: ['recit'], texte: 'Écris une histoire où {objet} passe de main en main. À chaque fois, désigne cet objet autrement, sans répéter le même mot.' },
  { tags: ['reprises'], genre: ['description'], texte: 'Décris {meteo} sans jamais répéter le même mot : utilise des synonymes et des pronoms.' },

  // ---------------- Vocabulaire précis ----------------
  { tags: ['vocabulaire'], genre: ['description'], texte: 'Décris {lieu} sans utiliser « très », « beau », « grand » ni « chose » : cherche des mots plus précis.' },
  { tags: ['vocabulaire'], genre: ['recit'], texte: 'Raconte {evenement} avec au moins 8 mots du champ lexical de l’émotion ({emotion}).' },
  { tags: ['vocabulaire'], genre: ['expliquer', 'description'], texte: 'Écris une fiche sur {animal} avec des mots précis : au moins 3 mots génériques et 3 mots spécifiques (oiseau → mésange).' },
  { tags: ['vocabulaire'], genre: ['description'], texte: 'Joue avec les synonymes : écris une phrase sur {personnage}, puis réécris-la 3 fois avec des mots différents.' },
  { tags: ['vocabulaire'], genre: ['expliquer'], texte: 'Écris une phrase banale (« Il y a un chien dans la rue »), puis transforme-la en 3 versions plus précises et plus vivantes.' },
  { tags: ['vocabulaire'], genre: ['expliquer'], texte: 'Prépare un lexique de 10 mots sur {science}, puis rédige un court texte qui les utilise tous.' },
  { tags: ['vocabulaire'], genre: ['recit'], texte: 'Tu es {metier}. Écris ta journée avec au moins 8 mots du vocabulaire de ton métier.' },

  // ---------------- Orthographe ----------------
  { tags: ['orthographe'], genre: ['expliquer', 'description'], texte: 'Écris un texte de 6 lignes sur {animal} avec 5 homophones : a/à, ou/où, et/est, on/ont, son/sont.' },
  { tags: ['orthographe'], genre: ['expliquer'], texte: 'Choisis un mot difficile de la semaine, trouve 5 mots de sa famille et écris un texte qui les utilise.' },
  { tags: ['orthographe'], genre: ['expliquer'], forme: 'Une dictée pour tes camarades', texte: 'Prépare une dictée à trous pour tes camarades sur {evenement} : à toi de choisir les mots difficiles à cacher !' },
  { tags: ['orthographe'], genre: ['description'], texte: 'Décris {personnage} avec des mots construits à l’aide de préfixes (in-, re-, dé-…) et de suffixes.' },
  { tags: ['orthographe'], genre: ['description'], texte: 'Écris 6 phrases sur {meteo} où chaque phrase contient un mot avec un accent différent (é, è, ê, à, ù, ï…).' },

  // ---------------- Structure du texte ----------------
  { tags: ['structure'], genre: ['recit'], texte: 'Écris un récit en trois temps : situation de départ, problème, fin. Héros : {personnage}. Lieu : {lieu}.' },
  { tags: ['structure'], genre: ['description'], texte: 'Écris un texte descriptif en suivant ce plan : vue d’ensemble, détails, impression finale. Sujet : {lieu}.' },
  { tags: ['structure'], genre: ['argumenter'], texte: 'Écris un texte argumentatif : « Faut-il une journée sans écran ? » avec 2 arguments et une conclusion.' },
  { tags: ['structure'], genre: ['expliquer'], texte: 'Écris un texte explicatif : explique comment fonctionne {science}, étape par étape.' },
  { tags: ['structure'], genre: ['dialogue'], forme: 'Un dialogue', texte: 'Écris un dialogue entre {personnage} et {personnage2} qui se rencontrent devant {lieu}.' },
  { tags: ['structure'], genre: ['recit'], texte: 'Écris le début d’un récit : présente le héros ({personnage}), le lieu ({lieu}) et le moment. Arrête-toi au premier problème.' },
  { tags: ['structure'], genre: ['recit'], texte: 'Écris la suite et la fin de cette histoire : « Ce jour-là, {personnage} trouva {objet}… »' },
  { tags: ['structure'], genre: ['expliquer'], forme: 'Un article de journal', texte: 'Écris un article de journal sur {evenement} avec un titre accrocheur, un chapeau et un corps de texte.' },

  // ---------------- Situation de communication ----------------
  { tags: ['situation'], genre: ['courrier'], texte: 'Écris un message à {personnage} pour lui demander de t’aider. Adapte ton niveau de langue.' },
  { tags: ['situation'], genre: ['courrier'], texte: 'Écris la même invitation à un copain (langage familier) puis au directeur (langage soutenu). Sujet : {evenement}.' },
  { tags: ['situation'], genre: ['courrier'], forme: 'Une annonce', texte: 'Écris une annonce pour retrouver {objet} perdu(e).' },
  { tags: ['situation'], genre: ['courrier'], forme: 'Un courriel', texte: 'Écris un courriel à ta classe pour annoncer {evenement}. Pense au destinataire, à l’intention et au ton.' },
  { tags: ['situation'], genre: ['argumenter', 'courrier'], texte: 'Écris un texte pour convaincre {personnage} de venir visiter ton école.' },
  { tags: ['situation'], genre: ['courrier'], texte: 'Réécris ce message trop familier pour le directeur : « Salut, j’peux pas venir demain, j’suis malade, bye. »' },

  // ---------------- Planifier ----------------
  { tags: ['planification'], genre: ['recit'], texte: 'Prépare le plan d’un récit qui a pour héros {personnage} : une carte mentale avec le début, le problème et la fin. Ne rédige pas encore !' },
  { tags: ['planification'], genre: ['description'], texte: 'Écris 5 mots-clés sur {lieu}, regroupe-les en deux blocs, puis rédige un paragraphe qui les utilise.' },
  { tags: ['planification'], genre: ['expliquer'], texte: 'Prépare un exposé de 5 phrases sur {science} : d’abord le plan, ensuite la rédaction.' },
  { tags: ['planification'], genre: ['recit'], texte: 'Avant d’écrire, réponds à 5 questions sur {evenement} : qui, quoi, où, quand, pourquoi. Ensuite, raconte.' },

  // ---------------- Relire et corriger ----------------
  { tags: ['revision'], genre: ['expliquer'], texte: 'Voici un texte à réviser : « Hier, les enfant ont jouer dans la cour, il crier fort. » Corrige-le avec la grille de la classe.' },
  { tags: ['revision'], genre: ['description'], texte: 'Écris 5 phrases sur {meteo}, puis échange avec un voisin. Chacun relit avec la grille et propose 3 améliorations.' },
  { tags: ['revision'], genre: ['expliquer'], texte: 'Relis ton dernier texte comme un détective : trouve 3 fautes d’accord, 2 de verbes et 1 de ponctuation.' },
  { tags: ['revision'], genre: ['description'], texte: 'Écris un brouillon sur {personnage}, puis une deuxième version plus précise.' },

  // ---------------- Présentation ----------------
  { tags: ['presentation'], genre: ['expliquer', 'description'], forme: 'Une affiche', texte: 'Présente {animal} sous forme d’affiche : un titre, un texte aligné, une illustration.' },
  { tags: ['presentation'], genre: ['description'], texte: 'Tape à l’ordinateur un petit texte sur {lieu} et mets-le en forme (titre, paragraphes, police lisible).' },
  { tags: ['presentation'], genre: ['recit'], texte: 'Recopie proprement un texte écrit au brouillon : soigne l’écriture, les marges et les paragraphes. Thème : {evenement}.' },

  // ---------------- Écrits de travail et réflexifs ----------------
  { tags: ['reflexif'], genre: ['reflexif'], forme: 'Une page de journal', texte: 'Écris dans ton journal : une chose que tu as apprise cette semaine, une chose qui t’a surpris(e) et une question qui te reste.' },
  { tags: ['reflexif'], genre: ['reflexif', 'recit'], texte: 'Raconte un moment où tu as ressenti {emotion} cette semaine. Explique ce qui s’est passé et comment tu as réagi.' },
  { tags: ['reflexif'], genre: ['expliquer'], texte: 'Fais un schéma qui explique comment fonctionne {science}, puis écris deux phrases pour l’expliquer.' },
  { tags: ['reflexif'], genre: ['expliquer'], texte: 'Écoute un court texte lu par l’enseignant et note 5 mots-clés, puis rédige un résumé de 3 phrases avec tes mots-clés.' },
  { tags: ['reflexif'], genre: ['recit', 'reflexif'], texte: 'Écris dans ton journal ce que tu as fait aujourd’hui, dans l’ordre : d’abord, puis, ensuite, enfin.' },
  { tags: ['reflexif'], genre: ['reflexif'], texte: 'Écris à ton futur toi ce que tu as appris en français et ce que tu veux encore améliorer.' },

  // ---------------- Sources et esprit critique (P6) ----------------
  { tags: ['documentation'], niveau: 'P6', genre: ['expliquer'], texte: 'Cherche deux sources différentes sur {science} (livre, site…) et note ce qu’elles disent de pareil et de différent.' },
  { tags: ['documentation'], niveau: 'P6', genre: ['argumenter'], forme: 'Un avis critique', texte: 'Écris un petit avis critique sur un documentaire ou un site : l’information est-elle fiable ? Pourquoi ?' },
  { tags: ['documentation'], niveau: 'P6', genre: ['expliquer'], texte: 'Prépare 5 mots-clés pour chercher des informations sur {animal}, puis écris une fiche courte avec tes sources.' },
  { tags: ['documentation'], niveau: 'P6', genre: ['argumenter'], texte: 'Donne ton avis sur la présentation visuelle d’une page web ou d’une affiche (couleurs, images, titres) en 5 phrases.' },
].map((g, i) => ({ id: `g${String(i + 1).padStart(3, '0')}`, ...g }))
