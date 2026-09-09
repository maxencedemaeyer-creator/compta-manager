import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  grilleCalendrier,
  moisKeyPrecedent,
  moisKeySuivant,
  moisKeyFromDate,
  dateKeyFromDate,
} from '../../utils/dates.js'
import { formatMoisLabel, libelleJourCourt } from '../../utils/format.js'

const JOURS = [0, 1, 2, 3, 4, 5, 6]

export default function EtudesCalendrier({ moisKey, onChangeMois, entriesParJour, onSelectJour }) {
  const semaines = grilleCalendrier(moisKey)
  const aujourdHui = dateKeyFromDate(new Date())

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => onChangeMois(moisKeyPrecedent(moisKey))}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Mois précédent"
        >
          <ChevronLeft size={18} />
        </button>
        <h3 className="font-semibold text-slate-800 capitalize">{formatMoisLabel(moisKey)}</h3>
        <button
          onClick={() => onChangeMois(moisKeySuivant(moisKey))}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Mois suivant"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {JOURS.map((i) => (
          <div key={i} className="text-center text-xs font-medium text-slate-400 py-1.5">
            {libelleJourCourt(i)}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {semaines.flat().map((jour) => {
          const key = dateKeyFromDate(jour)
          const dansLeMois = moisKeyFromDate(jour) === moisKey
          const estAujourdHui = key === aujourdHui
          const aUneEtude = (entriesParJour[key]?.length || 0) > 0

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectJour(jour)}
              className="flex flex-col items-center justify-center gap-1 aspect-square rounded-xl hover:bg-slate-50"
            >
              <span
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm transition-colors ${
                  estAujourdHui
                    ? 'bg-brand-600 text-white font-semibold'
                    : dansLeMois
                    ? 'text-slate-800'
                    : 'text-slate-300'
                }`}
              >
                {jour.getDate()}
              </span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${aUneEtude ? 'bg-brand-500' : 'bg-transparent'}`}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
