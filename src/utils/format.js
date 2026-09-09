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
