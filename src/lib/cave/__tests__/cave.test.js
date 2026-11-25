import { describe, it, expect } from 'vitest'
import { APPELLATIONS, ENTREES, lireAppellations, chercherAppellations, SOURCES, CELEBRES } from '../appellations.js'
import { LEXIQUE, lireLexique, analyserPlat } from '../plat.js'
import { noterAccord, suggererHorsCave, BUDGETS, statutGarde } from '../accord.js'
import { CEPAGES } from '../../../data/cave/cepages.js'
import { STYLES } from '../../../data/cave/styles.js'
import nommes from '../../../data/cave/plats-nommes.js'
import ingredients from '../../../data/cave/plats-ingredients.js'
import modifs from '../../../data/cave/plats-modifs.js'

describe('base des appellations', () => {
  it('toutes les lignes sont valides (styles connus, couleurs connues)', () => {
    for (const [texte, pays] of SOURCES) {
      const erreurs = []
      lireAppellations(texte, pays, erreurs)
      expect(erreurs).toEqual([])
    }
  })
  it('ids uniques et base conséquente', () => {
    const ids = APPELLATIONS.map((a) => a.id)
    const doublons = ids.filter((id, i) => ids.indexOf(id) !== i)
    expect(doublons).toEqual([])
    expect(APPELLATIONS.filter((a) => a.pays === 'FR').length).toBeGreaterThan(300)
    expect(APPELLATIONS.filter((a) => a.pays === 'IT').length).toBeGreaterThan(300)
  })
  it('recherche sans accents', () => {
    expect(chercherAppellations('cotes du rhone')[0].nom).toContain('Côtes du Rhône')
    expect(chercherAppellations('chateauneuf')[0].nom).toBe('Châteauneuf-du-Pape')
    expect(chercherAppellations('brunello')[0].nom).toBe('Brunello di Montalcino')
  })
  it('toutes les appellations « célèbres » existent', () => {
    const cles = new Set(APPELLATIONS.map((a) => a.cle))
    expect([...CELEBRES].filter((c) => !cles.has(c))).toEqual([])
  })
  it('cépages et styles', () => {
    expect(CEPAGES.length).toBeGreaterThan(150)
    expect(new Set(STYLES.map((s) => s.id)).size).toBe(STYLES.length)
  })
})

describe('base des plats', () => {
  it('toutes les lignes sont lisibles', () => {
    for (const t of [nommes, ingredients, modifs]) {
      const erreurs = []
      lireLexique(t, erreurs)
      expect(erreurs).toEqual([])
    }
    expect(LEXIQUE.reduce((n, e) => n + e.cles.length, 0)).toBeGreaterThan(1500)
  })
  it('reconnaît des plats courants', () => {
    for (const plat of ['risotto aux champignons', 'filet de bar grillé au beurre blanc', 'côte de boeuf', 'sushis', 'tarte tatin', 'salade de chèvre chaud', 'curry de poulet', 'pizza', 'pâtes à la carbonara']) {
      expect(analyserPlat(plat).reconnu, plat).toBe(true)
    }
    expect(analyserPlat('xyzzy').reconnu).toBe(false)
  })
  it('« pâtes » et « pâté » ne se confondent pas', () => {
    expect(analyserPlat('pâtes').cats).toContain('feculent')
    expect(analyserPlat('pâté de campagne').cats).toContain('charcut')
  })
})

const top = (texte, options = {}) => suggererHorsCave(analyserPlat(texte), { n: 8, ...options }).map((c) => `${c.entree.nom} ${c.entree.code}`)

describe('accords', () => {
  it('huîtres : du blanc vif ou des bulles, pas du rouge tannique', () => {
    const t = top('huîtres')
    expect(t.slice(0, 5).join()).toMatch(/Muscadet|Chablis|Champagne/)
    expect(t.slice(0, 5).some((x) => x.endsWith(' R'))).toBe(false)
  })
  it('côte de boeuf : un rouge charpenté', () => {
    const t = top('côte de boeuf grillée')
    expect(t.slice(0, 3).every((x) => x.endsWith(' R'))).toBe(true)
  })
  it('dessert : un vin doux ou liquoreux', () => {
    const t = top('tarte aux pommes')
    expect(t.slice(0, 3).every((x) => /( D| E| F)$/.test(x))).toBe(true)
  })
  it('foie gras : un liquoreux', () => {
    expect(top('foie gras').slice(0, 4).join()).toMatch(/Sauternes|Jurançon|Monbazillac|Barsac|Loupiac|Coteaux|Vouvray|Alsace/)
  })
  it('poisson : jamais de rouge tannique', () => {
    expect(top('dorade grillée').slice(0, 4).some((x) => x.endsWith(' R'))).toBe(false)
  })
  it('risotto aux champignons : un rouge élégant ou un blanc rond', () => {
    expect(top('risotto aux champignons').slice(0, 3).join()).toMatch(/Barolo|Barbaresco|Bourgogne|Gevrey|Chambolle|Nuits|Volnay|Pommard|Beaune|Meursault|Pessac|Roero|Langhe|Nebbiolo|Gattinara|Ghemme/)
  })
  it('budget : les paliers se chevauchent et filtrent', () => {
    const budget = BUDGETS.find((b) => b.id === '10-20')
    const c = suggererHorsCave(analyserPlat('poulet rôti'), { budget, n: 12 })
    expect(c.length).toBeGreaterThan(0)
    expect(c.every((x) => x.entree.prix >= 10 && x.entree.prix <= 20)).toBe(true)
    expect(BUDGETS.map((b) => b.id)).toEqual(['tous', '0-10', '5-15', '10-20', '15-25', '20-30', '25-35', '30-40', '40+'])
  })
  it('scores bornés', () => {
    const p = analyserPlat('curry épicé')
    for (const e of ENTREES.slice(0, 200)) {
      const s = noterAccord(p, { style: e.style, code: e.code, cleRegion: e.cleRegion, pays: e.pays, cle: '', cepages: e.cepages }).score
      expect(s).toBeGreaterThanOrEqual(0)
      expect(s).toBeLessThanOrEqual(100)
    }
  })
})

describe('garde', () => {
  it('statuts', () => {
    const garde = [3, 10]
    expect(statutGarde({ millesime: 2025, garde }, 2026).statut).toBe('jeune')
    expect(statutGarde({ millesime: 2018, garde }, 2026).statut).toBe('boire')
    expect(statutGarde({ millesime: 2016, garde }, 2026).statut).toBe('vite')
    expect(statutGarde({ millesime: 2010, garde }, 2026).statut).toBe('passe')
    expect(statutGarde({ millesime: null, garde }, 2026).statut).toBe('nv')
    expect(statutGarde({ millesime: 2020, garde, apogeeDe: 2030, apogeeA: 2040 }, 2026).statut).toBe('jeune')
  })
})
