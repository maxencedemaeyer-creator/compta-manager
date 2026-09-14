import { Trash2, Check } from 'lucide-react'
import { formatDate, formatEuros } from '../../utils/format.js'
import { coursEstPasse } from '../../utils/dates.js'

export default function CoursListItem({ cours, onTogglePaye, onDelete }) {
  const passe = coursEstPasse(cours.date)

  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 truncate">{cours.eleve}</p>
        <div className="flex items-center gap-1.5">
          <p className="text-xs text-slate-500">
            {formatDate(cours.date)} · {cours.duree} min
          </p>
          {passe && (
            <span
              className="flex items-center justify-center w-4 h-4 rounded-full bg-brand-500 text-white shrink-0"
              title="Cours déjà passé"
            >
              <Check size={10} strokeWidth={3} />
            </span>
          )}
        </div>
      </div>
      <p className="font-semibold text-slate-900 tabular-nums">{formatEuros(cours.prix)}</p>
      <button
        onClick={() => onTogglePaye(cours.id, cours.paye)}
        className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
          cours.paye
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-red-50 text-red-600 hover:bg-red-100'
        }`}
      >
        <Check size={14} />
        {cours.paye ? 'Payé' : 'Non payé'}
      </button>
      <button
        onClick={() => onDelete(cours.id)}
        className="p-1.5 text-slate-300 hover:text-red-500"
        aria-label="Supprimer"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}
