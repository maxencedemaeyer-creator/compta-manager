import { Check, Pencil } from 'lucide-react'
import { formatEuros, formatMoisLabel } from '../../utils/format.js'
import { moisEstTermine } from '../../utils/dates.js'

export default function VeloEntryRow({ entry, onTogglePaye, onEdit }) {
  const termine = moisEstTermine(entry.mois)

  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-medium text-slate-900 capitalize">{formatMoisLabel(entry.mois)}</p>
          {termine && (
            <span
              className="flex items-center justify-center w-4 h-4 rounded-full bg-brand-500 text-white shrink-0"
              title="Mois terminé"
            >
              <Check size={10} strokeWidth={3} />
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500">{entry.allersRetours} aller-retours</p>
      </div>
      <p className="font-semibold text-slate-900 tabular-nums">{formatEuros(entry.montant)}</p>
      <button
        onClick={() => onEdit(entry)}
        className="p-1.5 text-slate-300 hover:text-blue-500"
        aria-label="Modifier le nombre d'aller-retours"
      >
        <Pencil size={16} />
      </button>
      <button
        onClick={() => onTogglePaye(entry.mois, entry.paye)}
        className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
          entry.paye ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600 hover:bg-red-100'
        }`}
      >
        <Check size={14} />
        {entry.paye ? 'Payé' : 'Non payé'}
      </button>
    </div>
  )
}
