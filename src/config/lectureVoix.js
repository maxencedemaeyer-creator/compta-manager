// =============================================================
//  Appli « Lis-moi » : voix Azure et vitesses proposées
//  (la liste des voix autorisées est aussi dans api/_lecture.js)
// =============================================================
export const VOIX = [
  { id: 'fr-FR-DeniseNeural', nom: 'Denise', detail: 'Femme · France' },
  { id: 'fr-FR-VivienneMultilingualNeural', nom: 'Vivienne', detail: 'Femme · France' },
  { id: 'fr-FR-HenriNeural', nom: 'Henri', detail: 'Homme · France' },
  { id: 'fr-FR-RemyMultilingualNeural', nom: 'Rémy', detail: 'Homme · France' },
  { id: 'fr-BE-CharlineNeural', nom: 'Charline', detail: 'Femme · Belgique' },
  { id: 'fr-BE-GerardNeural', nom: 'Gérard', detail: 'Homme · Belgique' },
]
export const VOIX_DEFAUT = 'fr-FR-DeniseNeural'

// Vitesse en % (réglage « prosody rate » d'Azure)
export const VITESSES = [
  { id: 'lent', nom: 'Lent', valeur: -30 },
  { id: 'normal', nom: 'Normal', valeur: -8 },
  { id: 'rapide', nom: 'Rapide', valeur: 15 },
]
export const VITESSE_DEFAUT = 'normal'

export const TAILLES_TEXTE = [20, 24, 28, 34, 40] // px
