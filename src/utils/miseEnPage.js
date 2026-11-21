// =============================================================
//  Appli « Lis-moi » : garder la mise en page du texte (Max, 21/11/2026)
//  Le texte reste une simple chaîne (enregistrée telle quelle dans Firebase),
//  avec quelques marques faciles à corriger dans « Corriger tout » :
//    - une ligne vide            = nouveau paragraphe
//    - un retour à la ligne      = nouvelle ligne (liste, réplique, vers…)
//    - « # Titre », « ## Sous-titre » (le « # » n'est ni affiché ni lu)
//    - « • élément », « 1. … »   = liste (puce ou numéro gardés)
//    - « — Réplique », « - … »   = tiret de dialogue (gardé, non lu)
//    - « ^^ ligne » = centrée, « >> ligne » = à droite (le justifié est
//      toujours affiché à gauche : plus facile à lire, décision de Max)
//    - « **gras** », « *italique* », « __souligné__ » (marques ni affichées ni lues)
//  Les lignes coupées par la largeur de la page sont recollées.
//  Sources : photo (positions et hauteurs des lignes données par Tesseract),
//  PDF (police, positions), Word (styles du fichier), .txt.
// =============================================================

const PUCES = '•●▪◦■□➢►▶✓✔*·'
const RE_ALIGN = /^\s*(\^\^|>>)\s+/
const RE_TITRE = /^\s*(#+)\s+/
const RE_PUCE = new RegExp(`^\\s*[${PUCES}]\\s+`, 'u')
const RE_NUMERO = /^\s*(?:\d{1,2}[.)]|[a-z]\))\s+/
const RE_TIRET = /^\s*[-–—]\s*(?=\S)/

/**
 * Type d'une ligne du texte :
 * { type: 'titre' | 'liste' | 'tiret' | 'texte', marque: fin des marques du début,
 *   align: 'gauche' | 'centre' | 'droite', niveau: 1 | 2 (titres), debutMarque: début de « # », puce… }
 */
export function typeLigne(ligne) {
  let pos = 0
  let align = 'gauche'
  const a = RE_ALIGN.exec(ligne)
  if (a) {
    align = a[1] === '^^' ? 'centre' : 'droite'
    pos = a[0].length
  }
  const reste = ligne.slice(pos)
  let m
  if ((m = RE_TITRE.exec(reste))) return { type: 'titre', marque: pos + m[0].length, debutMarque: pos, align, niveau: m[1].length > 1 ? 2 : 1 }
  if ((m = RE_PUCE.exec(reste)) || (m = RE_NUMERO.exec(reste))) return { type: 'liste', marque: pos + m[0].length, debutMarque: pos, align, niveau: 0 }
  if ((m = RE_TIRET.exec(reste))) return { type: 'tiret', marque: pos + m[0].length, debutMarque: pos, align, niveau: 0 }
  return { type: 'texte', marque: pos, debutMarque: pos, align, niveau: 0 }
}

// ---------- Gras, italique, souligné ----------
// Chaque marque doit toucher le texte (« **mot** », pas « ** mot ** ») :
// ainsi « Prénom : ______ » ou « 3 * 4 » ne sont jamais pris pour des marques.
const STYLES = [
  { re: /\*\*(?=[^\s*])([\s\S]*?[^\s*])\*\*/g, bit: 1, n: 2 }, // gras
  { re: /__(?=[^\s_])([\s\S]*?[^\s_])__/g, bit: 4, n: 2 }, // souligné
  { re: /\*(?=[^\s*])([\s\S]*?[^\s*])\*/g, bit: 2, n: 1 }, // italique
]
export const GRAS = 1
export const ITALIQUE = 2
export const SOULIGNE = 4

/** Pour une ligne : quelles lettres sont des marques (cachées) et quel style a chaque lettre. */
export function stylesLigne(ligne) {
  const n = ligne.length
  const cache = new Uint8Array(n)
  const style = new Uint8Array(n)
  let travail = ligne
  for (const { re, bit, n: lg } of STYLES) {
    re.lastIndex = 0
    let m
    const trouves = []
    while ((m = re.exec(travail))) trouves.push([m.index, m[0].length])
    for (const [d, l] of trouves) {
      for (let k = d; k < d + lg; k++) cache[k] = 1
      for (let k = d + l - lg; k < d + l; k++) cache[k] = 1
      for (let k = d + lg; k < d + l - lg; k++) style[k] |= bit
      // marques déjà vues remplacées (même longueur) pour ne pas les relire
      travail = travail.slice(0, d) + '\0'.repeat(lg) + travail.slice(d + lg, d + l - lg) + '\0'.repeat(lg) + travail.slice(d + l)
    }
  }
  return { cache, style }
}

/** Le texte sans aucune marque (pour le nom de la lecture, les tests de forme…). */
export function sansMarques(texte) {
  return (texte || '')
    .split('\n')
    .map((l) => {
      const { cache } = stylesLigne(l)
      return [...l].filter((_, k) => !cache[k]).join('')
    })
    .join('\n')
    .replace(/^\s*(?:\^\^|>>)\s+/gm, '')
    .replace(/^\s*#+\s+/gm, '')
}

const ligneSpeciale = (t) => typeLigne(t).type !== 'texte'
const nbMots = (t) => (t.match(/[\p{L}\p{N}]+/gu) || []).length
const mediane = (v) => {
  const s = v.filter((x) => x > 0).sort((a, b) => a - b)
  return s.length ? s[s.length >> 1] : 0
}
const nu = (t) => sansMarques(t).trim()

/** Nettoie une ligne reconnue (caractères parasites, espaces). */
export function nettoyerLigne(t) {
  return (t || '')
    .replace(/\r|\n/g, ' ')
    .replace(/[|¦~^`]+/g, ' ')
    .replace(/_+/g, (u) => (u.length >= 3 ? u : ' ')) // garde « ______ » (ligne à compléter)
    .replace(/[ \t ]+/g, ' ')
    .replace(/ ([,.])/g, '$1')
    .trim()
}

/** Titre probable par sa forme : court, sans ponctuation finale, commence par une majuscule. */
const formeDeTitre = (texte) => {
  const t = nu(texte)
  return nbMots(t) > 0 && nbMots(t) <= 10 && t.length <= 70 && !/[.,;:!?…»”"]$/.test(t) && /^[\p{Lu}\p{N}«"]/u.test(t)
}

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
  if (paras.length > 1 && paras[0].length === 1 && !ligneSpeciale(paras[0][0].texte) && formeDeTitre(paras[0][0].texte) && nbMots(nu(paras[0][0].texte)) <= 8) {
    paras[0][0].titre = true
  }
  // Niveau des titres : le plus grand = titre, les autres (nettement plus petits) = sous-titres
  const titres = toutes.filter((l) => l.titre)
  const hMax = Math.max(0, ...titres.map((l) => l.h || 0))
  for (const l of titres) l.niveau = l.niveau || (hMax && l.h && l.h < hMax * 0.9 ? 2 : 1)

  // Alignement (photo, PDF) : centré ou à droite par rapport à la zone du texte
  const gauche = Math.min(...toutes.map((l) => l.x0 ?? Infinity))
  const droite = Math.max(...toutes.map((l) => l.x1 ?? -Infinity))
  const zone = droite - gauche
  const alignDe = (l) => {
    if (l.align) return l.align
    if (l.x0 === undefined || !(zone > 0)) return 'gauche'
    const mg = l.x0 - gauche
    const md = droite - l.x1
    if (l.x1 - l.x0 > zone * 0.85) return 'gauche' // ligne pleine (ou justifiée) : à gauche
    if (mg > zone * 0.1 && md > zone * 0.1 && Math.abs(mg - md) < zone * 0.08) return 'centre'
    if (md < zone * 0.03 && mg > zone * 0.3) return 'droite'
    return 'gauche'
  }
  const prefixe = (align) => (align === 'centre' ? '^^ ' : align === 'droite' ? '>> ' : '')

  const blocs = [] // chaque bloc = lignes séparées par « \n » ; les blocs par une ligne vide
  for (const p of paras) {
    const x0min = Math.min(...p.map((l) => l.x0 ?? Infinity))
    const largeurPara = Math.max(...p.map((l) => (l.x1 ?? 0) - (l.x0 ?? 0)))
    const largeurRef = Math.max(largeurPara, largeurPage || 0)
    const longueurRef = Math.max(...p.map((l) => l.texte.length), longueurPage || 0)
    let bloc = []
    let courante = null // { texte, aligns: [] }
    const finirLigne = () => {
      if (courante) {
        const aligns = new Set(courante.aligns)
        const align = aligns.size === 1 && !ligneSpeciale(courante.texte) ? [...aligns][0] : 'gauche'
        bloc.push(prefixe(align) + courante.texte)
      }
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
        // un titre est déjà en gras : marques de gras retirées
        const t = l.texte.replace(RE_TITRE, '').replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, '$1')
        blocs.push([prefixe(alignDe(l)) + '#'.repeat(l.niveau) + ' ' + t])
        return
      }
      const prec = i > 0 && !p[i - 1].titre ? p[i - 1] : null
      let nouvelle = !prec || courante === null || ligneSpeciale(l.texte)
      if (!nouvelle && prec) {
        // dernière ligne (courte) d'un paragraphe : la suite commence une nouvelle ligne
        const largeur = prec.x1 !== undefined ? (prec.x1 - prec.x0) / (largeurRef || 1) : prec.texte.length / (longueurRef || 1)
        if (/[.!?…»”":]$/.test(nu(prec.texte)) && largeur < 0.72) nouvelle = true
        // retrait au début de la ligne (alinéa)
        if (l.x0 !== undefined && corps && l.x0 - x0min > corps * 1.1 && /^[\p{Lu}«"]/u.test(nu(l.texte)) && alignDe(l) === 'gauche') nouvelle = true
        // changement d'alignement (ex. date à droite, ligne centrée)
        if (alignDe(l) !== alignDe(prec)) nouvelle = true
      }
      if (nouvelle) {
        finirLigne()
        courante = { texte: l.texte, aligns: [alignDe(l)] }
      } else if (/\p{L}[-‐‑]$/u.test(courante.texte) && /^\p{Ll}/u.test(l.texte)) {
        courante.texte = courante.texte.slice(0, -1) + l.texte // « mai- / son » → « maison »
        courante.aligns.push(alignDe(l))
      } else {
        courante.texte += ' ' + l.texte
        courante.aligns.push(alignDe(l))
      }
    })
    finirBloc()
  }
  return blocs
    .map((b) => b.join('\n'))
    .join('\n\n')
    .replace(/\*\*([ ]?)\*\*/g, '$1') // « **a** **b** » → « **a b** »
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
    const t = nettoyerLigne(l.texte)
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

// ---------- Suite de morceaux stylés → texte avec marques ----------
// segments = [{ texte, g, i, s }] (gras, italique, souligné)
function texteStyle(segments) {
  // les espaces prennent le style de leurs voisins (pour ne pas couper « **le loup** »)
  const fusion = []
  for (const seg of segments) {
    if (!seg.texte) continue
    const der = fusion[fusion.length - 1]
    const memeStyle = der && der.g === seg.g && der.i === seg.i && der.s === seg.s
    if (der && seg.texte !== '\n' && der.texte !== '\n' && (memeStyle || !seg.texte.trim())) der.texte += seg.texte
    else if (der && der.texte !== '\n' && seg.texte !== '\n' && !der.texte.trim()) Object.assign(der, { texte: der.texte + seg.texte, g: seg.g, i: seg.i, s: seg.s })
    else fusion.push({ ...seg })
  }
  return fusion
    .map(({ texte, g, i, s }) => {
      const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(texte)
      if (!m[2] || !/[\p{L}\p{N}]/u.test(m[2])) return texte
      let c = m[2]
      if (i) c = `*${c}*`
      if (s) c = `__${c}__`
      if (g) c = `**${c}**`
      return m[1] + c + m[3]
    })
    .join('')
}

// ---------- PDF : morceaux de texte positionnés (pdf.js) ----------
// police(fontName) → { gras, italique } (facultatif)
export function texteDepuisPdf(items, police = () => ({})) {
  const lignes = []
  let ligne = null
  for (const it of items) {
    if (typeof it.str !== 'string') continue
    const [a, b, , d, x, y] = it.transform
    const h = Math.abs(d) || Math.hypot(a, b) || it.height || 10
    if (it.str === '') continue
    const { gras = false, italique = false } = police(it.fontName) || {}
    const seg = { texte: it.str, g: gras, i: italique, s: false }
    if (ligne && Math.abs(y - ligne.y) <= Math.max(h, ligne.h) * 0.5) {
      const espace = x - ligne.x1 > h * 0.15 && !/\s$/.test(ligne.segs.at(-1).texte) && !/^\s/.test(it.str)
      if (espace) ligne.segs.push({ texte: ' ', g: false, i: false, s: false })
      ligne.segs.push(seg)
      ligne.x1 = Math.max(ligne.x1, x + (it.width || 0))
      ligne.h = Math.max(ligne.h, h)
    } else {
      ligne = { segs: [seg], x0: x, x1: x + (it.width || 0), y, h }
      lignes.push(ligne)
    }
  }
  for (const l of lignes) l.texte = texteStyle(l.segs)
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

// ---------- Word : HTML produit par mammoth (titres, listes, styles, alignement) ----------
// L'alignement est glissé au début du paragraphe par lireWord :  = centré,  = à droite.
export const MARQUE_CENTRE = ''
export const MARQUE_DROITE = ''

export function texteDepuisHtmlWord(html) {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
  const blocs = [] // { lignes: [..], serre: bool } — « serre » : liste / répliques collées

  // Texte d'un élément avec ses styles, sans ses sous-listes ; retours à la ligne gardés
  const segmentsDe = (el) => {
    const segs = []
    const parcourir = (n, g, i, s) => {
      for (const c of n.childNodes) {
        if (c.nodeType === 3) segs.push({ texte: c.nodeValue.replace(/[ \t \r\n]+/g, ' '), g, i, s })
        else if (c.nodeType === 1) {
          const t = c.tagName
          if (t === 'UL' || t === 'OL') continue
          if (t === 'BR') segs.push({ texte: '\n', g: false, i: false, s: false })
          else parcourir(c, g || t === 'STRONG' || t === 'B', i || t === 'EM' || t === 'I', s || t === 'U')
        }
      }
    }
    parcourir(el, false, false, false)
    return segs
  }
  const ligneDe = (el) => {
    const segs = segmentsDe(el)
    let align = 'gauche'
    for (const s of segs) {
      if (s.texte.includes(MARQUE_CENTRE)) align = 'centre'
      if (s.texte.includes(MARQUE_DROITE)) align = 'droite'
      s.texte = s.texte.replace(/[]/g, '')
    }
    const visibles = segs.filter((s) => s.texte.trim())
    const toutGras = visibles.length > 0 && visibles.every((s) => s.g)
    return { texte: texteStyle(segs), brut: segs.map((s) => s.texte).join(''), align, toutGras }
  }
  const prefixe = (align) => (align === 'centre' ? '^^ ' : align === 'droite' ? '>> ' : '')
  const ajouter = (texte, serre = false) => {
    const lignes = texte
      .split('\n')
      .map((l) => l.replace(/[ \t]+/g, ' ').trim())
      .filter((l) => /[\p{L}\p{N}_]/u.test(l))
    if (!lignes.length) return
    const dernier = blocs[blocs.length - 1]
    if (serre && dernier?.serre) dernier.lignes.push(...lignes)
    else blocs.push({ lignes, serre })
  }
  const titre = (l, niveau) => ajouter(prefixe(l.align) + '#'.repeat(niveau) + ' ' + l.brut.replace(/\s+/g, ' ').trim())
  const liste = (el) => {
    let n = 0
    for (const li of el.children) {
      if (li.tagName !== 'LI') continue
      n++
      const l = ligneDe(li)
      ajouter((el.tagName === 'OL' ? `${n}. ` : '• ') + l.texte.replace(/\n/g, ' ').trim(), true)
      li.querySelectorAll(':scope > ul, :scope > ol').forEach(liste)
    }
  }
  const parcourir = (parent) => {
    for (const el of parent.children) {
      const tag = el.tagName
      if (/^H[1-6]$/.test(tag)) titre(ligneDe(el), tag === 'H1' ? 1 : 2)
      else if (tag === 'UL' || tag === 'OL') liste(el)
      else if (tag === 'TABLE') el.querySelectorAll('td,th').forEach((c) => parcourir(c.children.length ? c : { children: [c] }))
      else if (tag === 'P' || tag === 'TD' || tag === 'TH') {
        const l = ligneDe(el)
        const t = l.brut.trim()
        if (!t) continue
        // paragraphe court entièrement en gras = titre (souvent fait à la main dans Word)
        if (l.toutGras && formeDeTitre(t) && !l.brut.includes('\n')) titre(l, blocs.length === 0 ? 1 : 2)
        else
          ajouter(
            l.texte
              .split('\n')
              .map((x) => prefixe(l.align) + x.trim())
              .join('\n'),
            ligneSpeciale(t)
          )
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
    for (const l of groupe
      .split('\n')
      .map((x) => x.replace(/[ \t ]+/g, ' ').trim())
      .filter(Boolean)) {
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
