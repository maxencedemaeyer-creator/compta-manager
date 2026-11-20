import { useCallback, useEffect, useState } from 'react'
import { TAILLES_TEXTE, VITESSE_DEFAUT, VOIX_DEFAUT } from '../../config/lectureVoix.js'

// =============================================================
//  Appli « Lis-moi » : réglages de la tablette (voix, vitesse,
//  taille et police du texte). Petits réglages d'affichage
//  seulement, gardés sur l'appareil — aucune donnée de lecture.
// =============================================================
const CLE = 'lisMoi_reglages'
const DEFAUT = { voix: VOIX_DEFAUT, vitesse: VITESSE_DEFAUT, taille: 1, police: 'lexend' }

function lire() {
  try {
    return { ...DEFAUT, ...JSON.parse(localStorage.getItem(CLE) || '{}') }
  } catch {
    return DEFAUT
  }
}

export function useReglages() {
  const [reglages, setReglages] = useState(lire)

  useEffect(() => {
    try {
      localStorage.setItem(CLE, JSON.stringify(reglages))
    } catch {
      /* navigation privée : tant pis */
    }
  }, [reglages])

  const changer = useCallback((modif) => setReglages((r) => ({ ...r, ...modif })), [])
  const taillePx = TAILLES_TEXTE[Math.max(0, Math.min(TAILLES_TEXTE.length - 1, reglages.taille))]
  return { reglages, changer, taillePx }
}

// Polices de lecture (Google Fonts, chargées seulement dans cette appli)
export const POLICES = {
  lexend: { nom: 'Lexend', famille: "'Lexend', system-ui, sans-serif" },
  andika: { nom: "Lettres d'école", famille: "'Andika', system-ui, sans-serif" },
}

export function chargerPolices() {
  document.title = 'Lis-moi'
  if (document.getElementById('polices-lecture')) return
  const lien = document.createElement('link')
  lien.id = 'polices-lecture'
  lien.rel = 'stylesheet'
  lien.href = 'https://fonts.googleapis.com/css2?family=Andika:wght@400;700&family=Lexend:wght@400;500;600;700&display=swap'
  document.head.appendChild(lien)
}
