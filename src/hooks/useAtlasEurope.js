import { useEffect, useState } from 'react'
import { limiteGeo, paysGeo } from '../utils/atlasEurope.js'

// Charge (une seule fois, à l'ouverture de la série) les pays en longitude / latitude.
let enMemoire = null

export function useAtlasEurope() {
  const [donnees, setDonnees] = useState(enMemoire)
  const [erreur, setErreur] = useState(null)
  useEffect(() => {
    if (enMemoire) return
    let actif = true
    import('../data/atlas-europe.json')
      .then((m) => {
        enMemoire = enMemoire || { pays: paysGeo(m.default), limite: limiteGeo(m.default) }
        if (actif) setDonnees(enMemoire)
      })
      .catch((e) => actif && setErreur(e))
    return () => {
      actif = false
    }
  }, [])
  return { donnees, erreur }
}
