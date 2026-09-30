import { useMemo } from 'react'
import { doc, deleteDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase/config.js'
import { useFirestoreCollection } from './useFirestoreCollection.js'

// Collection dédiée au labo (référentiel français P5-P6), séparée de toute
// donnée comptable réelle. Un doc par "attendu" encodé ; id du doc = id de
// l'attendu dans le JSON.
const COLLECTION = 'laboFrancaisP5P6Statuts'

export function useLaboStatuts() {
  const { data, loading, error } = useFirestoreCollection(COLLECTION)

  const statuts = useMemo(() => {
    const map = {}
    data.forEach((item) => {
      map[item.id] = item
    })
    return map
  }, [data])

  async function marquerTravaille(attenduId, date) {
    await setDoc(doc(db, COLLECTION, String(attenduId)), {
      travaille: true,
      date,
      updatedAt: serverTimestamp(),
    })
  }

  async function marquerNonTravaille(attenduId) {
    await deleteDoc(doc(db, COLLECTION, String(attenduId)))
  }

  async function changerDate(attenduId, date) {
    await setDoc(doc(db, COLLECTION, String(attenduId)), { date }, { merge: true })
  }

  return { statuts, loading, error, marquerTravaille, marquerNonTravaille, changerDate }
}
