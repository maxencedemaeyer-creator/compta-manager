import { Check } from 'lucide-react'
import { formatEuros, formatMoisLabel } from '../../utils/format.js'

export default function VeloEntryRow({ entry, onTogglePaye }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 capitalize">{formatMoisLabel(entry.mois)}</p>
        <p className="text-xs text-slate-500">
          {entry.allersRetours} trajet{entry.allersRetours > 1 ? 's' : ''}
        </p>
      </div>
      <p className="font-semibold text-slate-900 tabular-nums">{formatEuros(entry.montant)}</p>
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
