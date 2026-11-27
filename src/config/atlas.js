import { Earth, Globe2, Landmark } from 'lucide-react'

// =============================================================
//  Bibliothèque de cartes de l'ATLAS.
//  Chaque série est un « dossier » de cartes, rangée sous une rubrique
//  (région du monde, thème…). Pour ajouter une série : un objet ici
//  + sa page dans src/views/atlas/ + sa route dans App.jsx.
// =============================================================
export const SERIES_ATLAS = [
  {
    id: 'belgique',
    rubrique: 'Régions',
    titre: 'Belgique',
    texte: 'Régions, communautés, provinces, communes, villes et rivières',
    to: '/maxence/atlas/belgique',
    icon: Landmark,
    couleur: 'from-amber-300 via-rose-400 to-sky-500',
    pret: true,
  },
  {
    id: 'monde',
    rubrique: 'Monde',
    titre: 'Le monde',
    texte: 'Continents, océans, lignes imaginaires, fuseaux horaires, zones climatiques, projections et planisphères',
    to: '/maxence/atlas/monde',
    icon: Globe2,
    couleur: 'from-sky-400 via-emerald-400 to-amber-300',
    pret: true,
  },
  {
    id: 'europe',
    rubrique: 'Régions',
    titre: 'Europe',
    texte: 'Pays, capitales, Union européenne, zone euro, Schengen, montagnes et limites de l’Europe',
    to: '/maxence/atlas/europe',
    icon: Earth,
    couleur: 'from-indigo-400 via-sky-500 to-amber-300',
    pret: true,
  },
]

// Rubriques dans l'ordre d'affichage (une rubrique sans série n'apparaît pas)
export const RUBRIQUES_ATLAS = ['Monde', 'Régions', 'Thèmes']
