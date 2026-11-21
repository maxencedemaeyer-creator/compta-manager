// Dates du Coach : toujours des textes « AAAA-MM-JJ » (jour local), jamais d'heure.
// On travaille à midi pour éviter tout décalage lié à l'heure d'été.

export function parseIso(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0)
}

export function toIso(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function aujourdhui() {
  return toIso(new Date())
}

export function ajouterJours(iso, n) {
  const d = parseIso(iso)
  d.setDate(d.getDate() + n)
  return toIso(d)
}

export function diffJours(isoA, isoB) {
  // nombre de jours de A à B (positif si B est après A)
  return Math.round((parseIso(isoB) - parseIso(isoA)) / 86400000)
}

// Jour de la semaine ISO : 1 = lundi … 7 = dimanche
export function jourIso(iso) {
  const j = parseIso(iso).getDay()
  return j === 0 ? 7 : j
}

export function lundiDe(iso) {
  return ajouterJours(iso, 1 - jourIso(iso))
}

// Premier lundi à partir de la date (la date elle-même si c'est un lundi)
export function prochainLundi(iso) {
  const l = lundiDe(iso)
  return l === iso ? iso : ajouterJours(l, 7)
}

export const JOURS_COURTS = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.']
export const JOURS_LONGS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

const MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

export function nomJour(iso, long = true) {
  const i = jourIso(iso) - 1
  return (long ? JOURS_LONGS : JOURS_COURTS)[i]
}

export function formatCourt(iso) {
  const d = parseIso(iso)
  return `${d.getDate()} ${MOIS_COURTS[d.getMonth()]}`
}

export function formatLong(iso) {
  const d = parseIso(iso)
  return `${nomJour(iso)} ${d.getDate()} ${MOIS[d.getMonth()]}`
}

export function formatMoisAnnee(iso) {
  const d = parseIso(iso)
  return `${MOIS[d.getMonth()]} ${d.getFullYear()}`
}

export function joursDeLaSemaine(lundiIso) {
  return Array.from({ length: 7 }, (_, i) => ajouterJours(lundiIso, i))
}

// Toutes les dates d'une grille de mois (lundi à dimanche, semaines complètes)
export function grilleDuMois(isoDansLeMois) {
  const d = parseIso(isoDansLeMois)
  const premier = toIso(new Date(d.getFullYear(), d.getMonth(), 1, 12))
  const dernier = toIso(new Date(d.getFullYear(), d.getMonth() + 1, 0, 12))
  const debut = lundiDe(premier)
  const fin = ajouterJours(lundiDe(dernier), 6)
  const jours = []
  for (let cur = debut; cur <= fin; cur = ajouterJours(cur, 1)) jours.push(cur)
  return jours
}

export function memeMois(isoA, isoB) {
  return isoA.slice(0, 7) === isoB.slice(0, 7)
}
