// Calcule le hash SHA-256 (hex) d'une chaîne, via l'API Web Crypto native du navigateur.
// Utilisé pour vérifier le PIN sans jamais le stocker/comparer en clair.
export async function sha256Hex(message) {
  const data = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}
