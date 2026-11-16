// =============================================================
//  Photos de l'application Couture
//  Chaque photo est stockée dans Firebase (jamais en local) :
//  - la grande image (1600 px max) dans un document à part,
//  - une miniature (640 px) pour la galerie, plus légère.
//  Un document Firebase est limité à 1 Mo : on vise 600 Ko max.
// =============================================================
const LIMITE_IMAGE = 600000 // caractères
const COTE_MINIATURE = 640

function chargerDepuisUrl(url, revoquer = false) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      if (revoquer) URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      if (revoquer) URL.revokeObjectURL(url)
      reject(new Error('Impossible de lire la photo.'))
    }
    img.src = url
  })
}

function dessiner(img, coteMax) {
  const echelle = Math.min(1, coteMax / Math.max(img.width, img.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.width * echelle)
  canvas.height = Math.round(img.height * echelle)
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas
}

// WebP (plus léger) si le navigateur sait le produire, sinon JPEG
function encoder(canvas, qualite) {
  const webp = canvas.toDataURL('image/webp', qualite)
  if (webp.startsWith('data:image/webp')) return webp
  return canvas.toDataURL('image/jpeg', qualite)
}

// Photo prise avec le téléphone → { image, miniature }
export async function preparerPhotoCouture(file) {
  const img = await chargerDepuisUrl(URL.createObjectURL(file), true)
  let coteMax = 1600
  let image = null
  while (!image && coteMax >= 700) {
    const canvas = dessiner(img, coteMax)
    for (const q of [0.85, 0.78, 0.7, 0.62]) {
      const essai = encoder(canvas, q)
      if (essai.length <= LIMITE_IMAGE) {
        image = essai
        break
      }
    }
    if (!image) coteMax = Math.round(coteMax * 0.8)
  }
  if (!image) throw new Error('Photo trop lourde, impossible de la réduire.')
  const miniature = encoder(dessiner(img, COTE_MINIATURE), 0.78)
  return { image, miniature }
}

// Miniature à partir d'une photo déjà enregistrée (quand on change la photo de couverture)
export async function miniatureDepuisSource(src) {
  const img = await chargerDepuisUrl(src)
  return encoder(dessiner(img, COTE_MINIATURE), 0.78)
}
