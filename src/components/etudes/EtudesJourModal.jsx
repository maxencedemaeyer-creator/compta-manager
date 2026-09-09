import { Plus, Trash2 } from 'lucide-react'
import Button from '../ui/Button.jsx'
import { formatEuros } from '../../utils/format.js'

export default function EtudesJourModal({ date, entries, onAdd, onDelete }) {
  if (!date) return null

  return (
    <div>
      {entries.length === 0 && (
        <p className="text-sm text-slate-500 mb-5">Aucune étude enregistrée ce jour.</p>
      )}

      {entries.length > 0 && (
        <div className="mb-5">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-slate-800">Étude</p>
                <p className="text-xs text-slate-500">{formatEuros(entry.prix)}</p>
              </div>
              <button
                onClick={() => onDelete(entry.id)}
                className="p-1.5 text-slate-300 hover:text-red-500"
                aria-label="Supprimer cette étude"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Button className="w-full" onClick={() => onAdd(date)}>
        <Plus size={16} />
        Ajouter une étude ce jour
      </Button>
    </div>
  )
}
