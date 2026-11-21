// =============================================================
//  Analyse du journal : historique de course, alertes, progression
//  (fonctions pures : elles ne touchent ni à Firebase ni à l'écran)
// =============================================================
import { ajouterJours, aujourdhui, diffJours, lundiDe } from './dates.js'
import { alertesSpike, evaluerSpike } from './spike.js'
import { conflitsIntensite } from './plans.js'

const FAITE = (s) => s.statut === 'faite' || s.statut === 'courte'
const EST_COURSE = (s) => s.module === 'course' || s.type === 'libre'

// Distance réellement courue d'une séance faite (null si inconnue)
export function distanceFaite(s) {
  if (!FAITE(s) || !EST_COURSE(s)) return null
  if (typeof s.distanceReelleKm === 'number' && s.distanceReelleKm > 0) return s.distanceReelleKm
  if (s.statut === 'faite' && s.distanceKm > 0) return s.distanceKm
  return null
}

export function baselineDuProfil(profil) {
  if (!profil?.plusLongueKm) return []
  return [{ date: profil.plusLongueDate || aujourdhui(), distanceKm: Number(profil.plusLongueKm) }]
}

// Sorties de course faites + la plus longue sortie connue du profil
export function historiqueCourse(seances, profil) {
  const h = [...baselineDuProfil(profil)]
  for (const s of seances) {
    const d = distanceFaite(s)
    if (d) h.push({ date: s.date, distanceKm: d })
  }
  return h
}

// Évaluation d'une séance (prévue ou faite) par rapport à ce qui a vraiment été couru avant
export function evaluerSeance(seance, seances, profil) {
  const km = distanceFaite(seance) || seance.distanceKm
  if (!km || !EST_COURSE(seance) || seance.type === 'course') return null
  const autres = seances.filter((s) => s.id !== seance.id)
  return evaluerSpike({ distanceKm: km, date: seance.date, historique: historiqueCourse(autres, profil) })
}

export function alertesDuJour(seances, profil, jour = aujourdhui()) {
  const alertes = []
  const faites = seances.filter((s) => distanceFaite(s) && s.date >= ajouterJours(jour, -14))
  for (const a of alertesSpike(
    faites.map((s) => ({ id: s.id, date: s.date, distanceKm: distanceFaite(s), titre: s.titre })),
    historiqueCourse(seances.filter((s) => s.date < ajouterJours(jour, -14)), profil)
  )) {
    alertes.push({ niveau: a.niveau, texte: `${a.titre} du ${a.date} : ${a.message}`, regles: ['spike-seance-10pct'] })
  }
  const proches = seances.filter((s) => s.statut === 'prevue' && s.date >= jour && s.date <= ajouterJours(jour, 2))
  for (const s of proches) {
    const ev = evaluerSeance(s, seances, profil)
    if (ev && (ev.niveau === 'orange' || ev.niveau === 'rouge')) {
      alertes.push({ niveau: ev.niveau, texte: `${s.titre} prévue le ${s.date} : ${ev.message} Raccourcis-la ou fais-la plus tard.`, regles: ['spike-seance-10pct'] })
    }
  }
  const semaine = seances.filter((s) => s.statut === 'prevue' && s.date >= jour && s.date <= ajouterJours(jour, 7))
  for (const m of conflitsIntensite(semaine)) alertes.push({ niveau: 'orange', texte: m, regles: ['distribution-intensite'] })
  return alertes
}

// ---------- Progression ----------
export function statsSemaines(seances, jour = aujourdhui(), nombre = 8) {
  const lundiCourant = lundiDe(jour)
  const semaines = []
  for (let i = nombre - 1; i >= 0; i--) {
    const lundi = ajouterJours(lundiCourant, -7 * i)
    const dans = seances.filter((s) => s.date >= lundi && s.date <= ajouterJours(lundi, 6))
    const suivies = dans.filter((s) => s.type !== 'fixe')
    const faites = suivies.filter(FAITE)
    semaines.push({
      lundi,
      courante: i === 0,
      km: Math.round(dans.reduce((t, s) => t + (distanceFaite(s) || 0), 0) * 10) / 10,
      minutes: dans.filter(FAITE).reduce((t, s) => t + (s.dureeReelleMin || s.dureeMin || 0), 0),
      nbFaites: faites.length,
      nbPrevues: suivies.length,
      validee: suivies.length > 0 && faites.length === suivies.length,
    })
  }
  return semaines
}

// Nombre de semaines « validées » d'affilée (la semaine en cours compte si elle est déjà validée)
export function serieSemaines(seances, jour = aujourdhui()) {
  if (!seances.length) return 0
  const premier = seances.reduce((m, s) => (s.date < m ? s.date : m), seances[0].date)
  const nb = Math.max(1, Math.ceil(diffJours(lundiDe(premier), lundiDe(jour)) / 7) + 1)
  const semaines = statsSemaines(seances, jour, Math.min(nb, 104)).reverse()
  let serie = 0
  for (const s of semaines) {
    if (s.validee) serie++
    else if (s.courante) continue // semaine en cours pas encore finie : elle ne casse pas la série
    else break
  }
  return serie
}
