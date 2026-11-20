// =============================================================
//  Outils de la fonction voix (api/tts.js) — appli « Lis-moi »
//  (le « _ » devant le nom empêche Vercel d'en faire une adresse)
// =============================================================

// Voix autorisées (les mêmes que dans src/config/lectureVoix.js)
export const VOIX_AUTORISEES = {
  'fr-FR-DeniseNeural': 'fr-FR',
  'fr-FR-HenriNeural': 'fr-FR',
  'fr-FR-VivienneMultilingualNeural': 'fr-FR',
  'fr-FR-RemyMultilingualNeural': 'fr-FR',
  'fr-BE-CharlineNeural': 'fr-BE',
  'fr-BE-GerardNeural': 'fr-BE',
}

export const LONGUEUR_MAX = 1500 // caractères par demande (le site découpe les longs textes)

// Échappe le texte pour le SSML en notant, pour chaque caractère du SSML,
// à quel caractère du texte d'origine il correspond (pour retrouver les mots).
// Seuls & < > sont échappés : les apostrophes restent telles quelles.
function echapper(texte) {
  let sortie = ''
  const carte = []
  for (let i = 0; i < texte.length; i++) {
    const c = texte[i]
    const rempl = c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c
    for (let k = 0; k < rempl.length; k++) carte.push(i)
    sortie += rempl
  }
  return { sortie, carte }
}

export function construireSsml(texte, voix, vitesse) {
  const langue = VOIX_AUTORISEES[voix]
  const rate = `${vitesse >= 0 ? '+' : ''}${Math.round(vitesse)}%`
  const multilingue = voix.includes('Multilingual')
  const debut =
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${langue}">` +
    `<voice name="${voix}"><prosody rate="${rate}">` +
    (multilingue ? `<lang xml:lang="fr-FR">` : '')
  const fin = (multilingue ? '</lang>' : '') + '</prosody></voice></speak>'
  const { sortie, carte } = echapper(texte)
  return { ssml: debut + sortie + fin, decalage: debut.length, carte }
}

// Retrouve la position d'un mot prononcé dans le texte d'origine.
// 1) grâce à sa position dans le SSML ; 2) sinon en le cherchant après le mot précédent.
export function localiserMot(texte, { textOffset, text, wordLength }, { decalage, carte }, curseur) {
  const mot = text || ''
  const iSsml = textOffset - decalage
  if (iSsml >= 0 && iSsml < carte.length) {
    const debut = carte[iSsml]
    if (!mot || texte.startsWith(mot, debut)) {
      const finSsml = Math.min(carte.length - 1, iSsml + Math.max(1, wordLength || mot.length) - 1)
      return { debut, longueur: Math.max(1, carte[finSsml] - debut + 1) }
    }
  }
  if (mot) {
    const trouve = texte.indexOf(mot, curseur)
    if (trouve !== -1) return { debut: trouve, longueur: mot.length }
  }
  return null
}

// N'accepte que les appels venant du site lui-même (pas d'un autre site)
export function origineAutorisee(req) {
  const origine = req.headers.origin || req.headers.referer
  if (!origine) return false
  let hote
  try {
    hote = new URL(origine).host
  } catch {
    return false
  }
  const hoteDemande = req.headers['x-forwarded-host'] || req.headers.host
  if (hote === hoteDemande) return true
  return /^localhost(:\d+)?$/.test(hote) || /^compta-manager[a-z0-9-]*\.vercel\.app$/.test(hote)
}

// Frein anti-robot (simple) : nombre de demandes par adresse IP sur 10 minutes.
// Toutes les tablettes d'une école sortent souvent par la même adresse : la limite
// est large pour une classe, mais coupe un robot qui boucle. (Mémoire d'une
// instance Vercel : ce n'est pas un mur, juste un frein ; le vrai filet est le
// niveau gratuit F0 d'Azure, qui ne facture jamais.)
const FENETRE_MS = 10 * 60 * 1000
const MAX_DEMANDES = 200
const MAX_CARACTERES = 100000
const compteurs = new Map()

export function freinAntiRobot(req, caracteres) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'inconnu').split(',')[0].trim()
  const maintenant = Date.now()
  let c = compteurs.get(ip)
  if (!c || maintenant - c.debut > FENETRE_MS) c = { debut: maintenant, demandes: 0, caracteres: 0 }
  c.demandes += 1
  c.caracteres += caracteres
  compteurs.set(ip, c)
  if (compteurs.size > 5000) compteurs.clear()
  return c.demandes > MAX_DEMANDES || c.caracteres > MAX_CARACTERES
}
