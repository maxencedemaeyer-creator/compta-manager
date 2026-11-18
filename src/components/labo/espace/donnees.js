// =============================================================
//  L'ESPACE — données scientifiques (source unique de vérité)
//  Valeurs : fiches planétaires de la NASA (nssdc.gsfc.nasa.gov),
//  Union astronomique internationale (UAI) pour les définitions.
//  Les distances sont des moyennes (les orbites sont des ellipses
//  presque circulaires). Les vues du labo ne sont PAS à l'échelle,
//  sauf l'activité « Échelle » : on l'écrit toujours à l'écran.
// =============================================================

export const C_LUMIERE = 299792 // km/s

// distMkm = distance moyenne au Soleil, en millions de km ; anneeJ = durée d'une révolution en jours terrestres
// jourH = durée de rotation sur elle-même (jour sidéral), en heures
export const PLANETES = [
  {
    id: 'mercure', nom: 'Mercure', type: 'tellurique', diamKm: 4879, distMkm: 57.9, anneeJ: 88, jourH: 1407.5, axe: 0.03, lunes: '0',
    texture: 'mercure', couleur: '#C9B6A3',
    fait: 'La plus petite et la plus proche du Soleil. De −180 °C la nuit à 430 °C le jour.',
  },
  {
    id: 'venus', nom: 'Vénus', type: 'tellurique', diamKm: 12104, distMkm: 108.2, anneeJ: 224.7, jourH: 5832, axe: 177.4, lunes: '0',
    texture: 'venus', couleur: '#F1C27D', sens: 'rétrograde',
    fait: 'La plus chaude : 465 °C ! Elle tourne très lentement… et à l’envers.',
  },
  {
    id: 'terre', nom: 'Terre', type: 'tellurique', diamKm: 12742, distMkm: 149.6, anneeJ: 365.25, jourH: 23.93, axe: 23.4, lunes: '1',
    texture: 'terre', couleur: '#7FE3A0',
    fait: 'Notre planète : la seule où l’on connaît la vie. Elle a une seule Lune.',
  },
  {
    id: 'mars', nom: 'Mars', type: 'tellurique', diamKm: 6779, distMkm: 227.9, anneeJ: 687, jourH: 24.62, axe: 25.2, lunes: '2',
    texture: 'mars', couleur: '#E27B58',
    fait: 'La planète rouge : son sol contient du fer rouillé. Elle a deux petites lunes.',
  },
  {
    id: 'jupiter', nom: 'Jupiter', type: 'géante gazeuse', diamKm: 139820, distMkm: 778.5, anneeJ: 4332.6, jourH: 9.93, axe: 3.1, lunes: 'plus de 90',
    texture: 'jupiter', couleur: '#D9A066',
    fait: 'La plus grosse : plus de 1 300 Terres tiendraient dedans. Sa Grande Tache Rouge est une tempête.',
  },
  {
    id: 'saturne', nom: 'Saturne', type: 'géante gazeuse', diamKm: 116460, distMkm: 1433.5, anneeJ: 10759, jourH: 10.66, axe: 26.7, lunes: 'plus de 140', anneaux: true,
    texture: 'saturne', couleur: '#E8D3A2',
    fait: 'Ses anneaux sont faits de milliards de morceaux de glace. Elle est moins dense que l’eau !',
  },
  {
    id: 'uranus', nom: 'Uranus', type: 'géante de glaces', diamKm: 50724, distMkm: 2872.5, anneeJ: 30688.5, jourH: 17.24, axe: 97.8, lunes: 'plus de 25', sens: 'rétrograde',
    texture: 'uranus', couleur: '#9FE0E6',
    fait: 'Couchée sur le côté : son axe est incliné de 98°. Elle roule sur son orbite.',
  },
  {
    id: 'neptune', nom: 'Neptune', type: 'géante de glaces', diamKm: 49244, distMkm: 4495.1, anneeJ: 60182, jourH: 16.11, axe: 28.3, lunes: 'plus de 15',
    texture: 'neptune', couleur: '#9B8CFF',
    fait: 'La plus lointaine : des vents jusqu’à 2 000 km/h. Elle a été trouvée par le calcul avant d’être vue.',
  },
]
export const PLANETE = Object.fromEntries(PLANETES.map((p) => [p.id, p]))

export const SOLEIL = { nom: 'Soleil', diamKm: 1392700, tempSurface: 5500, fait: 'Une étoile : une énorme boule de gaz qui produit sa propre lumière.' }
export const LUNE = { nom: 'Lune', diamKm: 3474, distKm: 384400, moisSynodiqueJ: 29.53, moisSideralJ: 27.32, inclinaisonOrbite: 5.1 }
export const TERRE = { diamKm: 12742, inclinaisonAxe: 23.4, anneeJ: 365.25 }

export const TYPE_COURT = { tellurique: 'Rocheuse', 'géante gazeuse': 'Géante gazeuse', 'géante de glaces': 'Géante de glaces' }

// ---- formats français ----
export const nombre = (n, d = 0) => Number(n).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d })

// Durée de la lumière du Soleil jusqu'à une distance (en millions de km) → « 8 min 19 s », « 1 h 20 min »
export function dureeLumiere(distMkm) {
  const s = Math.round((distMkm * 1e6) / C_LUMIERE)
  if (s < 60) return `${s} s`
  if (s < 3600) {
    const m = Math.floor(s / 60)
    return `${m} min ${String(s % 60).padStart(2, '0')} s`
  }
  return `${Math.floor(s / 3600)} h ${String(Math.round((s % 3600) / 60)).padStart(2, '0')} min`
}

// Durée de rotation en clair
export function dureeJour(h) {
  if (h < 48) {
    const hh = Math.floor(h)
    const mm = Math.round((h - hh) * 60)
    return `${hh} h ${String(mm).padStart(2, '0')} min`
  }
  return `${nombre(h / 24, h / 24 < 100 ? 1 : 0)} jours terrestres`
}
export function dureeAnnee(j) {
  return j < 1000 ? `${nombre(j, Math.abs(j - Math.round(j)) < 0.05 ? 0 : 1)} jours` : `${nombre(j / 365.25, j / 365.25 < 20 ? 1 : 0)} ans`
}

// ---- modèle « lisible » du système solaire (PAS à l'échelle) ----
export const rayonOrbite = (p) => 2.2 * Math.sqrt(p.distMkm / 149.6)
export const rayonAffiche = (p) => 0.27 * Math.pow(p.diamKm / 12742, 0.4)

// ---- phases de la Lune ----
// elongation : angle Soleil-Terre-Lune, de 0 (nouvelle Lune) à 360°, dans le sens du mouvement de la Lune
export const PHASES = [
  { id: 'nouvelle', nom: 'Nouvelle Lune', a: 0 },
  { id: 'premier-croissant', nom: 'Premier croissant', a: 45 },
  { id: 'premier-quartier', nom: 'Premier quartier', a: 90 },
  { id: 'gibbeuse-croissante', nom: 'Gibbeuse croissante', a: 135 },
  { id: 'pleine', nom: 'Pleine Lune', a: 180 },
  { id: 'gibbeuse-decroissante', nom: 'Gibbeuse décroissante', a: 225 },
  { id: 'dernier-quartier', nom: 'Dernier quartier', a: 270 },
  { id: 'dernier-croissant', nom: 'Dernier croissant', a: 315 },
]
export function phaseDe(elongationDeg) {
  const a = ((elongationDeg % 360) + 360) % 360
  const i = Math.round(a / 45) % 8
  return PHASES[i]
}

export const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
// Longueur des mois (année non bissextile) : place de la Terre dans l'année
export const JOURS_MOIS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
export function dateDuJour(j) {
  // j : 0 → 1er janvier ; renvoie « 21 juin »
  let r = Math.floor(((j % 365) + 365) % 365)
  for (let m = 0; m < 12; m++) {
    if (r < JOURS_MOIS[m]) return `${r + 1} ${MOIS[m]}`
    r -= JOURS_MOIS[m]
  }
  return '31 déc.'
}

// ---- couleurs de l'expérience (jamais de bleu : réservé à la météo) ----
export const VIOLET = '#A66BFF'
export const ORANGE = '#FFA24D'
export const ROSE = '#FF7AC8'
export const OR = '#FFD27A'
export const CORAIL = '#FF8A6B'
export const MENTHE = '#7CFFB5'
export const LILAS = '#C9A3FF'
