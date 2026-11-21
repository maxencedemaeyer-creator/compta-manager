// =============================================================
//  Médias lourds (modèles 3D du labo de sciences)
//  Ils ne sont PAS dans public/ : Vercel recopie public/ à chaque
//  déploiement et le stockage de l'équipe (10 Go) se remplirait.
//  Ils vivent sur la branche « medias » du dépôt GitHub, lue via
//  jsDelivr (CDN gratuit), avec GitHub en secours.
//
//  Si un fichier de la branche « medias » change : y mettre le
//  nouveau commit ci-dessous (MEDIAS_COMMIT).
// =============================================================
const DEPOT = 'maxencedemaeyer-creator/compta-manager'
export const MEDIAS_COMMIT = '4eac0d48922e4d0e50f26c9ad60d5c9d627e6061'

const SOURCES = [
  (nom) => `https://cdn.jsdelivr.net/gh/${DEPOT}@${MEDIAS_COMMIT}/${nom}`,
  (nom) => `https://raw.githubusercontent.com/${DEPOT}/${MEDIAS_COMMIT}/${nom}`,
]

// Télécharge un média lourd : essaie chaque source tour à tour
export async function chargerMedia(nom) {
  let derniereErreur = null
  for (const source of SOURCES) {
    try {
      const r = await fetch(source(nom))
      if (r.ok) return await r.arrayBuffer()
      derniereErreur = new Error(`${nom} : HTTP ${r.status}`)
    } catch (e) {
      derniereErreur = e
    }
  }
  throw derniereErreur || new Error(`${nom} : introuvable`)
}
