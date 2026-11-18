import CadreJeu, { melanger } from '../../components/labo/CadreJeu.jsx'
import Corps3D from '../../components/labo/Corps3D.jsx'
import DefiEclair from '../../components/labo/defi/DefiEclair.jsx'
import { NOMS as NOMS_OS, NOMS_ARTICULATIONS, OS_REFERENTIEL } from '../../components/labo/anatomie.js'

// =============================================================
//  A11 · Défi — le grand test du système locomoteur (60 s).
//  Chaque question est liée à une activité (act) → bilan final
//  « réussi / à revoir » par activité. Records du jour et de tous
//  les temps (Firebase, laboDefi). Moteur : components/labo/defi/.
//  Questions COURTES (élèves petits lecteurs).
//  Attendus 112, 113, 116 (non affichés).
// =============================================================

// [activité, question, bonne réponse, choix] ; choix absent = vrai/faux
const BANQUE = [
  // Explosion (A2)
  ['puzzle', 'Combien d’os a un adulte ?', '206', ['206', '50', '1 000']],
  ['puzzle', 'Le fémur est l’os de la cuisse.', true],
  ['puzzle', 'Le radius est un os de la jambe.', false],
  ['puzzle', 'Les vertèbres forment la colonne vertébrale.', true],
  ['puzzle', 'La rotule est devant le genou.', true],
  // Rayons X (A1)
  ['miroir', 'Combien d’os dans une main ?', '27', ['27', '5', '100']],
  ['miroir', 'Les os des doigts s’appellent les phalanges.', true],
  // Tendons (A3)
  ['bras', 'Le muscle est attaché à l’os par un tendon.', true],
  ['bras', 'Un muscle peut pousser sur un os.', false],
  ['bras', 'Un muscle attaché à un seul os fait bouger un membre.', false],
  // Muscles (A4)
  ['qui-tire', 'Pour plier le bras, le biceps se contracte.', true],
  ['qui-tire', 'Pour tendre le bras, quel muscle se contracte ?', 'Triceps', ['Triceps', 'Biceps', 'Mollet']],
  ['qui-tire', 'Plier le bras, c’est une extension.', false],
  ['qui-tire', 'Tendre la jambe, c’est une extension.', true],
  // Danse (A5)
  ['pantin', 'Le coude est une articulation.', true],
  ['pantin', 'Le fémur est une articulation.', false],
  // Bouclier (A6)
  ['protection', 'Le crâne protège le cerveau.', true],
  ['protection', 'Quels os protègent le cœur ?', 'Les côtes', ['Les côtes', 'Le fémur', 'Les phalanges']],
  ['protection', 'Le squelette sert au soutien, au mouvement et à la protection.', true],
  // Réflexes (A7)
  ['reflexes', 'Qui envoie l’ordre de bouger ?', 'Le cerveau', ['Le cerveau', 'Le cœur', 'L’estomac']],
  ['reflexes', 'Le message du cerveau va aux muscles par les nerfs.', true],
  // Scalpel (A8)
  ['dissection', 'Sous la peau : les muscles, puis les os.', true],
  ['dissection', 'Qu’y a-t-il au centre du bras ?', 'L’os', ['L’os', 'Le muscle', 'La peau']],
  // Animaux (A9)
  ['cousins', 'L’aile de l’oiseau a les mêmes os que ton bras.', true],
  ['cousins', 'La nageoire de la baleine n’a pas d’os.', false],
  // Urgence (A10)
  ['urgences', 'Une fracture, c’est un os cassé.', true],
  ['urgences', 'Sur une radio, on voit les os.', true],
  // Jacques a dit (A12) · Étiqueteuse (A13)
  ['jacques', 'Le genou est sur…', 'la jambe', ['la jambe', 'le bras', 'la tête']],
  ['etiqueteuse', 'Le poignet est entre…', 'la main et le bras', ['la main et le bras', 'le pied et la jambe', 'la tête et le cou']],
]

function question() {
  const tirage = Math.random()
  if (tirage < 0.3) {
    const os = OS_REFERENTIEL[Math.floor(Math.random() * OS_REFERENTIEL.length)]
    return { act: 'puzzle', type: 'os', cible: os, choix: melanger([os, ...melanger(OS_REFERENTIEL.filter((o) => o !== os)).slice(0, 3)]), bonne: os }
  }
  if (tirage < 0.45) {
    const ids = Object.keys(NOMS_ARTICULATIONS)
    const art = ids[Math.floor(Math.random() * ids.length)]
    return { act: 'pantin', type: 'articulation', cible: art, choix: melanger([art, ...melanger(ids.filter((a) => a !== art)).slice(0, 3)]), bonne: art }
  }
  const [act, texte, bonne, choix] = BANQUE[Math.floor(Math.random() * BANQUE.length)]
  if (choix) return { act, type: 'qcm', texte, choix: melanger(choix), bonne }
  return { act, type: 'vf', texte, choix: ['vrai', 'faux'], bonne: bonne ? 'vrai' : 'faux' }
}

const nomChoix = (q, c) => (q.type === 'os' ? NOMS_OS[c] : q.type === 'articulation' ? NOMS_ARTICULATIONS[c] : { vrai: 'Vrai', faux: 'Faux' }[c] || c)

function rendu(q) {
  return (
    <>
      {(q.type === 'vf' || q.type === 'qcm') && <p className="labo-titre flex min-h-[200px] items-center justify-center text-center text-xl font-bold text-white">{q.texte}</p>}
      <div style={{ display: q.type === 'os' || q.type === 'articulation' ? 'block' : 'none' }}>
        <p className="text-center text-sm text-[#B9C1E3]">{q.type === 'os' ? 'Quel est cet os ?' : 'Quelle est cette articulation ?'}</p>
        <Corps3D
          className="mx-auto h-[36vh] w-full"
          credit={false}
          marge={1.04}
          etats={q.type === 'os' ? { [q.cible]: 'actif', ...(q.cible === 'cotes' ? { cartilages: 'actif' } : {}) } : {}}
          marqueurs={q.type === 'articulation' ? ['d', 'g'].map((c) => ({ id: c, pivot: `${q.cible}_${c}`, couleur: '#FFE45E', taille: 0.026 })) : []}
        />
      </div>
    </>
  )
}

export default function DefiView() {
  return (
    <DefiEclair
      Page={CadreJeu}
      cadre={{ code: 'A11', titre: 'Défi', attendus: [112, 113, 116], couleur: '#FFE45E' }}
      experience="locomoteur"
      nomCollection="laboDefi"
      question={question}
      rendu={rendu}
      nomChoix={nomChoix}
      annonce="Os, muscles, articulations : montre tout ce que tu as appris !"
      delaiErreur={700}
    />
  )
}
