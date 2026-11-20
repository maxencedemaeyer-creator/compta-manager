import { useEffect, useState } from 'react'
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase/config.js'
import { usePin } from '../context/PinContext.jsx'

// =============================================================
//  Appli « Lis-moi » : rester dans le GRATUIT d'Azure
//  (0,5 million de caractères lus par mois sur une ressource Free F0)
//
//  1) Mémoire partagée des voix (lectures_voix) : un passage déjà lu
//     avec la même voix et la même vitesse est relu depuis Firebase,
//     sans redemander à Azure (gratuit). Effacée après 30 jours.
//  2) Compteur du mois (lectures_compteur/AAAA-MM) : chaque caractère
//     envoyé à Azure est compté ; au-delà du plafond, l'appli refuse
//     de lire jusqu'au mois suivant (marge de sécurité sous 500 000).
// =============================================================
export const PLAFOND_MENSUEL = 450000
const CACHE = 'lectures_voix'
const COMPTEUR = 'lectures_compteur'
const JOURS_CACHE = 30
const TAILLE_MAX_CACHE = 900000 // un document Firebase fait au plus 1 Mo

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

function moisCle(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function moisSuivant() {
  const d = new Date()
  return MOIS[(d.getMonth() + 1) % 12]
}

// Empreinte d'un passage (voix + vitesse + texte) = nom du document dans la mémoire
export async function cleVoix(voix, vitesse, texte) {
  const octets = new TextEncoder().encode(`${voix}|${vitesse}|${texte}`)
  const empreinte = await crypto.subtle.digest('SHA-256', octets)
  return [...new Uint8Array(empreinte)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function lireMemoireVoix(cle) {
  const snap = await getDoc(doc(db, CACHE, cle))
  return snap.exists() ? snap.data() : null
}

export async function enregistrerMemoireVoix(cle, { audio, mots }, caracteres) {
  if (!audio || audio.length > TAILLE_MAX_CACHE) return
  await setDoc(doc(db, CACHE, cle), { audio, mots, caracteres, creeLe: serverTimestamp() })
}

export async function caracteresDuMois() {
  const snap = await getDoc(doc(db, COMPTEUR, moisCle()))
  return snap.exists() ? snap.data().caracteres || 0 : 0
}

export async function compterCaracteres(n) {
  await setDoc(doc(db, COMPTEUR, moisCle()), { caracteres: increment(n), majLe: serverTimestamp() }, { merge: true })
}

// Efface les voix gardées depuis plus de 30 jours (un peu à chaque ouverture)
export async function nettoyerMemoireVoix() {
  const avant = Timestamp.fromMillis(Date.now() - JOURS_CACHE * 24 * 3600 * 1000)
  const snap = await getDocs(query(collection(db, CACHE), where('creeLe', '<', avant), limit(25)))
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)))
}

// Jauge du mois (temps réel)
export function useQuotaVoix() {
  const { authReady } = usePin()
  const [utilises, setUtilises] = useState(null)

  useEffect(() => {
    if (!authReady) return
    return onSnapshot(
      doc(db, COMPTEUR, moisCle()),
      (snap) => setUtilises(snap.exists() ? snap.data().caracteres || 0 : 0),
      () => setUtilises(null)
    )
  }, [authReady])

  return {
    utilises,
    plafond: PLAFOND_MENSUEL,
    pourcent: utilises === null ? null : Math.min(100, Math.round((utilises / PLAFOND_MENSUEL) * 100)),
  }
}
