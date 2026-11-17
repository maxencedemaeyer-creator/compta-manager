import { useCallback, useEffect, useState } from 'react'
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase/config.js'
import { usePin } from '../context/PinContext.jsx'
import { withTimeout } from '../utils/withTimeout.js'
import { pivoterImage, preparerPhotoProjection } from '../utils/image.js'

// =============================================================
//  Données de l'application Projection (Firebase)
//  - projection_photos/{id}  : infos + miniature (pour la galerie)
//  - projection_images/{id}  : l'image en grand (chargée seulement à l'écran)
//  - projection_etat/ecran   : la photo affichée sur l'écran de la classe
// =============================================================
const PHOTOS = 'projection_photos'
const IMAGES = 'projection_images'
const ETAT = doc(db, 'projection_etat', 'ecran')

// Envoi depuis le téléphone : enregistre la photo et l'affiche tout de suite à l'écran
export async function envoyerPhoto(file) {
  const { image, miniature, largeur, hauteur, taille } = await preparerPhotoProjection(file)
  const id = doc(collection(db, PHOTOS)).id
  const batch = writeBatch(db)
  batch.set(doc(db, IMAGES, id), { data: image })
  batch.set(doc(db, PHOTOS, id), { miniature, largeur, hauteur, taille, creeLe: serverTimestamp() })
  batch.set(ETAT, { photoId: id, majLe: serverTimestamp() })
  await withTimeout(batch.commit(), 60000, "L'envoi prend trop de temps. Vérifie la connexion et réessaie.")
  return id
}

export async function projeter(photoId) {
  await withTimeout(setDoc(ETAT, { photoId, majLe: serverTimestamp() }))
}

export async function masquer() {
  await withTimeout(setDoc(ETAT, { photoId: null, majLe: serverTimestamp() }))
}

// Photo actuellement projetée (temps réel), avec l'image en grand
export function useEcranProjection() {
  const { authReady } = usePin()
  const [photoId, setPhotoId] = useState(undefined) // undefined = chargement
  const [image, setImage] = useState(null)

  useEffect(() => {
    if (!authReady) return
    return onSnapshot(
      ETAT,
      (snap) => setPhotoId(snap.exists() ? snap.data().photoId || null : null),
      (err) => console.error('Erreur Firestore (projection_etat) :', err)
    )
  }, [authReady])

  useEffect(() => {
    if (!photoId) {
      setImage(null)
      return
    }
    // Temps réel : si la photo est pivotée depuis la galerie, l'écran se met à jour
    return onSnapshot(
      doc(db, IMAGES, photoId),
      (snap) => setImage(snap.exists() ? snap.data().data : null),
      (err) => console.error('Erreur Firestore (projection_images) :', err)
    )
  }, [photoId])

  return { chargement: photoId === undefined, photoId, image }
}

// Galerie : toutes les photos (miniatures), de la plus récente à la plus ancienne
export function useGalerieProjection() {
  const { authReady } = usePin()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [photoProjetee, setPhotoProjetee] = useState(null)

  useEffect(() => {
    if (!authReady) return
    const stop1 = onSnapshot(
      query(collection(db, PHOTOS), orderBy('creeLe', 'desc')),
      (snap) => {
        setPhotos(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        console.error('Erreur Firestore (projection_photos) :', err)
        setLoading(false)
      }
    )
    const stop2 = onSnapshot(ETAT, (snap) => setPhotoProjetee(snap.exists() ? snap.data().photoId : null))
    return () => {
      stop1()
      stop2()
    }
  }, [authReady])

  const supprimer = useCallback(
    async (ids) => {
      // Firebase accepte 500 opérations par lot : 2 par photo → paquets de 200
      for (let i = 0; i < ids.length; i += 200) {
        const batch = writeBatch(db)
        ids.slice(i, i + 200).forEach((id) => {
          batch.delete(doc(db, PHOTOS, id))
          batch.delete(doc(db, IMAGES, id))
        })
        await withTimeout(batch.commit(), 60000)
      }
      if (photoProjetee && ids.includes(photoProjetee)) await masquer()
    },
    [photoProjetee]
  )

  const tailleTotale = photos.reduce((s, p) => s + (p.taille || 0), 0)

  return { photos, loading, photoProjetee, supprimer, tailleTotale }
}

// Image en grand d'une photo (pour l'aperçu dans la galerie)
export async function lireImage(photoId) {
  const snap = await withTimeout(getDoc(doc(db, IMAGES, photoId)))
  return snap.exists() ? snap.data().data : null
}

// Pivote une photo d'un quart de tour (sens = 1 horaire, -1 antihoraire)
// et renvoie la nouvelle image en grand
export async function pivoterPhoto(photoId, sens = 1) {
  const actuelle = await lireImage(photoId)
  if (!actuelle) throw new Error('Photo introuvable.')
  const { image, miniature, largeur, hauteur, taille } = await pivoterImage(actuelle, sens)
  const batch = writeBatch(db)
  batch.set(doc(db, IMAGES, photoId), { data: image })
  batch.update(doc(db, PHOTOS, photoId), { miniature, largeur, hauteur, taille })
  await withTimeout(batch.commit(), 60000, "La rotation prend trop de temps. Vérifie la connexion et réessaie.")
  return image
}
