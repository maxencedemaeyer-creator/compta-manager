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
// Moteur de la voix (décision de Max, 20 nov.) : 'piper' = voix libre « siwis » (Piper, open source,
// calculée sur l'appareil, gratuite, sans compte ; ~60 Mo téléchargés la 1re fois) ;
// 'azure' = voix Azure via /api/tts (compte Azure de Max suspendu : essai gratuit expiré).
export const MOTEUR_VOIX = 'piper'
export const VOIX_PIPER = 'fr_FR-siwis-medium'

// Décision de Max (20 nov.) : pas de choix de voix pour l'élève, voix de femme Vivienne.
// (La liste ci-dessus reste pour plus tard ; l'interface ne l'affiche plus.)
export const VOIX_DEFAUT = 'fr-FR-VivienneMultilingualNeural'

// Vitesse en % (réglage « prosody rate » d'Azure)
// valeur : vitesse Azure (%) · debit : vitesse de lecture du son Piper (1 = normal)
export const VITESSES = [
  { id: 'lent', nom: 'Lent', valeur: -30, debit: 0.8 },
  { id: 'normal', nom: 'Normal', valeur: -8, debit: 1 },
  { id: 'rapide', nom: 'Rapide', valeur: 15, debit: 1.2 },
]
export const VITESSE_DEFAUT = 'normal'

export const TAILLES_TEXTE = [20, 24, 28, 34, 40] // px
