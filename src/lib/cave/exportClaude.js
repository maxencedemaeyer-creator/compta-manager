import { STYLES } from '../../data/cave/styles.js'

// =============================================================
//  Texte à copier-coller dans une conversation avec Claude pour qu'il
//  enrichisse les bases de la cave (appellations, plats, cépages).
//  manques : [{ genre: 'appellation' | 'plat' | 'cepage', texte, nb, contexte }]
// =============================================================
export function texteEnrichissement(manques) {
  const par = (g) => manques.filter((m) => m.genre === g)
  const lignes = (liste) =>
    liste.map((m) => `- « ${m.texte} »${m.contexte ? ` (${m.contexte})` : ''}${m.nb > 1 ? ` — rencontré ${m.nb} fois` : ''}`).join('\n')

  const blocs = [
    'Dépôt compta-manager, application « Cave » (espace Maxence). Complète les bases de données ci-dessous, puis ouvre les modifications dans src/data/cave/ (une ligne par élément, même format que les lignes voisines), lance les tests (npm test) et pousse sur main.',
  ]

  const apps = par('appellation')
  if (apps.length) {
    blocs.push(
      `## Appellations absentes de la base (${apps.length})\nÀ ajouter dans src/data/cave/fr-*.js (France) ou it-*.js (Italie), dans le bon fichier de région.\n` +
        `Format : Nom;Région;TYPE=style[,prix[,minGarde-maxGarde]][~cépage+cépage] ; TYPE=…\n` +
        `TYPE : R rouge · B blanc · P rosé · E effervescent · D doux/liquoreux · F fortifié/oxydatif. Prix = prix moyen d'une bouteille en €. Exemple :\n` +
        `Chablis;Bourgogne;B=b-mineral,22,2-8~Chardonnay\n` +
        `Styles possibles (src/data/cave/styles.js) :\n${STYLES.map((s) => `  ${s.id} = ${s.nom}`).join('\n')}\n\n` +
        `À ajouter :\n${lignes(apps)}`
    )
  }

  const plats = par('plat')
  if (plats.length) {
    blocs.push(
      `## Plats non reconnus (${plats.length})\nÀ ajouter dans src/data/cave/plats-nommes.js (recettes), plats-ingredients.js (ingrédients) ou plats-modifs.js (sauces, cuissons, cuisines).\n` +
        `Format : mots|alias;genre;catégories;profil;fav=…;reg=…\n` +
        `genre : p plat connu · i ingrédient · m modificateur (sauce, cuisson) · c cuisine.\n` +
        `profil (0 à 5) : p poids, g gras, a acidité, e épices, s sucré, u umami, f fumé/grillé, m amertume, l salé. Ex. p3g4u3 (pour m et c : ajustements signés, ex. g+2a-1).\n` +
        `fav = ce qui s'accorde en classique : un style (mineral, vif, rond, tannique…), une couleur (@B blanc, @R rouge, @P rosé, @E effervescent, @D doux, @F fortifié), un nom d'appellation, de région ou de cépage.\n` +
        `reg = pays et région d'origine du plat (fr, it, toscane, bourgogne…).\n` +
        `Exemple : risotto aux champignons;p;feculent,champi;p3g3u5;fav=r-pinot,nebbiolo,@R;reg=it,piemont\n\n` +
        `À ajouter :\n${lignes(plats)}`
    )
  }

  const cepages = par('cepage')
  if (cepages.length) {
    blocs.push(
      `## Cépages absents de la base (${cepages.length})\nÀ ajouter dans src/data/cave/cepages.js. Format : Nom;couleur (N noir, B blanc, G gris);caractère;où on le trouve\n\n` +
        `À ajouter :\n${lignes(cepages)}`
    )
  }

  if (blocs.length === 1) return ''
  return blocs.join('\n\n')
}
