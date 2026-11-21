// =============================================================
//  Savoir écrire — dictionnaire de mots-clés
//
//  Le programme ne dit pas « imparfait » : il dit « Conjuguer… aux temps
//  listés ». Ce dictionnaire fait le lien entre les mots que tape le prof
//  et les attendus du domaine Écrire (ids du fichier
//  src/data/labo/programme_francais_P5-P6_attendus.json).
//
//  mots  : mots ou expressions reconnus (sans accents, singulier : la
//          recherche ignore accents, majuscules et pluriels)
//  ids   : attendus les plus pertinents (score fort)
//  aussi : attendus liés (score moyen)
//  tags  : thèmes de la banque d'idées (voir tags.js)
// =============================================================
export const MOTS_CLES = [
  // ---------- Conjugaison et temps ----------
  {
    mots: ['imparfait'],
    etiquette: 'Imparfait',
    ids: [454, 455, 403],
    aussi: [445, 453, 448, 449, 450, 452],
    tags: ['imparfait'],
  },
  {
    mots: ['passe compose', 'passé composé'],
    etiquette: 'Passé composé',
    ids: [454, 455, 438],
    aussi: [447, 403, 445, 449, 453],
    tags: ['passe_compose', 'participe'],
  },
  {
    mots: ['futur', 'futur simple', 'futur proche'],
    etiquette: 'Futur',
    ids: [454, 455],
    aussi: [445, 448, 450, 452, 453],
    tags: ['futur'],
  },
  {
    mots: ['conditionnel', 'si j etais', 'hypothese'],
    etiquette: 'Conditionnel',
    ids: [454, 455],
    aussi: [446, 445, 453],
    tags: ['conditionnel'],
  },
  {
    mots: ['plus que parfait', 'plus-que-parfait', 'passe anterieur', 'futur anterieur', 'conditionnel passe'],
    etiquette: 'Temps composés (plus-que-parfait…)',
    ids: [446, 454, 455],
    aussi: [445, 447, 403],
    tags: ['plus_que_parfait'],
  },
  {
    mots: ['passe simple', 'passé simple'],
    etiquette: 'Passé simple',
    ids: [451, 454, 455],
    aussi: [445, 403],
    tags: ['passe_simple'],
  },
  {
    mots: ['imperatif', 'impératif', 'consigne', 'ordre', 'conseil'],
    etiquette: 'Impératif',
    ids: [451, 454],
    aussi: [380, 445],
    tags: ['imperatif'],
  },
  {
    mots: ['present', 'présent'],
    etiquette: 'Présent',
    ids: [454, 455],
    aussi: [445, 448, 450, 452, 453],
    tags: ['futur', 'imparfait'],
  },
  {
    mots: ['conjugaison', 'conjuguer', 'conjugue', 'temps', 'temps verbaux', 'mode', 'verbe', 'terminaison', 'radical', 'auxiliaire'],
    etiquette: 'Conjugaison',
    ids: [454, 455, 453],
    aussi: [445, 446, 448, 449, 450, 451, 452, 403, 444],
    tags: ['imparfait', 'passe_compose', 'futur', 'concordance'],
  },
  {
    mots: ['concordance des temps', 'coherence temporelle', 'concordance', 'systeme temporel', 'chronologie'],
    etiquette: 'Cohérence des temps',
    ids: [455, 403],
    aussi: [454, 400],
    tags: ['concordance'],
  },

  // ---------- Accords et orthographe grammaticale ----------
  {
    mots: ['accord', 'accorder', 'accord en genre et en nombre', 'genre', 'nombre', 'determinant', 'adjectif'],
    etiquette: 'Accords (groupe du nom)',
    ids: [439, 438, 453],
    aussi: [440, 441, 431, 432, 443, 444],
    tags: ['accord_gn', 'accord_sv'],
  },
  {
    mots: ['accord du verbe', 'accorder le verbe', 'sujet verbe', 'sujet et verbe', 'accord sujet verbe'],
    etiquette: 'Accord sujet-verbe',
    ids: [453, 456],
    aussi: [457, 445, 459],
    tags: ['accord_sv'],
  },
  {
    mots: ['participe', 'participe passe', 'participe passé', 'accord du participe'],
    etiquette: 'Accord du participe passé',
    ids: [438, 447],
    aussi: [449, 445, 444],
    tags: ['participe', 'passe_compose'],
  },
  {
    mots: ['pluriel', 'pluriels'],
    etiquette: 'Pluriel des noms et adjectifs',
    ids: [440, 435, 436],
    aussi: [439, 431],
    tags: ['accord_gn'],
  },
  {
    mots: ['feminin', 'féminin', 'masculin'],
    etiquette: 'Féminin des noms et adjectifs',
    ids: [441, 437],
    aussi: [439, 431],
    tags: ['accord_gn'],
  },
  {
    mots: ['adverbe', 'adverbes', 'adverbe en ment'],
    etiquette: 'Adverbes en -ment',
    ids: [442, 433, 434],
    aussi: [443, 410],
    tags: ['adverbes'],
  },
  {
    mots: ['classe de mots', 'classe grammaticale', 'nature des mots', 'nom', 'pronom', 'grammaire'],
    etiquette: 'Classes de mots',
    ids: [443, 432, 431],
    aussi: [457, 459, 444],
    tags: ['phrase', 'accord_gn'],
  },

  // ---------- Orthographe lexicale ----------
  {
    mots: ['orthographe', 'orthographier', 'dictee', 'dictée', 'mot difficile', 'orthographe lexicale'],
    etiquette: 'Orthographe',
    ids: [416, 429, 444, 421],
    aussi: [418, 419, 420, 422, 423, 424, 425, 426, 430, 438, 439, 453, 394],
    tags: ['orthographe'],
  },
  {
    mots: ['homophone', 'homophones', 'homonyme', 'homogramme', 'a ou a', 'ce ou se', 'ces ou ses', 'son ou sont', 'et ou est'],
    etiquette: 'Homophones',
    ids: [423, 424, 425, 426, 444],
    aussi: [421],
    tags: ['orthographe'],
  },
  {
    mots: ['prefixe', 'préfixe', 'suffixe', 'famille de mots', 'racine', 'derivation', 'composition', 'morphologie', 'construction des mots'],
    etiquette: 'Construction des mots',
    ids: [417, 430, 419, 420, 418],
    aussi: [427, 428, 415],
    tags: ['orthographe', 'vocabulaire'],
  },
  {
    mots: ['accent', 'accents', 'trait d union'],
    etiquette: 'Accents',
    ids: [421, 444],
    aussi: [416, 429],
    tags: ['orthographe'],
  },

  // ---------- Vocabulaire ----------
  {
    mots: ['vocabulaire', 'lexique', 'mot precis', 'vocabulaire precis', 'richesse du vocabulaire', 'mots'],
    etiquette: 'Vocabulaire précis',
    ids: [408, 409, 412, 413, 414],
    aussi: [405, 406, 407, 410, 411, 415],
    tags: ['vocabulaire'],
  },
  {
    mots: ['synonyme', 'antonyme', 'contraire', 'meme sens', 'champ lexical', 'repetition de mots'],
    etiquette: 'Synonymes, contraires, champ lexical',
    ids: [413, 412, 406],
    aussi: [408, 404, 415],
    tags: ['vocabulaire', 'reprises'],
  },
  {
    mots: ['generique', 'specifique', 'terme generique', 'mot generique'],
    etiquette: 'Mots génériques et spécifiques',
    ids: [414, 407],
    aussi: [408],
    tags: ['vocabulaire'],
  },
  {
    mots: ['intensite', 'intensité', 'tres', 'nuance', 'negation', 'certitude', 'probabilite'],
    etiquette: 'Intensité, négation, certitude',
    ids: [410, 411],
    aussi: [408, 442],
    tags: ['vocabulaire', 'adverbes'],
  },
  {
    mots: ['lexique specifique', 'vocabulaire scientifique', 'vocabulaire thematique', 'champ disciplinaire', 'sciences'],
    etiquette: 'Lexique d’un thème ou d’une discipline',
    ids: [405, 408, 409],
    aussi: [412, 414],
    tags: ['vocabulaire'],
  },

  // ---------- Phrase et ponctuation ----------
  {
    mots: [
      'phrase', 'phrases', 'phrase claire', 'phrase correcte', 'phrase correctement ecrite', 'phrase bien construite',
      'phrase bien structuree', 'construction de phrase', 'sujet', 'predicat', 'complement', 'groupe sujet', 'groupe verbal',
    ],
    etiquette: 'La phrase',
    ids: [458, 456, 457, 459, 387],
    aussi: [401, 404, 455, 453, 443],
    tags: ['phrase'],
  },
  {
    mots: ['ponctuation', 'ponctuer', 'virgule', 'point', 'majuscule', 'guillemet', 'dialogue', 'tiret'],
    etiquette: 'Ponctuation',
    ids: [387, 458],
    aussi: [456, 398],
    tags: ['ponctuation'],
  },

  // ---------- Cohérence du texte ----------
  {
    mots: ['connecteur', 'connecteurs', 'enchainement', 'articulation', 'mot de liaison', 'liaison', 'logique', 'donc', 'mais', 'cependant', 'ensuite'],
    etiquette: 'Connecteurs et enchaînement',
    ids: [402, 401, 397],
    aussi: [404, 400, 403, 398],
    tags: ['connecteurs'],
  },
  {
    mots: ['reprise', 'reprise de l information', 'anaphore', 'substitut', 'pronom de reprise', 'eviter les repetitions', 'repetition'],
    etiquette: 'Reprises d’information',
    ids: [404, 397],
    aussi: [406, 412, 431, 401],
    tags: ['reprises'],
  },
  {
    mots: ['coherence', 'cohérence', 'texte coherent', 'texte structure', 'texte bien structure', 'organisation', 'organiser', 'paragraphe', 'plan'],
    etiquette: 'Cohérence et organisation',
    ids: [400, 401, 402, 404, 403],
    aussi: [397, 398, 385, 455],
    tags: ['structure', 'connecteurs'],
  },
  {
    mots: [
      'structure textuelle', 'structure', 'texte narratif', 'narratif', 'recit', 'raconter', 'narration', 'texte descriptif', 'description',
      'decrire', 'texte argumentatif', 'argumentatif', 'argumenter', 'texte explicatif', 'explicatif', 'expliquer', 'texte dialogue',
      'dialogue', 'dialogué',
    ],
    etiquette: 'Structures de texte (récit, description…)',
    ids: [398, 400, 376],
    aussi: [385, 401, 402, 403, 399],
    tags: ['structure'],
  },

  // ---------- Situation de communication ----------
  {
    mots: [
      'situation de communication', 'destinataire', 'intention', 'enonciateur', 'lettre', 'courrier', 'mail', 'message', 'contexte',
      'adapter son ecrit',
    ],
    etiquette: 'Situation de communication',
    ids: [378, 380, 382, 385],
    aussi: [379, 381, 383, 384, 386, 376],
    tags: ['situation'],
  },
  {
    mots: ['niveau de langue', 'registre', 'familier', 'courant', 'soutenu', 'langage familier'],
    etiquette: 'Niveaux de langue',
    ids: [381, 383],
    aussi: [378, 382, 384],
    tags: ['situation'],
  },
  {
    mots: ['informer', 'convaincre', 'persuader', 'enjoindre', 'donner du plaisir', 'emouvoir', 'intention d ecriture'],
    etiquette: 'Intentions d’écriture',
    ids: [380, 376, 375],
    aussi: [382, 398],
    tags: ['situation', 'structure'],
  },

  // ---------- Produire, planifier, réviser ----------
  {
    mots: [
      'production ecrite', 'produire un ecrit', 'redaction', 'rediger', 'expression ecrite', 'ecrire un texte', 'ecrit', 'texte libre',
      'ecriture', 'creation ecrite',
    ],
    etiquette: 'Produire un écrit',
    ids: [376, 375, 385, 388],
    aussi: [377, 472, 382, 400],
    tags: ['structure', 'situation', 'planification'],
  },
  {
    mots: ['planifier', 'planification', 'brouillon', 'idees', 'idée', 'avant d ecrire', 'preparer son ecrit', 'carte mentale', 'schema'],
    etiquette: 'Planifier avant d’écrire',
    ids: [385, 388, 386, 382],
    aussi: [377, 391, 392, 396],
    tags: ['planification'],
  },
  {
    mots: [
      'relecture', 'relire', 'reviser', 'révision', 'revision', 'correction', 'corriger', 'autocorrection', 'grille de revision',
      'grille de verification', 'verifier', 'ajuster', 'dictionnaire', 'conjugueur', 'correcteur',
    ],
    etiquette: 'Relire, réviser, corriger',
    ids: [472, 473, 388],
    aussi: [416, 429, 394, 377],
    tags: ['revision'],
  },
  {
    mots: ['presentation', 'présentation', 'lisibilite', 'soin', 'soigner', 'ecriture soignee', 'mise en page', 'numerique', 'traitement de texte', 'ordinateur', 'tablette'],
    etiquette: 'Présentation de l’écrit',
    ids: [460, 461],
    aussi: [375],
    tags: ['presentation'],
  },

  // ---------- Écrits de travail et réflexifs ----------
  {
    mots: ['journal', 'carnet', 'ecrit reflexif', 'écrit de travail', 'trace', 'bilan', 'apprentissage'],
    etiquette: 'Journal et écrits de travail',
    ids: [390, 464, 394],
    aussi: [391, 392, 377, 462],
    tags: ['reflexif'],
  },
  {
    mots: ['emotion', 'émotion', 'sentiment', 'ressenti', 'plaisir', 'poeme', 'poésie'],
    etiquette: 'Exprimer une émotion',
    ids: [393, 380],
    aussi: [389, 399, 390],
    tags: ['reflexif'],
  },
  {
    mots: ['prise de notes', 'prendre des notes', 'notes', 'mot cle', 'mots cles', 'ligne du temps', 'resume', 'résumé'],
    etiquette: 'Prendre des notes',
    ids: [395, 396, 394],
    aussi: [391, 392, 464],
    tags: ['reflexif'],
  },
  {
    mots: ['procede', 'procedes', 'auteur', 'autrice', 'litterature', 'style', 'figure de style'],
    etiquette: 'Procédés des autrices et auteurs',
    ids: [389, 399, 467],
    aussi: [409],
    tags: ['structure', 'vocabulaire'],
  },
  {
    mots: [
      'source', 'sources', 'documentaire', 'recherche', 'recherche documentaire', 'esprit critique', 'fiable', 'credibilite', 'avis',
      'jugement critique', 'comparer des sources', 'information',
    ],
    etiquette: 'Sources et esprit critique',
    ids: [463, 465, 466, 468, 469],
    aussi: [467, 470, 471, 462, 464],
    tags: ['documentation'],
  },
]

// Idées de recherche proposées en un clic sous la barre de recherche
export const SUGGESTIONS = [
  'imparfait',
  'passé composé',
  'futur',
  'accords',
  'participe passé',
  'phrase claire',
  'ponctuation',
  'connecteurs',
  'vocabulaire précis',
  'orthographe',
  'homophones',
  'récit',
  'description',
  'argumenter',
  'lettre',
  'niveaux de langue',
  'relecture',
]

// Mots vides ignorés dans la recherche libre
export const MOTS_VIDES = new Set([
  'de', 'du', 'des', 'la', 'le', 'les', 'un', 'une', 'et', 'ou', 'en', 'au', 'aux', 'a', 'sur', 'dans', 'pour', 'par', 'avec', 'sans',
  'bien', 'mal', 'tres', 'correctement', 'correcte', 'ecrit', 'ecrite', 'ecrire', 'son', 'sa', 'ses', 'leur', 'leurs', 'mon', 'ma',
  'mes', 'ce', 'cet', 'cette', 'ces', 'qui', 'que', 'se', 'ne', 'pas', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles', 'est', 'sont',
  'etre', 'avoir', 'faire', 'peut', 'plus', 'moins', 'aussi', 'comme', 'cela', 'ca',
])
