import { useMemo } from 'react'
import { useCoursParticuliers } from './useCoursParticuliers.js'
import { useVeloEntries } from './useVelo.js'
import { useEtudes } from './useEtudes.js'
import { moisKeyFromDate, moisKeyActuel, moisKeyPrecedent, anneeActuelle, anneeDeMoisKey } from '../utils/dates.js'

function moisVide() {
  return { total: 0, percu: 0, aPercevoir: 0 }
}

function ajouter(map, moisKey, montant, paye) {
  if (!map.has(moisKey)) map.set(moisKey, moisVide())
  const m = map.get(moisKey)
  m.total += montant
  if (paye) {
    m.percu += montant
  } else {
    m.aPercevoir += montant
  }
}

// Agrège les 3 sources de revenus (cours, vélo, études) par mois, et calcule
// les totaux "ce mois-ci" / "mois dernier" / "année en cours" pour le tableau de bord.
export function useComptabilite() {
  const { cours, loading: loadingCours } = useCoursParticuliers()
  const { entries: veloEntries, loading: loadingVelo } = useVeloEntries()
  const { etudes, loading: loadingEtudes } = useEtudes()

  const loading = loadingCours || loadingVelo || loadingEtudes

  const parMois = useMemo(() => {
    const map = new Map()
    for (const c of cours) {
      ajouter(map, moisKeyFromDate(c.date), c.prix, c.paye)
    }
    for (const e of veloEntries) {
      ajouter(map, e.mois, e.montant, e.paye)
    }
    for (const e of etudes) {
      ajouter(map, moisKeyFromDate(e.date), e.prix, e.paye)
    }
    return map
  }, [cours, veloEntries, etudes])

  const historique = useMemo(
    () => Array.from(parMois.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1)),
    [parMois]
  )

  const moisActuel = moisKeyActuel()
  const moisPrecedent = moisKeyPrecedent(moisActuel)
  const anneeCourante = anneeActuelle()

  const ceMois = parMois.get(moisActuel) || moisVide()
  const moisDernier = parMois.get(moisPrecedent) || moisVide()

  const totalAnnee = useMemo(() => {
    const acc = moisVide()
    for (const [moisKey, valeurs] of parMois.entries()) {
      if (anneeDeMoisKey(moisKey) === anneeCourante) {
        acc.total += valeurs.total
        acc.percu += valeurs.percu
        acc.aPercevoir += valeurs.aPercevoir
      }
    }
    return acc
  }, [parMois, anneeCourante])

  const totalEnAttente = useMemo(
    () => historique.reduce((sum, [, v]) => sum + v.aPercevoir, 0),
    [historique]
  )

  return {
    loading,
    ceMois,
    moisDernier,
    totalAnnee,
    historique,
    totalEnAttente,
    anneeCourante,
  }
}
