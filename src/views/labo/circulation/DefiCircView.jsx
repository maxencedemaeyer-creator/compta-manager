import { melanger } from '../../../components/labo/CadreJeu.jsx'
import DefiEclair from '../../../components/labo/defi/DefiEclair.jsx'
import { PageCirc } from './commun.jsx'

// =============================================================
//  C8 · Défi — le grand test du système circulatoire (60 s).
//  Vrai ou faux, artère ou veine, qui transporte quoi.
//  Chaque question est liée à une activité (act) → bilan final.
//  Records du jour / de tous les temps (Firebase, laboDefiCirc).
//  Moteur : components/labo/defi/DefiEclair.jsx.
//  Attendus 66, 67, 70 (non affichés).
// =============================================================

// [activité, affirmation, vrai ?]
const AFFIRMATIONS = [
  ['artere-veine', 'Les artères partent du cœur.', true],
  ['artere-veine', 'Les veines reviennent au cœur.', true],
  ['artere-veine', 'Les veines partent du cœur.', false],
  ['artere-veine', 'L’aorte est une veine.', false],
  ['coeur', 'Le cœur est un muscle.', true],
  ['coeur', 'Le cœur a 4 cavités : 2 oreillettes et 2 ventricules.', true],
  ['coeur', 'Le sang de gauche et de droite se mélange dans le cœur.', false],
  ['coeur', 'Les valvules empêchent le sang de revenir en arrière.', true],
  ['livreur', 'Le sang transporte le dioxygène.', true],
  ['livreur', 'Le sang transporte les nutriments.', true],
  ['livreur', 'Les nutriments passent dans le sang dans l’estomac.', false],
  ['livreur', 'Les nutriments passent dans le sang dans l’intestin grêle.', true],
  ['voyage', 'Le sang se charge en dioxygène dans les poumons.', true],
  ['voyage', 'Le ventricule gauche envoie le sang dans tout le corps.', true],
  ['voyage', 'Le ventricule droit envoie le sang vers les poumons.', true],
  ['voyage', 'Pendant un tour du corps, le sang passe une seule fois par le cœur.', false],
  ['pompe', 'Après un effort, le cœur bat moins vite.', false],
  ['pompe', 'Pendant un effort, les muscles ont besoin de plus de dioxygène.', true],
  ['pouls', 'On peut sentir son pouls au poignet.', true],
  ['pouls', 'Le rythme du cœur se mesure en litres par minute.', false],
  ['animaux', 'Plus un animal est petit, plus son cœur bat vite, en général.', true],
]
const VAISSEAUX = [
  ['Aorte', 'artere'],
  ['Artère carotide', 'artere'],
  ['Veine jugulaire', 'veine'],
  ['Veine cave', 'veine'],
  ['Artère fémorale', 'artere'],
  ['Veine saphène', 'veine'],
  ['Artère radiale', 'artere'],
  ['Veine fémorale', 'veine'],
]
// [activité, question, bonne réponse, choix]
const ORGANES = [
  ['livreur', 'Où le sang prend-il le dioxygène ?', 'Poumons', ['Poumons', 'Cœur', 'Intestin grêle']],
  ['livreur', 'Où le sang prend-il les nutriments ?', 'Intestin grêle', ['Intestin grêle', 'Poumons', 'Cœur']],
  ['livreur', 'Où le sang rejette-t-il le dioxyde de carbone ?', 'Poumons', ['Poumons', 'Reins', 'Muscles']],
  ['coeur', 'Quelle cavité envoie le sang dans l’aorte ?', 'Ventricule gauche', ['Ventricule gauche', 'Ventricule droit', 'Oreillette gauche']],
  ['coeur', 'Quelle cavité reçoit le sang des veines caves ?', 'Oreillette droite', ['Oreillette droite', 'Oreillette gauche', 'Ventricule gauche']],
  ['voyage', 'Quelle est la plus grosse artère ?', 'Aorte', ['Aorte', 'Carotide', 'Artère radiale']],
  ['pouls', 'Avec quoi mesure-t-on son pouls en classe ?', 'Chronomètre', ['Chronomètre', 'Thermomètre', 'Balance']],
]
const hasard = (l) => l[Math.floor(Math.random() * l.length)]

function question() {
  const t = Math.random()
  if (t < 0.5) {
    const [act, texte, vrai] = hasard(AFFIRMATIONS)
    return { act, type: 'vf', texte, choix: ['vrai', 'faux'], bonne: vrai ? 'vrai' : 'faux' }
  }
  if (t < 0.75) {
    const [nom, type] = hasard(VAISSEAUX)
    return { act: 'artere-veine', type: 'vaisseau', texte: `${nom} : artère ou veine ?`, choix: ['artere', 'veine'], bonne: type }
  }
  const [act, texte, bonne, choix] = hasard(ORGANES)
  return { act, type: 'qcm', texte, choix: melanger(choix), bonne }
}

const nomChoix = (q, c) => ({ vrai: 'Vrai', faux: 'Faux', artere: 'Artère', veine: 'Veine' })[c] || c

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
