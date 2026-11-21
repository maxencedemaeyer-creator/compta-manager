// =============================================================
//  Appli « Lis-moi » : lire un document (PDF, Word, texte)
//  - PDF : on prend le texte du fichier ; si une page n'en a pas
//    (PDF scanné), on la « photographie » et on reconnaît le texte.
//    Les pages sont aussi dessinées pour les afficher (5 pages max).
//  - Word (.docx) : titres, listes et paragraphes du fichier.
//  - Texte (.txt) : chaque ligne est gardée.
//  La mise en page (titres, listes, répliques) est gardée : voir miseEnPage.js.
//  Les bibliothèques sont chargées seulement quand on en a besoin.
// =============================================================
import { nettoyerTexte } from './lecture.js'
import { reconnaitreImage } from './ocr.js'
import { MARQUE_CENTRE, MARQUE_DROITE, texteDepuisHtmlWord, texteDepuisPdf, texteDepuisTxt } from './miseEnPage.js'

export const ACCEPT_DOCUMENT =
  '.pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain'

// Les textes de classe font au plus 3 pages (décision de Max) : petite marge à 5
const PAGES_MAX = 5 // pages lues, gardées en image et reconnues si scannées
const TEXTE_MAX = 300000 // caractères (limite d'un document Firebase : 1 Mo)

export function typeFichier(file) {
  const nom = (file.name || '').toLowerCase()
  const type = file.type || ''
  if (type.startsWith('image/') || /\.(jpe?g|png|heic|heif|webp|gif|bmp)$/.test(nom)) return 'image'
  if (type === 'application/pdf' || nom.endsWith('.pdf')) return 'pdf'
  if (nom.endsWith('.docx') || type.includes('wordprocessingml')) return 'word'
  if (type.startsWith('text/') || nom.endsWith('.txt')) return 'texte'
  if (nom.endsWith('.doc')) return 'doc-ancien'
  return null
}

const lettres = (t) => (t.match(/\p{L}/gu) || []).length

// Gras / italique d'une police de PDF (nom « Arial-BoldMT », « …-Italic », ou indications de la police)
function policePdf(page, nom) {
  try {
    if (!nom || !page.commonObjs.has(nom)) return {}
    const f = page.commonObjs.get(nom) || {}
    const n = `${f.name || ''} ${f.fallbackName || ''}`
    return {
      gras: !!(f.bold || f.black || /bold|black|heavy|semibold|demi|gras/i.test(n)),
      italique: !!(f.italic || /italic|oblique|kursiv/i.test(n)),
    }
  } catch {
    return {}
  }
}

async function dessinerPage(page, coteMax) {
  const base = page.getViewport({ scale: 1 })
  const echelle = Math.min(3, coteMax / Math.max(base.width, base.height))
  const viewport = page.getViewport({ scale: echelle })
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(viewport.width)
  canvas.height = Math.round(viewport.height)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  await page.render({ canvasContext: ctx, viewport }).promise
  return canvas
}

async function lirePdf(file, onProgression) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const { default: urlTravailleur } = await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = urlTravailleur

  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
  const n = Math.min(pdf.numPages, PAGES_MAX)
  const textes = []
  const images = []
  const douteux = new Set()

  for (let i = 1; i <= n; i++) {
    const page = await pdf.getPage(i)
    onProgression((i - 1) / n, `Page ${i} sur ${n}`)
    const { items } = await page.getTextContent()
    // la page est dessinée d'abord : les polices sont alors chargées (gras, italique)
    let dessin = await dessinerPage(page, lettres(items.map((it) => it.str || '').join(' ')) < 15 ? 2200 : 1600)
    let texte = texteDepuisPdf(items, (nom) => policePdf(page, nom))

    // Page sans texte (scannée) : on reconnaît le texte sur l'image
    if (lettres(texte) < 15) {
      const etape = `Page ${i} sur ${n} · document scanné, je déchiffre l'image`
      const ocr = await reconnaitreImage(dessin, (p) => onProgression((i - 1 + p * 0.95) / n, etape))
      texte = ocr.texte
      ocr.douteux.forEach((m) => douteux.add(m))
    }
    images.push(dessin)
    textes.push(texte.trim())
    page.cleanup()
    onProgression(i / n, `Page ${i} sur ${n}`)
  }
  pdf.destroy()
  const coupe = pdf.numPages > n
  return {
    texte: textes.filter(Boolean).join('\n\n') + (coupe ? `\n\n(Seules les ${n} premières pages ont été gardées.)` : ''),
    images,
    douteux: [...douteux],
  }
}

// Ajoute un texte (la marque d'alignement) au tout début du premier morceau du paragraphe
function marquerParagraphe(p, marque) {
  let fait = false
  const parcourir = (el) => {
    if (fait || !el?.children) return el
    if (el.type === 'run') {
      fait = true
      return { ...el, children: [{ type: 'text', value: marque }, ...el.children] }
    }
    const enfants = []
    for (const c of el.children) enfants.push(fait ? c : parcourir(c))
    return { ...el, children: enfants }
  }
  return parcourir(p)
}

async function lireWord(file) {
  const { default: mammoth } = await import('mammoth/mammoth.browser.js')
  const arrayBuffer = await file.arrayBuffer()
  try {
    const { value } = await mammoth.convertToHtml(
      { arrayBuffer },
      {
        // titres de Word (y compris « Titre » / « Sous-titre »), images ignorées
        styleMap: [
          "p[style-name='Title'] => h1:fresh",
          "p[style-name='Titre'] => h1:fresh",
          "p[style-name='Subtitle'] => h2:fresh",
          "p[style-name='Sous-titre'] => h2:fresh",
          'u => u', // souligné gardé
        ],
        convertImage: mammoth.images.imgElement(() => ({ src: '' })),
        // alignement du paragraphe (centré, à droite) : petite marque invisible au début
        transformDocument: mammoth.transforms.paragraph((p) => {
          const a = p.alignment
          const marque = a === 'center' ? MARQUE_CENTRE : a === 'right' || a === 'end' ? MARQUE_DROITE : null
          return marque ? marquerParagraphe(p, marque) : p
        }),
      }
    )
    const texte = texteDepuisHtmlWord(value)
    if (texte) return { texte, images: [], douteux: [] }
  } catch (e) {
    console.warn('Mise en page Word non lue :', e)
  }
  const { value } = await mammoth.extractRawText({ arrayBuffer })
  return { texte: nettoyerTexte(value.replace(/\n+/g, '\n\n')), images: [], douteux: [] }
}

async function lireTexteBrut(file) {
  const brut = await file.text()
  return { texte: texteDepuisTxt(brut), images: [], douteux: [] }
}

// Renvoie { texte, images: [canvas…], douteux: [mots], source }
// onProgression(0 → 1, étape) — étape = texte affiché (« Page 2 sur 3 »)
export async function lireDocument(file, onProgression = () => {}) {
  const type = typeFichier(file)
  if (type === 'doc-ancien') throw new Error('Ce fichier Word est trop ancien (.doc). Enregistre-le en .docx ou en PDF.')
  if (!type || type === 'image') throw new Error('Ce type de fichier n’est pas pris en charge. Choisis un PDF, un fichier Word (.docx) ou un texte (.txt).')

  let resultat
  if (type === 'pdf') resultat = await lirePdf(file, onProgression)
  else if (type === 'word') resultat = await lireWord(file)
  else resultat = await lireTexteBrut(file)
  onProgression(1)

  let texte = resultat.texte.trim()
  if (texte.length > TEXTE_MAX) texte = texte.slice(0, TEXTE_MAX) + '…\n\n(Document trop long, coupé.)'
  return { texte, images: resultat.images, douteux: resultat.douteux, source: type }
}

// Dessin (canvas) → fichier image, pour le ranger comme une photo
export function canvasEnFichier(canvas) {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Image impossible à créer.'))), 'image/jpeg', 0.9)
  )
}
