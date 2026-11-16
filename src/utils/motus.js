// =============================================================
//  MOTUS — logique du jeu (copie du MOTUS de Padel Manager,
//  version « langue française » : tous les noms communs, adjectifs
//  et verbes de 5 à 12 lettres).
//
//  • Mots à deviner : public/motus/cibles.txt (≈ 28 000 mots, tirés
//    de la base lexicale Lexique 3 et vérifiés dans le dictionnaire).
//    Une ligne par mot : « orthographe(s) accentuée(s);natures »
//    ex. « école;N », « rouge;AN » (N = nom, A = adjectif, V = verbe,
//    la plus fréquente d'abord).
//  • Mots acceptés : public/motus/dico/ (≈ 260 000 formes, pluriels et
//    conjugaisons compris), un petit fichier par 1re lettre + longueur.
//  • Définition affichée en fin de partie : Wiktionnaire.
// =============================================================

export const MOTUS_ESSAIS_MAX = 6
export const MOTUS_LONGUEUR_MIN = 5
export const MOTUS_LONGUEUR_MAX = 12

export const MOTUS_CATEGORIES = {
  N: '🏷️ Nom commun',
  A: '🎨 Adjectif',
  V: '⚡ Verbe',
}

// Texte de la catégorie affiché sous l'en-tête (ex. « 🎨 Adjectif / Nom commun »)
export function libelleCategorie(entree) {
  if (!entree) return ''
  const [premiere, ...autres] = entree.categories
  const noms = { N: 'Nom commun', A: 'Adjectif', V: 'Verbe' }
  return [MOTUS_CATEGORIES[premiere], ...autres.map((c) => noms[c])].filter(Boolean).join(' / ')
}

// Majuscules A–Z sans accents (é → E, œ → OE)
export function normaliser(texte) {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/Œ/g, 'OE')
    .replace(/Æ/g, 'AE')
}

// ── LEXIQUE des mots à deviner (chargé une fois, gardé en mémoire) ──────
let lexiquePromesse = null

export function chargerLexique() {
  if (!lexiquePromesse) {
    lexiquePromesse = fetch('/motus/cibles.txt')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.text()
      })
      .then((texte) => {
        if (texte.trimStart().startsWith('<')) throw new Error('Lexique introuvable')
        const liste = []
        const index = new Map()
        for (const ligne of texte.split('\n')) {
          if (!ligne) continue
          const [orthos, cats] = ligne.split(';')
          const orthographes = orthos.split(',')
          const mot = normaliser(orthographes[0])
          const valide =
            /^[A-Z]+$/.test(mot) && mot.length >= MOTUS_LONGUEUR_MIN && mot.length <= MOTUS_LONGUEUR_MAX
          if (!valide || index.has(mot)) continue
          const entree = { mot, orthographes, categories: (cats || 'N').split('') }
          liste.push(entree)
          index.set(mot, entree)
        }
        return { liste, index }
      })
      .catch((e) => {
        lexiquePromesse = null // on retentera
        throw e
      })
  }
  return lexiquePromesse
}

// ── LOGIQUE ──────────────────────────────────────────────────────────────

// Évaluation d'une proposition (gestion correcte des lettres doubles) :
// 1er passage = lettres bien placées, 2e passage = lettres mal placées dans
// la limite des occurrences restantes. Renvoie un tableau de
// "bien" | "mal" | "absent".
export function evaluer(proposition, solution) {
  const n = solution.length
  const resultat = Array(n).fill('absent')
  const restantes = {}
  for (let i = 0; i < n; i++) {
    if (proposition[i] === solution[i]) resultat[i] = 'bien'
    else restantes[solution[i]] = (restantes[solution[i]] || 0) + 1
  }
  for (let i = 0; i < n; i++) {
    if (resultat[i] === 'bien') continue
    const l = proposition[i]
    if (restantes[l] > 0) {
      resultat[i] = 'mal'
      restantes[l]--
    }
  }
  return resultat
}

// DICTIONNAIRE de validation : un mot qui n'existe pas est refusé à la
// validation (bandeau "pas dans le dictionnaire", aucun essai consommé).
// Fichiers statiques découpés par 1re lettre et longueur (ex. "A12.txt")
// servis par Vercel : on ne télécharge que le petit fichier utile au mot
// en cours — aucune lecture Firebase.
export const DICO_URL = '/motus/dico'
const dictionnaires = new Map()

export function chargerDictionnaire(premiereLettre, longueur) {
  const cle = `${premiereLettre}${longueur}`
  if (!dictionnaires.has(cle)) {
    const promesse = fetch(`${DICO_URL}/${cle}.txt`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.text()
      })
      .then((texte) => {
        // Fichier absent : le site renvoie sa page d'accueil à la place
        if (texte.trimStart().startsWith('<')) throw new Error('Dictionnaire introuvable')
        return new Set(texte.split('\n').filter(Boolean))
      })
      .catch((e) => {
        dictionnaires.delete(cle) // on retentera au prochain essai
        throw e
      })
    dictionnaires.set(cle, promesse)
  }
  return dictionnaires.get(cle)
}

// Une proposition est-elle acceptée ? Bonne longueur, bonne 1re lettre et
// mot existant (lexique ou dictionnaire). Si le dictionnaire n'a pas pu
// être chargé (pas de réseau), on n'empêche pas de jouer.
export async function propositionValide(proposition, solution, indexLexique) {
  if (proposition.length !== solution.length) return { ok: false, raison: 'Mot trop court' }
  if (proposition[0] !== solution[0]) return { ok: false, raison: 'Mauvaise première lettre' }
  if (indexLexique?.has(proposition)) return { ok: true }
  try {
    const dico = await chargerDictionnaire(solution[0], solution.length)
    if (!dico.has(proposition)) return { ok: false, raison: "Ce mot n'est pas dans le dictionnaire" }
  } catch {
    // dictionnaire indisponible : proposition acceptée
  }
  return { ok: true }
}

// Tire un mot au hasard parmi ceux que le joueur n'a pas encore eus ;
// repart de zéro quand tout le lexique y est passé. Renvoie aussi la
// nouvelle liste des mots joués.
export function tirerMot(liste, motsJoues = [], exclure = null) {
  const dejaJoues = new Set(motsJoues)
  let pool = liste.filter((e) => !dejaJoues.has(e.mot))
  let jouees = motsJoues
  if (pool.length === 0) {
    pool = liste.filter((e) => e.mot !== exclure)
    jouees = []
  }
  const choisi = pool[Math.floor(Math.random() * pool.length)].mot
  return { mot: choisi, motsJoues: [...jouees, choisi] }
}

export function nouvellePartie(mot) {
  return { mot, essais: [], termine: false, gagne: false, debut: null, fin: null, definition: null }
}

// Lettres bien placées déjà connues (pour les pré-afficher sur la ligne en
// cours) : 1re lettre + lettres vertes des essais précédents.
export function lettresConnues(solution, essais) {
  const connues = Array(solution.length).fill(null)
  connues[0] = solution[0]
  for (const essai of essais) {
    evaluer(essai, solution).forEach((etat, i) => {
      if (etat === 'bien') connues[i] = solution[i]
    })
  }
  return connues
}

// État des touches du clavier : priorité bien > mal > absent (une touche
// verte ne redevient jamais jaune).
export function etatClavier(solution, essais) {
  const rang = { absent: 1, mal: 2, bien: 3 }
  const etats = {}
  for (const essai of essais) {
    evaluer(essai, solution).forEach((etat, i) => {
      const l = essai[i]
      if (!etats[l] || rang[etat] > rang[etats[l]]) etats[l] = etat
    })
  }
  return etats
}

export const STATS_VIDES = {
  jouees: 0,
  gagnees: 0,
  serieActuelle: 0,
  meilleureSerie: 0,
  distribution: [0, 0, 0, 0, 0, 0],
  defaites: 0,
  lettresVertes: 0,
  lettresJaunes: 0,
  lettresBleues: 0,
}

export const PARAMETRES_DEFAUT = {
  volume: 'coupe', // coupe | faible | normal
  clavier: 'azerty', // azerty | qwerty
  theme: 'sombre', // sombre | clair
  haptique: true,
  afficherTemps: true,
  daltonien: false,
}

// Nouvelles statistiques après une partie terminée (toutes les parties
// comptent : il n'y a pas de "mode entraînement" à part).
export function statsApresPartie(stats, partie) {
  const s = {
    ...STATS_VIDES,
    ...stats,
    distribution: [...(stats?.distribution || STATS_VIDES.distribution)],
  }
  s.jouees += 1
  if (partie.gagne) {
    s.gagnees += 1
    s.distribution[partie.essais.length - 1] += 1
    s.serieActuelle += 1
    s.meilleureSerie = Math.max(s.meilleureSerie, s.serieActuelle)
  } else {
    s.defaites += 1
    s.serieActuelle = 0
  }
  for (const essai of partie.essais) {
    for (const etat of evaluer(essai, partie.mot)) {
      if (etat === 'bien') s.lettresVertes += 1
      else if (etat === 'mal') s.lettresJaunes += 1
      else s.lettresBleues += 1
    }
  }
  return s
}

// Moyenne de coups sur les parties gagnées (format français "4,33").
export function moyenneCoups(stats) {
  if (!stats?.gagnees) return '–'
  const total = stats.distribution.reduce((acc, nb, i) => acc + nb * (i + 1), 0)
  return (total / stats.gagnees).toFixed(2).replace('.', ',')
}

// Texte de partage d'une partie (ne contient JAMAIS le mot).
export function textePartagePartie(partie, numero, { daltonien, afficherTemps } = {}) {
  const emoji = daltonien
    ? { bien: '🟠', mal: '🔵', absent: '🟦' }
    : { bien: '🟢', mal: '🟡', absent: '🟦' }
  const score = partie.gagne ? `${partie.essais.length}/6` : 'X/6'
  let entete = `🔤 MOTUS #${numero} ${score}`
  if (afficherTemps && partie.debut && partie.fin) entete += ` ⏱️ ${formaterDuree(partie.fin - partie.debut)}`
  const lignes = partie.essais.map((essai) =>
    evaluer(essai, partie.mot)
      .map((e) => emoji[e])
      .join('')
  )
  return [entete, ...lignes].join('\n')
}

export function textePartageStats(stats) {
  const pct = stats.jouees ? Math.round((stats.gagnees / stats.jouees) * 100) : 0
  const max = Math.max(1, ...stats.distribution, stats.defaites)
  const barre = (nb) => '🟩'.repeat(Math.round((nb / max) * 8)) || '▫️'
  const lignes = stats.distribution.map((nb, i) => `${i + 1} ${barre(nb)} ${nb}`)
  lignes.push(`- ${barre(stats.defaites)} ${stats.defaites}`)
  return [
    '🔤 MOTUS — mes stats',
    `Parties : ${stats.jouees} · Victoires : ${pct} %`,
    `Moyenne : ${moyenneCoups(stats)} coups · Meilleure série : ${stats.meilleureSerie}`,
    ...lignes,
  ].join('\n')
}

export function formaterDuree(ms) {
  const total = Math.max(0, Math.round(ms / 1000))
  const min = Math.floor(total / 60)
  const sec = total % 60
  return `${min}:${String(sec).padStart(2, '0')}`
}

// ── DÉFINITION (Wiktionnaire, en fin de partie) ─────────────────────────
// On lit la page du mot sur fr.wiktionary.org et on garde les premières
// définitions de la section « Français » qui correspondent à la nature du
// mot (nom commun, adjectif, verbe). Renvoie null si rien n'est trouvé.
const TITRES_NATURE = [
  { cat: 'N', re: /^\s*Nom commun/i },
  { cat: 'A', re: /^\s*Adjectif/i },
  { cat: 'V', re: /^\s*Verbe/i },
]

export function lienWiktionnaire(titre) {
  return `https://fr.wiktionary.org/wiki/${encodeURIComponent(titre)}`
}

function extraireDefinitions(html, categories) {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const parCat = { N: [], A: [], V: [] }
  let francais = false
  let nature = null
  for (const el of doc.querySelectorAll('h2, h3, ol')) {
    if (el.tagName === 'H2') {
      francais = /Français/.test(el.textContent)
      nature = null
    } else if (el.tagName === 'H3') {
      const texte = el.textContent.replace(/\[.*?\]/g, '')
      nature = TITRES_NATURE.find((t) => t.re.test(texte))?.cat || null
    } else if (francais && nature && el.parentElement?.tagName !== 'LI') {
      for (const li of el.children) {
        if (li.tagName !== 'LI') continue
        const copie = li.cloneNode(true)
        copie.querySelectorAll('ul, ol, dl, sup, style, .reference').forEach((n) => n.remove())
        const texte = copie.textContent.replace(/\s+/g, ' ').trim()
        if (texte.length > 1) parCat[nature].push(texte)
      }
    }
  }
  const ordre = [...categories, ...['N', 'A', 'V'].filter((c) => !categories.includes(c))]
  const definitions = []
  for (const c of ordre) {
    for (const d of parCat[c].slice(0, 2)) {
      if (definitions.length < 3) definitions.push(d)
    }
  }
  return definitions
}

export async function chercherDefinition(entree) {
  for (const titre of entree.orthographes) {
    const url =
      'https://fr.wiktionary.org/w/api.php?action=parse&format=json&formatversion=2&origin=*' +
      `&prop=text&redirects=1&disabletoc=1&disableeditsection=1&disablelimitreport=1&page=${encodeURIComponent(titre)}`
    const r = await fetch(url)
    if (!r.ok) continue
    const json = await r.json()
    if (json.error || !json.parse?.text) continue
    const definitions = extraireDefinitions(json.parse.text, entree.categories)
    if (definitions.length) return { titre, definitions }
  }
  return null
}
