import { useState } from 'react'
import { ArrowRight, BookOpen, RotateCcw, Split } from 'lucide-react'
import Anatomie from '../../../components/labo/regles/Anatomie.jsx'
import { BoutonR, C, CarteR, Consigne, Onglets, PageRegles, Retour, melanger } from '../../../components/labo/regles/ui.jsx'

// =============================================================
//  R9 · Douleurs — normal ou à montrer ?
//  - Comprendre : pourquoi on a parfois des crampes (l'utérus est un
//    muscle qui se contracte) et ce qui peut aider.
//  - Trier : des situations à classer : normal / en parler à un adulte /
//    urgent. Aucun diagnostic : on apprend à reconnaître quand demander de l'aide.
//  Pas de conseil de médicament : seulement « avec l'avis d'un adulte ou d'un médecin ».
// =============================================================
const ORANGE = '#B8661C'

export default function DouleursView() {
  const [mode, setMode] = useState('comprendre')
  return (
    <PageRegles large>
      <Onglets
        valeur={mode}
        onChange={setMode}
        couleur={ORANGE}
        options={[
          ['comprendre', BookOpen, 'Comprendre'],
          ['trier', Split, 'Normal ou à montrer ?'],
        ]}
      />
      {mode === 'comprendre' ? <Comprendre /> : <Trier />}
    </PageRegles>
  )
}

function Comprendre() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <CarteR className="!p-2">
        <Anatomie className="mx-auto max-h-[50dvh] w-full" ep={0.4} regles surbrillance={['uterus']} titre="Schéma de l’utérus, un muscle, avec les règles" />
      </CarteR>
      <div className="flex flex-col gap-3">
        <CarteR couleur="#E5C18A" fond="#FFFDF8">
          <h2 className="regles-titre text-[22px]" style={{ color: C.texte }}>Pourquoi ça peut faire mal ?</h2>
          <p className="mt-2 text-[15px] leading-relaxed" style={{ color: C.texte }}>
            L’utérus est un muscle. Pour aider l’endomètre à se détacher, il se contracte, comme un poing qui se serre puis se relâche. Ces contractions peuvent donner des crampes dans le bas du ventre, parfois dans le dos ou les cuisses.
          </p>
          <p className="mt-2 text-[15px] leading-relaxed" style={{ color: C.texte }}>Certaines personnes n’ont presque pas mal, d’autres un peu, d’autres plus. C’est très variable.</p>
        </CarteR>
        <CarteR couleur={C.sauge}>
          <h3 className="regles-titre text-[18px]" style={{ color: C.texte }}>Ce qui peut aider</h3>
          <ul className="mt-2 space-y-1.5 text-[15px]" style={{ color: C.texte }}>
            <li>• Poser une bouillotte tiède sur le ventre</li>
            <li>• Bouger doucement : marcher, s’étirer</li>
            <li>• Se reposer, boire de l’eau chaude ou tiède</li>
            <li>• Prendre un médicament <b>seulement avec l’accord d’un adulte ou d’un médecin</b></li>
          </ul>
        </CarteR>
      </div>
    </div>
  )
}

const CATEGORIES = [
  { id: 'normal', nom: 'Normal', couleur: C.ok, fond: C.okClair },
  { id: 'parler', nom: 'En parler à un adulte', couleur: ORANGE, fond: C.abricotClair },
  { id: 'urgent', nom: 'Urgent', couleur: C.non, fond: C.nonClair },
]
// [texte, catégorie, explication]
const CAS = [
  ['De petites crampes le premier jour, qui passent avec une bouillotte.', 'normal', 'Des crampes légères au début des règles sont très fréquentes.'],
  ['Le ventre un peu gonflé et les seins sensibles avant les règles.', 'normal', 'Ça arrive à beaucoup de personnes juste avant les règles.'],
  ['Les premières règles, puis les suivantes qui reviennent à des dates très différentes pendant la première année.', 'normal', 'Au début, le cycle est souvent irrégulier : il se régularise petit à petit.'],
  ['Des boutons et de la fatigue avant les règles.', 'normal', 'Les hormones changent : c’est normal. On peut en parler si ça gêne.'],
  ['Une douleur si forte qu’on ne peut pas aller à l’école ou faire ses activités.', 'parler', 'Ce n’est pas à supporter seul·e : un adulte ou un médecin peut aider à trouver pourquoi et comment soulager.'],
  ['Des règles qui durent plus de 8 jours.', 'parler', 'Plus de 7 à 8 jours, c’est à montrer à un médecin, pour être sûr·e que tout va bien.'],
  ['Si abondantes qu’il faut changer de protection toutes les heures.', 'parler', 'Des règles très abondantes peuvent fatiguer : on en parle à un adulte ou à un médecin.'],
  ['Des règles qui disparaissent de façon inattendue alors qu’elles étaient régulières.', 'parler', 'Mieux vaut demander un avis médical pour comprendre pourquoi.'],
  ['Avec un tampon : fièvre, malaise, vomissements ou plaques rouges sur la peau.', 'urgent', 'Il faut retirer le tampon et appeler un médecin ou les urgences tout de suite : c’est rare, mais grave.'],
  ['Une douleur très violente et soudaine dans le ventre, avec des vomissements.', 'urgent', 'On prévient tout de suite un adulte, qui appelle un médecin ou les urgences.'],
]

function Trier() {
  const [file, setFile] = useState(() => melanger(CAS))
  const [rang, setRang] = useState(0)
  const [rep, setRep] = useState(null)
  const [bons, setBons] = useState(0)
  const fini = rang >= file.length
  if (fini)
    return (
      <CarteR couleur={C.sauge} className="regles-apparait text-center">
        <p className="regles-titre text-[26px]" style={{ color: C.texte }}>Bien trié !</p>
        <p className="mt-1 text-[16px]" style={{ color: C.texte }}>{bons} bonne{bons > 1 ? 's' : ''} réponse{bons > 1 ? 's' : ''} sur {file.length}.</p>
        <p className="mt-2 text-[14.5px]" style={{ color: C.doux }}>Retiens : en cas de doute, on demande toujours à un adulte de confiance ou à un médecin.</p>
        <BoutonR className="mx-auto mt-4" couleur={C.sauge} onClick={() => { setFile(melanger(CAS)); setRang(0); setRep(null); setBons(0) }}><RotateCcw size={18} /> Rejouer</BoutonR>
      </CarteR>
    )
  const [texte, cat, expl] = file[rang]
  const bonne = CATEGORIES.find((c) => c.id === cat)
  function choisir(id) {
    if (rep) return
    setRep(id)
    if (id === cat) setBons((b) => b + 1)
  }
  return (
    <>
      <Consigne couleur={ORANGE}>Lis la situation et dis si c’est <b>normal</b>, s’il faut <b>en parler à un adulte</b>, ou si c’est <b>urgent</b>.</Consigne>
      <p className="regles-mono text-[11px] uppercase" style={{ color: C.doux }}>Situation {rang + 1} sur {file.length}</p>
      <CarteR key={rang} className="regles-apparait" couleur="#E5C18A">
        <p className="regles-titre text-[20px] leading-snug" style={{ color: C.texte }}>{texte}</p>
      </CarteR>
      <div className="grid gap-2 sm:grid-cols-3">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            disabled={rep != null}
            onClick={() => choisir(c.id)}
            className="regles-titre min-h-[56px] rounded-2xl border-2 px-2 text-[16px] active:scale-95"
            style={{ borderColor: c.couleur, background: rep === c.id ? c.couleur : c.fond, color: rep === c.id ? '#fff' : c.couleur, opacity: rep != null && rep !== c.id ? 0.6 : 1 }}
          >
            {c.nom}
          </button>
        ))}
      </div>
      {rep != null && (
        <>
          <Retour ok={rep === cat} titre={rep === cat ? 'Oui !' : `Pas tout à fait : c’est « ${bonne.nom.toLowerCase()} »`}>{expl}</Retour>
          <BoutonR couleur={ORANGE} onClick={() => { setRang((r) => r + 1); setRep(null) }}>Suivante <ArrowRight size={18} /></BoutonR>
        </>
      )}
    </>
  )
}
