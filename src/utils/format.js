const currencyFormatter = new Intl.NumberFormat('fr-BE', {
  style: 'currency',
  currency: 'EUR',
})

export function formatEuros(value) {
  const n = Number.isFinite(value) ? value : 0
  return currencyFormatter.format(n)
}

const dateFormatter = new Intl.DateTimeFormat('fr-BE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

export function formatDate(date) {
  if (!date) return ''
  const d = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date)
  return dateFormatter.format(d)
}

const MOIS_LABELS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
]

// Transforme une clé "YYYY-MM" en libellé lisible : "Septembre 2026"
export function formatMoisLabel(moisKey) {
  if (!moisKey) return ''
  const [year, month] = moisKey.split('-').map(Number)
  return `${MOIS_LABELS[month - 1]} ${year}`
}

const jourSemaineFormatter = new Intl.DateTimeFormat('fr-BE', { weekday: 'long' })

// Nom complet du jour de semaine pour une date donnée : "Lundi", "Mardi"... (utilisé devant les dates d'étude)
export function formatJourSemaine(date) {
  if (!date) return ''
  const d = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date)
  const libelle = jourSemaineFormatter.format(d)
  return libelle.charAt(0).toUpperCase() + libelle.slice(1)
}

const JOURS_COURTS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']

// Libellé court d'un jour de semaine (index 0 = lundi ... 6 = dimanche), pour l'en-tête du calendrier
export function libelleJourCourt(index) {
  return JOURS_COURTS[index]
}

const dateLongueFormatter = new Intl.DateTimeFormat('fr-BE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

// Formate une date en toutes lettres : "Mardi 9 septembre 2026" (titre du panneau "jour" du calendrier)
export function formatDateLongue(date) {
  if (!date) return ''
  const d = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date)
  const libelle = dateLongueFormatter.format(d)
  return libelle.charAt(0).toUpperCase() + libelle.slice(1)
}
