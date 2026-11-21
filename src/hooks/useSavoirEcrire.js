import { useMemo, useRef } from 'react'
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config.js'
import { useFirestoreCollection } from './useFirestoreCollection.js'
import { withTimeout } from '../utils/withTimeout.js'

// =============================================================
//  Savoir écrire (Firebase)
//  savoirEcrireFiches/{id} : une « fiche d'évaluation »
//    { titre, requete, niveau, attendusIds[], historique[] (consignes déjà
//      tirées), favoris[] {sujet, forme, defi}, evalueLe ('AAAA-MM-JJ' ou null),
//      creeLe, majLe }
//  savoirEcrireIdees/{id} : une idée personnelle de Max
//    { texte, tags[], creeLe }
//  (Les attendus du programme restent dans le fichier JSON du site ;
//   l'ancien suivi « travaillé » reste dans laboFrancaisP5P6Statuts.)
// =============================================================
const FICHES = 'savoirEcrireFiches'
const IDEES = 'savoirEcrireIdees'
const HISTORIQUE_MAX = 60
const FAVORIS_MAX = 100

const enMs = (t) => (t?.toMillis ? t.toMillis() : Date.now())

export function aujourdhui() {
  return new Date().toLocaleDateString('sv-SE') // AAAA-MM-JJ à l'heure locale
}

export function useSavoirEcrire() {
  const fiches = useFirestoreCollection(FICHES)
  const idees = useFirestoreCollection(IDEES)

  const listeFiches = useMemo(
    () => [...fiches.data].sort((a, b) => enMs(b.majLe) - enMs(a.majLe)),
    [fiches.data]
  )
  const listeIdees = useMemo(
    () => [...idees.data].sort((a, b) => enMs(b.creeLe) - enMs(a.creeLe)),
    [idees.data]
  )

  // Toujours la dernière version des fiches, même dans une fonction appelée plus tard
  const dernieres = useRef(listeFiches)
  dernieres.current = listeFiches
  const fiche = (id) => dernieres.current.find((f) => f.id === id)

  async function creerFiche({ titre, requete, niveau, attendusIds }) {
    const ref = await withTimeout(
      addDoc(collection(db, FICHES), {
        titre,
        requete,
        niveau,
        attendusIds,
        historique: [],
        favoris: [],
        evalueLe: null,
        creeLe: serverTimestamp(),
        majLe: serverTimestamp(),
      })
    )
    return ref.id
  }

  async function majFiche(id, champs) {
    await withTimeout(updateDoc(doc(db, FICHES, id), { ...champs, majLe: serverTimestamp() }))
  }

  async function supprimerFiche(id) {
    await withTimeout(deleteDoc(doc(db, FICHES, id)))
  }

  // Retient qu'une consigne a été tirée pour ne pas la reproposer tout de suite
  async function noterTirage(id, consigneId) {
    const f = fiche(id)
    if (!f || !consigneId) return
    const historique = [...(f.historique || []).filter((x) => x !== consigneId), consigneId].slice(-HISTORIQUE_MAX)
    await withTimeout(updateDoc(doc(db, FICHES, id), { historique }))
  }

  async function ajouterFavori(id, favori) {
    const f = fiche(id)
    if (!f) return
    const favoris = [...(f.favoris || []), { ...favori, le: aujourdhui() }].slice(-FAVORIS_MAX)
    await withTimeout(updateDoc(doc(db, FICHES, id), { favoris }))
  }

  async function retirerFavori(id, index) {
    const f = fiche(id)
    if (!f) return
    const favoris = (f.favoris || []).filter((_, i) => i !== index)
    await withTimeout(updateDoc(doc(db, FICHES, id), { favoris }))
  }

  async function ajouterIdee({ texte, tags }) {
    await withTimeout(addDoc(collection(db, IDEES), { texte, tags, creeLe: serverTimestamp() }))
  }

  async function supprimerIdee(id) {
    await withTimeout(deleteDoc(doc(db, IDEES, id)))
  }

  return {
    fiches: listeFiches,
    idees: listeIdees,
    chargement: fiches.loading || idees.loading,
    erreur: fiches.error || idees.error,
    creerFiche,
    majFiche,
    supprimerFiche,
    noterTirage,
    ajouterFavori,
    retirerFavori,
    ajouterIdee,
    supprimerIdee,
  }
}
