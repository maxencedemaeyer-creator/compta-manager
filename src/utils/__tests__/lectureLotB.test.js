// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { ESPACEMENTS, INTERLIGNES, POLICES, useReglages } from '../../components/lecture/reglages.js'

// ---------- Lis-moi, lot B : polices et espacements (recommandations des logopèdes, 22/11/2026) ----------

function lire() {
  let r
  function Test() {
    r = useReglages()
    return null
  }
  renderToString(createElement(Test))
  return r
}

describe('espacements et polices', () => {
  beforeEach(() => {
    const memoire = {}
    globalThis.localStorage = { getItem: (k) => memoire[k] ?? null, setItem: (k, v) => (memoire[k] = v) }
  })

  it('défaut : Lexend, interligne 1,8, espacement « Confort » (lettres +0,05 em, mots +0,15 em)', () => {
    const { reglages, police, interligne, espacement } = lire()
    expect(reglages.police).toBe('lexend')
    expect(police.nom).toBe('Lexend')
    expect(interligne).toBe(1.8)
    expect(espacement).toEqual({ nom: 'Confort', lettres: '0.05em', mots: '0.15em' })
  })

  it('les espacements restent dans les fourchettes recommandées', () => {
    // lettres +0,05 à +0,08 em ; mots +0,15 à +0,25 em (hors « Serré », gardé pour ceux qui le préfèrent)
    for (const id of ['confort', 'large']) {
      const lettres = parseFloat(ESPACEMENTS[id].lettres)
      const mots = parseFloat(ESPACEMENTS[id].mots)
      expect(lettres).toBeGreaterThanOrEqual(0.05)
      expect(lettres).toBeLessThanOrEqual(0.08)
      expect(mots).toBeGreaterThanOrEqual(0.15)
      expect(mots).toBeLessThanOrEqual(0.25)
    }
    expect(INTERLIGNES.normal.valeur).toBeGreaterThanOrEqual(1.5)
    expect(INTERLIGNES.large.valeur).toBeLessThanOrEqual(1.8)
  })

  it('trois polices : Lexend, Andika, Verdana (plus d\'Atkinson)', () => {
    expect(Object.keys(POLICES)).toEqual(['lexend', 'andika', 'verdana'])
    expect(POLICES.verdana.famille).toMatch(/^Verdana/)
  })

  it('1re ouverture après la mise à jour : les anciens réglages sont repris, sauf l\'espacement', () => {
    localStorage.setItem('lisMoi_reglages', JSON.stringify({ taille: 3, fond: 'sepia', vitesse: 'lent', espacement: 'large', couleursSons: true }))
    const { reglages } = lire()
    expect(reglages.taille).toBe(3)
    expect(reglages.fond).toBe('sepia')
    expect(reglages.vitesse).toBe('lent')
    expect(reglages.espacement).toBe('confort') // nouveau défaut
    expect(reglages.couleursSons).toBe(false)
  })

  it('une police retirée (Atkinson) revient à Lexend', () => {
    localStorage.setItem('lisMoi_reglages', JSON.stringify({ police: 'atkinson' }))
    expect(lire().reglages.police).toBe('lexend')
  })

  it('après la mise à jour, les réglages choisis (clé v2) sont respectés', () => {
    localStorage.setItem('lisMoi_reglages_v2', JSON.stringify({ espacement: 'large', police: 'verdana' }))
    const { reglages, espacement } = lire()
    expect(reglages.police).toBe('verdana')
    expect(espacement.nom).toBe('Large')
  })
})
