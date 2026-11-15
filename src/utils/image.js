// Réduit une photo (taille + qualité) pour pouvoir la stocker dans Firebase.
// Résultat : une image JPEG carrée de 360 px, environ 20 à 40 Ko.
export function compresserPhoto(file, taille = 360, qualite = 0.82) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      // Recadrage carré centré (un peu vers le haut, là où sont souvent les visages)
      const cote = Math.min(img.width, img.height)
      const sx = (img.width - cote) / 2
      const sy = Math.max(0, (img.height - cote) * 0.3)
      const canvas = document.createElement('canvas')
      canvas.width = taille
      canvas.height = taille
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, sx, sy, cote, cote, 0, 0, taille, taille)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', qualite))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`Impossible de lire l'image ${file.name}`))
    }
    img.src = url
  })
}

// =============================================================
//  Photos pour la projection en classe
//  But : une image nette sur grand écran, mais qui tient dans un
//  document Firebase (limite 1 Mo). On réduit à 1920 px max sur le
//  plus grand côté (la résolution d'un projecteur / TBI Full HD) et on
//  baisse la qualité seulement si nécessaire.
// =============================================================
const LIMITE_FIREBASE = 900000 // caractères, marge sous la limite de 1 Mo

function chargerImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Impossible de lire la photo."))
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

// WebP (plus léger à qualité égale) quand le navigateur sait le produire, sinon JPEG
function encoder(canvas, qualite) {
  const webp = canvas.toDataURL('image/webp', qualite)
  if (webp.startsWith('data:image/webp')) return webp
  return canvas.toDataURL('image/jpeg', qualite)
}

export async function preparerPhotoProjection(file) {
  const img = await chargerImage(file)

  let coteMax = 1920
  let image = null
  let canvas = null
  while (!image && coteMax >= 800) {
    canvas = dessiner(img, coteMax)
    for (const q of [0.88, 0.8, 0.72, 0.64]) {
      const essai = encoder(canvas, q)
      if (essai.length <= LIMITE_FIREBASE) {
        image = essai
        break
      }
    }
    if (!image) coteMax = Math.round(coteMax * 0.8)
  }
  if (!image) throw new Error('Photo trop lourde, impossible de la réduire suffisamment.')

  const miniature = encoder(dessiner(img, 360), 0.75)

  return {
    image,
    miniature,
    largeur: canvas.width,
    hauteur: canvas.height,
    taille: image.length + miniature.length,
  }
}
