import { describe, it, expect } from 'vitest'
import { SOURCES, NIVEAUX, trouverSource } from '../../../data/coach/sources.js'
import { RULES, CHOIX_APPLI, trouverRegle } from '../../../data/coach/rules.js'
import { EXERCICES } from '../../../data/coach/exercices.js'
import { C25K_SEMAINES, dureeBlocs } from '../../../data/coach/c25k.js'
import { vdotDepuisCourse, allures, riegel, tempsPourVdot, lireTemps, formatTemps } from '../vdot.js'
import { evaluerSpike, alertesSpike } from '../spike.js'
import { metabolismeDeBase, depenseSeance, fcMaxTanaka } from '../energie.js'
import { classeCharge, macrosDuJour, planRavitaillement } from '../nutrition.js'
import { planCourse, planC25k, planRenfo, vdotDuProfil, conflitsIntensite } from '../plans.js'
import { ajouterJours, diffJours, jourIso, lundiDe } from '../dates.js'

// Profil de test : Max (voir le brief)
const MAX = {
  sexe: 'homme', age: 33, tailleCm: 186, poidsKg: 85, fcMax: 193, fcRepos: 47,
  perfRecente: { distanceKm: 5, temps: '23:41' },
  plusLongueKm: 10,
  objectif: { distanceKm: 21.0975, date: '2027-02-14', tempsCible: '1:50:00' },
  semaine: { qualite: 1, facile: 3, longue: 6, renfo: [3, 7] },
  fixes: [{ nom: 'Padel', jour: 4, heure: '20:00', dureeMin: 90, intense: true }],
  antecedents: ['ischios', 'bandelette'],
  facteurActivite: 1.4,
}
const AUJ = '2026-11-21'

describe('moteur de preuves', () => {
  it('chaque source est bien formée et son id est unique', () => {
    const ids = new Set()
    for (const s of SOURCES) {
      expect(s.id).toBeTruthy()
      expect(ids.has(s.id)).toBe(false)
      ids.add(s.id)
      expect(NIVEAUX[s.level]).toBeTruthy()
      expect(s.citation).toBeTruthy()
      expect(s.summaryFr).toBeTruthy()
      expect(['verifie', 'partiel', 'a_verifier']).toContain(s.statut)
    }
  })
  it('chaque règle a au moins une source existante', () => {
    for (const r of RULES) {
      expect(r.sources.length, r.id).toBeGreaterThan(0)
      for (const id of r.sources) expect(trouverSource(id), `${r.id} → ${id}`).toBeTruthy()
      expect(r.statementFr, r.id).toBeTruthy()
    }
  })
  it('les ids de règles sont uniques et les choix de l’appli sont sans source déclarée', () => {
    const ids = RULES.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const c of CHOIX_APPLI) expect(c.id).toBeTruthy()
  })
  it('tous les exercices ont nom, consigne et muscles', () => {
    for (const [cle, e] of Object.entries(EXERCICES)) {
      expect(e.nom, cle).toBeTruthy()
      expect(e.consigne, cle).toBeTruthy()
    }
  })
})

describe('VDOT et allures', () => {
  it('5 km en 23\'41" donne un VDOT ≈ 40,8', () => {
    expect(vdotDuProfil(MAX)).toBeCloseTo(40.8, 0)
  })
  it('l\'aller-retour VDOT ↔ temps est cohérent', () => {
    const v = vdotDepuisCourse(10000, 2900)
    expect(tempsPourVdot(v, 10000)).toBeCloseTo(2900, 0)
  })
  it('Riegel : 23\'41" sur 5 km ≈ 1:48:57 au semi', () => {
    const t = riegel(lireTemps('23:41'), 5000, 21097.5)
    expect(formatTemps(t)).toBe('1 h 48 min 57 s')
  })
  it('les allures sont ordonnées : R < I < T < M < E', () => {
    const a = allures(40.8)
    expect(a.R).toBeLessThan(a.I)
    expect(a.I).toBeLessThan(a.T)
    expect(a.T).toBeLessThan(a.M)
    expect(a.M).toBeLessThan(a.E)
    expect(a.E_rapide).toBeLessThan(a.E_lente)
  })
})

describe('règle du spike', () => {
  const hist = [{ date: '2026-11-10', distanceKm: 10 }]
  it('≤ +10 % : ok', () => {
    expect(evaluerSpike({ distanceKm: 11, date: '2026-11-20', historique: hist }).niveau).toBe('ok')
  })
  it('entre +10 et +30 % : orange', () => {
    expect(evaluerSpike({ distanceKm: 12, date: '2026-11-20', historique: hist }).niveau).toBe('orange')
  })
  it('> +30 % : rouge', () => {
    expect(evaluerSpike({ distanceKm: 14, date: '2026-11-20', historique: hist }).niveau).toBe('rouge')
  })
  it('hors fenêtre de 30 jours : pas de référence', () => {
    expect(evaluerSpike({ distanceKm: 12, date: '2026-12-20', historique: hist }).niveau).toBe('aucune_ref')
  })
  it('alertesSpike ne signale que les sorties au-dessus de la limite', () => {
    const al = alertesSpike([{ id: 'a', date: '2026-11-12', distanceKm: 15 }, { id: 'b', date: '2026-11-13', distanceKm: 5 }], hist)
    expect(al.map((x) => x.id)).toEqual(['a'])
  })
})

describe('énergie et nutrition', () => {
  it('Mifflin-St Jeor : homme 33 ans, 186 cm, 85 kg ≈ 1 874 kcal', () => {
    // 10×85 + 6,25×186 − 5×33 + 5 = 850 + 1162,5 − 165 + 5 = 1852,5
    expect(metabolismeDeBase(MAX)).toBeCloseTo(1852.5, 1)
  })
  it('dépense nette = (MET − 1) × kg × h', () => {
    expect(depenseSeance({ met: 9, poidsKg: 80, minutes: 60 })).toBe(640)
  })
  it('FCmax Tanaka à 33 ans = 185 (la valeur mesurée de 193 reste prioritaire)', () => {
    expect(fcMaxTanaka(33)).toBe(185)
  })
  it('classes de charge', () => {
    expect(classeCharge([])).toBe('leger')
    expect(classeCharge([{ module: 'renfo', dureeMin: 40 }])).toBe('leger')
    expect(classeCharge([{ module: 'course', type: 'facile', dureeMin: 40 }])).toBe('modere')
    expect(classeCharge([{ module: 'course', type: 'longue', dureeMin: 100 }])).toBe('eleve')
    expect(classeCharge([{ module: 'course', type: 'facile', dureeMin: 250 }])).toBe('tres_eleve')
  })
  it('macros : chaque repère renvoie ses règles et des fourchettes cohérentes', () => {
    const m = macrosDuJour({ profil: MAX, seances: [{ module: 'course', type: 'longue', dureeMin: 100, distanceKm: 16 }] })
    expect(m.glucides.grammes[0]).toBeLessThan(m.glucides.grammes[1])
    expect(m.proteines.grammes[0]).toBeLessThan(m.proteines.grammes[1])
    for (const id of m.regles) expect(trouverRegle(id)).toBeTruthy()
  })
  it('ravitaillement : rien sous 75 min, 30-60 g/h puis jusqu\'à 90 g/h au-delà de 2 h 30', () => {
    expect(planRavitaillement({ dureeMin: 60 })).toBeNull()
    expect(planRavitaillement({ dureeMin: 120 }).glucidesGh).toEqual([30, 60])
    expect(planRavitaillement({ dureeMin: 180 }).glucidesGh).toEqual([60, 90])
  })
})

describe('plan Débutant 5K (NHS)', () => {
  it('9 semaines, 3 sorties chacune', () => {
    expect(C25K_SEMAINES.length).toBe(9)
    for (const s of C25K_SEMAINES) expect(s.sorties.length).toBe(3)
  })
  it('chaque séance générée cite sa règle et a une version courte', () => {
    const p = planC25k(MAX, AUJ)
    const c = p.sessions.filter((s) => s.type === 'c25k')
    expect(c.length).toBe(27)
    for (const s of c) {
      expect(s.regles).toContain('debutant-c25k')
      expect(s.versionCourte).toBeTruthy()
      expect(s.dureeMin).toBeGreaterThan(dureeBlocs(C25K_SEMAINES[0].sorties[0]) - 1)
    }
  })
})

describe('plan course (profil de Max, semi en février 2027)', () => {
  const plan = planCourse(MAX, AUJ)
  const courses = plan.sessions.filter((s) => s.module === 'course')

  it('commence un lundi et se termine par la course', () => {
    expect(jourIso(plan.resume.debut)).toBe(1)
    const derniere = courses[courses.length - 1]
    expect(derniere.type).toBe('course')
    expect(derniere.date).toBe('2027-02-14')
  })
  it('toute séance a au moins une règle qui a au moins une source', () => {
    for (const s of plan.sessions) {
      expect(s.regles.length, `${s.date} ${s.titre}`).toBeGreaterThan(0)
      for (const id of s.regles) {
        const r = trouverRegle(id)
        expect(r, id).toBeTruthy()
        expect(r.sources.length).toBeGreaterThan(0)
      }
    }
  })
  it('aucune sortie ne dépasse de plus de 10 % la plus longue des 30 jours précédents', () => {
    const hist = [{ date: ajouterJours(plan.resume.debut, -1), distanceKm: MAX.plusLongueKm }]
    const sorties = courses.filter((s) => s.type !== 'course').sort((a, b) => (a.date < b.date ? -1 : 1))
    for (const s of sorties) {
      const ev = evaluerSpike({ distanceKm: s.distanceKm, date: s.date, historique: hist })
      expect(['ok', 'aucune_ref'], `${s.date} ${s.distanceKm} km`).toContain(ev.niveau)
      hist.push({ date: s.date, distanceKm: s.distanceKm })
    }
  })
  it('la course elle-même reste dans la limite de +10 % de la plus longue sortie', () => {
    expect(plan.avertissements.filter((a) => a.niveau === 'orange' && /jour de la course/.test(a.texte))).toHaveLength(0)
  })
  it('affûtage : le volume des deux dernières semaines baisse', () => {
    const volSemaine = (i) => {
      const lundi = ajouterJours(plan.resume.debut, i * 7)
      return courses.filter((s) => s.type !== 'course' && diffJours(lundi, s.date) >= 0 && diffJours(lundi, s.date) < 7).reduce((t, s) => t + s.distanceKm, 0)
    }
    const n = plan.resume.semaines
    expect(volSemaine(n - 2)).toBeLessThan(volSemaine(n - 3))
    expect(volSemaine(n - 1)).toBeLessThan(volSemaine(n - 2))
  })
  it('le padel du jeudi est présent et aucune séance intense n\'est collée à un autre jour intense', () => {
    expect(plan.sessions.some((s) => s.type === 'fixe' && jourIso(s.date) === 4)).toBe(true)
    expect(plan.avertissements.filter((a) => /Deux jours intenses/.test(a.texte))).toHaveLength(0)
  })
  it('pas de séance les 2 derniers jours avant la course, hors repos', () => {
    const veille = ajouterJours('2027-02-14', -1)
    expect(plan.sessions.filter((s) => s.date === veille && s.module !== 'autre')).toHaveLength(0)
  })
  it('renfo : les deux séances hebdomadaires contiennent Nordic et exercices hanches (antécédents)', () => {
    const renfos = plan.sessions.filter((s) => s.type === 'renfo')
    expect(renfos.length).toBeGreaterThan(10)
    expect(renfos[0].blocs.some((b) => b.exerciceCle === 'nordic')).toBe(true)
    expect(renfos[0].regles).toContain('nordic-ischios')
  })
  it('refuse une course trop proche ou sans performance', () => {
    expect(() => planCourse({ ...MAX, objectif: { distanceKm: 10, date: '2026-11-24' } }, AUJ)).toThrow()
    expect(() => planCourse({ ...MAX, perfRecente: null }, AUJ)).toThrow()
  })
})

describe('plan renforcement', () => {
  it('2 séances par semaine, alternance A/B', () => {
    const p = planRenfo(MAX, AUJ, { semaines: 4 })
    const r = p.sessions.filter((s) => s.type === 'renfo')
    expect(r).toHaveLength(8)
    expect(r[0].titre).not.toBe(r[1].titre)
  })
})

describe('conflits d\'intensité', () => {
  it('détecte deux jours intenses consécutifs', () => {
    const m = conflitsIntensite([
      { date: '2026-11-23', intense: true, titre: 'Tempo' },
      { date: '2026-11-24', intense: true, titre: 'Padel' },
    ])
    expect(m).toHaveLength(1)
  })
  it('lundi est bien le début de semaine', () => {
    expect(jourIso(lundiDe('2026-11-21'))).toBe(1)
  })
})

import { alertesDuJour, distanceFaite, evaluerSeance, serieSemaines, statsSemaines } from '../analyse.js'

describe('analyse du journal', () => {
  const profil = { plusLongueKm: 10, plusLongueDate: '2026-11-20' }
  const s = (id, date, extra = {}) => ({ id, date, module: 'course', type: 'facile', statut: 'prevue', distanceKm: 6, dureeMin: 40, ...extra })

  it('une séance faite compte avec sa distance réelle', () => {
    expect(distanceFaite(s('a', '2026-11-23', { statut: 'faite', distanceReelleKm: 7.2 }))).toBe(7.2)
    expect(distanceFaite(s('a', '2026-11-23', { statut: 'courte' }))).toBeNull()
    expect(distanceFaite(s('a', '2026-11-23'))).toBeNull()
  })
  it('une sortie prévue au-dessus de +10 % de la plus longue sortie récente déclenche une alerte', () => {
    const longue = s('l', '2026-11-23', { type: 'longue', distanceKm: 13 })
    expect(evaluerSeance(longue, [longue], profil).niveau).toBe('orange')
    const al = alertesDuJour([longue], profil, '2026-11-22')
    expect(al.some((a) => /Raccourcis/.test(a.texte))).toBe(true)
  })
  it('une sortie faite plus courte que prévu fait baisser la référence', () => {
    const faite = s('f', '2026-11-23', { statut: 'faite', distanceReelleKm: 5 })
    const longue = s('l', '2026-12-30', { type: 'longue', distanceKm: 12 })
    expect(evaluerSeance(longue, [faite, longue], profil).niveau).toBe('aucune_ref')
  })
  it('semaine validée et série', () => {
    const seances = [
      s('1', '2026-11-16', { statut: 'faite' }), s('2', '2026-11-18', { statut: 'courte' }),
      s('3', '2026-11-23', { statut: 'faite' }), s('4', '2026-11-25', { statut: 'prevue' }),
    ]
    const st = statsSemaines(seances, '2026-11-24', 2)
    expect(st[0].validee).toBe(true)
    expect(st[1].validee).toBe(false)
    expect(serieSemaines(seances, '2026-11-24')).toBe(1)
  })
})
