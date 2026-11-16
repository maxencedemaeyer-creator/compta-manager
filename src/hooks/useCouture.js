import { useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase/config.js'
import { usePin } from '../context/PinContext.jsx'
import { withTimeout } from '../utils/withTimeout.js'
import { miniatureDepuisSource, preparerPhotoCouture } from '../utils/imageCouture.js'

// =============================================================
//  Application Couture de Julie (Firebase, dossier utilisateurs/julie)
//  - couture_articles/{id}  : { nom, description, prix, visible,
//                               photoIds[], couverture, nbPhotos, creeLe, majLe }
//  - couture_photos/{id}    : { articleId, data }  (grande photo)
//  - couture_commandes/{id} : { articleId, articleNom, nom, details,
//                               statut, prix, paye, note, source, creeLe, majLe }
//  La galerie publique (/couture) lit les articles visibles et
//  crée des demandes « J'en veux un ! ».
// =============================================================
const PROFIL = 'julie'
const ARTICLES = 'couture_articles'
const PHOTOS = 'couture_photos'
const COMMANDES = 'couture_commandes'

const col = (nom) => collection(db, 'utilisateurs', PROFIL, nom)
const ref = (nom, id) => doc(db, 'utilisateurs', PROFIL, nom, id)

export const MAX_PHOTOS = 8

// Lien public à partager aux copines, et son code d'accès (en minuscules)
export const lienGalerie = () => `${window.location.origin}/couture`
export const CODE_GALERIE = 'julie'

// Message WhatsApp d'invitation (lien + code)
export function lienWhatsApp() {
  const message =
    `Coucou ! 🧵💕\n` +
    `Je t'invite à découvrir ma galerie de créations couture faites main :\n` +
    `👉 ${lienGalerie()}\n` +
    `🔑 Code d'accès : ${CODE_GALERIE}\n\n` +
    `Un modèle te plaît ? Clique sur « J'en veux un ! » et dis-moi tes envies (taille, couleur…) 🎀\n\n` +
    `🤫 Si tu connais d'autres personnes intéressées, demande-leur de m'envoyer un petit message privé sur WhatsApp, ` +
    `mais ne leur donne pas accès directement à la galerie s'il te plaît 🙏`
  return `https://wa.me/?text=${encodeURIComponent(message)}`
}

export const STATUTS_COMMANDE = [
  { id: 'nouvelle', nom: 'Nouvelle', emoji: '💌', pastille: 'bg-pink-100 text-pink-700 ring-pink-200', point: 'bg-pink-500' },
  { id: 'acceptee', nom: 'Acceptée', emoji: '🤝', pastille: 'bg-violet-50 text-violet-700 ring-violet-200', point: 'bg-violet-500' },
  { id: 'en_couture', nom: 'En couture', emoji: '🧵', pastille: 'bg-amber-50 text-amber-700 ring-amber-200', point: 'bg-amber-500' },
  { id: 'prete', nom: 'Prête', emoji: '🎀', pastille: 'bg-sky-50 text-sky-700 ring-sky-200', point: 'bg-sky-500' },
  { id: 'remise', nom: 'Remise', emoji: '💝', pastille: 'bg-green-50 text-green-700 ring-green-200', point: 'bg-green-500' },
  { id: 'annulee', nom: 'Annulée', emoji: '✖️', pastille: 'bg-slate-100 text-slate-500 ring-slate-200', point: 'bg-slate-400' },
]
// Parcours normal d'une commande (Annulée est à part)
export const PARCOURS = ['nouvelle', 'acceptee', 'en_couture', 'prete', 'remise']

export function trouverStatutCommande(id) {
  return STATUTS_COMMANDE.find((s) => s.id === id) || STATUTS_COMMANDE[0]
}

export const enMs = (t) => (t?.toMillis ? t.toMillis() : 0)
const plusRecentDabord = (a, b) => (enMs(b.creeLe) || Date.now()) - (enMs(a.creeLe) || Date.now())

// ---------- Articles ----------

// Liste des créations (temps réel). visiblesSeulement = galerie publique.
export function useArticlesCouture({ visiblesSeulement = false } = {}) {
  const { authReady } = usePin()
  const [articles, setArticles] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    if (!authReady) return
    const source = visiblesSeulement ? query(col(ARTICLES), where('visible', '==', true)) : col(ARTICLES)
    return onSnapshot(
      source,
      (snap) => {
        setArticles(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(plusRecentDabord))
        setChargement(false)
      },
      (err) => {
        console.error('Erreur Firestore (couture_articles) :', err)
        setErreur('Impossible de charger les créations.')
        setChargement(false)
      }
    )
  }, [authReady, visiblesSeulement])

  return { articles, chargement, erreur }
}

// Une création + ses grandes photos (pour la page détail)
export function useArticleCouture(id) {
  const { authReady } = usePin()
  const [article, setArticle] = useState(undefined) // undefined = chargement, null = introuvable
  const [photos, setPhotos] = useState([])

  useEffect(() => {
    if (!authReady || !id) return
    return onSnapshot(
      ref(ARTICLES, id),
      (snap) => setArticle(snap.exists() ? { id: snap.id, ...snap.data() } : null),
      (err) => {
        console.error('Erreur Firestore (article couture) :', err)
        setArticle(null)
      }
    )
  }, [authReady, id])

  const cle = article?.photoIds?.join(',') || ''
  useEffect(() => {
    if (!cle) {
      setPhotos([])
      return
    }
    let annule = false
    lirePhotos(cle.split(','))
      .then((liste) => !annule && setPhotos(liste))
      .catch((err) => console.error(err))
    return () => {
      annule = true
    }
  }, [cle])

  return { article, photos }
}

// Grandes photos d'une création, dans l'ordre : [{ id, src }]
export async function lirePhotos(ids = []) {
  const snaps = await withTimeout(Promise.all(ids.map((pid) => getDoc(ref(PHOTOS, pid)))), 30000)
  return snaps.filter((s) => s.exists()).map((s) => ({ id: s.id, src: s.data().data }))
}

// Création ou modification d'une création.
// photos : [{ id (photo déjà enregistrée) | fichier (nouvelle photo), src }]
export async function enregistrerArticle({ id, nom, description, prix, visible, photos, avant }) {
  const articleId = id || doc(col(ARTICLES)).id
  const batch = writeBatch(db)
  const photoIds = []
  let couverture = null

  for (let i = 0; i < photos.length; i++) {
    const p = photos[i]
    if (p.fichier) {
      const { image, miniature } = await preparerPhotoCouture(p.fichier)
      const pid = doc(col(PHOTOS)).id
      batch.set(ref(PHOTOS, pid), { articleId, data: image })
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

  // Photos retirées : on les supprime de Firebase
  ;(avant?.photoIds || []).filter((pid) => !photoIds.includes(pid)).forEach((pid) => batch.delete(ref(PHOTOS, pid)))

  const donnees = {
    nom: nom.trim(),
    description: description.trim(),
    prix: prix.trim(),
    visible,
    photoIds,
    couverture,
    nbPhotos: photoIds.length,
    majLe: serverTimestamp(),
  }
  if (id) batch.update(ref(ARTICLES, articleId), donnees)
  else batch.set(ref(ARTICLES, articleId), { ...donnees, creeLe: serverTimestamp() })

  await withTimeout(batch.commit(), 90000, "L'enregistrement prend trop de temps. Vérifie la connexion et réessaie.")
  return articleId
}

export async function changerVisibilite(id, visible) {
  await withTimeout(updateDoc(ref(ARTICLES, id), { visible, majLe: serverTimestamp() }))
}

export async function supprimerArticle(article) {
  const batch = writeBatch(db)
  ;(article.photoIds || []).forEach((pid) => batch.delete(ref(PHOTOS, pid)))
  batch.delete(ref(ARTICLES, article.id))
  await withTimeout(batch.commit(), 30000)
}

// ---------- Commandes ----------

// « J'en veux un ! » depuis la galerie publique, ou commande ajoutée à la main par Julie
export async function envoyerDemande({ article, nom, details, source = 'galerie' }) {
  await withTimeout(
    addDoc(col(COMMANDES), {
      articleId: article?.id || null,
      articleNom: article?.nom || 'Création sur mesure',
      nom: nom.trim(),
      details: details.trim(),
      statut: 'nouvelle',
      prix: null,
      paye: false,
      note: '',
      source,
      creeLe: serverTimestamp(),
      majLe: serverTimestamp(),
    })
  )
}

export function useCommandesCouture() {
  const { authReady } = usePin()
  const [commandes, setCommandes] = useState([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    if (!authReady) return
    return onSnapshot(
      col(COMMANDES),
      (snap) => {
        setCommandes(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(plusRecentDabord))
        setChargement(false)
      },
      (err) => {
        console.error('Erreur Firestore (couture_commandes) :', err)
        setChargement(false)
      }
    )
  }, [authReady])

  return { commandes, chargement }
}

export async function modifierCommande(id, champs) {
  await withTimeout(updateDoc(ref(COMMANDES, id), { ...champs, majLe: serverTimestamp() }))
}

export async function supprimerCommande(id) {
  await withTimeout(deleteDoc(ref(COMMANDES, id)))
}
