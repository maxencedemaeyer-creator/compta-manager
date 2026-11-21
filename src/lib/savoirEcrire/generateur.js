// =============================================================
//  Savoir écrire — générateur d'idées
//
//  genererIdee() assemble un SUJET (consigne), une FORME (type d'écrit) et
//  un DÉFI (contrainte ludique) en fonction des compétences visées.
//  Tout est tiré au hasard : on peut relancer l'ensemble ou une seule partie.
//  Le hasard (rng) est injectable pour les tests.
// =============================================================
import { CONTRAINTES, FORMES, GABARITS, LONGUEURS, POOLS, THEMES } from '../../data/savoirEcrire/banque.js'
import { TAGS } from '../../data/savoirEcrire/tags.js'

const TROU = /\{([a-z_]+)(\d?)\}/g

function pick(liste, rng) {
  return liste[Math.floor(rng() * liste.length)]
}

function pickPondere(elements, poids, rng) {
  const total = elements.reduce((s, e) => s + poids(e), 0)
  let r = rng() * total
  for (const e of elements) {
    r -= poids(e)
    if (r <= 0) return e
  }
  return elements[elements.length - 1]
}

// Remplit les {trous} d'un texte. {lieu} ×2 = même lieu ; {lieu} et {lieu2} = deux lieux différents.
export function creerRemplisseur(rng = Math.random) {
  const choisis = new Map()
  const utilises = new Map()
  return (texte) =>
    String(texte).replace(TROU, (trou, nom, chiffre) => {
      const cle = `${nom}${chiffre}`
      if (choisis.has(cle)) return choisis.get(cle)
      const pool = POOLS[nom]
      if (!pool) return trou
      const deja = utilises.get(nom) || new Set()
      const libres = pool.filter((x) => !deja.has(x))
      const choix = pick(libres.length > 0 ? libres : pool, rng)
      deja.add(choix)
      utilises.set(nom, deja)
      choisis.set(cle, choix)
      return choix
    })
}

const cleNiveau = (niveau) => (niveau === 'P5' ? 'P5' : 'P6')
const niveauOk = (n, niveau) => !n || !niveau || niveau === 'P5-P6' || n === niveau

function longueurPour(genres, forme, niveau) {
  const genre = (forme?.genres || []).find((g) => genres.includes(g)) || genres[0] || forme?.genres?.[0] || 'recit'
  return (LONGUEURS[genre] || LONGUEURS.recit)[cleNiveau(niveau)]
}

function tirerForme({ genres, niveau, rng, exclure = null, imposee = null }) {
  if (imposee) {
    return { nom: imposee, longueur: (LONGUEURS[genres[0]] || LONGUEURS.recit)[cleNiveau(niveau)] }
  }
  let possibles = genres.length > 0 ? FORMES.filter((f) => f.genres.some((g) => genres.includes(g))) : FORMES
  if (possibles.length === 0) possibles = FORMES
  if (exclure && possibles.length > 1) possibles = possibles.filter((f) => f.nom !== exclure)
  const forme = pick(possibles, rng)
  return { nom: forme.nom, longueur: longueurPour(genres, forme, niveau) }
}

const VERBES_DE_CONSIGNE = new Set(['ecris', 'raconte', 'decris', 'utilise', 'imagine', 'presente', 'chaque', 'toutes', 'cette', 'avant', 'apres'])

// Deux textes qui parlent presque de la même chose (pour ne pas répéter la consigne dans le défi)
function motsClesDe(texte) {
  return new Set(
    String(texte)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(/[^a-z0-9]+/)
      .filter((m) => m.length > 4 && !VERBES_DE_CONSIGNE.has(m))
  )
}

export function tropProche(a, b) {
  const x = motsClesDe(a)
  const y = motsClesDe(b)
  if (x.size === 0 || y.size === 0) return false
  let commun = 0
  x.forEach((m) => {
    if (y.has(m)) commun += 1
  })
  return commun >= 2 && commun / Math.min(x.size, y.size) >= 0.5
}

function tirerDefi({ tagsDuSujet, remplir, rng, exclure = null, sujet = '' }) {
  const propres = [...new Set(tagsDuSujet.flatMap((t) => TAGS[t]?.contraintes || []))]
  let possibles = propres.length > 0 && rng() < 0.7 ? propres : CONTRAINTES
  if (exclure && possibles.length > 1) possibles = possibles.filter((c) => c !== exclure)
  const originales = possibles.filter((c) => !tropProche(c, sujet))
  if (originales.length > 0) possibles = originales
  return { texte: remplir(pick(possibles, rng)) }
}

function gabaritDePerso(p) {
  return {
    id: `perso:${p.id}`,
    perso: true,
    tags: p.tags || [],
    genre: p.genre || [],
    texte: p.texte,
    forme: p.forme || null,
  }
}

/**
 * @param {object} p
 * @param {{tag:string, poids:number}[]} p.tags  compétences visées (voir tagsPour)
 * @param {string} [p.niveau]    'P5' | 'P6' | 'P5-P6'
 * @param {() => number} [p.rng]
 * @param {string[]} [p.exclure] ids de consignes à éviter (déjà tirées récemment)
 * @param {{id:string, texte:string, tags?:string[]}[]} [p.perso] idées personnelles du prof
 */
export function genererIdee({ tags = [], niveau = 'P5-P6', rng = Math.random, exclure = [], perso = [] } = {}) {
  const actifs = new Map(tags.map((t) => [t.tag, t.poids]))
  const remplir = creerRemplisseur(rng)

  let candidats = [...GABARITS, ...perso.map(gabaritDePerso)].filter(
    (g) => niveauOk(g.niveau, niveau) && (g.tags.length === 0 || g.tags.some((t) => actifs.has(t)))
  )
  const nonVus = candidats.filter((g) => !exclure.includes(g.id))
  if (nonVus.length > 0) candidats = nonVus

  let sujet
  let genres
  let tagsDuSujet
  let forme
  if (candidats.length > 0) {
    const poidsDe = (g) => {
      const base = g.tags.length === 0 ? 1 : g.tags.reduce((s, t) => s + (actifs.get(t) || 0), 0)
      return base + (g.perso ? 2 : 0)
    }
    const g = pickPondere(candidats, poidsDe, rng)
    genres = g.genre || []
    tagsDuSujet = g.tags.filter((t) => actifs.has(t))
    sujet = { id: g.id, source: g.perso ? 'perso' : 'gabarit', texte: remplir(g.texte) }
    forme = tirerForme({ genres, niveau, rng, imposee: g.forme })
  } else {
    // Pas de compétence précise : un thème libre + une forme au hasard
    const theme = pick(THEMES, rng)
    const f = pick(FORMES, rng)
    genres = f.genres
    tagsDuSujet = [...actifs.keys()]
    sujet = { id: `theme:${theme}`, source: 'theme', texte: `Écris ${f.nom.charAt(0).toLowerCase()}${f.nom.slice(1)} sur ce thème : ${theme}.` }
    forme = { nom: f.nom, longueur: longueurPour(genres, f, niveau) }
  }

  const defi = tirerDefi({ tagsDuSujet: tagsDuSujet.length > 0 ? tagsDuSujet : [...actifs.keys()], remplir, rng, sujet: sujet.texte })

  // Compétences affichées : d'abord celles de la consigne, puis les plus demandées
  const ordre = [...new Set([...tagsDuSujet, ...[...actifs.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t)])].filter(
    (t) => TAGS[t]
  )
  const visees = ordre.slice(0, 3)
  // Critères : un par compétence, puis un deuxième, etc. (4 au maximum)
  const criteres = []
  for (let rang = 0; criteres.length < 4 && rang < 3; rang += 1) {
    for (const t of visees) {
      if (criteres.length < 4 && TAGS[t].criteres[rang]) criteres.push(TAGS[t].criteres[rang])
    }
  }
  const aide = [...new Set(visees.flatMap((t) => TAGS[t].aide.slice(0, 1)))].slice(0, 2)

  return {
    sujet,
    forme,
    defi,
    genres,
    tagsDuSujet,
    competences: visees.map((t) => ({ tag: t, nom: TAGS[t].nom, emoji: TAGS[t].emoji })),
    criteres,
    aide,
  }
}

/**
 * Relance une partie seulement de l'idée : 'sujet' (avec une forme adaptée), 'forme' ou 'defi'.
 * `contexte` = les mêmes options que genererIdee.
 */
export function relancer(idee, partie, contexte = {}) {
  const rng = contexte.rng || Math.random
  const niveau = contexte.niveau || 'P5-P6'
  if (partie === 'sujet') {
    const neuf = genererIdee({ ...contexte, exclure: [...(contexte.exclure || []), idee.sujet.id] })
    return { ...neuf, defi: idee.defi }
  }
  if (partie === 'forme') {
    const forme = tirerForme({ genres: idee.genres || [], niveau, rng, exclure: idee.forme?.nom })
    return { ...idee, forme }
  }
  const remplir = creerRemplisseur(rng)
  const tagsDuSujet = idee.tagsDuSujet?.length > 0 ? idee.tagsDuSujet : (contexte.tags || []).map((t) => t.tag)
  return { ...idee, defi: tirerDefi({ tagsDuSujet, remplir, rng, exclure: idee.defi?.texte, sujet: idee.sujet.texte }) }
}

// Nombre approximatif d'idées différentes possibles pour ces compétences (pour l'affichage)
export function nombreIdees({ tags = [], niveau = 'P5-P6', perso = [] } = {}) {
  const actifs = new Set(tags.map((t) => t.tag))
  let total = 0
  for (const g of [...GABARITS, ...perso.map(gabaritDePerso)]) {
    if (!niveauOk(g.niveau, niveau)) continue
    if (g.tags.length > 0 && !g.tags.some((t) => actifs.has(t))) continue
    const parNom = new Map()
    for (const [, nom, chiffre] of String(g.texte).matchAll(TROU)) {
      parNom.set(nom, new Set([...(parNom.get(nom) || []), chiffre]))
    }
    let combinaisons = 1
    for (const [nom, variantes] of parNom) {
      const n = POOLS[nom]?.length || 1
      for (let i = 0; i < variantes.size; i += 1) combinaisons *= Math.max(1, n - i)
    }
    const nbFormes = g.forme ? 1 : Math.max(1, FORMES.filter((f) => (g.genre || []).length === 0 || f.genres.some((x) => g.genre.includes(x))).length)
    const defis = new Set([...g.tags.flatMap((t) => TAGS[t]?.contraintes || []), ...CONTRAINTES]).size
    total += combinaisons * nbFormes * defis
  }
  if (total === 0) total = THEMES.length * FORMES.length * CONTRAINTES.length
  return total
}
