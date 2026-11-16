import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { deleteDoc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth } from '../firebase/config.js'
import { sha256Hex } from '../utils/hash.js'
import { withTimeout } from '../utils/withTimeout.js'
import { PROFIL_PRINCIPAL, docConfig, profilDepuisChemin, trouverProfil } from '../config/profils.js'
import { envoyerMail } from '../config/email.js'

// « PIN oublié » : durée de validité du code reçu par mail, essais autorisés, délai entre deux envois
const CODE_VALIDITE_MS = 15 * 60000
const CODE_ESSAIS_MAX = 5
const CODE_DELAI_RENVOI_MS = 60000

// Chaque profil a son propre déverrouillage (une saisie du PIN par session et par profil)
const cleSession = (profilId) => `cm_unlocked_${profilId}`
const ACTIVITE_KEY = 'cm_derniere_activite'

// Ancienne clé (avant les profils) : on la reprend pour ne pas redemander le PIN à Maxence
if (sessionStorage.getItem('cm_unlocked') === 'true') {
  sessionStorage.setItem(cleSession(PROFIL_PRINCIPAL), 'true')
  sessionStorage.removeItem('cm_unlocked')
}

// PIN de départ de Maxence (variable Vercel). Dès que le PIN est changé dans Paramètres,
// c'est celui enregistré dans Firebase (config/securite) qui est utilisé.
const PIN_HASH_DEPART = import.meta.env.VITE_PIN_HASH

// Paramètres d'un profil enregistrés dans Firebase (config/site)
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

async function lireHashPin(profilId) {
  await withTimeout(authPrete, 15000, "La connexion à Firebase n'aboutit pas. Vérifie ta connexion et réessaie.")
  const snap = await withTimeout(getDoc(docConfig(profilId, 'securite')))
  const hashFirebase = snap.exists() ? snap.data().pinHash : null
  if (hashFirebase) return hashFirebase
  return profilId === PROFIL_PRINCIPAL ? PIN_HASH_DEPART || null : null
}

function lireDeverrouillages() {
  const etat = {}
  for (let i = 0; i < sessionStorage.length; i++) {
    const cle = sessionStorage.key(i)
    if (cle?.startsWith('cm_unlocked_') && sessionStorage.getItem(cle) === 'true') {
      etat[cle.replace('cm_unlocked_', '')] = true
    }
  }
  return etat
}

const PinContext = createContext(null)

export function PinProvider({ children }) {
  const location = useLocation()
  const profilId = profilDepuisChemin(location.pathname)

  const [deverrouilles, setDeverrouilles] = useState(lireDeverrouillages)
  const [authReady, setAuthReady] = useState(false)
  const [error, setError] = useState('')
  const [parametres, setParametres] = useState(PARAMETRES_PAR_DEFAUT)
  // 'inconnu' (en cours de vérification), 'existe', ou 'absent' (premier passage : PIN à créer)
  const [etatPin, setEtatPin] = useState('inconnu')
  const derniereEcriture = useRef(0)

  const unlocked = !!(profilId && deverrouilles[profilId])

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

  // On efface le message d'erreur et on applique l'habillage du profil (classe theme-… sur <html>)
  useEffect(() => {
    setError('')
    const theme = trouverProfil(profilId)?.theme
    const html = document.documentElement
    html.classList.forEach((c) => c.startsWith('theme-') && html.classList.remove(c))
    if (theme) html.classList.add(`theme-${theme}`)
  }, [profilId])

  // Le profil a-t-il déjà un PIN ? (sinon : écran de création au premier passage)
  useEffect(() => {
    if (!profilId) return
    if (profilId === PROFIL_PRINCIPAL) {
      setEtatPin('existe')
      return
    }
    if (!authReady) return
    let annule = false
    setEtatPin('inconnu')
    lireHashPin(profilId)
      .then((hash) => !annule && setEtatPin(hash ? 'existe' : 'absent'))
      .catch((err) => !annule && setError(err.message || 'Impossible de vérifier le code PIN.'))
    return () => {
      annule = true
    }
  }, [profilId, authReady])

  // Paramètres du profil, en temps réel
  useEffect(() => {
    setParametres(PARAMETRES_PAR_DEFAUT)
    if (!authReady || !profilId) return
    return onSnapshot(
      docConfig(profilId, 'site'),
      (snap) => setParametres({ ...PARAMETRES_PAR_DEFAUT, ...(snap.exists() ? snap.data() : {}) }),
      (err) => console.error(`Erreur Firestore (paramètres ${profilId}) :`, err)
    )
  }, [authReady, profilId])

  const marquerDeverrouille = useCallback((id, valeur) => {
    if (valeur) {
      sessionStorage.setItem(cleSession(id), 'true')
      sessionStorage.setItem(ACTIVITE_KEY, String(Date.now()))
    } else {
      sessionStorage.removeItem(cleSession(id))
    }
    setDeverrouilles((prev) => ({ ...prev, [id]: valeur }))
  }, [])

  const lock = useCallback(() => {
    if (profilId) marquerDeverrouille(profilId, false)
  }, [profilId, marquerDeverrouille])

  const unlock = useCallback(
    async (pin) => {
      if (!profilId) return false
      setError('')
      let hashAttendu
      try {
        hashAttendu = await lireHashPin(profilId)
      } catch (err) {
        setError(err.message || 'Impossible de vérifier le code PIN.')
        return false
      }
      if (!hashAttendu) {
        setError(
          profilId === PROFIL_PRINCIPAL
            ? 'Aucun code PIN configuré (VITE_PIN_HASH manquant sur Vercel).'
            : "Ce profil n'a pas encore de code PIN."
        )
        return false
      }
      if ((await sha256Hex(pin)) === hashAttendu) {
        marquerDeverrouille(profilId, true)
        return true
      }
      setError('Code PIN incorrect.')
      return false
    },
    [profilId, marquerDeverrouille]
  )

  // Premier passage : création du PIN du profil (seulement s'il n'en a pas encore)
  const creerPin = useCallback(
    async (pin) => {
      if (!profilId) return false
      setError('')
      try {
        if (await lireHashPin(profilId)) {
          setEtatPin('existe')
          setError('Un code PIN existe déjà pour ce profil.')
          return false
        }
        await withTimeout(
          setDoc(docConfig(profilId, 'securite'), {
            pinHash: await sha256Hex(pin),
            updatedAt: serverTimestamp(),
          })
        )
        setEtatPin('existe')
        marquerDeverrouille(profilId, true)
        return true
      } catch (err) {
        setError(err.message || 'Impossible de créer le code PIN.')
        return false
      }
    },
    [profilId, marquerDeverrouille]
  )

  // Changement du code PIN depuis la page Paramètres
  const changerPin = useCallback(
    async (ancien, nouveau) => {
      const hashActuel = await lireHashPin(profilId)
      if ((await sha256Hex(ancien)) !== hashActuel) {
        throw new Error('Le code PIN actuel est incorrect.')
      }
      await withTimeout(
        setDoc(docConfig(profilId, 'securite'), {
          pinHash: await sha256Hex(nouveau),
          updatedAt: serverTimestamp(),
        })
      )
    },
    [profilId]
  )

  // PIN oublié, étape 1 : un code à 6 chiffres est envoyé à l'adresse mail du profil
  const envoyerCodeReinitialisation = useCallback(async () => {
    const email = (parametres.email || '').trim()
    if (!email) throw new Error("Aucune adresse mail n'est enregistrée pour ce profil.")
    const ref = docConfig(profilId, 'reinitialisation')
    const precedent = await withTimeout(getDoc(ref))
    const envoyeLe = precedent.exists() ? precedent.data().envoyeLe || 0 : 0
    if (Date.now() - envoyeLe < CODE_DELAI_RENVOI_MS) {
      throw new Error('Un code vient d\'être envoyé. Attends une minute avant d\'en redemander un.')
    }
    const nombre = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000
    const code = String(nombre).padStart(6, '0')
    await withTimeout(
      setDoc(ref, {
        codeHash: await sha256Hex(`${profilId}:${code}`),
        expireLe: Date.now() + CODE_VALIDITE_MS,
        envoyeLe: Date.now(),
        essais: 0,
      })
    )
    await envoyerMail({ email, nom: trouverProfil(profilId)?.nom || '', code })
  }, [profilId, parametres.email])

  // PIN oublié, étape 2 : vérification du code puis enregistrement du nouveau PIN
  const reinitialiserPin = useCallback(
    async (code, nouveauPin) => {
      const ref = docConfig(profilId, 'reinitialisation')
      const snap = await withTimeout(getDoc(ref))
      if (!snap.exists()) throw new Error('Aucun code en cours. Demande un nouveau code.')
      const { codeHash, expireLe, essais = 0 } = snap.data()
      if (Date.now() > expireLe) {
        await deleteDoc(ref)
        throw new Error('Ce code a expiré. Demande un nouveau code.')
      }
      if (essais >= CODE_ESSAIS_MAX) {
        await deleteDoc(ref)
        throw new Error('Trop d\'essais. Demande un nouveau code.')
      }
      if ((await sha256Hex(`${profilId}:${code}`)) !== codeHash) {
        await setDoc(ref, { essais: essais + 1 }, { merge: true })
        const restants = CODE_ESSAIS_MAX - essais - 1
        throw new Error(
          restants > 0 ? `Code incorrect (encore ${restants} essai${restants > 1 ? 's' : ''}).` : 'Code incorrect. Demande un nouveau code.'
        )
      }
      await withTimeout(
        setDoc(docConfig(profilId, 'securite'), {
          pinHash: await sha256Hex(nouveauPin),
          updatedAt: serverTimestamp(),
        })
      )
      await deleteDoc(ref)
      setEtatPin('existe')
      marquerDeverrouille(profilId, true)
    },
    [profilId, marquerDeverrouille]
  )

  const majParametres = useCallback(
    async (changements) => {
      await withTimeout(setDoc(docConfig(profilId, 'site'), changements, { merge: true }))
    },
    [profilId]
  )

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
      if (window.location.pathname.includes('/projection/ecran')) {
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
      value={{
        profilId,
        unlocked,
        authReady,
        error,
        etatPin,
        unlock,
        creerPin,
        envoyerCodeReinitialisation,
        reinitialiserPin,
        lock,
        changerPin,
        parametres,
        majParametres,
      }}
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
