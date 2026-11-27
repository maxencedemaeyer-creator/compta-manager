import { useEffect, useState } from 'react'
import { continentsGeo, frontieresGeo } from '../utils/atlasMonde.js'

// Charge (une seule fois, à l'ouverture de la série) les continents et les frontières en longitude / latitude.
let enMemoire = null

export function useAtlasMonde() {
  const [donnees, setDonnees] = useState(enMemoire)
  const [erreur, setErreur] = useState(null)
  useEffect(() => {
    if (enMemoire) return
    let actif = true
    import('../data/atlas-monde.json')
      .then((m) => {
        enMemoire = enMemoire || { continents: continentsGeo(m.default), frontieres: frontieresGeo(m.default) }
        if (actif) setDonnees(enMemoire)
      })
      .catch((e) => actif && setErreur(e))
    return () => {
      actif = false
    }
  }, [])
  return { ...(donnees || {}), erreur }
}
