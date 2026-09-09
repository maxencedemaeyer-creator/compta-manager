import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase/config.js'
import { useFirestoreCollection } from './useFirestoreCollection.js'
import { genererDatesRecurrentes } from '../utils/dates.js'
import { withTimeout } from '../utils/withTimeout.js'

const COLLECTION = 'cours'

export function useCoursParticuliers() {
  const { data, loading, error } = useFirestoreCollection(COLLECTION, 'date', 'desc')

  async function addCours({ eleve, prix, duree, date }) {
    await withTimeout(
      addDoc(collection(db, COLLECTION), {
        eleve,
        prix: Number(prix),
        duree: Number(duree),
        date: Timestamp.fromDate(new Date(date)),
        paye: false,
        createdAt: serverTimestamp(),
      })
    )
  }

  async function addCoursRecurrents({ eleve, prix, duree, dateDebut, nombreSeances }) {
    const dates = genererDatesRecurrentes(new Date(dateDebut), Number(nombreSeances))
    const batch = writeBatch(db)
    dates.forEach((date) => {
      const ref = doc(collection(db, COLLECTION))
      batch.set(ref, {
        eleve,
        prix: Number(prix),
        duree: Number(duree),
        date: Timestamp.fromDate(date),
        paye: false,
        createdAt: serverTimestamp(),
      })
    })
    await withTimeout(batch.commit())
  }

  async function togglePaye(id, currentPaye) {
    await withTimeout(updateDoc(doc(db, COLLECTION, id), { paye: !currentPaye }))
  }

  async function removeCours(id) {
    await withTimeout(deleteDoc(doc(db, COLLECTION, id)))
  }

  return { cours: data, loading, error, addCours, addCoursRecurrents, togglePaye, removeCours }
}
