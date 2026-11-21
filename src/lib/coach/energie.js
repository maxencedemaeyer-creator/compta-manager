// =============================================================
//  Énergie : métabolisme de base (Mifflin-St Jeor) et dépense des séances (MET)
//  Sources : mifflin1990, compendium2024. Tout est une ESTIMATION.
// =============================================================
import { MET, metCourse } from '../../data/coach/met.js'
import { trouverRegle } from '../../data/coach/rules.js'

export function metabolismeDeBase({ sexe, poidsKg, tailleCm, age }) {
  const p = trouverRegle('bmr-mifflin').params
  const constante = sexe === 'femme' ? p.femme : p.homme
  return p.poids * poidsKg + p.taille * tailleCm + p.age * age + constante
}

// Dépense nette d'une séance : (MET − 1) × poids × heures
export function depenseSeance({ met, poidsKg, minutes }) {
  return Math.max(0, met - 1) * poidsKg * (minutes / 60)
}

// MET d'une séance prévue (course selon sa vitesse moyenne, renfo, sport fixe…)
export function metDeSeance(seance) {
  if (seance.type === 'fixe') {
    if ((seance.sport || '').toLowerCase().includes('padel')) return { ...MET.padel, nom: MET.padel.nom }
    if ((seance.sport || '').toLowerCase().includes('vélo')) return MET.velo_loisir
    return { nom: seance.titre, met: 6, verifie: false }
  }
  if (seance.module === 'renfo') return MET.renfo
  if (seance.distanceKm && seance.dureeMin) return metCourse(seance.distanceKm / (seance.dureeMin / 60))
  return MET.marche_rapide
}

export function depenseDesSeances(seances, poidsKg) {
  return seances.reduce((total, s) => {
    const m = metDeSeance(s)
    return total + depenseSeance({ met: m.met, poidsKg, minutes: s.dureeReelleMin || s.dureeMin || 0 })
  }, 0)
}

export function energieDuJour({ profil, seances }) {
  const facteur = profil.facteurActivite || 1.4
  const bmr = metabolismeDeBase(profil)
  const base = bmr * facteur
  const seancesKcal = depenseDesSeances(seances, profil.poidsKg)
  return { bmr: Math.round(bmr), base: Math.round(base), seances: Math.round(seancesKcal), total: Math.round(base + seancesKcal), facteur }
}

export function fcMaxTanaka(age) {
  const p = trouverRegle('fc-max-tanaka').params
  return Math.round(p.constante - p.coefficient * age)
}
