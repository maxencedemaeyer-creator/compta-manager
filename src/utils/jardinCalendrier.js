import { baseDePlante } from '../data/jardin/plantes.js'
import { CLIMATS, CLIMAT_PAR_DEFAUT } from '../config/jardinPays.js'

// =============================================================
//  Calendrier de « Mon jardin » : quelles tâches pour quel mois ?
//  (code pur, sans Firebase : les « C'est fait » sont passés en paramètre)
//  Types d'actions : taille, recolte, rentree, sortie
//  Les mois sont adaptés au climat du jardin (voir src/config/jardinPays.js)
// =============================================================

export const cleTache = (plantDocId, actionId, annee) => `${plantDocId}__${actionId}__${annee}`

// Année « de départ » d'une fenêtre qui chevauche décembre → janvier
export function anneeFenetre(action, mois, annee) {
  return mois === 1 && action.mois.includes(12) ? annee - 1 : annee
}

// Rentrée / sortie : seulement pour les plantes qui sont dehors ET en pot
export const estMeteo = (action) => action.type === 'rentree' || action.type === 'sortie'
export const concerne = (plante, action) => !estMeteo(action) || (plante.lieu === 'exterieur' && plante.culture === 'pot')

// Adapte les mois d'une action au climat du jardin (les mois de la base sont ceux de la Belgique).
// Toute la période est décalée d'un bloc. Renvoie null si l'action ne s'applique pas à ce climat
// (rentrée/sortie inutiles sous climat méditerranéen).
export function actionPourClimat(action, climat = CLIMAT_PAR_DEFAUT) {
  const c = CLIMATS[climat] || CLIMATS[CLIMAT_PAR_DEFAUT]
  if (c.sansRentree && estMeteo(action)) return null
  const decalage =
    action.type === 'sortie' ? c.sortie : action.type === 'rentree' ? c.rentree : action.mois[0] <= 6 ? c.debut : c.fin
  if (!decalage) return action
  return { ...action, mois: action.mois.map((m) => ((((m - 1 + decalage) % 12) + 12) % 12) + 1) }
}

// Tâches à afficher pour le mois (annee, mois) : normales + « en retard » (mois en cours seulement)
//  - taille : en retard tant que l'année n'est pas finie et que la période est passée
//  - rentrée / sortie : en retard seulement le mois qui suit la période (sinon rappel inutile)
//  - récolte : jamais en retard
export function tachesDuMois({ plantes, faites, annee, mois, aujourdhui = new Date(), climat = CLIMAT_PAR_DEFAUT }) {
  const normales = []
  const retard = []
  const estMoisCourant = aujourdhui.getFullYear() === annee && aujourdhui.getMonth() + 1 === mois

  for (const plante of plantes) {
    const base = baseDePlante(plante)
    if (!base) continue
    const cree = plante.creeLe?.toDate ? plante.creeLe.toDate() : aujourdhui
    const creeIndex = cree.getFullYear() * 12 + cree.getMonth()

    for (const actionBase of base.actions) {
      if (!concerne(plante, actionBase)) continue
      const action = actionPourClimat(actionBase, climat)
      if (!action) continue
      const fenetre = anneeFenetre(action, mois, annee)
      const cle = cleTache(plante.id, action.id, fenetre)
      const donnee = faites[cle]
      const tache = {
        cle,
        plante,
        base,
        action,
        fenetre,
        fait: !!donnee,
        faitLe: donnee?.faitLe?.toDate ? donnee.faitLe.toDate() : null,
      }
      if (action.mois.includes(mois)) {
        normales.push(tache)
      } else if (estMoisCourant && !donnee) {
        // Les fenêtres à cheval sur deux années (décembre-janvier) ne passent jamais « en retard »
        const chevauche = action.mois.includes(12) && action.mois.includes(1)
        const fin = Math.max(...action.mois)
        const finAbsolue = annee * 12 + (fin - 1)
        const periodePassee =
          action.type === 'taille' ? fin < mois : estMeteo(action) ? mois === fin + 1 : false
        if (!chevauche && periodePassee && finAbsolue >= creeIndex) retard.push({ ...tache, enRetard: true })
      }
    }
  }
  return { normales, retard }
}
