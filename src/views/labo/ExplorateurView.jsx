import { useState } from 'react'
import { Bone, Dumbbell } from 'lucide-react'
import CadreJeu, { Carte } from '../../components/labo/CadreJeu.jsx'
import Corps3D from '../../components/labo/Corps3D.jsx'
import { MUSCLES, NOMS, OS } from '../../components/labo/anatomie.js'

// =============================================================
//  A9 · L'explorateur 3D
//  Le vrai corps humain en 3D (BodyParts3D) : on le fait tourner,
//  on zoome, on touche un os ou un muscle pour savoir ce que c'est.
//  Attendus 112, 116.
// =============================================================
const FICHES = {
  crane: 'Une boîte faite de plusieurs os soudés entre eux. Elle protège le cerveau.',
  vertebres: '33 vertèbres empilées forment la colonne. Elles tiennent le corps droit et protègent la moelle épinière.',
  disques: 'Entre deux vertèbres, un disque de cartilage amortit les chocs, comme un coussin.',
  cotes: '12 paires de côtes forment la cage thoracique autour du cœur et des poumons.',
  cartilages: 'Du cartilage relie les côtes au sternum : la cage peut ainsi bouger quand tu respires.',
  sternum: 'L’os plat au milieu de la poitrine. Les côtes s’y attachent.',
  clavicule: 'Elle relie le sternum à l’épaule. C’est un des os qui se cassent le plus souvent.',
  omoplate: 'Un os plat et triangulaire, dans le dos. Beaucoup de muscles de l’épaule s’y accrochent.',
  humerus: 'Le seul os du bras, entre l’épaule et le coude.',
  radius: 'Os de l’avant-bras, du côté du pouce. Il tourne autour du cubitus quand tu tournes la main.',
  cubitus: 'Os de l’avant-bras, du côté du petit doigt. Sa pointe forme le coude.',
  main: '27 os : 8 au poignet, 5 dans la paume, 14 dans les doigts.',
  bassin: 'Il porte le haut du corps et accueille la tête des fémurs, à la hanche.',
  femur: 'L’os le plus long et le plus solide du corps humain.',
  rotule: 'Un petit os rond dans le tendon du quadriceps, devant le genou.',
  tibia: 'Le gros os de la jambe : il porte le poids du corps.',
  perone: 'L’os fin de la jambe, à l’extérieur. Il forme la bosse externe de la cheville.',
  pied: '26 os : le talon, la voûte et les orteils.',
  biceps: 'Devant le bras. Il plie le coude.',
  triceps: 'Derrière le bras. Il tend le coude.',
  brachial: 'Sous le biceps, il aide à plier le coude.',
  deltoide: 'Il arrondit l’épaule et lève le bras.',
  muscles_avant_bras: 'Ils bougent le poignet et les doigts grâce à de longs tendons.',
  quadriceps: 'Quatre muscles devant la cuisse. Ils tendent le genou.',
  ischio_jambiers: 'Derrière la cuisse. Ils plient le genou.',
  mollet: 'Il tire sur le talon : tu te mets sur la pointe des pieds.',
  tendon_achille: 'Le tendon le plus solide du corps : il relie le mollet au talon.',
  jambier_anterieur: 'Devant le tibia, il relève la pointe du pied.',
}

export default function ExplorateurView() {
  const [muscles, setMuscles] = useState(false)
  const [choisi, setChoisi] = useState(null)
  const etats = choisi ? { [choisi]: 'actif' } : {}

  return (
    <CadreJeu code="A9" titre="L’explorateur 3D" attendus={[112, 116]} couleur="#9DE7C2">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => { setMuscles(false); setChoisi(null) }}
          className={`flex h-11 items-center justify-center gap-2 rounded-2xl text-sm font-bold ${!muscles ? 'bg-[#9DE7C2] text-[#05261A]' : 'border border-white/15 bg-[#121A30]/85'}`}
        >
          <Bone size={16} /> Squelette
        </button>
        <button
          type="button"
          onClick={() => { setMuscles(true); setChoisi(null) }}
          className={`flex h-11 items-center justify-center gap-2 rounded-2xl text-sm font-bold ${muscles ? 'bg-[#9DE7C2] text-[#05261A]' : 'border border-white/15 bg-[#121A30]/85'}`}
        >
          <Dumbbell size={16} /> Os + muscles
        </button>
      </div>
      <Carte couleur="rgba(157,231,194,.45)">
        {choisi ? (
          <>
            <p className="labo-titre text-xl font-bold text-white">{NOMS[choisi]}</p>
            <p className="mt-1 text-[15px] text-[#DDE2F7]">{FICHES[choisi]}</p>
          </>
        ) : (
          <p className="text-[15px] text-[#E8ECFF]">Fais tourner le corps avec un doigt, zoome avec deux doigts, et touche un os ou un muscle pour savoir ce que c’est.</p>
        )}
      </Carte>
      <div className="rounded-3xl border border-white/10 bg-[#070B16]/75">
        <Corps3D className="h-[60vh] max-h-[680px] w-full" rotation afficher={muscles ? [...OS, ...MUSCLES] : OS} etats={etats} onChoisir={(g) => setChoisi(g)} />
      </div>
    </CadreJeu>
  )
}
