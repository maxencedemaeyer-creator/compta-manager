// =============================================================
//  Appli « Lis-moi » : trouver le mot le plus proche d'un point de l'écran
//  (sans React) — voir TexteLisible.jsx
// =============================================================
// Mot le plus proche d'un point de l'écran (x, y), s'il y en a un à moins de ~0,9 × la taille du texte
// (≈ 20 à 36 px) : permet de poser le doigt un peu à gauche du premier mot d'une ligne,
// entre deux mots ou dans la marge, comme sur iPhone. Même ligne seulement (± une demi-hauteur de mot).
export function motProche(boite, x, y) {
  if (!boite) return null
  const tolerance = (parseFloat(getComputedStyle(boite).fontSize) || 24) * 0.9
  let meilleur = null
  let distMin = Infinity
  for (const m of boite.querySelectorAll('[data-i]')) {
    const r = m.getBoundingClientRect()
    const dy = y < r.top ? r.top - y : y > r.bottom ? y - r.bottom : 0
    if (dy > r.height * 0.5) continue
    const dx = x < r.left ? r.left - x : x > r.right ? x - r.right : 0
    const d = Math.hypot(dx, dy)
    if (d < distMin) {
      distMin = d
      meilleur = m
    }
  }
  return distMin <= tolerance ? meilleur : null
}
