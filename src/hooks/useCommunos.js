import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase/config.js'
import { useFirestoreCollection } from './useFirestoreCollection.js'
import { withTimeout } from '../utils/withTimeout.js'

// =============================================================
//  COMMUNOS — parties enregistrées sur Firebase
//
//  « communos » : défi du jour (toute la Belgique), un document par jour
//     id = AAAA-MM-JJ → { date, cible, essais: [codes NIS], trouve, abandon, maj }
//
//  « communosLibres » : entraînement par province, un document par partie
//     → { mode: 'province', province, cible, essais, trouve, abandon, debut, maj }
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

export function useCommunosLibres() {
  const { data: libres, loading, error } = useFirestoreCollection('communosLibres')

  // Identifiant d'une nouvelle partie (créé avant le premier enregistrement)
  function nouvelId() {
    return doc(collection(db, 'communosLibres')).id
  }

  async function enregistrerLibre(id, champs) {
    await withTimeout(
      setDoc(doc(db, 'communosLibres', id), { mode: 'province', ...champs, maj: serverTimestamp() }, { merge: true })
    )
  }

  return { libres, loading, error, nouvelId, enregistrerLibre }
}
