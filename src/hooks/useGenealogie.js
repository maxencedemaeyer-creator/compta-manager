import { useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase/config.js'
import { useFirestoreCollection } from './useFirestoreCollection.js'
import { parserGedcom, racineParDefaut } from '../utils/gedcom.js'

// Organisation dans Firebase :
//   genealogieArbres/{arbreId}                -> nom, nb de personnes, personne centrale…
//   genealogieArbres/{arbreId}/morceaux/{n}   -> le fichier GEDCOM découpé en morceaux
//   genealogieArbres/{arbreId}/photos/{id}    -> une photo (compressée) par personne
const COLLECTION = 'genealogieArbres'
const TAILLE_MORCEAU = 300000 // caractères par morceau (limite Firebase : 1 Mo par document)

// ---------- Liste des arbres ----------
export function useArbresGenealogiques() {
  const { data, loading, error } = useFirestoreCollection(COLLECTION, 'createdAt', 'desc')

  async function importerArbre(nom, texte) {
    const arbre = parserGedcom(texte)
    const nbPersonnes = Object.keys(arbre.personnes).length
    if (nbPersonnes === 0) {
      throw new Error("Aucune personne trouvée : ce fichier n'est pas un GEDCOM valide.")
    }
    const morceaux = []
    for (let i = 0; i < texte.length; i += TAILLE_MORCEAU) {
      morceaux.push(texte.slice(i, i + TAILLE_MORCEAU))
    }
    const ref = await addDoc(collection(db, COLLECTION), {
      nom,
      nbPersonnes,
      nbFamilles: Object.keys(arbre.familles).length,
      nbMorceaux: morceaux.length,
      racineId: racineParDefaut(arbre),
      createdAt: serverTimestamp(),
    })
    for (let i = 0; i < morceaux.length; i++) {
      await setDoc(doc(db, COLLECTION, ref.id, 'morceaux', String(i).padStart(4, '0')), {
        index: i,
        texte: morceaux[i],
      })
    }
    return ref.id
  }

  async function supprimerArbre(arbreId) {
    for (const sous of ['morceaux', 'photos']) {
      const snap = await getDocs(collection(db, COLLECTION, arbreId, sous))
      let batch = writeBatch(db)
      let n = 0
      for (const d of snap.docs) {
        batch.delete(d.ref)
        n++
        if (n === 400) {
          await batch.commit()
          batch = writeBatch(db)
          n = 0
        }
      }
      if (n > 0) await batch.commit()
    }
    await deleteDoc(doc(db, COLLECTION, arbreId))
  }

  async function renommerArbre(arbreId, nom) {
    await updateDoc(doc(db, COLLECTION, arbreId), { nom })
  }

  return { arbres: data, loading, error, importerArbre, supprimerArbre, renommerArbre }
}

// ---------- Un arbre (contenu + photos) ----------
export function useArbre(arbreId) {
  const [meta, setMeta] = useState(null)
  const [texte, setTexte] = useState(null)
  const [erreur, setErreur] = useState(null)

  // Infos de l'arbre (temps réel : nom, personne centrale…)
  useEffect(() => {
    return onSnapshot(
      doc(db, COLLECTION, arbreId),
      (snap) => setMeta(snap.exists() ? { id: snap.id, ...snap.data() } : false),
      (err) => setErreur(err)
    )
  }, [arbreId])

  // Contenu GEDCOM (chargé une seule fois)
  useEffect(() => {
    let annule = false
    setTexte(null)
    getDocs(collection(db, COLLECTION, arbreId, 'morceaux'))
      .then((snap) => {
        if (annule) return
        const morceaux = snap.docs.map((d) => d.data()).sort((a, b) => a.index - b.index)
        setTexte(morceaux.map((m) => m.texte).join(''))
      })
      .catch((err) => !annule && setErreur(err))
    return () => {
      annule = true
    }
  }, [arbreId])

  const arbre = useMemo(() => (texte ? parserGedcom(texte) : null), [texte])

  // Photos (temps réel)
  const { data: photosDocs } = useFirestoreCollection(`${COLLECTION}/${arbreId}/photos`)
  const photos = useMemo(() => {
    const map = {}
    photosDocs.forEach((p) => {
      map[p.id] = p.dataUrl
    })
    return map
  }, [photosDocs])

  // Photo à afficher : celle importée dans l'app, sinon un lien web présent dans le GEDCOM
  function photoDe(personne) {
    if (!personne) return null
    if (photos[personne.id]) return photos[personne.id]
    const web = personne.fichiersPhotos?.find((f) => /^https?:\/\//i.test(f))
    return web || null
  }

  async function definirRacine(personneId) {
    await updateDoc(doc(db, COLLECTION, arbreId), { racineId: personneId })
  }

  async function enregistrerPhoto(personneId, dataUrl) {
    await setDoc(doc(db, COLLECTION, arbreId, 'photos', personneId), {
      dataUrl,
      updatedAt: serverTimestamp(),
    })
  }

  async function supprimerPhoto(personneId) {
    await deleteDoc(doc(db, COLLECTION, arbreId, 'photos', personneId))
  }

  return {
    meta,
    arbre,
    chargement: meta === null || (meta && !arbre && !erreur),
    erreur,
    photos,
    photoDe,
    definirRacine,
    enregistrerPhoto,
    supprimerPhoto,
  }
}
