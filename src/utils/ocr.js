// =============================================================
//  Appli « Lis-moi » : reconnaissance du texte d'une photo
//  Outil gratuit Tesseract, qui tourne sur la tablette elle-même
//  (rien n'est envoyé ailleurs). Il est chargé seulement quand on
//  en a besoin (premier usage : ~2 Mo de données françaises).
// =============================================================
import { nettoyerTexte } from './lecture.js'

let travailleur = null
let suivreProgression = () => {}

function obtenirTravailleur() {
  if (!travailleur) {
    travailleur = import('tesseract.js').then(({ createWorker }) =>
      createWorker('fra', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') suivreProgression(m.progress)
        },
      })
    )
    travailleur.catch(() => {
      travailleur = null
    })
  }
  return travailleur
}

// Photo → image redressée (sens du téléphone) et réduite (plus rapide, aussi précis)
async function preparerImage(file, coteMax = 2200) {
  let img
  if (typeof createImageBitmap === 'function') {
    try {
      img = await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      img = null
    }
  }
  if (!img) {
    img = await new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file)
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = () => reject(new Error('Impossible de lire la photo.'))
      i.src = url
    })
  }
  const echelle = Math.min(1, coteMax / Math.max(img.width, img.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.width * echelle)
  canvas.height = Math.round(img.height * echelle)
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas
}

function tournerCanvas(source, sens) {
  const c = document.createElement('canvas')
  c.width = source.height
  c.height = source.width
  const ctx = c.getContext('2d')
  ctx.translate(c.width / 2, c.height / 2)
  ctx.rotate((sens * Math.PI) / 2)
  ctx.drawImage(source, -source.width / 2, -source.height / 2)
  return c
}

// Reconnaît le texte. onProgression(0 → 1).
// Si le résultat est mauvais (photo prise de travers), on essaie la photo
// tournée d'un quart de tour dans chaque sens et on garde la meilleure.
// Renvoie { texte, confiance, rotation } (rotation : 0, 1 ou -1 quart de tour).
export async function reconnaitreTexte(file, onProgression = () => {}) {
  return reconnaitreImage(await preparerImage(file), onProgression)
}

// Même chose à partir d'une image déjà dessinée (ex. page d'un PDF scanné)
export async function reconnaitreImage(canvas, onProgression = () => {}) {
  const worker = await obtenirTravailleur()

  const essayer = async (image, part, total) => {
    suivreProgression = (p) => onProgression(Math.min(0.99, (part + p) / total))
    const { data } = await worker.recognize(image, { rotateAuto: true })
    return { texte: nettoyerTexte(data.text), confiance: data.confidence || 0 }
  }

  let meilleur = { ...(await essayer(canvas, 0, 1)), rotation: 0 }
  if (meilleur.confiance < 55 || meilleur.texte.length < 25) {
    for (const [i, sens] of [1, -1].entries()) {
      const essai = await essayer(tournerCanvas(canvas, sens), i + 1, 3)
      if (essai.confiance > meilleur.confiance + 10 && essai.texte.length >= meilleur.texte.length * 0.6) {
        meilleur = { ...essai, rotation: sens }
      }
    }
  }
  suivreProgression = () => {}
  onProgression(1)
  return meilleur
}
