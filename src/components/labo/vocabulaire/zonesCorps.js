// =============================================================
//  Zones du corps sur le VRAI squelette 3D (BodyParts3D) :
//  où se trouve chaque mot de vocabulaire, en mètres dans le modèle
//  (X négatif = côté droit de la personne, Y vers le haut, Z devant).
//  Les valeurs viennent des vraies positions des os du modèle
//  (articulations de l'épaule, du coude, du genou…).
// =============================================================

// c = côté de la personne ('d' : droite, X négatif ; 'g' : gauche) ; n = articulation à laquelle la zone est attachée (elle suit l'os quand il bouge)
const sym = (f) => [-1, 1].flatMap((s) => [].concat(f(s, s < 0 ? 'd' : 'g')))

// Chaque zone : un point (a) ou un segment (a → b) et un rayon r.
// priorite : les petites zones passent avant les grandes (les yeux avant la tête).
export const ZONES = {
  yeux: { fin: true, priorite: 0, zones: sym((s) => ({ a: [s * 0.031, 1.63, 0.07], r: 0.024 })) },
  nez: { fin: true, priorite: 0, zones: [{ a: [0, 1.585, 0.08], r: 0.02 }] },
  oreille: { fin: true, priorite: 0, zones: sym((s) => ({ a: [s * 0.078, 1.6, -0.02], r: 0.03 })) },
  // les 5 doigts de chaque main (positions relevées sur les vrais os de la main)
  doigt: {
    fin: true,
    priorite: 0,
    zones: sym((s, c) => [
      { a: [s * 0.305, 0.845, 0.06], b: [s * 0.3206, 0.801, 0.07], r: 0.013, na: `poignet_${c}` }, // pouce
      { a: [s * 0.2918, 0.789, 0.06], b: [s * 0.3089, 0.745, 0.07], r: 0.012, na: `poignet_${c}` }, // index
      { a: [s * 0.2683, 0.789, 0.06], b: [s * 0.2771, 0.735, 0.07], r: 0.012, na: `poignet_${c}` }, // majeur
      { a: [s * 0.2521, 0.7967, 0.06], b: [s * 0.2504, 0.745, 0.07], r: 0.012, na: `poignet_${c}` }, // annulaire
      { a: [s * 0.23, 0.8156, 0.06], b: [s * 0.2226, 0.758, 0.07], r: 0.012, na: `poignet_${c}` }, // auriculaire
    ]),
  },
  bouche: { fin: true, priorite: 1, zones: [{ a: [0, 1.543, 0.075], r: 0.028 }] },
  coude: { priorite: 1, zones: sym((s, c) => ({ a: [s * 0.209, 1.119, -0.03], r: 0.04, na: `coude_${c}` })) },
  genou: { priorite: 1, zones: sym((s, c) => ({ a: [s * 0.078, 0.458, 0.012], r: 0.05, na: `genou_${c}` })) },
  epaule: { priorite: 2, zones: sym((s, c) => ({ a: [s * 0.162, 1.392, -0.014], r: 0.055, na: `epaule_${c}` })) },
  cou: { priorite: 2, zones: [{ a: [0, 1.47, -0.03], b: [0, 1.43, -0.035], r: 0.04 }] },
  pied: { priorite: 2, zones: sym((s, c) => ({ a: [s * 0.108, 0.045, 0.045], b: [s * 0.108, 0.03, 0.09], r: 0.05, na: `cheville_${c}` })) },
  main: { priorite: 2, zones: sym((s, c) => ({ a: [s * 0.262, 0.86, 0.03], b: [s * 0.268, 0.805, 0.05], r: 0.055, na: `poignet_${c}` })) },
  tete: { priorite: 3, ancre: [0, 1.7, 0], zones: [{ a: [0, 1.612, -0.015], r: 0.118 }] },
  bras: {
    priorite: 4,
    zones: sym((s, c) => [
      { a: [s * 0.17, 1.37, -0.015], b: [s * 0.209, 1.119, -0.03], r: 0.042, na: `epaule_${c}` },
      { a: [s * 0.209, 1.119, -0.03], b: [s * 0.25, 0.891, 0.015], r: 0.042, na: `coude_${c}` },
    ]),
  },
  jambe: {
    priorite: 4,
    zones: sym((s, c) => [
      { a: [s * 0.094, 0.895, -0.022], b: [s * 0.078, 0.46, -0.023], r: 0.058, na: `hanche_${c}` },
      { a: [s * 0.078, 0.46, -0.023], b: [s * 0.068, 0.082, -0.025], r: 0.045, na: `genou_${c}` },
    ]),
  },
  ventre: { priorite: 4, zones: [{ a: [-0.035, 1.075, 0.04], b: [0.035, 1.075, 0.04], r: 0.09 }] },
}

// Côté (-1 = gauche de l'écran, 1 = droite) et zone où l'on colle l'étiquette
export const COIN_ETIQUETTE = {
  tete: { cote: -1, zone: 0 },
  oreille: { cote: 1, zone: 1 },
  yeux: { cote: -1, zone: 0 },
  nez: { cote: 1, zone: 0 },
  bouche: { cote: -1, zone: 0 },
  cou: { cote: 1, zone: 0 },
  epaule: { cote: -1, zone: 0 },
  bras: { cote: 1, zone: 3 },
  coude: { cote: -1, zone: 0 },
  ventre: { cote: 1, zone: 0 },
  main: { cote: -1, zone: 0 },
  doigt: { cote: 1, zone: 7 },
  jambe: { cote: -1, zone: 0 },
  genou: { cote: 1, zone: 1 },
  pied: { cote: -1, zone: 0 },
}

// Les vrais os à allumer pour chaque mot (les autres parties ne sont pas des os : on les entoure)
export const OS_MOT = {
  tete: ['crane'],
  epaule: ['clavicule', 'omoplate'],
  bras: ['humerus', 'radius', 'cubitus'],
  main: ['main'],
  jambe: ['femur', 'tibia', 'perone'],
  genou: ['rotule'],
  pied: ['pied'],
}

// Cadres de la caméra (vue de face) : { centre: [x, y], demiHauteur, demiLargeur }
export const CADRES = {
  corps: { centre: [0, 0.865], demiHauteur: 0.97, demiLargeur: 0.36 },
  tete: { centre: [0, 1.585], demiHauteur: 0.17, demiLargeur: 0.12 },
  main: { centre: [-0.268, 0.81], demiHauteur: 0.1, demiLargeur: 0.085 },
}
const MOTS_TETE = ['tete', 'yeux', 'nez', 'bouche', 'oreille', 'cou']
export const cadreDe = (id) => (MOTS_TETE.includes(id) ? 'tete' : id === 'doigt' ? 'main' : 'corps')

// Un mot « contient » ces parties : toucher le nez quand on demande « la tête » est juste
export const CONTIENT = { tete: ['yeux', 'nez', 'bouche', 'oreille'], bras: ['coude'], jambe: ['genou'], main: ['doigt'] }
export const estJuste = (cible, touche) => !!touche && (touche === cible || (CONTIENT[cible] || []).includes(touche))

const MIN_PX = 30 // même sur une petite zone, un doigt doit pouvoir la toucher

function distanceSegment(p, a, b) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const l2 = dx * dx + dy * dy
  const t = l2 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2)) : 0
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

// Quelle partie est sous le doigt ? (x, y en pixels du cadre ; outils fournis par Corps3D)
export function partieSousLeDoigt(outils, x, y, ids = Object.keys(ZONES)) {
  const ppm = outils.pixelsParMetre()
  const doigt = { x, y }
  // les petites parties (yeux, nez, doigts…) ne se touchent que quand la caméra a zoomé dessus
  const zoome = ppm >= 900
  const ordre = ids.filter((id) => ZONES[id] && (zoome || !ZONES[id].fin)).sort((p, q) => ZONES[p].priorite - ZONES[q].priorite)
  let meilleur = null
  for (const id of ordre) {
    const def = ZONES[id]
    if (meilleur && def.priorite > meilleur.priorite) break
    def.zones.forEach((z, i) => {
      const a = outils.projeter(z.a, z.na)
      const b = z.b ? outils.projeter(z.b, z.na) : a
      const r = Math.max(z.r * ppm, MIN_PX)
      const n = distanceSegment(doigt, a, b) / r
      if (n <= 1 && (!meilleur || n < meilleur.n)) meilleur = { id, n, zone: i, priorite: def.priorite }
    })
  }
  return meilleur
}

// Position à l'écran du point où l'on colle l'étiquette d'un mot, et rayon d'entourage (pixels).
// Si la zone prévue est hors de l'écran (caméra zoomée), on prend une autre zone visible du même mot.
export function ancrage(outils, id, W = 0, H = 0) {
  const def = ZONES[id]
  if (!def) return null
  const coin = COIN_ETIQUETTE[id] || { cote: 1, zone: 0 }
  const ppm = outils.pixelsParMetre()
  const centreDe = (z) => {
    const a = outils.projeter(z.a, z.na)
    const b = z.b ? outils.projeter(z.b, z.na) : a
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  }
  const dedans = (p) => !W || (p.x > 8 && p.x < W - 8 && p.y > 8 && p.y < H - 8)
  let i = Math.min(coin.zone, def.zones.length - 1)
  let cote = coin.cote
  let pt = def.ancre && i === 0 ? outils.projeter(def.ancre) : centreDe(def.zones[i])
  if (!dedans(pt)) {
    const k = def.zones.findIndex((z) => dedans(centreDe(z)))
    if (k < 0) return { x: pt.x, y: pt.y, r: 14, cote }
    i = k
    pt = centreDe(def.zones[i])
    cote = pt.x < W / 2 ? -1 : 1
  }
  return { x: pt.x, y: pt.y, r: Math.max(def.zones[i].r * ppm, 14), cote }
}

// Tous les entourages d'un mot (les deux yeux, les deux bras…)
export function entourages(outils, id) {
  const def = ZONES[id]
  if (!def) return []
  const ppm = outils.pixelsParMetre()
  return def.zones.map((z) => {
    const a = outils.projeter(z.a, z.na)
    const b = z.b ? outils.projeter(z.b, z.na) : a
    return { x1: a.x, y1: a.y, x2: b.x, y2: b.y, r: Math.max(z.r * ppm, 14) }
  })
}

// Un point d'une main (x, y du modèle) est-il sur un doigt (et pas sur la paume) ?
export function surUnDoigt(x, y) {
  return ZONES.doigt.zones.some((z) => {
    const a = z.a
    const b = z.b
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy)))
    return Math.hypot(x - (a[0] + t * dx), y - (a[1] + t * dy)) <= z.r + 0.006
  })
}
