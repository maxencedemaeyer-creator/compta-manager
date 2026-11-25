import { useState } from 'react'
import { Check, Eye, RotateCcw, Tags } from 'lucide-react'
import Anatomie from '../../../components/labo/regles/Anatomie.jsx'
import { BoutonR, C, CarteR, Consigne, Onglets, PageRegles, Retour, melanger } from '../../../components/labo/regles/ui.jsx'
import { ORDRE_PARTIES, PARTIES } from '../../../components/labo/regles/fiches.js'

// =============================================================
//  R1 · Dedans — découvrir l'intérieur du corps.
//  Deux modes :
//   - Explorer : on touche une partie du schéma (ou son nom) → sa fiche.
//   - Étiquettes : on nous dit un nom, on touche la bonne partie.
//  Schéma dessiné (pas de photo), vue de face en coupe.
// =============================================================
export default function DedansView() {
  const [mode, setMode] = useState('explorer')
  return (
    <PageRegles large>
      <Onglets
        valeur={mode}
        onChange={setMode}
        options={[
          ['explorer', Eye, 'Explorer'],
          ['etiquettes', Tags, 'Étiquettes'],
        ]}
      />
      {mode === 'explorer' ? <Explorer /> : <Etiquettes />}
    </PageRegles>
  )
}

function Explorer() {
  const [choix, setChoix] = useState(null)
  const fiche = choix && PARTIES[choix]
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <CarteR className="flex items-center justify-center !p-2">
        <Anatomie className="mx-auto max-h-[62dvh] w-full" ep={0.65} ovaire={{ etat: 'follicule', p: 0.6 }} surbrillance={choix ? [choix] : []} onPart={setChoix} />
      </CarteR>
      <div className="flex flex-col gap-3">
        <Consigne>Touche une partie du dessin, ou un nom, pour la découvrir. C’est une vue de face, « coupée en deux », comme dans un livre de sciences.</Consigne>
        <div className="flex flex-wrap gap-2">
          {ORDRE_PARTIES.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setChoix(id)}
              aria-pressed={choix === id}
              className="regles-titre min-h-[44px] rounded-full border-2 px-4 text-[15px] active:scale-95"
              style={choix === id ? { background: C.sauge, borderColor: C.sauge, color: '#fff' } : { background: '#fff', borderColor: C.bord, color: C.texte }}
            >
              {PARTIES[id].nom}
            </button>
          ))}
        </div>
        {fiche ? (
          <CarteR key={choix} className="regles-apparait" couleur={C.sauge}>
            <p className="regles-mono text-[11px] uppercase" style={{ color: C.sauge }}>{fiche.taille}</p>
            <h2 className="regles-titre text-[26px] leading-tight" style={{ color: C.texte }}>{fiche.nom}</h2>
            <p className="mt-2 text-[15px] leading-relaxed" style={{ color: C.texte }}>{fiche.texte}</p>
            <p className="mt-3 rounded-2xl px-3 py-2 text-[15px] font-bold leading-snug" style={{ background: C.saugeClair, color: C.sauge }}>
              À retenir : {fiche.retiens}
            </p>
          </CarteR>
        ) : (
          <CarteR className="text-center">
            <p className="text-[15px]" style={{ color: C.doux }}>Aucune partie choisie pour l’instant.</p>
          </CarteR>
        )}
      </div>
    </div>
  )
}

const TOURS = 6

function Etiquettes() {
  const [file, setFile] = useState(() => melanger(ORDRE_PARTIES).slice(0, TOURS))
  const [rang, setRang] = useState(0)
  const [essais, setEssais] = useState(0)
  const [bons, setBons] = useState(0)
  const [retour, setRetour] = useState(null) // { ok, texte }
  const [aide, setAide] = useState(null)
  const fini = rang >= file.length
  const cible = file[rang]

  function toucher(id) {
    if (fini || retour?.ok) return
    if (id === cible) {
      if (essais === 0) setBons((b) => b + 1)
      setRetour({ ok: true, texte: PARTIES[cible].retiens })
      setAide(null)
    } else {
      setEssais((e) => e + 1)
      setRetour({ ok: false, texte: `Tu as touché : ${PARTIES[id].nom}. Ce n’est pas la bonne partie, essaie encore !` })
      if (essais >= 1) setAide(cible)
    }
  }
  function suivante() {
    setRang((r) => r + 1)
    setEssais(0)
    setRetour(null)
    setAide(null)
  }
  function recommencer() {
    setFile(melanger(ORDRE_PARTIES).slice(0, TOURS))
    setRang(0)
    setEssais(0)
    setBons(0)
    setRetour(null)
    setAide(null)
  }

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <CarteR className="flex items-center justify-center !p-2">
        <Anatomie className="mx-auto max-h-[62dvh] w-full" ep={0.65} ovaire={{ etat: 'follicule', p: 0.6 }} surbrillance={retour?.ok ? [cible] : aide ? [aide] : []} onPart={fini ? undefined : toucher} />
      </CarteR>
      <div className="flex flex-col gap-3">
        {fini ? (
          <CarteR couleur={C.sauge} className="text-center">
            <p className="regles-titre text-[26px]" style={{ color: C.texte }}>Bravo !</p>
            <p className="mt-1 text-[16px]" style={{ color: C.texte }}>
              {bons} bonne{bons > 1 ? 's' : ''} réponse{bons > 1 ? 's' : ''} du premier coup sur {file.length}.
            </p>
            <p className="mt-1 text-[14px]" style={{ color: C.doux }}>Ce n’est pas grave de se tromper : c’est comme ça qu’on apprend.</p>
            <BoutonR className="mx-auto mt-3" couleur={C.sauge} onClick={recommencer}>
              <RotateCcw size={18} /> Rejouer
            </BoutonR>
          </CarteR>
        ) : (
          <>
            <p className="regles-mono text-[11px] uppercase" style={{ color: C.doux }}>Question {rang + 1} sur {file.length}</p>
            <Consigne couleur={C.sauge}>
              <span className="regles-titre text-[22px]">{PARTIES[cible].phrase}</span>
              <span className="mt-1 block text-[14px]" style={{ color: C.doux }}>Touche-la sur le dessin.</span>
            </Consigne>
            {retour && (
              <Retour ok={retour.ok} titre={retour.ok ? 'Oui, bien vu !' : 'Pas tout à fait'}>
                {retour.texte}
              </Retour>
            )}
            {retour?.ok && (
              <BoutonR couleur={C.sauge} onClick={suivante}>
                <Check size={18} /> Suivant
              </BoutonR>
            )}
          </>
        )}
      </div>
    </div>
  )
}
