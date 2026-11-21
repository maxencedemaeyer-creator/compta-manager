// =============================================================
//  Règle du « spike » de séance (source : frandsen2025)
//  Une sortie ne devrait pas dépasser de plus de 10 % la plus longue sortie
//  des 30 derniers jours. Orange de 10 à 30 %, rouge au-delà de 30 %.
// =============================================================
import { trouverRegle } from '../../data/coach/rules.js'
import { ajouterJours } from './dates.js'

const P = () => trouverRegle('spike-seance-10pct').params

// historique : [{ date: 'AAAA-MM-JJ', distanceKm }] (sorties faites ou prévues, hors sautées)
export function plusLongueSortie(historique, dateIso, fenetre = P().fenetreJours) {
  const debut = ajouterJours(dateIso, -fenetre)
  let ref = 0
  for (const s of historique) {
    if (s.date >= debut && s.date < dateIso && s.distanceKm > ref) ref = s.distanceKm
  }
  return ref
}

export function limiteSortie(historique, dateIso) {
  const ref = plusLongueSortie(historique, dateIso)
  return ref * (1 + P().seuilVigilance)
}

export function evaluerSpike({ distanceKm, date, historique }) {
  const { seuilVigilance, seuilAlerte } = P()
  const refKm = plusLongueSortie(historique, date)
  if (!refKm) {
    return { niveau: 'aucune_ref', refKm: 0, ratio: null, excesPct: null, maxKm: null, message: 'Pas de sortie dans les 30 derniers jours : aucune référence pour comparer.' }
  }
  const ratio = distanceKm / refKm
  const excesPct = Math.round((ratio - 1) * 100)
  const maxKm = refKm * (1 + seuilVigilance)
  let niveau = 'ok'
  if (ratio > 1 + seuilAlerte + 1e-9) niveau = 'rouge'
  else if (ratio > 1 + seuilVigilance + 1e-9) niveau = 'orange'
  const messages = {
    ok: `Dans la limite : ${distanceKm.toLocaleString('fr-BE', { maximumFractionDigits: 1 })} km pour une plus longue sortie récente de ${refKm.toLocaleString('fr-BE', { maximumFractionDigits: 1 })} km.`,
    orange: `Cette sortie dépasse de ${excesPct} % ta plus longue sortie des 30 derniers jours (${refKm.toLocaleString('fr-BE', { maximumFractionDigits: 1 })} km). Limite conseillée : ${maxKm.toLocaleString('fr-BE', { maximumFractionDigits: 1 })} km.`,
    rouge: `Cette sortie dépasse de ${excesPct} % ta plus longue sortie des 30 derniers jours (${refKm.toLocaleString('fr-BE', { maximumFractionDigits: 1 })} km). Limite conseillée : ${maxKm.toLocaleString('fr-BE', { maximumFractionDigits: 1 })} km.`,
  }
  return { niveau, refKm, ratio, excesPct, maxKm, message: messages[niveau] }
}

// Alertes pour toute une liste de sorties (ordre chronologique) : chaque sortie est comparée aux précédentes
export function alertesSpike(sorties, baseline = []) {
  const triees = [...sorties].filter((s) => s.distanceKm > 0).sort((a, b) => (a.date < b.date ? -1 : 1))
  const resultats = []
  const historique = [...baseline]
  for (const s of triees) {
    const evalu = evaluerSpike({ distanceKm: s.distanceKm, date: s.date, historique })
    if (evalu.niveau === 'orange' || evalu.niveau === 'rouge') resultats.push({ ...evalu, id: s.id, date: s.date, distanceKm: s.distanceKm, titre: s.titre })
    historique.push({ date: s.date, distanceKm: s.distanceKm })
  }
  return resultats
}
