import { useEffect, useState } from 'react'
import {
  FieldPath,
  collection,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase/config.js'
import { usePin } from '../context/PinContext.jsx'
import { withTimeout } from '../utils/withTimeout.js'
import { pivoterImage, preparerPhotoProjection } from '../utils/image.js'
import { reconnaitreTexte } from '../utils/ocr.js'
import { canvasEnFichier, lireDocument, typeFichier } from '../utils/document.js'
import { titreDepuis } from '../utils/lecture.js'
import { definirCorrections } from '../utils/phonemes.js'

// =============================================================
//  Données de l'appli « Lis-moi » (Firebase) — historique de la classe
//  - lectures/{id}             : titre, texte, miniature, pages, source
//                                (photo | pdf | word | texte), nomFichier, dates,
//                                douteux (mots mal reconnus probables, à vérifier)
//  - lectures_images/{id}_{n}  : la photo de la page n (n = 0, 1, …)
// =============================================================
const LECTURES = 'lectures'
const IMAGES = 'lectures_images'

export const PAS_DE_TEXTE = 'PAS_DE_TEXTE'

// Photo → texte reconnu + image prête pour Firebase (redressée si besoin)
async function traiterPhoto(file, onProgression) {
  const ocr = await reconnaitreTexte(file, onProgression)
  pasDeTexte(ocr.texte)
  let photo = await preparerPhotoProjection(file)
  if (ocr.rotation) photo = await pivoterImage(photo.image, ocr.rotation)
  return { texte: ocr.texte, photo, douteux: ocr.douteux || [] }
}

const MESSAGE_LENT = "L'enregistrement prend trop de temps. Vérifie la connexion et réessaie."

function pasDeTexte(texte) {
  if (texte.replace(/[^\p{L}]/gu, '').length >= 3) return
  const e = new Error("Je n'ai pas trouvé de texte.")
  e.code = PAS_DE_TEXTE
  throw e
}

// Nouvelle lecture à partir d'une photo ou d'un document (PDF, Word, texte)
export async function creerLecture(file, onProgression) {
  const estImage = typeFichier(file) === 'image'
  let texte
  let photos = []
  let douteux = []
  let source = 'photo'

  if (estImage) {
    const r = await traiterPhoto(file, onProgression)
    texte = r.texte
    photos = [r.photo]
    douteux = r.douteux
  } else {
    // le texte compte pour 90 % de la progression, les images des pages pour le reste
    const lu = await lireDocument(file, (p, etape) => onProgression(p * 0.9, etape))
    pasDeTexte(lu.texte)
    texte = lu.texte
    source = lu.source
    douteux = lu.douteux || []
    onProgression(0.92, 'Je range les pages…')
    for (const canvas of lu.images) photos.push(await preparerPhotoProjection(await canvasEnFichier(canvas)))
  }
  onProgression(0.97, 'J’enregistre…')

  const id = doc(collection(db, LECTURES)).id
  // une page à la fois (chaque photo peut peser près de 1 Mo)
  for (const [n, photo] of photos.entries()) {
    await withTimeout(
      setDoc(doc(db, IMAGES, `${id}_${n}`), { data: photo.image, largeur: photo.largeur, hauteur: photo.hauteur }),
      60000,
      MESSAGE_LENT
    )
  }
  await withTimeout(
    setDoc(doc(db, LECTURES, id), {
      titre: titreDepuis(texte),
      texte,
      miniature: photos[0]?.miniature || null,
      pages: photos.length,
      douteux,
      source,
      nomFichier: estImage ? null : file.name || null,
      creeLe: serverTimestamp(),
      majLe: serverTimestamp(),
    }),
    60000,
    MESSAGE_LENT
  )
  return id
}

export async function ajouterPage(lecture, file, onProgression) {
  const { texte, photo, douteux } = await traiterPhoto(file, onProgression)
  const n = typeof lecture.pages === 'number' ? lecture.pages : 1
  const batch = writeBatch(db)
  batch.set(doc(db, IMAGES, `${lecture.id}_${n}`), { data: photo.image, largeur: photo.largeur, hauteur: photo.hauteur })
  batch.update(doc(db, LECTURES, lecture.id), {
    texte: `${lecture.texte}\n\n${texte}`,
    pages: n + 1,
    douteux: [...new Set([...(lecture.douteux || []), ...douteux])],
    ...(n === 0 ? { miniature: photo.miniature } : {}),
    majLe: serverTimestamp(),
  })
  await withTimeout(batch.commit(), 60000, "L'enregistrement prend trop de temps. Vérifie la connexion et réessaie.")
}

export async function modifierTexte(id, texte, autres = {}) {
  await withTimeout(updateDoc(doc(db, LECTURES, id), { texte, titre: titreDepuis(texte), ...autres, majLe: serverTimestamp() }))
}

// Autres champs (ex. douteux : liste des mots à vérifier)
export async function majLecture(id, champs) {
  await withTimeout(updateDoc(doc(db, LECTURES, id), { ...champs, majLe: serverTimestamp() }))
}

export async function supprimerLecture(lecture) {
  const batch = writeBatch(db)
  for (let n = 0; n < Math.max(1, lecture.pages || 0); n++) batch.delete(doc(db, IMAGES, `${lecture.id}_${n}`))
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

// =============================================================
//  Entraînement des sons (Max, PIN) — corrections des « sons en couleur »
//  - lectures_entrainement/corrections : { modeles: { mot: « monsi[eu:eu]r » } }
//    → lu par toutes les tablettes, appliqué partout aussitôt
//  - lectures_entrainement/progression : { verifies: { mot: 'ok' | 'corrige' } }
// =============================================================
const ENTRAINEMENT = 'lectures_entrainement'
const DOC_CORRECTIONS = doc(db, ENTRAINEMENT, 'corrections')
const DOC_PROGRESSION = doc(db, ENTRAINEMENT, 'progression')

/** Suit les corrections (temps réel) et les donne au moteur ; renvoie un numéro qui change à chaque mise à jour. */
export function useCorrectionsSons() {
  const { authReady } = usePin()
  const [version, setVersion] = useState(0)
  const [modeles, setModeles] = useState({})
  useEffect(() => {
    if (!authReady) return
    return onSnapshot(
      DOC_CORRECTIONS,
      (snap) => {
        const m = (snap.exists() && snap.data().modeles) || {}
        definirCorrections(m)
        setModeles(m)
        setVersion((v) => v + 1)
      },
      (err) => console.error('Erreur Firestore (corrections des sons) :', err)
    )
  }, [authReady])
  return { version, modeles }
}

/** Mots déjà vérifiés dans l'Entraînement (temps réel). */
export function useProgressionEntrainement() {
  const { authReady } = usePin()
  const [verifies, setVerifies] = useState(null)
  useEffect(() => {
    if (!authReady) return
    return onSnapshot(
      DOC_PROGRESSION,
      (snap) => setVerifies((snap.exists() && snap.data().verifies) || {}),
      (err) => {
        console.error('Erreur Firestore (progression entraînement) :', err)
        setVerifies({})
      }
    )
  }, [authReady])
  return verifies
}

export async function marquerMotVerifie(mot) {
  await withTimeout(setDoc(DOC_PROGRESSION, { verifies: { [mot]: 'ok' }, majLe: serverTimestamp() }, { merge: true }))
}

export async function enregistrerCorrectionSon(mot, modele) {
  await withTimeout(setDoc(DOC_CORRECTIONS, { modeles: { [mot]: modele }, majLe: serverTimestamp() }, { merge: true }))
  await withTimeout(setDoc(DOC_PROGRESSION, { verifies: { [mot]: 'corrige' }, majLe: serverTimestamp() }, { merge: true }))
}

/** Annule la décision sur un mot (« vérifié » et sa correction éventuelle). */
export async function annulerMotEntrainement(mot) {
  await withTimeout(updateDoc(DOC_PROGRESSION, new FieldPath('verifies', mot), deleteField())).catch(() => {})
  await withTimeout(updateDoc(DOC_CORRECTIONS, new FieldPath('modeles', mot), deleteField())).catch(() => {})
}
