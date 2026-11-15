import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config.js'
import { sha256Hex } from '../utils/hash.js'
import { withTimeout } from '../utils/withTimeout.js'

const SESSION_KEY = 'cm_unlocked'
const ACTIVITE_KEY = 'cm_derniere_activite'

// PIN de départ (variable Vercel). Dès que le PIN est changé dans Paramètres,
// c'est celui enregistré dans Firebase (config/securite) qui est utilisé.
const PIN_HASH_DEPART = import.meta.env.VITE_PIN_HASH

// Paramètres du site enregistrés dans Firebase (config/site)
export const PARAMETRES_PAR_DEFAUT = {
  verrouillageMinutes: 0, // 0 = jamais
  appsMasquees: [],
  appsOrdre: [],
  derniereSauvegarde: null,
}

// Promesse résolue quand la connexion anonyme à Firebase est prête
let resoudreAuth
const authPrete = new Promise((r) => {
  resoudreAuth = r
})

async function lireHashPin() {
  await withTimeout(authPrete, 15000, "La connexion à Firebase n'aboutit pas. Vérifie ta connexion et réessaie.")
  const snap = await withTimeout(getDoc(doc(db, 'config', 'securite')))
  const hashFirebase = snap.exists() ? snap.data().pinHash : null
  return hashFirebase || PIN_HASH_DEPART || null
}

const PinContext = createContext(null)

export function PinProvider({ children }) {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === 'true')
  const [authReady, setAuthReady] = useState(false)
  const [error, setError] = useState('')
  const [parametres, setParametres] = useState(PARAMETRES_PAR_DEFAUT)
  const derniereEcriture = useRef(0)

  // Authentification anonyme Firebase : nécessaire pour que les règles Firestore
  // ("autoriser seulement les utilisateurs authentifiés") laissent passer les requêtes.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthReady(true)
        setError('')
        resoudreAuth()
      } else {
        withTimeout(
          signInAnonymously(auth),
          15000,
          "La connexion à Firebase n'aboutit pas (réseau bloqué ou VPN actif ?). Vérifie ta connexion et réessaie."
        ).catch((err) => {
          console.error('Erreur de connexion Firebase :', err)
          const detail = err.code ? ` (${err.code})` : err.message ? ` — ${err.message}` : ''
          setError(`Impossible de se connecter à la base de données${detail}.`)
        })
      }
    })
    return unsubscribe
  }, [])

  // Paramètres du site, en temps réel
  useEffect(() => {
    if (!authReady) return
    return onSnapshot(
      doc(db, 'config', 'site'),
      (snap) => setParametres({ ...PARAMETRES_PAR_DEFAUT, ...(snap.exists() ? snap.data() : {}) }),
      (err) => console.error('Erreur Firestore (config/site) :', err)
    )
  }, [authReady])

  const lock = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY)
    setUnlocked(false)
  }, [])

  const unlock = useCallback(async (pin) => {
    setError('')
    let hashAttendu
    try {
      hashAttendu = await lireHashPin()
    } catch (err) {
      setError(err.message || 'Impossible de vérifier le code PIN.')
      return false
    }
    if (!hashAttendu) {
      setError('Aucun code PIN configuré (VITE_PIN_HASH manquant sur Vercel).')
      return false
    }
    if ((await sha256Hex(pin)) === hashAttendu) {
      sessionStorage.setItem(SESSION_KEY, 'true')
      sessionStorage.setItem(ACTIVITE_KEY, String(Date.now()))
      setUnlocked(true)
      return true
    }
    setError('Code PIN incorrect.')
    return false
  }, [])

  // Changement du code PIN depuis la page Paramètres
  const changerPin = useCallback(async (ancien, nouveau) => {
    const hashActuel = await lireHashPin()
    if ((await sha256Hex(ancien)) !== hashActuel) {
      throw new Error('Le code PIN actuel est incorrect.')
    }
    await withTimeout(
      setDoc(doc(db, 'config', 'securite'), {
        pinHash: await sha256Hex(nouveau),
        updatedAt: serverTimestamp(),
      })
    )
  }, [])

  const majParametres = useCallback(async (changements) => {
    await withTimeout(setDoc(doc(db, 'config', 'site'), changements, { merge: true }))
  }, [])

  // Verrouillage automatique après X minutes sans activité
  useEffect(() => {
    const minutes = Number(parametres.verrouillageMinutes) || 0
    if (!unlocked || minutes <= 0) return

    function noterActivite() {
      const maintenant = Date.now()
      if (maintenant - derniereEcriture.current < 5000) return
      derniereEcriture.current = maintenant
      sessionStorage.setItem(ACTIVITE_KEY, String(maintenant))
    }
    function verifier() {
      // L'écran de projection reste allumé sans activité en classe : jamais verrouillé
      if (window.location.pathname.startsWith('/projection/ecran')) {
        sessionStorage.setItem(ACTIVITE_KEY, String(Date.now()))
        return
      }
      const derniere = Number(sessionStorage.getItem(ACTIVITE_KEY)) || Date.now()
      if (Date.now() - derniere > minutes * 60000) lock()
    }

    verifier()
    const evenements = ['pointerdown', 'keydown', 'scroll', 'touchstart']
    evenements.forEach((e) => window.addEventListener(e, noterActivite, { passive: true }))
    document.addEventListener('visibilitychange', verifier)
    const intervalle = setInterval(verifier, 20000)
    return () => {
      evenements.forEach((e) => window.removeEventListener(e, noterActivite))
      document.removeEventListener('visibilitychange', verifier)
      clearInterval(intervalle)
    }
  }, [unlocked, parametres.verrouillageMinutes, lock])

  return (
    <PinContext.Provider
      value={{ unlocked, authReady, error, unlock, lock, changerPin, parametres, majParametres }}
    >
      {children}
    </PinContext.Provider>
  )
}

export function usePin() {
  const ctx = useContext(PinContext)
  if (!ctx) throw new Error('usePin doit être utilisé à l\'intérieur de <PinProvider>')
  return ctx
}
