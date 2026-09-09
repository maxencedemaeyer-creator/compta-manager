import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { auth } from '../firebase/config.js'
import { sha256Hex } from '../utils/hash.js'

const SESSION_KEY = 'cm_unlocked'
const PIN_HASH = import.meta.env.VITE_PIN_HASH

const PinContext = createContext(null)

export function PinProvider({ children }) {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === 'true')
  const [authReady, setAuthReady] = useState(false)
  const [error, setError] = useState('')

  // Authentification anonyme Firebase : nécessaire pour que les règles Firestore
  // ("autoriser seulement les utilisateurs authentifiés") laissent passer les requêtes.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthReady(true)
      } else {
        signInAnonymously(auth).catch((err) => {
          console.error('Erreur de connexion Firebase :', err)
          setError("Impossible de se connecter à la base de données. Réessaie plus tard.")
        })
      }
    })
    return unsubscribe
  }, [])

  const unlock = useCallback(async (pin) => {
    setError('')
    if (!PIN_HASH) {
      setError('Aucun VITE_PIN_HASH configuré. Vérifie ton fichier .env.')
      return false
    }
    const hash = await sha256Hex(pin)
    if (hash === PIN_HASH) {
      sessionStorage.setItem(SESSION_KEY, 'true')
      setUnlocked(true)
      return true
    }
    setError('Code PIN incorrect.')
    return false
  }, [])

  const lock = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY)
    setUnlocked(false)
  }, [])

  return (
    <PinContext.Provider value={{ unlocked, authReady, error, unlock, lock }}>
      {children}
    </PinContext.Provider>
  )
}

export function usePin() {
  const ctx = useContext(PinContext)
  if (!ctx) throw new Error('usePin doit être utilisé à l\'intérieur de <PinProvider>')
  return ctx
}
