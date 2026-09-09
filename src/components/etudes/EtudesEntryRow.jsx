import { Trash2 } from 'lucide-react'
import { formatDate, formatEuros } from '../../utils/format.js'

export default function EtudesEntryRow({ entry, onDelete }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <p className="flex-1 min-w-0 text-sm font-medium text-slate-800">{formatDate(entry.date)}</p>
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
