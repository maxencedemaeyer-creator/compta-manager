// =============================================================
//  Appli « Lis-moi » : garder la mise en page du texte (Max, 21/11/2026)
//  Le texte reste une simple chaîne (enregistrée telle quelle dans Firebase),
//  avec quelques conventions faciles à corriger dans « Corriger tout » :
//    - une ligne vide            = nouveau paragraphe
//    - un retour à la ligne      = nouvelle ligne (liste, réplique, vers…)
//    - « # Titre »               = titre (le « # » n'est ni affiché ni lu)
//    - « • élément », « 1. … »   = liste (puce ou numéro gardés)
//    - « — Réplique », « - … »   = tiret de dialogue (gardé, non lu)
//  Les lignes coupées par la largeur de la page sont recollées.
//  Sources : photo (positions et hauteurs des lignes données par Tesseract),
//  PDF (taille de la police, positions), Word (titres et listes du fichier), .txt.
// =============================================================

const PUCES = '•●▪◦■□➢►▶✓✔*·'
const RE_TITRE = /^\s*#+\s+/
const RE_PUCE = new RegExp(`^\\s*[${PUCES}]\\s+`, 'u')
const RE_NUMERO = /^\s*(?:\d{1,2}[.)]|[a-z]\))\s+/
const RE_TIRET = /^\s*[-–—]\s*(?=\S)/

/** Type d'une ligne du texte : { type: 'titre' | 'liste' | 'tiret' | 'texte', marque: longueur du marqueur } */
export function typeLigne(ligne) {
  let m
  if ((m = RE_TITRE.exec(ligne))) return { type: 'titre', marque: m[0].length }
  if ((m = RE_PUCE.exec(ligne)) || (m = RE_NUMERO.exec(ligne))) return { type: 'liste', marque: m[0].length }
  if ((m = RE_TIRET.exec(ligne))) return { type: 'tiret', marque: m[0].length }
  return { type: 'texte', marque: 0 }
}

const ligneSpeciale = (t) => typeLigne(t).type !== 'texte'
const nbMots = (t) => (t.match(/[\p{L}\p{N}]+/gu) || []).length
const mediane = (v) => {
  const s = v.filter((x) => x > 0).sort((a, b) => a - b)
  return s.length ? s[s.length >> 1] : 0
}

/** Nettoie une ligne reconnue (caractères parasites, espaces). */
export function nettoyerLigne(t) {
  return (t || '')
    .replace(/\r|\n/g, ' ')
    .replace(/[|¦_~^`]+/g, ' ')
    .replace(/[ \t ]+/g, ' ')
    .replace(/ ([,.])/g, '$1')
    .trim()
}

/** Titre probable par sa forme : court, sans ponctuation finale, commence par une majuscule. */
const formeDeTitre = (t) =>
  nbMots(t) > 0 && nbMots(t) <= 10 && t.length <= 70 && !/[.,;:!?…»”"]$/.test(t) && /^[\p{Lu}\p{N}«"]/u.test(t)

/**
 * Compose le texte à partir de paragraphes de lignes.
 * paras = [[{ texte, x0?, x1?, h?, titre? }, …], …]
 * x0/x1 (positions) et h (hauteur) sont facultatifs (photo et PDF seulement).
 */
export function composer(paras) {
  // lignes sans lettre ni chiffre (taches, traits) : ignorées
  paras = paras
    .map((p) => p.map((l) => ({ ...l, texte: nettoyerLigne(l.texte) })).filter((l) => /[\p{L}\p{N}]/u.test(l.texte)))
    .filter((p) => p.length)
  if (!paras.length) return ''
  const toutes = paras.flat()
  // hauteur du texte courant : médiane des lignes « normales » (4 mots ou plus)
  const corps = mediane(toutes.filter((l) => nbMots(l.texte) >= 4).map((l) => l.h || 0)) || mediane(toutes.map((l) => l.h || 0))
  const largeurPage = mediane(toutes.filter((l) => nbMots(l.texte) >= 6).map((l) => (l.x1 ?? 0) - (l.x0 ?? 0)))
  const longueurPage = mediane(toutes.filter((l) => nbMots(l.texte) >= 6).map((l) => l.texte.length))

  for (const l of toutes) {
    if (l.titre !== undefined) continue
    if (RE_TITRE.test(l.texte)) l.titre = true
    else l.titre = !!(corps && l.h && l.h > corps * 1.3 && formeDeTitre(l.texte))
  }
  // Premier paragraphe d'une seule ligne courte (sans point), suivi d'autre chose : c'est le titre
  if (paras.length > 1 && paras[0].length === 1 && !ligneSpeciale(paras[0][0].texte) && formeDeTitre(paras[0][0].texte) && nbMots(paras[0][0].texte) <= 8) {
    paras[0][0].titre = true
  }

  const blocs = [] // chaque bloc = lignes séparées par « \n » ; les blocs par une ligne vide
  for (const p of paras) {
    const x0min = Math.min(...p.map((l) => l.x0 ?? Infinity))
    const largeurPara = Math.max(...p.map((l) => (l.x1 ?? 0) - (l.x0 ?? 0)))
    const largeurRef = Math.max(largeurPara, largeurPage || 0)
    const longueurRef = Math.max(...p.map((l) => l.texte.length), longueurPage || 0)
    let bloc = []
    let courante = null
    const finirLigne = () => {
      if (courante !== null) bloc.push(courante)
      courante = null
    }
    const finirBloc = () => {
      finirLigne()
      if (bloc.length) blocs.push(bloc)
      bloc = []
    }
    p.forEach((l, i) => {
      if (l.titre) {
        finirBloc()
        blocs.push(['# ' + l.texte.replace(RE_TITRE, '')])
        return
      }
      const prec = i > 0 && !p[i - 1].titre ? p[i - 1] : null
      let nouvelle = !prec || courante === null || ligneSpeciale(l.texte)
      if (!nouvelle && prec) {
        // dernière ligne (courte) d'un paragraphe : la suite commence une nouvelle ligne
        const largeur = prec.x1 !== undefined ? (prec.x1 - prec.x0) / (largeurRef || 1) : prec.texte.length / (longueurRef || 1)
        if (/[.!?…»”":]$/.test(prec.texte) && largeur < 0.72) nouvelle = true
        // retrait au début de la ligne (alinéa)
        if (l.x0 !== undefined && corps && l.x0 - x0min > corps * 1.1 && /^[\p{Lu}«"]/u.test(l.texte)) nouvelle = true
      }
      if (nouvelle) {
        finirLigne()
        courante = l.texte
      } else if (/\p{L}[-‐‑]$/u.test(courante) && /^\p{Ll}/u.test(l.texte)) {
        courante = courante.slice(0, -1) + l.texte // « mai- / son » → « maison »
      } else {
        courante += ' ' + l.texte
      }
    })
    finirBloc()
  }
  return blocs.map((b) => b.join('\n')).join('\n\n')
}

// ---------- Photo : résultat détaillé de Tesseract (blocs → paragraphes → lignes) ----------
export function texteDepuisOcr(data) {
  const paras = []
  for (const bloc of data?.blocks || [])
    for (const para of bloc.paragraphs || []) {
      const lignes = (para.lines || []).map((l) => {
        const b = l.bbox || {}
        // hauteur : médiane des mots (plus stable que la boîte de la ligne)
        const h = mediane((l.words || []).filter((w) => /\p{L}/u.test(w.text || '')).map((w) => w.bbox.y1 - w.bbox.y0)) || b.y1 - b.y0
        return { texte: l.text, x0: b.x0, x1: b.x1, h }
      })
      if (lignes.length) paras.push(lignes)
    }
  retrouverPuces(paras.flat())
  return composer(paras)
}

// La puce « • » est souvent lue « e », « o », « © »… et parfois « « » : on la retrouve.
const FAUSSE_PUCE = /^\s*(?:[eoc©®°·]|«|»)\s+(?=[\p{Lu}\p{Ll}])/u
function retrouverPuces(lignes) {
  const candidat = lignes.map((l) => {
    const t = nettoyerLigne(l.text ?? l.texte)
    const m = FAUSSE_PUCE.exec(t)
    if (!m) return 0
    const c = m[0].trim()
    if (c === '«' || c === '»') return /»/.test(t.slice(1)) ? 0 : 1 // guillemet non refermé : peut-être une puce
    return /^\s*[eoc]\s+\p{Ll}/u.test(t) ? 0 : 2 // « e » suivi d'une minuscule : sans doute un vrai mot
  })
  lignes.forEach((l, i) => {
    // sûr (2), ou guillemet douteux (1) avec une voisine qui est aussi une puce
    const voisin = (candidat[i - 1] || 0) > 0 || (candidat[i + 1] || 0) > 0
    if (candidat[i] === 2 || (candidat[i] === 1 && voisin)) l.texte = nettoyerLigne(l.texte).replace(FAUSSE_PUCE, '• ')
  })
}

// ---------- PDF : morceaux de texte positionnés (pdf.js) ----------
export function texteDepuisPdf(items) {
  const lignes = []
  let ligne = null
  for (const it of items) {
    if (typeof it.str !== 'string') continue
    const [a, b, , d, x, y] = it.transform
    const h = Math.abs(d) || Math.hypot(a, b) || it.height || 10
    if (it.str === '') continue
    if (ligne && Math.abs(y - ligne.y) <= Math.max(h, ligne.h) * 0.5) {
      const espace = x - ligne.x1 > h * 0.15 && !/\s$/.test(ligne.texte) && !/^\s/.test(it.str)
      ligne.texte += (espace ? ' ' : '') + it.str
      ligne.x1 = Math.max(ligne.x1, x + (it.width || 0))
      ligne.h = Math.max(ligne.h, h)
    } else {
      ligne = { texte: it.str, x0: x, x1: x + (it.width || 0), y, h }
      lignes.push(ligne)
    }
  }
  // paragraphes : grand écart vertical entre deux lignes
  const paras = []
  let p = []
  lignes.forEach((l, i) => {
    const prec = lignes[i - 1]
    if (prec && Math.abs(prec.y - l.y) > Math.max(l.h, prec.h) * 1.9) {
      paras.push(p)
      p = []
    }
    p.push(l)
  })
  if (p.length) paras.push(p)
  // titre = police nettement plus grande (seuil plus bas que pour une photo : la taille est exacte)
  const corps = mediane(lignes.filter((l) => nbMots(l.texte) >= 4).map((l) => l.h))
  for (const l of lignes) l.titre = !!(corps && l.h > corps * 1.18 && formeDeTitre(nettoyerLigne(l.texte)))
  return composer(paras)
}

// ---------- Word : HTML produit par mammoth (titres, listes, paragraphes) ----------
export function texteDepuisHtmlWord(html) {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
  const blocs = [] // { lignes: [..], serre: bool } — « serre » : liste / répliques collées
  const texteDe = (el) => {
    const copie = el.cloneNode(true)
    copie.querySelectorAll('ul,ol').forEach((n) => n.remove())
    copie.querySelectorAll('br').forEach((n) => n.replaceWith('\n'))
    return copie.textContent || ''
  }
  const ajouter = (ligne, serre = false) => {
    const lignes = ligne.split('\n').map(nettoyerLigne).filter(Boolean)
    if (!lignes.length) return
    const dernier = blocs[blocs.length - 1]
    if (serre && dernier?.serre) dernier.lignes.push(...lignes)
    else blocs.push({ lignes, serre })
  }
  const liste = (el) => {
    let n = 0
    for (const li of el.children) {
      if (li.tagName !== 'LI') continue
      n++
      ajouter((el.tagName === 'OL' ? `${n}. ` : '• ') + nettoyerLigne(texteDe(li)), true)
      li.querySelectorAll(':scope > ul, :scope > ol').forEach(liste)
    }
  }
  const parcourir = (parent) => {
    for (const el of parent.children) {
      const tag = el.tagName
      if (/^H[1-6]$/.test(tag)) ajouter('# ' + nettoyerLigne(texteDe(el)))
      else if (tag === 'UL' || tag === 'OL') liste(el)
      else if (tag === 'TABLE') el.querySelectorAll('td,th').forEach((c) => parcourir(c.children.length ? c : { children: [c] }))
      else if (tag === 'P' || tag === 'TD' || tag === 'TH') {
        const t = nettoyerLigne(texteDe(el))
        if (!t) continue
        // paragraphe court entièrement en gras = titre (souvent fait à la main dans Word)
        const gras = el.querySelector('strong') && nettoyerLigne([...el.querySelectorAll('strong')].map((s) => s.textContent).join(' ')) === t
        if (gras && formeDeTitre(t)) ajouter('# ' + t)
        else ajouter(texteDe(el), ligneSpeciale(t))
      } else parcourir(el)
    }
  }
  parcourir(doc.body)
  return blocs.map((b) => b.lignes.join('\n')).join('\n\n')
}

// ---------- Fichier .txt : chaque ligne est gardée ----------
export function texteDepuisTxt(brut) {
  const blocs = []
  for (const groupe of (brut || '').replace(/\r/g, '').split(/\n\s*\n+/)) {
    let bloc = null
    for (const l of groupe.split('\n').map(nettoyerLigne).filter(Boolean)) {
      const speciale = ligneSpeciale(l) && typeLigne(l).type !== 'titre'
      if (bloc && speciale && bloc.serre) bloc.lignes.push(l)
      else {
        bloc = { lignes: [l], serre: speciale }
        blocs.push(bloc)
      }
    }
  }
  // première ligne courte sans point, suivie d'autre chose : titre
  if (blocs.length > 1 && blocs[0].lignes.length === 1 && !ligneSpeciale(blocs[0].lignes[0]) && formeDeTitre(blocs[0].lignes[0]) && nbMots(blocs[0].lignes[0]) <= 8) {
    blocs[0].lignes[0] = '# ' + blocs[0].lignes[0]
  }
  return blocs.map((b) => b.lignes.join('\n')).join('\n\n')
}

/** Le texte sans les marqueurs de titre (pour le nom de la lecture, etc.) */
export function sansMarques(texte) {
  return (texte || '').replace(/^\s*#+\s+/gm, '')
}
