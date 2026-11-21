// =============================================================
//  Nutrition : repères du jour d'après les séances du calendrier
//  Sources : thomas2016, burke2011 (glucides), jager2017 (protéines),
//  jeukendrup2014 + tiller2019 (pendant l'effort), sawka2007 (eau).
//  Ce sont des repères généraux, pas un avis médical ou diététique individuel.
// =============================================================
import { trouverRegle } from '../../data/coach/rules.js'
import { energieDuJour } from './energie.js'

export const CLASSES_CHARGE = {
  leger: { nom: 'Jour léger', detail: 'repos ou renforcement' },
  modere: { nom: 'Jour modéré', detail: 'sortie facile ou activité courte' },
  eleve: { nom: 'Jour élevé', detail: 'séance qualité, sortie longue ou sport intense' },
  tres_eleve: { nom: 'Jour très élevé', detail: '4 heures d’effort ou plus' },
}

const estCardio = (s) => s.module !== 'renfo'

// Charge du jour d'après les séances prévues ce jour-là (choix « classe-charge »)
export function classeCharge(seances) {
  const cardio = seances.filter(estCardio)
  const minutes = cardio.reduce((t, s) => t + (s.dureeMin || 0), 0)
  if (minutes >= 240) return 'tres_eleve'
  const dur = cardio.some((s) => s.intense || s.type === 'longue' || s.type === 'qualite' || s.type === 'course')
  if (dur || minutes >= 90) return 'eleve'
  if (minutes >= 30) return 'modere'
  return 'leger'
}

const arrondi = (x, pas = 5) => Math.round(x / pas) * pas

export function macrosDuJour({ profil, seances }) {
  const classe = classeCharge(seances)
  const gj = trouverRegle('glucides-jour').params[classe]
  const pr = trouverRegle('proteines-jour').params
  const eau = trouverRegle('hydratation').params
  const poids = profil.poidsKg
  const cibleGkg = (gj[0] + gj[1]) / 2
  return {
    classe,
    energie: energieDuJour({ profil, seances }),
    glucides: {
      gkg: gj,
      grammes: [arrondi(gj[0] * poids, 10), arrondi(gj[1] * poids, 10)],
      cibleG: arrondi(cibleGkg * poids, 10),
    },
    proteines: {
      gkg: [pr.min, pr.max],
      grammes: [arrondi(pr.min * poids), arrondi(pr.max * poids)],
      parPriseG: [pr.parPriseAbsoluG[0], pr.parPriseAbsoluG[1]],
      parPriseGkg: pr.parPriseGkg,
      parPriseCibleG: arrondi(pr.parPriseGkg * poids, 5),
    },
    eau: { perteMaxKg: Math.round(((eau.perteMaxPct / 100) * poids) * 10) / 10, perteMaxPct: eau.perteMaxPct },
    regles: ['glucides-jour', 'proteines-jour', 'hydratation', 'bmr-mifflin', 'depense-met'],
  }
}

// Plan de ravitaillement pour une séance longue (null si trop courte pour en avoir besoin)
export function planRavitaillement(seance) {
  const p = trouverRegle('glucides-effort').params
  const minutes = seance.dureeMin || 0
  if (minutes < p.seuilPlanMin) return null
  const h = minutes / 60
  const longEffort = minutes >= p.longMin
  const gh = longEffort ? [p.hautGh, p.ultraGh] : [p.basGh, p.hautGh]
  return {
    glucidesGh: gh,
    totalG: [Math.round(gh[0] * h), Math.round(gh[1] * h)],
    melange: longEffort,
    conseils: [
      'Prends des glucides par petites quantités régulières (gel, boisson sucrée, fruits secs…), pas tout d’un coup.',
      longEffort
        ? 'Au-delà de 2 h 30, privilégie un mélange glucose + fructose pour dépasser 60 g/h.'
        : 'Un seul type de sucre suffit à ce niveau (jusqu’à 60 g/h).',
      'Teste ta stratégie pendant les sorties longues, jamais pour la première fois le jour de la course.',
      'Pèse-toi avant et après : une perte de plus de 2 % du poids indique qu’il faut boire davantage.',
    ],
    regles: ['glucides-effort', 'hydratation'],
  }
}
