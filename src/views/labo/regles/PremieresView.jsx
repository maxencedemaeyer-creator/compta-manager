import { useState } from 'react'
import { ArrowRight, Check, RotateCcw } from 'lucide-react'
import Visage from '../../../components/labo/regles/Visage.jsx'
import { BoutonR, C, CarteR, PageRegles, Retour } from '../../../components/labo/regles/ui.jsx'

// =============================================================
//  R7 · Premières — les premières règles et les réactions.
//  Cinq petites scènes avec des personnages fictifs :
//   1. une surprise à l'école (que faire ?)
//   2. le kit de secours (quoi mettre dans son sac ?)
//   3. « ça n'arrive pas encore » (chacun son rythme)
//   4. les réactions (toutes sont normales)
//   5. à qui en parler.
//  Aucune donnée personnelle : on ne demande rien sur l'élève.
// =============================================================

const SCENES = ['surprise', 'kit', 'rythme', 'reactions', 'parler']

export default function PremieresView() {
  const [rang, setRang] = useState(0)
  const scene = SCENES[rang]
  const suivante = () => setRang((r) => r + 1)
  return (
    <PageRegles>
      <div className="flex items-center gap-1.5" aria-label={`Scène ${Math.min(rang + 1, SCENES.length)} sur ${SCENES.length}`}>
        {SCENES.map((s, i) => (
          <span key={s} className="h-2.5 flex-1 rounded-full" style={{ background: i <= rang ? C.rose : C.bord }} />
        ))}
      </div>
      {scene === 'surprise' && <Surprise key={scene} suite={suivante} />}
      {scene === 'kit' && <Kit key={scene} suite={suivante} />}
      {scene === 'rythme' && <Rythme key={scene} suite={suivante} />}
      {scene === 'reactions' && <Reactions key={scene} suite={suivante} />}
      {scene === 'parler' && <Parler key={scene} recommencer={() => setRang(0)} />}
    </PageRegles>
  )
}

function Scene({ perso, humeur, titre, histoire, children }) {
  return (
    <CarteR className="regles-apparait">
      <div className="flex items-center gap-3">
        <Visage id={perso} humeur={humeur} className="h-20 w-20 flex-none rounded-full" titre="" />
        <h2 className="regles-titre text-[22px] leading-tight" style={{ color: C.texte }}>{titre}</h2>
      </div>
      <p className="mt-3 text-[15.5px] leading-relaxed" style={{ color: C.texte }}>{histoire}</p>
      {children}
    </CarteR>
  )
}

// ---------------- 1. Une surprise à l'école ----------------
const CHOIX_SURPRISE = [
  { id: 'cacher', texte: 'Faire comme si de rien n’était et se cacher toute la journée.', bien: false, retour: 'On peut avoir envie de se cacher, c’est normal. Mais Lou n’a pas à rester seul·e avec ça : demander de l’aide rendra la journée beaucoup plus simple.' },
  { id: 'adulte', texte: 'Prévenir un adulte de confiance : le ou la titulaire, l’infirmier·ère, un·e éducateur·trice.', bien: true, retour: 'Excellent réflexe ! Les adultes de l’école connaissent ça et ont souvent des protections de dépannage. Demander de l’aide, c’est un bon choix.' },
  { id: 'papier', texte: 'Plier du papier toilette dans sa culotte en attendant d’avoir une vraie protection.', bien: true, retour: 'Bonne idée pour dépanner ! Ensuite, on va chercher une vraie protection, car le papier tient mal.' },
  { id: 'famille', texte: 'Faire prévenir ses parents ou un proche pour qu’on apporte des affaires de rechange.', bien: true, retour: 'Très bien aussi : un proche peut apporter une culotte propre et des protections.' },
]
function Surprise({ suite }) {
  const [vus, setVus] = useState([])
  const unBien = vus.some((id) => CHOIX_SURPRISE.find((c) => c.id === id).bien)
  const dernier = vus.length ? CHOIX_SURPRISE.find((c) => c.id === vus.at(-1)) : null
  return (
    <>
      <Scene
        perso="lou"
        humeur="surpris"
        titre="Une surprise à l’école"
        histoire="Lou a 11 ans. Pendant la récréation, Lou remarque un liquide rouge-brun sur sa culotte : ce sont ses premières règles ! Lou ne s’y attendait pas du tout. Que peut faire Lou ?"
      >
        <div className="mt-3 flex flex-col gap-2">
          {CHOIX_SURPRISE.map((c) => {
            const vu = vus.includes(c.id)
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => !vu && setVus((v) => [...v, c.id])}
                className="min-h-[52px] rounded-2xl border-2 px-3.5 py-2.5 text-left text-[15px] leading-snug active:scale-[.98]"
                style={{ borderColor: vu ? (c.bien ? C.ok : C.abricot) : C.bord, background: vu ? (c.bien ? C.okClair : C.abricotClair) : '#fff', color: C.texte }}
              >
                {c.texte}
              </button>
            )
          })}
        </div>
      </Scene>
      {dernier && <Retour ok={dernier.bien} titre={dernier.bien ? 'Un bon réflexe' : 'On peut faire mieux'}>{dernier.retour}</Retour>}
      {unBien && <BoutonR onClick={suite}>Scène suivante <ArrowRight size={18} /></BoutonR>}
    </>
  )
}

// ---------------- 2. Le kit de secours ----------------
const OBJETS = [
  { id: 'protections', nom: 'Des protections', utile: true },
  { id: 'culotte', nom: 'Une culotte de rechange', utile: true },
  { id: 'sac', nom: 'Un petit sac pour la protection usagée', utile: true },
  { id: 'mouchoirs', nom: 'Des mouchoirs ou des lingettes', utile: true },
  { id: 'ballon', nom: 'Un ballon de foot', utile: false },
  { id: 'taille-crayon', nom: 'Un taille-crayon', utile: false },
  { id: 'lunettes', nom: 'Des lunettes de soleil', utile: false },
]
function Kit({ suite }) {
  const [pris, setPris] = useState([])
  const [verif, setVerif] = useState(false)
  const utiles = OBJETS.filter((o) => o.utile).map((o) => o.id)
  const reussi = verif && utiles.every((id) => pris.includes(id)) && pris.every((id) => utiles.includes(id))
  const manque = utiles.filter((id) => !pris.includes(id)).length
  const enTrop = pris.filter((id) => !utiles.includes(id)).length
  function basculer(id) {
    setVerif(false)
    setPris((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }
  return (
    <>
      <Scene perso="ines" humeur="content" titre="Le kit de secours" histoire="Inès sait que ses règles vont bientôt arriver. Elle prépare une petite trousse à garder dans son sac. Touche les 4 objets les plus utiles.">
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {OBJETS.map((o) => {
            const choisi = pris.includes(o.id)
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => basculer(o.id)}
                aria-pressed={choisi}
                className="flex min-h-[52px] items-center gap-2 rounded-2xl border-2 px-3 py-2 text-left text-[15px] leading-snug active:scale-[.98]"
                style={choisi ? { borderColor: C.sauge, background: C.saugeClair, color: C.texte } : { borderColor: C.bord, background: '#fff', color: C.texte }}
              >
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full border-2" style={choisi ? { background: C.sauge, borderColor: C.sauge, color: '#fff' } : { borderColor: C.bord }}>
                  {choisi && <Check size={14} strokeWidth={3} />}
                </span>
                {o.nom}
              </button>
            )
          })}
        </div>
        <BoutonR className="mt-3 w-full" couleur={C.sauge} disabled={pris.length === 0} onClick={() => setVerif(true)}>Vérifier mon kit</BoutonR>
      </Scene>
      {verif && !reussi && (
        <Retour ok={false} titre="Presque !">
          {manque > 0 && `Il manque ${manque} objet${manque > 1 ? 's' : ''} utile${manque > 1 ? 's' : ''}. `}
          {enTrop > 0 && `${enTrop} objet${enTrop > 1 ? 's' : ''} ne serve${enTrop > 1 ? 'nt' : ''} pas pour ça. `}
          Pense à : de quoi se protéger, se changer, jeter proprement et s’essuyer.
        </Retour>
      )}
      {reussi && (
        <>
          <Retour ok titre="Kit prêt !">Avec ça, Inès est prête quoi qu’il arrive. Elle peut aussi en prêter à une copine qui a une surprise.</Retour>
          <BoutonR onClick={suite}>Scène suivante <ArrowRight size={18} /></BoutonR>
        </>
      )}
    </>
  )
}

// ---------------- 3. Chacun son rythme ----------------
const CHOIX_RYTHME = [
  { id: 'souci', texte: 'Il y a un problème : Sami est en retard.', bien: false, retour: 'Non : il n’y a pas d’heure « officielle ». Les premières règles arrivent le plus souvent entre 9 et 16 ans. Si vers 16 ans elles ne sont toujours pas là, on peut en parler à un médecin, juste pour être rassuré·e.' },
  { id: 'rythme', texte: 'Chaque corps a son rythme : Sami n’a rien à craindre.', bien: true, retour: 'Exactement. Avant les premières règles, le corps envoie souvent des signes : la poitrine grossit, des poils apparaissent, on grandit vite, et on voit parfois un liquide blanc ou transparent sur la culotte (les pertes blanches). C’est normal.' },
  { id: 'tous', texte: 'Tous les copains les ont déjà : c’est sûr.', bien: false, retour: 'Pas du tout ! On n’en parle pas toujours, et beaucoup de gens n’ont pas encore leurs règles à 12 ans. Se comparer ne sert à rien : chaque corps a son rythme.' },
]
function Rythme({ suite }) {
  const [vus, setVus] = useState([])
  const dernier = vus.length ? CHOIX_RYTHME.find((c) => c.id === vus.at(-1)) : null
  const ok = vus.includes('rythme')
  return (
    <>
      <Scene perso="sami" humeur="inquiet" titre="Ça n’arrive pas encore" histoire="Sami a 12 ans. Plusieurs de ses camarades ont déjà leurs règles, mais pas Sami. Sami se pose des questions. Que peut-on dire à Sami ?">
        <div className="mt-3 flex flex-col gap-2">
          {CHOIX_RYTHME.map((c) => {
            const vu = vus.includes(c.id)
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => !vu && setVus((v) => [...v, c.id])}
                className="min-h-[52px] rounded-2xl border-2 px-3.5 py-2.5 text-left text-[15px] leading-snug active:scale-[.98]"
                style={{ borderColor: vu ? (c.bien ? C.ok : C.abricot) : C.bord, background: vu ? (c.bien ? C.okClair : C.abricotClair) : '#fff', color: C.texte }}
              >
                {c.texte}
              </button>
            )
          })}
        </div>
      </Scene>
      {dernier && <Retour ok={dernier.bien} titre={dernier.bien ? 'Oui !' : 'Pas tout à fait'}>{dernier.retour}</Retour>}
      {ok && <BoutonR onClick={suite}>Scène suivante <ArrowRight size={18} /></BoutonR>}
    </>
  )
}

// ---------------- 4. Les réactions ----------------
const EMOTIONS = [
  { id: 'surprise', nom: 'Surprise', humeur: 'surpris' },
  { id: 'fierte', nom: 'Fierté', humeur: 'fier' },
  { id: 'joie', nom: 'Joie', humeur: 'content' },
  { id: 'peur', nom: 'Peur', humeur: 'inquiet' },
  { id: 'gene', nom: 'Gêne', humeur: 'inquiet' },
  { id: 'indiff', nom: 'Ça ne fait rien', humeur: 'neutre' },
  { id: 'energ', nom: 'Énervement', humeur: 'neutre' },
  { id: 'curio', nom: 'Curiosité', humeur: 'surpris' },
]
function Reactions({ suite }) {
  const [choisies, setChoisies] = useState([])
  const derniere = choisies.length ? EMOTIONS.find((e) => e.id === choisies.at(-1)) : null
  return (
    <>
      <Scene perso="noa" humeur={derniere?.humeur || 'neutre'} titre="Et comment on se sent ?" histoire="Quand les premières règles arrivent, chacun·e réagit à sa façon. Touche les réactions que tu peux imaginer, chez toi ou chez quelqu’un d’autre.">
        <div className="mt-3 flex flex-wrap gap-2">
          {EMOTIONS.map((e) => {
            const choisi = choisies.includes(e.id)
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => setChoisies((c) => (c.includes(e.id) ? c.filter((x) => x !== e.id) : [...c, e.id]))}
                aria-pressed={choisi}
                className="regles-titre flex min-h-[48px] items-center gap-2 rounded-full border-2 px-4 text-[15px] active:scale-95"
                style={choisi ? { borderColor: C.rose, background: C.roseClair, color: C.texte } : { borderColor: C.bord, background: '#fff', color: C.texte }}
              >
                <Visage id="noa" humeur={e.humeur} className="h-8 w-8 flex-none rounded-full" titre="" />
                {e.nom}
              </button>
            )
          })}
        </div>
      </Scene>
      {choisies.length > 0 && (
        <>
          <Retour ok titre="Toutes ces réactions sont normales">
            Il n’y a pas de bonne ou de mauvaise réaction. On peut ressentir plusieurs choses en même temps, et ça peut changer d’un jour à l’autre. Si une émotion est difficile à porter, on peut en parler à quelqu’un de confiance.
          </Retour>
          <BoutonR onClick={suite}>Dernière scène <ArrowRight size={18} /></BoutonR>
        </>
      )}
    </>
  )
}

// ---------------- 5. À qui en parler ----------------
const PERSONNES = ['Un parent ou un proche', 'Le ou la titulaire', 'L’infirmier·ère ou le centre PMS', 'Un médecin', 'Une grande sœur, un grand frère', 'Un·e ami·e de confiance']
function Parler({ recommencer }) {
  return (
    <>
      <CarteR className="regles-apparait" couleur={C.sauge}>
        <h2 className="regles-titre text-[24px] leading-tight" style={{ color: C.texte }}>À qui en parler ?</h2>
        <p className="mt-2 text-[15.5px] leading-relaxed" style={{ color: C.texte }}>Poser des questions, c’est normal. Si tu as un doute, une inquiétude ou si tu as mal, tu peux en parler à :</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {PERSONNES.map((p) => (
            <li key={p} className="rounded-full px-3.5 py-2 text-[14.5px] font-bold" style={{ background: C.saugeClair, color: C.sauge }}>{p}</li>
          ))}
        </ul>
        <div className="mt-4 rounded-2xl px-3.5 py-3 text-[15px] leading-relaxed" style={{ background: C.roseClair, color: C.texte }}>
          <p className="regles-titre text-[16px]" style={{ color: C.rose }}>À retenir</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>Les premières règles arrivent le plus souvent entre 9 et 16 ans, chacun·e à son rythme.</li>
            <li>On peut se préparer avec un petit kit de secours.</li>
            <li>Toutes les réactions sont normales, et on a le droit de demander de l’aide.</li>
          </ul>
        </div>
      </CarteR>
      <BoutonR variante="secondaire" onClick={recommencer}><RotateCcw size={18} /> Revoir les scènes</BoutonR>
    </>
  )
}
