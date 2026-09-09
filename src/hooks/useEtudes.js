import { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config.js'
import { useFirestoreCollection } from './useFirestoreCollection.js'
import { usePin } from '../context/PinContext.jsx'

const CONFIG_REF = 'config/etudes'
const ENTRIES_COLLECTION = 'etudesEntries'

export function useEtudesConfig() {
  const { authReady } = usePin()
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authReady) return
    const ref = doc(db, CONFIG_REF)
    const unsubscribe = onSnapshot(ref, (snap) => {
      setConfig(snap.exists() ? snap.data() : { prixEtude: 0 })
      setLoading(false)
    })
    return unsubscribe
  }, [authReady])

  async function saveConfig({ prixEtude }) {
    await setDoc(doc(db, CONFIG_REF), {
      prixEtude: Number(prixEtude),
      updatedAt: serverTimestamp(),
    })
  }

  return { config, loading, saveConfig }
}

export function useEtudesEntries() {
  const { data, loading, error } = useFirestoreCollection(ENTRIES_COLLECTION, 'mois', 'desc')

  async function saveEntry({ mois, nombre, prixUnitaire, paye = false }) {
    const montant = Number(nombre) * Number(prixUnitaire)
    await setDoc(doc(db, ENTRIES_COLLECTION, mois), {
      mois,
      nombre: Number(nombre),
      prixUnitaire: Number(prixUnitaire),
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
