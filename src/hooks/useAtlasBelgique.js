import { useEffect, useState } from 'react'
import { preparerCarte } from '../utils/communos.js'

// Charge (une seule fois, à l'ouverture de la carte) les communes de COMMUNOS
// et les compléments de l'ATLAS (frontières, rivières, villes).
let enMemoire = null

export function useAtlasBelgique() {
  const [donnees, setDonnees] = useState(enMemoire)
  const [erreur, setErreur] = useState(null)
  useEffect(() => {
    if (enMemoire) return
    let actif = true
    Promise.all([import('../data/communos-communes.json'), import('../data/atlas-belgique.json')])
      .then(([communes, atlas]) => {
        enMemoire = enMemoire || { carte: preparerCarte(communes.default), atlas: atlas.default }
        if (actif) setDonnees(enMemoire)
      })
      .catch((e) => actif && setErreur(e))
    return () => {
      actif = false
    }
  }, [])
  return { ...(donnees || {}), erreur }
}
