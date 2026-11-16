import { BookOpenCheck, Gamepad2, GitBranch, MessageSquarePlus, Projector, Scissors, Wallet } from 'lucide-react'

// =============================================================
//  Liste des applications du site (adresses sous /maxence).
//  Quelles applis chaque profil voit : src/config/profils.js
//  Pour ajouter une application : ajouter un objet ici
//  (et sa route dans App.jsx). L'ordre et la visibilité se
//  règlent ensuite directement dans Paramètres.
//  pourTous: true = l'appli est dans chaque espace, à l'adresse
//  /<profil>/<id> (ex. /julie/requetes).
//  profils: ['julie'] = appli réservée à ces profils (même si
//  un profil a apps: 'toutes').
// =============================================================
export const APPS = [
  {
    id: 'compta',
    to: '/maxence/compta',
    nom: 'Compta',
    description: 'Cours, vélo, études, frais',
    icon: Wallet,
    couleur: 'from-emerald-400 to-teal-600',
  },
  {
    id: 'genealogie',
    to: '/maxence/genealogie',
    nom: 'Généalogie',
    description: 'Arbre familial, éventail et photos',
    icon: GitBranch,
    couleur: 'from-rose-400 to-orange-500',
  },
  {
    id: 'francais',
    to: '/maxence/francais',
    nom: 'Français',
    description: 'Programme P5-P6 et suivi en classe',
    icon: BookOpenCheck,
    couleur: 'from-sky-400 to-indigo-600',
  },
  {
    id: 'projection',
    to: '/maxence/projection',
    nom: 'Projection',
    description: 'Photo prise en classe, projetée au tableau',
    icon: Projector,
    couleur: 'from-violet-500 to-amber-400',
  },
  {
    id: 'jeux',
    to: '/maxence/jeux',
    nom: 'Jeux',
    description: 'Game Center : tous les jeux',
    icon: Gamepad2,
    couleur: 'from-fuchsia-500 to-cyan-400',
  },
  {
    id: 'couture',
    to: '/julie/couture',
    nom: 'Couture',
    description: 'Ma galerie et mes commandes',
    icon: Scissors,
    couleur: 'from-pink-300 via-pink-400 to-rose-500',
    profils: ['julie'],
  },
  {
    id: 'requetes',
    to: '/maxence/requetes',
    nom: 'Requêtes',
    description: 'Demandes de nouvelles applis et idées',
    icon: MessageSquarePlus,
    couleur: 'from-fuchsia-500 to-indigo-500',
    pourTous: true,
  },
]

// Applications dans l'ordre choisi dans Paramètres
export function appsOrdonnees(ordre = []) {
  const position = (id) => {
    const i = ordre.indexOf(id)
    return i === -1 ? 1000 + APPS.findIndex((a) => a.id === id) : i
  }
  return [...APPS].sort((a, b) => position(a.id) - position(b.id))
}

// Applications d'un profil (voir src/config/profils.js), dans l'ordre choisi dans ses Paramètres
export function appsDuProfil(profil, ordre = []) {
  const toutes = appsOrdonnees(ordre)
  if (!profil) return []
  return toutes
    .filter((a) => !a.profils || a.profils.includes(profil.id))
    .filter((a) => profil.apps === 'toutes' || a.pourTous || profil.apps.includes(a.id))
    .map((a) => (a.pourTous ? { ...a, to: `/${profil.id}/${a.id}` } : a))
}
