import { useEffect, useMemo, useRef, useState } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import Anatomie from '../../../components/labo/regles/Anatomie.jsx'
import { BoutonR, C, CarteR, Consigne, PageRegles, Retour, melanger } from '../../../components/labo/regles/ui.jsx'
import { CYCLES, epaisseurEndometre, etapes, etatOvaire, jourOvulation, joursAvantReglesSuivantes, ovuleDuJour, phaseDuJour, reglesCeJour } from '../../../components/labo/regles/cycle.js'
import { ETAPES, ORDRE_ETAPES } from '../../../components/labo/regles/fiches.js'
import { ETAPES_TRAJET } from '../../../components/labo/regles/Anatomie.jsx'

// =============================================================
//  R2 · Cycle — suivre un cycle jour après jour.
//  Un curseur de jour pilote la roue du cycle ET le schéma
//  (endomètre, ovaire, ovule, règles). On peut changer la durée
//  du cycle (21, 28 ou 35 jours) : l'ovulation reste ~14 jours
//  avant les règles suivantes.
//  Modèle : components/labo/regles/cycle.js (testé).
// =============================================================

// Point sur un cercle (angle en degrés, 0 = en haut, sens horaire)
const pol = (cx, cy, r, deg) => {
  const a = ((deg - 90) * Math.PI) / 180
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
}
function arc(cx, cy, r1, r2, a1, a2) {
  const [x1, y1] = pol(cx, cy, r2, a1)
  const [x2, y2] = pol(cx, cy, r2, a2)
  const [x3, y3] = pol(cx, cy, r1, a2)
  const [x4, y4] = pol(cx, cy, r1, a1)
  const grand = a2 - a1 > 180 ? 1 : 0
  return `M${x1} ${y1} A${r2} ${r2} 0 ${grand} 1 ${x2} ${y2} L${x3} ${y3} A${r1} ${r1} 0 ${grand} 0 ${x4} ${y4} Z`
}

function Roue({ longueur, jour, onJour }) {
  const pas = 360 / longueur
  const liste = etapes(longueur)
  const [mx, my] = pol(110, 110, 81, (jour - 0.5) * pas)
  return (
    <svg viewBox="0 0 220 220" className="mx-auto w-full max-w-[300px]" role="img" aria-label={`Roue d’un cycle de ${longueur} jours, jour ${jour}`}>
      {liste.map((e) => (
        <path key={e.id} d={arc(110, 110, 62, 100, (e.debut - 1) * pas + 0.6, e.fin * pas - 0.6)} fill={ETAPES[e.id].couleur} />
      ))}
      {/* un petit trait par jour, cliquable */}
      {Array.from({ length: longueur }, (_, i) => {
        const [x1, y1] = pol(110, 110, 62, i * pas)
        const [x2, y2] = pol(110, 110, 100, i * pas)
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FFF8EC" strokeWidth={0.8} />
      })}
      {Array.from({ length: longueur }, (_, i) => (
        <path key={`z${i}`} d={arc(110, 110, 62, 104, i * pas, (i + 1) * pas)} fill="transparent" onClick={() => onJour(i + 1)} style={{ cursor: 'pointer' }} />
      ))}
      <circle cx={mx} cy={my} r={10} fill="#fff" stroke={C.texte} strokeWidth={3} pointerEvents="none" />
      <text x={110} y={104} textAnchor="middle" fontSize={11} fontWeight={800} fill={C.doux} style={{ letterSpacing: '.1em' }}>JOUR</text>
      <text x={110} y={136} textAnchor="middle" fontSize={34} fontWeight={700} fill={C.texte} style={{ fontFamily: 'Fredoka, Nunito, system-ui' }}>{jour}</text>
    </svg>
  )
}

const QUESTIONS_TOURS = 3
function Defi() {
  const [file, setFile] = useState(() => melanger(CYCLES).slice(0, QUESTIONS_TOURS))
  const [rang, setRang] = useState(0)
  const [reponse, setReponse] = useState(null)
  const [bons, setBons] = useState(0)
  const fini = rang >= file.length
  const longueur = file[rang]
  const bonne = longueur ? jourOvulation(longueur) : 0
  const choix = useMemo(() => {
    if (!longueur) return []
    const autres = [bonne + 7, bonne - 7, bonne + 3, longueur, 14, 10].filter((v, i, t) => v >= 2 && v <= longueur && v !== bonne && t.indexOf(v) === i)
    return melanger([bonne, ...melanger(autres).slice(0, 3)])
  }, [longueur, bonne])

  if (fini)
    return (
      <CarteR couleur={C.sauge} className="text-center">
        <p className="regles-titre text-[22px]" style={{ color: C.texte }}>
          {bons} sur {file.length} ! L’ovulation est environ 14 jours avant les prochaines règles.
        </p>
        <BoutonR className="mx-auto mt-3" couleur={C.sauge} onClick={() => { setFile(melanger(CYCLES).slice(0, QUESTIONS_TOURS)); setRang(0); setReponse(null); setBons(0) }}>
          <RotateCcw size={18} /> Rejouer
        </BoutonR>
      </CarteR>
    )

  function repondre(v) {
    if (reponse != null) return
    setReponse(v)
    if (v === bonne) setBons((b) => b + 1)
  }
  return (
    <CarteR>
      <p className="regles-mono text-[11px] uppercase" style={{ color: C.doux }}>Petit défi {rang + 1} sur {file.length}</p>
      <p className="regles-titre mt-1 text-[19px] leading-snug" style={{ color: C.texte }}>
        Un cycle dure {longueur} jours. À quel jour a lieu l’ovulation ?
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {choix.map((v) => {
          const choisi = reponse === v
          const juste = reponse != null && v === bonne
          return (
            <button
              key={v}
              type="button"
              disabled={reponse != null}
              onClick={() => repondre(v)}
              className="regles-titre min-h-[52px] rounded-2xl border-2 text-[18px] active:scale-95"
              style={{ borderColor: juste ? C.ok : choisi ? C.abricot : C.bord, background: juste ? C.okClair : choisi ? C.abricotClair : '#fff', color: C.texte }}
            >
              Jour {v}
            </button>
          )
        })}
      </div>
      {reponse != null && (
        <div className="mt-3 flex flex-col gap-2">
          <Retour ok={reponse === bonne} titre={reponse === bonne ? 'Exact !' : `C’était le jour ${bonne}`}>
            On compte 14 jours avant les règles suivantes : {longueur} − 14 = {bonne}. Mets le curseur sur le jour {bonne} pour le voir.
          </Retour>
          <BoutonR onClick={() => { setRang((r) => r + 1); setReponse(null) }}>Suivant</BoutonR>
        </div>
      )}
    </CarteR>
  )
}

export default function CycleView() {
  const [longueur, setLongueur] = useState(28)
  const [jour, setJour] = useState(1)
  const [lecture, setLecture] = useState(false)
  const minuteur = useRef(null)

  useEffect(() => {
    if (!lecture) return undefined
    minuteur.current = setInterval(() => setJour((j) => (j >= longueur ? 1 : j + 1)), 650)
    return () => clearInterval(minuteur.current)
  }, [lecture, longueur])

  function changerLongueur(l) {
    setLongueur(l)
    setJour((j) => Math.min(j, l))
  }

  const phase = phaseDuJour(jour, longueur)
  const info = ETAPES[phase]
  const ov = ovuleDuJour(jour, longueur)
  const o = jourOvulation(longueur)
  const restant = joursAvantReglesSuivantes(jour, longueur)

  return (
    <PageRegles tresLarge>
      <Consigne couleur={C.sauge}>
        Fais défiler les jours d’un cycle. Le jour 1, ce sont les premières règles. Regarde ce qui change dans l’ovaire et dans l’utérus.
      </Consigne>

      <div className="grid gap-4 md:grid-cols-2 tab:grid-cols-3">
        <div className="flex flex-col gap-3 md:row-span-2 md:self-start tab:row-span-1">
          <CarteR className="!p-2">
            <Anatomie
              className="mx-auto max-h-[38dvh] w-full md:max-h-[52dvh]"
              ep={epaisseurEndometre(jour, longueur)}
              regles={reglesCeJour(jour)}
              ovaire={etatOvaire(jour, longueur)}
              ovule={ov === 'ovaire' ? ETAPES_TRAJET.surface : ov === 'trompe' ? ETAPES_TRAJET.trompe : null}
              titre={`Schéma au jour ${jour} du cycle : ${info.nom}`}
            />
          </CarteR>
        </div>

        <CarteR className="md:self-start">
            <Roue longueur={longueur} jour={jour} onJour={setJour} />
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                aria-label={lecture ? 'Mettre en pause' : 'Lancer les jours'}
                onClick={() => setLecture((l) => !l)}
                className="flex h-12 w-12 flex-none items-center justify-center rounded-full text-white active:scale-95"
                style={{ background: C.rose }}
              >
                {lecture ? <Pause size={22} /> : <Play size={22} />}
              </button>
              <input
                type="range"
                min={1}
                max={longueur}
                value={jour}
                onChange={(e) => { setLecture(false); setJour(+e.target.value) }}
                aria-label={`Jour du cycle, de 1 à ${longueur}`}
                className="regles-curseur"
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2" role="group" aria-label="Durée du cycle">
              <span className="whitespace-nowrap text-[13px] font-bold" style={{ color: C.doux }}>Un cycle de</span>
              {CYCLES.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => changerLongueur(l)}
                  aria-pressed={longueur === l}
                  className="regles-titre min-h-[40px] whitespace-nowrap rounded-full border-2 px-3 text-[15px]"
                  style={longueur === l ? { background: C.texte, borderColor: C.texte, color: '#fff' } : { background: '#fff', borderColor: C.bord, color: C.texte }}
                >
                  {l} jours
                </button>
              ))}
            </div>
        </CarteR>

        <CarteR key={`${phase}-${longueur}`} className="regles-apparait md:self-start" couleur={info.couleur} fond={info.fond}>
            <p className="regles-mono text-[11px] uppercase" style={{ color: info.texte }}>Jour {jour} · le nom des spécialistes : {info.savant}</p>
            <h2 className="regles-titre text-[24px] leading-tight" style={{ color: C.texte }}>{info.nom}</h2>
            <p className="mt-1 text-[15px] font-bold leading-snug" style={{ color: info.texte }}>{info.resume}</p>
            <p className="mt-2 text-[14.5px] leading-relaxed" style={{ color: C.texte }}>{info.detail}</p>
            <p className="mt-3 text-[13.5px]" style={{ color: C.doux }}>
              {restant === 1 ? 'Dernier jour : les règles suivantes commencent demain.' : `Prochaines règles dans ${restant} jours.`} L’ovulation est vers le jour {o}.
            </p>
        </CarteR>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Aller à une étape">
        {ORDRE_ETAPES.map((id) => {
          const e = etapes(longueur).find((x) => x.id === id)
          return (
            <button
              key={id}
              type="button"
              onClick={() => { setLecture(false); setJour(e.debut) }}
              className="regles-titre flex min-h-[44px] items-center gap-2 rounded-full border-2 px-4 text-[14px] active:scale-95"
              style={{ borderColor: ETAPES[id].couleur, background: phase === id ? ETAPES[id].fond : '#fff', color: C.texte }}
            >
              <span className="h-3 w-3 rounded-full" style={{ background: ETAPES[id].couleur }} />
              {ETAPES[id].nom}
              <span className="text-[12px]" style={{ color: C.doux }}>
                {e.debut === e.fin ? `jour ${e.debut}` : `jours ${e.debut}-${e.fin}`}
              </span>
            </button>
          )
        })}
      </div>

      <Defi />
    </PageRegles>
  )
}
