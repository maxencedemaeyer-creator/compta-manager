import { useState } from 'react'
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react'
import Anatomie, { ETAPES_TRAJET } from '../../../components/labo/regles/Anatomie.jsx'
import { BoutonR, C, CarteR, PageRegles } from '../../../components/labo/regles/ui.jsx'

// =============================================================
//  R3 · Ovule — le voyage d'un ovule.
//  Un pas-à-pas sur le schéma : l'ovule mûrit, est libéré (ovulation),
//  traverse la trompe, puis deux possibilités :
//   - il rencontre un spermatozoïde : fécondation, puis l'œuf s'installe
//     dans l'endomètre (début d'une grossesse) ;
//   - il n'en rencontre pas : il disparaît, l'endomètre se détache (règles).
//  Fécondation expliquée à l'échelle des cellules, de façon schématique.
// =============================================================

const BASE = [
  {
    titre: '1. L’ovule mûrit',
    texte: 'Dans un ovaire, un ovule grandit à l’intérieur d’une petite poche : le follicule. Pendant ce temps, l’endomètre s’épaissit dans l’utérus.',
    vue: { ep: 0.55, ovaire: { etat: 'follicule', p: 0.95 }, ovule: null, surbrillance: ['ovaire'] },
  },
  {
    titre: '2. L’ovulation',
    texte: 'Le follicule s’ouvre : l’ovule sort de l’ovaire. Les franges de la trompe (le pavillon) l’attrapent comme une main.',
    vue: { ep: 0.65, ovaire: { etat: 'ovulation', p: 1 }, ovule: ETAPES_TRAJET.pavillon, surbrillance: [] },
  },
  {
    titre: '3. Dans la trompe',
    texte: 'L’ovule avance doucement dans la trompe, poussé par de minuscules poils (les cils) et de petits mouvements. Il ne vit que 12 à 24 heures.',
    vue: { ep: 0.7, ovaire: { etat: 'corps', p: 1 }, ovule: ETAPES_TRAJET.trompe, surbrillance: ['trompe'] },
  },
  {
    titre: '4. Une rencontre ?',
    texte: 'En chemin, l’ovule peut rencontrer un spermatozoïde, la cellule reproductrice masculine. Que se passe-t-il dans chaque cas ?',
    vue: { ep: 0.75, ovaire: { etat: 'corps', p: 0.9 }, ovule: ETAPES_TRAJET.pres, surbrillance: [] },
    choix: true,
  },
]
const OUI = [
  {
    titre: 'Oui : la fécondation',
    texte: 'Un spermatozoïde rejoint l’ovule : les deux cellules fusionnent. C’est la fécondation, qui se passe le plus souvent dans la trompe. Elles forment une seule cellule, la cellule-œuf.',
    vue: { ep: 0.8, ovaire: { etat: 'corps', p: 0.9 }, ovule: ETAPES_TRAJET.trompe, surbrillance: ['trompe'] },
    zoom: 'rencontre',
  },
  {
    titre: 'L’œuf se divise',
    texte: 'La cellule-œuf se divise en 2, puis en 4, puis en beaucoup de cellules : c’est le début d’un embryon. Il avance vers l’utérus.',
    vue: { ep: 0.85, ovaire: { etat: 'corps', p: 0.8 }, ovule: ETAPES_TRAJET.pres, surbrillance: [] },
    zoom: 'fusion',
  },
  {
    titre: 'Il s’installe',
    texte: 'Quelques jours plus tard, l’embryon s’installe dans l’endomètre. L’endomètre reste en place et ne se détache plus : il n’y a plus de règles pendant la grossesse.',
    vue: { ep: 1, ovaire: { etat: 'corps', p: 0.8 }, ovule: null, embryon: true, surbrillance: ['endometre'] },
  },
]
const NON = [
  {
    titre: 'Non : l’ovule disparaît',
    texte: 'Sans spermatozoïde, l’ovule ne se développe pas : il se désagrège, sans qu’on le voie. L’endomètre n’a plus besoin d’être épais.',
    vue: { ep: 0.9, ovaire: { etat: 'corps', p: 0.4 }, ovule: ETAPES_TRAJET.cavite, surbrillance: [] },
  },
  {
    titre: 'Les règles',
    texte: 'Environ deux semaines après l’ovulation, l’endomètre se détache et sort par le vagin avec un peu de sang. Ce sont les règles, et un nouveau cycle commence.',
    vue: { ep: 0.15, ovaire: { etat: 'follicule', p: 0.1 }, ovule: null, regles: true, surbrillance: [] },
  },
]

// Zoom sur les cellules (dessin schématique, pas à l'échelle)
function Zoom({ type }) {
  const spermato = (x, y, r = 0) => (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      <path d="M0 0 C-22 6 -30 -4 -46 4 S-62 -2 -72 6" fill="none" stroke="#8A6A7A" strokeWidth={2.2} strokeLinecap="round" />
      <ellipse cx={0} cy={0} rx={8} ry={5.5} fill="#B9A6DA" stroke="#6B55A0" strokeWidth={1.5} />
    </g>
  )
  return (
    <svg viewBox="0 0 300 150" className="w-full" role="img" aria-label={type === 'rencontre' ? 'Schéma agrandi : un spermatozoïde rejoint l’ovule' : 'Schéma agrandi : la cellule-œuf se divise'}>
      <rect width={300} height={150} rx={18} fill="#FFFDF8" stroke={C.bord} strokeWidth={2} />
      {type === 'rencontre' ? (
        <>
          <circle cx={210} cy={75} r={52} fill="#FBE9C4" stroke="#C98B4E" strokeWidth={3} />
          <circle cx={210} cy={75} r={42} fill="#FFF4DA" stroke="#E5C18A" strokeWidth={1.5} />
          <circle cx={210} cy={75} r={17} fill="#F3D9A8" stroke="#C98B4E" strokeWidth={2} />
          {spermato(152, 62, -10)}
          {spermato(140, 100, 12)}
          {spermato(160, 30, -30)}
          <text x={210} y={142} textAnchor="middle" fontSize={11} fontWeight={800} fill={C.doux}>ovule</text>
          <text x={80} y={142} textAnchor="middle" fontSize={11} fontWeight={800} fill={C.doux}>spermatozoïdes</text>
        </>
      ) : (
        <>
          {[[110, 75], [150, 75]].map(([x, y]) => (
            <circle key={x} cx={x} cy={y} r={26} fill="#FFF4DA" stroke="#C98B4E" strokeWidth={2.5} />
          ))}
          {[[218, 52], [250, 52], [218, 98], [250, 98]].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r={19} fill="#FFF4DA" stroke="#C98B4E" strokeWidth={2.2} />
          ))}
          <path d="M184 75 H196" stroke={C.doux} strokeWidth={3} strokeLinecap="round" />
          <path d="M190 69 L197 75 L190 81" fill="none" stroke={C.doux} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          <text x={130} y={142} textAnchor="middle" fontSize={11} fontWeight={800} fill={C.doux}>2 cellules</text>
          <text x={234} y={142} textAnchor="middle" fontSize={11} fontWeight={800} fill={C.doux}>4 cellules, puis plus…</text>
        </>
      )}
    </svg>
  )
}

export default function OvuleView() {
  const [branche, setBranche] = useState(null) // null | 'oui' | 'non'
  const [rang, setRang] = useState(0)
  const suite = branche === 'oui' ? OUI : branche === 'non' ? NON : []
  const etapes = [...BASE, ...suite]
  const etape = etapes[Math.min(rang, etapes.length - 1)]
  const dernier = rang >= etapes.length - 1
  const enChoix = etape.choix && !branche

  function choisir(b) {
    setBranche(b)
    setRang(BASE.length)
  }
  function recommencer() {
    setBranche(null)
    setRang(0)
  }

  return (
    <PageRegles large>
      <div className="grid gap-4 md:grid-cols-2">
        <CarteR className="!p-2">
          <Anatomie
            className="mx-auto max-h-[58dvh] w-full"
            ep={etape.vue.ep}
            ovaire={etape.vue.ovaire}
            ovule={etape.vue.ovule}
            regles={!!etape.vue.regles}
            embryon={!!etape.vue.embryon}
            surbrillance={etape.vue.surbrillance}
            titre={etape.titre}
          />
        </CarteR>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-1.5" aria-label={`Étape ${rang + 1} sur ${etapes.length}`}>
            {etapes.map((_, i) => (
              <span key={i} className="h-2.5 flex-1 rounded-full" style={{ background: i <= rang ? C.rose : C.bord }} />
            ))}
          </div>

          <CarteR key={`${branche}-${rang}`} className="regles-apparait" couleur="#E5C18A" fond="#FFFDF8">
            <h2 className="regles-titre text-[24px] leading-tight" style={{ color: C.texte }}>{etape.titre}</h2>
            <p className="mt-2 text-[15.5px] leading-relaxed" style={{ color: C.texte }}>{etape.texte}</p>
            {etape.zoom && (
              <div className="mt-3">
                <p className="regles-mono mb-1 text-[11px] uppercase" style={{ color: C.doux }}>Zoom sur les cellules (pas à l’échelle)</p>
                <Zoom type={etape.zoom} />
              </div>
            )}
          </CarteR>

          {enChoix ? (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <BoutonR couleur={C.lilas} onClick={() => choisir('oui')}>Un spermatozoïde l’atteint</BoutonR>
                <BoutonR variante="secondaire" onClick={() => choisir('non')}>Aucune rencontre</BoutonR>
              </div>
              <button type="button" onClick={() => setRang((r) => r - 1)} className="regles-titre self-start text-[15px] underline decoration-dotted underline-offset-4" style={{ color: C.doux }}>
                ← Étape précédente
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <BoutonR variante="secondaire" className="flex-none" aria-label="Étape précédente" disabled={rang === 0} onClick={() => setRang((r) => r - 1)}>
                <ArrowLeft size={18} />
              </BoutonR>
              {dernier ? (
                <BoutonR className="flex-1" couleur={C.sauge} onClick={recommencer}>
                  <RotateCcw size={18} /> Revoir le voyage
                </BoutonR>
              ) : (
                <BoutonR className="flex-1" onClick={() => setRang((r) => r + 1)}>
                  Suivant <ArrowRight size={18} />
                </BoutonR>
              )}
            </div>
          )}
          {branche && dernier && (
            <button type="button" onClick={() => { setBranche(branche === 'oui' ? 'non' : 'oui'); setRang(BASE.length) }} className="regles-titre text-[15px] underline decoration-dotted underline-offset-4" style={{ color: C.doux }}>
              Voir l’autre possibilité
            </button>
          )}
        </div>
      </div>
    </PageRegles>
  )
}
