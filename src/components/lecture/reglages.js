import { useCallback, useEffect, useState } from 'react'
import { TAILLES_TEXTE, VITESSE_DEFAUT, VOIX_DEFAUT } from '../../config/lectureVoix.js'

// =============================================================
//  Appli « Lis-moi » : réglages de la tablette
//  (vitesse, police, taille, interligne, espacement, fond, focus, texte simple ;
//  « sons en couleur » : seulement le temps de la lecture, jamais mémorisé)
//  Petits réglages d'affichage seulement, gardés sur l'appareil —
//  aucune donnée de lecture.
// =============================================================
const CLE = 'lisMoi_reglages'
const DEFAUT = {
  voix: VOIX_DEFAUT,
  vitesse: VITESSE_DEFAUT,
  taille: 1,
  police: 'lexend',
  interligne: 'large',
  espacement: 'normal',
  fond: 'creme',
  focus: false,
  couleursSons: false, // « Sons en couleur » : éteint à chaque ouverture, jamais mémorisé
  texteSimple: false, // « Texte simple » : sans la mise en page (titres, listes)
}

// « Sons en couleur » n'est jamais mémorisé : à chaque ouverture d'une lecture il est éteint,
// et c'est l'élève qui l'allume (même si une ancienne valeur « allumé » traîne sur la tablette).
function lire() {
  try {
    return { ...DEFAUT, ...JSON.parse(localStorage.getItem(CLE) || '{}'), couleursSons: false }
  } catch {
    return DEFAUT
  }
}

// Polices de lecture (Google Fonts, chargées seulement dans cette appli)
export const POLICES = {
  lexend: { nom: 'Lexend', detail: 'Moderne', famille: "'Lexend', system-ui, sans-serif" },
  atkinson: { nom: 'Atkinson', detail: 'Très lisible', famille: "'Atkinson Hyperlegible', system-ui, sans-serif" },
  andika: { nom: 'École', detail: 'Lettres d’école', famille: "'Andika', system-ui, sans-serif" },
}

export const INTERLIGNES = {
  normal: { nom: 'Normal', valeur: 1.55 },
  large: { nom: 'Large', valeur: 1.85 },
  tresLarge: { nom: 'Très large', valeur: 2.3 },
}

export const ESPACEMENTS = {
  normal: { nom: 'Normal', lettres: '0.01em', mots: '0.08em' },
  large: { nom: 'Large', lettres: '0.08em', mots: '0.25em' },
}

// Fonds doux (jamais de blanc pur éblouissant)
export const FONDS = {
  creme: { nom: 'Crème', page: '#fbf7f0', carte: '#fffdf8', texte: '#1f1d36' },
  sepia: { nom: 'Sépia', page: '#f1e7d3', carte: '#f8efdc', texte: '#3a2e1f' },
  bleu: { nom: 'Bleu doux', page: '#e8f0f8', carte: '#f2f7fc', texte: '#1a2a3d' },
  gris: { nom: 'Gris doux', page: '#e9e9e7', carte: '#f3f3f1', texte: '#24242a' },
}

export function useReglages() {
  const [reglages, setReglages] = useState(lire)

  useEffect(() => {
    try {
      // eslint-disable-next-line no-unused-vars
      const { couleursSons, ...memorisables } = reglages
      localStorage.setItem(CLE, JSON.stringify(memorisables))
    } catch {
      /* navigation privée : tant pis */
    }
  }, [reglages])

  const changer = useCallback((modif) => setReglages((r) => ({ ...r, ...modif })), [])
  const taillePx = TAILLES_TEXTE[Math.max(0, Math.min(TAILLES_TEXTE.length - 1, reglages.taille))]
  return {
    reglages,
    changer,
    taillePx,
    police: POLICES[reglages.police] || POLICES.lexend,
    interligne: (INTERLIGNES[reglages.interligne] || INTERLIGNES.large).valeur,
    espacement: ESPACEMENTS[reglages.espacement] || ESPACEMENTS.normal,
    fond: FONDS[reglages.fond] || FONDS.creme,
  }
}

export function chargerPolices() {
  document.title = 'Lis-moi'
  if (document.getElementById('polices-lecture')) return
  const lien = document.createElement('link')
  lien.id = 'polices-lecture'
  lien.rel = 'stylesheet'
  lien.href =
    'https://fonts.googleapis.com/css2?family=Andika:wght@400;700&family=Atkinson+Hyperlegible:wght@400;700&family=Lexend:wght@400;500;600;700&display=swap'
  document.head.appendChild(lien)
}
