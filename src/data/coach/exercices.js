// =============================================================
//  Coach — bibliothèque d'exercices de renforcement
//  Identifiants et muscles : free-exercise-db (Unlicense, domaine public)
//  https://github.com/yuhonas/free-exercise-db
//  Noms et consignes : écrits en français par nous (pas de texte copié).
//  idDb = null : exercice qui n'existe pas dans la base (décrit par nous).
// =============================================================

export const EXERCICES = {
  squat_goblet: {
    idDb: 'Goblet_Squat',
    nom: 'Squat gobelet',
    muscles: 'Cuisses, fessiers',
    materiel: 'Haltère ou kettlebell (sinon squat poids du corps)',
    consigne: 'Tiens la charge contre la poitrine, descends en gardant le dos droit et les genoux dans l’axe des pieds, remonte en poussant dans les talons.',
  },
  fentes: {
    idDb: 'Dumbbell_Lunges',
    nom: 'Fentes',
    muscles: 'Cuisses, fessiers',
    materiel: 'Haltères (ou poids du corps)',
    consigne: 'Grand pas en avant, genou arrière proche du sol, buste droit, pousse sur la jambe avant pour revenir.',
  },
  souleve_roumain: {
    idDb: 'Romanian_Deadlift',
    nom: 'Soulevé de terre roumain',
    muscles: 'Ischio-jambiers, fessiers',
    materiel: 'Haltères ou barre',
    consigne: 'Jambes presque tendues, bascule le bassin vers l’arrière en gardant le dos plat, descends jusqu’à sentir l’arrière des cuisses, remonte en serrant les fessiers.',
  },
  pont_fessier_une_jambe: {
    idDb: 'Single_Leg_Glute_Bridge',
    nom: 'Pont fessier à une jambe',
    muscles: 'Fessiers, ischio-jambiers',
    materiel: 'Poids du corps',
    consigne: 'Allongé sur le dos, un pied au sol, monte le bassin en serrant le fessier, bassin bien horizontal, redescends sans poser.',
  },
  montee_banc: {
    idDb: 'Step-up_with_Knee_Raise',
    nom: 'Montée sur banc',
    muscles: 'Fessiers, cuisses',
    materiel: 'Banc ou marche solide',
    consigne: 'Pose un pied sur le banc, monte en poussant avec cette jambe seule, genou opposé vers le haut, redescends en contrôlant.',
  },
  marche_laterale_elastique: {
    idDb: 'Monster_Walk',
    nom: 'Marche latérale avec élastique',
    muscles: 'Fessiers (moyen fessier), hanches',
    materiel: 'Élastique autour des cuisses ou des chevilles',
    consigne: 'Genoux légèrement fléchis, pas chassés sur le côté en gardant l’élastique tendu, sans balancer le buste.',
  },
  mollets_debout: {
    idDb: 'Standing_Dumbbell_Calf_Raise',
    nom: 'Montées sur pointes (mollets)',
    muscles: 'Mollets',
    materiel: 'Marche et haltère (ou poids du corps)',
    consigne: 'Monte sur la pointe des pieds en deux secondes, marque une pause en haut, redescends lentement sous le niveau de la marche.',
  },
  pompes: {
    idDb: 'Pushups',
    nom: 'Pompes',
    muscles: 'Pectoraux, épaules, triceps',
    materiel: 'Poids du corps (mains sur un banc pour faciliter)',
    consigne: 'Corps gainé de la tête aux talons, descends la poitrine près du sol, coudes à environ 45° du buste, remonte.',
  },
  rowing_haltere: {
    idDb: 'One-Arm_Dumbbell_Row',
    nom: 'Rowing à un bras',
    muscles: 'Dos, biceps',
    materiel: 'Haltère et banc',
    consigne: 'Une main et un genou sur le banc, dos plat, tire l’haltère vers la hanche en serrant l’omoplate, redescends sans à-coup.',
  },
  planche: {
    idDb: 'Plank',
    nom: 'Gainage planche',
    muscles: 'Abdominaux, tronc',
    materiel: 'Poids du corps',
    consigne: 'Sur les avant-bras, corps aligné, ventre serré, bassin ni trop haut ni qui s’affaisse.',
  },
  gainage_lateral: {
    idDb: 'Side_Bridge',
    nom: 'Gainage latéral',
    muscles: 'Obliques, hanches',
    materiel: 'Poids du corps',
    consigne: 'Sur le côté, appui sur l’avant-bras, soulève le bassin pour aligner épaule-hanche-pied, tiens la position.',
  },
  dead_bug: {
    idDb: 'Dead_Bug',
    nom: 'Dead bug',
    muscles: 'Abdominaux profonds',
    materiel: 'Poids du corps',
    consigne: 'Sur le dos, bras et genoux levés, étends bras et jambe opposés en gardant le bas du dos collé au sol.',
  },
  squat_saute: {
    idDb: 'Freehand_Jump_Squat',
    nom: 'Squats sautés',
    muscles: 'Cuisses, fessiers (pliométrie)',
    materiel: 'Poids du corps',
    consigne: 'Descends en squat, saute vers le haut sans te précipiter, atterris doucement sur l’avant du pied en amortissant avec les genoux.',
  },
  bond_lateral: {
    idDb: 'Lateral_Bound',
    nom: 'Bonds latéraux',
    muscles: 'Fessiers, adducteurs (pliométrie)',
    materiel: 'Poids du corps',
    consigne: 'Pousse sur une jambe vers le côté, atterris sur l’autre, stabilise une seconde, repars de l’autre côté.',
  },
  nordic: {
    idDb: null,
    nom: 'Nordic hamstring',
    muscles: 'Ischio-jambiers',
    materiel: 'Un appui pour les chevilles (partenaire, canapé lourd, sangle)',
    consigne: 'À genoux, chevilles bloquées, descends le buste vers le sol le plus lentement possible en gardant les hanches ouvertes, rattrape-toi avec les mains, remonte en t’aidant des bras.',
  },
}

export function trouverExercice(cle) {
  return EXERCICES[cle] || null
}
