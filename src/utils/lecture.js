// =============================================================
//  Appli « Lis-moi » : traitement du texte (sans React ni Firebase)
//  - nettoyer le texte reconnu sur la photo
//  - le découper en mots (pour toucher / surligner)
//  - le découper en morceaux à envoyer à la voix
// =============================================================

// Nettoie le texte brut de la reconnaissance (Tesseract) :
// recolle les mots coupés en fin de ligne, refait des paragraphes,
// enlève les caractères parasites.
export function nettoyerTexte(brut) {
  let t = (brut || '').replace(/\r/g, '')
  t = t.replace(/[|¦_~^`]+/g, ' ') // parasites fréquents
  t = t.replace(/[ \t ]+/g, ' ')
  t = t.replace(/(\p{L})[-‐‑]\s*\n\s*(\p{Ll})/gu, '$1$2') // « mai-\nson » → « maison »
  const paragraphes = t
    .split(/\n\s*\n+/)
    .map((p) =>
      p
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .join(' ')
        .replace(/ +/g, ' ')
        .replace(/ ([,.])/g, '$1')
        .trim()
    )
    .filter((p) => p.length > 1)
  return paragraphes.join('\n\n')
}

// Titre d'une lecture : ses premiers mots
export function titreDepuis(texte) {
  const mots = (texte || '').replace(/\s+/g, ' ').trim().split(' ').slice(0, 7).join(' ')
  return mots.length > 48 ? mots.slice(0, 46) + '…' : mots || 'Lecture'
}

// Mot = lettres/chiffres, avec apostrophes et traits d'union à l'intérieur (« l'école », « peut-être »),
// ou nombre à virgule (« 25,5 », lu d'un seul tenant par la voix)
const MOT = /\p{N}+(?:[.,]\p{N}+)+|[\p{L}\p{N}]+(?:['’\-‐][\p{L}\p{N}]+)*/gu

// Découpe en paragraphes, chacun en morceaux { mot, texte, debut, fin, index }
export function decouperMots(texte) {
  const paragraphes = []
  let index = 0
  const regexPara = /[^\n]+/g
  let p
  while ((p = regexPara.exec(texte))) {
    const base = p.index
    const contenu = p[0]
    const morceaux = []
    let dernier = 0
    let m
    MOT.lastIndex = 0
    while ((m = MOT.exec(contenu))) {
      if (m.index > dernier) morceaux.push({ mot: false, texte: contenu.slice(dernier, m.index), debut: base + dernier })
      morceaux.push({ mot: true, texte: m[0], debut: base + m.index, fin: base + m.index + m[0].length, index: index++ })
      dernier = m.index + m[0].length
    }
    if (dernier < contenu.length) morceaux.push({ mot: false, texte: contenu.slice(dernier), debut: base + dernier })
    paragraphes.push(morceaux)
  }
  const mots = paragraphes.flat().filter((m) => m.mot)
  return { paragraphes, mots }
}

// Phrase qui contient une position : { debut, fin } (fin non comprise).
// Une phrase se termine par . ! ? … ou par un retour à la ligne.
export function phraseAutour(texte, position) {
  const n = texte.length
  if (n === 0) return { debut: 0, fin: 0 }
  const p = Math.max(0, Math.min(n - 1, position))
  // début du paragraphe, puis on avance phrase par phrase jusqu'à celle qui contient p
  let debut = texte.lastIndexOf('\n', p - 1) + 1
  for (;;) {
    let fin = debut
    while (fin < n && texte[fin] !== '\n') {
      if (/[.!?…]/.test(texte[fin])) {
        let j = fin + 1
        while (j < n && /[.!?…]/.test(texte[j])) j++
        const guillemet = /^\s?[»”")]+/.exec(texte.slice(j, j + 4)) // « … ? » reste dans la phrase
        if (guillemet) j += guillemet[0].length
        if (j >= n || /\s/.test(texte[j])) {
          fin = j
          break
        }
      }
      fin++
    }
    if (p < fin || fin >= n || texte[fin] === '\n') {
      while (debut < fin && /\s/.test(texte[debut])) debut++
      return { debut, fin }
    }
    debut = fin
  }
}

// Index du mot qui contient (ou suit) une position du texte
export function motALaPosition(mots, position) {
  let bas = 0
  let haut = mots.length - 1
  let res = -1
  while (bas <= haut) {
    const milieu = (bas + haut) >> 1
    if (mots[milieu].debut <= position) {
      res = milieu
      bas = milieu + 1
    } else haut = milieu - 1
  }
  if (res !== -1 && position < mots[res].fin) return res
  return Math.min(res + 1, mots.length - 1)
}

// Découpe le passage [debut, fin[ en morceaux de phrases pour la voix.
// Le premier morceau est court pour que la lecture démarre vite.
// Les positions restent celles du texte complet (les retours à la ligne
// deviennent des espaces, même longueur).
export function decouperPourVoix(texte, debut, fin, { premier = 220, suivants = 650 } = {}) {
  const passage = texte.slice(debut, fin)
  const phrases = []
  // fin de phrase = ponctuation suivie d'un espace (pas « 2.5 » ni « 10:30 »)
  const regex = /(?:[^.!?…;:\n]|[.!?…;:](?=[^\s"»”).!?…;:]))*(?:[.!?…;:]+["»”)]*|\n+|$)/g
  let m
  while ((m = regex.exec(passage))) {
    if (m[0] === '') {
      regex.lastIndex++
      if (regex.lastIndex > passage.length) break
      continue
    }
    phrases.push({ debut: debut + m.index, texte: m[0] })
  }

  const morceaux = []
  let courant = null
  const pousser = () => {
    if (!courant) return
    // retire les espaces au début / à la fin en gardant les bonnes positions
    const brut = courant.texte.replace(/\n/g, ' ')
    const avant = brut.length - brut.trimStart().length
    const propre = brut.trim()
    if (/[\p{L}\p{N}]/u.test(propre)) morceaux.push({ debut: courant.debut + avant, texte: propre })
    courant = null
  }
  for (const ph of phrases) {
    // phrase trop longue (sans ponctuation) : coupée aux espaces
    const parts = []
    if (ph.texte.length > suivants) {
      let reste = ph.texte
      let pos = ph.debut
      while (reste.length > suivants) {
        let coupe = reste.lastIndexOf(' ', suivants)
        if (coupe < suivants / 2) coupe = suivants
        parts.push({ debut: pos, texte: reste.slice(0, coupe) })
        pos += coupe
        reste = reste.slice(coupe)
      }
      parts.push({ debut: pos, texte: reste })
    } else parts.push(ph)

    for (const part of parts) {
      const limite = morceaux.length === 0 ? premier : suivants
      if (courant && courant.texte.length + part.texte.length > limite) pousser()
      if (!courant) courant = { debut: part.debut, texte: part.texte }
      else courant.texte += part.texte
    }
  }
  pousser()
  return morceaux
}

// Petit son vide (WAV) : joué au moment du toucher pour « débloquer »
// le son sur iPad/iPhone avant l'arrivée de la vraie voix.
export function sonVide() {
  const n = 800
  const buffer = new ArrayBuffer(44 + n)
  const v = new DataView(buffer)
  const ecrire = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)))
  ecrire(0, 'RIFF')
  v.setUint32(4, 36 + n, true)
  ecrire(8, 'WAVE')
  ecrire(12, 'fmt ')
  v.setUint32(16, 16, true)
  v.setUint16(20, 1, true)
  v.setUint16(22, 1, true)
  v.setUint32(24, 8000, true)
  v.setUint32(28, 8000, true)
  v.setUint16(32, 1, true)
  v.setUint16(34, 8, true)
  ecrire(36, 'data')
  v.setUint32(40, n, true)
  for (let i = 0; i < n; i++) v.setUint8(44 + i, 128)
  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }))
}
