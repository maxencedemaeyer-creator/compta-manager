import { geoAzimuthalEqualArea, geoPath } from 'd3-geo'

// =============================================================
//  ATLAS · Europe : pays, capitales, UE, zone euro, Schengen, montagnes, limites.
//  Les contours sont en longitude / latitude (src/data/atlas-europe.json,
//  Natural Earth 1:10m) : c'est d3-geo qui les projette.
//
//  Projection : Lambert azimutale équivalente (LAEA), celle que l'Union européenne
//  recommande pour cartographier l'Europe (ETRS89-LAEA, INSPIRE). Elle conserve les
//  surfaces : l'Islande garde sa vraie taille par rapport à l'Allemagne ou à la
//  Turquie, ce que ne fait pas Mercator.
//
//  Situation des statuts : 27 novembre 2026.
// =============================================================

export const LARGEUR = 1000
export const DATE_STATUTS = '27 novembre 2026'

// Centre de la projection et points qui doivent tous être visibles dans le cadre
// (Islande, cap Nord, Oural, Caucase et Caspienne, Chypre, nord du Maghreb)
export const CENTRE = [16, 52]
const POINTS_CADRE = [
  [-25.2, 64.9], [-24.6, 66.5], [-13, 66.6], [28, 71.3], [66.5, 68.6], [62, 56], [53.5, 40.2], [44, 36.2],
  [36, 35.6], [34.8, 34.4], [11, 37.2], [-5.6, 35.4], [-9.8, 31.3], [10, 31.3], [24, 31.3],
]

// ---------- Les pays ----------
// ue : 'membre' | 'attente' | 'non'   euro / schengen : true | false
// zone : 'europe' (en entier en Europe) | 'transcont' (à cheval ou selon la convention) | 'asie-pol' (en Asie, mais lié à l'Europe politique) | 'hors'
// lab : où écrire le nom [lon, lat] · cap : capitale [nom, lon, lat] · rang : priorité des noms (1 = d'abord)
export const PAYS = [
  // --- Union européenne : 27 membres ---
  { id: 'be', nom: 'Belgique', zone: 'europe', ue: 'membre', euro: true, schengen: true, cap: ['Bruxelles', 4.35, 50.85], lab: [4.7, 50.55], rang: 0 },
  { id: 'fr', nom: 'France', zone: 'europe', ue: 'membre', euro: true, schengen: true, cap: ['Paris', 2.35, 48.86], lab: [2.4, 46.6], rang: 1 },
  { id: 'de', nom: 'Allemagne', zone: 'europe', ue: 'membre', euro: true, schengen: true, cap: ['Berlin', 13.4, 52.52], lab: [10.2, 51.0], rang: 1 },
  { id: 'it', nom: 'Italie', zone: 'europe', ue: 'membre', euro: true, schengen: true, cap: ['Rome', 12.5, 41.9], lab: [12.8, 43.2], rang: 1 },
  { id: 'lu', nom: 'Luxembourg', zone: 'europe', ue: 'membre', euro: true, schengen: true, cap: ['Luxembourg', 6.13, 49.61], lab: [6.1, 49.8], rang: 4 },
  { id: 'nl', nom: 'Pays-Bas', zone: 'europe', ue: 'membre', euro: true, schengen: true, cap: ['Amsterdam', 4.9, 52.37], lab: [5.5, 52.25], rang: 2 },
  { id: 'dk', nom: 'Danemark', zone: 'europe', ue: 'membre', euro: false, schengen: true, cap: ['Copenhague', 12.57, 55.68], lab: [9.2, 56.1], rang: 2 },
  { id: 'ie', nom: 'Irlande', zone: 'europe', ue: 'membre', euro: true, schengen: false, cap: ['Dublin', -6.26, 53.35], lab: [-8.0, 53.2], rang: 2 },
  { id: 'gr', nom: 'Grèce', zone: 'europe', ue: 'membre', euro: true, schengen: true, cap: ['Athènes', 23.73, 37.98], lab: [22.0, 39.4], rang: 2 },
  { id: 'es', nom: 'Espagne', zone: 'europe', ue: 'membre', euro: true, schengen: true, cap: ['Madrid', -3.7, 40.42], lab: [-3.6, 39.9], rang: 1 },
  { id: 'pt', nom: 'Portugal', zone: 'europe', ue: 'membre', euro: true, schengen: true, cap: ['Lisbonne', -9.14, 38.72], lab: [-8.0, 39.7], rang: 2 },
  { id: 'at', nom: 'Autriche', zone: 'europe', ue: 'membre', euro: true, schengen: true, cap: ['Vienne', 16.37, 48.21], lab: [14.2, 47.5], rang: 2 },
  { id: 'fi', nom: 'Finlande', zone: 'europe', ue: 'membre', euro: true, schengen: true, cap: ['Helsinki', 24.94, 60.17], lab: [26.5, 64.0], rang: 1 },
  { id: 'se', nom: 'Suède', zone: 'europe', ue: 'membre', euro: false, schengen: true, cap: ['Stockholm', 18.07, 59.33], lab: [15.8, 62.6], rang: 1 },
  { id: 'cy', nom: 'Chypre', zone: 'asie-pol', ue: 'membre', euro: true, schengen: false, schengenAttente: true, cap: ['Nicosie', 33.38, 35.17], lab: [33.0, 34.75], rang: 3 },
  { id: 'cz', nom: 'Tchéquie', zone: 'europe', ue: 'membre', euro: false, schengen: true, cap: ['Prague', 14.42, 50.09], lab: [15.4, 49.8], rang: 2 },
  { id: 'ee', nom: 'Estonie', zone: 'europe', ue: 'membre', euro: true, schengen: true, cap: ['Tallinn', 24.75, 59.44], lab: [25.6, 58.7], rang: 3 },
  { id: 'hu', nom: 'Hongrie', zone: 'europe', ue: 'membre', euro: false, schengen: true, cap: ['Budapest', 19.04, 47.5], lab: [19.4, 47.2], rang: 2 },
  { id: 'lv', nom: 'Lettonie', zone: 'europe', ue: 'membre', euro: true, schengen: true, cap: ['Riga', 24.11, 56.95], lab: [25.0, 56.9], rang: 3 },
  { id: 'lt', nom: 'Lituanie', zone: 'europe', ue: 'membre', euro: true, schengen: true, cap: ['Vilnius', 25.28, 54.69], lab: [23.9, 55.35], rang: 3 },
  { id: 'mt', nom: 'Malte', zone: 'europe', ue: 'membre', euro: true, schengen: true, cap: ['La Valette', 14.51, 35.9], lab: [14.4, 35.9], rang: 5 },
  { id: 'pl', nom: 'Pologne', zone: 'europe', ue: 'membre', euro: false, schengen: true, cap: ['Varsovie', 21.01, 52.23], lab: [19.6, 52.1], rang: 1 },
  { id: 'sk', nom: 'Slovaquie', zone: 'europe', ue: 'membre', euro: true, schengen: true, cap: ['Bratislava', 17.11, 48.15], lab: [19.5, 48.75], rang: 3 },
  { id: 'si', nom: 'Slovénie', zone: 'europe', ue: 'membre', euro: true, schengen: true, cap: ['Ljubljana', 14.51, 46.06], lab: [14.8, 46.1], rang: 4 },
  { id: 'bg', nom: 'Bulgarie', zone: 'europe', ue: 'membre', euro: true, schengen: true, cap: ['Sofia', 23.32, 42.7], lab: [25.3, 42.75], rang: 2 },
  { id: 'ro', nom: 'Roumanie', zone: 'europe', ue: 'membre', euro: false, schengen: true, cap: ['Bucarest', 26.1, 44.43], lab: [24.9, 45.9], rang: 2 },
  { id: 'hr', nom: 'Croatie', zone: 'europe', ue: 'membre', euro: true, schengen: true, cap: ['Zagreb', 15.98, 45.81], lab: [16.4, 45.3], rang: 3 },
  // --- Candidats et demandeurs (« en attente ») ---
  { id: 'al', nom: 'Albanie', zone: 'europe', ue: 'attente', euro: false, schengen: false, cap: ['Tirana', 19.82, 41.33], lab: [20.0, 41.0], rang: 4 },
  { id: 'ba', nom: 'Bosnie-Herzégovine', zone: 'europe', ue: 'attente', euro: false, schengen: false, cap: ['Sarajevo', 18.41, 43.86], lab: [17.8, 44.2], rang: 4 },
  { id: 'ge', nom: 'Géorgie', zone: 'transcont', ue: 'attente', euro: false, schengen: false, cap: ['Tbilissi', 44.79, 41.72], lab: [43.5, 42.1], rang: 3 },
  { id: 'md', nom: 'Moldavie', zone: 'europe', ue: 'attente', euro: false, schengen: false, cap: ['Chisinau', 28.86, 47.01], lab: [28.5, 47.3], rang: 4 },
  { id: 'me', nom: 'Monténégro', zone: 'europe', ue: 'attente', euro: false, euroUsage: true, schengen: false, cap: ['Podgorica', 19.26, 42.44], lab: [19.3, 42.85], rang: 5 },
  { id: 'mk', nom: 'Macédoine du Nord', zone: 'europe', ue: 'attente', euro: false, schengen: false, cap: ['Skopje', 21.43, 42.0], lab: [21.7, 41.6], rang: 5 },
  { id: 'rs', nom: 'Serbie', zone: 'europe', ue: 'attente', euro: false, schengen: false, cap: ['Belgrade', 20.46, 44.79], lab: [20.8, 44.0], rang: 3 },
  { id: 'tr', nom: 'Turquie', zone: 'transcont', ue: 'attente', euro: false, schengen: false, cap: ['Ankara', 32.86, 39.93], lab: [34.5, 39.1], rang: 1 },
  { id: 'ua', nom: 'Ukraine', zone: 'europe', ue: 'attente', euro: false, schengen: false, cap: ['Kyiv', 30.52, 50.45], lab: [31.5, 49.0], rang: 1 },
  { id: 'xk', nom: 'Kosovo', zone: 'europe', ue: 'attente', euro: false, euroUsage: true, schengen: false, cap: ['Pristina', 21.17, 42.67], lab: [21.0, 42.6], rang: 6 },
  // --- Europe, hors UE ---
  { id: 'no', nom: 'Norvège', zone: 'europe', ue: 'non', euro: false, schengen: true, cap: ['Oslo', 10.75, 59.91], lab: [9.0, 62.2], rang: 2 },
  { id: 'is', nom: 'Islande', zone: 'europe', ue: 'non', euro: false, schengen: true, cap: ['Reykjavik', -21.9, 64.15], lab: [-18.8, 64.95], rang: 2 },
  { id: 'ch', nom: 'Suisse', zone: 'europe', ue: 'non', euro: false, schengen: true, cap: ['Berne', 7.45, 46.95], lab: [8.2, 46.75], rang: 3 },
  { id: 'li', nom: 'Liechtenstein', zone: 'europe', ue: 'non', euro: false, schengen: true, cap: ['Vaduz', 9.52, 47.14], lab: [9.55, 47.15], rang: 7 },
  { id: 'gb', nom: 'Royaume-Uni', zone: 'europe', ue: 'non', euro: false, schengen: false, cap: ['Londres', -0.13, 51.51], lab: [-1.8, 53.2], rang: 1, ancien: 'Ancien membre : parti le 31 janvier 2020 (Brexit).' },
  { id: 'by', nom: 'Biélorussie', zone: 'europe', ue: 'non', euro: false, schengen: false, cap: ['Minsk', 27.57, 53.9], lab: [28.0, 53.4], rang: 2 },
  { id: 'ru', nom: 'Russie', zone: 'transcont', ue: 'non', euro: false, schengen: false, cap: ['Moscou', 37.62, 55.76], lab: [48.0, 58.5], rang: 1 },
  { id: 'ad', nom: 'Andorre', zone: 'europe', ue: 'non', euro: false, euroUsage: true, schengen: false, cap: ['Andorre-la-Vieille', 1.52, 42.51], lab: [1.55, 42.55], rang: 7 },
  { id: 'mc', nom: 'Monaco', zone: 'europe', ue: 'non', euro: false, euroUsage: true, schengen: false, cap: ['Monaco', 7.42, 43.74], lab: [7.42, 43.74], rang: 7 },
  { id: 'sm', nom: 'Saint-Marin', zone: 'europe', ue: 'non', euro: false, euroUsage: true, schengen: false, cap: ['Saint-Marin', 12.45, 43.94], lab: [12.46, 43.94], rang: 7 },
  { id: 'va', nom: 'Vatican', zone: 'europe', ue: 'non', euro: false, euroUsage: true, schengen: false, cap: ['Vatican', 12.45, 41.9], lab: [12.45, 41.9], rang: 7 },
  { id: 'fo', nom: 'Îles Féroé (Danemark)', court: 'Îles Féroé', zone: 'europe', ue: 'non', euro: false, schengen: false, cap: ['Tórshavn', -6.77, 62.01], lab: [-6.9, 62.1], rang: 6, territoire: true },
  // --- Autour de l'Europe ---
  { id: 'az', nom: 'Azerbaïdjan', zone: 'transcont', ue: 'non', euro: false, schengen: false, cap: ['Bakou', 49.87, 40.41], lab: [47.8, 40.5], rang: 3 },
  { id: 'am', nom: 'Arménie', zone: 'asie-pol', ue: 'non', euro: false, schengen: false, cap: ['Erevan', 44.51, 40.18], lab: [44.9, 40.25], rang: 4 },
  { id: 'kz', nom: 'Kazakhstan', zone: 'transcont', ue: 'non', euro: false, schengen: false, lab: [58.5, 49.2], rang: 2 },
  { id: 'ma', nom: 'Maroc', zone: 'hors', ue: 'non', euro: false, schengen: false, cap: ['Rabat', -6.84, 34.02], lab: [-6.2, 32.4], rang: 2 },
  { id: 'dz', nom: 'Algérie', zone: 'hors', ue: 'non', euro: false, schengen: false, cap: ['Alger', 3.06, 36.75], lab: [3.5, 33.0], rang: 2 },
  { id: 'tn', nom: 'Tunisie', zone: 'hors', ue: 'non', euro: false, schengen: false, cap: ['Tunis', 10.18, 36.81], lab: [9.4, 34.2], rang: 3 },
  { id: 'ly', nom: 'Libye', zone: 'hors', ue: 'non', euro: false, schengen: false, cap: ['Tripoli', 13.19, 32.89], lab: [18.0, 30.8], rang: 3 },
  { id: 'sy', nom: 'Syrie', zone: 'hors', ue: 'non', euro: false, schengen: false, cap: ['Damas', 36.29, 33.51], lab: [38.3, 35.0], rang: 3 },
  { id: 'lb', nom: 'Liban', zone: 'hors', ue: 'non', euro: false, schengen: false, cap: ['Beyrouth', 35.5, 33.89], lab: [35.9, 33.9], rang: 6 },
  { id: 'il', nom: 'Israël', zone: 'hors', ue: 'non', euro: false, schengen: false, lab: [34.9, 31.4], rang: 5 },
  { id: 'iq', nom: 'Irak', zone: 'hors', ue: 'non', euro: false, schengen: false, lab: [43.5, 33.5], rang: 3 },
  { id: 'ir', nom: 'Iran', zone: 'hors', ue: 'non', euro: false, schengen: false, lab: [53.0, 33.5], rang: 3 },
  { id: 'gl', nom: 'Groenland (Danemark)', court: 'Groenland', zone: 'hors', ue: 'non', euro: false, schengen: false, lab: [-26.5, 70.2], rang: 3, territoire: true },
]
const PAR_ID = Object.fromEntries(PAYS.map((p) => [p.id, p]))
export const paysDe = (id) => PAR_ID[id]
export const nomCourt = (p) => p.court || p.nom

// ---------- Union européenne ----------
export const STATUTS_UE = {
  membre: { nom: 'Membre de l’UE', fond: '#2563eb', texte: '#ffffff' },
  attente: { nom: 'En attente (candidat ou demandeur)', fond: '#f59e0b', texte: '#ffffff' },
  non: { nom: 'Non membre', fond: '#cbd5e1', texte: '#334155' },
}

// Adhésion (année) des 27 États membres, et ce qu'on sait des candidats : la situation « au détail »
export const ADHESION = {
  be: 1957, fr: 1957, de: 1957, it: 1957, lu: 1957, nl: 1957, dk: 1973, ie: 1973, gr: 1981, es: 1986, pt: 1986,
  at: 1995, fi: 1995, se: 1995, cy: 2004, cz: 2004, ee: 2004, hu: 2004, lv: 2004, lt: 2004, mt: 2004, pl: 2004, sk: 2004, si: 2004,
  bg: 2007, ro: 2007, hr: 2013,
}
export const ADHESION_EURO = {
  be: 1999, de: 1999, ie: 1999, es: 1999, fr: 1999, it: 1999, lu: 1999, nl: 1999, at: 1999, pt: 1999, fi: 1999,
  gr: 2001, si: 2007, cy: 2008, mt: 2008, sk: 2009, ee: 2011, lv: 2014, lt: 2015, hr: 2023, bg: 2026,
}
export const ADHESION_SCHENGEN = {
  be: 1995, de: 1995, es: 1995, fr: 1995, lu: 1995, nl: 1995, pt: 1995, it: 1997, at: 1997, gr: 2000,
  dk: 2001, fi: 2001, se: 2001, is: 2001, no: 2001,
  cz: 2007, ee: 2007, hu: 2007, lv: 2007, lt: 2007, mt: 2007, pl: 2007, sk: 2007, si: 2007,
  ch: 2008, li: 2011, hr: 2023, bg: 2025, ro: 2025,
}
export const DETAIL_UE = {
  al: 'Candidate depuis 2014. Négociations ouvertes sur tous les chapitres ; objectif : les conclure en 2027.',
  ba: 'Candidate depuis décembre 2022. Les négociations ne sont pas encore ouvertes.',
  ge: 'Candidate depuis décembre 2023, mais le processus est gelé de fait depuis 2024.',
  md: 'Candidate depuis juin 2022. Négociations ouvertes ; objectif : les conclure début 2028.',
  me: 'Candidate depuis 2010, la plus avancée : plus de la moitié des chapitres sont déjà clos. Le traité d’adhésion pourrait être signé à l’été 2027.',
  mk: 'Candidate depuis 2005. Négociations ouvertes en 2022.',
  rs: 'Candidate depuis 2012. Négociations ouvertes en 2014, mais sans progrès notable.',
  tr: 'Candidate depuis 1999. Négociations au point mort depuis 2018.',
  ua: 'Candidate depuis juin 2022. Négociations ouvertes.',
  xk: 'A déposé sa demande en décembre 2022 : « candidat potentiel », pas encore candidat (cinq États de l’UE ne reconnaissent pas son indépendance).',
  is: 'A suspendu les négociations en 2013 et retiré sa demande en 2015. Le 29 août 2026, les Islandais ont refusé par référendum (52,8 %) de rouvrir les discussions.',
  gb: 'Ancien membre : parti de l’UE le 31 janvier 2020 (Brexit).',
  no: 'Refus par référendum en 1972 et en 1994. Membre de l’Espace économique européen.',
  ch: 'Refus de l’Espace économique européen en 1992. Accords bilatéraux avec l’UE.',
  am: 'N’a pas déposé de demande : une loi de 2025 a lancé le processus, une demande pourrait venir en 2027 ou 2028.',
  by: 'Aucune demande : relations gelées avec l’UE.',
  ru: 'Aucune demande.',
  fo: 'Territoire du Danemark, mais en dehors de l’UE.',
}

export const MEMBRES_UE = PAYS.filter((p) => p.ue === 'membre')
export const CANDIDATS_UE = PAYS.filter((p) => p.ue === 'attente')
export const ZONE_EURO = PAYS.filter((p) => p.euro)
export const ESPACE_SCHENGEN = PAYS.filter((p) => p.schengen)

// Zone euro : trois états. Schengen : cinq états.
export function etatEuro(p) {
  if (p.euro) return 'euro'
  if (p.euroUsage) return 'usage'
  return p.ue === 'membre' ? 'ue-sans-euro' : 'hors'
}
export function etatSchengen(p) {
  if (p.schengen) return p.ue === 'membre' ? 'schengen-ue' : 'schengen-hors-ue'
  if (p.ue === 'membre') return p.schengenAttente ? 'attente' : 'derogation'
  return 'hors'
}
export const COULEURS_EURO = {
  euro: '#1d4ed8',
  'ue-sans-euro': '#bfdbfe',
  usage: '#818cf8',
  hors: '#e2e8f0',
}
export const COULEURS_SCHENGEN = {
  'schengen-ue': '#059669',
  'schengen-hors-ue': '#2dd4bf',
  attente: '#fcd34d',
  derogation: '#fdba74',
  hors: '#e2e8f0',
}

// ---------- Couleurs des pays (carte « Pays ») ----------
// Cinq couleurs pastel, réparties pour que deux voisins n'aient jamais la même.
export const PALETTE_PAYS = ['#fcd5ce', '#fde8a8', '#cfe8c4', '#c7ddf7', '#e1d0f2']
export const VOISINS = {
  be: ['fr', 'nl', 'de', 'lu'], fr: ['be', 'lu', 'de', 'ch', 'it', 'mc', 'es', 'ad'], de: ['nl', 'be', 'lu', 'fr', 'ch', 'at', 'cz', 'pl', 'dk'],
  lu: ['be', 'fr', 'de'], nl: ['be', 'de'], ch: ['fr', 'de', 'at', 'li', 'it'], at: ['de', 'cz', 'sk', 'hu', 'si', 'it', 'ch', 'li'], li: ['ch', 'at'],
  it: ['fr', 'ch', 'at', 'si', 'sm', 'va', 'mc'], es: ['fr', 'pt', 'ad'], pt: ['es'], ad: ['fr', 'es'], mc: ['fr', 'it'], sm: ['it'], va: ['it'],
  dk: ['de'], pl: ['de', 'cz', 'sk', 'ua', 'by', 'lt', 'ru'], cz: ['de', 'pl', 'sk', 'at'], sk: ['cz', 'pl', 'ua', 'hu', 'at'], hu: ['at', 'sk', 'ua', 'ro', 'rs', 'hr', 'si'],
  si: ['it', 'at', 'hu', 'hr'], hr: ['si', 'hu', 'rs', 'ba', 'me'], ba: ['hr', 'rs', 'me'], rs: ['hu', 'ro', 'bg', 'mk', 'xk', 'me', 'ba', 'hr'], me: ['hr', 'ba', 'rs', 'xk', 'al'],
  xk: ['rs', 'mk', 'al', 'me'], al: ['me', 'xk', 'mk', 'gr'], mk: ['xk', 'rs', 'bg', 'gr', 'al'], gr: ['al', 'mk', 'bg', 'tr'], bg: ['ro', 'rs', 'mk', 'gr', 'tr'],
  ro: ['hu', 'ua', 'md', 'bg', 'rs'], md: ['ro', 'ua'], ua: ['pl', 'sk', 'hu', 'ro', 'md', 'by', 'ru'], by: ['pl', 'lt', 'lv', 'ru', 'ua'], lt: ['pl', 'by', 'lv', 'ru'],
  lv: ['lt', 'by', 'ru', 'ee'], ee: ['lv', 'ru'], fi: ['se', 'no', 'ru'], se: ['no', 'fi'], no: ['se', 'fi', 'ru'], ru: ['no', 'fi', 'ee', 'lv', 'by', 'ua', 'lt', 'pl', 'ge', 'az', 'kz'],
  tr: ['gr', 'bg', 'ge', 'am', 'az', 'sy', 'iq', 'ir'], ge: ['tr', 'am', 'az', 'ru'], am: ['ge', 'az', 'tr', 'ir'], az: ['ge', 'am', 'ru', 'ir', 'tr'], kz: ['ru'],
  gb: ['ie'], ie: ['gb'],
}
export function couleurDuPays(id) {
  // Coloriage glouton, dans l'ordre de la liste : stable et sans voisins identiques
  const choisies = couleurDuPays.cache
  if (choisies[id] !== undefined) return PALETTE_PAYS[choisies[id]]
  return '#e8e4d4'
}
couleurDuPays.cache = (() => {
  const ordre = ['be', 'fr', 'de', 'nl', 'lu', 'ch', 'it', 'at', 'li', 'es', 'pt', 'ad', 'mc', 'sm', 'va', 'dk', 'pl', 'cz', 'sk', 'hu', 'si', 'hr', 'ba', 'rs', 'me', 'xk', 'al', 'mk', 'gr', 'bg', 'ro', 'md', 'ua', 'by', 'lt', 'lv', 'ee', 'fi', 'se', 'no', 'ru', 'tr', 'ge', 'am', 'az', 'kz', 'gb', 'ie', 'is', 'mt', 'cy', 'fo']
  const c = {}
  for (const id of ordre) {
    const pris = new Set((VOISINS[id] || []).map((v) => c[v]).filter((x) => x !== undefined))
    let k = 0
    while (pris.has(k)) k++
    c[id] = k % PALETTE_PAYS.length
  }
  return c
})()

// Pays voisins du Maroc, de la Turquie…, hors Europe : gris-beige, un ton par zone pour les distinguer
export const COULEUR_HORS = '#e6e2d3'
export const COULEUR_MER = '#d3e8f7'

// ---------- Limites de l'Europe ----------
export const CATEGORIES_LIMITES = {
  europe: { nom: 'En Europe', couleur: '#a5b4fc' },
  transcont: { nom: 'À cheval ou selon la convention', couleur: '#fcd34d', aide: 'Russie, Turquie, Kazakhstan, Azerbaïdjan, Géorgie' },
  'asie-pol': { nom: 'En Asie, mais liés à l’Europe politique', couleur: '#f9a8d4', aide: 'Chypre (UE), Arménie (Conseil de l’Europe)' },
  hors: { nom: 'Hors Europe', couleur: '#e6e2d3' },
}

// Éléments qui forment la limite géographique de l'Europe (pour les noms)
export const ELEMENTS_LIMITE = [
  { nom: 'Monts Oural', lieu: [59.6, 61.5], rot: -80 },
  { nom: 'Fleuve Oural', lieu: [54.0, 51.9], rot: 8 },
  { nom: 'Mer Caspienne', lieu: [51.3, 43.2] },
  { nom: 'Caucase', lieu: [45.2, 43.6], rot: 22 },
  { nom: 'Mer Noire', lieu: [34.0, 43.0] },
  { nom: 'Bosphore et Dardanelles', lieu: [27.0, 41.2] },
]

// ---------- Mers et océans ----------
export const MERS = [
  { nom: 'Océan Atlantique', lieu: [-17, 47], a: 18 },
  { nom: 'Mer du Nord', lieu: [3.3, 56.2] },
  { nom: 'Mer Baltique', lieu: [19.5, 57.4] },
  { nom: 'Mer de Norvège', lieu: [1, 66.6] },
  { nom: 'Mer de Barents', lieu: [37, 72.2] },
  { nom: 'Mer Méditerranée', lieu: [17.5, 34.6] },
  { nom: 'Mer Adriatique', lieu: [15.4, 43.1], petit: true },
  { nom: 'Mer Égée', lieu: [25.2, 38.8], petit: true },
  { nom: 'Mer Noire', lieu: [34.0, 43.2] },
  { nom: 'Mer Caspienne', lieu: [51.2, 42.2], petit: true },
  { nom: 'Manche', lieu: [-2.2, 49.9], petit: true },
]

// ---------- Montagnes ----------
// trace : crête, de bout en bout, en [lon, lat] (tracé schématique à l'échelle d'un atlas)
export const MONTAGNES = [
  {
    id: 'pyrenees',
    nom: 'Pyrénées',
    trace: [[-1.8, 43.35], [-1.0, 42.95], [-0.2, 42.8], [0.7, 42.75], [1.5, 42.55], [2.3, 42.42], [3.2, 42.32]],
    lab: [-0.2, 43.3],
    longueur: '430 km',
    point: 'Aneto, 3 404 m',
  },
  {
    id: 'alpes',
    nom: 'Alpes',
    trace: [[7.5, 43.95], [6.9, 44.5], [6.9, 45.2], [6.87, 45.83], [7.9, 46.0], [8.9, 46.4], [10.2, 46.6], [11.8, 46.6], [13.3, 46.6], [14.8, 46.7], [16.1, 47.6]],
    lab: [11.0, 47.1],
    longueur: '1 200 km',
    point: 'Mont Blanc, 4 807 m',
  },
  {
    id: 'caucase',
    nom: 'Caucase',
    trace: [[37.4, 44.7], [38.7, 44.0], [40.0, 43.6], [41.5, 43.3], [42.44, 43.35], [43.5, 42.9], [44.5, 42.7], [46.0, 42.5], [47.0, 42.0], [48.0, 41.35], [49.0, 40.9], [50.35, 40.35]],
    lab: [45.0, 43.9],
    longueur: '1 100 km',
    point: 'Elbrouz, 5 642 m',
  },
  {
    id: 'oural',
    nom: 'Monts Oural',
    trace: [[66.8, 68.0], [64.5, 66.5], [60.5, 65.2], [59.3, 65.0], [59.0, 63.5], [59.6, 60.4], [59.8, 58.5], [60.0, 56.8], [59.0, 55.5], [58.3, 54.3], [58.6, 52.5], [58.7, 51.2]],
    lab: [60.0, 61.6],
    longueur: '2 500 km',
    point: 'Narodnaïa, 1 895 m',
    secondaire: true,
  },
]
export const SOMMETS = [
  { id: 'mont-blanc', nom: 'Mont Blanc', alt: 4807, lieu: [6.865, 45.833], aide: 'Plus haut sommet des Alpes, en France et en Italie. Mesure de 2026 : 4 807,47 m (la hauteur varie avec la neige et la glace).', cote: 'bas' },
  { id: 'elbrouz', nom: 'Elbrouz', alt: 5642, lieu: [42.445, 43.35], aide: 'Plus haut sommet du Caucase, et d’Europe si l’on place la limite sur la crête du Caucase. Volcan éteint, en Russie.', cote: 'haut' },
]
export const formaterAlt = (m) => `${m.toLocaleString('fr-BE').replace(/ /g, ' ')} m`

// ---------- La projection ----------
// Tous les calculs de la carte (comme construireVue de la série Monde).
export function construireVueEurope() {
  const proj = geoAzimuthalEqualArea().rotate([-CENTRE[0], -CENTRE[1]]).scale(1).translate([0, 0])
  const [[x0, y0], [x1, y1]] = geoPath(proj).bounds({ type: 'MultiPoint', coordinates: POINTS_CADRE })
  const marge = 0.035
  const L = x1 - x0
  const k = LARGEUR / (L * (1 + 2 * marge))
  const hauteur = Math.round((y1 - y0) * k * (1 + (2 * marge * L) / (y1 - y0)))
  proj.scale(k).translate([(LARGEUR - (x0 + x1) * k) / 2, (hauteur - (y0 + y1) * k) / 2])
  const path = geoPath(proj).digits(1)
  const place = (lon, lat) => {
    const p = proj([lon, lat])
    if (!p || p[0] < 0 || p[0] > LARGEUR || p[1] < 0 || p[1] > hauteur) return null
    return p
  }
  const brut = (lon, lat) => proj([lon, lat])
  return { proj, path, largeur: LARGEUR, hauteur, place, brut }
}

// Les pays, prêts pour d3-geo : un seul objet MultiPolygon par pays (et, pour les pays à cheval, sa partie européenne)
export function paysGeo(donnees) {
  const multi = (coordinates) => ({ type: 'MultiPolygon', coordinates })
  return donnees.pays.map((e) => {
    const tout = e.p || [...(e.ee || []), ...(e.ea || [])]
    return { id: e.id, geo: multi(tout), europe: e.ee ? multi(e.ee) : null, asie: e.ea ? multi(e.ea) : null }
  })
}
export const limiteGeo = (donnees) => ({ type: 'LineString', coordinates: donnees.limite })
export const traceGeo = (trace) => ({ type: 'LineString', coordinates: trace })

// =============================================================
//  Volets de la carte : couleurs de chaque pays et fiche d'un pays touché
// =============================================================
export const COULEUR_TERRE = '#ece7d5'
const COULEUR_CONTEXTE = '#eef0f2' // pays autour de l'Europe, dans les volets « statuts »

// Légendes (couleur, texte) de chaque volet « statut »
export const LEGENDE_UE = [
  { cle: 'membre', couleur: STATUTS_UE.membre.fond, nom: 'Membres', aide: 'États membres de l’Union européenne' },
  { cle: 'attente', couleur: STATUTS_UE.attente.fond, nom: 'En attente', aide: 'Candidats et demandeurs' },
  { cle: 'non', couleur: STATUTS_UE.non.fond, nom: 'Non membres' },
]
export const LEGENDE_EURO = [
  { cle: 'euro', couleur: COULEURS_EURO.euro, nom: 'Euro', aide: 'Zone euro' },
  { cle: 'ue-sans-euro', couleur: COULEURS_EURO['ue-sans-euro'], nom: 'Pas l’euro', aide: 'Membres de l’UE qui gardent leur monnaie' },
  { cle: 'usage', couleur: COULEURS_EURO.usage, nom: 'Euro hors zone euro', aide: 'Utilisé par accord ou de leur propre chef' },
  { cle: 'hors', couleur: COULEURS_EURO.hors, nom: 'Pas l’euro' },
]
export const LEGENDE_SCHENGEN = [
  { cle: 'schengen-ue', couleur: COULEURS_SCHENGEN['schengen-ue'], nom: 'Schengen, dans l’UE' },
  { cle: 'schengen-hors-ue', couleur: COULEURS_SCHENGEN['schengen-hors-ue'], nom: 'Schengen, hors UE', aide: 'Islande, Liechtenstein, Norvège, Suisse' },
  { cle: 'attente', couleur: COULEURS_SCHENGEN.attente, nom: 'UE, en attente', aide: 'Chypre : adhésion visée en 2027' },
  { cle: 'derogation', couleur: COULEURS_SCHENGEN.derogation, nom: 'UE, a choisi de rester dehors', aide: 'Irlande' },
  { cle: 'hors', couleur: COULEURS_SCHENGEN.hors, nom: 'Hors Schengen' },
]
export const NOMS_SCHENGEN_CLE = Object.fromEntries(LEGENDE_SCHENGEN.map((l) => [l.cle, l.nom]))

const listeNoms = (liste) => liste.map(nomCourt).sort((a, b) => a.localeCompare(b, 'fr')).join(', ')
export const LISTES = {
  membre: () => listeNoms(MEMBRES_UE),
  attente: () => listeNoms(CANDIDATS_UE),
  euro: () => listeNoms(ZONE_EURO),
  schengen: () => listeNoms(ESPACE_SCHENGEN),
  usage: () => listeNoms(PAYS.filter((p) => p.euroUsage)),
}

// Couleur d'un pays selon le volet. Un pays coupé par la limite de l'Europe renvoie { europe, asie }.
// opts.limites : 'geo' (vue géographique) | 'pol' (vue politique)
export function remplissage(volet, id, opts = {}) {
  const p = PAR_ID[id]
  switch (volet) {
    case 'pays':
      return p && p.zone !== 'hors' ? couleurDuPays(id) : COULEUR_HORS
    case 'ue':
      return !p || p.zone === 'hors' ? COULEUR_CONTEXTE : STATUTS_UE[p.ue].fond
    case 'euro':
      return !p || p.zone === 'hors' ? COULEUR_CONTEXTE : COULEURS_EURO[etatEuro(p)]
    case 'schengen':
      return !p || p.zone === 'hors' ? COULEUR_CONTEXTE : COULEURS_SCHENGEN[etatSchengen(p)]
    case 'limites': {
      if (!p) return CATEGORIES_LIMITES.hors.couleur
      if (opts.limites === 'pol') return CATEGORIES_LIMITES[p.zone].couleur
      // Vue géographique : seul ce qui est du bon côté de la limite est en Europe
      if (p.zone === 'europe') return CATEGORIES_LIMITES.europe.couleur
      if (p.zone === 'transcont') return { europe: CATEGORIES_LIMITES.europe.couleur, asie: CATEGORIES_LIMITES.hors.couleur }
      return CATEGORIES_LIMITES.hors.couleur
    }
    default:
      return COULEUR_TERRE
  }
}

const depuis = (annee, avant = 'depuis') => (annee ? ` (${avant} ${annee})` : '')

// Ce qu'on affiche quand on touche un pays : { titre, badge?, lignes }
export function fichePays(volet, id) {
  const p = PAR_ID[id]
  if (!p) return null
  const titre = p.nom
  const fiche = { titre, lignes: [] }
  const cap = p.cap ? `Capitale : ${p.cap[0]}` : null
  switch (volet) {
    case 'pays':
      if (p.zone === 'hors') fiche.lignes.push('Pays voisin de l’Europe')
      break
    case 'capitales':
      if (cap) fiche.lignes.push(cap)
      else fiche.lignes.push('Capitale hors du cadre de la carte')
      break
    case 'ue': {
      const s = STATUTS_UE[p.ue]
      fiche.badge = { texte: p.ue === 'membre' ? 'Membre' : p.ue === 'attente' ? 'En attente' : 'Non membre', fond: s.fond, couleurTexte: s.texte }
      if (ADHESION[id]) fiche.lignes.push(`Membre depuis ${ADHESION[id]}`)
      if (DETAIL_UE[id]) fiche.lignes.push(DETAIL_UE[id])
      else if (p.ue === 'non' && p.zone !== 'hors') fiche.lignes.push('Pas membre de l’UE.')
      if (p.ue === 'membre' && id === 'cy') fiche.lignes.push('Toute l’île fait partie de l’UE, mais le droit européen est suspendu dans le Nord, hors du contrôle de l’État chypriote.')
      break
    }
    case 'euro': {
      const e = etatEuro(p)
      const texte = e === 'euro' ? 'Euro' : e === 'usage' ? 'Euro hors zone euro' : 'Pas l’euro'
      fiche.badge = { texte, fond: COULEURS_EURO[e], couleurTexte: e === 'euro' ? '#ffffff' : '#1e293b' }
      if (e === 'euro') fiche.lignes.push(`Dans la zone euro${depuis(ADHESION_EURO[id])}`)
      else if (e === 'usage') fiche.lignes.push(id === 'me' || id === 'xk' ? 'Utilise l’euro de son propre chef, sans faire partie de la zone euro.' : 'Utilise l’euro grâce à un accord avec l’UE, sans faire partie de la zone euro.')
      else if (p.ue === 'membre') fiche.lignes.push(id === 'dk' ? 'Membre de l’UE : garde la couronne (dérogation).' : 'Membre de l’UE, mais n’a pas (encore) adopté l’euro.')
      break
    }
    case 'schengen': {
      const e = etatSchengen(p)
      fiche.badge = { texte: e === 'hors' ? 'Hors Schengen' : p.schengen ? 'Espace Schengen' : 'Hors Schengen', fond: COULEURS_SCHENGEN[e], couleurTexte: '#1e293b' }
      if (p.schengen) fiche.lignes.push(`Dans l’espace Schengen${depuis(ADHESION_SCHENGEN[id])}${p.ue === 'membre' ? '' : ' sans être dans l’UE'}`)
      else if (id === 'cy') fiche.lignes.push('Membre de l’UE : doit rejoindre Schengen, objectif 2027.')
      else if (id === 'ie') fiche.lignes.push('Membre de l’UE : a choisi de rester hors Schengen (zone de voyage commune avec le Royaume-Uni).')
      else if (['ad', 'mc', 'sm', 'va'].includes(id)) fiche.lignes.push('Pas dans Schengen, mais frontières ouvertes avec ses voisins.')
      break
    }
    case 'limites': {
      const c = CATEGORIES_LIMITES[p.zone]
      fiche.badge = { texte: c.nom, fond: c.couleur, couleurTexte: '#1e293b' }
      const explic = {
        ru: 'Plus grand pays du monde : à l’ouest de l’Oural, c’est l’Europe ; à l’est, l’Asie.',
        tr: 'Seule la Thrace orientale, à l’ouest du Bosphore, est en Europe.',
        kz: 'Seule la région à l’ouest du fleuve Oural est en Europe.',
        az: 'Au sud de la crête du Caucase, presque tout est en Asie.',
        ge: 'Au sud de la crête du Caucase : en Asie pour cette limite, mais souvent classée en Europe sur les cartes politiques.',
        cy: 'Île d’Asie, mais membre de l’UE.',
        am: 'En Asie, mais membre du Conseil de l’Europe.',
      }[id]
      if (explic) fiche.lignes.push(explic)
      break
    }
    default:
      break
  }
  return fiche
}

// =============================================================
//  Placement des noms : aucun ne doit en recouvrir un autre.
//  items : [{ cle, ordre, candidats: [{ x, y, w, h, … }] }] — le plus petit `ordre` passe d'abord,
//  et prend le premier emplacement libre ; s'il n'y en a pas, son nom n'est pas affiché
//  (il apparaîtra en zoomant, quand il y aura la place).
//  obstacles : [{ x0, y0, x1, y1 }] déjà occupés (points, symboles).
// =============================================================
export function placerEtiquettes(items, obstacles = [], marge = 0) {
  const occupe = [...obstacles]
  const resultat = []
  for (const it of [...items].sort((a, b) => a.ordre - b.ordre)) {
    for (const c of it.candidats) {
      const x0 = c.x - c.w / 2 - marge
      const x1 = c.x + c.w / 2 + marge
      const y0 = c.y - c.h / 2 - marge
      const y1 = c.y + c.h / 2 + marge
      if (occupe.some((q) => x0 < q.x1 && x1 > q.x0 && y0 < q.y1 && y1 > q.y0)) continue
      occupe.push({ x0, y0, x1, y1 })
      const { candidats, ...reste } = it
      resultat.push({ ...reste, ...c })
      break
    }
  }
  return resultat
}
