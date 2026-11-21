// =============================================================
//  Savoir écrire — compétences ciblées par la banque d'idées
//
//  Un « tag » = une compétence d'écriture que l'on peut travailler
//  (l'imparfait, l'accord des participes, la phrase…). Pour chaque tag :
//   - nom / emoji : affichage
//   - criteres    : critères de réussite proposés au tableau
//   - aide        : coup de pouce pour la version allégée
//   - contraintes : défis ludiques propres à cette compétence
//
//  TAGS_PAR_ATTENDU relie chaque attendu du domaine Écrire (id du fichier
//  JSON) aux tags qu'il permet de travailler.
// =============================================================
export const TAGS = {
  imparfait: {
    nom: 'Imparfait',
    emoji: '⏳',
    criteres: [
      'J’écris au moins 5 verbes à l’imparfait.',
      'Les terminaisons sont justes (-ais, -ait, -ions, -iez, -aient).',
      'J’utilise l’imparfait pour décrire un décor ou des habitudes.',
    ],
    aide: [
      'Terminaisons : je -ais · tu -ais · il -ait · nous -ions · vous -iez · ils -aient.',
      'Pour trouver le radical : je prends « nous » au présent et j’enlève -ons.',
    ],
    contraintes: [
      'Utilise au moins 5 verbes à l’imparfait et souligne-les.',
      'Commence trois phrases par « Autrefois », « À cette époque » ou « Chaque jour ».',
      'Écris une phrase avec « nous » et une phrase avec « ils » à l’imparfait.',
      'Fais appel aux cinq sens : je voyais, j’entendais, je sentais…',
    ],
  },
  passe_compose: {
    nom: 'Passé composé',
    emoji: '✔️',
    criteres: [
      'J’emploie le passé composé pour des actions terminées.',
      'Je choisis le bon auxiliaire (avoir ou être).',
      'J’accorde le participe passé quand c’est nécessaire.',
    ],
    aide: [
      'Auxiliaire + participe passé : j’ai mangé, elle est partie.',
      'Les verbes de mouvement (aller, partir, arriver, venir…) se conjuguent souvent avec « être ».',
    ],
    contraintes: [
      'Écris 6 phrases qui commencent chacune par un mot de temps (d’abord, puis, ensuite, enfin…).',
      'Utilise 3 verbes avec « être » et 3 verbes avec « avoir ».',
      'Termine par une phrase au présent qui donne ton avis.',
    ],
  },
  futur: {
    nom: 'Futur',
    emoji: '🚀',
    criteres: [
      'J’utilise le futur simple (et le futur proche si je veux).',
      'Les terminaisons sont justes (-rai, -ras, -ra, -rons, -rez, -ront).',
      'Mes prévisions sont cohérentes entre elles.',
    ],
    aide: [
      'Futur simple : infinitif + -ai, -as, -a, -ons, -ez, -ont.',
      'Futur proche : aller (au présent) + infinitif : je vais écrire.',
    ],
    contraintes: [
      'Écris 6 prédictions qui commencent chacune par un mot différent (demain, bientôt, plus tard…).',
      'Utilise 3 verbes irréguliers au futur (aller, avoir, être, faire, voir…).',
      'Mélange le futur simple et le futur proche dans ton texte.',
    ],
  },
  conditionnel: {
    nom: 'Conditionnel',
    emoji: '💭',
    criteres: [
      'J’utilise le conditionnel présent pour imaginer.',
      'Je construis des phrases « Si + imparfait, … conditionnel ».',
      'Les terminaisons sont justes (-rais, -rait, -rions, -riez, -raient).',
    ],
    aide: [
      'Si + imparfait → conditionnel : « Si j’avais des ailes, je volerais. »',
      'Conditionnel : infinitif + -ais, -ais, -ait, -ions, -iez, -aient.',
    ],
    contraintes: [
      'Écris au moins 4 phrases qui commencent par « Si… ».',
      'Utilise 3 verbes irréguliers au conditionnel.',
      'Termine par une demande polie au conditionnel (« Je voudrais… », « Pourriez-vous… »).',
    ],
  },
  plus_que_parfait: {
    nom: 'Temps composés',
    emoji: '⏪',
    criteres: [
      'J’emploie le plus-que-parfait pour dire ce qui s’est passé avant.',
      'Je forme bien l’auxiliaire à l’imparfait + le participe passé.',
      'Mes temps restent cohérents avec le temps principal du récit.',
    ],
    aide: ['Plus-que-parfait : auxiliaire à l’imparfait + participe passé : j’avais fini, elle était partie.'],
    contraintes: [
      'Écris au moins 3 phrases qui expliquent ce qui s’était passé avant.',
      'Raconte l’histoire à l’envers : commence par la fin, puis explique ce qui s’était passé.',
      'Souligne en rouge tous les verbes au plus-que-parfait.',
    ],
  },
  passe_simple: {
    nom: 'Passé simple',
    emoji: '📜',
    criteres: [
      'J’emploie le passé simple pour les actions du récit.',
      'Je conjugue correctement à la 3e personne (il, elle, ils, elles).',
      'Je garde le même temps du début à la fin du récit.',
    ],
    aide: ['À la 3e personne : il chanta, elle finit, il prit, ils virent… Beaucoup de verbes en -er font -a et -èrent.'],
    contraintes: [
      'Écris un début de conte en 6 phrases au passé simple.',
      'Utilise 3 verbes irréguliers au passé simple (prendre, venir, voir, dire…).',
      'Commence par « Il était une fois… » puis continue au passé simple.',
    ],
  },
  imperatif: {
    nom: 'Impératif',
    emoji: '📣',
    criteres: [
      'J’emploie l’impératif présent pour donner des consignes.',
      'Je conjugue correctement (« mange » sans -s avec « tu » pour les verbes en -er).',
      'Mes consignes suivent un ordre logique.',
    ],
    aide: ['L’impératif s’écrit sans sujet : tu → mange ! · nous → mangeons ! · vous → mangez !'],
    contraintes: [
      'Écris exactement 6 consignes numérotées.',
      'Utilise « tu » dans la première moitié, puis « vous » dans la seconde.',
      'Termine par un conseil de sécurité.',
    ],
  },
  concordance: {
    nom: 'Cohérence des temps',
    emoji: '🧭',
    criteres: [
      'Mon décor et mes habitudes sont à l’imparfait.',
      'Mes actions principales sont au passé composé (ou au passé simple).',
      'Je n’ai pas mélangé les temps par erreur : relecture faite.',
    ],
    aide: ['Imparfait = ce qui dure, le décor. Passé composé = ce qui arrive d’un coup : « Il pleuvait quand j’ai entendu un bruit. »'],
    contraintes: [
      'Écris au moins 3 phrases avec « quand » : imparfait + passé composé.',
      'Souligne en bleu les verbes du décor et en rouge les verbes des actions.',
      'Écris le même récit au présent, puis au passé : compare.',
    ],
  },
  accord_gn: {
    nom: 'Accords du groupe du nom',
    emoji: '🔗',
    criteres: [
      'J’accorde les déterminants et les adjectifs avec le nom (genre et nombre).',
      'Je vérifie les pluriels et les féminins particuliers.',
      'Je me suis relu(e) en entourant chaque nom et en contrôlant ses accompagnateurs.',
    ],
    aide: ['Je cherche le nom, puis je regarde le déterminant et l’adjectif : ils ont le même genre et le même nombre.'],
    contraintes: [
      'Utilise au moins 5 adjectifs différents, tous au féminin pluriel.',
      'Écris au moins 3 noms au pluriel particulier (cheval, bijou, journal…).',
      'Surligne chaque groupe du nom : déterminant, nom, adjectif.',
    ],
  },
  accord_sv: {
    nom: 'Accord sujet-verbe',
    emoji: '🎯',
    criteres: [
      'Je trouve le sujet de chaque verbe avant d’écrire la terminaison.',
      'J’accorde le verbe avec son sujet, même quand il est loin ou après le verbe.',
      'Je vérifie les phrases qui ont plusieurs sujets.',
    ],
    aide: ['Question : « Qui est-ce qui + verbe ? » donne le sujet. Je le remplace par il, ils, elle ou elles pour contrôler.'],
    contraintes: [
      'Écris 3 phrases où le sujet est éloigné du verbe.',
      'Écris 2 phrases avec deux sujets (« Léa et Tom… »).',
      'Écris une phrase où le sujet est placé après le verbe.',
    ],
  },
  participe: {
    nom: 'Accord du participe passé',
    emoji: '🧩',
    criteres: [
      'Avec « être » : j’accorde le participe passé avec le sujet.',
      'Avec « avoir » : j’accorde seulement si le complément d’objet direct est placé avant le verbe.',
      'Employé comme un adjectif (une porte fermée), le participe s’accorde avec le nom.',
    ],
    aide: ['Avec être : elles sont parties. Avec avoir, je regarde si le complément est avant le verbe : les photos que j’ai prises.'],
    contraintes: [
      'Écris 4 phrases avec « être » et 4 phrases avec « avoir ».',
      'Écris 2 phrases où le complément est placé avant le verbe (« les fleurs que j’ai cueillies »).',
      'Écris un texte au passé composé dont le sujet est féminin pluriel.',
    ],
  },
  adverbes: {
    nom: 'Adverbes en -ment',
    emoji: '🐢',
    criteres: [
      'Je forme correctement les adverbes en -ment (adjectif au féminin + -ment).',
      'Je connais les formes particulières (vraiment, évidemment, constamment…).',
      'J’utilise les adverbes pour nuancer, sans en abuser.',
    ],
    aide: ['lent → lente → lentement. Cas particuliers : -ent → -emment (évidemment), -ant → -amment (constamment).'],
    contraintes: [
      'Utilise 6 adverbes en -ment différents.',
      'Écris 3 phrases où l’adverbe change complètement le sens (« Il court rapidement / lentement »).',
      'Remplace chaque « très » par un adverbe plus précis.',
    ],
  },
  phrase: {
    nom: 'La phrase',
    emoji: '🧱',
    criteres: [
      'Chaque phrase commence par une majuscule et finit par un signe de ponctuation.',
      'Chaque phrase a un sujet, un verbe et dit une idée complète.',
      'Je varie la longueur de mes phrases (courtes et longues).',
    ],
    aide: ['Une phrase simple : qui ? (groupe sujet) + que fait-il ? (prédicat) + où, quand ou comment ? (complément de phrase).'],
    contraintes: [
      'Écris exactement 5 phrases : 2 courtes, 2 moyennes, 1 longue.',
      'Chaque phrase doit contenir un complément de phrase (où, quand ou comment).',
      'N’utilise jamais « et » pour relier deux phrases : fais des phrases séparées.',
      'Écris une phrase de 4 mots, une de 8 mots et une de 12 mots.',
    ],
  },
  ponctuation: {
    nom: 'Ponctuation',
    emoji: '❗',
    criteres: [
      'J’utilise la virgule, le point, le point d’exclamation et le point d’interrogation à bon escient.',
      'Je ponctue correctement les paroles (deux-points, guillemets ou tirets).',
      'Mes majuscules sont à leur place.',
    ],
    aide: ['Dans un dialogue : deux-points, puis guillemets « … » ou tiret — à chaque fois que quelqu’un parle.'],
    contraintes: [
      'Utilise au moins 5 signes de ponctuation différents.',
      'Écris un dialogue de 6 répliques avec la ponctuation correcte.',
      'Écris ton texte sans ponctuation, puis avec : qu’est-ce qui change ?',
    ],
  },
  connecteurs: {
    nom: 'Connecteurs',
    emoji: '🪢',
    criteres: [
      'J’utilise au moins 4 connecteurs différents.',
      'Mes connecteurs ont du sens (opposition, conséquence, conclusion).',
      'Mon texte s’enchaîne : on comprend facilement l’ordre des idées.',
    ],
    aide: ['Opposition : mais, pourtant, cependant. Conséquence : donc, c’est pourquoi. Conclusion : enfin, en conclusion, pour finir.'],
    contraintes: [
      'Utilise au moins un connecteur d’opposition, un de conséquence et un de conclusion.',
      'Interdit de commencer deux phrases de suite par le même mot.',
      'Souligne tous tes connecteurs en vert.',
    ],
  },
  reprises: {
    nom: 'Reprises d’information',
    emoji: '🔁',
    criteres: [
      'Je ne répète pas le même mot : j’utilise des pronoms ou d’autres mots.',
      'On comprend toujours de qui ou de quoi je parle.',
      'J’ai vérifié que mes pronoms ne prêtent pas à confusion.',
    ],
    aide: ['Pour ne pas répéter « le chat » : il, ce félin, le petit animal, notre compagnon…'],
    contraintes: [
      'Parle du même personnage dans 5 phrases en l’appelant chaque fois autrement.',
      'Interdit de répéter un nom : remplace-le par un pronom ou un synonyme.',
      'Entoure tes mots de reprise et relie-les avec une flèche.',
    ],
  },
  vocabulaire: {
    nom: 'Vocabulaire précis',
    emoji: '💎',
    criteres: [
      'J’utilise des mots précis (pas « faire », « chose » ou « mettre » partout).',
      'J’emploie au moins 5 mots du thème.',
      'J’ai remplacé les mots répétés ou trop faibles par des mots plus justes.',
    ],
    aide: ['Banque de mots : je prépare 8 mots du thème avant d’écrire.'],
    contraintes: [
      'Interdit d’écrire « chose », « faire », « mettre », « très » et « beaucoup ».',
      'Utilise 5 mots du champ lexical du thème (liste préparée avant d’écrire).',
      'Remplace 3 mots génériques par des mots plus précis (oiseau → mésange).',
      'Utilise un synonyme pour chaque mot que tu as déjà employé.',
    ],
  },
  orthographe: {
    nom: 'Orthographe',
    emoji: '🔤',
    criteres: [
      'Je laisse une trace quand j’hésite (point d’interrogation ou crayon de couleur), puis je vérifie.',
      'Je vérifie les homophones (a/à, ou/où, et/est, on/ont, son/sont, ce/se…).',
      'J’utilise les outils de la classe (dictionnaire, référentiels) pour corriger.',
    ],
    aide: ['a/à : je remplace par « avait ». ou/où : je remplace par « ou bien ». et/est : je remplace par « était ».'],
    contraintes: [
      'Entoure 5 mots dont tu doutes, puis vérifie-les dans le dictionnaire.',
      'Utilise au moins 3 homophones différents dans ton texte (a/à, ou/où, ce/se…).',
      'Écris 4 mots de la même famille que le mot du jour.',
    ],
  },
  structure: {
    nom: 'Structure du texte',
    emoji: '🏗️',
    criteres: [
      'Mon texte respecte sa structure (début, milieu, fin ; introduction, arguments, conclusion…).',
      'Je suis resté(e) dans le sujet du début à la fin.',
      'J’ai regroupé mes idées en paragraphes (blocs de sens).',
    ],
    aide: ['Récit : situation de départ → problème → péripéties → fin. Description : vue d’ensemble → détails → impression finale.'],
    contraintes: [
      'Fais un plan en trois blocs avant de rédiger.',
      'Donne un titre à ton texte et un sous-titre à chaque partie.',
      'Écris un début, un milieu et une fin bien séparés.',
    ],
  },
  situation: {
    nom: 'Situation de communication',
    emoji: '✉️',
    criteres: [
      'Mon écrit est adapté à son destinataire (je sais à qui je m’adresse).',
      'Mon intention est claire (informer, convaincre, faire plaisir ou donner des consignes).',
      'Mon niveau de langue est adapté (familier, courant ou soutenu).',
    ],
    aide: ['Avant d’écrire, je réponds : Qui écrit ? À qui ? Pourquoi ? Quand et où ?'],
    contraintes: [
      'Écris le même message à deux destinataires différents (un ami, puis la direction).',
      'Réécris une phrase familière en langage soutenu.',
      'Note en haut de ta feuille : qui écrit, à qui, pourquoi.',
    ],
  },
  planification: {
    nom: 'Planifier avant d’écrire',
    emoji: '🗺️',
    criteres: [
      'J’ai fait un plan ou un brouillon avant d’écrire.',
      'Mes idées sont regroupées par blocs de sens.',
      'J’ai pensé à mon destinataire et à mon intention.',
    ],
    aide: ['Carte mentale : le thème au centre, une branche par idée.'],
    contraintes: [
      'Dessine une carte mentale en 3 minutes avant d’écrire.',
      'Écris d’abord 5 mots-clés, puis construis ton texte avec eux.',
      'Prépare ton plan en trois colonnes : début, milieu, fin.',
    ],
  },
  revision: {
    nom: 'Relire et corriger',
    emoji: '🔍',
    criteres: [
      'J’ai relu mon texte plusieurs fois, avec un but différent à chaque fois.',
      'J’ai utilisé la grille de vérification de la classe.',
      'J’ai corrigé avec les outils de la classe (dictionnaire, conjugueur, référentiels).',
    ],
    aide: ['Je relis une fois pour les idées, une fois pour les phrases, une fois pour l’orthographe.'],
    contraintes: [
      'Relis ton texte à voix basse : repère 3 endroits à améliorer.',
      'Échange ton texte avec un voisin qui le relit avec la grille.',
      'Corrige avec 3 couleurs : accords, verbes, ponctuation.',
    ],
  },
  presentation: {
    nom: 'Présentation',
    emoji: '🎨',
    criteres: [
      'Mon écriture est lisible et soignée.',
      'Ma présentation est adaptée à mon destinataire (titre, marges, paragraphes).',
      'À l’ordinateur : texte aligné, police lisible, pas de fautes soulignées.',
    ],
    aide: ['Je saute une ligne entre les paragraphes et je laisse une marge.'],
    contraintes: [
      'Présente ton texte en colonnes ou en encadré, comme dans un journal.',
      'Ajoute un titre et une illustration.',
      'Tape ton texte à l’ordinateur et mets-le en page.',
    ],
  },
  reflexif: {
    nom: 'Écrits de travail et réflexifs',
    emoji: '📓',
    criteres: [
      'J’exprime clairement ce que j’ai appris ou ressenti.',
      'Je mets mes idées dans l’ordre (ce que j’ai fait, ce que j’ai compris, ce qui m’a surpris).',
      'J’utilise des mots précis pour dire mes émotions.',
    ],
    aide: ['Phrases de départ : « Aujourd’hui, j’ai appris que… », « Ce qui m’a surpris, c’est… », « Je me suis senti(e)… parce que… »'],
    contraintes: [
      'Écris 3 phrases : j’ai appris… / j’ai ressenti… / je voudrais savoir…',
      'Termine par un petit schéma qui résume ton texte.',
      'Choisis 3 mots-clés qui résument ta journée et écris-les en gras.',
    ],
  },
  documentation: {
    nom: 'Sources et esprit critique',
    emoji: '🕵️',
    criteres: [
      'J’indique d’où viennent mes informations.',
      'Je compare au moins deux sources avant de conclure.',
      'Je donne mon avis sur la fiabilité de l’information.',
    ],
    aide: ['Je me pose les questions : Qui a écrit ? Quand ? Pourquoi ? Est-ce que d’autres sources disent la même chose ?'],
    contraintes: [
      'Utilise deux sources différentes et cite-les.',
      'Écris 3 questions à poser pour vérifier une information.',
      'Note ce que les deux sources disent de pareil et de différent.',
    ],
  },
}

export const TEMPS = ['imparfait', 'passe_compose', 'futur', 'conditionnel', 'plus_que_parfait', 'passe_simple', 'imperatif']

// Attendus (ids du JSON, domaine Écrire) → tags travaillés
export const TAGS_PAR_ATTENDU = (() => {
  const t = {}
  const poser = (de, a, tags) => {
    for (let id = de; id <= a; id += 1) t[id] = tags
  }
  poser(375, 376, ['structure', 'situation', 'planification'])
  poser(377, 377, ['reflexif', 'planification', 'revision'])
  poser(378, 384, ['situation'])
  poser(385, 386, ['planification', 'situation'])
  poser(387, 387, ['ponctuation', 'phrase'])
  poser(388, 388, ['planification', 'revision'])
  poser(389, 389, ['structure', 'vocabulaire'])
  poser(390, 394, ['reflexif'])
  poser(395, 396, ['reflexif', 'planification'])
  poser(397, 397, ['connecteurs', 'reprises'])
  poser(398, 400, ['structure'])
  poser(401, 402, ['connecteurs'])
  poser(403, 403, ['concordance'])
  poser(404, 404, ['reprises'])
  poser(405, 415, ['vocabulaire'])
  poser(416, 430, ['orthographe'])
  poser(417, 417, ['orthographe', 'vocabulaire'])
  poser(431, 432, ['accord_gn'])
  poser(433, 434, ['adverbes'])
  poser(435, 437, ['accord_gn'])
  poser(438, 438, ['participe', 'passe_compose'])
  poser(439, 441, ['accord_gn'])
  poser(442, 442, ['adverbes'])
  poser(443, 443, ['phrase'])
  poser(444, 444, ['orthographe'])
  poser(445, 445, ['concordance'])
  poser(446, 446, ['plus_que_parfait'])
  poser(447, 447, ['participe', 'passe_compose'])
  poser(448, 450, ['concordance'])
  poser(451, 451, ['passe_simple', 'imperatif'])
  poser(452, 452, ['concordance'])
  poser(453, 453, ['accord_sv'])
  poser(454, 454, TEMPS)
  poser(455, 455, ['concordance'])
  poser(456, 459, ['phrase'])
  poser(460, 461, ['presentation'])
  poser(462, 466, ['documentation', 'reflexif'])
  poser(467, 471, ['documentation'])
  poser(472, 473, ['revision'])
  return t
})()

export function tagNom(tag) {
  return TAGS[tag]?.nom || tag
}
