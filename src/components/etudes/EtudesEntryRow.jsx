import { Check, Trash2 } from 'lucide-react'
import { formatDate, formatEuros, formatJourSemaine } from '../../utils/format.js'
import { etudeEstPassee } from '../../utils/dates.js'

export default function EtudesEntryRow({ entry, onDelete }) {
  const passee = etudeEstPassee(entry.date)

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <div className="flex-1 min-w-0 flex items-center gap-1.5">
        <p className="text-sm font-medium text-slate-800 truncate">
          {formatJourSemaine(entry.date)} {formatDate(entry.date)}
        </p>
        {passee && (
          <span
            className="flex items-center justify-center w-4 h-4 rounded-full bg-brand-500 text-white shrink-0"
            title="Étude déjà passée"
          >
            <Check size={10} strokeWidth={3} />
          </span>
        )}
      </div>
      <p className="text-sm text-slate-500 tabular-nums">{formatEuros(entry.prix)}</p>
      <button
        onClick={() => onDelete(entry.id)}
        className="p-1.5 text-slate-300 hover:text-red-500"
        aria-label="Supprimer cette étude"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}
