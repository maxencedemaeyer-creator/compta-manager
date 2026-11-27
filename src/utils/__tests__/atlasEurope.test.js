import { describe, it, expect } from 'vitest'
import { geoArea, geoPath } from 'd3-geo'
import donnees from '../../data/atlas-europe.json'
import {
  ADHESION,
  ADHESION_EURO,
  ADHESION_SCHENGEN,
  CANDIDATS_UE,
  ESPACE_SCHENGEN,
  MEMBRES_UE,
  MONTAGNES,
  PAYS,
  SOMMETS,
  VOISINS,
  ZONE_EURO,
  construireVueEurope,
  couleurDuPays,
  etatEuro,
  etatSchengen,
  fichePays,
  paysDe,
  paysGeo,
  placerEtiquettes,
  remplissage,
} from '../atlasEurope.js'

const RAYON_TERRE_KM = 6371
const pays = paysGeo(donnees)
const geo = (id) => pays.find((c) => c.id === id)
const km2 = (g) => geoArea(g) * RAYON_TERRE_KM ** 2
const ids = (liste) => liste.map((p) => p.id).sort()

describe('ATLAS · Europe · statuts (situation au 27 novembre 2026)', () => {
  it('l’UE compte 27 États membres, dont la Belgique, sans le Royaume-Uni', () => {
    expect(MEMBRES_UE).toHaveLength(27)
    expect(paysDe('be').ue).toBe('membre')
    expect(paysDe('gb').ue).toBe('non')
    expect(Object.keys(ADHESION).sort()).toEqual(ids(MEMBRES_UE))
  })

  it('10 pays en attente : 9 candidats et le Kosovo (demande déposée)', () => {
    expect(ids(CANDIDATS_UE)).toEqual(['al', 'ba', 'ge', 'md', 'me', 'mk', 'rs', 'tr', 'ua', 'xk'])
  })

  it('l’Islande, la Norvège, la Suisse et l’Arménie ne sont ni membres ni candidats', () => {
    for (const id of ['is', 'no', 'ch', 'am', 'by', 'ru']) expect(paysDe(id).ue, id).toBe('non')
  })

  it('la zone euro compte 21 pays, tous dans l’UE, Bulgarie comprise (depuis 2026)', () => {
    expect(ZONE_EURO).toHaveLength(21)
    expect(ZONE_EURO.every((p) => p.ue === 'membre')).toBe(true)
    expect(Object.keys(ADHESION_EURO).sort()).toEqual(ids(ZONE_EURO))
    expect(ADHESION_EURO.bg).toBe(2026)
    for (const id of ['dk', 'se', 'pl', 'cz', 'hu', 'ro']) expect(paysDe(id).euro, id).toBe(false)
  })

  it('l’euro hors zone euro : Andorre, Monaco, Saint-Marin, Vatican, Monténégro, Kosovo', () => {
    const usage = PAYS.filter((p) => etatEuro(p) === 'usage').map((p) => p.id).sort()
    expect(usage).toEqual(['ad', 'mc', 'me', 'sm', 'va', 'xk'])
  })

  it('Schengen compte 29 pays : 25 de l’UE et l’Islande, le Liechtenstein, la Norvège, la Suisse', () => {
    expect(ESPACE_SCHENGEN).toHaveLength(29)
    expect(ids(ESPACE_SCHENGEN.filter((p) => p.ue !== 'membre'))).toEqual(['ch', 'is', 'li', 'no'])
    expect(Object.keys(ADHESION_SCHENGEN).sort()).toEqual(ids(ESPACE_SCHENGEN))
    // Les deux membres de l’UE restés dehors : Irlande (choix) et Chypre (en attente)
    expect(etatSchengen(paysDe('ie'))).toBe('derogation')
    expect(etatSchengen(paysDe('cy'))).toBe('attente')
    expect(etatSchengen(paysDe('bg'))).toBe('schengen-ue')
    expect(etatSchengen(paysDe('ro'))).toBe('schengen-ue')
  })

  it('chaque capitale est dans le cadre de l’Europe (longitude et latitude plausibles)', () => {
    for (const p of PAYS.filter((x) => x.cap)) {
      expect(p.cap[1], p.id).toBeGreaterThan(-30)
      expect(p.cap[1], p.id).toBeLessThan(60)
      expect(p.cap[2], p.id).toBeGreaterThan(30)
      expect(p.cap[2], p.id).toBeLessThan(70)
    }
    expect(paysDe('be').cap[0]).toBe('Bruxelles')
  })
})

describe('ATLAS · Europe · fiches et couleurs', () => {
  it('la fiche UE d’un membre donne l’année d’adhésion', () => {
    const f = fichePays('ue', 'be')
    expect(f.badge.texte).toBe('Membre')
    expect(f.lignes.join(' ')).toContain('1957')
  })

  it('la fiche UE de l’Islande rappelle le référendum de 2026', () => {
    expect(fichePays('ue', 'is').lignes.join(' ')).toContain('2026')
  })

  it('la fiche des capitales ne donne que la capitale ; la carte vierge, que le nom', () => {
    expect(fichePays('capitales', 'fr').lignes).toEqual(['Capitale : Paris'])
    expect(fichePays('vierge', 'fr').lignes).toEqual([])
  })

  it('deux pays voisins n’ont jamais la même couleur sur la carte « Pays »', () => {
    for (const [a, voisins] of Object.entries(VOISINS)) {
      for (const b of voisins) expect(couleurDuPays(a), `${a}/${b}`).not.toBe(couleurDuPays(b))
    }
  })

  it('la carte vierge a une seule couleur ; la Belgique est bleue dans l’UE et dans l’euro', () => {
    expect(new Set(pays.map((c) => remplissage('vierge', c.id))).size).toBe(1)
    expect(remplissage('ue', 'be')).toBe(remplissage('ue', 'fr'))
    expect(remplissage('euro', 'be')).not.toBe(remplissage('euro', 'dk'))
  })

  it('vue géographique : seule la partie européenne de la Russie est en Europe', () => {
    const f = remplissage('limites', 'ru', { limites: 'geo' })
    expect(f.europe).not.toBe(f.asie)
    expect(remplissage('limites', 'cy', { limites: 'geo' })).toBe(remplissage('limites', 'ma', { limites: 'geo' }))
    expect(remplissage('limites', 'cy', { limites: 'pol' })).not.toBe(remplissage('limites', 'ma', { limites: 'pol' }))
  })
})

describe('ATLAS · Europe · contours', () => {
  it('chaque pays de la liste a un contour, sans doublon', () => {
    const presents = new Set(pays.map((c) => c.id))
    for (const p of PAYS) expect(presents.has(p.id), p.id).toBe(true)
    expect(new Set(PAYS.map((p) => p.id)).size).toBe(PAYS.length)
  })

  it('aucun contour ne « remplit » la sphère (mauvais sens de rotation des anneaux)', () => {
    for (const c of pays) expect(geoArea(c.geo), c.id).toBeLessThan(1)
  })

  it('les surfaces sont proches de la réalité (km²)', () => {
    const attendu = { be: 30689, is: 103000, cy: 9251, nl: 41500, ch: 41285, de: 357600, tr: 783562 }
    for (const [id, ref] of Object.entries(attendu)) {
      expect(km2(geo(id).geo), id).toBeGreaterThan(ref * 0.85)
      expect(km2(geo(id).geo), id).toBeLessThan(ref * 1.15)
    }
  })

  it('les pays à cheval sont coupés en deux parties qui se recollent', () => {
    for (const id of ['ru', 'kz', 'tr', 'az']) {
      const c = geo(id)
      expect(c.europe, id).toBeTruthy()
      expect(c.asie, id).toBeTruthy()
      expect(km2(c.europe) + km2(c.asie), id).toBeCloseTo(km2(c.geo), -2)
    }
    // Russie : environ 3,9 M km² en Europe (réalité : 3,95) ; Turquie : Thrace, ~24 000 km²
    expect(km2(geo('ru').europe)).toBeGreaterThan(3.6e6)
    expect(km2(geo('ru').europe)).toBeLessThan(4.3e6)
    expect(km2(geo('tr').europe)).toBeGreaterThan(18000)
    expect(km2(geo('tr').europe)).toBeLessThan(32000)
    expect(km2(geo('kz').europe)).toBeGreaterThan(0.1e6)
    expect(km2(geo('kz').europe)).toBeLessThan(0.3e6)
  })

  it('les micro-États ont un contour (Vatican, Monaco, Saint-Marin, Liechtenstein, Malte, Andorre)', () => {
    for (const id of ['va', 'mc', 'sm', 'li', 'mt', 'ad']) expect(geo(id), id).toBeTruthy()
  })
})

describe('ATLAS · Europe · projection', () => {
  const vue = construireVueEurope()

  it('toutes les zones demandées sont dans le cadre : Islande, Maghreb, Chypre, Turquie, Caucase, Oural', () => {
    const points = {
      islandeOuest: [-24.3, 65.5],
      reykjavik: [-21.9, 64.15],
      capNord: [25.8, 71.1],
      tunis: [10.18, 36.81],
      rabat: [-6.84, 34.02],
      alger: [3.06, 36.75],
      nicosie: [33.38, 35.17],
      ankara: [32.86, 39.93],
      bakou: [49.87, 40.41],
      elbrouz: [42.445, 43.35],
      oural: [59.3, 65.0],
    }
    for (const [nom, [lon, lat]] of Object.entries(points)) expect(vue.place(lon, lat), nom).not.toBeNull()
  })

  it('projection équivalente : l’Islande garde sa vraie taille par rapport à l’Allemagne', () => {
    const aire = (id) => geoPath(vue.proj).area(geo(id).geo)
    const reel = km2(geo('is').geo) / km2(geo('de').geo)
    expect(aire('is') / aire('de')).toBeCloseTo(reel, 1)
  })

  it('la carte a une hauteur raisonnable pour un écran', () => {
    expect(vue.largeur).toBe(1000)
    expect(vue.hauteur).toBeGreaterThan(700)
    expect(vue.hauteur).toBeLessThan(1000)
  })
})

describe('ATLAS · Europe · montagnes', () => {
  it('le Mont Blanc (4 807 m) et l’Elbrouz (5 642 m) ont leur altitude', () => {
    expect(SOMMETS.find((s) => s.id === 'mont-blanc').alt).toBe(4807)
    expect(SOMMETS.find((s) => s.id === 'elbrouz').alt).toBe(5642)
  })

  it('les 3 chaînes demandées et l’Oural sont tracés', () => {
    expect(MONTAGNES.map((m) => m.id)).toEqual(['pyrenees', 'alpes', 'caucase', 'oural'])
    expect(MONTAGNES.find((m) => m.id === 'oural').secondaire).toBe(true)
  })

  it('le Mont Blanc est sur la crête des Alpes, l’Elbrouz sur celle du Caucase', () => {
    const proche = (trace, [lon, lat]) => Math.min(...trace.map(([x, y]) => Math.hypot(x - lon, y - lat)))
    expect(proche(MONTAGNES.find((m) => m.id === 'alpes').trace, SOMMETS[0].lieu)).toBeLessThan(0.1)
    expect(proche(MONTAGNES.find((m) => m.id === 'caucase').trace, SOMMETS[1].lieu)).toBeLessThan(0.1)
  })
})

describe('ATLAS · Europe · placement des noms', () => {
  const case1 = (x, y, w = 10, h = 4) => [{ x, y, w, h }]
  const chevauche = (a, b) => Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2

  it('ne garde jamais deux noms qui se recouvrent, et le plus prioritaire passe d’abord', () => {
    const res = placerEtiquettes([
      { cle: 'b', ordre: 2, candidats: case1(5, 0) },
      { cle: 'a', ordre: 1, candidats: case1(0, 0) },
      { cle: 'c', ordre: 3, candidats: case1(40, 0) },
    ])
    expect(res.map((r) => r.cle).sort()).toEqual(['a', 'c'])
    for (const a of res) for (const b of res) if (a !== b) expect(chevauche(a, b)).toBe(false)
  })

  it('prend l’emplacement suivant quand le premier est occupé, et respecte les obstacles', () => {
    const res = placerEtiquettes(
      [{ cle: 'x', ordre: 0, candidats: [...case1(0, 0), ...case1(30, 0)] }],
      [{ x0: -3, y0: -3, x1: 3, y1: 3 }]
    )
    expect(res).toHaveLength(1)
    expect(res[0].x).toBe(30)
  })
})
