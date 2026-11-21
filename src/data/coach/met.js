// =============================================================
//  Valeurs MET courantes pour estimer la dépense d'une séance.
//  Source de référence : 2024 Adult Compendium of Physical Activities (pacompendium.com).
//  ⚠️ Ces valeurs sont des valeurs usuelles reprises à la main et n'ont PAS été
//  recontrôlées ligne par ligne dans le compendium 2024 (d'où « verifie: false ») :
//  l'appli les affiche toujours comme « estimation, valeur à vérifier ».
//  Pour les corriger : comparer avec https://pacompendium.com puis passer verifie à true.
// =============================================================

export const MET = {
  marche_rapide: { nom: 'Marche rapide', met: 4.3, verifie: false },
  course_8kmh: { nom: 'Course 8 km/h', met: 8.3, verifie: false },
  course_9_7kmh: { nom: 'Course ~9,7 km/h', met: 9.8, verifie: false },
  course_11kmh: { nom: 'Course ~11 km/h', met: 11, verifie: false },
  course_12_9kmh: { nom: 'Course ~13 km/h', met: 11.8, verifie: false },
  velo_loisir: { nom: 'Vélo (électrique, trajet)', met: 4, verifie: false },
  padel: { nom: 'Padel (comme tennis en double)', met: 6, verifie: false },
  renfo: { nom: 'Renforcement musculaire', met: 5, verifie: false },
  renfo_leger: { nom: 'Renforcement léger', met: 3.5, verifie: false },
}

// Valeur MET d'une course selon la vitesse moyenne (km/h) : on prend la valeur de la tranche immédiatement en dessous
export function metCourse(vitesseKmh) {
  if (vitesseKmh >= 12.5) return MET.course_12_9kmh
  if (vitesseKmh >= 10.5) return MET.course_11kmh
  if (vitesseKmh >= 9) return MET.course_9_7kmh
  if (vitesseKmh >= 7) return MET.course_8kmh
  return MET.marche_rapide
}
