// =============================================================
//  Générateurs de plans du Coach (fonctions pures, testées par Vitest)
//  - planCourse : préparation 5K / 10K / semi / marathon (VDOT, spike, affûtage)
//  - planC25k   : « Débutant 5K » d'après le NHS
//  - planRenfo  : renforcement général (ACSM 2026) + prévention ischios
//  Chaque séance porte la liste de ses règles (ids de data/coach/rules.js).
// =============================================================
import { trouverRegle } from '../../data/coach/rules.js'
import { C25K_SEMAINES, C25K_ECHAUFFEMENT_MIN, C25K_RETOUR_CALME_MIN, dureeBlocs, formatMinutes, minutesCourse, resumeBlocs } from '../../data/coach/c25k.js'
import { ajouterJours, diffJours, jourIso, lundiDe, prochainLundi } from './dates.js'
import { allures, formatAllure, formatTemps, lireTemps, tempsPourVdot, vdotDepuisCourse } from './vdot.js'
import { evaluerSpike } from './spike.js'
import { EXERCICES } from '../../data/coach/exercices.js'

const arrondiMoins = (x, pas) => Math.floor(x / pas + 1e-9) * pas
const arrondiPlus = (x, pas) => Math.ceil(x / pas - 1e-9) * pas
const arrondi = (x, pas) => Math.round(x / pas) * pas
const km1 = (x) => (Math.round(x * 10) / 10).toLocaleString('fr-BE', { maximumFractionDigits: 1 })

export const DISTANCES_COURSE = [
  { id: '5k', nom: '5 km', km: 5 },
  { id: '10k', nom: '10 km', km: 10 },
  { id: 'semi', nom: 'Semi-marathon', km: 21.0975 },
  { id: 'marathon', nom: 'Marathon', km: 42.195 },
]

// ---------- Profil → VDOT ----------
export function vdotDuProfil(profil) {
  if (profil.vdotManuel) return Number(profil.vdotManuel)
  const perf = profil.perfRecente
  if (!perf?.distanceKm || !perf?.temps) return null
  const sec = lireTemps(perf.temps)
  if (!sec) return null
  return vdotDepuisCourse(perf.distanceKm * 1000, sec)
}

export function plafondSortieLongue(distanceCourseKm, plusLongueKm) {
  const choix = trouverRegle('spike-seance-10pct').params
  const seuil = 1 + choix.seuilVigilance
  let cap = arrondiPlus(distanceCourseKm / seuil, 0.5)
  if (distanceCourseKm > 32) cap = 32 // marathon : plafond pratique (voir CHOIX_APPLI « plafond-sortie-longue »)
  return Math.max(cap, plusLongueKm)
}

// ---------- Séances de course ----------
const REGLES_COURSE = {
  facile: ['distribution-intensite', 'spike-seance-10pct', 'allures-vdot'],
  qualite: ['allures-vdot', 'distribution-intensite', 'spike-seance-10pct'],
  longue: ['spike-seance-10pct', 'distribution-intensite', 'allures-vdot'],
}

function dureeDe(km, secParKm) {
  return Math.round((km * secParKm) / 60)
}

function seanceFacile({ date, km, al, optionCadence, taper }) {
  const duree = dureeDe(km, al.E)
  const blocs = [
    { titre: 'Sortie facile', detail: `${km1(km)} km à allure E (autour de ${formatAllure(al.E)}, entre ${formatAllure(al.E_rapide)} et ${formatAllure(al.E_lente)}). Tu dois pouvoir parler en phrases complètes.` },
  ]
  const regles = [...REGLES_COURSE.facile]
  if (optionCadence) {
    blocs.push({ titre: 'Option cadence', detail: 'Essaie d’augmenter ta cadence de 5 à 10 % (pas plus courts, plus rapides) pour ménager genoux et hanches.' })
    regles.push('cadence')
  }
  if (taper) regles.push('affutage')
  return {
    date,
    type: 'facile',
    module: 'course',
    intense: false,
    titre: 'Sortie facile',
    resume: `${km1(km)} km tranquilles`,
    distanceKm: km,
    dureeMin: duree,
    blocs,
    versionCourte: { titre: 'Version 30 min', detail: '30 minutes à allure facile, au ressenti, sans regarder l’allure.' },
    criteres: ['Respiration calme, conversation possible', 'Fin de séance sans douleur', 'Effort ressenti (RPE) autour de 3-4 sur 10'],
    regles,
  }
}

function descriptionQualite(typeQ, p, al, tailleReduite, allureCourse) {
  const r = tailleReduite // 1 = normal, <1 = affûtage
  const E = al.E
  const km = (minutes, allure) => (minutes * 60) / allure
  let travail
  let blocsTravail
  let titre
  let intitule
  let kmTravail
  if (typeQ === 'T_continu') {
    const min = Math.round((15 + 10 * p) * r)
    titre = 'Tempo au seuil'
    intitule = `${min} min continues à allure T`
    kmTravail = km(min, al.T)
    blocsTravail = [{ titre: 'Corps de séance', detail: `${min} minutes d’affilée à allure T (${formatAllure(al.T)}) : « confortablement dur », phrases très courtes seulement.` }]
    travail = intitule
  } else if (typeQ === 'T_fractionne') {
    const reps = (p > 0.6 ? 4 : 3)
    const rep = Math.max(2, Math.round(7 * r))
    titre = 'Seuil fractionné'
    intitule = `${reps} × ${rep} min à allure T`
    kmTravail = km(reps * rep, al.T) + km(reps - 1, E)
    blocsTravail = [{ titre: 'Corps de séance', detail: `${reps} × ${rep} minutes à allure T (${formatAllure(al.T)}), 1 minute de trot lent entre chaque.` }]
    travail = intitule
  } else if (typeQ === 'M_bloc') {
    const blocKm = Math.max(1, Math.round((2.5 + 1.5 * p) * r * 2) / 2)
    titre = 'Allure de course'
    intitule = `2 × ${km1(blocKm)} km à allure de course`
    kmTravail = blocKm * 2 + 0.5
    blocsTravail = [{ titre: 'Corps de séance', detail: `2 blocs de ${km1(blocKm)} km à allure objectif estimée (${formatAllure(allureCourse)}), avec 3 minutes de trot entre les deux.` }]
    travail = intitule
  } else {
    const reps = p > 0.5 ? 6 : 5
    const rr = Math.max(2, Math.round(reps * r))
    titre = 'Intervalles courts'
    intitule = `${rr} × 3 min à allure I`
    kmTravail = km(rr * 3, al.I) + km((rr - 1) * 2.5, E)
    blocsTravail = [{ titre: 'Corps de séance', detail: `${rr} × 3 minutes à allure I (${formatAllure(al.I)}), 2 min 30 s de trot lent entre les répétitions. Dur mais maîtrisé.` }]
    travail = intitule
  }
  return { titre, intitule, travail, kmTravail, blocsTravail }
}

function seanceQualite({ date, typeQ, p, al, allureCourse, reduit = 1, taper = false }) {
  const d = descriptionQualite(typeQ, p, al, reduit, allureCourse)
  const km = Math.round((2 + d.kmTravail + 1.5) * 2) / 2
  const duree = dureeDe(2 + 1.5, al.E) + Math.round((d.kmTravail * (typeQ === 'M_bloc' ? allureCourse : typeQ === 'I_court' ? al.I : al.T)) / 60)
  const blocs = [
    { titre: 'Échauffement', detail: `2 km à allure facile (${formatAllure(al.E)}), puis quelques accélérations progressives.` },
    ...d.blocsTravail,
    { titre: 'Retour au calme', detail: `1,5 km très facile, puis marche.` },
  ]
  return {
    date,
    type: 'qualite',
    module: 'course',
    intense: true,
    titre: d.titre,
    resume: d.intitule,
    distanceKm: km,
    dureeMin: duree,
    blocs,
    versionCourte: { titre: 'Version 30 min', detail: `10 min d’échauffement facile, ${typeQ === 'I_court' ? '3 × 2 min à allure I' : '2 × 6 min à allure T'}, 5 min de retour au calme.` },
    criteres: ['Allures tenues sur toutes les répétitions', 'Dernier effort aussi bon que le premier', 'Effort ressenti (RPE) autour de 7-8 sur 10 sur le corps de séance'],
    regles: [...REGLES_COURSE.qualite, ...(taper ? ['affutage'] : [])],
  }
}

function seanceLongue({ date, km, al, taper }) {
  const duree = dureeDe(km, al.E)
  return {
    date,
    type: 'longue',
    module: 'course',
    intense: false,
    titre: 'Sortie longue',
    resume: `${km1(km)} km à allure facile`,
    distanceKm: km,
    dureeMin: duree,
    blocs: [
      { titre: 'Sortie longue', detail: `${km1(km)} km à allure E (${formatAllure(al.E)} environ), en gardant le ressenti « facile » du début à la fin.` },
    ],
    versionCourte: { titre: 'Version 30 min', detail: '30 minutes facile si tu es fatigué ; reprends la sortie longue au prochain créneau sans la « rattraper ».' },
    criteres: ['Fin de sortie sans douleur', 'Allure régulière, pas de départ trop rapide', 'Ravitaillement testé si plus de 75 minutes'],
    regles: [...REGLES_COURSE.longue, ...(taper ? ['affutage'] : [])],
  }
}

function seanceCourse({ date, distanceKm, vdot, al, tempsCible }) {
  const predSec = tempsPourVdot(vdot, distanceKm * 1000)
  const cibleSec = lireTemps(tempsCible)
  return {
    date,
    type: 'course',
    module: 'course',
    intense: true,
    titre: 'Course objectif',
    resume: `${km1(distanceKm)} km — estimation ${formatTemps(predSec)}`,
    distanceKm,
    dureeMin: Math.round(predSec / 60),
    blocs: [
      { titre: 'Avant la course', detail: '15 minutes d’échauffement facile et quelques accélérations progressives. Rien de nouveau (chaussures, repas, ravitaillement).' },
      { titre: 'Course', detail: `Estimation d’après ton VDOT : ${formatTemps(predSec)} (${formatAllure(predSec / distanceKm)}).${cibleSec ? ` Objectif visé : ${formatTemps(cibleSec)} (${formatAllure(cibleSec / distanceKm)}).` : ''} Pars à l’allure visée, jamais plus vite sur le premier tiers.` },
    ],
    versionCourte: null,
    criteres: ['Allure régulière sur la première moitié', 'Ravitaillement pris comme à l’entraînement'],
    regles: ['prediction-chrono', 'spike-seance-10pct', 'affutage', 'allures-vdot'],
  }
}

// ---------- Séances de renforcement ----------
const PARAMS_RENFO = () => trouverRegle('renfo-acsm2026').params

const MODELE_A = [
  { cle: 'squat_goblet', series: '3', reps: 'charge lourde (~80 % de ton 1RM)' },
  { cle: 'souleve_roumain', series: '3', reps: 'charge lourde (~80 % de ton 1RM)' },
  { cle: 'pompes', series: '3', reps: '8 à 12' },
  { cle: 'rowing_haltere', series: '3', reps: 'charge lourde (~80 % de ton 1RM)' },
  { cle: 'mollets_debout', series: '2', reps: '10 à 15' },
  { cle: 'planche', series: '2', reps: 'tenir 30 à 45 s' },
]
const MODELE_B = [
  { cle: 'fentes', series: '3', reps: 'charge lourde (~80 % de ton 1RM)' },
  { cle: 'pont_fessier_une_jambe', series: '3', reps: '8 à 12 par jambe' },
  { cle: 'pompes', series: '3', reps: '8 à 12' },
  { cle: 'rowing_haltere', series: '3', reps: 'charge lourde (~80 % de ton 1RM)' },
  { cle: 'squat_saute', series: '2', reps: '6, atterrissage doux' },
  { cle: 'gainage_lateral', series: '2', reps: 'tenir 20 à 30 s de chaque côté' },
]

function seanceRenfo({ date, modele, indice, antecedents = [], allege = false }) {
  const hanches = antecedents.includes('bandelette')
  const ischios = antecedents.includes('ischios')
  let exos = (modele === 'A' ? MODELE_A : MODELE_B).map((e) => ({ ...e }))
  if (hanches) exos.push(modele === 'A' ? { cle: 'montee_banc', series: '2', reps: '8 à 10 par jambe' } : { cle: 'marche_laterale_elastique', series: '2', reps: '12 pas de chaque côté' })
  if (ischios) exos.push({ cle: 'nordic', series: '2', reps: '4 à 6, très lentes, arrêt si douleur' })
  // Semaines d'affûtage : on garde l'essentiel (4 premiers exercices + Nordic) avec une série de moins
  if (allege) exos = exos.filter((e, i) => i < 4 || e.cle === 'nordic')
  const blocs = exos.map((e) => ({
    titre: EXERCICES[e.cle].nom,
    exerciceCle: e.cle,
    detail: `${allege ? Math.max(1, Number(e.series) - 1) : e.series} séries × ${e.reps}. ${EXERCICES[e.cle].consigne}`,
  }))
  const regles = ['renfo-acsm2026', 'force-economie-course']
  if (ischios) regles.push('nordic-ischios')
  const { frequenceMinParGroupe, force1RMpct } = PARAMS_RENFO()
  return {
    date,
    type: 'renfo',
    module: 'renfo',
    intense: false,
    titre: `Renforcement ${modele}`,
    resume: `${exos.length} exercices, corps entier${ischios ? ' + ischios' : ''}${hanches ? ' + hanches' : ''}`,
    distanceKm: null,
    dureeMin: allege ? 25 : 40,
    blocs,
    versionCourte: { titre: 'Version 30 min', detail: 'Garde les 3 premiers exercices en 2 séries chacun, et ajoute le Nordic hamstring si tu l’as dans ta séance.' },
    criteres: ['Charge choisie : les dernières répétitions sont dures mais propres', `Chaque grand groupe est travaillé au moins ${frequenceMinParGroupe} fois dans la semaine`, `Charge « lourde » ≈ ${force1RMpct} % du 1RM pour les exercices de force`],
    regles,
    indice,
  }
}

// ---------- Sports fixes (padel…) ----------
export function seancesFixes(profil, debut, fin) {
  const sorties = []
  for (const f of profil.fixes || []) {
    for (let d = debut; d <= fin; d = ajouterJours(d, 1)) {
      if (jourIso(d) === Number(f.jour)) {
        sorties.push({
          date: d,
          type: 'fixe',
          module: 'autre',
          sport: f.nom,
          intense: !!f.intense,
          titre: f.nom,
          resume: `${f.heure || ''} · ${f.dureeMin || 90} min${f.intense ? ' · sport intense' : ''}`.replace(/^ · /, ''),
          distanceKm: null,
          dureeMin: Number(f.dureeMin) || 90,
          blocs: [{ titre: f.nom, detail: 'Activité fixe déclarée dans ton profil. Elle compte dans la charge de ta semaine.' }],
          versionCourte: null,
          criteres: [],
          regles: ['depense-met'],
        })
      }
    }
  }
  return sorties
}

// ---------- Plan course ----------
const CYCLE_QUALITE = ['T_continu', 'T_fractionne', 'M_bloc', 'I_court']

export function planCourse(profil, aujourdhuiIso) {
  const avertissements = []
  const obj = profil.objectif
  const vdot = vdotDuProfil(profil)
  if (!obj?.date || !obj?.distanceKm) throw new Error('Objectif de course manquant (distance et date).')
  if (!vdot) throw new Error('Ajoute une performance récente (distance + temps) pour calculer le VDOT.')

  const debut = prochainLundi(aujourdhuiIso)
  const lundiCourse = lundiDe(obj.date)
  const n = Math.round(diffJours(debut, lundiCourse) / 7) + 1
  if (n < 2) throw new Error('La course est trop proche pour générer un plan (il faut au moins 2 semaines).')
  if (n < 4) avertissements.push({ niveau: 'info', texte: `Plan très court (${n} semaines) : l’affûtage prend déjà 2 semaines.`, regles: ['affutage'] })

  const al = allures(vdot)
  const distance = obj.distanceKm
  const allureCourse = tempsPourVdot(vdot, distance * 1000) / distance
  const base = Number(profil.plusLongueKm) || 8
  const cap = plafondSortieLongue(distance, base)
  const sem = profil.semaine || {}
  const jours = {
    qualite: Number(sem.qualite) || 1,
    facile: Number(sem.facile) || 3,
    longue: Number(sem.longue) || 6,
    renfo: (sem.renfo || [3, 7]).map(Number),
  }

  const nbTaper = n >= 4 ? 2 : Math.min(1, n - 1)
  const nbBuild = n - nbTaper
  const factsTaper = trouverRegle('affutage').params
  const facteurTaper = (i) => {
    if (i < nbBuild) return 1
    const rang = i - nbBuild // 0 = première semaine d'affûtage
    return rang === 0 ? factsTaper.facteurSemaine1 : factsTaper.facteurSemaine2
  }

  // Sorties longues semaine par semaine (spike ≤ 10 % + plateau toutes les 4 semaines)
  const choix = { toutesLesSemaines: 4 }
  const longues = []
  let prev = base
  let pic = base
  for (let i = 0; i < nbBuild; i++) {
    let L
    if (i % choix.toutesLesSemaines === choix.toutesLesSemaines - 1) L = prev
    else L = Math.min(cap, Math.max(prev, arrondiMoins(prev * 1.1, 0.5)))
    longues.push(L)
    prev = L
    pic = Math.max(pic, L)
  }
  for (let i = nbBuild; i < n; i++) longues.push(arrondi(pic * facteurTaper(i), 0.5))

  const sessions = []
  let compteQualite = 0
  const historique = [{ date: ajouterJours(debut, -1), distanceKm: base }]

  for (let i = 0; i < n; i++) {
    const lundi = ajouterJours(debut, i * 7)
    const dateDe = (jour) => ajouterJours(lundi, jour - 1)
    const taper = i >= nbBuild
    const f = facteurTaper(i)
    const estSemaineCourse = i === n - 1
    const p = nbBuild > 1 ? Math.min(1, compteQualite / (Math.max(1, nbBuild - 1))) : 1

    const semaineSessions = []
    // Qualité
    const typeQ = CYCLE_QUALITE[compteQualite % CYCLE_QUALITE.length]
    semaineSessions.push(
      estSemaineCourse
        ? seanceQualite({ date: dateDe(jours.qualite), typeQ: 'T_fractionne', p: 0, al, allureCourse, reduit: 0.45, taper: true })
        : seanceQualite({ date: dateDe(jours.qualite), typeQ, p, al, allureCourse, reduit: taper ? 0.6 : 1, taper })
    )
    if (!taper) compteQualite++
    // Facile
    const kmFacile = Math.max(4, arrondi(Math.min(10, Math.max(5, longues[i] * 0.5)) * f, 0.5))
    semaineSessions.push(seanceFacile({ date: dateDe(jours.facile), km: kmFacile, al, optionCadence: !!profil.optionCadence, taper }))
    // Longue (pas en semaine de course : la course la remplace)
    if (!estSemaineCourse) semaineSessions.push(seanceLongue({ date: dateDe(jours.longue), km: longues[i], al, taper }))

    // Garde-fou spike : chaque sortie ≤ +10 % de la plus longue des 30 derniers jours
    for (const s of semaineSessions.sort((a, b) => (a.date < b.date ? -1 : 1))) {
      if (s.type === 'facile' || s.type === 'qualite' || s.type === 'longue') {
        const ev = evaluerSpike({ distanceKm: s.distanceKm, date: s.date, historique })
        if ((ev.niveau === 'orange' || ev.niveau === 'rouge') && ev.maxKm) {
          const avant = s.distanceKm
          s.distanceKm = Math.max(1, arrondiMoins(ev.maxKm, 0.5))
          avertissements.push({ niveau: 'info', texte: `Sortie du ${s.date} raccourcie de ${km1(avant)} à ${km1(s.distanceKm)} km pour respecter la limite de +10 %.`, regles: ['spike-seance-10pct'] })
        }
      }
      historique.push({ date: s.date, distanceKm: s.distanceKm || 0 })
      sessions.push(s)
    }
  }

  // Course
  const course = seanceCourse({ date: obj.date, distanceKm: distance, vdot, al, tempsCible: obj.tempsCible })
  const evCourse = evaluerSpike({ distanceKm: distance, date: obj.date, historique })
  if (evCourse.niveau === 'orange' || evCourse.niveau === 'rouge') {
    avertissements.push({
      niveau: 'orange',
      texte: `Le jour de la course (${km1(distance)} km) dépasse de ${evCourse.excesPct} % ta plus longue sortie des 30 derniers jours (${km1(evCourse.refKm)} km). C’est normal pour un marathon ou si le délai est court, mais c’est un risque connu : pars prudemment.`,
      regles: ['spike-seance-10pct'],
    })
  }
  historique.push({ date: obj.date, distanceKm: distance })

  // Pas de séance le jour de la course (après), ni la veille ; pas de séance qui suit la course
  let sessionsFinales = sessions.filter((s) => s.date < ajouterJours(obj.date, -1))
  sessionsFinales.push(course)

  // Renfo
  const renfoDates = []
  for (let i = 0; i < n; i++) {
    const lundi = ajouterJours(debut, i * 7)
    for (const jr of jours.renfo || []) renfoDates.push(ajouterJours(lundi, jr - 1))
  }
  renfoDates.sort()
  let alt = 0
  for (const d of renfoDates) {
    if (d >= ajouterJours(obj.date, -1)) continue
    const taper = d >= ajouterJours(lundiCourse, -7)
    sessionsFinales.push(seanceRenfo({ date: d, modele: alt % 2 === 0 ? 'A' : 'B', indice: alt, antecedents: profil.antecedents || [], allege: taper }))
    alt++
  }

  // Sports fixes
  const fixes = seancesFixes(profil, debut, obj.date)
  sessionsFinales.push(...fixes)

  // Contrôle : pas de séance intense la veille d'un sport intense déclaré
  const conflits = conflitsIntensite(sessionsFinales)
  for (const c of conflits) avertissements.push({ niveau: 'orange', texte: c, regles: ['distribution-intensite'] })

  // Sport fixe intense peu avant la course
  const avantCourse = fixes.filter((x) => x.intense && diffJours(x.date, obj.date) <= 4 && diffJours(x.date, obj.date) > 0)
  for (const f of avantCourse) {
    avertissements.push({ niveau: 'info', texte: `${f.titre} (sport intense) le ${f.date}, ${diffJours(f.date, obj.date)} jours avant la course : à toi de décider si tu le gardes.`, regles: ['affutage'] })
  }

  sessionsFinales.sort((a, b) => (a.date === b.date ? (a.type < b.type ? -1 : 1) : a.date < b.date ? -1 : 1))

  return {
    sessions: sessionsFinales,
    avertissements,
    resume: {
      semaines: n,
      debut,
      fin: obj.date,
      vdot: Math.round(vdot * 10) / 10,
      picSortieLongueKm: pic,
      prediction: formatTemps(tempsPourVdot(vdot, distance * 1000)),
      allures: al,
    },
  }
}

// Intense la veille d'un autre sport intense : liste de messages
export function conflitsIntensite(sessions) {
  const parDate = {}
  for (const s of sessions) (parDate[s.date] ||= []).push(s)
  const messages = []
  for (const [date, liste] of Object.entries(parDate)) {
    const veille = ajouterJours(date, -1)
    const intensesAujourdhui = liste.filter((s) => s.intense)
    const intensesVeille = (parDate[veille] || []).filter((s) => s.intense)
    if (intensesAujourdhui.length && intensesVeille.length) {
      messages.push(`Deux jours intenses de suite : ${intensesVeille[0].titre} le ${veille} puis ${intensesAujourdhui[0].titre} le ${date}.`)
    }
  }
  return messages
}

// ---------- Plan Débutant 5K ----------
export function planC25k(profil, aujourdhuiIso, jours = [1, 3, 5]) {
  const debut = prochainLundi(aujourdhuiIso)
  const sessions = []
  for (const sem of C25K_SEMAINES) {
    const lundi = ajouterJours(debut, (sem.semaine - 1) * 7)
    sem.sorties.forEach((blocs, i) => {
      const date = ajouterJours(lundi, (jours[i] || [1, 3, 5][i]) - 1)
      const total = dureeBlocs(blocs) + C25K_ECHAUFFEMENT_MIN + C25K_RETOUR_CALME_MIN
      const lignes = blocs.map((b) => `${b.t === 'course' ? 'Course' : 'Marche'} ${formatMinutes(b.min)}`)
      sessions.push({
        date,
        type: 'c25k',
        module: 'course',
        intense: false,
        titre: `Semaine ${sem.semaine} · sortie ${i + 1}`,
        resume: resumeBlocs(blocs),
        distanceKm: null,
        dureeMin: Math.round(total),
        blocs: [
          { titre: 'Échauffement', detail: `${C25K_ECHAUFFEMENT_MIN} minutes de marche rapide.` },
          { titre: 'Corps de séance', detail: lignes.join(' · ') },
          { titre: 'Retour au calme', detail: `${C25K_RETOUR_CALME_MIN} minutes de marche calme, puis étirements doux.` },
        ],
        versionCourte: { titre: 'Version courte', detail: 'Fais seulement la première moitié des blocs, puis marche tranquillement. Mieux vaut un peu que rien.' },
        criteres: ['Tu peux encore parler en courant', 'Aucune douleur aiguë ; si c’est trop dur, répète la semaine précédente', `${minutesCourse(blocs)} min de course au total`],
        regles: ['debutant-c25k'],
      })
    })
  }
  return {
    sessions: sessions.concat(seancesFixes(profil, debut, ajouterJours(debut, 9 * 7 - 1))),
    avertissements: [{ niveau: 'info', texte: 'Plan d’après le programme officiel NHS Couch to 5K : 3 sorties par semaine, un jour de repos entre chaque. Ralentis si besoin.', regles: ['debutant-c25k'] }],
    resume: { semaines: 9, debut, fin: ajouterJours(debut, 9 * 7 - 1) },
  }
}

// ---------- Plan renforcement général ----------
export function planRenfo(profil, aujourdhuiIso, { semaines = 8, jours = [3, 7] } = {}) {
  const debut = prochainLundi(aujourdhuiIso)
  const sessions = []
  let alt = 0
  for (let i = 0; i < semaines; i++) {
    const lundi = ajouterJours(debut, i * 7)
    for (const jr of jours) {
      sessions.push(seanceRenfo({ date: ajouterJours(lundi, jr - 1), modele: alt % 2 === 0 ? 'A' : 'B', indice: alt, antecedents: profil.antecedents || [] }))
      alt++
    }
  }
  return {
    sessions: sessions.concat(seancesFixes(profil, debut, ajouterJours(debut, semaines * 7 - 1))),
    avertissements: [{ niveau: 'info', texte: 'Deux séances corps entier par semaine : chaque grand groupe est travaillé au moins deux fois, comme le recommande l’ACSM.', regles: ['renfo-acsm2026'] }],
    resume: { semaines, debut, fin: ajouterJours(debut, semaines * 7 - 1) },
  }
}

// ---------- Utilitaires ----------
export function identifiantSeance(planId, seance, rang = 0) {
  return `${planId}__${seance.date}__${seance.type}${rang ? '_' + rang : ''}`
}

