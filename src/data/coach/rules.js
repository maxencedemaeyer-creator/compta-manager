// =============================================================
//  Coach — registre des règles
//  Chaque règle utilisée par un calcul ou une séance DOIT citer au moins
//  une source de sources.js (un test Vitest le vérifie).
//  Ce qui n'est pas une règle scientifique est listé à part, dans
//  CHOIX_APPLI, et affiché comme tel (« choix de l'appli, sans source »).
// =============================================================

export const RULES = [
  // ---------- Entraînement : course ----------
  {
    id: 'spike-seance-10pct',
    module: 'training',
    statementFr:
      'Une sortie ne devrait pas dépasser de plus de 10 % la plus longue sortie des 30 derniers jours. Vigilance de 10 à 30 % de plus, alerte rouge au-delà de 30 %.',
    params: { fenetreJours: 30, seuilVigilance: 0.1, seuilAlerte: 0.3 },
    sources: ['frandsen2025'],
    caveatFr:
      'Étude observationnelle (blessures déclarées par les coureurs). Les risques mesurés par rapport à ≤ 10 % : +64 % pour 10-30 %, +52 % pour 30-100 %, ×2,28 au-delà de 100 % — le risque n’est donc pas strictement croissant, et les seuils orange/rouge de l’appli sont un choix de présentation. Cette étude n’a trouvé aucun lien pour le ratio d’une semaine sur l’autre ; pour le ratio aigu/chronique elle a observé une relation inverse (risque plus faible quand il monte) : la règle « 10 % par semaine » n’est donc pas utilisée comme garde-fou.',
  },
  {
    id: 'allures-vdot',
    module: 'training',
    statementFr:
      'Les allures d’entraînement (E facile, M marathon, T seuil, I intervalles, R répétitions) sont calculées à partir du VDOT de ta dernière performance.',
    params: { pctVo2max: { E: 0.65, T: 0.88, I: 0.98, R: 1.05 }, fourchetteE: [0.59, 0.74] },
    sources: ['daniels1979', 'danielsFormula'],
    caveatFr:
      'Les équations du VDOT sont vérifiées ; les pourcentages de VO2max par type d’allure sont des approximations à comparer au calculateur officiel. Estimation à partir d’une seule course : refais le calcul après chaque bonne performance récente.',
  },
  {
    id: 'distribution-intensite',
    module: 'training',
    statementFr:
      'La grande majorité du volume se fait à basse intensité (facile) ; une petite part seulement se fait au seuil ou plus vite.',
    params: { partBasseIndicative: 0.8 },
    sources: ['seiler2010', 'stoggl2014'],
    caveatFr:
      'Données observées chez des athlètes de haut niveau (Seiler) et un essai de 9 semaines sur athlètes très entraînés (Stöggl). Pour un coureur de loisir à 3 sorties par semaine, c’est une orientation, pas une mesure exacte.',
  },
  {
    id: 'affutage',
    module: 'training',
    statementFr:
      'Affûtage d’environ 2 semaines : volume réduit de façon progressive de 41 à 60 %, intensité et fréquence maintenues.',
    params: { semaines: 2, reductionMin: 0.41, reductionMax: 0.6, facteurSemaine1: 0.75, facteurSemaine2: 0.5 },
    sources: ['bosquet2007'],
    caveatFr:
      'Méta-analyse surtout sur des athlètes de compétition (natation, course, vélo). Les facteurs 0,75 puis 0,50 sont notre façon de répartir une baisse progressive dans la fourchette indiquée.',
  },
  {
    id: 'force-economie-course',
    module: 'training',
    statementFr:
      'Des séances de renforcement (charges lourdes et pliométrie) 2 à 3 fois par semaine pendant 8 à 12 semaines améliorent l’économie de course.',
    params: { seancesParSemaine: [2, 3], dureeSemaines: [8, 12] },
    sources: ['balsalobre2016'],
    caveatFr:
      'Méta-analyse sur coureurs de demi-fond et fond très entraînés. Une méta-analyse plus récente (Sports Med 2024) nuance l’effet selon la vitesse de course testée.',
  },
  {
    id: 'cadence',
    module: 'training',
    statementFr:
      'Option : augmenter la cadence de 5 à 10 % par rapport à ta cadence naturelle réduit la charge sur le genou et la hanche.',
    params: { pctMin: 5, pctMax: 10 },
    sources: ['heiderscheit2011'],
    caveatFr:
      'Étude de laboratoire sur 45 coureurs, à vitesse constante : on mesure des forces articulaires, pas des blessures évitées.',
  },
  {
    id: 'prediction-chrono',
    module: 'training',
    statementFr:
      'Le temps prédit sur une autre distance est une estimation : temps connu × (rapport des distances) puissance 1,06 ; le VDOT donne une seconde estimation.',
    params: { exposant: 1.06, dureeMinMin: 3.5, dureeMaxMin: 230 },
    sources: ['riegel1981', 'daniels1979'],
    caveatFr:
      'Toujours une estimation : elle suppose une préparation spécifique pour la distance visée et des conditions normales.',
  },
  {
    id: 'fc-max-tanaka',
    module: 'training',
    statementFr:
      'Sans mesure, la FC max est estimée par 208 − 0,7 × âge. Une FC max mesurée prime toujours.',
    params: { constante: 208, coefficient: 0.7, ecartTypeBpm: 10 },
    sources: ['tanaka2001'],
    caveatFr: 'Estimation : l’écart avec la valeur réelle d’une personne peut atteindre une dizaine de battements par minute.',
  },
  {
    id: 'rpe-borg',
    module: 'training',
    statementFr: 'Après chaque séance, l’effort ressenti est noté de 1 à 10 pour suivre l’intensité réellement vécue.',
    params: { min: 1, max: 10 },
    sources: ['borg'],
    caveatFr: 'Référence marquée « à vérifier » dans le registre.',
  },

  // ---------- Entraînement : renforcement et prévention ----------
  {
    id: 'renfo-acsm2026',
    module: 'training',
    statementFr:
      'Chaque grand groupe musculaire est travaillé au moins 2 fois par semaine. Pour la force : charges lourdes (~80 % du 1RM), 2 à 3 séries. Pour le volume musculaire : ~10 séries par groupe et par semaine. Poids du corps et élastiques sont efficaces.',
    params: { frequenceMinParGroupe: 2, force1RMpct: 80, seriesForce: [2, 3], seriesHypertrophieSemaine: 10 },
    sources: ['acsm2026rt'],
    caveatFr: 'Position pour adultes en bonne santé. Les exercices précis et leur ordre sont des choix de l’appli.',
  },
  {
    id: 'nordic-ischios',
    module: 'prevention',
    statementFr:
      'Le Nordic hamstring est inclus dans la prévention des ischio-jambiers : il divise à peu près par deux les blessures de ce muscle dans les programmes qui l’utilisent.',
    params: { rapportRisque: 0.49, reductionMax: 0.51 },
    sources: ['vandyk2019'],
    caveatFr:
      'Résultat de groupe sur des athlètes de plusieurs sports. Le protocole exact (séries, répétitions, progression) n’est pas fixé par cette source : voir le choix de l’appli et, après une déchirure, l’avis d’un kiné.',
  },
  {
    id: 'echauffement-prevention',
    module: 'prevention',
    statementFr:
      'Un échauffement structuré (programme FIFA 11+) réduit certaines blessures chez de jeunes footballeuses. Contenu non reproduit : à consulter à la source.',
    params: {},
    sources: ['soligard2008'],
    caveatFr:
      'Critère principal non significatif dans l’essai (RR 0,71 ; IC 95 % 0,49-1,03) ; résultats favorables sur les blessures globales, de surcharge et graves. Population : joueuses de 13 à 17 ans.',
  },
  {
    id: 'debutant-c25k',
    module: 'training',
    statementFr:
      'Plan débutant : 9 semaines, 3 sorties par semaine avec un jour de repos entre chaque, alternance course/marche puis 30 minutes de course continue.',
    params: { semaines: 9, sortiesParSemaine: 3 },
    sources: ['nhsC25k'],
    caveatFr: 'Programme officiel NHS, décrit avec nos mots. Ralentis ou répète une semaine si c’est trop dur.',
  },
  {
    id: 'activite-minimale',
    module: 'training',
    statementFr:
      '150 à 300 minutes d’activité modérée ou 75 à 150 minutes d’activité vigoureuse par semaine, plus du renforcement musculaire.',
    params: { modereMin: 150, modereMax: 300, vigoureuxMin: 75, vigoureuxMax: 150, renfoJours: 2 },
    sources: ['who2020'],
    caveatFr:
      'Lignes directrices de santé publique pour adultes. La fréquence de 2 jours de renforcement par semaine vient du brief et n’a pas été relue dans les extraits contrôlés.',
  },

  // ---------- Nutrition ----------
  {
    id: 'bmr-mifflin',
    module: 'nutrition',
    statementFr:
      'Métabolisme de base estimé : 10 × poids (kg) + 6,25 × taille (cm) − 5 × âge + 5 (homme) ou − 161 (femme).',
    params: { poids: 10, taille: 6.25, age: -5, homme: 5, femme: -161 },
    sources: ['mifflin1990'],
    caveatFr: 'Estimation : l’écart individuel peut atteindre plusieurs centaines de kcal par jour.',
  },
  {
    id: 'depense-met',
    module: 'nutrition',
    statementFr:
      'Dépense d’une séance estimée par MET : (MET − 1) × poids × durée en heures. On retire 1 MET pour ne pas compter deux fois le métabolisme de base.',
    params: {},
    sources: ['compendium2024'],
    caveatFr:
      'Estimation. Les valeurs MET de l’appli sont des valeurs courantes du compendium à recontrôler : voir « Sources & méthode ».',
  },
  {
    id: 'glucides-jour',
    module: 'nutrition',
    statementFr:
      'Glucides par jour selon la charge : léger 3-5 g/kg, modéré 5-7, élevé 6-10, très élevé 8-12.',
    params: {
      leger: [3, 5],
      modere: [5, 7],
      eleve: [6, 10],
      tres_eleve: [8, 12],
    },
    sources: ['thomas2016', 'burke2011'],
    caveatFr:
      'Fourchettes pour des athlètes d’endurance : à ajuster à l’appétit, à la tolérance et aux objectifs. Pas un avis diététique individuel.',
  },
  {
    id: 'proteines-jour',
    module: 'nutrition',
    statementFr:
      'Protéines : 1,4 à 2,0 g/kg/jour, réparties dans la journée avec environ 0,25 g/kg (20 à 40 g) par prise.',
    params: { min: 1.4, max: 2.0, parPriseGkg: 0.25, parPriseAbsoluG: [20, 40] },
    sources: ['jager2017'],
    caveatFr: 'Pour adultes en bonne santé qui s’entraînent. Pas un avis médical.',
  },
  {
    id: 'glucides-effort',
    module: 'nutrition',
    statementFr:
      'Pendant un effort long : 30 à 60 g de glucides par heure ; jusqu’à environ 90 g/h pour les très longs efforts avec un mélange glucose-fructose.',
    params: { seuilPlanMin: 75, longMin: 150, basGh: 30, hautGh: 60, ultraGh: 90 },
    sources: ['jeukendrup2014', 'tiller2019'],
    caveatFr:
      'Le seuil de 75 minutes pour proposer un plan vient du brief ; au-delà de 2 h 30 on propose la fourchette haute avec mélange de sucres. À tester à l’entraînement, jamais le jour de course.',
  },
  {
    id: 'hydratation',
    module: 'nutrition',
    statementFr:
      'Boire pour éviter une perte de poids supérieure à 2 % pendant l’effort (pèse-toi avant et après une sortie pour connaître ton cas).',
    params: { perteMaxPct: 2 },
    sources: ['sawka2007'],
    caveatFr: 'Les besoins varient beaucoup avec la chaleur et la sudation : l’appli ne donne pas de volume à boire.',
  },
  {
    id: 'perte-poids',
    module: 'nutrition',
    statementFr:
      'Si l’objectif est de perdre du poids : un rythme lent préserve mieux la masse maigre, avec des protéines suffisantes.',
    params: { rythmePctMin: 0.5, rythmePctMax: 1 },
    sources: ['aragon2017'],
    caveatFr:
      'Règle non utilisée dans les calculs de cette version. Le rythme de 0,5 à 1 % du poids par semaine vient du brief et n’a pas été retrouvé dans le résumé contrôlé de la source : à vérifier.',
  },
]

// =============================================================
//  Choix de conception de l'appli : PAS des règles scientifiques.
//  Montrés dans « Sources & méthode » avec la mention « sans source ».
// =============================================================
export const CHOIX_APPLI = [
  {
    id: 'plafond-sortie-longue',
    texteFr:
      'La sortie longue est plafonnée à la valeur la plus basse qui permet à la course visée de rester à +10 % de la plus longue sortie (règle du spike). Pour un marathon, plafond pratique de 32 km (la course dépassera alors +10 %, c’est signalé).',
    params: { plafondMarathonKm: 32, arrondiKm: 0.5 },
  },
  {
    id: 'semaine-plateau',
    texteFr: 'Une semaine sur quatre, la sortie longue reste au même niveau (pas de nouvelle augmentation) pour souffler.',
    params: { toutesLesSemaines: 4 },
  },
  {
    id: 'rotation-qualite',
    texteFr:
      'La séance « qualité » alterne seuil continu, seuil fractionné, allure semi/marathon et intervalles courts. Les durées exactes sont des choix de l’appli, inspirés de la logique des allures de Daniels.',
    params: {},
  },
  {
    id: 'distances-faciles',
    texteFr: 'La sortie facile fait environ la moitié de la sortie longue (entre 5 et 10 km).',
    params: { ratio: 0.5, minKm: 5, maxKm: 10 },
  },
  {
    id: 'protocole-nordic',
    texteFr:
      'Nordic hamstring : on débute à 2 séries de 4 répétitions, 2 fois par semaine, puis on ajoute une répétition de temps en temps. Arrêt immédiat si douleur ; après une déchirure, valider avec un kiné. Protocole non fixé par la source.',
    params: { series: 2, repetitionsDepart: 4 },
  },
  {
    id: 'renfo-hanches',
    texteFr:
      'Les exercices de hanches (marche latérale à l’élastique, pont fessier à une jambe, montées sur banc) sont ajoutés quand une gêne à la bandelette ilio-tibiale est déclarée. Pas de source dédiée dans cette version.',
    params: {},
  },
  {
    id: 'zones-fc',
    texteFr:
      'Pas de zones de fréquence cardiaque tant qu’aucune source n’est validée : l’appli donne des allures et un ressenti (« tu peux parler »).',
    params: {},
  },
  {
    id: 'facteur-activite-quotidienne',
    texteFr:
      'L’énergie du jour = métabolisme de base × 1,4 (activité de tous les jours hors sport, modifiable dans le profil) + dépense des séances (MET).',
    params: { facteur: 1.4 },
  },
  {
    id: 'classe-charge',
    texteFr:
      'Charge du jour pour les glucides : léger (repos, renforcement), modéré (sortie facile de moins de 90 minutes), élevé (séance qualité, sortie longue, sport intense), très élevé (4 heures et plus).',
    params: { modereJusquaMin: 90, tresEleveDepuisMin: 240 },
  },
  {
    id: 'semaine-validee',
    texteFr: 'Une semaine est « validée » quand toutes ses séances prévues sont faites (ou faites en version courte).',
    params: {},
  },
  {
    id: 'seuils-alerte-affichage',
    texteFr: 'Les couleurs orange et rouge de l’alerte spike (10-30 % / plus de 30 %) sont un choix de présentation.',
    params: {},
  },
]

const PAR_ID = Object.fromEntries(RULES.map((r) => [r.id, r]))

export function trouverRegle(id) {
  return PAR_ID[id] || null
}

// Identifiants de sources d'un ensemble de règles (sans doublon)
export function sourcesDesRegles(ruleIds = []) {
  const ids = []
  for (const rid of ruleIds) {
    for (const sid of trouverRegle(rid)?.sources || []) if (!ids.includes(sid)) ids.push(sid)
  }
  return ids
}
