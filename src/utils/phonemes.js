// =============================================================
//  Appli « Lis-moi » : « Sons en couleur » (spécification de Max, 20/11/2026)
//  Les 8 sons des cartes repères de la classe, colorés SEULEMENT quand le son
//  est réellement prononcé dans le mot. En cas de doute : pas de couleur.
//
//  Ordre d'évaluation pour chaque mot :
//   1. Exceptions, priorité absolue :
//      a. corrections faites par Max dans l'« Entraînement des sons »
//         (Firebase, lectures_entrainement/corrections), appliquées partout aussitôt ;
//      b. OVERRIDES ci-dessous (dans le code).
//   2. Prononciation réelle du mot : moteur de l'autre site de Max
//      (decoupageSons.js, dictionnaire Lexique 3.83 découpé à l'avance dans
//      public/lecture/sons.txt). Homographes lus avec les mots voisins
//      (« les poules couvent », « il est / l'est », « six ans / six chats ») ;
//      si on ne peut pas trancher, seules les lettres communes sont colorées.
//   3. Prudence : mot absent du dictionnaire (faute de reconnaissance, nom
//      propre, mot rare) → aucune couleur.
//   + On ne garde que les graphèmes des cartes (« o » seul, « et », « en » de
//     « examen » ne sont donc jamais colorés).
//   + Cache en mémoire par texte.
//
//  Tests : `npm run tester-sons` (scripts/lecture/tester-sons.mjs).
// =============================================================
import { chargerSons, marquesTexte } from './decoupageSons.js'

// ——— Les 8 sons des cartes (couleurs lisibles et bien distinctes entre elles — an orange vif, on brun
//     chocolat, ou rouge vif, é rose-violet : choix de Max du 21/11 ; swatchColor = couleur de la carte) ———
export const SONS = [
  { id: 'an', label: 'an', graphemes: ['an', 'am', 'en', 'em'], color: '#e65100', swatchColor: '#f7a26b', code: 'o' },
  { id: 'in', label: 'in', graphemes: ['in', 'im', 'ain', 'ein'], color: '#4f6d0c', swatchColor: '#b5d334', code: 'v' },
  { id: 'e_aigu', label: 'é', graphemes: ['é', 'er', 'ez'], color: '#a61e8c', swatchColor: '#f4b4c8', code: 'p' },
  { id: 'on', label: 'on', graphemes: ['on', 'om'], color: '#4e2a0e', swatchColor: '#7a4a24', code: 'm' },
  { id: 'eu', label: 'eu', graphemes: ['eu', 'oeu', 'œu'], color: '#17708c', swatchColor: '#7fd3e8', code: 'c' },
  { id: 'ou', label: 'ou', graphemes: ['ou'], color: '#d90429', swatchColor: '#a4161c', code: 'r' },
  { id: 'oi', label: 'oi', graphemes: ['oi'], color: '#000000', swatchColor: '#000000', code: 'n' },
  { id: 'o_au_eau', label: 'au / eau', graphemes: ['au', 'eau'], color: '#8a6400', swatchColor: '#f5c518', code: 'j' },
]
export const COULEUR_PAR_ID = Object.fromEntries(SONS.map((s) => [s.id, s.color]))
const PAR_CODE = Object.fromEntries(SONS.map((s) => [s.code, s]))

// ——— Exceptions (priorité absolue) ———
// Clé : le mot en minuscules. Valeur : le mot avec les sons entre crochets [lettres:son],
// ou le mot seul pour ne RIEN colorer. Sons possibles : an, in, e_aigu, on, eu, ou, oi, o_au_eau.
// Exemples (à décommenter / compléter par Max) :
//   emmener: 'emmen[er:e_aigu]',   // ne pas colorer « em » (logique des cartes plutôt que prononciation)
//   lion: 'lion',                  // ne rien colorer
export const OVERRIDES = {
  monsieur: 'monsi[eu:eu]r', // cas d'école : « on » ne se prononce pas (déjà juste dans le dictionnaire, gardé par sécurité)
}

const normaliser = (s) => s.toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae')

const cache = new Map() // texte → marques (bascule On/Off instantanée)

// Corrections de l'Entraînement (Firebase) : { mot: modèle }, priorité sur OVERRIDES
let corrections = {}
/** Remplace les corrections de l'Entraînement (appelé quand Firebase change). */
export function definirCorrections(modeles) {
  corrections = Object.fromEntries(Object.entries(modeles || {}).map(([mot, m]) => [normaliser(mot), m]))
  cache.clear()
}
const exception = (mot) => {
  const cle = normaliser(mot)
  return corrections[cle] ?? OVERRIDES[cle]
}

/** Lit une exception « monsi[eu:eu]r » → [[début, longueur, son]…] pour le mot donné, ou null si elle ne colle pas. */
function lireOverride(mot, modele) {
  const segments = []
  let lettres = ''
  const re = /\[([^\]:]+):([a-z_]+)\]|([^[]+)/g
  let m
  while ((m = re.exec(modele))) {
    if (m[3]) lettres += m[3]
    else {
      segments.push([lettres.length, m[1].length, m[2]])
      lettres += m[1]
    }
  }
  return normaliser(lettres) === normaliser(mot) ? segments : null
}

// ——— Dictionnaire ———
let chargement = null
/** Charge le dictionnaire des sons une seule fois (≈ 1,5 Mo, compressé par le serveur). */
export function chargerDictionnaireSons() {
  chargement ??= fetch('/lecture/sons.txt')
    .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
    .then(chargerSons)
    .catch((e) => {
      chargement = null
      throw e
    })
  return chargement
}


/**
 * Analyse un texte : liste de [début, longueur, son] (positions dans le texte),
 * seulement les 8 sons des cartes. options.sons = dictionnaire chargé.
 */
export function analyserTexte(texte, { sons }) {
  if (cache.has(texte)) return cache.get(texte)
  const sortie = []
  // 1. exceptions : les mots concernés ne passent pas par le dictionnaire
  const zonesOverride = []
  for (const m of texte.matchAll(/\p{L}+/gu)) {
    const modele = exception(m[0])
    if (modele === undefined) continue
    const segs = lireOverride(m[0], modele)
    if (!segs) continue
    zonesOverride.push([m.index, m.index + m[0].length])
    for (const [d, n, id] of segs) sortie.push([m.index + d, n, id])
  }
  const dansOverride = (p) => zonesOverride.some(([a, b]) => p >= a && p < b)
  // 2. prononciation réelle (dictionnaire), 3. prudence, + graphèmes des cartes uniquement
  for (const [debut, longueur, code] of marquesTexte(sons, texte)) {
    const son = PAR_CODE[code]
    if (!son || dansOverride(debut)) continue
    const lettres = normaliser(texte.slice(debut, debut + longueur))
    if (!son.graphemes.some((g) => normaliser(g) === lettres)) continue
    sortie.push([debut, longueur, son.id])
  }
  sortie.sort((a, b) => a[0] - b[0])
  if (cache.size > 200) cache.clear()
  cache.set(texte, sortie)
  return sortie
}

/** Le modèle d'un mot tel qu'il est coloré (« monsi[eu:eu]r ») — pour l'Entraînement. */
export function modeleDuMot(mot, options) {
  let s = ''
  let i = 0
  for (const [d, n, id] of analyserTexte(mot, options)) {
    s += mot.slice(i, d) + `[${mot.slice(d, d + n)}:${id}]`
    i = d + n
  }
  return s + mot.slice(i)
}

/** Construit un modèle à partir d'une couleur par lettre (null = pas de couleur). */
export function modeleDepuisLettres(lettres, sonsLettres) {
  let s = ''
  let k = 0
  while (k < lettres.length) {
    const id = sonsLettres[k]
    let j = k + 1
    while (j < lettres.length && id && sonsLettres[j] === id) j++
    const morceau = lettres.slice(k, j).join('')
    s += id ? `[${morceau}:${id}]` : morceau
    k = j
  }
  return s
}

/** Un mot seul → segments { text, start, end, soundId } (soundId = null : pas de couleur). */
export function segmenterMot(mot, options) {
  const marques = analyserTexte(mot, options)
  const segments = []
  let i = 0
  for (const [d, n, id] of marques) {
    if (d > i) segments.push({ text: mot.slice(i, d), start: i, end: d, soundId: null })
    segments.push({ text: mot.slice(d, d + n), start: d, end: d + n, soundId: id })
    i = d + n
  }
  if (i < mot.length) segments.push({ text: mot.slice(i), start: i, end: mot.length, soundId: null })
  return segments
}

/** Répartit les sons colorés par mot de Lis-moi : Map(indexMot → [[débutDansLeMot, longueur, son]…]). */
export function sonsParMot(marques, mots) {
  const parMot = new Map()
  let k = 0
  for (const [debut, longueur, id] of marques) {
    while (k < mots.length && mots[k].fin <= debut) k++
    const mot = mots[k]
    if (!mot || debut < mot.debut || debut + longueur > mot.fin) continue
    if (!parMot.has(mot.index)) parMot.set(mot.index, [])
    parMot.get(mot.index).push([debut - mot.debut, longueur, id])
  }
  return parMot
}
