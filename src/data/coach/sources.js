// =============================================================
//  Coach — registre des sources (le « moteur de preuves »)
//  Rien n'est affiché dans l'appli sans renvoyer à une source d'ici.
//
//  level   : A = position stand / consensus / méta-analyse / revue systématique
//            B = essai contrôlé randomisé, grande cohorte, étude expérimentale
//            C = programme officiel validé par un organisme public
//            D = méthode d'un expert publiée, sans validation expérimentale directe
//  statut  : 'verifie'    = titre, année, revue, chiffres contrôlés sur une page de la source (21 nov. 2026)
//            'partiel'    = la référence existe mais un détail (DOI, édition, pages) reste à contrôler
//            'a_verifier' = non contrôlé : affiché avec un avertissement
//  license : 'open' | 'cc-by' | 'ogl' | 'public-domain' | 'copyright-cite-only'
//  summaryFr : résumé écrit par nous (jamais copié de la source)
// =============================================================

export const NIVEAUX = {
  A: { code: 'A', nom: 'Consensus / méta-analyse', court: 'Preuve forte', couleur: 'emerald' },
  B: { code: 'B', nom: 'Essai ou grande cohorte', court: 'Preuve solide', couleur: 'sky' },
  C: { code: 'C', nom: 'Programme officiel', court: 'Programme officiel', couleur: 'violet' },
  D: { code: 'D', nom: 'Méthode d’expert publiée', court: 'Méthode d’expert', couleur: 'amber' },
}

export const SOURCES = [
  {
    id: 'frandsen2025',
    citation:
      'Frandsen JSB, Hulme A, Parner ET, et al. How much running is too much? Identifying high-risk running sessions in a 5200-person cohort study. Br J Sports Med. 2025;59(17):1203-1210.',
    url: 'https://doi.org/10.1136/bjsports-2024-109380',
    level: 'B',
    license: 'copyright-cite-only',
    statut: 'verifie',
    summaryFr:
      'Cohorte de 5 205 coureurs suivis 18 mois : le risque de blessure de surcharge augmente quand une sortie dépasse de plus de 10 % la plus longue sortie des 30 derniers jours. Le ratio d’une semaine sur l’autre n’a montré aucun lien avec le risque, et le ratio aigu/chronique (ACWR) une relation inverse : ces ratios hebdomadaires ne sont donc pas utilisés comme garde-fou.',
  },
  {
    id: 'acsm2026rt',
    citation:
      'Phillips SM, et al. American College of Sports Medicine Position Stand — Resistance Training Prescription for Muscle Function, Hypertrophy, and Physical Performance in Healthy Adults: An Overview of Reviews. Med Sci Sports Exerc. 2026 (numéro d’avril).',
    url: 'https://acsm.org/resistance-training-guidelines-update/',
    level: 'A',
    license: 'copyright-cite-only',
    statut: 'partiel',
    noteVerif: 'Existence, titre, auteur principal et chiffres clés contrôlés sur acsm.org ; volume/pages et DOI à compléter.',
    summaryFr:
      'Synthèse de 137 revues systématiques (plus de 30 000 participants). Le plus important est de s’y mettre et d’être régulier : tous les grands groupes musculaires au moins 2 fois par semaine, charges lourdes pour la force, environ 10 séries par groupe et par semaine pour le volume musculaire ; poids du corps et élastiques fonctionnent aussi.',
  },
  {
    id: 'vandyk2019',
    citation:
      'van Dyk N, Behan FP, Whiteley R. Including the Nordic hamstring exercise in injury prevention programmes halves the rate of hamstring injuries: a systematic review and meta-analysis of 8459 athletes. Br J Sports Med. 2019;53(21):1362-1370.',
    url: 'https://doi.org/10.1136/bjsports-2018-100045',
    level: 'A',
    license: 'copyright-cite-only',
    statut: 'verifie',
    summaryFr:
      'Méta-analyse de 15 études : les programmes qui incluent le Nordic hamstring réduisent les blessures aux ischio-jambiers d’environ la moitié (rapport de risque 0,49 ; jusqu’à −51 %).',
  },
  {
    id: 'bosquet2007',
    citation:
      'Bosquet L, Montpetit J, Arvisais D, Mujika I. Effects of tapering on performance: a meta-analysis. Med Sci Sports Exerc. 2007;39(8):1358-1365.',
    url: 'https://doi.org/10.1249/mss.0b013e31806010e0',
    level: 'A',
    license: 'copyright-cite-only',
    statut: 'verifie',
    summaryFr:
      'Méta-analyse de 27 études : l’affûtage le plus efficace dure 2 semaines, avec un volume réduit de 41 à 60 % (de façon progressive) sans toucher à l’intensité ni à la fréquence.',
  },
  {
    id: 'seiler2010',
    citation:
      'Seiler S. What is best practice for training intensity and duration distribution in endurance athletes? Int J Sports Physiol Perform. 2010;5(3):276-291.',
    url: 'https://doi.org/10.1123/ijspp.5.3.276',
    level: 'A',
    license: 'copyright-cite-only',
    statut: 'verifie',
    summaryFr:
      'Revue des habitudes d’athlètes d’endurance de haut niveau : environ 80 % des séances à basse intensité et le reste à haute intensité, avec très peu de travail « au seuil ».',
  },
  {
    id: 'stoggl2014',
    citation:
      'Stöggl T, Sperlich B. Polarized training has greater impact on key endurance variables than threshold, high intensity, or high volume training. Front Physiol. 2014;5:33.',
    url: 'https://doi.org/10.3389/fphys.2014.00033',
    level: 'B',
    license: 'cc-by',
    statut: 'verifie',
    summaryFr:
      'Essai randomisé de 9 semaines sur 48 athlètes d’endurance bien entraînés : l’entraînement « polarisé » (beaucoup de facile, un peu de très dur) progresse davantage que les trois autres approches.',
  },
  {
    id: 'balsalobre2016',
    citation:
      'Balsalobre-Fernández C, Santos-Concejero J, Grivas GV. Effects of strength training on running economy in highly trained runners: a systematic review with meta-analysis of controlled trials. J Strength Cond Res. 2016;30(8):2361-2368.',
    url: 'https://doi.org/10.1519/JSC.0000000000001316',
    level: 'A',
    license: 'copyright-cite-only',
    statut: 'verifie',
    summaryFr:
      'Méta-analyse : 2 à 3 séances de renforcement (charges légères à lourdes et pliométrie) par semaine pendant 8 à 12 semaines améliorent nettement l’économie de course de coureurs très entraînés.',
  },
  {
    id: 'heiderscheit2011',
    citation:
      'Heiderscheit BC, Chumanov ES, Michalski MP, Wille CM, Ryan MB. Effects of step rate manipulation on joint mechanics during running. Med Sci Sports Exerc. 2011;43(2):296-302.',
    url: 'https://doi.org/10.1249/MSS.0b013e3181ebedf4',
    level: 'B',
    license: 'copyright-cite-only',
    statut: 'verifie',
    summaryFr:
      'Étude de laboratoire sur 45 coureurs : augmenter la cadence de 5 à 10 % diminue la charge sur le genou et la hanche. C’est une mesure biomécanique, pas une réduction de blessures démontrée.',
  },
  {
    id: 'daniels1979',
    citation:
      'Daniels J, Gilbert J. Oxygen Power: Performance Tables for Distance Runners. 1979. (équations du VDOT)',
    url: '',
    level: 'D',
    license: 'copyright-cite-only',
    statut: 'partiel',
    noteVerif:
      'Les deux équations (coût en oxygène et fraction du VO2max soutenue) ont été recoupées sur plusieurs calculateurs publiés ; l’ouvrage lui-même n’a pas été consulté.',
    summaryFr:
      'Le « VDOT » transforme une performance de course en indice de forme : coût en oxygène de la vitesse divisé par la part du VO2max tenable pendant la durée de la course.',
  },
  {
    id: 'danielsFormula',
    citation: 'Daniels J. Daniels’ Running Formula. Human Kinetics (édition à préciser).',
    url: '',
    level: 'D',
    license: 'copyright-cite-only',
    statut: 'a_verifier',
    noteVerif:
      'Les pourcentages de VO2max retenus pour les allures E, T, I, R sont des approximations à comparer au calculateur officiel VDOT avant de s’y fier à la seconde près.',
    summaryFr:
      'Méthode d’entraînement par allures (E facile, M marathon, T seuil, I intervalles, R répétitions) calculées à partir du VDOT.',
  },
  {
    id: 'riegel1981',
    citation: 'Riegel PS. Athletic records and human endurance. American Scientist. 1981;69(3):285-290.',
    url: 'https://www.jstor.org/stable/27850427',
    level: 'D',
    license: 'copyright-cite-only',
    statut: 'verifie',
    summaryFr:
      'Équation de prédiction : le temps sur une autre distance = temps connu × (rapport des distances) puissance 1,06. Valable pour des efforts de l’ordre de 3,5 à 230 minutes.',
  },
  {
    id: 'who2020',
    citation:
      'Bull FC, Al-Ansari SS, Biddle S, et al. World Health Organization 2020 guidelines on physical activity and sedentary behaviour. Br J Sports Med. 2020;54(24):1451-1462.',
    url: 'https://doi.org/10.1136/bjsports-2020-102955',
    level: 'A',
    license: 'open',
    statut: 'verifie',
    summaryFr:
      'Les adultes devraient faire 150 à 300 minutes d’activité modérée, ou 75 à 150 minutes d’activité vigoureuse, par semaine, et du renforcement musculaire régulier.',
  },
  {
    id: 'tanaka2001',
    citation:
      'Tanaka H, Monahan KD, Seals DR. Age-predicted maximal heart rate revisited. J Am Coll Cardiol. 2001;37(1):153-156.',
    url: 'https://doi.org/10.1016/S0735-1097(00)01054-8',
    level: 'A',
    license: 'copyright-cite-only',
    statut: 'verifie',
    summaryFr:
      'Méta-analyse de 351 études : FC max estimée = 208 − 0,7 × âge. L’écart typique avec la valeur réelle d’une personne est d’environ 10 battements par minute.',
  },
  {
    id: 'mifflin1990',
    citation:
      'Mifflin MD, St Jeor ST, Hill LA, Scott BJ, Daugherty SA, Koh YO. A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr. 1990;51(2):241-247.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/2305711/',
    level: 'B',
    license: 'copyright-cite-only',
    statut: 'verifie',
    summaryFr:
      'Équation du métabolisme de base à partir du poids, de la taille, de l’âge et du sexe, établie sur 498 personnes en bonne santé par calorimétrie indirecte.',
  },
  {
    id: 'compendium2024',
    citation:
      'Herrmann SD, Willis EA, Ainsworth BE, et al. 2024 Adult Compendium of Physical Activities: a third update of the energy costs of human activities. J Sport Health Sci. 2024;13(1):6-12.',
    url: 'https://pacompendium.com',
    level: 'A',
    license: 'open',
    statut: 'verifie',
    noteVerif:
      'Le compendium compte 1 114 activités dont 912 à valeur mesurée et 202 à valeur estimée (le brief parlait de valeurs toutes mesurées). Les valeurs MET reprises dans l’appli n’ont pas été recontrôlées ligne par ligne : voir « Sources & méthode ».',
    summaryFr:
      'Catalogue de référence du coût énergétique des activités, exprimé en MET (multiples de la dépense de repos).',
  },
  {
    id: 'thomas2016',
    citation:
      'Thomas DT, Erdman KA, Burke LM. Position of the Academy of Nutrition and Dietetics, Dietitians of Canada, and the American College of Sports Medicine: Nutrition and Athletic Performance. J Acad Nutr Diet. 2016;116(3):501-528.',
    url: 'https://doi.org/10.1016/j.jand.2015.12.006',
    level: 'A',
    license: 'copyright-cite-only',
    statut: 'verifie',
    summaryFr:
      'Position commune de trois sociétés savantes sur la nutrition du sportif : les besoins en glucides montent avec la charge d’entraînement (de 3-5 g/kg les jours légers à 8-12 g/kg les très gros jours).',
  },
  {
    id: 'burke2011',
    citation:
      'Burke LM, Hawley JA, Wong SHS, Jeukendrup AE. Carbohydrates for training and competition. J Sports Sci. 2011;29(Suppl 1):S17-S27.',
    url: 'https://doi.org/10.1080/02640414.2011.585473',
    level: 'A',
    license: 'copyright-cite-only',
    statut: 'partiel',
    noteVerif: 'Revue, volume et pages contrôlés ; le DOI affiché est à confirmer.',
    summaryFr:
      'Recommandations de glucides quotidiens selon l’intensité et la durée de l’entraînement, base des fourchettes en g/kg/jour.',
  },
  {
    id: 'jager2017',
    citation:
      'Jäger R, Kerksick CM, Campbell BI, et al. International Society of Sports Nutrition Position Stand: protein and exercise. J Int Soc Sports Nutr. 2017;14:20.',
    url: 'https://doi.org/10.1186/s12970-017-0177-8',
    level: 'A',
    license: 'cc-by',
    statut: 'verifie',
    summaryFr:
      'Pour construire et garder du muscle : 1,4 à 2,0 g de protéines par kg et par jour, réparties dans la journée, avec environ 0,25 g/kg (soit 20 à 40 g) par prise.',
  },
  {
    id: 'jeukendrup2014',
    citation:
      'Jeukendrup A. A step towards personalized sports nutrition: carbohydrate intake during exercise. Sports Med. 2014;44(Suppl 1):S25-S33.',
    url: 'https://doi.org/10.1007/s40279-014-0148-z',
    level: 'A',
    license: 'copyright-cite-only',
    statut: 'verifie',
    summaryFr:
      'Les glucides pendant l’effort dépendent de sa durée : jusqu’à 60 g/h avec un seul type de sucre, jusqu’à environ 90 g/h avec un mélange (glucose + fructose) pour les efforts très longs.',
  },
  {
    id: 'tiller2019',
    citation:
      'Tiller NB, Roberts JD, Beasley L, et al. International Society of Sports Nutrition Position Stand: nutritional considerations for single-stage ultra-marathon training and racing. J Int Soc Sports Nutr. 2019;16:50.',
    url: 'https://doi.org/10.1186/s12970-019-0312-9',
    level: 'A',
    license: 'cc-by',
    statut: 'verifie',
    summaryFr:
      'Position sur la nutrition des courses d’ultra-endurance : régime riche en glucides à l’entraînement (5-8 g/kg/j), apports pendant l’effort adaptés à la durée.',
  },
  {
    id: 'sawka2007',
    citation:
      'Sawka MN, Burke LM, Eichner ER, Maughan RJ, Montain SJ, Stachenfeld NS. American College of Sports Medicine Position Stand: Exercise and fluid replacement. Med Sci Sports Exerc. 2007;39(2):377-390.',
    url: 'https://doi.org/10.1249/mss.0b013e31802ca597',
    level: 'A',
    license: 'copyright-cite-only',
    statut: 'verifie',
    summaryFr:
      'Boire pendant l’effort pour éviter une perte de poids d’eau supérieure à 2 % du poids du corps, sans excès d’eau non plus.',
  },
  {
    id: 'aragon2017',
    citation:
      'Aragon AA, Schoenfeld BJ, Wildman R, et al. International Society of Sports Nutrition Position Stand: diets and body composition. J Int Soc Sports Nutr. 2017;14:16.',
    url: 'https://doi.org/10.1186/s12970-017-0174-y',
    level: 'A',
    license: 'cc-by',
    statut: 'partiel',
    noteVerif:
      'La position existe et dit que les rythmes de perte plus lents préservent mieux la masse maigre ; le chiffre « 0,5-1 % du poids par semaine » du brief n’a pas été retrouvé dans le résumé contrôlé.',
    summaryFr:
      'Une perte de poids lente préserve mieux la masse maigre ; beaucoup de régimes différents peuvent fonctionner si on les tient dans la durée.',
  },
  {
    id: 'nhsC25k',
    citation: 'NHS (Royaume-Uni). Couch to 5K running plan. nhs.uk, page « Better Health ».',
    url: 'https://www.nhs.uk/better-health/get-active/get-running-with-couch-to-5k/couch-to-5k-running-plan',
    level: 'C',
    license: 'copyright-cite-only',
    statut: 'verifie',
    noteVerif:
      'La page affiche « © Crown copyright » sans mention de licence de réutilisation : le plan est donc décrit ici avec nos propres mots (durées de course et de marche), jamais copié mot à mot.',
    summaryFr:
      'Programme officiel de 9 semaines, 3 sorties par semaine avec un jour de repos entre chaque, qui mène de zéro à 30 minutes de course continue.',
  },
  {
    id: 'soligard2008',
    citation:
      'Soligard T, Myklebust G, Steffen K, et al. Comprehensive warm-up programme to prevent injuries in young female footballers: cluster randomised controlled trial. BMJ. 2008;337:a2469.',
    url: 'https://doi.org/10.1136/bmj.a2469',
    level: 'B',
    license: 'copyright-cite-only',
    statut: 'verifie',
    noteVerif:
      'Essai sur 1 892 joueuses de 13 à 17 ans : le critère principal (blessures du membre inférieur) n’a pas atteint la significativité (RR 0,71 ; IC 95 % 0,49-1,03) ; les blessures globales, de surcharge et graves ont diminué.',
    summaryFr:
      'Le programme d’échauffement FIFA 11+ réduit certaines blessures chez de jeunes footballeuses. Le contenu du programme n’est pas reproduit ici : voir la source officielle.',
  },
  {
    id: 'borg',
    citation: 'Borg G. Psychophysical bases of perceived exertion. Med Sci Sports Exerc. 1982;14(5):377-381. (échelles de Borg, dont la CR-10)',
    url: '',
    level: 'B',
    license: 'copyright-cite-only',
    statut: 'a_verifier',
    noteVerif: 'Référence non contrôlée dans cette version : à vérifier avant de s’appuyer sur l’échelle RPE 1-10 comme mesure scientifique.',
    summaryFr: 'Échelle d’effort perçu : l’effort ressenti sur une échelle de 0 à 10 sert à suivre l’intensité d’une séance.',
  },
  {
    id: 'livrePfitzinger',
    citation: 'Pfitzinger P, Douglas S. Advanced Marathoning (et Faster Road Racing). Human Kinetics (éditions à préciser).',
    url: '',
    level: 'D',
    license: 'copyright-cite-only',
    statut: 'a_verifier',
    summaryFr: 'Plans de livre très utilisés par les coureurs réguliers. Non reproduits ici : à lire dans le livre.',
  },
  {
    id: 'livreHigdon',
    citation: 'Higdon H. Marathon: The Ultimate Training Guide (éditions à préciser).',
    url: '',
    level: 'D',
    license: 'copyright-cite-only',
    statut: 'a_verifier',
    summaryFr: 'Plans progressifs populaires pour préparer un marathon ou un semi. Non reproduits ici.',
  },
  {
    id: 'livreHanson',
    citation: 'Humphrey L, Hanson L. The Hansons Marathon Method (éditions à préciser).',
    url: '',
    level: 'D',
    license: 'copyright-cite-only',
    statut: 'a_verifier',
    summaryFr: 'Méthode de marathon fondée sur des sorties fréquentes et un volume élevé. Non reproduite ici.',
  },
]

// Contenus de données réutilisés (licences) — affichés dans « Sources & méthode »
export const CREDITS = [
  {
    id: 'freeExerciseDb',
    nom: 'free-exercise-db (Unlicense, domaine public)',
    url: 'https://github.com/yuhonas/free-exercise-db',
    note: 'Identifiants et muscles des exercices de renforcement ; noms et consignes réécrits en français par nous.',
  },
  {
    id: 'nhs',
    nom: 'NHS — Couch to 5K',
    url: 'https://www.nhs.uk/better-health/get-active/get-running-with-couch-to-5k/',
    note: 'Plan décrit avec nos mots, avec attribution (licence de réutilisation non confirmée).',
  },
  {
    id: 'ciqual',
    nom: 'Table Ciqual (Anses)',
    url: 'https://ciqual.anses.fr',
    note: 'Pas encore intégrée dans cette version (journal alimentaire à venir). Mention obligatoire : « Anses. Table de composition nutritionnelle Ciqual ».',
  },
]

const PAR_ID = Object.fromEntries(SOURCES.map((s) => [s.id, s]))

export function trouverSource(id) {
  return PAR_ID[id] || null
}

export const LABELS_STATUT = {
  verifie: 'Vérifiée',
  partiel: 'Partiellement vérifiée',
  a_verifier: 'À vérifier',
}
