// Ajoute une limite de temps à une promesse Firebase. Si elle ne se termine pas
// dans le délai imparti, on la rejette avec un message clair au lieu de laisser
// l'app tourner à l'infini (utile quand une connexion réseau/VPN/pare-feu bloque
// silencieusement les requêtes vers Firestore).
export function withTimeout(
  promise,
  ms = 15000,
  message = "La connexion à la base de données a expiré. Vérifie ta connexion internet (essaie de désactiver un VPN ou une extension de blocage actif) et réessaie."
) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms)
    }),
  ])
}
