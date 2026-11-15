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
