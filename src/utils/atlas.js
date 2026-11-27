// =============================================================
//  ATLAS — logique des cartes de la Belgique (sans affichage)
//  Fonds : les 565 communes de COMMUNOS (src/data/communos-communes.json)
//  Compléments : src/data/atlas-belgique.json (frontières, rivières, villes),
//  fabriqué par scripts/atlas/generer-atlas-belgique.py
// =============================================================
import { nomComplet } from './communos.js'

// Les couches (menu « Couches »), dans l'ordre d'affichage
export const COUCHES = [
  { id: 'vierge', nom: 'Vierge', aide: 'Le contour du pays' },
  { id: 'regions', nom: 'Régions', aide: '3 régions' },
  { id: 'communautes', nom: 'Communautés', aide: '3 communautés' },
  { id: 'provinces', nom: 'Provinces', aide: '10 provinces + Bruxelles' },
  { id: 'communes', nom: 'Communes', aide: '565 communes' },
  { id: 'limitrophes', nom: 'Pays limitrophes', aide: 'France, Pays-Bas, Allemagne, Luxembourg' },
]

// Hydrographie (menu « Hydrographie »)
export const EAUX = [
  { id: 'aucune', nom: 'Aucun cours d’eau' },
  { id: 'fleuves', nom: 'Les 3 fleuves', resume: 'Les 3 fleuves', aide: 'Meuse, Escaut, Yser' },
  { id: 'rivieres', nom: 'Fleuves et rivières', resume: 'Fleuves + rivières', aide: 'Lys, Dendre, Sambre, Ourthe…' },
]

// Villes (menu « Villes ») : ce qu'on peut cocher
export const TYPES_VILLES = [
  { id: 'bruxelles', nom: 'Bruxelles', resume: 'Bruxelles', aide: 'étoile' },
  { id: 'chefsLieux', nom: 'Chefs-lieux de province', resume: 'Chefs-lieux', aide: 'carré' },
  { id: 'importantes', nom: 'Villes importantes', resume: 'Villes', aide: 'rond' },
]

// Ce qu'une ville de atlas-belgique.json est, selon sa « type »
export const TYPE_VILLE_VERS_OPTION = { capitale: 'bruxelles', 'chef-lieu': 'chefsLieux', ville: 'importantes' }

// Les trois fleuves de Belgique
export const FLEUVES = ['meuse', 'escaut', 'yser']

// Groupes de chaque couche : nom, nom sur deux lignes, couleur de remplissage
const REGIONS = {
  flandre: { nom: 'Région flamande', lignes: ['Région', 'flamande'], couleur: '#fde68a' },
  wallonie: { nom: 'Région wallonne', lignes: ['Région', 'wallonne'], couleur: '#fca5a5' },
  bruxelles: { nom: 'Région de Bruxelles-Capitale', lignes: ['Bruxelles-', 'Capitale'], couleur: '#93c5fd' },
}
const COMMUNAUTES = {
  flamande: { nom: 'Communauté flamande', lignes: ['Communauté', 'flamande'], couleur: '#fcd34d' },
  francaise: { nom: 'Communauté française (Fédération Wallonie-Bruxelles)', lignes: ['Communauté', 'française'], couleur: '#93c5fd' },
  germanophone: { nom: 'Communauté germanophone', lignes: ['Communauté', 'germanophone'], couleur: '#86efac' },
  // Bruxelles : bilingue, les deux communautés y sont compétentes → hachures jaune / bleu
  bruxelles: { nom: 'Bruxelles-Capitale (territoire bilingue : communautés flamande et française)', lignes: ['Bruxelles'], couleur: 'hachures' },
}
const PROVINCES = {
  anvers: { nom: 'Anvers', lignes: ['Anvers'], couleur: '#fde68a' },
  limbourg: { nom: 'Limbourg', lignes: ['Limbourg'], couleur: '#d9f99d' },
  'flandre-orientale': { nom: 'Flandre orientale', lignes: ['Flandre', 'orientale'], couleur: '#fdba74' },
  'flandre-occidentale': { nom: 'Flandre occidentale', lignes: ['Flandre', 'occidentale'], couleur: '#f9a8d4' },
  'brabant-flamand': { nom: 'Brabant flamand', lignes: ['Brabant', 'flamand'], couleur: '#bae6fd' },
  'brabant-wallon': { nom: 'Brabant wallon', lignes: ['Brabant', 'wallon'], couleur: '#c4b5fd' },
  hainaut: { nom: 'Hainaut', lignes: ['Hainaut'], couleur: '#fca5a5' },
  namur: { nom: 'Namur', lignes: ['Namur'], couleur: '#a7f3d0' },
  liege: { nom: 'Liège', lignes: ['Liège'], couleur: '#ddd6fe' },
  luxembourg: { nom: 'Luxembourg', lignes: ['Luxembourg'], couleur: '#fcd9a0' },
  bruxelles: { nom: 'Région de Bruxelles-Capitale', lignes: ['Bruxelles-', 'Capitale'], couleur: '#cbd5e1' },
}
const NOMS_PROVINCES = {
  "Province d'Anvers": 'anvers',
  'Province du Limbourg': 'limbourg',
  'Province de Flandre orientale': 'flandre-orientale',
  'Province de Flandre occidentale': 'flandre-occidentale',
  'Province du Brabant flamand': 'brabant-flamand',
  'Province du Brabant wallon': 'brabant-wallon',
  'Province du Hainaut': 'hainaut',
  'Province de Namur': 'namur',
  'Province de Liège': 'liege',
  'Province du Luxembourg': 'luxembourg',
  'Région de Bruxelles-Capitale': 'bruxelles',
}
const PAYS = {
  belgique: { nom: 'Belgique', lignes: ['BELGIQUE'], couleur: '#fcd34d' },
  france: { nom: 'France', lignes: ['FRANCE'], couleur: '#f5d0fe' },
  'pays-bas': { nom: 'Pays-Bas', lignes: ['PAYS-BAS'], couleur: '#fdba74' },
  allemagne: { nom: 'Allemagne', lignes: ['ALLEMAGNE'], couleur: '#d1d5db' },
  luxembourg: { nom: 'Luxembourg', lignes: ['LUXEMBOURG'], couleur: '#86efac' },
}
const DEFINITIONS = { regions: REGIONS, communautes: COMMUNAUTES, provinces: PROVINCES }

// À quel groupe appartient une commune, pour une couche
function groupeDe(couche, commune, communesDG) {
  if (couche === 'regions') {
    return { 'Région flamande': 'flandre', 'Région wallonne': 'wallonie', 'Région de Bruxelles-Capitale': 'bruxelles' }[commune.reg]
  }
  if (couche === 'communautes') {
    if (communesDG.has(commune.id)) return 'germanophone'
    return { 'Région flamande': 'flamande', 'Région wallonne': 'francaise', 'Région de Bruxelles-Capitale': 'bruxelles' }[commune.reg]
  }
  return NOMS_PROVINCES[commune.prov]
}

// Les zones à dessiner pour une couche : [{ id, nom, lignes, d (chemin SVG), couleur }]
export function construireZones(carte, couche, communesDG, atlas) {
  if (couche === 'communes') {
    return carte.communes.map((c) => ({ id: c.id, nom: nomComplet(c), lignes: [c.fr], d: c.chemin, couleur: '#ffffff', commune: c }))
  }
  if (couche === 'vierge') {
    return [{ id: 'pays', nom: 'Belgique', lignes: ['Belgique'], d: carte.communes.map((c) => c.chemin).join(''), couleur: '#ffffff' }]
  }
  if (couche === 'limitrophes') {
    // La Belgique (communes) au-dessus de ses quatre voisins
    const tous = [
      ...atlas.paysVoisins.map((p) => ({ id: p.id, nom: PAYS[p.id].nom, lignes: PAYS[p.id].lignes, d: p.d, couleur: PAYS[p.id].couleur })),
      { id: 'belgique', nom: 'Belgique', lignes: PAYS.belgique.lignes, d: carte.communes.map((c) => c.chemin).join(''), couleur: PAYS.belgique.couleur },
    ]
    return tous
  }
  const def = DEFINITIONS[couche]
  const morceaux = {}
  for (const c of carte.communes) {
    const g = groupeDe(couche, c, communesDG)
    ;(morceaux[g] ||= []).push(c.chemin)
  }
  return Object.entries(def)
    .filter(([id]) => morceaux[id])
    .map(([id, d]) => ({ id, nom: d.nom, lignes: d.lignes, d: morceaux[id].join(''), couleur: d.couleur }))
}

// Rivières à afficher selon le choix « Hydrographie »
export function rivieresVisibles(atlas, eau) {
  if (eau === 'aucune') return []
  if (eau === 'fleuves') return atlas.rivieres.filter((r) => FLEUVES.includes(r.id))
  return atlas.rivieres
}

// Villes à afficher selon les cases cochées { bruxelles, chefsLieux, importantes }
export function villesVisibles(atlas, cochees) {
  return atlas.villes.filter((v) => cochees[TYPE_VILLE_VERS_OPTION[v.type]])
}

// =============================================================
//  Placement des noms : on essaie plusieurs emplacements pour éviter
//  que les noms (villes, rivières) se chevauchent entre eux ou avec
//  les noms de zones. Tout est calculé en unités de carte ; `px(n)`
//  convertit n pixels d'écran en unités (la taille des textes reste
//  donc constante à l'écran, quel que soit le zoom).
// =============================================================
export const TAILLES_VILLES = {
  capitale: { police: 17, rayon: 11 },
  'chef-lieu': { police: 14.5, rayon: 6.5 },
  ville: { police: 12.5, rayon: 4.6 },
}

// Noms de zones écartés de leur zone (zone trop petite) et reliés par un trait.
// dx, dy : décalage du nom en pixels ; fin : où s'arrête le trait, par rapport au nom
export const ECARTS_ZONES = {
  bruxelles: { dx: 0, dy: -66, fin: [0, 20] },
  germanophone: { dx: -165, dy: 60, fin: [70, -10], seulement: 'communautes' },
}
export function ecartZone(couche, id) {
  const e = ECARTS_ZONES[id]
  return e && (!e.seulement || e.seulement === couche) ? e : null
}

// Rectangle [x0, y0, x1, y1] d'un texte (estimation : ~0,6 × la police par caractère)
function rectTexte(x, y, lignes, fs, ancre) {
  const w = Math.max(...lignes.map((l) => l.length)) * fs * 0.58
  const h = lignes.length * fs * 1.15
  const x0 = ancre === 'middle' ? x - w / 2 : ancre === 'end' ? x - w : x
  return [x0, y - fs * 0.95, x0 + w, y - fs * 0.95 + h]
}

const secroisent = (a, b, marge = 0) => a[0] < b[2] + marge && a[2] > b[0] - marge && a[1] < b[3] + marge && a[3] > b[1] - marge
// Les obstacles sont des rectangles, éventuellement marqués `proprio` (le point d'une ville ne gêne pas son propre nom)
const nbCollisions = (r, obstacles, marge, proprio) => obstacles.reduce((n, o) => n + (o.proprio !== proprio && secroisent(r, o, marge) ? 1 : 0), 0)

export function positionNomVille(v, r, fs, place) {
  return {
    h: { x: v.x, y: v.y - r - fs * 0.35, a: 'middle' },
    b: { x: v.x, y: v.y + r + fs * 0.95, a: 'middle' },
    g: { x: v.x - r - fs * 0.3, y: v.y + fs * 0.35, a: 'end' },
    d: { x: v.x + r + fs * 0.3, y: v.y + fs * 0.35, a: 'start' },
  }[place]
}

/**
 * zones   : [{ id, x, y, lignes, fs, ancre }] noms de zones déjà positionnés (fixes)
 * villes  : villes affichées ; avecNomsVilles : afficher leur nom
 * rivieres: rivières affichées ; avecNomsRivieres : afficher leur nom
 * Retourne { villes: { nom: {x, y, a} }, rivieres: { id: {x, y, angle} } }
 */
export function placerEtiquettes({ zones, villes, avecNomsVilles, rivieres, avecNomsRivieres, px }) {
  const obstacles = zones.map((z) => Object.assign(rectTexte(z.x, z.y, z.lignes, z.fs, z.ancre), { proprio: null }))
  for (const v of villes) {
    const r = px(TAILLES_VILLES[v.type].rayon)
    obstacles.push(Object.assign([v.x - r, v.y - r, v.x + r, v.y + r], { proprio: v.nom }))
  }
  const marge = px(2)

  const sortieVilles = {}
  if (avecNomsVilles) {
    const ordre = { capitale: 0, 'chef-lieu': 1, ville: 2 }
    for (const v of [...villes].sort((a, b) => ordre[a.type] - ordre[b.type])) {
      const { police, rayon } = TAILLES_VILLES[v.type]
      const fs = px(police)
      const r = px(rayon)
      const essais = [v.place, 'd', 'g', 'h', 'b'].filter((p, i, t) => t.indexOf(p) === i)
      let choix = null
      for (const place of essais) {
        const pos = positionNomVille(v, r, fs, place)
        const rect = rectTexte(pos.x, pos.y, [v.nom], fs, pos.a)
        if (nbCollisions(rect, obstacles, marge, v.nom) === 0) {
          choix = { pos, rect }
          break
        }
      }
      if (!choix) {
        const pos = positionNomVille(v, r, fs, v.place)
        choix = { pos, rect: rectTexte(pos.x, pos.y, [v.nom], fs, pos.a) }
      }
      sortieVilles[v.nom] = choix.pos
      obstacles.push(Object.assign(choix.rect, { proprio: null }))
    }
  }

  const sortieRivieres = {}
  if (avecNomsRivieres) {
    for (const r of rivieres) {
      const fs = px(r.genre === 'fleuve' ? 15 : 13)
      let meilleur = null
      for (const [x, y, angle] of r.noms) {
        const a = (angle * Math.PI) / 180
        const w = r.nom.length * fs * 0.6
        const h = fs * 1.2
        // centre du texte : un peu au-dessus du trait (perpendiculairement), puis boîte englobante après rotation
        const cx = x + Math.sin(a) * fs * 0.85
        const cy = y - Math.cos(a) * fs * 0.85
        const ex = (Math.abs(Math.cos(a)) * w + Math.abs(Math.sin(a)) * h) / 2
        const ey = (Math.abs(Math.sin(a)) * w + Math.abs(Math.cos(a)) * h) / 2
        const rect = [cx - ex, cy - ey, cx + ex, cy + ey]
        const n = nbCollisions(rect, obstacles, marge, null)
        if (!meilleur || n < meilleur.n) meilleur = { n, x, y, angle, rect }
        if (n === 0) break
      }
      // Un nom de rivière qui ne trouve aucune place libre est omis (on peut zoomer) ; un fleuve garde son nom
      if (meilleur && (meilleur.n === 0 || r.genre === 'fleuve')) {
        sortieRivieres[r.id] = { x: meilleur.x, y: meilleur.y, angle: meilleur.angle }
        obstacles.push(Object.assign(meilleur.rect, { proprio: null }))
      }
    }
  }
  return { villes: sortieVilles, rivieres: sortieRivieres }
}
