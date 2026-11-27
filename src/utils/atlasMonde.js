import { geoAzimuthalEquidistant, geoCircle, geoDistance, geoEquirectangular, geoGraticule, geoMercator, geoOrthographic, geoPath } from 'd3-geo'
import { geoCylindricalEqualArea, geoMollweide, geoRobinson, geoWinkel3 } from 'd3-geo-projection'

// =============================================================
//  ATLAS · Monde : projections, lignes imaginaires, fuseaux, zones climatiques.
//  Les continents sont en longitude / latitude (src/data/atlas-monde.json) :
//  c'est d3-geo qui les projette, selon la projection choisie.
// =============================================================

// Projection de base des 4 premiers volets : Robinson (parallèles droits, méridiens courbes, pôles aplatis)
export const PROJECTION_BASE = 'robinson'

export const LARGEUR = 1000 // largeur de la carte, en unités du SVG

// ---------- Continents ----------
// Programme belge : Europe, Asie, Amérique (un seul continent), Afrique, Océanie, Antarctique.
// On peut aussi séparer l'Amérique du Nord et l'Amérique du Sud (option de l'écran).
export const CONTINENTS = [
  { id: 'amerique', nom: 'Amérique', couleur: '#fdba74', labels: [[-102, 46], [-61, -14]] },
  { id: 'europe', nom: 'Europe', couleur: '#a5b4fc', labels: [[18, 55]] },
  { id: 'afrique', nom: 'Afrique', couleur: '#fde047', labels: [[21, 5]] },
  { id: 'asie', nom: 'Asie', couleur: '#86efac', labels: [[92, 47]] },
  { id: 'oceanie', nom: 'Océanie', couleur: '#c4b5fd', labels: [[134, -31]] },
  { id: 'antarctique', nom: 'Antarctique', couleur: '#e2e8f0', labels: [[70, -78]] },
]
const AMERIQUES = [
  { id: 'amerique-nord', nom: 'Amérique du Nord', couleur: '#fdba74', labels: [[-102, 46]] },
  { id: 'amerique-sud', nom: 'Amérique du Sud', couleur: '#f9a8d4', labels: [[-61, -14]] },
]
// Les continents à dessiner (l'Amérique en un ou en deux morceaux)
export const continentsAffiches = (scinde) => (scinde ? CONTINENTS.flatMap((c) => (c.id === 'amerique' ? AMERIQUES : [c])) : CONTINENTS)

// Océans (programme belge : Atlantique, Pacifique, Indien, Arctique, Antarctique). Un ou plusieurs
// emplacements pour le nom (le Pacifique est coupé en deux sur une carte centrée sur Greenwich).
export const OCEANS = [
  { id: 'atlantique', nom: 'Océan Atlantique', lieux: [[-36, 27]] },
  { id: 'pacifique', nom: 'Océan Pacifique', lieux: [[-138, 8], [164, 11]] },
  { id: 'indien', nom: 'Océan Indien', lieux: [[78, -18]] },
  { id: 'arctique', nom: 'Océan Arctique', lieux: [[95, 82]] },
  { id: 'antarctique', nom: 'Océan Antarctique', lieux: [[75, -57]] },
]

// ---------- Hémisphères et pôles (repères du programme) ----------
export const HEMISPHERES = [
  { id: 'nord', nom: 'Hémisphère nord', groupe: 'ns', lat: [0, 90], couleur: 'rgba(59,130,246,0.13)', label: [-42, 55] },
  { id: 'sud', nom: 'Hémisphère sud', groupe: 'ns', lat: [-90, 0], couleur: 'rgba(249,115,22,0.13)', label: [-30, -38] },
  { id: 'est', nom: 'Hémisphère est', groupe: 'eo', lon: [0, 180], couleur: 'rgba(16,185,129,0.13)', label: [105, -45] },
  { id: 'ouest', nom: 'Hémisphère ouest', groupe: 'eo', lon: [-180, 0], couleur: 'rgba(168,85,247,0.13)', label: [-105, -45] },
]
export const POLES = [
  { id: 'nord', nom: 'Pôle Nord', lat: 90 },
  { id: 'sud', nom: 'Pôle Sud', lat: -90 },
]

// ---------- Lignes imaginaires ----------
export const INCLINAISON = 23.4363 // inclinaison de l'axe de la Terre : tropiques à ±23,44°
export const CERCLE_POLAIRE = 90 - INCLINAISON // cercles polaires à ±66,56°

export const LIGNES = [
  { id: 'equateur', nom: 'Équateur', lat: 0, couleur: '#dc2626', largeur: 2.6 },
  { id: 'cancer', nom: 'Tropique du Cancer', lat: INCLINAISON, couleur: '#ea580c', largeur: 2, tirets: '10 6' },
  { id: 'capricorne', nom: 'Tropique du Capricorne', lat: -INCLINAISON, couleur: '#ea580c', largeur: 2, tirets: '10 6' },
  { id: 'arctique', nom: 'Cercle polaire arctique', lat: CERCLE_POLAIRE, couleur: '#2563eb', largeur: 2, tirets: '10 6' },
  { id: 'antarctique', nom: 'Cercle polaire antarctique', lat: -CERCLE_POLAIRE, couleur: '#2563eb', largeur: 2, tirets: '10 6' },
  { id: 'greenwich', nom: 'Méridien de Greenwich', lon: 0, couleur: '#7c3aed', largeur: 2.6 },
  // Limite des hémisphères est / ouest (de l'autre côté de la Terre) : seulement avec les hémisphères
  { id: 'antimeridien', nom: 'Méridien 180°', lon: 180, couleur: '#7c3aed', largeur: 2.6, tirets: '10 6', auxiliaire: true },
]

// ---------- Zones climatiques (selon la latitude) ----------
export const ZONES_CLIMAT = [
  { id: 'chaude', nom: 'Zone chaude', aide: 'entre les deux tropiques', lat: [-INCLINAISON, INCLINAISON], terre: '#f97316', mer: '#fed7aa', label: [[-25, 8]] },
  { id: 'temperee-nord', nom: 'Zone tempérée', aide: 'entre un tropique et un cercle polaire', lat: [INCLINAISON, CERCLE_POLAIRE], terre: '#84cc16', mer: '#d9f99d', label: [[-30, 46]] },
  { id: 'temperee-sud', nom: 'Zone tempérée', aide: 'entre un tropique et un cercle polaire', lat: [-CERCLE_POLAIRE, -INCLINAISON], terre: '#84cc16', mer: '#d9f99d', label: [[-30, -46]] },
  { id: 'froide-nord', nom: 'Zone froide', aide: 'au-delà d’un cercle polaire', lat: [CERCLE_POLAIRE, 90], terre: '#60a5fa', mer: '#bfdbfe', label: [[-30, 77]] },
  { id: 'froide-sud', nom: 'Zone froide', aide: 'au-delà d’un cercle polaire', lat: [-90, -CERCLE_POLAIRE], terre: '#60a5fa', mer: '#bfdbfe', label: [[-30, -77]] },
]

// ---------- Fuseaux horaires (théoriques : 24 tranches de 15° de longitude) ----------
// Le fuseau n est centré sur la longitude 15 × n ; l'heure y vaut l'heure de Greenwich + n.
export const FUSEAUX = Array.from({ length: 25 }, (_, i) => {
  const n = i - 12
  const de = Math.max(-180, 15 * n - 7.5)
  const a = Math.min(180, 15 * n + 7.5)
  return { n, centre: 15 * n, de, a, milieu: (de + a) / 2 } // milieu : où écrire (les fuseaux ±12 sont des demi-tranches)
})

export const signe = (n) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0')

// Heure locale d'un fuseau quand il est `heureGreenwich` h à Greenwich → { h, jour } (jour : -1, 0 ou +1)
export function heureDuFuseau(heureGreenwich, n) {
  const brut = heureGreenwich + n
  const h = ((brut % 24) + 24) % 24
  return { h, jour: brut >= 24 ? 1 : brut < 0 ? -1 : 0 }
}

// ---------- Projections ----------
// propriete : ce que la carte conserve (aucune projection n'en conserve plus d'une à la fois)
export const PROPRIETES = {
  conforme: { nom: 'Conserve les formes et les angles', court: 'Conforme', couleur: 'bg-sky-100 text-sky-800' },
  equivalente: { nom: 'Conserve les surfaces', court: 'Équivalente', couleur: 'bg-emerald-100 text-emerald-800' },
  equidistante: { nom: 'Conserve certaines distances', court: 'Équidistante', couleur: 'bg-amber-100 text-amber-800' },
  compromis: { nom: 'Compromis : déforme un peu de tout', court: 'Compromis', couleur: 'bg-slate-200 text-slate-700' },
  aucune: { nom: 'Montre la Terre telle qu’on la voit de l’espace', court: 'Vue du globe', couleur: 'bg-violet-100 text-violet-800' },
}

const contourMercator = () => geoGraticule().extentMajor([[-180, -80], [180, 80]]).outline()

export const PROJECTIONS = [
  {
    id: 'mercator',
    nom: 'Mercator',
    propriete: 'conforme',
    texte: 'Inventée par Gerardus Mercator en 1569 pour les marins : une route à cap constant y est une ligne droite. Les formes sont justes, mais les surfaces gonflent vers les pôles : le Groenland paraît aussi grand que l’Afrique, alors qu’il est 14 fois plus petit. Coupée à 80° de latitude.',
    fabrique: () => geoMercator(),
    contour: contourMercator,
    rogner: true,
  },
  {
    id: 'equirectangulaire',
    nom: 'Équirectangulaire',
    propriete: 'equidistante',
    texte: 'La plus simple : la longitude et la latitude deviennent directement x et y (carte « plate carrée »). Les distances le long des méridiens sont justes, mais les formes sont étirées sur les côtés, surtout près des pôles.',
    fabrique: () => geoEquirectangular(),
  },
  {
    id: 'gall-peters',
    nom: 'Gall-Peters',
    propriete: 'equivalente',
    texte: 'Proposée par James Gall (1855), popularisée par Arno Peters (1973). Les surfaces sont justes : l’Afrique y a bien sa taille réelle. Mais les formes sont écrasées près des pôles et étirées vers l’équateur.',
    fabrique: () => geoCylindricalEqualArea().parallel(45),
  },
  {
    id: 'robinson',
    nom: 'Robinson',
    propriete: 'compromis',
    texte: 'Dessinée par Arthur Robinson en 1963 : ni les formes ni les surfaces ne sont exactes, mais aucune n’est trop déformée. Les pôles sont des lignes. Elle a beaucoup servi dans les atlas et les manuels.',
    fabrique: () => geoRobinson(),
  },
  {
    id: 'winkel',
    nom: 'Winkel tripel',
    propriete: 'compromis',
    texte: 'Oswald Winkel, 1921. Elle limite à la fois les erreurs de surface, de distance et d’angle. National Geographic l’utilise pour ses planisphères depuis 1998.',
    fabrique: () => geoWinkel3(),
  },
  {
    id: 'mollweide',
    nom: 'Mollweide',
    propriete: 'equivalente',
    texte: 'Karl Mollweide, 1805 : le monde dans une ellipse deux fois plus large que haute. Les surfaces sont justes, mais les formes sont très déformées sur les bords. On l’utilise pour des cartes de statistiques.',
    fabrique: () => geoMollweide(),
  },
  {
    id: 'globe',
    nom: 'Globe (orthographique)',
    propriete: 'aucune',
    texte: 'La Terre vue de l’espace, comme sur un globe : c’est la représentation la plus fidèle de ce que l’on voit, mais on n’en voit qu’une moitié à la fois. Les continents sont écrasés près du bord.',
    fabrique: () => geoOrthographic(),
    type: 'globe',
  },
  {
    id: 'polaire',
    nom: 'Vue du pôle Nord',
    propriete: 'equidistante',
    texte: 'Le pôle Nord au centre : les distances mesurées depuis le pôle sont justes. C’est la carte de l’emblème de l’ONU. Les terres éloignées du pôle sont très étirées ; coupée à 60° de latitude sud.',
    fabrique: () => geoAzimuthalEquidistant(),
    type: 'pole-nord',
  },
]

// Cartes du monde selon les régions : même Terre, centre différent
export const PLANISPHERES = [
  { id: 'europe', nom: 'Europe et Afrique au centre', centre: 0, projection: 'robinson', texte: 'Le méridien de Greenwich (0°) passe au milieu. C’est le planisphère le plus courant en Europe et en Afrique : les Amériques sont à gauche, l’Asie à droite.' },
  { id: 'ameriques', nom: 'Amériques au centre', centre: -95, projection: 'robinson', texte: 'Les Amériques au milieu, comme sur beaucoup de cartes faites aux États-Unis : l’Europe et l’Afrique sont à droite, l’Asie à gauche.' },
  { id: 'asie', nom: 'Asie au centre', centre: 105, projection: 'robinson', texte: 'L’Asie au milieu (cartes chinoises, par exemple) : l’Europe est à gauche, les Amériques à droite.' },
  { id: 'pacifique', nom: 'Pacifique au centre', centre: 160, projection: 'robinson', texte: 'L’océan Pacifique n’est plus coupé en deux : on voit l’Asie, l’Océanie et les Amériques autour de lui. C’est l’Atlantique qui est coupé.' },
  { id: 'atlantique', nom: 'Atlantique au centre', centre: -30, projection: 'robinson', texte: 'L’océan Atlantique au milieu : on voit que l’Europe, l’Afrique et les Amériques le bordent.' },
  { id: 'sud', nom: 'Sud en haut', centre: 135, projection: 'robinson', inverse: true, texte: 'La carte « à l’envers » (australienne, 1979) : rien ne dit qu’il faut mettre le nord en haut ! Le haut et le bas d’une carte sont une convention.' },
  { id: 'pole-nord', nom: 'Vue du pôle Nord', centre: 0, projection: 'polaire', texte: 'Vue d’au-dessus du pôle Nord : l’Arctique est un océan entouré de terres (Amérique du Nord, Europe, Asie).' },
  { id: 'pole-sud', nom: 'Vue du pôle Sud', centre: 0, projection: 'polaire', pole: 'sud', texte: 'Vue d’au-dessus du pôle Sud : l’Antarctique est un continent entouré d’océans.' },
]

// Tous les calculs de la carte pour une projection donnée.
//   centre  : longitude placée au milieu de la carte
//   inverse : carte retournée (sud en haut)
//   pole    : 'nord' | 'sud' (vue du pôle)
export function construireVue({ projectionId, centre = 0, inverse = false, pole = 'nord' }) {
  const def = PROJECTIONS.find((p) => p.id === projectionId) || PROJECTIONS[0]
  const proj = def.fabrique()
  const polaire = def.type === 'pole-nord'
  const globe = def.type === 'globe'
  const sud = polaire && pole === 'sud'

  if (polaire) proj.rotate([-centre, sud ? 90 : -90]).clipAngle(150)
  else if (globe) proj.rotate([-centre, -20])
  else proj.rotate([-centre, 0, inverse ? 180 : 0])

  const contour = def.contour
    ? def.contour()
    : polaire
      ? geoCircle().center([0, sud ? -90 : 90]).radius(150)()
      : { type: 'Sphere' }

  proj.fitWidth(LARGEUR, contour)
  const [[, y0], [, y1]] = geoPath(proj).bounds(contour)
  const hauteur = Math.ceil(y1 - Math.min(0, y0))
  if (def.rogner) proj.clipExtent([[0, 0], [LARGEUR, hauteur]])
  const path = geoPath(proj).digits(1)

  // Position d'un point (lon, lat) sur la carte, ou null s'il est caché (face cachée du globe, hors cadre)
  const centreGlobe = [centre, 20]
  const place = (lon, lat) => {
    if (globe && geoDistance([lon, lat], centreGlobe) > Math.PI / 2 - 0.05) return null
    const p = proj([lon, lat])
    if (!p || p[0] < -2 || p[0] > LARGEUR + 2 || p[1] < -2 || p[1] > hauteur + 2) return null
    return p
  }

  return { def, proj, path, largeur: LARGEUR, hauteur, contourD: path(contour), place, globe, polaire }
}

// Tracé d'un parallèle ou d'un méridien (suite de points assez serrés pour suivre la courbure)
export function ligneGeo({ lat, lon }) {
  const coordinates = []
  if (lat !== undefined) for (let x = -180; x <= 180; x += 2) coordinates.push([x, lat])
  else for (let y = -90; y <= 90; y += 2) coordinates.push([lon, y])
  return { type: 'LineString', coordinates }
}

// Bande de latitudes (zones climatiques) ou de longitudes (fuseaux)
export function bandeGeo({ lat, lon }) {
  const [la0, la1] = lat || [-90, 90]
  const [lo0, lo1] = lon || [-180, 180]
  return geoGraticule().extentMajor([[lo0, la0], [lo1, la1]]).outline()
}

// Petits cercles identiques sur le globe : ils montrent comment la projection déforme (indicatrices de Tissot)
export function cerclesTissot() {
  const cercles = []
  for (let lon = -165; lon <= 165; lon += 30) {
    for (const lat of [-60, -30, 0, 30, 60]) {
      cercles.push(geoCircle().center([lon, lat]).radius(7)())
    }
  }
  return { type: 'GeometryCollection', geometries: cercles }
}

// Grille tous les 30° (méridiens et parallèles)
export const grille = () => geoGraticule().step([30, 30])()

// Les continents, en un seul objet par continent (pour d3-geo)
export function continentsGeo(donnees) {
  return donnees.continents.map((c) => ({ id: c.id, geo: { type: 'MultiPolygon', coordinates: c.polygones } }))
}

// Frontières entre pays : ordinaires, et contestées (tracé non reconnu de tous : pointillés)
export function frontieresGeo(donnees) {
  return {
    pays: { type: 'MultiLineString', coordinates: donnees.frontieres },
    contestees: { type: 'MultiLineString', coordinates: donnees.contestees },
  }
}
