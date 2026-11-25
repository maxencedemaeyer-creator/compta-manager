import { useState } from 'react'
import { Check, CircleHelp, Package, RotateCcw } from 'lucide-react'
import IconeProtection from '../../../components/labo/regles/Protections.jsx'
import { BoutonR, C, CarteR, Consigne, Onglets, PageRegles, Retour, melanger } from '../../../components/labo/regles/ui.jsx'
import { ORDRE_PROTECTIONS, PROTECTIONS } from '../../../components/labo/regles/fiches.js'

// =============================================================
//  R5 · Protections — les différents produits menstruels.
//  Deux modes :
//   - Découvrir : une fiche par protection (comment ça marche,
//     combien de temps, les « plus », les choses à savoir).
//   - Qui suis-je ? : une devinette, on touche le bon dessin.
//  Aucune n'est « la meilleure » : chacun·e choisit ce qui lui convient.
// =============================================================
export default function ProtectionsView() {
  const [mode, setMode] = useState('decouvrir')
  return (
    <PageRegles large>
      <Onglets
        valeur={mode}
        onChange={setMode}
        couleur={C.lilas}
        options={[
          ['decouvrir', Package, 'Découvrir'],
          ['qui', CircleHelp, 'Qui suis-je ?'],
        ]}
      />
      {mode === 'decouvrir' ? <Decouvrir /> : <QuiSuisJe />}
    </PageRegles>
  )
}

function Decouvrir() {
  const [choix, setChoix] = useState('serviette')
  const p = PROTECTIONS[choix]
  return (
    <>
      <Consigne couleur={C.lilas}>
        Une protection menstruelle recueille ou absorbe le sang des règles, pour qu’il ne tache pas les vêtements. Il n’y en a pas une meilleure que les autres : chacun·e choisit ce qui lui est confortable, et peut changer d’avis.
      </Consigne>
      <div className="grid grid-cols-5 gap-2" role="group" aria-label="Choisir une protection">
        {ORDRE_PROTECTIONS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setChoix(id)}
            aria-pressed={choix === id}
            className="flex min-h-[44px] flex-col items-center gap-1 rounded-2xl border-2 px-1 pb-2 pt-1.5 active:scale-95"
            style={choix === id ? { borderColor: C.lilas, background: C.lilasClair } : { borderColor: C.bord, background: '#fff' }}
          >
            <IconeProtection id={id} className="h-14 w-14 sm:h-20 sm:w-20" titre="" />
            <span className="regles-titre text-center text-[12px] leading-tight sm:text-[14px]" style={{ color: C.texte }}>{PROTECTIONS[id].nom}</span>
          </button>
        ))}
      </div>
      <CarteR key={choix} className="regles-apparait" couleur={C.lilas}>
        <div className="flex items-start gap-4">
          <IconeProtection id={choix} className="h-24 w-24 flex-none rounded-2xl" titre={p.nom} />
          <div className="min-w-0">
            <h2 className="regles-titre text-[24px] leading-tight" style={{ color: C.texte }}>{p.nom}</h2>
            <p className="text-[14px] font-bold" style={{ color: C.lilas }}>{p.court}</p>
            <span className="mt-1 inline-block rounded-full px-2.5 py-0.5 text-[12px] font-bold" style={p.jetable ? { background: C.abricotClair, color: C.abricot } : { background: C.saugeClair, color: C.sauge }}>
              {p.jetable ? 'Jetable' : 'Réutilisable'}
            </span>
          </div>
        </div>
        <p className="mt-3 text-[15px] leading-relaxed" style={{ color: C.texte }}>{p.comment}</p>
        <p className="mt-3 rounded-2xl px-3 py-2 text-[14.5px] font-bold leading-snug" style={{ background: C.lilasClair, color: C.lilas }}>
          Combien de temps ? {p.duree}.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="regles-mono text-[11px] uppercase" style={{ color: C.sauge }}>Les plus</p>
            <ul className="mt-1 space-y-1 text-[14.5px]" style={{ color: C.texte }}>
              {p.plus.map((t) => (
                <li key={t} className="flex gap-2"><Check size={16} className="mt-1 flex-none" style={{ color: C.sauge }} /> {t}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="regles-mono text-[11px] uppercase" style={{ color: C.abricot }}>À savoir</p>
            <ul className="mt-1 space-y-1 text-[14.5px]" style={{ color: C.texte }}>
              {p.savoir.map((t) => (
                <li key={t} className="flex gap-2"><span className="mt-[7px] h-2 w-2 flex-none rounded-full" style={{ background: C.abricot }} /> {t}</li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-3 text-[12.5px]" style={{ color: C.doux }}>Pour chaque produit, on lit la notice dans la boîte et on demande à un adulte de confiance si on hésite.</p>
      </CarteR>
    </>
  )
}

function QuiSuisJe() {
  const [file, setFile] = useState(() => melanger(ORDRE_PROTECTIONS))
  const [rang, setRang] = useState(0)
  const [reponse, setReponse] = useState(null)
  const [bons, setBons] = useState(0)
  const fini = rang >= file.length

  if (fini)
    return (
      <CarteR couleur={C.lilas} className="text-center">
        <p className="regles-titre text-[26px]" style={{ color: C.texte }}>Bravo !</p>
        <p className="mt-1 text-[16px]" style={{ color: C.texte }}>{bons} bonne{bons > 1 ? 's' : ''} réponse{bons > 1 ? 's' : ''} du premier coup sur {file.length}.</p>
        <BoutonR className="mx-auto mt-3" couleur={C.lilas} onClick={() => { setFile(melanger(ORDRE_PROTECTIONS)); setRang(0); setReponse(null); setBons(0) }}>
          <RotateCcw size={18} /> Rejouer
        </BoutonR>
      </CarteR>
    )

  const cible = file[rang]
  const juste = reponse === cible
  function repondre(id) {
    if (juste) return
    setReponse(id)
    if (id === cible && reponse == null) setBons((b) => b + 1)
  }
  return (
    <>
      <p className="regles-mono text-[11px] uppercase" style={{ color: C.doux }}>Devinette {rang + 1} sur {file.length}</p>
      <Consigne couleur={C.lilas}>
        <span className="regles-titre text-[20px] leading-snug">« {PROTECTIONS[cible].qui} »</span>
        <span className="mt-1 block text-[14px]" style={{ color: C.doux }}>Qui suis-je ? Touche le bon dessin.</span>
      </Consigne>
      <div className="grid grid-cols-5 gap-2">
        {ORDRE_PROTECTIONS.map((id) => {
          const bon = juste && id === cible
          const rate = reponse === id && id !== cible
          return (
            <button
              key={id}
              type="button"
              onClick={() => repondre(id)}
              className="flex min-h-[44px] flex-col items-center gap-1 rounded-2xl border-2 px-1 pb-2 pt-1.5 active:scale-95"
              style={{ borderColor: bon ? C.ok : rate ? C.abricot : C.bord, background: bon ? C.okClair : rate ? C.abricotClair : '#fff' }}
            >
              <IconeProtection id={id} className="h-14 w-14 sm:h-20 sm:w-20" titre="" />
              <span className="regles-titre text-center text-[12px] leading-tight sm:text-[14px]" style={{ color: C.texte }}>{PROTECTIONS[id].nom}</span>
            </button>
          )
        })}
      </div>
      {reponse != null && !juste && <Retour ok={false} titre="Pas tout à fait">Tu as touché : {PROTECTIONS[reponse].nom}. Relis la devinette et essaie encore !</Retour>}
      {juste && (
        <>
          <Retour ok titre={`Oui : ${PROTECTIONS[cible].nom} !`}>{PROTECTIONS[cible].comment}</Retour>
          <BoutonR couleur={C.lilas} onClick={() => { setRang((r) => r + 1); setReponse(null) }}>Suivant</BoutonR>
        </>
      )}
    </>
  )
}
