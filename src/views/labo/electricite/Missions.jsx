import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Check, Lightbulb, RotateCcw, Trophy } from 'lucide-react'
import Banc, { HAUTEUR, useBanc } from '../../../components/labo/electricite/Banc.jsx'
import { Bouton, Carte, Eclat } from '../../../components/labo/CadreJeu.jsx'
import { Outils, PageElec } from './commun.jsx'

// =============================================================
//  Moteur commun des activités « à missions » (E3, E5, E6) :
//  une suite de défis sur l'établi, vérifiés par le vrai calcul
//  du circuit, avec indices, explication et (option) question
//  de diagnostic à la fin.
//
//  mission = {
//    titre, consigne, composants, fils?, hauteur?, fond?,
//    test: (composants, fils, resultat) => bool,
//    indices: [..], explication,
//    question?: { texte, choix: [..], bonne: index },
//    cablage? (défaut true), deplacer? (défaut true)
//  }
//  Barre d'outils (photo/schéma, son, Recommencer) en haut du
//  panneau, sur une seule ligne. Tablette en paysage : établi à
//  gauche (toute la hauteur), mission à droite, sans défilement.
// =============================================================
export default function Missions({ code, titre, attendus, couleur, missions, intro, conclusion }) {
  const [n, setN] = useState(0)
  const m = missions[n]
  const banc = useBanc({ composants: m.composants, fils: m.fils ?? [] })
  const [vue, setVue] = useState('photo')
  const [son, setSon] = useState(true)
  const [indices, setIndices] = useState(0)
  const [reussi, setReussi] = useState(false)
  const [reponse, setReponse] = useState(null)
  const [eclat, setEclat] = useState({ message: '', cle: 0 })
  const [fini, setFini] = useState(false)
  const [sansIndice, setSansIndice] = useState(0)

  const ok = useMemo(() => m.test(banc.composants, banc.fils, banc.resultat), [m, banc.composants, banc.fils, banc.resultat])

  useEffect(() => {
    if (ok && !reussi) {
      setReussi(true)
      if (indices === 0) setSansIndice((x) => x + 1)
      setEclat((e) => ({ message: 'Mission réussie !', cle: e.cle + 1 }))
    }
  }, [ok, reussi, indices])

  function aller(i) {
    const mi = missions[i]
    setN(i)
    banc.charger(mi.composants, mi.fils ?? [])
    setIndices(0)
    setReussi(false)
    setReponse(null)
  }

  const peutContinuer = reussi && (!m.question || reponse === m.question.bonne)

  if (fini) {
    return (
      <PageElec code={code} titre={titre} attendus={attendus} couleur={couleur}>
        <Carte couleur={`${couleur}88`} className="text-center">
          <Trophy className="mx-auto" size={44} style={{ color: couleur }} />
          <p className="labo-titre mt-2 text-2xl font-black text-white">Toutes les missions sont réussies !</p>
          <p className="mt-1 text-[15px] text-[#B9C1E3]">
            {sansIndice}/{missions.length} sans aucun indice.
          </p>
          {conclusion && <p className="mt-3 text-left text-[14px] leading-relaxed text-[#DDE2F7]">{conclusion}</p>}
          <Bouton
            className="mx-auto mt-4"
            couleur={couleur}
            onClick={() => {
              setFini(false)
              setSansIndice(0)
              aller(0)
            }}
          >
            <RotateCcw size={18} /> Recommencer
          </Bouton>
        </Carte>
      </PageElec>
    )
  }

  return (
    <PageElec code={code} titre={titre} attendus={attendus} couleur={couleur} large resultat={banc.resultat}>
      <Eclat message={eclat.message} cle={eclat.cle} couleur={couleur} />
      {n === 0 && intro && <p className="text-[14px] leading-snug text-[#B9C1E3]">{intro}</p>}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_360px] tab:min-h-0 tab:flex-1 tab:grid-cols-[auto_minmax(340px,1fr)]">
        <div className="order-2 flex min-w-0 justify-center md:order-1 tab:h-full tab:min-h-0">
          <Banc
            banc={banc}
            vue={vue}
            editable={m.deplacer !== false}
            cablage={m.cablage !== false}
            retirer={false}
            silence={!son}
            fond={m.fond?.(vue)}
            hauteur={m.hauteur ?? HAUTEUR}
            className="mx-auto w-full max-w-[540px] tab:h-[calc(100dvh-93px)] tab:w-auto tab:max-w-full"
          />
        </div>
        <div className="order-1 flex min-w-0 flex-col gap-3 md:order-2 tab:min-h-0 tab:overflow-y-auto">
          <Outils vue={vue} setVue={setVue} son={son} setSon={setSon} onRecommencer={() => aller(n)} />
          <div className="flex flex-none gap-1.5">
            {missions.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Mission ${i + 1}`}
                onClick={() => aller(i)}
                className="h-3 flex-1 rounded-full"
                style={{ background: i < n ? couleur : i === n ? `${couleur}99` : 'rgba(255,255,255,.12)' }}
              />
            ))}
          </div>
          <Carte couleur={reussi ? '#9DFF8A88' : `${couleur}66`}>
            <p className="labo-mono text-[11px]" style={{ color: couleur }}>
              MISSION {n + 1}/{missions.length}
            </p>
            <p className="labo-titre mt-0.5 text-lg font-bold leading-tight text-white">{m.titre}</p>
            <p className="mt-1 text-[14px] leading-snug text-[#DDE2F7]">{m.consigne}</p>
            {!reussi && (
              <>
                {m.indices.slice(0, indices).map((t, i) => (
                  <p key={i} className="mt-2 rounded-xl bg-white/5 px-2.5 py-1.5 text-[13px] leading-snug text-[#FFE9A8]">
                    <Lightbulb size={13} className="mr-1 inline" />
                    {t}
                  </p>
                ))}
                {indices < m.indices.length && (
                  <button type="button" onClick={() => setIndices(indices + 1)} className="mt-2 flex items-center gap-1 text-[13px] font-bold" style={{ color: couleur }}>
                    <Lightbulb size={14} /> Un indice ({indices + 1}/{m.indices.length})
                  </button>
                )}
              </>
            )}
            {reussi && (
              <div className="mt-2 rounded-xl bg-[#9DFF8A]/10 px-2.5 py-2">
                <p className="flex items-center gap-1 text-[13px] font-bold text-[#9DFF8A]">
                  <Check size={15} /> Réussi !
                </p>
                <p className="mt-1 text-[13px] leading-snug text-[#DDE2F7]">{m.explication}</p>
              </div>
            )}
            {reussi && m.question && (
              <div className="mt-3">
                <p className="text-[14px] font-bold text-white">{m.question.texte}</p>
                <div className="mt-2 grid gap-1.5">
                  {m.question.choix.map((c, i) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setReponse(i)}
                      className="min-h-[44px] rounded-xl border px-3 py-2 text-left text-[14px] text-[#E8ECFF]"
                      style={{
                        borderColor: reponse === i ? (i === m.question.bonne ? '#9DFF8A' : '#FF8A95') : 'rgba(255,255,255,.15)',
                        background: reponse === i ? (i === m.question.bonne ? 'rgba(157,255,138,.12)' : 'rgba(255,138,149,.12)') : 'rgba(7,11,22,.5)',
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {peutContinuer && (
              <Bouton className="mt-3 w-full" couleur={couleur} onClick={() => (n + 1 < missions.length ? aller(n + 1) : setFini(true))}>
                {n + 1 < missions.length ? 'Mission suivante' : 'Terminer'} <ArrowRight size={18} />
              </Bouton>
            )}
          </Carte>
        </div>
      </div>
    </PageElec>
  )
}
