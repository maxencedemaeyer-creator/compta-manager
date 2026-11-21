import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import SeanceCarte from './SeanceCarte.jsx'
import { Carte, couleurType } from './ui.jsx'
import { aujourdhui, formatLong, formatMoisAnnee, grilleDuMois, JOURS_COURTS, memeMois, parseIso, toIso } from '../../lib/coach/dates.js'

const decaleMois = (iso, n) => {
  const d = parseIso(iso)
  return toIso(new Date(d.getFullYear(), d.getMonth() + n, 1, 12))
}

export default function CalendrierTab({ seances, onOuvrir }) {
  const jour = aujourdhui()
  const [mois, setMois] = useState(jour)
  const [choisi, setChoisi] = useState(jour)
  const grille = grilleDuMois(mois)
  const parJour = {}
  for (const s of seances) (parJour[s.date] ||= []).push(s)
  const duJour = parJour[choisi] || []

  return (
    <div className="space-y-4">
      <Carte className="!p-3">
        <div className="mb-2 flex items-center justify-between">
          <button onClick={() => setMois(decaleMois(mois, -1))} className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="Mois précédent">
            <ChevronLeft size={20} />
          </button>
          <p className="text-base font-bold capitalize text-slate-800">{formatMoisAnnee(mois)}</p>
          <button onClick={() => setMois(decaleMois(mois, 1))} className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="Mois suivant">
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="grid grid-cols-7 text-center text-[11px] font-semibold uppercase text-slate-400">
          {JOURS_COURTS.map((j) => (
            <span key={j} className="py-1">
              {j.slice(0, 3)}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {grille.map((d) => {
            const liste = parJour[d] || []
            const dansMois = memeMois(d, mois)
            const actif = d === choisi
            return (
              <button
                key={d}
                onClick={() => setChoisi(d)}
                className={`mx-auto flex h-12 w-full max-w-[3rem] flex-col items-center justify-center rounded-xl text-sm font-semibold ${
                  actif ? 'bg-sky-600 text-white' : d === jour ? 'bg-sky-50 text-sky-700' : dansMois ? 'text-slate-800 hover:bg-slate-50' : 'text-slate-300'
                }`}
              >
                {parseIso(d).getDate()}
                <span className="mt-0.5 flex h-1.5 gap-0.5">
                  {liste.slice(0, 3).map((s) => (
                    <span
                      key={s.id}
                      className={`h-1.5 w-1.5 rounded-full ${s.statut === 'faite' || s.statut === 'courte' ? (actif ? 'bg-white' : couleurType(s.type).puce) : actif ? 'bg-white/50' : 'bg-slate-300'}`}
                    />
                  ))}
                </span>
              </button>
            )
          })}
        </div>
        <p className="mt-2 px-1 text-xs text-slate-400">Point coloré = séance faite · point gris = séance prévue</p>
      </Carte>

      <section>
        <h3 className="mb-2 text-sm font-bold capitalize text-slate-500">{formatLong(choisi)}</h3>
        {duJour.length ? (
          <div className="space-y-2">
            {duJour.map((s) => (
              <SeanceCarte key={s.id} seance={s} onClick={() => onOuvrir(s)} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">Rien de prévu ce jour-là.</p>
        )}
      </section>
    </div>
  )
}
