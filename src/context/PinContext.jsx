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
    let settled = false

    // Si Firebase ne répond ni en succès ni en erreur après 8s (mauvaise config,
    // domaine non autorisé, variables d'env absentes...), on affiche un message
    // clair au lieu de rester bloqué sur "Connexion..." indéfiniment.
    const timeout = setTimeout(() => {
      if (!settled) {
        setError(
          "La connexion à Firebase prend trop de temps. Vérifie dans la console Firebase que l'authentification Anonyme est activée (Authentication → Sign-in method), que le domaine du site est dans la liste des domaines autorisés (Authentication → Settings → Authorized domains), et que toutes les variables VITE_FIREBASE_... sont bien configurées sur Vercel (puis redéploie)."
        )
      }
    }, 8000)

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          settled = true
          clearTimeout(timeout)
          setAuthReady(true)
        } else {
          signInAnonymously(auth).catch((err) => {
            settled = true
            clearTimeout(timeout)
            console.error('Erreur de connexion Firebase :', err.code, err.message)
            setError(
              `Impossible de se connecter à la base de données (${err.code || 'erreur inconnue'}). Vérifie la configuration Firebase (authentification Anonyme activée + variables d'environnement correctes).`
            )
          })
        }
      },
      (err) => {
        settled = true
        clearTimeout(timeout)
        console.error('Erreur onAuthStateChanged :', err)
        setError("Impossible de joindre Firebase. Vérifie ta connexion internet et la configuration du projet.")
      }
    )

    return () => {
      clearTimeout(timeout)
      unsubscribe()
    }
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
