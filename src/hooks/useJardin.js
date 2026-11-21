import { useEffect, useState } from 'react'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase/config.js'
import { usePin } from '../context/PinContext.jsx'
import { withTimeout } from '../utils/withTimeout.js'
import { miniatureDepuisSource, preparerPhotoCouture } from '../utils/imageCouture.js'
import { baseDePlante, normaliser } from '../data/jardin/plantes.js'
import { anneeFenetre, cleTache, tachesDuMois } from '../utils/jardinCalendrier.js'

// =============================================================
//  Application « Mon jardin » (Firebase, à la racine comme le reste de Maxence)
//  - jardins/{id}                     : { nom, adresse, contact, telephone, notes, creeLe, majLe }
//  - jardins/{id}/plantes/{id}        : { planteId (base) | null, nomLibre, quantite, lieu ('interieur'|'exterieur'),
//                                         culture ('pot'|'terre'), notes, photoIds[], couverture, creeLe, majLe }
//  - jardins/{id}/photos/{id}         : { planteDocId, data }  (grande photo)
//  - jardins/{id}/tachesFaites/{cle}  : { plantDocId, actionId, annee, faitLe }
//    cle = `${plantDocId}__${actionId}__${annee}`
//  La base des plantes (conseils, mois de taille) est dans src/data/jardin/plantes.js.
// =============================================================
const JARDINS = 'jardins'

const refJardin = (id) => doc(db, JARDINS, id)
const sous = (jardinId, nom) => collection(db, JARDINS, jardinId, nom)
const refSous = (jardinId, nom, id) => doc(db, JARDINS, jardinId, nom, id)

export const MAX_PHOTOS_PLANTE = 5

export const enMs = (t) => (t?.toMillis ? t.toMillis() : Date.now())

// Nom affiché d'une plante du jardin (base ou plante libre)
export function nomPlante(p) {
  return baseDePlante(p)?.nom || p.nomLibre?.trim() || 'Plante'
}

// ---------- Jardins ----------

export function useJardins() {
  const { authReady } = usePin()
  const [jardins, setJardins] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    if (!authReady) return
    return onSnapshot(
      collection(db, JARDINS),
      (snap) => {
        setJardins(
          snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr'))
        )
        setChargement(false)
      },
      (err) => {
        console.error('Erreur Firestore (jardins) :', err)
        setErreur('Impossible de charger les jardins.')
        setChargement(false)
      }
    )
  }, [authReady])

  return { jardins, chargement, erreur }
}

export function useJardin(id) {
  const { authReady } = usePin()
  const [jardin, setJardin] = useState(undefined) // undefined = chargement, null = introuvable

  useEffect(() => {
    if (!authReady || !id) return
    return onSnapshot(
      refJardin(id),
      (snap) => setJardin(snap.exists() ? { id: snap.id, ...snap.data() } : null),
      (err) => {
        console.error('Erreur Firestore (jardin) :', err)
        setJardin(null)
      }
    )
  }, [authReady, id])

  return jardin
}

export async function enregistrerJardin({ id, nom, adresse, contact, telephone, notes }) {
  const donnees = {
    nom: nom.trim(),
    adresse: (adresse || '').trim(),
    contact: (contact || '').trim(),
    telephone: (telephone || '').trim(),
    notes: (notes || '').trim(),
    majLe: serverTimestamp(),
  }
  if (id) {
    await withTimeout(updateDoc(refJardin(id), donnees))
    return id
  }
  const nouveau = doc(collection(db, JARDINS))
  await withTimeout(setDoc(nouveau, { ...donnees, creeLe: serverTimestamp() }))
  return nouveau.id
}

// Supprime le jardin ET tout ce qu'il contient (plantes, photos, tâches faites)
export async function supprimerJardin(id) {
  for (const nom of ['plantes', 'photos', 'tachesFaites']) {
    const snap = await withTimeout(getDocs(sous(id, nom)), 30000)
    for (let i = 0; i < snap.docs.length; i += 400) {
      const batch = writeBatch(db)
      snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref))
      await withTimeout(batch.commit(), 30000)
    }
  }
  await withTimeout(deleteDoc(refJardin(id)))
}

// ---------- Plantes d'un jardin ----------

export function usePlantesJardin(jardinId) {
  const { authReady } = usePin()
  const [plantes, setPlantes] = useState([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    if (!authReady || !jardinId) return
    return onSnapshot(
      sous(jardinId, 'plantes'),
      (snap) => {
        setPlantes(
          snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => nomPlante(a).localeCompare(nomPlante(b), 'fr'))
        )
        setChargement(false)
      },
      (err) => {
        console.error('Erreur Firestore (plantes) :', err)
        setChargement(false)
      }
    )
  }, [authReady, jardinId])

  return { plantes, chargement }
}

// Grandes photos d'une plante, dans l'ordre : [{ id, src }]
export async function lirePhotosPlante(jardinId, ids = []) {
  const snaps = await withTimeout(Promise.all(ids.map((pid) => getDoc(refSous(jardinId, 'photos', pid)))), 30000)
  return snaps.filter((s) => s.exists()).map((s) => ({ id: s.id, src: s.data().data }))
}

// photos : [{ id (déjà enregistrée) | fichier + prep (nouvelle), src }]
export async function enregistrerPlante({ jardinId, id, planteId, nomLibre, quantite, lieu, culture, notes, photos, avant }) {
  const plantDocId = id || doc(sous(jardinId, 'plantes')).id
  const batch = writeBatch(db)
  const photoIds = []
  let couverture = null

  for (let i = 0; i < photos.length; i++) {
    const p = photos[i]
    if (p.fichier) {
      const { image, miniature } = await (p.prep || preparerPhotoCouture(p.fichier))
      const pid = doc(sous(jardinId, 'photos')).id
      batch.set(refSous(jardinId, 'photos', pid), { planteDocId: plantDocId, data: image })
      photoIds.push(pid)
      if (i === 0) couverture = miniature
    } else {
      photoIds.push(p.id)
      if (i === 0) {
        couverture =
          avant?.photoIds?.[0] === p.id && avant?.couverture ? avant.couverture : await miniatureDepuisSource(p.src)
      }
    }
  }
  ;(avant?.photoIds || []).filter((pid) => !photoIds.includes(pid)).forEach((pid) => batch.delete(refSous(jardinId, 'photos', pid)))

  const donnees = {
    planteId: planteId || null,
    nomLibre: (nomLibre || '').trim(),
    quantite: Math.max(1, Number(quantite) || 1),
    lieu,
    culture,
    notes: (notes || '').trim(),
    photoIds,
    couverture,
    majLe: serverTimestamp(),
  }
  if (id) batch.update(refSous(jardinId, 'plantes', plantDocId), donnees)
  else batch.set(refSous(jardinId, 'plantes', plantDocId), { ...donnees, creeLe: serverTimestamp() })

  await withTimeout(batch.commit(), 90000, "L'enregistrement prend trop de temps. Vérifie la connexion et réessaie.")
  return plantDocId
}

export async function supprimerPlante(jardinId, plante) {
  const batch = writeBatch(db)
  ;(plante.photoIds || []).forEach((pid) => batch.delete(refSous(jardinId, 'photos', pid)))
  batch.delete(refSous(jardinId, 'plantes', plante.id))
  const faites = await withTimeout(getDocs(sous(jardinId, 'tachesFaites')), 30000)
  faites.docs.filter((d) => d.data().plantDocId === plante.id).forEach((d) => batch.delete(d.ref))
  await withTimeout(batch.commit(), 30000)
}

// ---------- Tâches du calendrier faites ----------

export function useTachesFaites(jardinId) {
  const { authReady } = usePin()
  const [faites, setFaites] = useState({})

  useEffect(() => {
    if (!authReady || !jardinId) return
    return onSnapshot(
      sous(jardinId, 'tachesFaites'),
      (snap) => setFaites(Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]))),
      (err) => console.error('Erreur Firestore (tachesFaites) :', err)
    )
  }, [authReady, jardinId])

  return faites
}

export async function marquerFait(jardinId, plantDocId, actionId, annee, fait) {
  const cle = cleTache(plantDocId, actionId, annee)
  if (fait) {
    await withTimeout(
      setDoc(refSous(jardinId, 'tachesFaites', cle), { plantDocId, actionId, annee, faitLe: serverTimestamp() })
    )
  } else {
    await withTimeout(deleteDoc(refSous(jardinId, 'tachesFaites', cle)))
  }
}

// Calcul des tâches d'un mois : voir src/utils/jardinCalendrier.js (re-exporté ici)
export { anneeFenetre, cleTache, tachesDuMois }

// ---------- Plantes sans fiche (« à documenter ») ----------

// Plantes ajoutées librement, tous jardins confondus, qui n'ont pas (encore) de fiche dans la base.
// Regroupées par nom : [{ nom, quantite, jardins[], lieux[] }]. Se vide toute seule quand la fiche est ajoutée.
export function usePlantesSansFiche(jardins) {
  const { authReady } = usePin()
  const [parJardin, setParJardin] = useState({}) // jardinId → plantes
  const cle = jardins.map((j) => j.id).join(',')

  useEffect(() => {
    if (!authReady) return
    setParJardin({})
    const arrets = jardins.map((j) =>
      onSnapshot(
        sous(j.id, 'plantes'),
        (snap) => setParJardin((avant) => ({ ...avant, [j.id]: snap.docs.map((d) => d.data()) })),
        (err) => console.error('Erreur Firestore (plantes sans fiche) :', err)
      )
    )
    return () => arrets.forEach((a) => a())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, cle])

  const groupes = new Map()
  for (const j of jardins) {
    for (const p of parJardin[j.id] || []) {
      if (baseDePlante(p) || !p.nomLibre?.trim()) continue
      const k = normaliser(p.nomLibre)
      if (!k) continue
      const g = groupes.get(k) || { nom: p.nomLibre.trim(), quantite: 0, jardins: [], details: [] }
      g.quantite += p.quantite || 1
      if (!g.jardins.includes(j.nom)) g.jardins.push(j.nom)
      const detail = `${p.lieu === 'interieur' ? 'intérieur' : 'extérieur'}, ${p.culture === 'pot' ? 'en pot' : 'pleine terre'}`
      if (!g.details.includes(detail)) g.details.push(detail)
      groupes.set(k, g)
    }
  }
  return [...groupes.values()].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
}
