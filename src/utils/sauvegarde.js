import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config.js'

// Toutes les collections Firebase du site, sauvegardées dans un seul fichier JSON.
const COLLECTIONS = [
  'cours',
  'veloEntries',
  'etudes',
  'medecinEntries',
  'remboursementsEntries',
  'laboFrancaisP5P6Statuts',
  'config',
]

// Convertit les dates Firebase en texte lisible (ISO) pour le fichier
function serialiser(valeur) {
  if (valeur && typeof valeur.toDate === 'function') return valeur.toDate().toISOString()
  if (Array.isArray(valeur)) return valeur.map(serialiser)
  if (valeur && typeof valeur === 'object') {
    return Object.fromEntries(Object.entries(valeur).map(([k, v]) => [k, serialiser(v)]))
  }
  return valeur
}

async function lireCollection(chemin) {
  const snap = await getDocs(collection(db, chemin))
  return snap.docs.map((d) => ({ id: d.id, ...serialiser(d.data()) }))
}

export async function creerSauvegarde() {
  const resultat = {
    site: 'maxence',
    version: 1,
    date: new Date().toISOString(),
    collections: {},
    genealogie: [],
  }
  let total = 0

  for (const nom of COLLECTIONS) {
    let docs = await lireCollection(nom)
    // Le code PIN (même chiffré) ne quitte jamais Firebase
    if (nom === 'config') docs = docs.filter((d) => d.id !== 'securite')
    resultat.collections[nom] = docs
    total += docs.length
  }

  // Arbres généalogiques, avec leur fichier GEDCOM et leurs photos
  for (const arbre of await lireCollection('genealogieArbres')) {
    resultat.genealogie.push({
      ...arbre,
      morceaux: await lireCollection(`genealogieArbres/${arbre.id}/morceaux`),
      photos: await lireCollection(`genealogieArbres/${arbre.id}/photos`),
    })
    total += 1
  }

  const jour = new Date().toISOString().slice(0, 10)
  const blob = new Blob([JSON.stringify(resultat, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `sauvegarde-maxence-${jour}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)

  return { total, taille: blob.size }
}
