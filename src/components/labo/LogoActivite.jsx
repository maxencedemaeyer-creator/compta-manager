// =============================================================
//  Le logo d'une activité du labo (comme une icône d'appli) :
//  une tuile de sa couleur avec son icône au centre.
//  Utilisé dans la salle (cartes) et en haut de chaque jeu.
// =============================================================
export default function LogoActivite({ activite, taille = 64, className = '' }) {
  const c = activite.couleur
  return (
    <span
      className={`flex flex-none items-center justify-center rounded-[28%] ${className}`}
      style={{ width: taille, height: taille, background: `linear-gradient(145deg, ${c}, ${c}B3)`, boxShadow: `0 6px 22px ${c}55, inset 0 1px 0 rgba(255,255,255,.45)` }}
    >
      <activite.icon size={Math.round(taille * 0.56)} strokeWidth={2.1} color="#070B16" />
    </span>
  )
}
