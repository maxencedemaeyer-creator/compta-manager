import { useMemo } from 'react'
import { useCoursParticuliers } from './useCoursParticuliers.js'
import { useVeloEntries } from './useVelo.js'
import { useEtudes } from './useEtudes.js'
import { idEleve } from './useEleves.js'
import {
  moisKeyFromDate,
  moisKeyActuel,
  anneeActuelle,
  anneeDeMoisKey,
  coursEstPasse,
  etudeEstPassee,
  moisEstTermine,
} from '../utils/dates.js'

function enDate(date) {
  return date instanceof Date ? date : date?.toDate ? date.toDate() : new Date(date)
}

function moisVide() {
  return { total: 0, parPoste: { cours: 0, velo: 0, etudes: 0 } }
}

function ajouter(map, moisKey, montant, poste) {
  if (!map.has(moisKey)) map.set(moisKey, moisVide())
  const m = map.get(moisKey)
  m.total += montant
  m.parPoste[poste] += montant
}

// Données du tableau de bord "Accueil" : totaux par mois / par année pour les 3 rentrées
// d'argent (cours, vélo, études) + un petit récap par volet.
export function useComptabilite() {
  const { cours, loading: loadingCours } = useCoursParticuliers()
  const { entries: veloEntries, loading: loadingVelo } = useVeloEntries()
  const { etudes, loading: loadingEtudes } = useEtudes()

  const loading = loadingCours || loadingVelo || loadingEtudes
  const moisActuel = moisKeyActuel()
  const anneeCourante = anneeActuelle()

  // Total par mois (tous mois confondus, y compris les mois à venir déjà planifiés)
  const parMois = useMemo(() => {
    const map = new Map()
    for (const c of cours) ajouter(map, moisKeyFromDate(c.date), c.prix, 'cours')
    for (const e of veloEntries) ajouter(map, e.mois, e.montant, 'velo')
    for (const e of etudes) ajouter(map, moisKeyFromDate(e.date), e.prix, 'etudes')
    return map
  }, [cours, veloEntries, etudes])

  // Historique : jusqu'au mois actuel inclus, du plus récent au plus ancien
  const historique = useMemo(
    () =>
      Array.from(parMois.entries())
        .filter(([key]) => key <= moisActuel)
        .sort((a, b) => (a[0] < b[0] ? 1 : -1)),
    [parMois, moisActuel]
  )

  // Année en cours : ce qui est déjà gagné (jusqu'au mois actuel) + ce qui est prévu ensuite
  const annee = useMemo(() => {
    const gagne = moisVide()
    let prevu = 0
    for (const [key, v] of parMois.entries()) {
      if (anneeDeMoisKey(key) !== anneeCourante) continue
      if (key <= moisActuel) {
        gagne.total += v.total
        gagne.parPoste.cours += v.parPoste.cours
        gagne.parPoste.velo += v.parPoste.velo
        gagne.parPoste.etudes += v.parPoste.etudes
      } else {
        prevu += v.total
      }
    }
    return { ...gagne, prevu }
  }, [parMois, anneeCourante, moisActuel])

  const ceMois = parMois.get(moisActuel) || moisVide()

  // --- Récap cours particuliers ---
  const recapCours = useMemo(() => {
    const parEleve = new Map()
    let presteNonPaye = 0
    let nbPresteNonPaye = 0
    let prochain = null
    let nbCeMois = 0
    for (const c of cours) {
      const passe = coursEstPasse(c.date)
      if (moisKeyFromDate(c.date) === moisActuel) nbCeMois += 1
      if (passe && !c.paye) {
        presteNonPaye += c.prix
        nbPresteNonPaye += 1
        const id = idEleve(c.eleve)
        if (!parEleve.has(id)) parEleve.set(id, { nom: c.eleve, montant: 0, nombre: 0 })
        const e = parEleve.get(id)
        e.montant += c.prix
        e.nombre += 1
      }
      if (!passe && (!prochain || enDate(c.date) < enDate(prochain.date))) prochain = c
    }
    return {
      presteNonPaye,
      nbPresteNonPaye,
      parEleve: Array.from(parEleve.values()).sort((a, b) => b.montant - a.montant),
      prochain,
      nbCeMois,
    }
  }, [cours, moisActuel])

  // --- Récap vélo ---
  const recapVelo = useMemo(() => {
    let nonPayeTermine = 0
    let moisNonPayes = 0
    let kmAnnee = 0
    for (const e of veloEntries) {
      if (!e.paye && moisEstTermine(e.mois)) {
        nonPayeTermine += e.montant
        moisNonPayes += 1
      }
      if (anneeDeMoisKey(e.mois) === anneeCourante) {
        kmAnnee += (e.allersRetours || 0) * 2 * (e.distanceKm || 0)
      }
    }
    const ceMoisEntree = veloEntries.find((e) => e.mois === moisActuel) || null
    return { nonPayeTermine, moisNonPayes, kmAnnee, ceMoisEntree }
  }, [veloEntries, anneeCourante, moisActuel])

  // --- Récap études ---
  const recapEtudes = useMemo(() => {
    let presteNonPaye = 0
    let nbPresteNonPaye = 0
    let nbCeMois = 0
    let prochaine = null
    for (const e of etudes) {
      const passee = etudeEstPassee(e.date)
      if (passee && !e.paye) {
        presteNonPaye += e.prix
        nbPresteNonPaye += 1
      }
      if (moisKeyFromDate(e.date) === moisActuel) nbCeMois += 1
      if (!passee && (!prochaine || enDate(e.date) < enDate(prochaine.date))) prochaine = e
    }
    return { presteNonPaye, nbPresteNonPaye, nbCeMois, prochaine }
  }, [etudes, moisActuel])

  return {
    loading,
    cours,
    anneeCourante,
    moisActuel,
    annee,
    ceMois,
    historique,
    recapCours,
    recapVelo,
    recapEtudes,
  }
}
