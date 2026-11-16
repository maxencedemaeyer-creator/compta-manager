import { useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase/config.js'
import { usePin } from '../context/PinContext.jsx'
import { PROFIL_PRINCIPAL, trouverProfil } from '../config/profils.js'
import { withTimeout } from '../utils/withTimeout.js'

// =============================================================
//  Application Requêtes (Firebase)
//  Collection partagée entre les profils : requetes/{id}
//  { titre, description, auteurId, auteurNom, statut, reponse,
//    creeLe, majLe, statutLe }
//  - Maxence (profil principal) voit et gère toutes les requêtes.
//  - Les autres profils voient seulement les leurs.
// =============================================================
const REQUETES = 'requetes'

export const STATUTS = [
  { id: 'nouvelle', nom: 'Nouvelle', nomAuteur: 'Envoyée', point: 'bg-sky-500', pastille: 'bg-sky-50 text-sky-700 ring-sky-200' },
  { id: 'en_cours', nom: 'En cours', nomAuteur: 'En cours', point: 'bg-amber-500', pastille: 'bg-amber-50 text-amber-700 ring-amber-200' },
  { id: 'deployee', nom: 'Déployée', nomAuteur: 'Disponible', point: 'bg-emerald-500', pastille: 'bg-green-50 text-green-700 ring-green-200' },
  { id: 'cloturee', nom: 'Clôturée', nomAuteur: 'Clôturée', point: 'bg-slate-400', pastille: 'bg-slate-100 text-slate-600 ring-slate-200' },
]

export function trouverStatut(id) {
  return STATUTS.find((s) => s.id === id) || STATUTS[0]
}

const enMs = (t) => (t?.toMillis ? t.toMillis() : 0)

export function useRequetes() {
  const { authReady, profilId } = usePin()
  const estAdmin = profilId === PROFIL_PRINCIPAL
  const [requetes, setRequetes] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    if (!authReady || !profilId) return
    setChargement(true)
    const source = estAdmin
      ? collection(db, REQUETES)
      : query(collection(db, REQUETES), where('auteurId', '==', profilId))
    return onSnapshot(
      source,
      (snap) => {
        const liste = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        // Les plus récentes d'abord (une requête tout juste créée n'a pas encore sa date : en haut)
        liste.sort((a, b) => (enMs(b.creeLe) || Date.now()) - (enMs(a.creeLe) || Date.now()))
        setRequetes(liste)
        setChargement(false)
      },
      (err) => {
        console.error('Erreur Firestore (requetes) :', err)
        setErreur('Impossible de charger les requêtes.')
        setChargement(false)
      }
    )
  }, [authReady, profilId, estAdmin])

  async function creer({ titre, description }) {
    await withTimeout(
      addDoc(collection(db, REQUETES), {
        titre: titre.trim(),
        description: description.trim(),
        auteurId: profilId,
        auteurNom: trouverProfil(profilId)?.nom || profilId,
        statut: 'nouvelle',
        reponse: '',
        creeLe: serverTimestamp(),
        majLe: serverTimestamp(),
      })
    )
  }

  async function modifier(id, champs) {
    const maj = { ...champs, majLe: serverTimestamp() }
    if ('statut' in champs) maj.statutLe = serverTimestamp()
    await withTimeout(updateDoc(doc(db, REQUETES, id), maj))
  }

  async function supprimer(id) {
    await withTimeout(deleteDoc(doc(db, REQUETES, id)))
  }

  return { requetes, chargement, erreur, estAdmin, creer, modifier, supprimer }
}
