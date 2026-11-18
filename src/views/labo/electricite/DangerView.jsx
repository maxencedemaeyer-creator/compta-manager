import { useState } from 'react'
import { ArrowRight, Bath, Baby, Battery, Cable, CloudLightning, Droplets, Hand, Lightbulb, Plug, PlugZap, RotateCcw, ShieldCheck, TrainFront, TriangleAlert, Unplug, UtilityPole, Wind, Zap } from 'lucide-react'
import { Bouton, Carte, Eclat, melanger } from '../../../components/labo/CadreJeu.jsx'
import { PageElec } from './commun.jsx'

// =============================================================
//  E7 · Danger, électricité ! (bonus sécurité)
//  1) L'échelle des tensions : de la pile à la foudre.
//  2) Danger ou bon réflexe ? 14 situations expliquées.
// =============================================================
const ROUGE = '#FF6B7A'

const ECHELLE = [
  { v: 1.5, nom: 'Pile bâton (AA)', icone: Battery, sur: true },
  { v: 4.5, nom: 'Pile plate du labo', icone: Battery, sur: true },
  { v: 9, nom: 'Pile carrée', icone: Battery, sur: true },
  { v: 12, nom: 'Batterie de voiture', icone: Battery, sur: true },
  { v: 230, nom: 'Prise de la maison', icone: Plug, sur: false },
  { v: 25000, nom: 'Ligne du TGV (caténaire)', icone: TrainFront, sur: false },
  { v: 380000, nom: 'Ligne à très haute tension', icone: UtilityPole, sur: false },
  { v: 1e8, nom: 'Foudre', icone: CloudLightning, sur: false },
]
const fmt = (v) => (v >= 1e6 ? `plus de ${(v / 1e6).toLocaleString('fr-BE')} millions de V` : `${v.toLocaleString('fr-BE')} V`)

const SITUATIONS = [
  { texte: 'Allumer une ampoule avec une pile plate de 4,5 V et deux fils.', danger: false, icone: Battery, explication: 'Une pile de 4,5 V est une très basse tension : elle ne peut pas faire passer un courant dangereux à travers ton corps. C’est pour ça qu’on l’utilise en classe.' },
  { texte: 'Glisser une épingle ou un trombone dans une prise de courant.', danger: true, icone: PlugZap, explication: 'La prise délivre 230 V : le courant peut traverser ton corps, provoquer de graves brûlures et arrêter le cœur. On ne met jamais rien dans une prise.' },
  { texte: 'Se sécher les cheveux avec un sèche-cheveux branché, assis dans le bain.', danger: true, icone: Bath, explication: 'L’eau du robinet et du bain contient des sels : elle conduit le courant. Un appareil branché qui tombe dans l’eau peut électrocuter.' },
  { texte: 'Brancher plusieurs multiprises les unes dans les autres pour tout brancher.', danger: true, icone: Plug, explication: 'Trop d’appareils sur une même prise : les fils chauffent et peuvent provoquer un incendie.' },
  { texte: 'Débrancher un appareil en tirant sur son fil.', danger: true, icone: Cable, explication: 'On abîme le fil : les fils de cuivre peuvent se dénuder et se toucher. On tire toujours sur la fiche.' },
  { texte: 'Toucher un fil dont le plastique est abîmé sur une lampe branchée.', danger: true, icone: Hand, explication: 'Le plastique est un isolant qui nous protège. Là où il est abîmé, on peut toucher le métal sous tension : électrocution.' },
  { texte: 'Faire voler un cerf-volant près des lignes électriques.', danger: true, icone: Wind, explication: 'Les lignes à haute tension portent des centaines de milliers de volts : le courant peut sauter jusqu’à la ficelle ou au corps, même sans contact direct.' },
  { texte: 'Relier directement les deux bornes d’une pile avec un fil.', danger: true, icone: Zap, explication: 'C’est un court-circuit : le courant devient très fort, le fil et la pile chauffent et peuvent brûler les doigts ou abîmer la pile.' },
  { texte: 'Changer l’ampoule du plafond sans couper le courant.', danger: true, icone: Lightbulb, explication: 'La douille est reliée au 230 V. On coupe d’abord l’interrupteur, et même le disjoncteur pour être sûr.' },
  { texte: 'Mettre des cache-prises dans une maison où vivent de jeunes enfants.', danger: false, icone: Baby, explication: 'Bon réflexe : les cache-prises empêchent les petits doigts et les objets d’entrer dans la prise.' },
  { texte: 'Escalader un pylône ou entrer dans un poste électrique pour récupérer un ballon.', danger: true, icone: UtilityPole, explication: 'Danger de mort : la très haute tension peut électrocuter à distance. On appelle un adulte, jamais on n’y va.' },
  { texte: 'Débrancher le grille-pain avant de le nettoyer.', danger: false, icone: Unplug, explication: 'Bon réflexe : débranché, l’appareil n’est plus relié au 230 V, on peut le nettoyer sans risque.' },
  { texte: 'Brancher un appareil avec les mains mouillées.', danger: true, icone: Droplets, explication: 'L’eau sur la peau laisse passer le courant beaucoup plus facilement : on se sèche toujours les mains avant.' },
  { texte: 'Faire tourner un petit moteur avec une pile de 4,5 V.', danger: false, icone: ShieldCheck, explication: 'Très basse tension : aucun danger d’électrocution. Il faut juste éviter le court-circuit.' },
]

export default function DangerView() {
  const [liste, setListe] = useState(() => melanger(SITUATIONS))
  const [n, setN] = useState(0)
  const [rep, setRep] = useState(null)
  const [score, setScore] = useState(0)
  const [eclat, setEclat] = useState({ message: '', cle: 0 })
  const s = liste[n]

  function repondre(danger) {
    if (rep !== null) return
    setRep(danger)
    if (danger === s.danger) {
      setScore((x) => x + 1)
      setEclat((e) => ({ message: s.danger ? 'Danger repéré !' : 'Bien vu !', cle: e.cle + 1 }))
    }
  }

  return (
    <PageElec code="E7" titre="Danger, électricité !" couleur={ROUGE} large>
      <Eclat message={eclat.message} cle={eclat.cle} couleur={ROUGE} />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 tab:min-h-0 tab:flex-1">
        <Carte couleur={`${ROUGE}55`} className="tab:min-h-0 tab:overflow-y-auto">
          <p className="labo-mono text-[11px] tracking-[.1em]" style={{ color: ROUGE }}>
            L’ÉCHELLE DES TENSIONS
          </p>
          <p className="mt-1 text-[13px] leading-snug text-[#B9C1E3]">La tension se mesure en volts (V). Chaque marche de l’échelle est beaucoup plus haute que la précédente.</p>
          <ol className="mt-3 flex flex-col-reverse gap-1.5">
            {ECHELLE.map((e) => {
              const largeur = 18 + (Math.log10(e.v) / 8) * 82
              return (
                <li key={e.nom} className="flex items-center gap-2">
                  <e.icone size={18} className="flex-none" style={{ color: e.sur ? '#9DFF8A' : ROUGE }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[13px] font-bold text-[#E8ECFF]">{e.nom}</span>
                      <span className="labo-mono flex-none text-[11px]" style={{ color: e.sur ? '#9DFF8A' : ROUGE }}>
                        {fmt(e.v)}
                      </span>
                    </div>
                    <div className="mt-0.5 h-2 rounded-full bg-white/5">
                      <div className="h-full rounded-full" style={{ width: `${largeur}%`, background: e.sur ? '#9DFF8A' : `linear-gradient(90deg, #FFB86B, ${ROUGE})` }} />
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
          <div className="mt-3 rounded-2xl border border-[#9DFF8A]/30 bg-[#9DFF8A]/5 p-2.5 text-[13px] leading-snug text-[#DDE2F7]">
            <b className="text-[#9DFF8A]">Très basse tension (piles) :</b> sans danger d’électrocution, c’est pour ça qu’on expérimente avec des piles.
          </div>
          <div className="mt-2 rounded-2xl border border-[#FF6B7A]/40 bg-[#FF6B7A]/10 p-2.5 text-[13px] leading-snug text-[#DDE2F7]">
            <b style={{ color: ROUGE }}>230 V et plus :</b> le courant peut traverser le corps, brûler et arrêter le cœur. On n’expérimente <b>jamais</b> avec la prise du mur.
          </div>
        </Carte>

        <div className="flex flex-col gap-3">
          {s ? (
            <>
              <div className="flex items-center justify-between text-[12px]">
                <span className="labo-mono text-[#8A93B8]">
                  SITUATION {n + 1}/{liste.length}
                </span>
                <span className="labo-mono" style={{ color: ROUGE }}>
                  {score} pt
                </span>
              </div>
              <Carte couleur={rep === null ? `${ROUGE}55` : s.danger ? ROUGE : '#9DFF8A'} className="text-center">
                <s.icone size={52} className="mx-auto" style={{ color: rep === null ? '#E8ECFF' : s.danger ? ROUGE : '#9DFF8A' }} strokeWidth={1.5} />
                <p className="labo-titre mt-3 text-lg font-bold leading-snug text-white">{s.texte}</p>
                {rep !== null && (
                  <div className="labo-apparait mt-3 text-left">
                    <p className="text-[14px] font-bold" style={{ color: rep === s.danger ? '#9DFF8A' : '#FFB86B' }}>
                      {rep === s.danger ? 'Exact !' : 'Attention…'} {s.danger ? 'C’est dangereux.' : 'C’est sans danger, et même un bon réflexe.'}
                    </p>
                    <p className="mt-1 text-[14px] leading-snug text-[#DDE2F7]">{s.explication}</p>
                  </div>
                )}
              </Carte>
              {rep === null ? (
                <div className="grid grid-cols-2 gap-2">
                  <Bouton couleur={ROUGE} onClick={() => repondre(true)}>
                    <TriangleAlert size={18} /> Danger !
                  </Bouton>
                  <Bouton couleur="#9DFF8A" onClick={() => repondre(false)}>
                    <ShieldCheck size={18} /> Sans danger
                  </Bouton>
                </div>
              ) : (
                <Bouton
                  couleur={ROUGE}
                  onClick={() => {
                    setRep(null)
                    setN(n + 1)
                  }}
                >
                  Situation suivante <ArrowRight size={18} />
                </Bouton>
              )}
            </>
          ) : (
            <Carte couleur={`${ROUGE}88`} className="text-center">
              <p className="labo-titre text-4xl font-black text-white">
                {score}/{liste.length}
              </p>
              <p className="mt-2 text-[14px] leading-snug text-[#DDE2F7]">
                Les règles d’or : on ne touche jamais à la prise ni aux appareils branchés avec les mains mouillées, on ne s’approche jamais des lignes ni des postes électriques, et on n’expérimente qu’avec des piles.
              </p>
              <Bouton
                className="mx-auto mt-4"
                couleur={ROUGE}
                onClick={() => {
                  setListe(melanger(SITUATIONS))
                  setN(0)
                  setScore(0)
                }}
              >
                <RotateCcw size={18} /> Rejouer
              </Bouton>
            </Carte>
          )}
        </div>
      </div>
    </PageElec>
  )
}
