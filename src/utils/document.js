// =============================================================
//  Appli « Lis-moi » : lire un document (PDF, Word, texte)
//  - PDF : on prend le texte du fichier ; si une page n'en a pas
//    (PDF scanné), on la « photographie » et on reconnaît le texte.
//    Les pages sont aussi dessinées pour les afficher (5 pages max).
//  - Word (.docx) : texte des paragraphes.
//  - Texte (.txt) : chaque ligne = un paragraphe.
//  Les bibliothèques sont chargées seulement quand on en a besoin.
// =============================================================
import { nettoyerTexte } from './lecture.js'
import { reconnaitreImage } from './ocr.js'

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

// Recompose le texte d'une page PDF à partir de ses morceaux positionnés
function assemblerPage(items) {
  let sortie = ''
  let yPrec = null
  let hPrec = 0
  let xFinPrec = 0
  for (const it of items) {
    if (typeof it.str !== 'string') continue
    const [, , , d, x, y] = it.transform
    const h = Math.abs(d) || it.height || 10
    if (it.str === '') {
      continue
    }
    if (yPrec === null) {
      sortie += it.str
    } else if (Math.abs(y - yPrec) > Math.max(h, hPrec) * 0.5) {
      const ecart = Math.abs(yPrec - y)
      sortie += ecart > Math.max(h, hPrec) * 1.9 ? '\n\n' : '\n'
      sortie += it.str
    } else {
      const espace = x - xFinPrec > h * 0.15 && !/\s$/.test(sortie) && !/^\s/.test(it.str)
      sortie += (espace ? ' ' : '') + it.str
    }
    yPrec = y
    hPrec = h
    xFinPrec = x + (it.width || 0)
  }
  return sortie
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
    let texte = assemblerPage((await page.getTextContent()).items)
    let dessin = null

    onProgression((i - 1) / n, `Page ${i} sur ${n}`)
    // Page sans texte (scannée) : on reconnaît le texte sur l'image
    if (lettres(texte) < 15) {
      dessin = await dessinerPage(page, 2200)
      const etape = `Page ${i} sur ${n} · document scanné, je déchiffre l'image`
      const ocr = await reconnaitreImage(dessin, (p) => onProgression((i - 1 + p * 0.95) / n, etape))
      texte = ocr.texte
      ocr.douteux.forEach((m) => douteux.add(m))
    }
    images.push(dessin || (await dessinerPage(page, 1600)))
    textes.push(nettoyerTexte(texte))
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

async function lireWord(file) {
  const { default: mammoth } = await import('mammoth/mammoth.browser.js')
  const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
  return { texte: nettoyerTexte(value.replace(/\n+/g, '\n\n')), images: [], douteux: [] }
}

async function lireTexteBrut(file) {
  const brut = await file.text()
  return { texte: nettoyerTexte(brut.replace(/\r/g, '').replace(/\n+/g, '\n\n')), images: [], douteux: [] }
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
