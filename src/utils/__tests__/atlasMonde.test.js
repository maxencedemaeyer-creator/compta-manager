import { describe, it, expect } from 'vitest'
import { geoArea } from 'd3-geo'
import donnees from '../../data/atlas-monde.json'
import {
  CERCLE_POLAIRE,
  CONTINENTS,
  FUSEAUX,
  INCLINAISON,
  OCEANS,
  PLANISPHERES,
  PROJECTION_BASE,
  PROJECTIONS,
  ZONES_CLIMAT,
  construireVue,
  continentsGeo,
  heureDuFuseau,
  signe,
} from '../atlasMonde.js'

const RAYON_TERRE_KM = 6371
const continents = continentsGeo(donnees)
const surface = (id) => (geoArea(continents.find((c) => c.id === id).geo) * RAYON_TERRE_KM ** 2) / 1e6 // millions de km²

describe('ATLAS · Monde · continents', () => {
  it('contient les 7 continents, chacun avec un nom et une couleur', () => {
    expect(continents.map((c) => c.id).sort()).toEqual(CONTINENTS.map((c) => c.id).sort())
    expect(CONTINENTS).toHaveLength(7)
  })

  it('les surfaces sont proches de la réalité (millions de km²)', () => {
    // valeurs de référence, à ±10 % (contours simplifiés, quelques territoires classés autrement)
    const attendu = { 'amerique-nord': 24.7, 'amerique-sud': 17.8, europe: 10.2, afrique: 30.4, asie: 44.6, oceanie: 8.5, antarctique: 14.2 }
    for (const [id, ref] of Object.entries(attendu)) {
      expect(surface(id), id).toBeGreaterThan(ref * 0.85)
      expect(surface(id), id).toBeLessThan(ref * 1.1)
    }
  })

  it('aucun continent ne « remplit » la sphère (mauvais sens de rotation des anneaux)', () => {
    for (const c of continents) expect(geoArea(c.geo), c.id).toBeLessThan(Math.PI)
  })

  it('les noms de continents et d’océans sont placés sur la carte', () => {
    for (const c of CONTINENTS) expect(c.label).toHaveLength(2)
    expect(OCEANS.map((o) => o.id).sort()).toEqual(['arctique', 'atlantique', 'austral', 'indien', 'pacifique'])
  })
})

describe('ATLAS · Monde · lignes et zones', () => {
  it('tropiques et cercles polaires', () => {
    expect(INCLINAISON).toBeCloseTo(23.44, 1)
    expect(CERCLE_POLAIRE).toBeCloseTo(66.56, 1)
  })

  it('les zones climatiques couvrent toutes les latitudes, sans trou ni recouvrement', () => {
    const bandes = [...ZONES_CLIMAT].sort((a, b) => a.lat[0] - b.lat[0])
    expect(bandes[0].lat[0]).toBe(-90)
    expect(bandes.at(-1).lat[1]).toBe(90)
    for (let i = 1; i < bandes.length; i++) expect(bandes[i].lat[0]).toBeCloseTo(bandes[i - 1].lat[1], 6)
  })
})

describe('ATLAS · Monde · fuseaux horaires', () => {
  it('25 tranches de −12 à +12 ; les deux extrêmes sont des demi-tranches', () => {
    expect(FUSEAUX).toHaveLength(25)
    expect(FUSEAUX[0]).toMatchObject({ n: -12, de: -180, a: -172.5 })
    expect(FUSEAUX[12]).toMatchObject({ n: 0, de: -7.5, a: 7.5 })
    expect(FUSEAUX[24]).toMatchObject({ n: 12, de: 172.5, a: 180 })
    for (let i = 1; i < FUSEAUX.length; i++) expect(FUSEAUX[i].de).toBe(FUSEAUX[i - 1].a)
  })

  it('heure locale : décalage avec Greenwich, passage à la veille ou au lendemain', () => {
    expect(heureDuFuseau(12, 1)).toEqual({ h: 13, jour: 0 })
    expect(heureDuFuseau(23, 2)).toEqual({ h: 1, jour: 1 })
    expect(heureDuFuseau(1, -3)).toEqual({ h: 22, jour: -1 })
    expect(heureDuFuseau(0, 0)).toEqual({ h: 0, jour: 0 })
  })

  it('affiche le signe des décalages', () => {
    expect([signe(3), signe(0), signe(-5)]).toEqual(['+3', '0', '−5'])
  })
})

describe('ATLAS · Monde · projections', () => {
  it('chaque projection se construit et dessine tous les continents', () => {
    for (const p of PROJECTIONS) {
      const vue = construireVue({ projectionId: p.id })
      expect(vue.hauteur, p.id).toBeGreaterThan(300)
      // un globe ou une vue polaire ne montre qu'une partie du monde : on vérifie seulement l'Europe et l'Afrique
      const vus = p.type ? ['europe', 'afrique'] : continents.filter((x) => x.id !== 'antarctique').map((x) => x.id)
      for (const id of vus) expect(vue.path(continents.find((c) => c.id === id).geo), `${p.id} ${id}`).toBeTruthy()
    }
  })

  it('Mercator est plus haute que l’équirectangulaire ; Mollweide fait 2 fois sa hauteur en largeur', () => {
    expect(construireVue({ projectionId: 'mercator' }).hauteur).toBeGreaterThan(construireVue({ projectionId: 'equirectangulaire' }).hauteur)
    expect(construireVue({ projectionId: 'mollweide' }).hauteur).toBe(500)
  })

  it('Greenwich est au milieu d’une carte centrée sur 0°, et la longitude choisie quand on recentre', () => {
    expect(construireVue({ projectionId: 'robinson' }).place(0, 0)[0]).toBeCloseTo(500, 0)
    expect(construireVue({ projectionId: 'robinson', centre: 160 }).place(160, 0)[0]).toBeCloseTo(500, 0)
  })

  it('carte retournée : le sud est en haut', () => {
    const normale = construireVue({ projectionId: 'robinson' })
    const inversee = construireVue({ projectionId: 'robinson', inverse: true })
    expect(normale.place(0, 60)[1]).toBeLessThan(normale.place(0, -60)[1])
    expect(inversee.place(0, 60)[1]).toBeGreaterThan(inversee.place(0, -60)[1])
  })

  it('globe : la face cachée n’est pas placée', () => {
    const globe = construireVue({ projectionId: 'globe' })
    expect(globe.place(0, 20)).not.toBeNull()
    expect(globe.place(180, -20)).toBeNull()
  })

  it('la projection de base est Robinson : parallèles droits, méridiens courbes', () => {
    expect(PROJECTION_BASE).toBe('robinson')
    const vue = construireVue({ projectionId: PROJECTION_BASE })
    expect(vue.place(-150, 40)[1]).toBeCloseTo(vue.place(150, 40)[1], 3) // un parallèle est horizontal
    expect(vue.place(90, 0)[0]).not.toBeCloseTo(vue.place(90, 60)[0], 0) // un méridien se rapproche du centre vers les pôles
  })

  it('planisphères : tous se construisent', () => {
    expect(PLANISPHERES.length).toBeGreaterThanOrEqual(6)
    for (const p of PLANISPHERES) {
      const vue = construireVue({ projectionId: p.projection, centre: p.centre, inverse: !!p.inverse, pole: p.pole })
      expect(vue.contourD, p.id).toBeTruthy()
    }
  })
})
