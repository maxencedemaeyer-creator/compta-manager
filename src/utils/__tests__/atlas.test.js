import { describe, it, expect } from 'vitest'
import communesBrutes from '../../data/communos-communes.json'
import atlas from '../../data/atlas-belgique.json'
import { preparerCarte } from '../communos.js'
import { COUCHES, FLEUVES, construireZones, placerEtiquettes, rivieresVisibles, villesVisibles, voiesNavigables } from '../atlas.js'

const carte = preparerCarte(communesBrutes)
const dg = new Set(atlas.communesDG)
const nombre = (couche) => construireZones(carte, couche, dg, atlas).length

describe('ATLAS · Belgique', () => {
  it('les couches contiennent le bon nombre de zones', () => {
    expect(nombre('vierge')).toBe(1)
    expect(nombre('regions')).toBe(3)
    expect(nombre('communautes')).toBe(4) // flamande, française, germanophone, Bruxelles (bilingue)
    expect(nombre('provinces')).toBe(11) // 10 provinces + Bruxelles-Capitale
    expect(nombre('communes')).toBe(565)
    expect(nombre('limitrophes')).toBe(5) // Belgique + France, Pays-Bas, Allemagne, Luxembourg
  })

  it('la Communauté germanophone compte 9 communes, toutes en Région wallonne', () => {
    expect(dg.size).toBe(9)
    for (const id of dg) expect(carte.parId.get(id).reg).toBe('Région wallonne')
  })

  it('chaque couche (sauf vierge et communes) a ses frontières et ses noms', () => {
    for (const { id } of COUCHES) {
      if (id === 'vierge' || id === 'communes') continue
      if (id !== 'limitrophes') expect(atlas.frontieres[id].length).toBeGreaterThan(1000)
      for (const z of construireZones(carte, id, dg, atlas)) expect(atlas.etiquettes[id][z.id], `${id}/${z.id}`).toBeTruthy()
    }
  })

  it('les trois fleuves puis les rivières', () => {
    expect(FLEUVES).toEqual(['meuse', 'escaut', 'yser'])
    expect(rivieresVisibles(atlas, 'aucune')).toHaveLength(0)
    expect(rivieresVisibles(atlas, 'fleuves').map((r) => r.id).sort()).toEqual([...FLEUVES].sort())
    const toutes = rivieresVisibles(atlas, 'rivieres').map((r) => r.id)
    for (const id of ['dendre', 'lys', 'sambre', 'rupel', 'ourthe', 'semois']) expect(toutes).toContain(id)
    for (const r of atlas.rivieres) expect(r.noms.length).toBeGreaterThan(0)
  })

  it('une seule étoile (Bruxelles), 10 chefs-lieux, des villes importantes ; toutes dans le pays', () => {
    const v = (cochees) => villesVisibles(atlas, { bruxelles: false, chefsLieux: false, importantes: false, ...cochees })
    expect(v({ bruxelles: true }).map((x) => x.nom)).toEqual(['Bruxelles'])
    expect(v({ chefsLieux: true })).toHaveLength(10)
    expect(v({ importantes: true }).length).toBeGreaterThanOrEqual(20)
    for (const x of atlas.villes) {
      expect(x.x).toBeGreaterThan(0)
      expect(x.x).toBeLessThan(carte.largeur)
      expect(x.y).toBeGreaterThan(0)
      expect(x.y).toBeLessThan(carte.hauteur)
    }
  })

  it('le placement des noms ne perd aucune ville quand on affiche les noms', () => {
    const px = (n) => n * 4
    const villes = villesVisibles(atlas, { bruxelles: true, chefsLieux: true, importantes: true })
    const p = placerEtiquettes({ zones: [], villes, avecNomsVilles: true, rivieres: atlas.rivieres, avecNomsRivieres: true, px })
    expect(Object.keys(p.villes)).toHaveLength(villes.length)
    expect(placerEtiquettes({ zones: [], villes, avecNomsVilles: false, rivieres: [], avecNomsRivieres: false, px }).villes).toEqual({})
  })

  it('le nom de Bruxelles s\u2019écarte de celui de la Région flamande (plus de superposition)', () => {
    const px = (n) => n * 6.83
    const pos = atlas.etiquettes.regions
    const zones = [
      { id: 'flandre', lignes: ['Région', 'flamande'] },
      { id: 'wallonie', lignes: ['Région', 'wallonne'] },
      { id: 'bruxelles', lignes: ['Bruxelles-', 'Capitale'] },
    ].map((z) => ({ ...z, x: pos[z.id].x, y: pos[z.id].y, fs: px(20) }))
    const p = placerEtiquettes({ zones, villes: [], avecNomsVilles: false, rivieres: [], avecNomsRivieres: false, px })
    const [fl, , br] = p.zones
    expect(br.trait).toBeTruthy() // relié à sa zone par un trait
    const demi = (z) => (Math.max(...z.lignes.map((l) => l.length)) * z.fs * 0.63) / 2
    const chevauche = Math.abs(fl.x - br.x) < demi(fl) + demi(br) && Math.abs(fl.y - br.y) < fl.fs * 1.15 * 2
    expect(chevauche).toBe(false)
  })

  it('les réseaux de communication sont là (rail, autoroutes, voies navigables)', () => {
    const r = atlas.reseaux
    expect(r.rail.length).toBeGreaterThan(5000)
    expect(r.autoroutes.map((a) => a.ref)).toEqual(expect.arrayContaining(['E40', 'E19', 'E411', 'E42']))
    expect(r.autoroutes.some((a) => a.ref.startsWith('N'))).toBe(false) // pas de routes nationales
    expect(r.canaux.map((c) => c.id)).toEqual(expect.arrayContaining(['albert', 'gand-terneuzen', 'bruxelles-charleroi', 'centre', 'willebroek']))
    for (const id of r.navigables) expect(atlas.rivieres.some((x) => x.id === id)).toBe(true)
    expect(voiesNavigables(atlas, false).canaux).toHaveLength(0)
    expect(voiesNavigables(atlas, true).canaux).toHaveLength(r.canaux.length)
  })
})
