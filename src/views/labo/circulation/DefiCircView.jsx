import { melanger } from '../../../components/labo/CadreJeu.jsx'
import DefiEclair from '../../../components/labo/defi/DefiEclair.jsx'
import { famille, paquet, questionQCM, questionVF } from '../../../components/labo/defi/tirage.js'
import { PageCirc } from './commun.jsx'

// =============================================================
//  C8 · Défi — le grand test du système circulatoire (60 s).
//  Vrai ou faux, artère ou veine, qui transporte quoi.
//  Chaque question est liée à une activité (act) → bilan final.
//  Records du jour / de tous les temps (Firebase, laboDefiCirc).
//  Moteur : components/labo/defi/DefiEclair.jsx.
//  Attendus 66, 67, 70 (non affichés).
// =============================================================

// Banques de questions. VRAIS et FAUX : deux paquets tirés à 50/50 ; chaque notion est
// posée de plusieurs façons (vrai/faux, à choix, vaisseau à classer, sens du sang).
// Pas de généralisation absolue sur la couleur, pas de vaisseaux des poumons dans « artère ou veine ».
// [activité, affirmation]
const VRAIS = [
  ['artere-veine', 'Les artères partent du cœur.'],
  ['artere-veine', 'Les veines reviennent au cœur.'],
  ['artere-veine', 'L’aorte est une artère.'],
  ['artere-veine', 'Les artères et les veines sont des vaisseaux sanguins.'],
  ['artere-veine', 'Les vaisseaux sanguins amènent le sang dans tout le corps.'],
  ['artere-veine', 'Les veines des jambes ont des valvules qui empêchent le sang de redescendre.'],
  ['coeur', 'Le cœur est un muscle.'],
  ['coeur', 'Le cœur a 4 cavités : 2 oreillettes et 2 ventricules.'],
  ['coeur', 'Les valvules empêchent le sang de revenir en arrière.'],
  ['coeur', 'Le cœur est séparé en une partie gauche et une partie droite.'],
  ['coeur', 'Le cœur se contracte sans s’arrêter, même quand on dort.'],
  ['livreur', 'Le sang transporte le dioxygène.'],
  ['livreur', 'Le sang transporte les nutriments.'],
  ['livreur', 'Les nutriments passent dans le sang dans l’intestin grêle.'],
  ['livreur', 'Le sang emporte le dioxyde de carbone vers les poumons.'],
  ['livreur', 'Grâce au sang, chaque cellule reçoit du dioxygène et des nutriments.'],
  ['voyage', 'Le sang se charge en dioxygène dans les poumons.'],
  ['voyage', 'Le ventricule gauche envoie le sang dans tout le corps.'],
  ['voyage', 'Le ventricule droit envoie le sang vers les poumons.'],
  ['voyage', 'Le sang repasse par le cœur avant de repartir dans le corps.'],
  ['voyage', 'Le sang qui revient du corps entre dans le cœur par l’oreillette droite.'],
  ['pompe', 'Pendant un effort, le cœur bat plus vite.'],
  ['pompe', 'Pendant un effort, les muscles ont besoin de plus de dioxygène.'],
  ['pompe', 'Au repos, le cœur bat plus lentement qu’à l’effort.'],
  ['pompe', 'Quand on court, on respire plus vite.'],
  ['pouls', 'On peut sentir son pouls au poignet.'],
  ['pouls', 'On peut sentir son pouls dans le cou.'],
  ['pouls', 'Le pouls correspond aux battements du cœur.'],
  ['pouls', 'Le rythme du cœur se mesure en battements par minute.'],
  ['animaux', 'Plus un animal est petit, plus son cœur bat vite, en général.'],
  ['animaux', 'Le cœur d’une souris bat plus vite que celui d’un éléphant.'],
  ['animaux', 'Le cœur d’un bébé bat plus vite que celui d’un adulte.'],
]
const FAUX = [
  ['artere-veine', 'Les veines partent du cœur.'],
  ['artere-veine', 'Les artères ramènent le sang vers le cœur.'],
  ['artere-veine', 'L’aorte est une veine.'],
  ['artere-veine', 'Le sang circule seulement dans les artères.'],
  ['artere-veine', 'Les vaisseaux sanguins sont remplis d’air.'],
  ['artere-veine', 'Les artères sont des muscles qui pompent le sang.'],
  ['coeur', 'Le sang de gauche et de droite se mélange dans le cœur.'],
  ['coeur', 'Le cœur a 2 cavités.'],
  ['coeur', 'Le cœur est un os très solide.'],
  ['coeur', 'Les valvules laissent le sang aller dans les deux sens.'],
  ['coeur', 'Le cœur s’arrête de battre quand on dort.'],
  ['coeur', 'Le cœur se trouve dans le ventre, sous l’estomac.'],
  ['livreur', 'Les nutriments entrent dans le sang par les poumons.'],
  ['livreur', 'Le sang transporte seulement le dioxygène.'],
  ['livreur', 'Le dioxyde de carbone est un nutriment.'],
  ['livreur', 'Le sang rejette le dioxyde de carbone dans l’intestin.'],
  ['voyage', 'Le sang se charge en dioxygène dans l’intestin.'],
  ['voyage', 'Le ventricule droit envoie le sang dans tout le corps.'],
  ['voyage', 'Le ventricule gauche envoie le sang vers les poumons.'],
  ['voyage', 'Le sang revient au cœur par l’aorte.'],
  ['voyage', 'Le sang ne passe jamais par les poumons.'],
  ['pompe', 'Pendant un effort, le cœur bat moins vite qu’au repos.'],
  ['pompe', 'Pendant un effort, les muscles ont besoin de moins de dioxygène.'],
  ['pompe', 'Quand on court, on respire plus lentement.'],
  ['pompe', 'Le cœur bat toujours à la même vitesse, quoi qu’on fasse.'],
  ['pouls', 'Le rythme du cœur se mesure en litres par minute.'],
  ['pouls', 'On ne peut jamais sentir son pouls.'],
  ['pouls', 'Le pouls se mesure avec un thermomètre.'],
  ['pouls', 'Le pouls montre combien on a de globules.'],
  ['animaux', 'Plus un animal est grand, plus son cœur bat vite, en général.'],
  ['animaux', 'Le cœur d’un éléphant bat plus vite que celui d’une souris.'],
  ['animaux', 'Le cœur d’un adulte bat plus vite que celui d’un bébé.'],
]
// [activité, question, bonne réponse, choix]
const QCM = [
  ['livreur', 'Où le sang prend-il le dioxygène ?', 'Poumons', ['Poumons', 'Cœur', 'Intestin grêle']],
  ['livreur', 'Où le sang prend-il les nutriments ?', 'Intestin grêle', ['Intestin grêle', 'Poumons', 'Cœur']],
  ['livreur', 'Où le sang rejette-t-il le dioxyde de carbone ?', 'Poumons', ['Poumons', 'Reins', 'Muscles']],
  ['livreur', 'Que prend-on dans l’air en inspirant ?', 'Du dioxygène', ['Du dioxygène', 'Des nutriments', 'Du sang']],
  ['livreur', 'Que rejette-t-on en expirant ?', 'Du dioxyde de carbone', ['Du dioxyde de carbone', 'Des nutriments', 'Du sang']],
  ['livreur', 'Qui transporte le dioxygène et les nutriments ?', 'Le sang', ['Le sang', 'L’air', 'Les os']],
  ['coeur', 'Quelle cavité envoie le sang dans l’aorte ?', 'Ventricule gauche', ['Ventricule gauche', 'Ventricule droit', 'Oreillette gauche']],
  ['coeur', 'Quelle cavité reçoit le sang des veines caves ?', 'Oreillette droite', ['Oreillette droite', 'Oreillette gauche', 'Ventricule gauche']],
  ['coeur', 'Combien de cavités a le cœur ?', '4', ['2', '4', '6']],
  ['coeur', 'Combien d’oreillettes a le cœur ?', '2', ['1', '2', '4']],
  ['coeur', 'Les « portes » qui empêchent le sang de reculer sont…', 'les valvules', ['les valvules', 'les artères', 'les tendons']],
  ['coeur', 'Le cœur est un…', 'muscle', ['muscle', 'os', 'nerf']],
  ['voyage', 'Quelle est la plus grosse artère ?', 'Aorte', ['Aorte', 'Carotide', 'Artère radiale']],
  ['voyage', 'Où le sang se recharge-t-il en dioxygène ?', 'Dans les poumons', ['Dans les poumons', 'Dans l’estomac', 'Dans le cerveau']],
  ['voyage', 'Que fait le sang dans les organes ?', 'Il dépose du dioxygène', ['Il dépose du dioxygène', 'Il fabrique de l’air', 'Il s’arrête de circuler']],
  ['pompe', 'Quand on court, le cœur bat…', 'plus vite', ['plus vite', 'plus lentement', 'plus du tout']],
  ['pompe', 'Quand on dort, le cœur bat…', 'plus lentement', ['plus lentement', 'plus vite', 'plus du tout']],
  ['pouls', 'Avec quoi mesure-t-on son pouls en classe ?', 'Chronomètre', ['Chronomètre', 'Thermomètre', 'Balance']],
  ['pouls', 'Le rythme du cœur se mesure en…', 'battements par minute', ['battements par minute', 'litres par heure', 'kilos par jour']],
  ['pouls', 'Où peut-on sentir son pouls ?', 'Au poignet', ['Au poignet', 'Sur un ongle', 'Dans les cheveux']],
  ['animaux', 'Quel cœur bat le plus lentement ?', 'La baleine bleue', ['La baleine bleue', 'La souris', 'Le chat']],
  ['animaux', 'Quel cœur bat le plus vite ?', 'La souris', ['La souris', 'Le cheval', 'L’éléphant']],
]
// [nom, type]
const VAISSEAUX = [
  ['Aorte', 'artere'],
  ['Artère carotide', 'artere'],
  ['Artère fémorale', 'artere'],
  ['Artère radiale', 'artere'],
  ['Artère rénale', 'artere'],
  ['Artère humérale', 'artere'],
  ['Veine jugulaire', 'veine'],
  ['Veine cave supérieure', 'veine'],
  ['Veine cave inférieure', 'veine'],
  ['Veine saphène', 'veine'],
  ['Veine fémorale', 'veine'],
  ['Veine rénale', 'veine'],
]
const tirerVrai = paquet(VRAIS)
const tirerFaux = paquet(FAUX)
const tirerQcm = paquet(QCM)
const tirerVaisseau = paquet(VAISSEAUX)

// « Aorte » → « l’aorte », « Veine cave » → « la veine cave »
const avecArticle = (nom) => {
  const minuscule = nom.charAt(0).toLowerCase() + nom.slice(1)
  return /^(Aorte|Artère)/.test(nom) ? `l’${minuscule}` : `la ${minuscule}`
}

// Un vaisseau : trois façons de poser la question
function questionVaisseau() {
  const [nom, type] = tirerVaisseau()
  const t = Math.random()
  if (t < 0.4) return { act: 'artere-veine', type: 'vaisseau', texte: `${nom} : artère ou veine ?`, choix: ['artere', 'veine'], bonne: type }
  if (t < 0.7) return { act: 'artere-veine', type: 'sens', texte: `Dans ${avecArticle(nom)}, le sang…`, choix: ['part', 'revient'], bonne: type === 'artere' ? 'part' : 'revient' }
  // « Quel vaisseau ramène / emporte le sang ? » : 1 bon + 2 de l'autre type
  const ramene = type === 'veine'
  const autres = melanger(VAISSEAUX.filter(([, ty]) => ty !== type)).slice(0, 2).map(([n]) => n)
  return { act: 'artere-veine', type: 'qcm', texte: ramene ? 'Quel vaisseau ramène le sang au cœur ?' : 'Quel vaisseau emporte le sang loin du cœur ?', choix: melanger([nom, ...autres]), bonne: nom }
}

function question() {
  return famille([
    [38, () => questionVF(tirerVrai, tirerFaux)],
    [22, questionVaisseau],
    [40, () => questionQCM(tirerQcm)],
  ])
}

const nomChoix = (q, c) => ({ vrai: 'Vrai', faux: 'Faux', artere: 'Artère', veine: 'Veine', part: 'Part du cœur', revient: 'Revient au cœur' })[c] || c

export default function DefiCircView() {
  return (
    <DefiEclair
      Page={PageCirc}
      cadre={{ code: 'C8', titre: 'Défi', attendus: [66, 67, 70] }}
      experience="circulation"
      nomCollection="laboDefiCirc"
      question={question}
      nomChoix={nomChoix}
      annonce="Cœur, artères, veines, sang : montre tout ce que tu as appris !"
      delaiErreur={900}
    />
  )
}
