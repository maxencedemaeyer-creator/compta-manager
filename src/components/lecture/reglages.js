import { useCallback, useEffect, useState } from 'react'
import { TAILLES_TEXTE, VITESSE_DEFAUT, VOIX_DEFAUT } from '../../config/lectureVoix.js'
// Polices hébergées sur le site (aucun appel à Google) : seulement le latin, les graisses utiles
import '@fontsource/lexend/latin-400.css'
import '@fontsource/lexend/latin-500.css'
import '@fontsource/lexend/latin-600.css'
import '@fontsource/lexend/latin-700.css'
import '@fontsource/andika/latin-400.css'
import '@fontsource/andika/latin-700.css'

// =============================================================
//  Appli « Lis-moi » : réglages de la tablette
//  (vitesse, police, taille, interligne, espacement, fond, focus, texte simple ;
//  « sons en couleur » : seulement le temps de la lecture, jamais mémorisé)
//  Petits réglages d'affichage seulement, gardés sur l'appareil —
//  aucune donnée de lecture.
// =============================================================
// Clé v2 (22/11/2026) : nouveaux espacements par défaut. Les réglages d'avant (taille, fond, vitesse…)
// sont repris à la première ouverture, sauf l'espacement, qui repart du nouveau défaut « Confort ».
const CLE = 'lisMoi_reglages_v2'
const CLE_ANCIENNE = 'lisMoi_reglages'
const DEFAUT = {
  voix: VOIX_DEFAUT,
  vitesse: VITESSE_DEFAUT,
  taille: 1,
  police: 'lexend',
  interligne: 'large',
  espacement: 'confort',
  fond: 'creme',
  focus: false,
  couleursSons: false, // « Sons en couleur » : éteint à chaque ouverture, jamais mémorisé
  texteSimple: false, // « Texte simple » : sans la mise en page (titres, listes)
}

// « Sons en couleur » n'est jamais mémorisé : à chaque ouverture d'une lecture il est éteint,
// et c'est l'élève qui l'allume (même si une ancienne valeur « allumé » traîne sur la tablette).
function lire() {
  try {
    let memorise = JSON.parse(localStorage.getItem(CLE) || 'null')
    if (!memorise) {
      memorise = JSON.parse(localStorage.getItem(CLE_ANCIENNE) || '{}')
      delete memorise.espacement
    }
    const r = { ...DEFAUT, ...memorise, couleursSons: false }
    if (!POLICES[r.police]) r.police = DEFAUT.police // ancienne police retirée (Atkinson) → Lexend
    return r
  } catch {
    return DEFAUT
  }
}

// Polices de lecture (recommandations des logopèdes, 22/11/2026) : Lexend par défaut,
// Andika (lecteurs débutants, a et g « d'écriture »), Verdana (police de l'appareil, connue de l'école ;
// remplacée par une police voisine sur les appareils qui ne l'ont pas)
export const POLICES = {
  lexend: { nom: 'Lexend', detail: 'Lexend', famille: "'Lexend', system-ui, sans-serif" },
  andika: { nom: 'Andika', detail: 'Andika', famille: "'Andika', system-ui, sans-serif" },
  verdana: { nom: 'Verdana', detail: 'Verdana', famille: "Verdana, 'DejaVu Sans', Geneva, system-ui, sans-serif" },
}

export const INTERLIGNES = {
  normal: { nom: 'Normal', valeur: 1.55 },
  large: { nom: 'Large', valeur: 1.8 },
  tresLarge: { nom: 'Très large', valeur: 2.3 },
}

// Lettres +0,05 à +0,08 em, mots +0,15 à +0,25 em recommandés : « Confort » est le défaut
export const ESPACEMENTS = {
  serre: { nom: 'Serré', lettres: '0.01em', mots: '0.08em' },
  confort: { nom: 'Confort', lettres: '0.05em', mots: '0.15em' },
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
    espacement: ESPACEMENTS[reglages.espacement] || ESPACEMENTS.confort,
    fond: FONDS[reglages.fond] || FONDS.creme,
  }
}

// Les polices sont dans le site (imports en haut du fichier) : il ne reste ici que le titre de l'onglet
export function chargerPolices() {
  document.title = 'Lis-moi'
}
