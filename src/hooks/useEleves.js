import { useEffect, useRef } from 'react'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase/config.js'
import { useFirestoreCollection } from './useFirestoreCollection.js'
import { withTimeout } from '../utils/withTimeout.js'

const COLLECTION = 'eleves'

// Couleurs disponibles pour les pastilles (classes Tailwind écrites en entier
// pour qu'elles soient bien incluses dans le site final).
export const COULEURS_ELEVES = {
  bleu: 'bg-sky-100 ring-sky-300',
  jaune: 'bg-amber-100 ring-amber-300',
  vert: 'bg-emerald-100 ring-emerald-300',
  rose: 'bg-pink-100 ring-pink-300',
  violet: 'bg-violet-100 ring-violet-300',
  orange: 'bg-orange-100 ring-orange-300',
  rouge: 'bg-red-100 ring-red-300',
  turquoise: 'bg-teal-100 ring-teal-300',
  indigo: 'bg-indigo-100 ring-indigo-300',
  citron: 'bg-lime-100 ring-lime-300',
}

const EMOJIS = [
  '🦊', '🐼', '🐸', '🦁', '🐙', '🦄', '🐢', '🐝', '🚀', '⚽',
  '🎸', '🌵', '🍉', '⭐', '🐬', '🦉', '🍀', '🎈', '🐳', '🦖',
]

// Identifiant d'un élève à partir de son prénom : "  Lorenzo " et "lorenzo" = même élève
export function idEleve(nom) {
  return String(nom || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function auHasard(liste) {
  return liste[Math.floor(Math.random() * liste.length)]
}

// Liste des élèves (stockée dans Firestore, collection "eleves").
// Chaque prénom présent dans les cours reçoit automatiquement une couleur et un emoji.
export function useEleves(cours, coursLoading) {
  const { data, loading } = useFirestoreCollection(COLLECTION, 'nom', 'asc')
  const enCreation = useRef(new Set())

  useEffect(() => {
    if (loading || coursLoading) return

    const existants = new Set(data.map((e) => e.id))
    const couleursPrises = new Set(data.map((e) => e.couleur))
    const emojisPris = new Set(data.map((e) => e.emoji))

    for (const c of cours) {
      const id = idEleve(c.eleve)
      if (!id || existants.has(id) || enCreation.current.has(id)) continue
      enCreation.current.add(id)

      const couleursLibres = Object.keys(COULEURS_ELEVES).filter((k) => !couleursPrises.has(k))
      const couleur = couleursLibres[0] || auHasard(Object.keys(COULEURS_ELEVES))
      const emojisLibres = EMOJIS.filter((e) => !emojisPris.has(e))
      const emoji = auHasard(emojisLibres.length ? emojisLibres : EMOJIS)
      couleursPrises.add(couleur)
      emojisPris.add(emoji)

      withTimeout(
        setDoc(doc(db, COLLECTION, id), {
          nom: String(c.eleve).trim(),
          couleur,
          emoji,
          createdAt: serverTimestamp(),
        })
      ).catch((err) => {
        console.error("Erreur lors de l'enregistrement de l'élève :", err)
        enCreation.current.delete(id)
      })
    }
  }, [data, loading, cours, coursLoading])

  // Recherche rapide du profil d'un élève à partir du prénom écrit dans un cours
  const parId = new Map(data.map((e) => [e.id, e]))
  function profilDe(nom) {
    return parId.get(idEleve(nom)) || null
  }

  return { eleves: data, loading, profilDe }
}
