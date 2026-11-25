// =============================================================
//  Le modèle du cycle menstruel (expérience « Les règles »).
//
//  Repères (cycle « type ») :
//   - le jour 1 est le premier jour des règles ;
//   - l'ovulation a lieu environ 14 jours AVANT les règles suivantes
//     (la phase après l'ovulation dure à peu près 14 jours, quelle que
//     soit la longueur du cycle : c'est la première moitié qui varie) ;
//   - un cycle dure en général de 21 à 35 jours (plus irrégulier au début).
//  Tout est schématique : c'est un modèle pour comprendre, pas pour prédire.
// =============================================================

export const DUREE_REGLES = 5 // jours de règles dessinés dans le modèle (en vrai : 2 à 7)
export const DUREE_APRES_OVULATION = 14
export const CYCLES = [21, 28, 35]

export const jourOvulation = (longueur) => longueur - DUREE_APRES_OVULATION

// 'regles' | 'avant' | 'ovulation' | 'apres'
export function phaseDuJour(jour, longueur) {
  const o = jourOvulation(longueur)
  if (jour <= DUREE_REGLES) return 'regles'
  if (jour < o) return 'avant'
  if (jour === o) return 'ovulation'
  return 'apres'
}

// Les 4 étapes, avec leurs jours pour un cycle de cette longueur
export function etapes(longueur) {
  const o = jourOvulation(longueur)
  return [
    { id: 'regles', debut: 1, fin: DUREE_REGLES },
    { id: 'avant', debut: DUREE_REGLES + 1, fin: o - 1 },
    { id: 'ovulation', debut: o, fin: o },
    { id: 'apres', debut: o + 1, fin: longueur },
  ]
}

const lin = (jour, j1, j2, v1, v2) => (j2 === j1 ? v1 : v1 + ((v2 - v1) * (jour - j1)) / (j2 - j1))

// Épaisseur de l'endomètre (0 = très fin, 1 = très épais)
export function epaisseurEndometre(jour, longueur) {
  const o = jourOvulation(longueur)
  if (jour <= DUREE_REGLES) return lin(jour, 1, DUREE_REGLES, 0.5, 0.1)
  if (jour <= o) return lin(jour, DUREE_REGLES + 1, o, 0.15, 0.7)
  return lin(jour, o + 1, longueur, 0.72, 1)
}

// État de l'ovaire dessiné : { etat: 'follicule' | 'ovulation' | 'corps', p: 0..1 }
export function etatOvaire(jour, longueur) {
  const o = jourOvulation(longueur)
  if (jour <= DUREE_REGLES) return { etat: 'follicule', p: lin(jour, 1, DUREE_REGLES, 0.05, 0.2) }
  if (jour < o) return { etat: 'follicule', p: lin(jour, DUREE_REGLES + 1, o - 1, 0.25, 0.95) }
  if (jour === o) return { etat: 'ovulation', p: 1 }
  return { etat: 'corps', p: lin(jour, o + 1, longueur, 1, 0.15) }
}

// Où est l'ovule ? null = pas d'ovule mûr visible ;
// 'ovaire' = jour de l'ovulation ; 'trompe' = le lendemain (il vit 12 à 24 h)
export function ovuleDuJour(jour, longueur) {
  const o = jourOvulation(longueur)
  if (jour === o) return 'ovaire'
  if (jour === o + 1) return 'trompe'
  return null
}

export const reglesCeJour = (jour) => jour <= DUREE_REGLES

// Jours avant les prochaines règles (jour 1 du cycle suivant)
export const joursAvantReglesSuivantes = (jour, longueur) => longueur - jour + 1

// ---- Hormones (courbes SCHÉMATIQUES, de 0 à 1, pas des mesures) ----
// Œstrogènes : montent avant l'ovulation, petit pic après, chutent avant les règles.
// Progestérone : basse puis haute après l'ovulation (corps jaune), chute avant les règles.
const pic = (x, centre, largeur) => Math.exp(-(((x - centre) / largeur) ** 2))
export function oestrogenes(jour, longueur) {
  const o = jourOvulation(longueur)
  return Math.min(1, 0.12 + 0.88 * pic(jour, o - 1, 2.6) + 0.4 * pic(jour, o + 7, 3.6))
}
export function progesterone(jour, longueur) {
  const o = jourOvulation(longueur)
  return Math.min(1, 0.05 + 0.95 * pic(jour, o + 7, 3.8))
}

// ---- Calendrier : prévoir les prochaines règles ----
// starts = jours (numérotés) où commencent les règles passées. Renvoie la moyenne arrondie des cycles
// et le jour prévu pour les prochaines règles.
export function prevision(starts) {
  const durees = starts.slice(1).map((d, i) => d - starts[i])
  const moyenne = Math.round(durees.reduce((a, b) => a + b, 0) / durees.length)
  return { durees, moyenne, prochain: starts.at(-1) + moyenne }
}
