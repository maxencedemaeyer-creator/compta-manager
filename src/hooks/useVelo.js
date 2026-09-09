import { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config.js'
import { useFirestoreCollection } from './useFirestoreCollection.js'
import { usePin } from '../context/PinContext.jsx'

const CONFIG_REF = 'config/velo'
const ENTRIES_COLLECTION = 'veloEntries'

export function useVeloConfig() {
  const { authReady } = usePin()
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authReady) return
    const ref = doc(db, CONFIG_REF)
    const unsubscribe = onSnapshot(ref, (snap) => {
      setConfig(snap.exists() ? snap.data() : { prixKm: 0, distanceKm: 0 })
      setLoading(false)
    })
    return unsubscribe
  }, [authReady])

  async function saveConfig({ prixKm, distanceKm }) {
    await setDoc(doc(db, CONFIG_REF), {
      prixKm: Number(prixKm),
      distanceKm: Number(distanceKm),
      updatedAt: serverTimestamp(),
    })
  }

  return { config, loading, saveConfig }
}

export function useVeloEntries() {
  const { data, loading, error } = useFirestoreCollection(ENTRIES_COLLECTION, 'mois', 'desc')

  // "allersRetours" représente le nombre d'ALLERS-RETOURS effectués dans le mois.
  // "distanceKm" est la distance ALLER SIMPLE (domicile → école), configurée dans les paramètres.
  // Calcul : allers-retours × 2 (aller + retour) × distance aller simple × prix/km.
  // Le montant est figé au moment de l'enregistrement (snapshot du prix/km et de la distance),
  // pour que l'historique reste correct même si la config change plus tard.
  async function saveEntry({ mois, allersRetours, distanceKm, prixKm, paye = false }) {
    const montant = Number(allersRetours) * 2 * Number(distanceKm) * Number(prixKm)
    await setDoc(doc(db, ENTRIES_COLLECTION, mois), {
      mois,
      allersRetours: Number(allersRetours),
      distanceKm: Number(distanceKm),
      prixKm: Number(prixKm),
      montant,
      paye,
      updatedAt: serverTimestamp(),
    })
  }

  async function togglePaye(mois, currentPaye) {
    await setDoc(doc(db, ENTRIES_COLLECTION, mois), { paye: !currentPaye }, { merge: true })
  }

  return { entries: data, loading, error, saveEntry, togglePaye }
}
