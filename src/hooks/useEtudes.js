import { useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase/config.js'
import { useFirestoreCollection } from './useFirestoreCollection.js'
import { usePin } from '../context/PinContext.jsx'
import { withTimeout } from '../utils/withTimeout.js'
import { moisKeyFromDate } from '../utils/dates.js'

const CONFIG_REF = 'config/etudes'
const COLLECTION = 'etudes'

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

// Chaque étude est désormais un enregistrement individuel daté (même logique que les cours),
// ce qui permet de les afficher/ajouter/supprimer jour par jour dans le calendrier.
export function useEtudes() {
  const { data, loading, error } = useFirestoreCollection(COLLECTION, 'date', 'desc')

  async function addEtude({ date, prix }) {
    await withTimeout(
      addDoc(collection(db, COLLECTION), {
        date: Timestamp.fromDate(new Date(date)),
        prix: Number(prix),
        paye: false,
        createdAt: serverTimestamp(),
      })
    )
  }

  async function addEtudesSerie({ dates, prix }) {
    const batch = writeBatch(db)
    dates.forEach((date) => {
      const ref = doc(collection(db, COLLECTION))
      batch.set(ref, {
        date: Timestamp.fromDate(new Date(date)),
        prix: Number(prix),
        paye: false,
        createdAt: serverTimestamp(),
      })
    })
    await withTimeout(batch.commit())
  }

  async function removeEtude(id) {
    await withTimeout(deleteDoc(doc(db, COLLECTION, id)))
  }

  // Bascule le statut payé/non payé de toutes les études d'un mois donné en une fois
  // (les études d'un même mois sont facturées ensemble, comme dans l'ancienne vue mensuelle).
  async function toggleMoisPaye(moisKey, currentPaye) {
    const concernees = data.filter((e) => moisKeyFromDate(e.date) === moisKey)
    if (concernees.length === 0) return
    const batch = writeBatch(db)
    concernees.forEach((e) => {
      batch.update(doc(db, COLLECTION, e.id), { paye: !currentPaye })
    })
    await withTimeout(batch.commit())
  }

  return { etudes: data, loading, error, addEtude, addEtudesSerie, removeEtude, toggleMoisPaye }
}
