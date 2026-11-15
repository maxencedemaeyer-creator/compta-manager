import { doc } from 'firebase/firestore'
import { db } from '../firebase/config.js'

// =============================================================
//  Liste des profils (espaces) du site.
//  Pour ajouter quelqu'un : ajouter un objet ici.
//
//  - id      : ce qui apparaît dans l'adresse (/maxence, /julie…)
//  - apps    : 'toutes' = toutes les applis de src/config/apps.js,
//              sinon la liste des id d'applis de ce profil.
//  - couleur : dégradé de la pastille sur l'écran de choix.
//
//  Données Firebase :
//  - Maxence : à la racine de la base (comme avant, rien ne bouge).
//  - Les autres : dans utilisateurs/<id>/… (dossier à part).
// =============================================================
export const PROFILS = [
  {
    id: 'maxence',
    nom: 'Maxence',
    apps: 'toutes',
    couleur: 'from-emerald-400 to-teal-600',
    accent: 'text-emerald-500',
  },
  {
    id: 'julie',
    nom: 'Julie',
    apps: [],
    couleur: 'from-rose-400 to-fuchsia-600',
    accent: 'text-rose-500',
  },
]

export const PROFIL_PRINCIPAL = 'maxence'

export function trouverProfil(id) {
  return PROFILS.find((p) => p.id === id) || null
}

// Profil correspondant à une adresse (/julie/settings → julie), sinon null
export function profilDepuisChemin(pathname) {
  const premier = (pathname || '').split('/')[1] || ''
  return trouverProfil(premier.toLowerCase())?.id || null
}

// Document de configuration d'un profil ('securite' = PIN, 'site' = paramètres)
export function docConfig(profilId, nom) {
  if (profilId === PROFIL_PRINCIPAL) return doc(db, 'config', nom)
  return doc(db, 'utilisateurs', profilId, 'config', nom)
}
