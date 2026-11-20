import { useEffect, useState } from 'react'
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase/config.js'
import { usePin } from '../context/PinContext.jsx'
import { withTimeout } from '../utils/withTimeout.js'
import { pivoterImage, preparerPhotoProjection } from '../utils/image.js'
import { reconnaitreTexte } from '../utils/ocr.js'
import { titreDepuis } from '../utils/lecture.js'

// =============================================================
//  Données de l'appli « Lis-moi » (Firebase) — historique de la classe
//  - lectures/{id}             : titre, texte, miniature, pages, dates
//  - lectures_images/{id}_{n}  : la photo de la page n (n = 0, 1, …)
// =============================================================
const LECTURES = 'lectures'
const IMAGES = 'lectures_images'

export const PAS_DE_TEXTE = 'PAS_DE_TEXTE'

// Photo → texte reconnu + image prête pour Firebase (redressée si besoin)
async function traiterPhoto(file, onProgression) {
  const ocr = await reconnaitreTexte(file, onProgression)
  if (ocr.texte.replace(/[^\p{L}]/gu, '').length < 3) {
    const e = new Error("Je n'ai pas trouvé de texte sur cette photo.")
    e.code = PAS_DE_TEXTE
    throw e
  }
  let photo = await preparerPhotoProjection(file)
  if (ocr.rotation) photo = await pivoterImage(photo.image, ocr.rotation)
  return { texte: ocr.texte, photo }
}

export async function creerLecture(file, onProgression) {
  const { texte, photo } = await traiterPhoto(file, onProgression)
  const id = doc(collection(db, LECTURES)).id
  const batch = writeBatch(db)
  batch.set(doc(db, IMAGES, `${id}_0`), { data: photo.image, largeur: photo.largeur, hauteur: photo.hauteur })
  batch.set(doc(db, LECTURES, id), {
    titre: titreDepuis(texte),
    texte,
    miniature: photo.miniature,
    pages: 1,
    creeLe: serverTimestamp(),
    majLe: serverTimestamp(),
  })
  await withTimeout(batch.commit(), 60000, "L'enregistrement prend trop de temps. Vérifie la connexion et réessaie.")
  return id
}

export async function ajouterPage(lecture, file, onProgression) {
  const { texte, photo } = await traiterPhoto(file, onProgression)
  const n = lecture.pages || 1
  const batch = writeBatch(db)
  batch.set(doc(db, IMAGES, `${lecture.id}_${n}`), { data: photo.image, largeur: photo.largeur, hauteur: photo.hauteur })
  batch.update(doc(db, LECTURES, lecture.id), {
    texte: `${lecture.texte}\n\n${texte}`,
    pages: n + 1,
    majLe: serverTimestamp(),
  })
  await withTimeout(batch.commit(), 60000, "L'enregistrement prend trop de temps. Vérifie la connexion et réessaie.")
}

export async function modifierTexte(id, texte) {
  await withTimeout(updateDoc(doc(db, LECTURES, id), { texte, titre: titreDepuis(texte), majLe: serverTimestamp() }))
}

export async function supprimerLecture(lecture) {
  const batch = writeBatch(db)
  for (let n = 0; n < (lecture.pages || 1); n++) batch.delete(doc(db, IMAGES, `${lecture.id}_${n}`))
  batch.delete(doc(db, LECTURES, lecture.id))
  await withTimeout(batch.commit(), 30000)
}

export async function lireImagePage(id, n) {
  const snap = await withTimeout(getDoc(doc(db, IMAGES, `${id}_${n}`)))
  return snap.exists() ? snap.data().data : null
}

// Toutes les lectures, de la plus récente à la plus ancienne
export function useLectures() {
  const { authReady } = usePin()
  const [lectures, setLectures] = useState([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    if (!authReady) return
    return onSnapshot(
      query(collection(db, LECTURES), orderBy('creeLe', 'desc')),
      (snap) => {
        setLectures(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setChargement(false)
      },
      (err) => {
        console.error('Erreur Firestore (lectures) :', err)
        setChargement(false)
      }
    )
  }, [authReady])

  return { lectures, chargement }
}

// Une lecture (temps réel). undefined = chargement, null = introuvable
export function useLecture(id) {
  const { authReady } = usePin()
  const [lecture, setLecture] = useState(undefined)

  useEffect(() => {
    if (!authReady || !id) return
    return onSnapshot(
      doc(db, LECTURES, id),
      (snap) => setLecture(snap.exists() ? { id: snap.id, ...snap.data() } : null),
      (err) => {
        console.error('Erreur Firestore (lecture) :', err)
        setLecture(null)
      }
    )
  }, [authReady, id])

  return lecture
}
