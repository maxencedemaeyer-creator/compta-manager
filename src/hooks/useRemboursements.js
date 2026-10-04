import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../firebase/config.js'
import { useFirestoreCollection } from './useFirestoreCollection.js'
import { usePin } from '../context/PinContext.jsx'

const CONFIG_REF = 'config/remboursements'
const ENTRIES_COLLECTION = 'remboursementsEntries'

// "sens" d'un remboursement :
//  - 'doisPayer'   : c'est moi qui dois de l'argent à la personne
//  - 'doitMePayer' : c'est la personne qui me doit de l'argent
export const SENS_DOIS_PAYER = 'doisPayer'
export const SENS_DOIT_ME_PAYER = 'doitMePayer'

// Petite mémoire des personnes (stockée dans config/remboursements), pour ne pas retaper les noms.
export function useRemboursementsPersonnes() {
  const { authReady } = usePin()
  const [personnes, setPersonnes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authReady) return
    const ref = doc(db, CONFIG_REF)
    const unsubscribe = onSnapshot(ref, (snap) => {
      setPersonnes(snap.exists() ? snap.data().personnes || [] : [])
      setLoading(false)
    })
    return unsubscribe
  }, [authReady])

  async function ajouterPersonne(nouveauNom) {
    const nom = nouveauNom.trim()
    if (!nom) return
    const dejaPresent = personnes.some((p) => p.toLowerCase() === nom.toLowerCase())
    if (dejaPresent) return
    await setDoc(
      doc(db, CONFIG_REF),
      { personnes: [...personnes, nom].sort((a, b) => a.localeCompare(b, 'fr')), updatedAt: serverTimestamp() },
      { merge: true }
    )
  }

  return { personnes, loading, ajouterPersonne }
}

// Remboursements ponctuels : un doc par montant. Le regroupement par personne se fait côté client.
export function useRemboursementsEntries() {
  const { data, loading, error } = useFirestoreCollection(ENTRIES_COLLECTION)

  async function addRemboursement({ sens, personne, montant, motif }) {
    await addDoc(collection(db, ENTRIES_COLLECTION), {
      sens,
      personne: personne.trim(),
      montant: Number(montant),
      motif: (motif || '').trim(),
      paye: false,
      datePaye: null,
      createdAt: serverTimestamp(),
    })
  }

  // Marque une seule ligne comme payée (la date du jour est enregistrée automatiquement).
  async function payerUn(id) {
    await updateDoc(doc(db, ENTRIES_COLLECTION, id), {
      paye: true,
      datePaye: Timestamp.now(),
    })
  }

  // Marque plusieurs lignes comme payées d'un coup (bouton "Payer" d'une personne).
  async function payerPlusieurs(ids) {
    const batch = writeBatch(db)
    const maintenant = Timestamp.now()
    for (const id of ids) {
      batch.update(doc(db, ENTRIES_COLLECTION, id), { paye: true, datePaye: maintenant })
    }
    await batch.commit()
  }

  async function removeRemboursement(id) {
    await deleteDoc(doc(db, ENTRIES_COLLECTION, id))
  }

  return { entries: data, loading, error, addRemboursement, payerUn, payerPlusieurs, removeRemboursement }
}
