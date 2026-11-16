// =============================================================
//  Petits réglages d'ouverture gardés sur le téléphone
//  (pas des données : juste « quel espace ouvrir » et « le PIN
//  vient d'être tapé ». Toutes les données restent dans Firebase.)
// =============================================================

// Espace ouvert en dernier : sert à rouvrir directement /julie ou /maxence
// quand on lance le site depuis l'icône de l'écran d'accueil de l'iPhone.
export const CLE_ESPACE = 'cm_espace'

// Le PIN reste mémorisé 30 minutes après la dernière utilisation
export const MEMOIRE_PIN_MINUTES = 30

const cleAcces = (profilId) => `cm_acces_${profilId}`
const clePin = (profilId) => `cm_pin_${profilId}`

function lire(cle) {
  try {
    return localStorage.getItem(cle)
  } catch {
    return null
  }
}
function ecrire(cle, valeur) {
  try {
    if (valeur === null) localStorage.removeItem(cle)
    else localStorage.setItem(cle, valeur)
  } catch {
    /* navigation privée : tant pis, on redemandera */
  }
}

export function memoriserEspace(profilId) {
  if (profilId && lire(CLE_ESPACE) !== profilId) ecrire(CLE_ESPACE, profilId)
}

// Moment de la dernière utilisation de l'espace (0 = verrouillé)
export function lireAcces(profilId) {
  return Number(lire(cleAcces(profilId))) || 0
}
export function noterAcces(profilId, moment = Date.now()) {
  ecrire(cleAcces(profilId), String(moment))
}
export function oublierAcces(profilId) {
  ecrire(cleAcces(profilId), null)
}
export function accesEncoreValide(profilId) {
  const dernier = lireAcces(profilId)
  return dernier > 0 && Date.now() - dernier < MEMOIRE_PIN_MINUTES * 60000
}

// On retient que le profil a déjà un PIN : l'écran du code s'affiche tout de suite
export function pinConnu(profilId) {
  return lire(clePin(profilId)) === 'existe'
}
export function retenirPin(profilId) {
  ecrire(clePin(profilId), 'existe')
}

// Nom et habillage de l'espace d'une adresse (pour les écrans de chargement)
export function espaceDeLaPage() {
  const premier = (window.location.pathname.split('/')[1] || '').toLowerCase()
  if (window.location.hostname === 'couture-julie.vercel.app' || premier === 'couture' || premier === 'julie') {
    return { nom: 'Julie', theme: 'julie' }
  }
  if (premier === 'maxence') return { nom: 'Maxence', theme: null }
  return { nom: 'Bienvenue', theme: null }
}
