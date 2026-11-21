// =============================================================
//  Plan « Débutant 5K » d'après le programme NHS Couch to 5K
//  (https://www.nhs.uk/better-health/get-active/get-running-with-couch-to-5k/)
//  Les durées (secondes) ont été relevées sur la page officielle le 21 nov. 2026.
//  Les textes sont écrits par nous. Source : nhsC25k.
//  Chaque sortie : 5 min de marche rapide, la partie « blocs », 5 min de marche calme.
//  Un bloc : { t: 'course' | 'marche', min: durée en minutes }
// =============================================================

const c = (min) => ({ t: 'course', min })
const m = (min) => ({ t: 'marche', min })

// Répète [course x, marche y] n fois, puis une dernière course
const serie = (courseMin, marcheMin, n) => {
  const blocs = []
  for (let i = 0; i < n; i++) blocs.push(c(courseMin), m(marcheMin))
  blocs.push(c(courseMin))
  return blocs
}

export const C25K_SEMAINES = [
  { semaine: 1, sorties: [serie(1, 1.5, 7), serie(1, 1.5, 7), serie(1, 1.5, 7)] },
  { semaine: 2, sorties: [serie(1.5, 2, 5), serie(1.5, 2, 5), serie(1.5, 2, 5)] },
  {
    semaine: 3,
    sorties: Array(3).fill([c(1.5), m(1.5), c(3), m(3), c(1.5), m(1.5), c(3)]),
  },
  {
    semaine: 4,
    sorties: Array(3).fill([c(3), m(1.5), c(5), m(2.5), c(3), m(1.5), c(5)]),
  },
  {
    semaine: 5,
    sorties: [
      [c(5), m(3), c(5), m(3), c(5)],
      [c(8), m(5), c(8)],
      [c(20)],
    ],
  },
  {
    semaine: 6,
    sorties: [
      [c(5), m(3), c(8), m(3), c(5)],
      [c(10), m(3), c(10)],
      [c(25)],
    ],
  },
  { semaine: 7, sorties: Array(3).fill([c(25)]) },
  { semaine: 8, sorties: Array(3).fill([c(28)]) },
  { semaine: 9, sorties: Array(3).fill([c(30)]) },
]

export const C25K_ECHAUFFEMENT_MIN = 5
export const C25K_RETOUR_CALME_MIN = 5

export function dureeBlocs(blocs) {
  return blocs.reduce((s, b) => s + b.min, 0)
}

export function minutesCourse(blocs) {
  return blocs.filter((b) => b.t === 'course').reduce((s, b) => s + b.min, 0)
}

export function formatMinutes(min) {
  const totalSec = Math.round(min * 60)
  const mm = Math.floor(totalSec / 60)
  const ss = totalSec % 60
  if (ss === 0) return `${mm} min`
  return `${mm} min ${String(ss).padStart(2, '0')} s`
}

// Résumé lisible d'une sortie : « 8 × 1 min de course / 1 min 30 s de marche »
export function resumeBlocs(blocs) {
  const runs = blocs.filter((b) => b.t === 'course')
  const total = minutesCourse(blocs)
  if (runs.length === 1) return `${formatMinutes(runs[0].min)} de course continue`
  const duree = [...new Set(runs.map((r) => r.min))]
  const premier = duree.length === 1 ? `${runs.length} × ${formatMinutes(duree[0])} de course` : `${runs.length} courses (${duree.map(formatMinutes).join(', ')})`
  return `${premier}, ${formatMinutes(total)} de course au total`
}
