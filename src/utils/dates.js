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

// Clé "YYYY-MM" du mois suivant celui donné (utilisé pour la navigation du calendrier)
export function moisKeySuivant(moisKey = moisKeyActuel()) {
  const [year, month] = moisKey.split('-').map(Number)
  const d = new Date(year, month - 1, 1)
  d.setMonth(d.getMonth() + 1)
  return moisKeyFromDate(d)
}

export function anneeActuelle() {
  return new Date().getFullYear()
}

export function anneeDeMoisKey(moisKey) {
  return Number(moisKey.split('-')[0])
}

// Clé "YYYY-MM-DD" pour une date donnée (identifiant unique du jour, utilisé pour le calendrier des études)
export function dateKeyFromDate(date) {
  const d = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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

// Grille de semaines (LU -> DI) couvrant entièrement le mois donné ("YYYY-MM"),
// complétée par les jours du mois précédent/suivant nécessaires pour former des
// semaines pleines de 7 jours (vue calendrier mensuelle classique, façon iCal).
export function grilleCalendrier(moisKey) {
  const [year, month] = moisKey.split('-').map(Number)
  const premierJour = new Date(year, month - 1, 1)
  const dernierJour = new Date(year, month, 0)

  // getDay() : 0 = dimanche ... 6 = samedi. On décale pour que la semaine démarre le lundi.
  const decalageDebut = (premierJour.getDay() + 6) % 7
  const decalageFin = (7 - ((dernierJour.getDay() + 6) % 7) - 1 + 7) % 7

  const debut = new Date(premierJour)
  debut.setDate(debut.getDate() - decalageDebut)
  const fin = new Date(dernierJour)
  fin.setDate(fin.getDate() + decalageFin)

  const jours = []
  const curseur = new Date(debut)
  while (curseur <= fin) {
    jours.push(new Date(curseur))
    curseur.setDate(curseur.getDate() + 1)
  }

  const semaines = []
  for (let i = 0; i < jours.length; i += 7) {
    semaines.push(jours.slice(i, i + 7))
  }
  return semaines
}
