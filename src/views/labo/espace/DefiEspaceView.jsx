import { melanger } from '../../../components/labo/CadreJeu.jsx'
import DefiEclair from '../../../components/labo/defi/DefiEclair.jsx'
import { famille, paquet, questionQCM, questionVF } from '../../../components/labo/defi/tirage.js'
import { PLANETES, PHASES } from '../../../components/labo/espace/donnees.js'
import { IconePhase } from './PhasesView.jsx'
import { Boule, PageEspace } from './commun.jsx'

// =============================================================
//  S13 · Défi — le grand test de « L'espace » (60 s).
//  Vrai/faux, questions à choix, « quelle phase de la Lune ? » et « quelle planète ? » tirés au hasard.
//  Chaque question est liée à une activité (act) → bilan final avec lien « à revoir ».
//  Records du jour / de tous les temps (Firebase, laboDefiEspace).
//  Moteur : components/labo/defi/DefiEclair.jsx. Attendus 99 à 109.
// =============================================================
// [activité, affirmation]
const VRAIS = [
  ['systeme', 'Le Soleil est une étoile.'],
  ['systeme', 'Le Soleil est au centre du Système solaire.'],
  ['systeme', 'Il y a huit planètes dans le Système solaire.'],
  ['systeme', 'Mercure est la planète la plus proche du Soleil.'],
  ['systeme', 'Neptune est la planète la plus éloignée du Soleil.'],
  ['systeme', 'Jupiter est la plus grosse planète du Système solaire.'],
  ['systeme', 'Saturne est entourée de grands anneaux.'],
  ['systeme', 'Mars est surnommée la planète rouge.'],
  ['systeme', 'Vénus est la planète la plus chaude du Système solaire.'],
  ['systeme', 'Pluton est une planète naine.'],
  ['systeme', 'La Terre est la troisième planète en partant du Soleil.'],
  ['rotation', 'La Terre tourne sur elle‑même en 24 heures.'],
  ['rotation', 'La rotation de la Terre explique le jour et la nuit.'],
  ['rotation', 'Quand il fait jour chez nous, il fait nuit de l’autre côté de la Terre.'],
  ['rotation', 'Le Soleil se lève à l’est.'],
  ['rotation', 'La Terre tourne vers l’est.'],
  ['revolution', 'La Terre fait le tour du Soleil en un an.'],
  ['revolution', 'Une année dure environ 365 jours et un quart.'],
  ['revolution', 'La révolution de la Terre dure un an.'],
  ['revolution', 'La Terre tourne autour du Soleil.'],
  ['revolution', 'Mars met plus de temps que la Terre pour faire le tour du Soleil.'],
  ['phases', 'La Lune ne produit pas de lumière : elle renvoie celle du Soleil.'],
  ['phases', 'Il faut environ 29 jours et demi pour passer d’une pleine Lune à la suivante.'],
  ['phases', 'La Lune montre toujours la même face à la Terre.'],
  ['phases', 'À la pleine Lune, on voit toute la face éclairée.'],
  ['phases', 'La Lune tourne autour de la Terre.'],
  ['phases', 'La moitié de la Lune est toujours éclairée par le Soleil.'],
  ['eclipses', 'Lors d’une éclipse de Soleil, la Lune passe devant le Soleil.'],
  ['eclipses', 'Une éclipse de Lune a lieu à la pleine Lune.'],
  ['eclipses', 'Lors d’une éclipse de Lune, la Lune entre dans l’ombre de la Terre.'],
  ['eclipses', 'Une éclipse de Soleil a lieu à la nouvelle Lune.'],
  ['eclipses', 'L’orbite de la Lune est inclinée : voilà pourquoi il n’y a pas d’éclipse chaque mois.'],
  ['eclipses', 'On ne doit jamais regarder le Soleil sans protection, même pendant une éclipse.'],
  ['saisons', 'Les saisons existent parce que l’axe de la Terre est incliné.'],
  ['saisons', 'Quand c’est l’été en Belgique, c’est l’hiver en Australie.'],
  ['saisons', 'En été, le Soleil monte plus haut dans le ciel qu’en hiver.'],
  ['saisons', 'En Belgique, les jours sont plus longs en été qu’en hiver.'],
  ['saisons', 'La Terre est plus proche du Soleil en janvier qu’en juillet.'],
  ['saisons', 'Au pôle Nord, le Soleil ne se couche pas en été.'],
  ['saisons', 'À l’équateur, les jours durent toute l’année environ 12 heures.'],
  ['saisons', 'L’axe de la Terre pointe toujours vers la même direction dans l’espace.'],
  ['planetes', 'Jupiter et Saturne sont des géantes gazeuses.'],
  ['planetes', 'Uranus et Neptune sont des géantes de glaces.'],
  ['planetes', 'Mercure, Vénus, la Terre et Mars sont des planètes rocheuses.'],
  ['planetes', 'Uranus tourne couchée sur le côté.'],
  ['echelle', 'Plus d’un million de Terres tiendraient dans le Soleil.'],
  ['echelle', 'La lumière du Soleil met environ 8 minutes à arriver sur Terre.'],
  ['echelle', 'Le Système solaire est surtout fait de vide.'],
  ['echelle', 'Si le Soleil était un ballon d’un mètre, la Terre serait un petit pois.'],
  ['cometes', 'Une comète est faite de glace et de poussière.'],
  ['cometes', 'La queue d’une comète pointe toujours à l’opposé du Soleil.'],
  ['cometes', 'La comète de Halley revient environ tous les 75 ans.'],
  ['cometes', 'Une comète va plus vite quand elle est près du Soleil.'],
  ['cometes', 'Une comète n’a pas de queue quand elle est très loin du Soleil.'],
  ['galaxie', 'Le Soleil fait partie de la Voie lactée.'],
  ['galaxie', 'Une galaxie contient des milliards d’étoiles.'],
  ['galaxie', 'Andromède est une galaxie voisine de la Voie lactée.'],
  ['galaxie', 'Une année‑lumière est une distance.'],
  ['galaxie', 'Il existe des galaxies de formes différentes.'],
  ['galaxie', 'Proxima du Centaure est l’étoile la plus proche du Soleil.'],
  ['modeles', 'Aristote a donné des preuves que la Terre est ronde.'],
  ['modeles', 'Copernic a remis le Soleil au centre.'],
  ['modeles', 'Galilée a vu des lunes autour de Jupiter avec sa lunette.'],
  ['modeles', 'Kepler a montré que les orbites des planètes sont des ellipses.'],
  ['modeles', 'Pendant longtemps, on a cru que la Terre était au centre de l’Univers.'],
  ['mots', 'Un satellite naturel est un astre qui tourne autour d’une planète.'],
  ['mots', 'Une orbite est le chemin d’un astre qui tourne autour d’un autre.'],
  ['mots', 'La Lune est le satellite naturel de la Terre.'],
]
const FAUX = [
  ['systeme', 'Le Soleil est une planète.'],
  ['systeme', 'La Terre est la planète la plus proche du Soleil.'],
  ['systeme', 'Il y a neuf planètes dans le Système solaire.'],
  ['systeme', 'Saturne est la plus grosse planète du Système solaire.'],
  ['systeme', 'Mercure est la planète la plus chaude du Système solaire.'],
  ['systeme', 'Mars est une géante gazeuse.'],
  ['systeme', 'Jupiter est une planète rocheuse.'],
  ['systeme', 'Pluton est toujours considérée comme une planète.'],
  ['rotation', 'La Terre tourne sur elle‑même en un an.'],
  ['rotation', 'Le jour et la nuit existent parce que la Terre tourne autour du Soleil.'],
  ['rotation', 'Il fait jour partout sur la Terre en même temps.'],
  ['rotation', 'Le Soleil se lève à l’ouest.'],
  ['rotation', 'Le Soleil fait le tour de la Terre en 24 heures.'],
  ['revolution', 'La Terre fait le tour du Soleil en un jour.'],
  ['revolution', 'La Terre fait le tour du Soleil en un mois.'],
  ['revolution', 'La Terre est immobile.'],
  ['revolution', 'Neptune fait le tour du Soleil plus vite que la Terre.'],
  ['phases', 'La Lune produit sa propre lumière.'],
  ['phases', 'Les phases de la Lune viennent de l’ombre de la Terre.'],
  ['phases', 'On voit la face cachée de la Lune depuis la Terre.'],
  ['phases', 'À la nouvelle Lune, on voit toute la Lune éclairée.'],
  ['phases', 'La Lune fait le tour de la Terre en un jour.'],
  ['phases', 'La Lune est plus grosse que la Terre.'],
  ['eclipses', 'Il y a une éclipse de Soleil à chaque nouvelle Lune.'],
  ['eclipses', 'Lors d’une éclipse de Lune, la Lune passe devant le Soleil.'],
  ['eclipses', 'Une éclipse de Soleil a lieu à la pleine Lune.'],
  ['eclipses', 'On peut regarder une éclipse de Soleil sans protection.'],
  ['saisons', 'Les saisons viennent de la distance entre la Terre et le Soleil.'],
  ['saisons', 'Quand c’est l’été en Belgique, c’est aussi l’été en Australie.'],
  ['saisons', 'En hiver, la Terre est plus loin du Soleil : c’est pour ça qu’il fait froid.'],
  ['saisons', 'L’axe de la Terre est tout droit, pas incliné.'],
  ['saisons', 'Au pôle Nord, il fait jour toute l’année.'],
  ['saisons', 'À l’équateur, il y a quatre saisons très marquées.'],
  ['saisons', 'En hiver, le Soleil monte plus haut dans le ciel qu’en été.'],
  ['planetes', 'Uranus est une planète rocheuse.'],
  ['planetes', 'Neptune est la planète la plus proche du Soleil.'],
  ['planetes', 'Vénus est la plus grosse planète.'],
  ['planetes', 'Saturne est la seule planète à avoir des anneaux.'],
  ['echelle', 'La Terre est plus grosse que le Soleil.'],
  ['echelle', 'La lumière du Soleil arrive sur Terre en une seconde.'],
  ['echelle', 'Les planètes sont toutes très proches les unes des autres.'],
  ['echelle', 'Neptune est plus près du Soleil que Jupiter.'],
  ['cometes', 'Une comète est une étoile.'],
  ['cometes', 'La queue d’une comète est toujours derrière elle, dans le sens de son mouvement.'],
  ['cometes', 'Une étoile filante est une comète.'],
  ['cometes', 'Une comète va toujours à la même vitesse.'],
  ['cometes', 'La comète de Halley passe tous les ans.'],
  ['galaxie', 'Le Soleil est au centre de la Voie lactée.'],
  ['galaxie', 'Une galaxie est plus petite qu’une étoile.'],
  ['galaxie', 'Toutes les galaxies ont la forme d’une spirale.'],
  ['galaxie', 'Une année‑lumière est une durée.'],
  ['galaxie', 'La Voie lactée est la seule galaxie de l’Univers.'],
  ['modeles', 'Copernic pensait que le Soleil tourne autour de la Terre.'],
  ['modeles', 'Ptolémée plaçait le Soleil au centre de l’Univers.'],
  ['modeles', 'Galilée vivait dans l’Antiquité.'],
  ['modeles', 'Avant Galilée, personne n’avait jamais pensé que la Terre était ronde.'],
  ['mots', 'La rotation est le tour d’une planète autour de son étoile.'],
  ['mots', 'La révolution est le tour d’un astre sur lui‑même.'],
  ['mots', 'Un satellite naturel tourne autour d’une étoile.'],
]
// [activité, question, bonne réponse, choix]
const QCM = [
  ['systeme', 'Quelle planète est la plus proche du Soleil ?', 'Mercure', ['Mercure', 'Vénus', 'Mars']],
  ['systeme', 'Quelle est la plus grosse planète ?', 'Jupiter', ['Jupiter', 'Saturne', 'Neptune']],
  ['systeme', 'Combien y a‑t‑il de planètes dans le Système solaire ?', '8', ['6', '8', '9']],
  ['systeme', 'Quelle planète a de grands anneaux bien visibles ?', 'Saturne', ['Saturne', 'Mars', 'Mercure']],
  ['systeme', 'Quelle est la troisième planète en partant du Soleil ?', 'La Terre', ['La Terre', 'Vénus', 'Mars']],
  ['systeme', 'Qu’est‑ce que le Soleil ?', 'Une étoile', ['Une étoile', 'Une planète', 'Une comète']],
  ['rotation', 'En combien de temps la Terre tourne‑t‑elle sur elle‑même ?', '24 heures', ['24 heures', '1 mois', '1 an']],
  ['rotation', 'Qu’est‑ce qui crée le jour et la nuit ?', 'La rotation de la Terre', ['La rotation de la Terre', 'Les nuages', 'L’ombre de la Lune']],
  ['rotation', 'De quel côté le Soleil se lève‑t‑il ?', 'À l’est', ['À l’est', 'À l’ouest', 'Au nord']],
  ['revolution', 'Combien de temps la Terre met‑elle pour faire le tour du Soleil ?', '1 an', ['1 jour', '1 mois', '1 an']],
  ['revolution', 'Combien de jours dure environ une année ?', '365', ['30', '365', '1 000']],
  ['phases', 'Quelle phase montre toute la face éclairée de la Lune ?', 'Pleine Lune', ['Pleine Lune', 'Nouvelle Lune', 'Premier quartier']],
  ['phases', 'Combien de temps faut‑il pour passer d’une pleine Lune à la suivante ?', 'Environ 29 jours', ['Environ 7 jours', 'Environ 29 jours', 'Environ 1 an']],
  ['phases', 'D’où vient la lumière de la Lune ?', 'Du Soleil', ['Du Soleil', 'De la Terre', 'D’elle‑même']],
  ['eclipses', 'Dans une éclipse de Soleil, qu’est‑ce qui passe devant le Soleil ?', 'La Lune', ['La Lune', 'La Terre', 'Une planète']],
  ['eclipses', 'Dans une éclipse de Lune, la Lune entre dans…', 'l’ombre de la Terre', ['l’ombre de la Terre', 'l’ombre du Soleil', 'un nuage']],
  ['eclipses', 'Pourquoi n’y a‑t‑il pas d’éclipse chaque mois ?', 'L’orbite de la Lune est inclinée', ['L’orbite de la Lune est inclinée', 'La Lune est trop petite', 'Le Soleil s’éteint']],
  ['saisons', 'Pourquoi y a‑t‑il des saisons ?', 'L’axe de la Terre est incliné', ['L’axe de la Terre est incliné', 'La Terre s’éloigne du Soleil', 'La Lune change de phase']],
  ['saisons', 'Quand c’est l’été en Belgique, c’est… en Australie.', 'l’hiver', ['l’hiver', 'l’été', 'le printemps']],
  ['saisons', 'Quelle saison commence le 21 juin dans l’hémisphère Nord ?', 'L’été', ['L’été', 'L’hiver', 'Le printemps']],
  ['saisons', 'En hiver, en Belgique, les jours sont…', 'courts', ['courts', 'longs', 'toujours de 12 heures']],
  ['planetes', 'Quel type de planète est Jupiter ?', 'Une géante gazeuse', ['Une géante gazeuse', 'Une planète rocheuse', 'Une planète naine']],
  ['planetes', 'Quelle planète est surnommée la planète rouge ?', 'Mars', ['Mars', 'Vénus', 'Jupiter']],
  ['planetes', 'Pluton est…', 'une planète naine', ['une planète naine', 'une grande planète', 'une étoile']],
  ['echelle', 'Combien de temps la lumière du Soleil met‑elle pour arriver sur Terre ?', 'Environ 8 minutes', ['Environ 1 seconde', 'Environ 8 minutes', 'Environ 1 jour']],
  ['echelle', 'Si le Soleil était un ballon d’un mètre, la Terre serait…', 'un petit pois', ['un petit pois', 'un ballon de foot', 'une orange']],
  ['cometes', 'De quoi est faite une comète ?', 'De glace et de poussière', ['De glace et de poussière', 'De gaz brûlant', 'De métal pur']],
  ['cometes', 'Où pointe la queue d’une comète ?', 'À l’opposé du Soleil', ['À l’opposé du Soleil', 'Vers le Soleil', 'Vers la Terre']],
  ['cometes', 'Tous les combien d’années revient la comète de Halley ?', 'Environ 75 ans', ['Environ 7 ans', 'Environ 75 ans', 'Environ 750 ans']],
  ['galaxie', 'Comment s’appelle notre galaxie ?', 'La Voie lactée', ['La Voie lactée', 'Andromède', 'Le Grand Nuage']],
  ['galaxie', 'Une année‑lumière mesure…', 'une distance', ['une distance', 'une durée', 'une vitesse']],
  ['modeles', 'Qui a observé des lunes autour de Jupiter avec une lunette ?', 'Galilée', ['Galilée', 'Ptolémée', 'Aristote']],
  ['modeles', 'Qui a remis le Soleil au centre en 1543 ?', 'Copernic', ['Copernic', 'Kepler', 'Aristote']],
  ['mots', 'Comment appelle‑t‑on le tour d’un astre sur lui‑même ?', 'La rotation', ['La rotation', 'La révolution', 'L’orbite']],
  ['mots', 'Comment appelle‑t‑on le tour d’un astre autour d’un autre ?', 'La révolution', ['La révolution', 'La rotation', 'La phase']],
  ['mots', 'La Lune est… de la Terre.', 'le satellite naturel', ['le satellite naturel', 'l’étoile', 'la comète']],
]
const tirerVrai = paquet(VRAIS)
const tirerFaux = paquet(FAUX)
const tirerQcm = paquet(QCM)
const tirerPhase = paquet(PHASES)
const tirerPlanete = paquet(PLANETES)

function questionPhase() {
  const p = tirerPhase()
  // l'angle varie un peu pour que ce ne soit pas toujours le même dessin
  const e = (p.a + (Math.random() - 0.5) * 14 + 360) % 360
  const autres = melanger(PHASES.filter((x) => x.id !== p.id)).slice(0, 3)
  return { act: 'phases', type: 'phase', e, choix: melanger([p, ...autres]).map((x) => x.id), bonne: p.id }
}
function questionPlanete() {
  const p = tirerPlanete()
  const autres = melanger(PLANETES.filter((x) => x.id !== p.id)).slice(0, 3)
  return { act: 'planetes', type: 'planete', cible: p, choix: melanger([p, ...autres]).map((x) => x.id), bonne: p.id }
}
const question = () =>
  famille([
    [14, questionPhase],
    [14, questionPlanete],
    [38, () => questionVF(tirerVrai, tirerFaux)],
    [34, () => questionQCM(tirerQcm)],
  ])

const nomChoix = (q, c) => {
  if (q.type === 'phase') return PHASES.find((p) => p.id === c).nom
  if (q.type === 'planete') return PLANETES.find((p) => p.id === c).nom
  return { vrai: 'Vrai', faux: 'Faux' }[c] || c
}

function rendu(q) {
  if (q.type === 'phase')
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-2">
        <p className="text-sm text-[#B9C1E3]">Quelle phase de la Lune est‑ce ?</p>
        <IconePhase e={q.e} taille={130} />
      </div>
    )
  if (q.type === 'planete')
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-2">
        <p className="text-sm text-[#B9C1E3]">Quelle planète est‑ce ?</p>
        <Boule key={q.cible.id} texture={q.cible.texture} taille={120} anneaux={!!q.cible.anneaux} />
      </div>
    )
  return <p className="labo-titre flex min-h-[200px] items-center justify-center text-center text-xl font-bold text-white">{q.texte}</p>
}

export default function DefiEspaceView() {
  return (
    <DefiEclair
      Page={PageEspace}
      cadre={{ code: 'S13', titre: 'Défi', attendus: [99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109], couleur: '#FFE45E' }}
      experience="espace"
      nomCollection="laboDefiEspace"
      question={question}
      rendu={rendu}
      nomChoix={nomChoix}
      annonce="Planètes, Lune, saisons, étoiles : montre tout ce que tu sais de l’espace !"
    />
  )
}
