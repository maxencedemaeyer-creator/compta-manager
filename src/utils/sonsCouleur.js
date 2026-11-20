// =============================================================
//  Appli « Lis-moi » : « Sons en couleur » (interrupteur d'aide à la lecture)
//  Les 8 sons des cartes repères de la classe de Max, colorés SEULEMENT
//  quand le son est vraiment prononcé dans le mot.
//
//  - La prononciation vient du moteur de l'autre site de Max
//    (decoupageSons.js, dictionnaire Lexique 3.83) : un mot inconnu ou
//    douteux n'est jamais coloré.
//  - En plus, on ne garde que les graphèmes des cartes (spécification de Max,
//    20/11) : « o » seul, « et », « en » de « examen »… ne sont pas colorés.
// =============================================================
import { chargerSons, marquesTexte } from './decoupageSons.js'

// Code couleur du moteur → groupe des cartes de la classe
export const GROUPES = {
  o: { id: 'an', nom: 'an', graphemes: ['an', 'am', 'en', 'em'], couleur: '#b44a00' },
  v: { id: 'in', nom: 'in', graphemes: ['in', 'im', 'ain', 'ein'], couleur: '#4f6d0c' },
  p: { id: 'e_aigu', nom: 'é', graphemes: ['é', 'er', 'ez'], couleur: '#b8295f' },
  m: { id: 'on', nom: 'on', graphemes: ['on', 'om'], couleur: '#6b3a10' },
  c: { id: 'eu', nom: 'eu', graphemes: ['eu', 'oeu', 'œu'], couleur: '#17708c' },
  r: { id: 'ou', nom: 'ou', graphemes: ['ou'], couleur: '#a4161c' },
  n: { id: 'oi', nom: 'oi', graphemes: ['oi'], couleur: '#000000' },
  j: { id: 'o_au_eau', nom: 'au / eau', graphemes: ['au', 'eau'], couleur: '#8a6400' },
}

let chargement = null

/** Charge le dictionnaire des sons une seule fois (≈ 1,5 Mo, compressé par le serveur). */
export function chargerDictionnaireSons() {
  chargement ??= fetch('/lecture/sons.txt')
    .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
    .then(chargerSons)
    .catch((e) => {
      chargement = null
      throw e
    })
  return chargement
}

const normaliser = (s) => s.toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae')

/**
 * Les sons colorés d'un texte : liste de [début, longueur, idGroupe] (positions dans le texte),
 * uniquement pour les 8 groupes et leurs graphèmes autorisés.
 */
export function sonsDuTexte(sons, texte) {
  const sortie = []
  for (const [debut, longueur, code] of marquesTexte(sons, texte)) {
    const groupe = GROUPES[code]
    if (!groupe) continue // autres codes du moteur (è, ien/oin, lettres muettes, pièges) : pas dans les cartes
    const lettres = normaliser(texte.slice(debut, debut + longueur))
    if (!groupe.graphemes.some((g) => normaliser(g) === lettres)) continue
    sortie.push([debut, longueur, groupe.id])
  }
  return sortie
}

/** Répartit les sons colorés par mot : Map(indexMot → [[débutDansLeMot, longueur, idGroupe]…]). */
export function sonsParMot(marques, mots) {
  const parMot = new Map()
  let k = 0
  const tries = [...marques].sort((a, b) => a[0] - b[0])
  for (const [debut, longueur, id] of tries) {
    while (k < mots.length && mots[k].fin <= debut) k++
    const mot = mots[k]
    if (!mot || debut < mot.debut || debut + longueur > mot.fin) continue
    if (!parMot.has(mot.index)) parMot.set(mot.index, [])
    parMot.get(mot.index).push([debut - mot.debut, longueur, id])
  }
  return parMot
}

export const COULEUR_PAR_ID = Object.fromEntries(Object.values(GROUPES).map((g) => [g.id, g.couleur]))
