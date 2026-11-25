import { describe, expect, it } from 'vitest'
import { CYCLES, DUREE_REGLES, epaisseurEndometre, etapes, etatOvaire, jourOvulation, joursAvantReglesSuivantes, ovuleDuJour, phaseDuJour } from '../cycle.js'
import { estVisible } from '../../../../config/laboVisibilite.js'

describe('cycle menstruel', () => {
  it("l'ovulation a lieu 14 jours avant les règles suivantes", () => {
    expect(jourOvulation(28)).toBe(14)
    expect(jourOvulation(21)).toBe(7)
    expect(jourOvulation(35)).toBe(21)
  })

  it('les 4 étapes couvrent tous les jours sans trou ni chevauchement', () => {
    for (const longueur of CYCLES) {
      const liste = etapes(longueur)
      expect(liste[0].debut).toBe(1)
      expect(liste.at(-1).fin).toBe(longueur)
      for (let i = 1; i < liste.length; i++) expect(liste[i].debut).toBe(liste[i - 1].fin + 1)
      for (let jour = 1; jour <= longueur; jour++) {
        const attendue = liste.find((e) => jour >= e.debut && jour <= e.fin).id
        expect(phaseDuJour(jour, longueur)).toBe(attendue)
      }
    }
  })

  it('un seul jour d’ovulation, et les règles durent DUREE_REGLES jours', () => {
    for (const longueur of CYCLES) {
      const jours = Array.from({ length: longueur }, (_, i) => i + 1)
      expect(jours.filter((j) => phaseDuJour(j, longueur) === 'ovulation')).toHaveLength(1)
      expect(jours.filter((j) => phaseDuJour(j, longueur) === 'regles')).toHaveLength(DUREE_REGLES)
    }
  })

  it("l'endomètre reste entre 0 et 1, s'épaissit puis est au plus épais avant les règles", () => {
    for (const longueur of CYCLES) {
      for (let jour = 1; jour <= longueur; jour++) {
        const e = epaisseurEndometre(jour, longueur)
        expect(e).toBeGreaterThanOrEqual(0)
        expect(e).toBeLessThanOrEqual(1)
      }
      expect(epaisseurEndometre(longueur, longueur)).toBeGreaterThan(epaisseurEndometre(jourOvulation(longueur), longueur))
      expect(epaisseurEndometre(DUREE_REGLES, longueur)).toBeLessThan(epaisseurEndometre(jourOvulation(longueur), longueur))
    }
  })

  it("l'ovaire et l'ovule suivent l'ovulation", () => {
    const o = jourOvulation(28)
    expect(etatOvaire(o - 3, 28).etat).toBe('follicule')
    expect(etatOvaire(o, 28).etat).toBe('ovulation')
    expect(etatOvaire(o + 3, 28).etat).toBe('corps')
    expect(ovuleDuJour(o, 28)).toBe('ovaire')
    expect(ovuleDuJour(o + 1, 28)).toBe('trompe')
    expect(ovuleDuJour(o + 2, 28)).toBeNull()
    expect(ovuleDuJour(1, 28)).toBeNull()
  })

  it('compte les jours avant les prochaines règles', () => {
    expect(joursAvantReglesSuivantes(28, 28)).toBe(1)
    expect(joursAvantReglesSuivantes(1, 28)).toBe(28)
  })
})

describe('visibilité des expériences du labo', () => {
  const normale = { id: 'espace' }
  const cachee = { id: 'regles', masqueeParDefaut: true }

  it('une expérience normale est visible tant qu’on ne la masque pas', () => {
    expect(estVisible({ masquees: [], visibles: [] }, normale)).toBe(true)
    expect(estVisible({ masquees: ['espace'], visibles: [] }, normale)).toBe(false)
  })

  it('une expérience masquée par défaut n’apparaît que si le prof l’active', () => {
    expect(estVisible({ masquees: [], visibles: [] }, cachee)).toBe(false)
    expect(estVisible({ masquees: [], visibles: ['regles'] }, cachee)).toBe(true)
  })
})
