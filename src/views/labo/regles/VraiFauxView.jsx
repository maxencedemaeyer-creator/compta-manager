import { useState } from 'react'
import { ArrowRight, Check, RotateCcw, X } from 'lucide-react'
import { BoutonR, C, CarteR, Consigne, PageRegles, Retour, melanger } from '../../../components/labo/regles/ui.jsx'
import { IDEES } from '../../../components/labo/regles/fiches.js'

// =============================================================
//  R10 · Vrai ou faux — les idées reçues.
//  10 affirmations tirées au hasard parmi 16, sans chrono.
//  Après chaque réponse : une explication courte (jamais de moquerie).
// =============================================================
const NOMBRE = 10

export default function VraiFauxView() {
  const [file, setFile] = useState(() => melanger(IDEES).slice(0, NOMBRE))
  const [rang, setRang] = useState(0)
  const [reponse, setReponse] = useState(null) // true | false
  const [bons, setBons] = useState(0)
  const fini = rang >= file.length
  const carte = file[rang]

  function repondre(v) {
    if (reponse != null) return
    setReponse(v)
    if (v === carte.vrai) setBons((b) => b + 1)
  }
  function recommencer() {
    setFile(melanger(IDEES).slice(0, NOMBRE))
    setRang(0)
    setReponse(null)
    setBons(0)
  }

  if (fini)
    return (
      <PageRegles>
        <CarteR couleur={C.sauge} className="regles-apparait text-center">
          <p className="regles-titre text-[28px]" style={{ color: C.texte }}>Bien joué !</p>
          <p className="mt-1 text-[17px]" style={{ color: C.texte }}>{bons} bonne{bons > 1 ? 's' : ''} réponse{bons > 1 ? 's' : ''} sur {file.length}.</p>
          <p className="mt-2 text-[14.5px]" style={{ color: C.doux }}>Beaucoup d’idées reçues circulent : tu sais maintenant les démonter.</p>
          <BoutonR className="mx-auto mt-4" couleur={C.sauge} onClick={recommencer}>
            <RotateCcw size={18} /> Rejouer avec d’autres affirmations
          </BoutonR>
        </CarteR>
      </PageRegles>
    )

  return (
    <PageRegles>
      <Consigne couleur={C.sauge}>Lis l’affirmation, puis dis si elle est vraie ou fausse. Il n’y a pas de chrono.</Consigne>
      <p className="regles-mono text-[11px] uppercase" style={{ color: C.doux }}>Affirmation {rang + 1} sur {file.length}</p>
      <CarteR key={carte.id} className="regles-apparait" couleur="#E5C18A">
        <p className="regles-titre text-[22px] leading-snug" style={{ color: C.texte }}>« {carte.texte} »</p>
      </CarteR>
      <div className="grid grid-cols-2 gap-3">
        {[
          [true, 'Vrai', Check, C.ok, C.okClair],
          [false, 'Faux', X, C.non, C.nonClair],
        ].map(([v, nom, Icone, couleur, clair]) => {
          const choisi = reponse === v
          return (
            <button
              key={nom}
              type="button"
              disabled={reponse != null}
              onClick={() => repondre(v)}
              className="regles-titre flex min-h-[64px] items-center justify-center gap-2 rounded-2xl border-2 text-[22px] active:scale-95"
              style={{ borderColor: couleur, background: choisi ? couleur : clair, color: choisi ? '#fff' : couleur, opacity: reponse != null && !choisi ? 0.55 : 1 }}
            >
              <Icone size={24} strokeWidth={3} /> {nom}
            </button>
          )
        })}
      </div>
      {reponse != null && (
        <>
          <Retour ok={reponse === carte.vrai} titre={reponse === carte.vrai ? 'Bonne réponse !' : `Pas tout à fait : c’était ${carte.vrai ? 'vrai' : 'faux'}`}>
            {carte.expl}
          </Retour>
          <BoutonR onClick={() => { setRang((r) => r + 1); setReponse(null) }}>
            Suivante <ArrowRight size={18} />
          </BoutonR>
        </>
      )}
    </PageRegles>
  )
}
