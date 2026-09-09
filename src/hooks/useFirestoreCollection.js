import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase/config.js'
import { usePin } from '../context/PinContext.jsx'

// Hook générique : écoute en temps réel une collection Firestore.
// N'interroge Firestore qu'une fois l'authentification (anonyme) prête,
// pour respecter les règles de sécurité ("request.auth != null").
export function useFirestoreCollection(collectionName, orderByField = null, orderDirection = 'desc') {
  const { authReady } = usePin()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!authReady) return
    setLoading(true)
    const ref = collection(db, collectionName)
    const q = orderByField ? query(ref, orderBy(orderByField, orderDirection)) : ref

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setData(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        console.error(`Erreur Firestore (${collectionName}) :`, err)
        setError(err)
        setLoading(false)
      }
    )
    return unsubscribe
  }, [authReady, collectionName, orderByField, orderDirection])

  return { data, loading, error }
}
