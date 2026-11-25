// Une expérience du labo est-elle visible par les élèves ?
//  - normale : visible tant qu'elle n'est pas dans « masquees »
//  - masqueeParDefaut : cachée tant qu'elle n'est pas dans « visibles »
// (listes lues dans Firebase : laboConfig/experiences, réglées dans l'Espace prof)
export function estVisible(config, experience) {
  if (experience.masqueeParDefaut) return (config.visibles || []).includes(experience.id)
  return !(config.masquees || []).includes(experience.id)
}
