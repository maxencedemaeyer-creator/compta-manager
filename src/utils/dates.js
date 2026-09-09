// Clé "YYYY-MM" pour une date donnée (utilisée comme identifiant de mois, ex. pour vélo/études)
export function moisKeyFromDate(date) {
  const d = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export function moisKeyActuel() {
  return moisKeyFromDate(new Date())
}

export function moisKeyPrecedent(moisKey = moisKeyActuel()) {
  const [year, month] = moisKey.split('-').map(Number)
  const d = new Date(year, month - 1, 1)
  d.setMonth(d.getMonth() - 1)
  return moisKeyFromDate(d)
}

export function anneeActuelle() {
  return new Date().getFullYear()
}

export function anneeDeMoisKey(moisKey) {
  return Number(moisKey.split('-')[0])
}

// Génère `count` dates hebdomadaires en partant de `startDate` (incluse), même heure/jour chaque semaine.
export function genererDatesRecurrentes(startDate, count) {
  const dates = []
  const base = startDate instanceof Date ? startDate : new Date(startDate)
  for (let i = 0; i < count; i++) {
    const d = new Date(base)
    d.setDate(d.getDate() + i * 7)
    dates.push(d)
  }
  return dates
}
