// =============================================================
//  VDOT et allures — équations de Daniels & Gilbert (sources : daniels1979, danielsFormula)
//  Tout est une ESTIMATION. Vitesses en mètres par minute, temps en secondes.
// =============================================================
import { trouverRegle } from '../../data/coach/rules.js'

// Coût en oxygène (mL/kg/min) de la course à la vitesse v (m/min)
export function coutOxygene(v) {
  return -4.6 + 0.182258 * v + 0.000104 * v * v
}

// Part du VO2max qu'on peut soutenir pendant t minutes
export function fractionVo2max(tMin) {
  return 0.8 + 0.1894393 * Math.exp(-0.012778 * tMin) + 0.2989558 * Math.exp(-0.1932605 * tMin)
}

// VDOT d'une performance : distance en mètres, temps en secondes
export function vdotDepuisCourse(distanceM, tempsSec) {
  const t = tempsSec / 60
  const v = distanceM / t
  return coutOxygene(v) / fractionVo2max(t)
}

// Vitesse (m/min) correspondant à un coût en oxygène donné (inverse de coutOxygene)
export function vitessePourVo2(vo2) {
  const a = 0.000104
  const b = 0.182258
  const c = -4.6 - vo2
  return (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a)
}

// Temps (s) prédit sur une distance (m) pour un VDOT donné (recherche par dichotomie)
export function tempsPourVdot(vdot, distanceM) {
  let bas = 120
  let haut = 6 * 3600 * 2
  for (let i = 0; i < 80; i++) {
    const milieu = (bas + haut) / 2
    // plus on met de temps, plus le VDOT de la performance baisse
    if (vdotDepuisCourse(distanceM, milieu) > vdot) bas = milieu
    else haut = milieu
  }
  return (bas + haut) / 2
}

// Allure en secondes par km à partir d'une vitesse en m/min
export function allureDepuisVitesse(vMmin) {
  return 1000 / (vMmin / 60)
}

const DISTANCE_MARATHON_M = 42195

// Allures d'entraînement estimées (secondes par km) pour un VDOT
export function allures(vdot) {
  const pct = trouverRegle('allures-vdot').params
  const alluresVo2 = (p) => allureDepuisVitesse(vitessePourVo2(p * vdot))
  const tMarathon = tempsPourVdot(vdot, DISTANCE_MARATHON_M)
  return {
    E: alluresVo2(pct.pctVo2max.E),
    E_rapide: alluresVo2(pct.fourchetteE[1]),
    E_lente: alluresVo2(pct.fourchetteE[0]),
    M: tMarathon / (DISTANCE_MARATHON_M / 1000),
    T: alluresVo2(pct.pctVo2max.T),
    I: alluresVo2(pct.pctVo2max.I),
    R: alluresVo2(pct.pctVo2max.R),
  }
}

// Prédiction de Riegel : temps connu → temps sur une autre distance
export function riegel(tempsSec, distanceConnueM, distanceCibleM) {
  const exposant = trouverRegle('prediction-chrono').params.exposant
  return tempsSec * Math.pow(distanceCibleM / distanceConnueM, exposant)
}

// ---------- Formats ----------
export function formatAllure(secParKm) {
  if (!Number.isFinite(secParKm)) return '—'
  const total = Math.round(secParKm)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}/km`
}

export function formatTemps(tempsSec) {
  const total = Math.round(tempsSec)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h} h ${String(m).padStart(2, '0')} min ${String(s).padStart(2, '0')} s`
  return `${m} min ${String(s).padStart(2, '0')} s`
}

// « 23:41 », « 1:49:30 », « 23 41 » → secondes (null si invalide)
export function lireTemps(texte) {
  if (!texte) return null
  const morceaux = String(texte).trim().replace(/[hms'"’]/g, ':').split(/[:\s]+/).filter(Boolean).map(Number)
  if (!morceaux.length || morceaux.some((n) => !Number.isFinite(n) || n < 0)) return null
  if (morceaux.length === 2) return morceaux[0] * 60 + morceaux[1]
  if (morceaux.length === 3) return morceaux[0] * 3600 + morceaux[1] * 60 + morceaux[2]
  return null
}

export function vitesseKmh(distanceKm, minutes) {
  return distanceKm / (minutes / 60)
}
