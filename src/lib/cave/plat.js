import { normaliser } from './appellations.js'
import ingredients from '../../data/cave/plats-ingredients.js'
import modifs from '../../data/cave/plats-modifs.js'
import nommes from '../../data/cave/plats-nommes.js'

// =============================================================
//  Analyse d'un plat écrit librement → profil de saveurs
//  (gras, acidité, épices, sucre, umami, fumé, amertume, sel, poids)
//  Aucune IA : on repère des mots dans une grande base (src/data/cave/plats-*.js),
//  on compose le profil, puis src/lib/cave/accord.js le confronte aux vins.
// =============================================================

const DIMS = ['p', 'g', 'a', 'e', 's', 'u', 'f', 'm', 'l']
export const NOMS_DIMS = {
  p: 'poids',
  g: 'gras',
  a: 'acidité',
  e: 'épices',
  s: 'sucré',
  u: 'umami',
  f: 'fumé / grillé',
  m: 'amertume',
  l: 'salé',
}

function lireOptions(texte) {
  const opts = { fav: [], reg: [] }
  for (const [, cle, valeur] of texte.matchAll(/(fav|reg)=([^;]*)/g)) {
    opts[cle].push(
      ...valeur
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
        .map((v) => (v.startsWith('@') ? v : normaliser(v)))
    )
  }
  return opts
}

function lireNombres(texte, signe) {
  const profil = {}
  const regex = signe ? /([a-z])([+-]\d)/g : /([a-z])(\d)/g
  for (const [, lettre, n] of texte.matchAll(regex)) if (DIMS.includes(lettre)) profil[lettre] = Number(n)
  return profil
}

export function lireLexique(texte, erreurs = []) {
  const entrees = []
  for (const ligne of texte.split('\n')) {
    const l = ligne.trim()
    if (!l || l.startsWith('#')) continue
    const [mots, genre, cats = '', nombres = '', ...reste] = l.split(';')
    if (!mots || !['i', 'm', 'p', 'c'].includes(genre)) {
      erreurs.push(l)
      continue
    }
    const opts = lireOptions(reste.join(';'))
    const cles = mots
      .split('|')
      .map((k) => normaliser(k))
      .filter(Boolean)
    entrees.push({
      cles,
      genre,
      cats: cats
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
      valeurs: lireNombres(nombres, genre === 'm' || genre === 'c'),
      fav: opts.fav,
      reg: opts.reg,
      nom: cles[0],
    })
  }
  return entrees
}

export const LEXIQUE = [...lireLexique(nommes), ...lireLexique(ingredients), ...lireLexique(modifs)]

const INDEX = new Map()
let MAX_MOTS = 1
for (const e of LEXIQUE) {
  for (const cle of e.cles) {
    if (!INDEX.has(cle)) INDEX.set(cle, [])
    INDEX.get(cle).push(e)
    MAX_MOTS = Math.max(MAX_MOTS, cle.split(' ').length)
  }
}

// Variantes d'un groupe de mots : tel quel, dernier mot sans « s/x », dernier mot avec « s »
function variantes(mots) {
  const dernier = mots[mots.length - 1]
  const base = mots.slice(0, -1)
  const v = [mots.join(' ')]
  if (dernier.length > 3 && /[sx]$/.test(dernier)) v.push([...base, dernier.slice(0, -1)].join(' '))
  else v.push([...base, `${dernier}s`].join(' '))
  return v
}

const MOTS_VIDES = new Set([
  'de', 'du', 'des', 'la', 'le', 'les', 'un', 'une', 'au', 'aux', 'a', 'et', 'en', 'avec', 'sans', 'sur', 'ce', 'soir',
  'je', 'mange', 'manger', 'on', 'nous', 'prevu', 'fait', 'faire', 'pour', 'dans', 'plat', 'repas', 'dejeuner', 'diner',
  'midi', 'ce', 'cette', 'mon', 'ma', 'mes', 'l', 'd', 'qu', 'est', 'sont', 'plus', 'tres', 'bien', 'bon', 'bonne', 'petit', 'petite',
])

// Trouve les mots connus dans le texte (les groupes de mots les plus longs d'abord)
function reperer(texte) {
  const brut = String(texte || '')
    .toLowerCase()
    .replace(/p[âa]t[ée]s?\b/g, (m) => (/é/.test(m) ? 'terrine' : 'pates'))
  const mots = normaliser(brut).split(' ').filter(Boolean)
  const trouves = []
  const couverts = new Array(mots.length).fill(false)
  let i = 0
  while (i < mots.length) {
    let ok = false
    for (let n = Math.min(MAX_MOTS, mots.length - i); n >= 1 && !ok; n--) {
      for (const v of variantes(mots.slice(i, i + n))) {
        const entrees = INDEX.get(v)
        if (entrees) {
          trouves.push({ debut: i, longueur: n, texte: mots.slice(i, i + n).join(' '), cle: v, entrees })
          for (let k = i; k < i + n; k++) couverts[k] = true
          i += n
          ok = true
          break
        }
      }
    }
    if (!ok) i++
  }
  const inconnus = mots.filter((m, k) => !couverts[k] && !MOTS_VIDES.has(m) && m.length > 2 && !/^\d+$/.test(m))
  return { trouves, inconnus }
}

const borne = (n, min = 0, max = 5) => Math.max(min, Math.min(max, n))

// texte libre → { profil, cats, fav, reg, parties, reconnu, inconnus }
// ignores : ensemble de clés « parties » à ne pas prendre en compte (croix sur une pastille)
export function analyserPlat(texte, ignores = new Set()) {
  const { trouves, inconnus } = reperer(texte)
  const actifs = trouves.filter((t) => !ignores.has(`${t.debut}:${t.cle}`))

  // Un mot à la fois ingrédient et sauce (« citron ») : sauce s'il y a déjà un autre plat, sinon ingrédient
  const aBase = actifs.some((t) => t.entrees.every((e) => e.genre === 'i' || e.genre === 'p'))
  const retenus = actifs.map((t) => {
    const aGenres = new Set(t.entrees.map((e) => e.genre))
    const ambigu = (aGenres.has('i') || aGenres.has('p')) && (aGenres.has('m') || aGenres.has('c'))
    if (!ambigu) return { ...t, utiles: t.entrees }
    return { ...t, utiles: t.entrees.filter((e) => (aBase ? e.genre === 'm' || e.genre === 'c' : e.genre === 'i' || e.genre === 'p')) }
  })

  const bases = retenus.flatMap((t) => t.utiles.filter((e) => e.genre === 'i' || e.genre === 'p'))
  const ajustements = retenus.flatMap((t) => t.utiles.filter((e) => e.genre === 'm' || e.genre === 'c'))

  const profil = Object.fromEntries(DIMS.map((d) => [d, 0]))
  if (bases.length) {
    for (const b of bases) for (const d of DIMS) profil[d] = Math.max(profil[d], b.valeurs[d] || 0)
  } else {
    profil.p = 3
  }
  const delta = Object.fromEntries(DIMS.map((d) => [d, 0]))
  for (const a of ajustements) for (const d of DIMS) delta[d] += a.valeurs[d] || 0
  for (const d of DIMS) profil[d] = borne(profil[d] + borne(delta[d], -3, 3))

  const tout = [...bases, ...ajustements]
  const cats = [...new Set(tout.flatMap((e) => e.cats))]
  const fav = [...new Set(tout.flatMap((e) => e.fav))]
  const reg = [...new Set(tout.flatMap((e) => e.reg))]

  const parties = trouves.map((t) => {
    const genre = t.entrees.some((e) => e.genre === 'p') ? 'p' : t.entrees.some((e) => e.genre === 'i') ? 'i' : t.entrees[0].genre
    return { id: `${t.debut}:${t.cle}`, texte: t.texte, genre, actif: !ignores.has(`${t.debut}:${t.cle}`) }
  })

  return { profil, cats, fav, reg, parties, reconnu: bases.length > 0, inconnus }
}

// Description courte du profil (pour l'afficher à l'écran)
export function decrirePlat(profil) {
  const morceaux = []
  const niveau = (n, mots) => mots[Math.min(mots.length - 1, Math.max(0, Math.round(n / 2)))]
  morceaux.push(niveau(profil.p, ['très léger', 'léger', 'de poids moyen', 'puissant']))
  if (profil.g >= 3) morceaux.push(profil.g >= 4 ? 'très riche' : 'gras')
  if (profil.a >= 3) morceaux.push('acide')
  if (profil.e >= 2) morceaux.push(profil.e >= 3 ? 'très épicé' : 'épicé')
  if (profil.s >= 3) morceaux.push('sucré')
  if (profil.f >= 2) morceaux.push('grillé / fumé')
  if (profil.m >= 2) morceaux.push('amer')
  if (profil.l >= 3) morceaux.push('salé')
  if (profil.u >= 4) morceaux.push('très savoureux')
  return morceaux.join(' · ')
}

// Idées de plats à lancer d'un tap
export const PLATS_RAPIDES = [
  { label: '🐟 Poisson grillé', texte: 'poisson grillé' },
  { label: '🦪 Huîtres', texte: 'huîtres' },
  { label: '🥩 Entrecôte frites', texte: 'entrecôte frites' },
  { label: '🍝 Pâtes tomate', texte: 'pâtes sauce tomate' },
  { label: '🍕 Pizza', texte: 'pizza margherita' },
  { label: '🍗 Poulet rôti', texte: 'poulet rôti' },
  { label: '🍣 Sushi', texte: 'sushi' },
  { label: '🧀 Plateau de fromages', texte: 'plateau de fromages' },
  { label: '🍛 Curry', texte: 'curry de poulet' },
  { label: '🥗 Salade', texte: 'salade composée' },
  { label: '🍫 Dessert chocolat', texte: 'fondant au chocolat' },
  { label: '🥘 Plat mijoté', texte: 'boeuf bourguignon' },
]

// Affinages d'un tap : ajoutent un mot au plat
export const AFFINAGES = [
  { label: 'grillé', texte: 'grillé' },
  { label: 'rôti au four', texte: 'rôti au four' },
  { label: 'frit', texte: 'frit' },
  { label: 'mijoté', texte: 'mijoté' },
  { label: 'cru', texte: 'cru' },
  { label: 'fumé', texte: 'fumé' },
  { label: 'sauce crème', texte: 'à la crème' },
  { label: 'sauce tomate', texte: 'sauce tomate' },
  { label: 'sauce vin rouge', texte: 'sauce au vin rouge' },
  { label: 'citron', texte: 'au citron' },
  { label: 'moutarde', texte: 'à la moutarde' },
  { label: 'épicé', texte: 'épicé' },
  { label: 'très piquant', texte: 'très piquant' },
  { label: 'aigre-doux', texte: 'aigre-doux' },
  { label: 'champignons', texte: 'aux champignons' },
  { label: 'truffe', texte: 'à la truffe' },
]
