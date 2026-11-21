// =============================================================
//  Savoir écrire — recherche des attendus
//
//  Le prof tape quelques mots (« imparfait », « phrase bien structurée »).
//  1. Le dictionnaire (data/savoirEcrire/motsCles.js) repère les notions
//     et désigne les attendus du programme qui s'y rapportent.
//  2. Une recherche dans le texte des attendus complète le résultat.
//  Les accents, les majuscules et les pluriels sont ignorés.
// =============================================================
import ATTENDUS from '../../data/labo/programme_francais_P5-P6_attendus.json'
import { MOTS_CLES, MOTS_VIDES } from '../../data/savoirEcrire/motsCles.js'
import { TAGS_PAR_ATTENDU, TEMPS } from '../../data/savoirEcrire/tags.js'

export const TOUS_LES_ATTENDUS = ATTENDUS
const PAR_ID = new Map(ATTENDUS.map((a) => [a.id, a]))

export function attendu(id) {
  return PAR_ID.get(Number(id)) || null
}

// minuscules, sans accents, ponctuation et tirets remplacés par des espaces
export function normaliser(texte) {
  return String(texte || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/œ/g, 'oe')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

// Racine très simple : on retire le pluriel (s, x) et le « e » final
export function racine(mot) {
  let m = mot
  if (m.length > 3) m = m.replace(/[sx]$/, '')
  if (m.length > 5) m = m.replace(/ee?$/, '')
  return m
}

const racinesDe = (texte) => normaliser(texte).split(' ').filter(Boolean).map(racine)

// Entrées du dictionnaire, préparées une seule fois
const ENTREES = MOTS_CLES.map((e) => ({
  ...e,
  listes: e.mots.map((m) => racinesDe(m)).filter((l) => l.length > 0),
}))

export function niveauAccepte(niveauAttendu, niveauChoisi) {
  if (!niveauChoisi || niveauChoisi === 'P5-P6') return true
  return niveauAttendu === 'P5-P6' || niveauAttendu === niveauChoisi
}

// Entrées du dictionnaire reconnues dans la requête.
// Une expression longue l'emporte sur les mots qu'elle contient :
// « accord du participe » ne déclenche pas aussi l'entrée « accord » seule.
export function entreesReconnues(requete) {
  const mots = racinesDe(requete)
  const trouvees = []
  for (const e of ENTREES) {
    for (const liste of e.listes) {
      for (let i = 0; i + liste.length <= mots.length; i += 1) {
        if (liste.every((m, k) => mots[i + k] === m)) trouvees.push({ e, i, n: liste.length })
      }
    }
  }
  trouvees.sort((a, b) => b.n - a.n || a.i - b.i)
  const couvert = new Map() // position du mot → longueur de l'expression qui l'a prise
  const retenues = new Set()
  for (const t of trouvees) {
    const positions = Array.from({ length: t.n }, (_, k) => t.i + k)
    const bloque = !retenues.has(t.e) && positions.some((p) => (couvert.get(p) || 0) > t.n)
    if (bloque) continue
    retenues.add(t.e)
    positions.forEach((p) => couvert.set(p, Math.max(couvert.get(p) || 0, t.n)))
  }
  return ENTREES.filter((e) => retenues.has(e))
}

/**
 * Cherche les attendus qui correspondent à ce que veut évaluer le prof.
 * @param {string} requete  mots-clés tapés
 * @param {{domaine?: string, niveau?: string}} options
 *   domaine : « Écrire » (défaut) ou « Tous » ; niveau : « P5 », « P6 » ou « P5-P6 »
 * @returns {{ resultats: {attendu: object, score: number, pourquoi: string[], fort: boolean}[], reconnus: string[] }}
 */
export function chercher(requete, { domaine = 'Écrire', niveau = 'P5-P6' } = {}) {
  const entrees = entreesReconnues(requete)
  const scores = new Map() // id → { score, pourquoi:Set }
  const noter = (id, points, raison) => {
    const a = PAR_ID.get(id)
    if (!a) return
    if (domaine !== 'Tous' && a.domaine_nom !== domaine) return
    if (!niveauAccepte(a.niveau, niveau)) return
    const cur = scores.get(id) || { score: 0, pourquoi: new Set() }
    cur.score += points
    if (raison) cur.pourquoi.add(raison)
    scores.set(id, cur)
  }

  // 1) dictionnaire
  for (const e of entrees) {
    e.ids.forEach((id) => noter(id, 10, e.etiquette))
    e.aussi.forEach((id) => noter(id, 5, e.etiquette))
  }

  // 2) texte des attendus (mots libres tapés par le prof)
  const mots = normaliser(requete)
    .split(' ')
    .filter((m) => m.length >= 3 && !MOTS_VIDES.has(m))
    .map(racine)
  if (mots.length > 0) {
    for (const a of ATTENDUS) {
      if (domaine !== 'Tous' && a.domaine_nom !== domaine) continue
      const textes = [
        [3, racinesDe(a.attendu)],
        [2, racinesDe(a.libelle)],
        [1, racinesDe(`${a.sous_categorie_nom || ''} ${a.categorie_nom || ''}`)],
      ]
      for (const mot of mots) {
        for (const [points, racines] of textes) {
          if (racines.some((r) => r === mot || (mot.length >= 4 && r.startsWith(mot)))) {
            noter(a.id, points, null)
            break
          }
        }
      }
    }
  }

  const resultats = [...scores.entries()]
    .map(([id, v]) => ({ attendu: PAR_ID.get(id), score: v.score, pourquoi: [...v.pourquoi], fort: v.score >= 10 }))
    .filter((r) => r.score >= 2)
    .sort((x, y) => y.score - x.score || x.attendu.id - y.attendu.id)
    .slice(0, 40)

  return { resultats, reconnus: entrees.map((e) => e.etiquette) }
}

// Tous les attendus d'un domaine, regroupés par catégorie puis sous-catégorie
export function parcourir({ domaine = 'Écrire', niveau = 'P5-P6' } = {}) {
  const categories = new Map()
  for (const a of ATTENDUS) {
    if (domaine !== 'Tous' && a.domaine_nom !== domaine) continue
    if (!niveauAccepte(a.niveau, niveau)) continue
    const cat = a.sous_categorie_nom ? `${a.sous_categorie_numero} ${a.sous_categorie_nom}` : `${a.categorie_nom}`
    const titre = domaine === 'Tous' ? `${a.domaine_nom} · ${cat}` : cat
    if (!categories.has(titre)) categories.set(titre, [])
    categories.get(titre).push(a)
  }
  return [...categories.entries()]
}

/**
 * Compétences à travailler (tags de la banque d'idées) avec leur poids :
 *  - 3 par mot-clé reconnu dans la requête (ce que le prof a demandé)
 *  - 1 par attendu coché
 */
export function tagsPour({ requete = '', attendusIds = [] } = {}) {
  const poids = new Map()
  const ajouter = (tag, p) => poids.set(tag, (poids.get(tag) || 0) + p)
  for (const e of entreesReconnues(requete)) (e.tags || []).forEach((t) => ajouter(t, 3))
  // Si le prof a nommé un temps précis (« imparfait »), l'attendu général « Conjuguer »
  // ne doit pas ramener les autres temps.
  const tempsDemande = [...poids.keys()].some((t) => TEMPS.includes(t))
  for (const id of attendusIds) {
    for (const t of TAGS_PAR_ATTENDU[id] || []) {
      if (tempsDemande && TEMPS.includes(t) && !poids.has(t)) continue
      ajouter(t, 1)
    }
  }
  return [...poids.entries()].map(([tag, p]) => ({ tag, poids: p })).sort((a, b) => b.poids - a.poids)
}

// Texte court pour une puce : l'attendu raccourci
export function resume(a, max = 90) {
  const t = String(a?.attendu || '').replace(/\s+/g, ' ').trim()
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t
}
