import CadreJeu, { melanger } from '../../components/labo/CadreJeu.jsx'
import Corps3D from '../../components/labo/Corps3D.jsx'
import DefiEclair from '../../components/labo/defi/DefiEclair.jsx'
import { famille, paquet, questionQCM, questionVF } from '../../components/labo/defi/tirage.js'
import { NOMS as NOMS_OS, NOMS_ARTICULATIONS, OS_REFERENTIEL } from '../../components/labo/anatomie.js'

// =============================================================
//  A11 · Défi — le grand test du système locomoteur (60 s).
//  Chaque question est liée à une activité (act) → bilan final
//  « réussi / à revoir » par activité. Records du jour et de tous
//  les temps (Firebase, laboDefi). Moteur : components/labo/defi/.
//  Questions COURTES (élèves petits lecteurs).
//  Attendus 112, 113, 116 (non affichés).
// =============================================================

// Banques de questions (courtes : élèves petits lecteurs).
// VRAIS et FAUX sont deux paquets séparés, tirés à 50/50 : autant de « faux » que de « vrai ».
// Chaque notion est posée de plusieurs façons (vrai/faux, à choix, reformulée).
// [activité, affirmation]
const VRAIS = [
  // Explosion (A2) · os
  ['puzzle', 'Un adulte a 206 os.'],
  ['puzzle', 'Le fémur est l’os de la cuisse.'],
  ['puzzle', 'Le fémur est l’os le plus long du corps.'],
  ['puzzle', 'Les vertèbres forment la colonne vertébrale.'],
  ['puzzle', 'La rotule se trouve devant le genou.'],
  ['puzzle', 'Les côtes forment la cage thoracique.'],
  ['puzzle', 'Le tibia est un os de la jambe.'],
  ['puzzle', 'L’humérus est l’os du bras.'],
  ['puzzle', 'Le crâne est fait de plusieurs os soudés ensemble.'],
  // Rayons X (A1)
  ['miroir', 'Les os des doigts s’appellent les phalanges.'],
  ['miroir', 'Une main compte 27 os.'],
  ['miroir', 'Le pouce a deux phalanges, les autres doigts en ont trois.'],
  // Tendons (A3)
  ['bras', 'Un tendon relie un muscle à un os.'],
  ['bras', 'Le muscle tire sur l’os pour le faire bouger.'],
  ['bras', 'Un muscle passe par une articulation pour faire bouger deux os.'],
  // Muscles (A4)
  ['qui-tire', 'Pour plier le bras, le biceps se contracte.'],
  ['qui-tire', 'Tendre la jambe, c’est une extension.'],
  ['qui-tire', 'Plier le coude, c’est une flexion.'],
  ['qui-tire', 'Quand le biceps se contracte, le triceps se relâche.'],
  ['qui-tire', 'Quand un muscle se contracte, il devient plus court.'],
  // Danse (A5)
  ['pantin', 'Le coude est une articulation.'],
  ['pantin', 'Le genou est une articulation.'],
  ['pantin', 'Une articulation relie deux os.'],
  ['pantin', 'L’épaule est une articulation.'],
  // Bouclier (A6)
  ['protection', 'Le crâne protège le cerveau.'],
  ['protection', 'Les côtes protègent le cœur et les poumons.'],
  ['protection', 'Le squelette sert au soutien, au mouvement et à la protection.'],
  ['protection', 'Sans squelette, le corps ne tiendrait pas debout.'],
  // Réflexes (A7)
  ['reflexes', 'Le cerveau envoie l’ordre de bouger aux muscles.'],
  ['reflexes', 'Les messages du cerveau voyagent dans les nerfs.'],
  ['reflexes', 'Les yeux envoient des messages au cerveau.'],
  // Scalpel (A8)
  ['dissection', 'Sous la peau, il y a les muscles, puis les os.'],
  ['dissection', 'Les os sont cachés sous les muscles.'],
  // Animaux (A9)
  ['cousins', 'L’aile d’un oiseau contient un humérus, comme ton bras.'],
  ['cousins', 'La nageoire de la baleine cache des os de bras et de main.'],
  ['cousins', 'La chauve-souris a des os de doigts dans ses ailes.'],
  // Urgence (A10)
  ['urgences', 'Une fracture, c’est un os cassé.'],
  ['urgences', 'Sur une radio, on voit les os.'],
  ['urgences', 'Un plâtre garde l’os immobile pendant qu’il se répare.'],
  ['urgences', 'Un os cassé peut se réparer.'],
  // Jacques a dit (A12) · Étiqueteuse (A13)
  ['jacques', 'Le genou est sur la jambe.'],
  ['etiqueteuse', 'Le poignet relie la main et le bras.'],
  ['etiqueteuse', 'La cheville relie le pied et la jambe.'],
]
const FAUX = [
  ['puzzle', 'Un adulte a plus de 500 os.'],
  ['puzzle', 'Le radius est un os de la jambe.'],
  ['puzzle', 'L’humérus est un os de la cuisse.'],
  ['puzzle', 'Le tibia est un os du bras.'],
  ['puzzle', 'La colonne vertébrale est faite d’un seul os.'],
  ['puzzle', 'Le fémur est un tout petit os.'],
  ['puzzle', 'La rotule se trouve au coude.'],
  ['puzzle', 'Les vertèbres sont des os du pied.'],
  ['puzzle', 'Toute la tête est faite d’un seul os.'],
  ['miroir', 'Une main compte seulement 5 os.'],
  ['miroir', 'Le pouce a trois phalanges.'],
  ['miroir', 'Les os des doigts s’appellent les vertèbres.'],
  ['bras', 'Un muscle peut pousser sur un os.'],
  ['bras', 'Un muscle attaché à un seul os fait bouger un membre.'],
  ['bras', 'Un tendon est un os très fin.'],
  ['bras', 'Un tendon relie la peau à un os.'],
  ['qui-tire', 'Plier le bras, c’est une extension.'],
  ['qui-tire', 'Pour plier le bras, le triceps se contracte.'],
  ['qui-tire', 'Tendre la jambe, c’est une flexion.'],
  ['qui-tire', 'Quand un muscle se contracte, il devient plus long.'],
  ['pantin', 'Le fémur est une articulation.'],
  ['pantin', 'Une articulation est un muscle.'],
  ['pantin', 'La cuisse est une articulation.'],
  ['pantin', 'Le genou est une articulation du bras.'],
  ['protection', 'Le crâne protège le cœur.'],
  ['protection', 'Les côtes protègent le cerveau.'],
  ['protection', 'Le squelette sert uniquement à bouger.'],
  ['protection', 'Les os sont mous comme des muscles.'],
  ['reflexes', 'Les muscles décident seuls quand bouger.'],
  ['reflexes', 'Le cœur envoie l’ordre de bouger.'],
  ['reflexes', 'Les messages vers les muscles voyagent dans les os.'],
  ['dissection', 'Sous la peau, il y a d’abord les os, puis les muscles.'],
  ['dissection', 'Les muscles sont cachés sous les os.'],
  ['cousins', 'La nageoire de la baleine n’a pas d’os.'],
  ['cousins', 'L’aile d’un oiseau n’a aucun os.'],
  ['cousins', 'Seuls les humains ont un fémur.'],
  ['urgences', 'Un os cassé ne se répare jamais.'],
  ['urgences', 'Une fracture est une coupure de la peau.'],
  ['urgences', 'Sur une radio, on ne voit pas les os.'],
  ['urgences', 'Un plâtre sert à faire bouger l’os plus vite.'],
  ['jacques', 'Le genou est dans le bras.'],
  ['etiqueteuse', 'Le coude relie le pied et la jambe.'],
  ['etiqueteuse', 'La cheville se trouve dans le bras.'],
]
// [activité, question, bonne réponse, choix]
const QCM = [
  ['puzzle', 'Un adulte a environ…', '200 os', ['200 os', '20 os', '2 000 os']],
  ['puzzle', 'Quel est l’os le plus long du corps ?', 'Le fémur', ['Le fémur', 'L’humérus', 'Le tibia']],
  ['puzzle', 'Quel os est devant le genou ?', 'La rotule', ['La rotule', 'Le tibia', 'Le fémur']],
  ['puzzle', 'Les os de la colonne sont les…', 'vertèbres', ['vertèbres', 'phalanges', 'côtes']],
  ['puzzle', 'Les côtes forment…', 'la cage thoracique', ['la cage thoracique', 'le crâne', 'le bassin']],
  ['miroir', 'Combien d’os dans une main ?', '27', ['27', '5', '100']],
  ['miroir', 'Comment s’appellent les os des doigts ?', 'Les phalanges', ['Les phalanges', 'Les vertèbres', 'Les côtes']],
  ['miroir', 'Quel appareil permet de voir tes os ?', 'Une radiographie', ['Une radiographie', 'Une loupe', 'Un thermomètre']],
  ['bras', 'Un tendon relie…', 'un muscle à un os', ['un muscle à un os', 'deux os', 'la peau à un muscle']],
  ['qui-tire', 'Quel muscle plie le bras ?', 'Le biceps', ['Le biceps', 'Le triceps', 'Le mollet']],
  ['qui-tire', 'Pour tendre le bras, quel muscle se contracte ?', 'Le triceps', ['Le triceps', 'Le biceps', 'Le mollet']],
  ['qui-tire', 'Que fait un muscle quand il se contracte ?', 'Il se raccourcit', ['Il se raccourcit', 'Il s’allonge', 'Il se casse']],
  ['pantin', 'Une articulation relie…', 'deux os', ['deux os', 'deux muscles', 'la peau et un os']],
  ['pantin', 'Quelle articulation est au milieu du bras ?', 'Le coude', ['Le coude', 'Le genou', 'La cheville']],
  ['pantin', 'Quelle articulation est au milieu de la jambe ?', 'Le genou', ['Le genou', 'Le coude', 'Le poignet']],
  ['protection', 'Quels os protègent le cœur ?', 'Les côtes', ['Les côtes', 'Le fémur', 'Les phalanges']],
  ['protection', 'Quel os protège le cerveau ?', 'Le crâne', ['Le crâne', 'Le sternum', 'Le tibia']],
  ['protection', 'Le squelette sert à…', 'soutenir et protéger', ['soutenir et protéger', 'digérer', 'faire battre le cœur']],
  ['reflexes', 'Qui envoie l’ordre de bouger ?', 'Le cerveau', ['Le cerveau', 'Le cœur', 'L’estomac']],
  ['reflexes', 'Qui transporte le message jusqu’aux muscles ?', 'Les nerfs', ['Les nerfs', 'Les os', 'Les tendons']],
  ['dissection', 'Qu’y a-t-il au centre du bras ?', 'L’os', ['L’os', 'Le muscle', 'La peau']],
  ['dissection', 'Qu’y a-t-il sous les muscles ?', 'Les os', ['Les os', 'La peau', 'Les cheveux']],
  ['cousins', 'L’aile d’un oiseau ressemble à ton…', 'bras', ['bras', 'pied', 'crâne']],
  ['urgences', 'Un os cassé, c’est une…', 'fracture', ['fracture', 'articulation', 'radiographie']],
  ['jacques', 'Le genou est sur…', 'la jambe', ['la jambe', 'le bras', 'la tête']],
  ['etiqueteuse', 'Le poignet est entre…', 'la main et le bras', ['la main et le bras', 'le pied et la jambe', 'la tête et le cou']],
]

const tirerVrai = paquet(VRAIS)
const tirerFaux = paquet(FAUX)
const tirerQcm = paquet(QCM)
const tirerOs = paquet(OS_REFERENTIEL)
const tirerArticulation = paquet(Object.keys(NOMS_ARTICULATIONS))

function question() {
  return famille([
    [20, () => { const os = tirerOs(); return { act: 'puzzle', type: 'os', cible: os, choix: melanger([os, ...melanger(OS_REFERENTIEL.filter((o) => o !== os)).slice(0, 3)]), bonne: os } }],
    [10, () => { const art = tirerArticulation(); const ids = Object.keys(NOMS_ARTICULATIONS); return { act: 'pantin', type: 'articulation', cible: art, choix: melanger([art, ...melanger(ids.filter((a) => a !== art)).slice(0, 3)]), bonne: art } }],
    [40, () => questionVF(tirerVrai, tirerFaux)],
    [30, () => questionQCM(tirerQcm)],
  ])
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
