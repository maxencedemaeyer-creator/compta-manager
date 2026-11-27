import { useEffect, useState } from 'react'
import { continentsGeo } from '../utils/atlasMonde.js'

// Charge (une seule fois, à l'ouverture de la série) les continents en longitude / latitude.
let enMemoire = null

export function useAtlasMonde() {
  const [continents, setContinents] = useState(enMemoire)
  const [erreur, setErreur] = useState(null)
  useEffect(() => {
    if (enMemoire) return
    let actif = true
    import('../data/atlas-monde.json')
      .then((m) => {
        enMemoire = enMemoire || continentsGeo(m.default)
        if (actif) setContinents(enMemoire)
      })
      .catch((e) => actif && setErreur(e))
    return () => {
      actif = false
    }
  }, [])
  return { continents, erreur }
}
