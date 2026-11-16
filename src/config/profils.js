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
//  - theme   : habillage de l'espace (couleurs et polices dans src/index.css).
//  - fondPin : dégradé de l'écran du code PIN.
//  - icone   : dossier de son icône dans public/icons/ (onglet du
//              navigateur + icône sur l'écran d'accueil de l'iPhone).
//              Sans icône, l'espace prend celle de l'accueil.
//              (penser aussi à l'ajouter dans le petit script d'index.html)
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
    theme: null,
    fondPin: 'bg-gradient-to-b from-emerald-700 to-emerald-950',
    icone: 'maxence',
  },
  {
    id: 'julie',
    nom: 'Julie',
    apps: ['couture'],
    couleur: 'from-pink-400 via-fuchsia-400 to-violet-500',
    accent: 'text-emerald-400',
    theme: 'julie',
    fondPin: 'bg-gradient-to-br from-emerald-300 via-emerald-500 to-emerald-800',
    icone: 'julie',
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
