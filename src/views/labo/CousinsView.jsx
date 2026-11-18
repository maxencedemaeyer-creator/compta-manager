import { useMemo, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import CadreJeu, { Bouton, Carte, Eclat, melanger, Duo } from '../../components/labo/CadreJeu.jsx'
import Membres3D, { ANIMAUX, GROUPES } from '../../components/labo/Membres3D.jsx'

// =============================================================
//  A9 · Les cousins cachés (vrais os 3D)
//  Le bras humain, l'aile de chauve-souris, la nageoire de baleine
//  et l'aile d'oiseau ont les mêmes os, dans le même ordre.
//  Explorer : touche un os, il s'allume chez les 4 animaux.
//  Défi : retrouve l'os demandé chez l'animal demandé.
//  Attendu 112.
// =============================================================
const NOM_ANIMAL = Object.fromEntries(ANIMAUX.map((a) => [a.id, a.nom]))
const DEFIS = () =>
  melanger(ANIMAUX.flatMap((a) => ['humerus', 'radius', 'cubitus', 'doigts'].map((os) => ({ animal: a.id, os })))).slice(0, 6)

export default function CousinsView() {
  const [mode, setMode] = useState('explorer')
  const [actif, setActif] = useState(null)
  const [partie, setPartie] = useState(0)
  const defis = useMemo(DEFIS, [partie])
  const [etape, setEtape] = useState(0)
  const [score, setScore] = useState(0)
  const [retour, setRetour] = useState(null)
  const [eclat, setEclat] = useState({ message: '', cle: 0 })
  const defi = defis[etape]

  function toucher(animal, groupe) {
    if (mode === 'explorer') {
      setActif(groupe)
      return
    }
    if (!defi || retour) return
    const bon = animal === defi.animal && groupe === defi.os
    setRetour({ bon, animal, groupe })
    if (bon) setScore((s) => s + 1)
    setTimeout(() => {
      setRetour(null)
      const suivant = etape + 1
      setEtape(suivant)
      if (suivant >= defis.length) setEclat((x) => ({ message: 'Tu vois les cousins !', cle: x.cle + 1 }))
    }, 1100)
  }

  const etats = {}
  if (mode === 'explorer' && actif) {
    for (const g of Object.keys(GROUPES)) etats[g] = g === actif ? 'actif' : 'attenue'
  }
  if (mode === 'defi' && retour) etats[`${retour.animal}_${retour.groupe}`] = retour.bon ? 'ok' : 'erreur'

  return (
    <CadreJeu code="A9" titre="Les cousins cachés" attendus={[112]} couleur="#9DE7C2" ecran large>
      <Eclat message={eclat.message} cle={eclat.cle} couleur="#9DE7C2" />
      <Duo
        commandes={
          <>
      <div className="grid grid-cols-2 gap-2">
        {['explorer', 'defi'].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setEtape(0); setScore(0); setActif(null); setPartie((p) => p + 1) }}
            className={`h-11 rounded-2xl text-sm font-bold ${mode === m ? 'bg-[#9DE7C2] text-[#05261A]' : 'border border-white/15 bg-[#121A30]/85'}`}
          >
            {m === 'explorer' ? 'Explorer' : 'Défi'}
          </button>
        ))}
      </div>

      <Carte couleur="rgba(157,231,194,.45)">
        {mode === 'explorer' ? (
          <p className="text-[15px] text-[#E8ECFF]">
            {actif ? (
              <>
                <span className="font-bold" style={{ color: GROUPES[actif].couleur }}>
                  {GROUPES[actif].nom}
                </span>{' '}
                : il est là chez les quatre animaux ! Plus long, plus court, plus épais… mais toujours à la même place. On dit que ces os sont homologues.
              </>
            ) : (
              'Bras, aile, nageoire : quatre membres très différents. Touche un os : il s’allume chez les quatre animaux en même temps.'
            )}
          </p>
        ) : defi ? (
          <>
            <p className="labo-mono text-[11px] text-[#9DE7C2]">
              DÉFI {etape + 1} / {defis.length} · SCORE {score}
            </p>
            <p className="labo-titre mt-1 text-xl font-bold text-white">
              Touche {defi.os === 'doigts' ? 'les os des doigts' : `le ${GROUPES[defi.os].nom.toLowerCase()}`} : {NOM_ANIMAL[defi.animal].toLowerCase()}
            </p>
            {retour && <p className={`mt-1 font-bold ${retour.bon ? 'text-[#9DFF8A]' : 'text-[#FF8A95]'}`}>{retour.bon ? 'Exact !' : 'Raté…'}</p>}
          </>
        ) : (
          <div className="flex items-center justify-between">
            <p className="labo-titre text-lg font-bold text-[#9DE7C2]">
              {score} / {defis.length}
            </p>
            <Bouton couleur="#9DE7C2" onClick={() => { setEtape(0); setScore(0); setPartie((p) => p + 1) }}>
              <RotateCcw size={16} /> Rejouer
            </Bouton>
          </div>
        )}
      </Carte>

      {mode === 'explorer' && (
        <div className="flex flex-wrap justify-center gap-2">
          {Object.entries(GROUPES).map(([id, g]) => (
            <button key={id} type="button" onClick={() => setActif(id)} className="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs text-[#DDE2F7]">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: g.couleur }} /> {g.nom}
            </button>
          ))}
        </div>
      )}
      <p className="text-center text-xs text-[#8A93B8]">
        Vrais os humains en 3D, mis aux proportions de chaque animal. Pas à la même échelle : l’aile d’une chauve-souris tient dans ta main, la nageoire d’une baleine mesure plusieurs mètres.
      </p>
          </>
        }
      >
      <div className="rounded-3xl border border-white/10 bg-[#070B16]/75 tab:min-h-0 tab:flex-1">
        <Membres3D className="h-[64vh] max-h-[640px] w-full tab:h-full tab:max-h-none" etats={etats} couleurs={mode === 'explorer'} onChoisir={toucher} />
      </div>

      </Duo>
    </CadreJeu>
  )
}
