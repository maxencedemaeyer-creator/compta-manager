import { useEffect, useState } from 'react'
import { collection, deleteDoc, doc, getDoc, increment, onSnapshot, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore'
import { db } from '../firebase/config.js'
import { usePin } from '../context/PinContext.jsx'
import { withTimeout } from '../utils/withTimeout.js'
import { preparerPhotoCouture } from '../utils/imageCouture.js'
import { normaliser } from '../lib/cave/appellations.js'

// =============================================================
//  Application « Cave » (Firebase, à la racine comme le reste de Maxence)
//  - cave_bouteilles/{id} : { appellationId | null, appellationLibre, code (R/B/P/E/D/F), styleId, cepages[],
//                             millesime, quantite, prixAchat, producteur, cuvee, emplacement, notes,
//                             apogeeDe, apogeeA, miniature, creeLe, majLe }
//  - cave_photos/{id}     : { data }  grande photo de l'étiquette (même id que la bouteille)
//  - cave_historique/{id} : { bouteilleId, appellationId, appellationLibre, nom, code, styleId, millesime,
//                             producteur, cuvee, plat, note (1-5), commentaire, prix, bueLe (AAAA-MM-JJ), creeLe }
//  - cave_envies/{id}     : { appellationId, appellationLibre, nom, code, styleId, prixCible, plat, creeLe }
//  - cave_manques/{id}    : { genre: 'appellation' | 'plat' | 'cepage', texte, contexte, nb, majLe }
//    → ce que la base ne connaît pas encore : à copier à Claude (onglet Données)
// =============================================================
const BOUTEILLES = 'cave_bouteilles'
const PHOTOS = 'cave_photos'
const HISTORIQUE = 'cave_historique'
const ENVIES = 'cave_envies'
const MANQUES = 'cave_manques'

function useCollection(nom, tri) {
  const { authReady } = usePin()
  const [items, setItems] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    if (!authReady) return
    return onSnapshot(
      collection(db, nom),
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(tri))
        setChargement(false)
      },
      (err) => {
        console.error(`Erreur Firestore (${nom}) :`, err)
        setErreur('Impossible de charger les données de la cave.')
        setChargement(false)
      }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, nom])

  return { items, chargement, erreur }
}

const parNom = (a, b) => (a.appellationLibre || a.nom || '').localeCompare(b.appellationLibre || b.nom || '', 'fr')
const plusRecent = (a, b) => String(b.bueLe || '').localeCompare(String(a.bueLe || '')) || (b.creeLe?.seconds || 0) - (a.creeLe?.seconds || 0)
const plusRecentCree = (a, b) => (b.creeLe?.seconds || 0) - (a.creeLe?.seconds || 0)

export function useCave() {
  const b = useCollection(BOUTEILLES, parNom)
  const h = useCollection(HISTORIQUE, plusRecent)
  const e = useCollection(ENVIES, plusRecentCree)
  const m = useCollection(MANQUES, (x, y) => (y.nb || 0) - (x.nb || 0))
  return {
    bouteilles: b.items,
    historique: h.items,
    envies: e.items,
    manques: m.items,
    chargement: b.chargement || h.chargement,
    erreur: b.erreur || h.erreur || e.erreur || m.erreur,
  }
}

// ---------- Bouteilles

const nombre = (v) => {
  const n = Number(String(v ?? '').replace(',', '.'))
  return Number.isFinite(n) && String(v ?? '').trim() !== '' ? n : null
}

// photo : File (nouvelle photo) | undefined (inchangée) | null (supprimée)
export async function enregistrerBouteille({ id, champs, photo, avant }) {
  const bouteilleId = id || doc(collection(db, BOUTEILLES)).id
  const batch = writeBatch(db)
  const donnees = {
    appellationId: champs.appellationId || null,
    appellationLibre: champs.appellationId ? '' : (champs.appellationLibre || '').trim(),
    code: champs.code,
    styleId: champs.styleId,
    cepages: (champs.cepages || []).map((c) => c.trim()).filter(Boolean),
    millesime: nombre(champs.millesime),
    quantite: Math.max(0, Math.round(nombre(champs.quantite) ?? 1)),
    prixAchat: nombre(champs.prixAchat),
    producteur: (champs.producteur || '').trim(),
    cuvee: (champs.cuvee || '').trim(),
    emplacement: (champs.emplacement || '').trim(),
    notes: (champs.notes || '').trim(),
    apogeeDe: nombre(champs.apogeeDe),
    apogeeA: nombre(champs.apogeeA),
    majLe: serverTimestamp(),
  }
  if (photo instanceof File) {
    const { image, miniature } = await preparerPhotoCouture(photo)
    batch.set(doc(db, PHOTOS, bouteilleId), { data: image })
    donnees.miniature = miniature
  } else if (photo === null) {
    if (avant?.miniature) batch.delete(doc(db, PHOTOS, bouteilleId))
    donnees.miniature = ''
  }
  if (id) batch.set(doc(db, BOUTEILLES, bouteilleId), donnees, { merge: true })
  else batch.set(doc(db, BOUTEILLES, bouteilleId), { ...donnees, miniature: donnees.miniature || '', creeLe: serverTimestamp() })
  await withTimeout(batch.commit(), 30000)
  return bouteilleId
}

export async function supprimerBouteille(id) {
  const batch = writeBatch(db)
  batch.delete(doc(db, BOUTEILLES, id))
  batch.delete(doc(db, PHOTOS, id))
  await withTimeout(batch.commit())
}

export async function changerQuantite(id, quantite) {
  await withTimeout(setDoc(doc(db, BOUTEILLES, id), { quantite: Math.max(0, quantite), majLe: serverTimestamp() }, { merge: true }))
}

export async function lirePhotoBouteille(id) {
  const snap = await withTimeout(getDoc(doc(db, PHOTOS, id)), 30000)
  return snap.exists() ? snap.data().data : null
}

// ---------- Boire une bouteille (enlève 1 et garde un souvenir dans l'historique)
export async function boireBouteille({ bouteille, plat, note, commentaire, date }) {
  const batch = writeBatch(db)
  batch.set(doc(db, BOUTEILLES, bouteille.id), { quantite: Math.max(0, (bouteille.quantite || 1) - 1), majLe: serverTimestamp() }, { merge: true })
  const h = doc(collection(db, HISTORIQUE))
  batch.set(h, {
    bouteilleId: bouteille.id,
    appellationId: bouteille.appellationId || null,
    appellationLibre: bouteille.appellationLibre || '',
    nom: bouteille.nom,
    code: bouteille.code,
    styleId: bouteille.styleId,
    millesime: bouteille.millesime ?? null,
    producteur: bouteille.producteur || '',
    cuvee: bouteille.cuvee || '',
    prix: bouteille.prixAchat ?? null,
    plat: (plat || '').trim(),
    note: note || 0,
    commentaire: (commentaire || '').trim(),
    bueLe: date,
    creeLe: serverTimestamp(),
  })
  await withTimeout(batch.commit())
}

export async function modifierDegustation(id, { plat, note, commentaire }) {
  await withTimeout(setDoc(doc(db, HISTORIQUE, id), { plat: (plat || '').trim(), note: note || 0, commentaire: (commentaire || '').trim() }, { merge: true }))
}

export async function supprimerDegustation(id) {
  await withTimeout(deleteDoc(doc(db, HISTORIQUE, id)))
}

// ---------- Liste d'achats
export async function ajouterEnvie({ appellationId, appellationLibre, nom, code, styleId, prixCible, plat }) {
  const ref = doc(collection(db, ENVIES))
  await withTimeout(
    setDoc(ref, {
      appellationId: appellationId || null,
      appellationLibre: appellationLibre || '',
      nom,
      code,
      styleId,
      prixCible: prixCible ?? null,
      plat: (plat || '').trim(),
      creeLe: serverTimestamp(),
    })
  )
}

export async function supprimerEnvie(id) {
  await withTimeout(deleteDoc(doc(db, ENVIES, id)))
}

// ---------- Ce que la base ne connaît pas encore
export async function signaler(genre, texte, contexte = '') {
  const propre = String(texte || '').trim()
  const cle = normaliser(propre).replace(/ /g, '-').slice(0, 80)
  if (!cle) return
  await withTimeout(
    setDoc(
      doc(db, MANQUES, `${genre}__${cle}`),
      { genre, texte: propre, contexte, nb: increment(1), majLe: serverTimestamp() },
      { merge: true }
    )
  )
}

export async function effacerManques(ids) {
  for (let i = 0; i < ids.length; i += 400) {
    const batch = writeBatch(db)
    ids.slice(i, i + 400).forEach((id) => batch.delete(doc(db, MANQUES, id)))
    await withTimeout(batch.commit())
  }
}
