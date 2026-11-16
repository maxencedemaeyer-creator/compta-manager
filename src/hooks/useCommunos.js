import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase/config.js'
import { useFirestoreCollection } from './useFirestoreCollection.js'
import { withTimeout } from '../utils/withTimeout.js'

// =============================================================
//  COMMUNOS — parties enregistrées sur Firebase
//  Collection « communos » : un document par jour (id = AAAA-MM-JJ)
//  { date, cible, essais: [codes NIS], trouve, abandon, maj }
// =============================================================
export function useCommunos() {
  const { data: parties, loading, error } = useFirestoreCollection('communos')

  async function enregistrer(date, champs) {
    await withTimeout(
      setDoc(doc(db, 'communos', date), { date, ...champs, maj: serverTimestamp() }, { merge: true })
    )
  }

  return { parties, loading, error, enregistrer }
}
