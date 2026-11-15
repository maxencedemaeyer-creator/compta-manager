import { BookOpenCheck, GitBranch, Wallet } from 'lucide-react'

// =============================================================
//  Liste des applications du site "Maxence".
//  Pour ajouter une application : ajouter un objet ici
//  (et sa route dans App.jsx). L'ordre et la visibilité se
//  règlent ensuite directement dans Paramètres.
// =============================================================
export const APPS = [
  {
    id: 'compta',
    to: '/compta',
    nom: 'Compta',
    description: 'Cours, vélo, études, frais',
    icon: Wallet,
    couleur: 'from-emerald-400 to-teal-600',
  },
  {
    id: 'genealogie',
    to: '/genealogie',
    nom: 'Généalogie',
    description: 'Arbre familial, éventail et photos',
    icon: GitBranch,
    couleur: 'from-rose-400 to-orange-500',
  },
  {
    id: 'francais',
    to: '/francais',
    nom: 'Français',
    description: 'Programme P5-P6 et suivi en classe',
    icon: BookOpenCheck,
    couleur: 'from-sky-400 to-indigo-600',
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
