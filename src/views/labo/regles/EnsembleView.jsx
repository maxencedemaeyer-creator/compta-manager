import { useState } from 'react'
import { ArrowRight, Globe, HeartHandshake, MessageCircle, RotateCcw } from 'lucide-react'
import { BoutonR, C, CarteR, Consigne, Onglets, PageRegles, Retour, melanger } from '../../../components/labo/regles/ui.jsx'

// =============================================================
//  R12 · Ensemble — comprendre les autres.
//  - Que faire ? : trois situations à l'école, réponses bienveillantes.
//  - Les mots : respectueux ou à éviter ?
//  - Dans le monde : les règles selon les cultures, et la précarité
//    menstruelle (des personnes manquent de protections).
//  Cette activité s'adresse à TOUT LE MONDE, pas seulement à celles
//  et ceux qui ont leurs règles.
// =============================================================
const CORAIL = '#B5502F'

export default function EnsembleView() {
  const [mode, setMode] = useState('situations')
  return (
    <PageRegles large>
      <Onglets
        valeur={mode}
        onChange={setMode}
        couleur={CORAIL}
        options={[
          ['situations', HeartHandshake, 'Que faire ?'],
          ['mots', MessageCircle, 'Les mots'],
          ['monde', Globe, 'Dans le monde'],
        ]}
      />
      {mode === 'situations' && <Situations />}
      {mode === 'mots' && <Mots />}
      {mode === 'monde' && <Monde />}
    </PageRegles>
  )
}

const SITUATIONS = [
  {
    texte: 'En classe, Lina chuchote à sa voisine : « Tu as une protection ? J’ai mes règles. »',
    choix: [
      ['La lui donner discrètement, sans en faire un événement.', true, 'Oui : l’entraide, simple et discrète, est exactement ce qu’il faut.'],
      ['Répéter à voix haute pour que tout le monde entende.', false, 'Ça mettrait Lina très mal à l’aise : c’est une information qu’elle a confiée à une seule personne.'],
      ['Dire « je n’ai pas ça », sans proposer d’aide.', false, 'On peut au moins aider à trouver une solution : demander à un adulte, ou à une autre personne de confiance.'],
    ],
  },
  {
    texte: 'Une serviette hygiénique tombe du sac de Sami. Un camarade se met à rire.',
    choix: [
      ['Dire calmement : « Ça arrive à plein de gens, ce n’est pas drôle. »', true, 'Bravo : défendre quelqu’un calmement aide beaucoup, et montre que c’est normal.'],
      ['Rire aussi, pour faire comme les autres.', false, 'Rire d’une chose normale blesse. On peut choisir de ne pas suivre le groupe.'],
      ['Ramasser la serviette, la rendre à Sami et passer à autre chose.', true, 'Très bien aussi : un geste simple, sans gêner Sami.'],
    ],
  },
  {
    texte: 'Un copain te demande : « C’est quoi, les règles ? Je n’ai jamais compris. »',
    choix: [
      ['Lui expliquer simplement : « Une fois par cycle, la couche à l’intérieur de l’utérus se détache et sort avec un peu de sang. »', true, 'Super : poser une question, c’est normal, et y répondre calmement aide tout le monde.'],
      ['Se moquer de lui parce qu’il ne sait pas.', false, 'Personne ne naît en sachant. Se moquer empêche de poser des questions.'],
      ['L’inviter à voir l’expérience « Les règles » ou à demander à un adulte.', true, 'Très bien aussi : on peut chercher ensemble de bonnes informations.'],
    ],
  },
]
function Situations() {
  const [rang, setRang] = useState(0)
  const [vus, setVus] = useState([])
  const fini = rang >= SITUATIONS.length
  if (fini)
    return (
      <CarteR couleur={C.sauge} className="regles-apparait text-center">
        <p className="regles-titre text-[26px]" style={{ color: C.texte }}>Merci d’être bienveillant·e !</p>
        <p className="mt-2 text-[15.5px]" style={{ color: C.texte }}>Parler des règles calmement, aider et ne pas se moquer : c’est ça, comprendre les autres.</p>
        <BoutonR className="mx-auto mt-4" couleur={C.sauge} onClick={() => { setRang(0); setVus([]) }}><RotateCcw size={18} /> Recommencer</BoutonR>
      </CarteR>
    )
  const s = SITUATIONS[rang]
  const dernier = vus.length ? s.choix[vus.at(-1)] : null
  const unBien = vus.some((i) => s.choix[i][1])
  return (
    <>
      <Consigne couleur={CORAIL}><span className="regles-titre text-[19px] leading-snug">{s.texte}</span><span className="mt-1 block text-[14px]" style={{ color: C.doux }}>Que fais-tu ? Touche les réponses pour voir.</span></Consigne>
      <div className="flex flex-col gap-2">
        {s.choix.map(([texte, bien], i) => {
          const vu = vus.includes(i)
          return (
            <button key={i} type="button" onClick={() => !vu && setVus((v) => [...v, i])} className="min-h-[52px] rounded-2xl border-2 px-3.5 py-2.5 text-left text-[15px] leading-snug active:scale-[.98]"
              style={{ borderColor: vu ? (bien ? C.ok : C.abricot) : C.bord, background: vu ? (bien ? C.okClair : C.abricotClair) : '#fff', color: C.texte }}>
              {texte}
            </button>
          )
        })}
      </div>
      {dernier && <Retour ok={dernier[1]} titre={dernier[1] ? 'Bon réflexe' : 'On peut mieux faire'}>{dernier[2]}</Retour>}
      {unBien && <BoutonR couleur={CORAIL} onClick={() => { setRang((r) => r + 1); setVus([]) }}>Suivante <ArrowRight size={18} /></BoutonR>}
    </>
  )
}

const MOTS = [
  ['« Elle a ses règles. »', true, 'Un mot simple et juste.'],
  ['« Beurk, c’est dégoûtant ! »', false, 'Le corps fonctionne comme ça : ce n’est pas dégoûtant, et ce genre de phrase blesse.'],
  ['« Il est de mauvaise humeur : il doit avoir ses règles ! »', false, 'Se moquer de l’humeur de quelqu’un en lui collant « ses règles » est blessant, et souvent faux.'],
  ['« Tu as besoin d’une protection ? J’en ai une. »', true, 'Une phrase gentille et utile.'],
  ['« On ne parle pas de ça. »', false, 'En ne parlant pas des règles, on laisse les gens seuls avec leurs questions.'],
  ['« C’est normal, ça arrive à plein de gens. »', true, 'Rassurant et vrai.'],
]
function Mots() {
  const [file, setFile] = useState(() => melanger(MOTS))
  const [rang, setRang] = useState(0)
  const [rep, setRep] = useState(null)
  const [bons, setBons] = useState(0)
  if (rang >= file.length)
    return (
      <CarteR couleur={C.sauge} className="regles-apparait text-center">
        <p className="regles-titre text-[26px]" style={{ color: C.texte }}>{bons} sur {file.length}</p>
        <p className="mt-2 text-[15px]" style={{ color: C.texte }}>Les bons mots : simples, respectueux, sans moquerie.</p>
        <BoutonR className="mx-auto mt-4" couleur={C.sauge} onClick={() => { setFile(melanger(MOTS)); setRang(0); setRep(null); setBons(0) }}><RotateCcw size={18} /> Rejouer</BoutonR>
      </CarteR>
    )
  const [texte, resp, expl] = file[rang]
  return (
    <>
      <Consigne couleur={CORAIL}>Cette phrase est-elle respectueuse, ou à éviter ?</Consigne>
      <CarteR key={rang} className="regles-apparait" couleur="#E5C18A"><p className="regles-titre text-[22px] leading-snug" style={{ color: C.texte }}>{texte}</p></CarteR>
      <div className="grid grid-cols-2 gap-3">
        {[[true, 'Respectueux', C.ok, C.okClair], [false, 'À éviter', C.non, C.nonClair]].map(([v, nom, c, f]) => (
          <button key={nom} type="button" disabled={rep != null} onClick={() => { setRep(v); if (v === resp) setBons((b) => b + 1) }}
            className="regles-titre min-h-[60px] rounded-2xl border-2 text-[18px] active:scale-95" style={{ borderColor: c, background: rep === v ? c : f, color: rep === v ? '#fff' : c, opacity: rep != null && rep !== v ? 0.55 : 1 }}>
            {nom}
          </button>
        ))}
      </div>
      {rep != null && (
        <>
          <Retour ok={rep === resp} titre={rep === resp ? 'Oui !' : 'Pas tout à fait'}>{expl}</Retour>
          <BoutonR couleur={CORAIL} onClick={() => { setRang((r) => r + 1); setRep(null) }}>Suivante <ArrowRight size={18} /></BoutonR>
        </>
      )}
    </>
  )
}

const MONDE = [
  { titre: 'Selon les cultures', texte: 'Dans certains endroits du monde, on parle facilement des règles, et on fête même les premières règles. Dans d’autres, c’est un sujet tabou : on n’en parle pas, et des personnes sont écartées de certaines activités pendant leurs règles. Les règles, elles, sont les mêmes partout.' },
  { titre: 'Un tabou qui a changé', texte: 'Pendant longtemps, on a beaucoup caché les règles, et de fausses idées circulaient. Aujourd’hui, de plus en plus d’écoles, d’associations et de familles en parlent ouvertement pour mieux informer.' },
  { titre: 'Quand les protections coûtent trop cher', texte: 'Acheter des protections coûte de l’argent. Certaines personnes ne peuvent pas en acheter assez : on parle de précarité menstruelle. Dans le monde, des élèves manquent même l’école pour cette raison. Des associations et des écoles proposent des protections gratuites pour aider.' },
  { titre: 'Comprendre pour agir', texte: 'Connaître les règles aide à poser des questions, à faire des choix éclairés, à ne pas croire toutes les idées reçues, et à mieux comprendre les expériences et les besoins des autres.' },
]
function Monde() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {MONDE.map((m) => (
        <CarteR key={m.titre} className="regles-apparait">
          <h2 className="regles-titre text-[20px]" style={{ color: C.texte }}>{m.titre}</h2>
          <p className="mt-2 text-[15px] leading-relaxed" style={{ color: C.texte }}>{m.texte}</p>
        </CarteR>
      ))}
    </div>
  )
}
