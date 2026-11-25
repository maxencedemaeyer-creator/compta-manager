import { useEffect, useState } from 'react'
import { arrayRemove, arrayUnion, doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../../../firebase/config.js'
import { usePin } from '../../../context/PinContext.jsx'
import { docConfig, PROFIL_PRINCIPAL } from '../../../config/profils.js'
import { sha256Hex } from '../../../utils/hash.js'
import { withTimeout } from '../../../utils/withTimeout.js'
import { estVisible } from '../../../config/laboVisibilite.js'

// =============================================================
//  Réglages du labo choisis par le prof (page « Espace prof »).
//  Firebase : laboConfig/experiences  →  { masquees: ['espace', …], visibles: ['regles', …] }
//  Par défaut (document absent) toutes les expériences sont visibles,
//  et une nouvelle expérience est visible tant qu'on ne la masque pas.
//  Exception : une expérience marquée « masqueeParDefaut » (ex. « Règle de 3 »)
//  reste cachée aux élèves tant que le prof ne l'a pas activée (liste « visibles »).
// =============================================================

const refConfig = () => doc(db, 'laboConfig', 'experiences')

// Si Firebase ne répond pas du tout, on affiche tout après ce délai
// (mieux vaut un labo complet qu'un labo bloqué en classe).
const DELAI_SECOURS_MS = 8000

// Expériences masquées, en temps réel. `pret` = la réponse de Firebase est arrivée.
export function useLaboConfig() {
  const { authReady } = usePin()
  const [etat, setEtat] = useState({ masquees: [], visibles: [], pret: false })

  useEffect(() => {
    const secours = setTimeout(() => setEtat((e) => (e.pret ? e : { ...e, pret: true })), DELAI_SECOURS_MS)
    return () => clearTimeout(secours)
  }, [])

  useEffect(() => {
    if (!authReady) return
    return onSnapshot(
      refConfig(),
      (snap) => {
        const donnees = snap.exists() ? snap.data() : {}
        const liste = (cle) => (Array.isArray(donnees[cle]) ? donnees[cle] : [])
        setEtat({ masquees: liste('masquees'), visibles: liste('visibles'), pret: true })
      },
      (err) => {
        console.error('Erreur Firestore (réglages du labo) :', err)
        setEtat((e) => ({ ...e, pret: true }))
      }
    )
  }, [authReady])

  return etat
}

export { estVisible }

// Affiche (visible = true) ou masque une expérience pour les élèves
export async function reglerVisibilite(experience, visible) {
  const donnees = experience.masqueeParDefaut
    ? { visibles: visible ? arrayUnion(experience.id) : arrayRemove(experience.id) }
    : { masquees: visible ? arrayRemove(experience.id) : arrayUnion(experience.id) }
  await withTimeout(setDoc(refConfig(), { ...donnees, updatedAt: serverTimestamp() }, { merge: true }))
}

// Le code prof = le code d'accès de la plateforme de Maxence (config/securite,
// ou la variable VITE_PIN_HASH tant qu'il n'a pas été changé dans Paramètres).
// Rien n'est gardé sur la tablette de l'élève.
export async function verifierCodeProf(code) {
  const tape = await sha256Hex(code)
  const snap = await withTimeout(getDoc(docConfig(PROFIL_PRINCIPAL, 'securite')))
  const attendu = (snap.exists() && snap.data().pinHash) || import.meta.env.VITE_PIN_HASH || null
  if (!attendu) throw new Error("Aucun code d'accès n'est configuré sur la plateforme.")
  return tape === attendu
}
