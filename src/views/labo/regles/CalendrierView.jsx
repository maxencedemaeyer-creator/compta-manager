import { useMemo, useState } from 'react'
import { ArrowRight, RotateCcw } from 'lucide-react'
import Visage from '../../../components/labo/regles/Visage.jsx'
import { BoutonR, C, CarteR, Consigne, PageRegles, Retour } from '../../../components/labo/regles/ui.jsx'
import { DUREE_REGLES, prevision } from '../../../components/labo/regles/cycle.js'

// =============================================================
//  R4 · Calendrier — prévoir les prochaines règles.
//  Des personnages FICTIFS, des dates inventées (année 2027).
//  On regarde les règles passées, on calcule la moyenne des
//  cycles, puis on touche le jour des prochaines règles.
//  Pour les cycles irréguliers (début de la vie de règles) on ne
//  peut prévoir qu'une fourchette : la tolérance est plus large.
// =============================================================
const PERSONNES = [
  { id: 'ines', nom: 'Inès', texte: 'Cycles réguliers.', starts: [3, 31, 59, 87], tol: 1 },
  { id: 'lou', nom: 'Lou', texte: 'Cycles un peu courts.', starts: [5, 29, 53, 78], tol: 1 },
  { id: 'sami', nom: 'Sami', texte: 'Cycles un peu longs.', starts: [2, 35, 67, 101], tol: 1 },
  { id: 'noa', nom: 'Noa', texte: 'Les premières règles datent de 6 mois : cycles irréguliers.', starts: [4, 41, 66, 108], tol: 7, irregulier: true },
]
const date = (n) => new Date(2027, 0, n)
const MOIS = (n) => date(n).toLocaleDateString('fr-BE', { month: 'long', year: 'numeric' })
const JOURS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

function Mois({ debut, starts, choix, bon, onChoix, bloque }) {
  const d1 = date(debut)
  const premier = new Date(d1.getFullYear(), d1.getMonth(), 1)
  const nbJours = new Date(d1.getFullYear(), d1.getMonth() + 1, 0).getDate()
  const base = Math.round((premier - date(0)) / 86400000) // numéro du jour « 1er du mois »
  const decal = (premier.getDay() + 6) % 7
  const estRegles = (n) => starts.some((s) => n >= s && n < s + DUREE_REGLES)
  const cases = [...Array(decal).fill(null), ...Array.from({ length: nbJours }, (_, i) => base + i)]
  return (
    <div>
      <p className="regles-titre mb-1 text-[16px] capitalize" style={{ color: C.texte }}>{MOIS(base)}</p>
      <div className="grid grid-cols-7 gap-1">
        {JOURS.map((j, i) => (
          <span key={i} className="text-center text-[11px] font-bold" style={{ color: C.doux }}>{j}</span>
        ))}
        {cases.map((n, i) => {
          if (n == null) return <span key={i} />
          const regles = estRegles(n)
          const pris = choix === n
          const juste = bon === n
          const peutChoisir = !bloque && !regles && n > starts.at(-1) + DUREE_REGLES
          return (
            <button
              key={i}
              type="button"
              disabled={!peutChoisir}
              onClick={() => onChoix(n)}
              aria-label={`${date(n).toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' })}${regles ? ', règles' : ''}`}
              className="flex h-9 items-center justify-center rounded-lg text-[13px] font-bold"
              style={{
                background: regles ? '#D9647C' : juste ? C.okClair : pris ? C.abricotClair : '#fff',
                color: regles ? '#fff' : C.texte,
                border: `2px solid ${juste ? C.ok : pris ? C.abricot : regles ? '#D9647C' : '#F1E6D6'}`,
                opacity: !peutChoisir && !regles && !juste ? 0.55 : 1,
              }}
            >
              {date(n).getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function CalendrierView() {
  const [rang, setRang] = useState(0)
  const [choix, setChoix] = useState(null)
  const [valide, setValide] = useState(false)
  const p = PERSONNES[Math.min(rang, PERSONNES.length - 1)]
  const prev = useMemo(() => prevision(p.starts), [p])
  const fin = rang >= PERSONNES.length

  const mois = useMemo(() => {
    const premier = date(p.starts[1])
    const dernier = date(prev.prochain + p.tol + 2)
    const liste = []
    for (let m = new Date(premier.getFullYear(), premier.getMonth(), 1); m <= dernier; m = new Date(m.getFullYear(), m.getMonth() + 1, 1)) {
      liste.push(Math.round((m - date(0)) / 86400000))
    }
    return liste
  }, [p, prev])

  const juste = choix != null && Math.abs(choix - prev.prochain) <= p.tol
  const min = p.starts.at(-1) + Math.min(...prev.durees)
  const max = p.starts.at(-1) + Math.max(...prev.durees)
  const fmt = (n) => date(n).toLocaleDateString('fr-BE', { day: 'numeric', month: 'long' })

  function suite() {
    setRang((r) => r + 1)
    setChoix(null)
    setValide(false)
  }

  if (fin)
    return (
      <PageRegles>
        <CarteR couleur={C.sauge} className="regles-apparait text-center">
          <p className="regles-titre text-[26px]" style={{ color: C.texte }}>Tu sais prévoir !</p>
          <p className="mt-2 text-[15.5px] leading-relaxed" style={{ color: C.texte }}>
            On calcule la moyenne des cycles passés pour estimer les prochaines règles. C’est une estimation : un cycle peut varier de quelques jours, et au début c’est encore plus irrégulier.
          </p>
          <BoutonR className="mx-auto mt-4" couleur={C.sauge} onClick={() => setRang(0)}><RotateCcw size={18} /> Recommencer</BoutonR>
        </CarteR>
      </PageRegles>
    )

  return (
    <PageRegles large>
      <Consigne couleur="#3C6E96">
        Les cases roses sont les règles passées de {p.nom}. Calcule la durée moyenne des cycles, puis touche le jour où {p.nom} aura ses prochaines règles. (Personnage inventé, dates inventées.)
      </Consigne>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="flex flex-col gap-3">
          <CarteR>
            <div className="flex items-center gap-3">
              <Visage id={p.id === 'ines' ? 'ines' : p.id} humeur="neutre" className="h-16 w-16 flex-none rounded-full" titre="" />
              <div>
                <p className="regles-titre text-[22px]" style={{ color: C.texte }}>{p.nom}</p>
                <p className="text-[14px]" style={{ color: C.doux }}>{p.texte}</p>
              </div>
            </div>
            <p className="regles-mono mt-3 text-[11px] uppercase" style={{ color: C.doux }}>Ses derniers cycles</p>
            <ul className="mt-1 flex flex-wrap gap-2">
              {prev.durees.map((d, i) => (
                <li key={i} className="rounded-full px-3 py-1 text-[14px] font-bold" style={{ background: '#E2EFF8', color: '#3C6E96' }}>{d} jours</li>
              ))}
            </ul>
          </CarteR>
          {!valide ? (
            <BoutonR couleur="#3C6E96" disabled={choix == null} onClick={() => setValide(true)}>Valider mon jour</BoutonR>
          ) : (
            <>
              <Retour ok={juste} titre={juste ? 'Bien prévu !' : 'Pas tout à fait'}>
                La moyenne des cycles est de {prev.moyenne} jours : {fmt(p.starts.at(-1))} + {prev.moyenne} jours = <b>{fmt(prev.prochain)}</b>.
                {p.irregulier && ` Comme les cycles de ${p.nom} sont irréguliers, on ne peut donner qu’une fourchette : entre le ${fmt(min)} et le ${fmt(max)}.`}
                {!p.irregulier && juste && ' Les règles peuvent arriver un jour plus tôt ou plus tard : c’est une estimation.'}
              </Retour>
              <BoutonR onClick={suite}>{rang + 1 >= PERSONNES.length ? 'Terminer' : 'Personnage suivant'} <ArrowRight size={18} /></BoutonR>
            </>
          )}
        </div>
        <CarteR>
          <div className="flex flex-col gap-4">
            {mois.map((m) => (
              <Mois key={m} debut={m} starts={p.starts} choix={choix} bon={valide ? prev.prochain : null} onChoix={setChoix} bloque={valide} />
            ))}
          </div>
        </CarteR>
      </div>
    </PageRegles>
  )
}
