import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, RotateCcw, Trophy } from 'lucide-react'
import { BoutonR, C, CarteR, LogoActiviteClair, PageRegles, Retour, melanger } from '../../../components/labo/regles/ui.jsx'
import { EXPERIENCE } from '../../../config/laboAteliers.js'

// =============================================================
//  R13 · Défi — le grand test de l'expérience « Les règles ».
//  Volontairement CALME : pas de chrono, pas de classement, pas de
//  surnom enregistré (le sujet est personnel). 12 questions, 1 par
//  activité, avec une explication à chaque réponse, puis un bilan
//  par activité (« à revoir » → lien direct).
// =============================================================

// [activité, question, bonne réponse, autres réponses, explication]
const BANQUE = [
  ['dedans', 'Dans quelle partie du corps l’ovule mûrit-il ?', 'Dans l’ovaire', ['Dans l’utérus', 'Dans le vagin', 'Dans le col'], 'Les ovaires contiennent les ovules.'],
  ['dedans', 'Comment s’appelle la couche qui tapisse l’intérieur de l’utérus ?', 'L’endomètre', ['Le pavillon', 'Le col', 'L’ovule'], 'L’endomètre s’épaissit puis se détache : ce sont les règles.'],
  ['dedans', 'Par où sortent les règles ?', 'Par le vagin', ['Par le trou du pipi', 'Par les trompes', 'Par l’ovaire'], 'Les règles sortent par le vagin ; le pipi sort par l’urètre, une autre ouverture.'],
  ['dedans', 'Quel organe relie l’utérus au vagin ?', 'Le col de l’utérus', ['La trompe utérine', 'L’ovaire', 'L’endomètre'], 'Le col est un passage très étroit, en bas de l’utérus.'],
  ['dedans', 'Que fait la trompe utérine ?', 'Elle guide l’ovule de l’ovaire vers l’utérus', ['Elle fabrique le sang des règles', 'Elle stocke l’urine', 'Elle protège le col'], 'L’ovule voyage dans la trompe, qui part de chaque côté de l’utérus.'],
  ['cycle', 'À partir de quel jour compte-t-on le début du cycle ?', 'Du premier jour des règles', ['Du jour de l’ovulation', 'De la fin des règles', 'Du jour où l’endomètre est le plus épais'], 'Le jour 1 du cycle est le premier jour des règles.'],
  ['cycle', 'Un cycle dure souvent…', 'entre 21 et 35 jours', ['exactement 28 jours', 'toujours 30 jours', 'moins de 10 jours'], '28 jours est une moyenne : il y a beaucoup de variations, surtout au début.'],
  ['cycle', 'Comment s’appelle l’étape où un ovule quitte l’ovaire ?', 'L’ovulation', ['La fécondation', 'Les règles', 'La puberté'], 'Elle a lieu environ 14 jours avant les règles suivantes.'],
  ['cycle', 'Combien de jours durent les règles en général ?', 'De 2 à 7 jours', ['Un seul jour', 'Plus de 3 semaines', 'Exactement 10 jours'], 'Ça varie d’une personne à l’autre, et d’un cycle à l’autre.'],
  ['cycle', 'S’il n’y a pas de grossesse, que devient l’endomètre à la fin du cycle ?', 'Il se détache', ['Il devient un ovule', 'Il reste pour toujours', 'Il remonte dans l’ovaire'], 'Il se détache et sort avec un peu de sang : de nouvelles règles commencent.'],
  ['ovule', 'Combien de temps un ovule peut-il être fécondé après l’ovulation ?', 'Environ 12 à 24 heures', ['Environ 3 semaines', 'Environ 2 mois', 'Une seule minute'], 'L’ovule ne vit que très peu de temps.'],
  ['ovule', 'Comment s’appelle la rencontre d’un ovule et d’un spermatozoïde ?', 'La fécondation', ['L’ovulation', 'Les règles', 'La digestion'], 'Les deux cellules fusionnent en une cellule-œuf.'],
  ['ovule', 'Où l’ovule voyage-t-il juste après avoir quitté l’ovaire ?', 'Dans la trompe', ['Dans le vagin', 'Dans l’estomac', 'Dans la vessie'], 'Les franges de la trompe l’attrapent, puis il avance vers l’utérus.'],
  ['ovule', 'Sans spermatozoïde, que devient l’ovule ?', 'Il disparaît', ['Il devient un bébé', 'Il reste dans le vagin', 'Il grossit'], 'Il se désagrège, et environ 2 semaines plus tard, les règles arrivent.'],
  ['protections', 'Quelle protection recueille le sang au lieu de l’absorber ?', 'La cup menstruelle', ['Le tampon', 'La serviette jetable', 'La culotte menstruelle'], 'La cup est une petite coupe en silicone, réutilisable.'],
  ['protections', 'Combien de temps au maximum garde-t-on un tampon ?', '8 heures', ['24 heures', '3 jours', 'Aussi longtemps qu’on veut'], 'On le change toutes les 4 à 6 heures, jamais plus de 8 heures.'],
  ['protections', 'Que fait-on d’une serviette jetable usagée ?', 'On l’enveloppe et on la jette à la poubelle', ['On la jette dans les toilettes', 'On la lave', 'On la garde dans son sac'], 'Dans les toilettes, elle bouche les tuyaux.'],
  ['protections', 'Quelle protection a un petit fil pour la retirer ?', 'Le tampon', ['La serviette lavable', 'La cup', 'La culotte menstruelle'], 'Le fil sert à retirer le tampon.'],
  ['premieres', 'À quel âge arrivent le plus souvent les premières règles ?', 'Entre 9 et 16 ans, selon les personnes', ['Toujours à 10 ans', 'Seulement à 18 ans', 'Jamais avant 20 ans'], 'Chaque corps a son rythme.'],
  ['premieres', 'Les règles arrivent à l’école. Que peut-on faire ?', 'Demander de l’aide à un adulte de confiance', ['Se cacher toute la journée', 'Ne rien dire à personne', 'Rentrer en courant sans prévenir'], 'Les adultes de l’école connaissent ça et peuvent aider.'],
  ['premieres', 'Comment réagit-on à ses premières règles ?', 'De mille façons : toutes sont normales', ['Il faut forcément être heureux·se', 'Il faut forcément avoir peur', 'Il ne faut rien ressentir'], 'Il n’y a pas de bonne ou de mauvaise réaction.'],
  ['vrai-faux', 'Peut-on faire du sport pendant ses règles ?', 'Oui, si on en a envie', ['Non, c’est interdit', 'Non, c’est dangereux', 'Seulement une fois par an'], 'Bouger peut même aider contre les crampes.'],
  ['vrai-faux', 'Un tampon peut-il se perdre dans le corps ?', 'Non, jamais', ['Oui, souvent', 'Oui, dans l’estomac', 'Oui, dans la tête'], 'Le col de l’utérus est trop étroit pour qu’il passe.'],
  ['vrai-faux', 'Quand les règles s’arrêtent-elles, en général ?', 'À la ménopause, vers 50 ans', ['À 18 ans', 'À 25 ans', 'Jamais'], 'Elles s’arrêtent à la ménopause.'],
  ['vrai-faux', 'Les règles, c’est…', 'Une partie normale du fonctionnement du corps', ['Sale', 'Une maladie', 'Une punition'], 'C’est du sang et de petits morceaux de l’endomètre : rien de sale.'],
  ['calendrier', 'Les cycles passés de Lou durent 24, 24 et 25 jours. Environ quelle est la moyenne ?', '24 jours', ['14 jours', '35 jours', '50 jours'], 'On additionne les durées puis on divise : environ 24 jours.'],
  ['calendrier', 'Les cycles d’une personne sont irréguliers. Que peut-on prévoir ?', 'Seulement une fourchette de dates', ['Le jour exact, toujours', 'Rien du tout, jamais', 'Que les règles ne viendront plus'], 'Au début de la vie de règles, les cycles varient beaucoup.'],
  ['absorbe', 'Combien de sang représentent les règles en tout, environ ?', '2 à 5 cuillères à soupe', ['Un grand seau', 'Un litre', 'Une baignoire'], 'Environ 30 à 80 ml : moins qu’un petit verre.'],
  ['absorbe', 'Dans une serviette, que fait la couche imperméable ?', 'Elle empêche le liquide de traverser vers la culotte', ['Elle absorbe tout le liquide', 'Elle parfume la serviette', 'Elle rend la serviette réutilisable'], 'Le cœur absorbe, la couche du dessous bloque.'],
  ['humeurs', 'Qu’est-ce qu’une hormone ?', 'Un messager chimique fabriqué par le corps', ['Un os', 'Un vêtement', 'Un aliment'], 'Les hormones changent pendant le cycle.'],
  ['humeurs', 'Tout le monde ressent les mêmes humeurs avant les règles ?', 'Non, c’est très variable', ['Oui, toujours', 'Oui, mais seulement les filles de 12 ans', 'Oui, sauf le lundi'], 'Certaines personnes ressentent beaucoup de choses, d’autres presque rien.'],
  ['douleurs', 'Une douleur si forte qu’on ne peut pas aller à l’école. Que faire ?', 'En parler à un adulte ou à un médecin', ['La supporter sans rien dire', 'Attendre un an', 'Ne rien manger'], 'On n’a pas à supporter seul·e une forte douleur.'],
  ['douleurs', 'Qu’est-ce qui peut aider contre les crampes ?', 'Une bouillotte tiède, bouger doucement, se reposer', ['Rester dehors sans bouger du tout', 'Courir un marathon', 'Ne plus boire'], 'La chaleur et le repos détendent le muscle de l’utérus.'],
  ['toute-la-vie', 'À quel âge les règles s’arrêtent-elles en général (la ménopause) ?', 'Vers 50 ans', ['Vers 20 ans', 'Vers 30 ans', 'Jamais'], 'Entre 45 et 55 ans, selon les personnes.'],
  ['toute-la-vie', 'Toutes les personnes ont-elles leurs règles de la même façon ?', 'Non, chacune a son histoire', ['Oui, exactement', 'Oui, toutes à 12 ans', 'Oui, toutes 5 jours'], 'L’âge, la durée, le cycle et l’abondance varient.'],
  ['ensemble', 'Une camarade demande discrètement une protection. Que fais-tu ?', 'Je l’aide discrètement', ['Je le dis à toute la classe', 'Je me moque', 'Je fais semblant de ne pas entendre'], 'L’entraide, simple et discrète, est le bon réflexe.'],
  ['ensemble', 'Qui peut comprendre les règles ?', 'Tout le monde', ['Seulement les filles', 'Seulement les adultes', 'Seulement les médecins'], 'Comprendre aide à respecter et à soutenir les autres.'],
]

const PAR_ACTIVITE = 1

function tirage() {
  const acts = [...new Set(BANQUE.map((q) => q[0]))]
  const choisies = acts.flatMap((a) => melanger(BANQUE.filter((q) => q[0] === a)).slice(0, PAR_ACTIVITE))
  return melanger(choisies).map(([act, texte, bonne, autres, expl]) => ({ act, texte, bonne, expl, choix: melanger([bonne, ...autres]) }))
}

export default function DefiReglesView() {
  const [questions, setQuestions] = useState(tirage)
  const [rang, setRang] = useState(0)
  const [reponse, setReponse] = useState(null)
  const [resultats, setResultats] = useState({})
  const fini = rang >= questions.length
  const q = questions[rang]

  const totaux = useMemo(() => Object.values(resultats).reduce((t, r) => ({ bons: t.bons + r.bons, total: t.total + r.total }), { bons: 0, total: 0 }), [resultats])

  function repondre(c) {
    if (reponse != null) return
    setReponse(c)
    setResultats((r) => {
      const avant = r[q.act] || { bons: 0, total: 0 }
      return { ...r, [q.act]: { bons: avant.bons + (c === q.bonne ? 1 : 0), total: avant.total + 1 } }
    })
  }
  function recommencer() {
    setQuestions(tirage())
    setRang(0)
    setReponse(null)
    setResultats({})
  }

  if (fini) {
    const exp = EXPERIENCE.regles
    const lignes = exp.activites.filter((a) => resultats[a.id]).map((a) => ({ a, ...resultats[a.id] }))
    return (
      <PageRegles>
        <CarteR couleur="#E8C85A" fond="#FFF6C9" className="regles-apparait text-center">
          <Trophy className="mx-auto" size={40} style={{ color: '#B58A00' }} />
          <p className="regles-titre mt-1 text-[30px]" style={{ color: C.texte }}>{totaux.bons} sur {totaux.total}</p>
          <p className="text-[15px]" style={{ color: C.texte }}>
            {totaux.bons === totaux.total ? 'Parfait ! Tu connais très bien le sujet.' : totaux.bons >= totaux.total * 0.7 ? 'Très bien ! Tu as bien compris l’essentiel.' : 'Bon début ! Regarde ton bilan pour revoir ce qui t’a posé problème.'}
          </p>
        </CarteR>
        <CarteR>
          <p className="regles-mono text-[11px] uppercase" style={{ color: C.doux }}>Ton bilan</p>
          <ul className="mt-2 space-y-2">
            {lignes.map(({ a, bons, total }) => {
              const ok = bons === total
              const contenu = (
                <>
                  <LogoActiviteClair activite={a} taille={40} />
                  <span className="regles-titre flex-1 text-[19px]" style={{ color: C.texte }}>{a.nom}</span>
                  <span className="regles-titre text-[16px]" style={{ color: C.texte }}>{bons}/{total}</span>
                  {ok ? (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full text-white" style={{ background: C.ok }}><Check size={18} strokeWidth={3} /></span>
                  ) : (
                    <span className="rounded-full px-2.5 py-1 text-[12px] font-bold" style={{ background: C.abricotClair, color: C.abricot }}>À revoir</span>
                  )}
                </>
              )
              return (
                <li key={a.id}>
                  {ok ? (
                    <div className="flex items-center gap-3 rounded-2xl border-2 p-2" style={{ borderColor: C.bord }}>{contenu}</div>
                  ) : (
                    <Link to={`/labo/regles/${a.id}`} className="flex items-center gap-3 rounded-2xl border-2 p-2 active:scale-[.98]" style={{ borderColor: C.abricot }}>{contenu}</Link>
                  )}
                </li>
              )
            })}
          </ul>
        </CarteR>
        <BoutonR couleur={C.sauge} onClick={recommencer}><RotateCcw size={18} /> Refaire un défi avec d’autres questions</BoutonR>
      </PageRegles>
    )
  }

  const juste = reponse === q.bonne
  return (
    <PageRegles>
      <div className="flex items-center gap-1" aria-label={`Question ${rang + 1} sur ${questions.length}`}>
        {questions.map((_, i) => (
          <span key={i} className="h-2.5 flex-1 rounded-full" style={{ background: i < rang ? C.sauge : i === rang ? C.rose : C.bord }} />
        ))}
      </div>
      <p className="regles-mono text-[11px] uppercase" style={{ color: C.doux }}>Question {rang + 1} sur {questions.length} · pas de chrono, prends ton temps</p>
      <CarteR key={rang} className="regles-apparait" couleur="#E5C18A">
        <p className="regles-titre text-[22px] leading-snug" style={{ color: C.texte }}>{q.texte}</p>
      </CarteR>
      <div className="grid gap-2 sm:grid-cols-2">
        {q.choix.map((c) => {
          const bon = reponse != null && c === q.bonne
          const rate = reponse === c && c !== q.bonne
          return (
            <button
              key={c}
              type="button"
              disabled={reponse != null}
              onClick={() => repondre(c)}
              className="regles-titre min-h-[56px] rounded-2xl border-2 px-3 py-2 text-left text-[16px] leading-snug active:scale-[.98]"
              style={{ borderColor: bon ? C.ok : rate ? C.abricot : C.bord, background: bon ? C.okClair : rate ? C.abricotClair : '#fff', color: C.texte }}
            >
              {c}
            </button>
          )
        })}
      </div>
      {reponse != null && (
        <>
          <Retour ok={juste} titre={juste ? 'Bonne réponse !' : 'Pas tout à fait'}>
            {juste ? '' : `La bonne réponse : ${q.bonne}. `}{q.expl}
          </Retour>
          <BoutonR onClick={() => { setRang((r) => r + 1); setReponse(null) }}>
            {rang + 1 >= questions.length ? 'Voir mon bilan' : 'Suivante'} <ArrowRight size={18} />
          </BoutonR>
        </>
      )}
    </PageRegles>
  )
}
