import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { inputClass } from '../ui/Field.jsx'
import Button from '../ui/Button.jsx'
import { formatEuros } from '../../utils/format.js'

const today = () => new Date().toISOString().slice(0, 10)

function decaleDeSeptJours(dateStr) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + 7)
  return d.toISOString().slice(0, 10)
}

export default function EtudesDatesForm({ config, onSubmit, onCancel }) {
  const [dates, setDates] = useState([today()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const prix = Number(config?.prixEtude || 0)
  const datesValides = dates.filter(Boolean)
  const montantEstime = datesValides.length * prix

  function handleChangeDate(index, value) {
    setDates((prev) => prev.map((d, i) => (i === index ? value : d)))
  }

  function handleAjouterLigne() {
    setDates((prev) => [...prev, decaleDeSeptJours(prev[prev.length - 1] || today())])
  }

  function handleSupprimerLigne(index) {
    setDates((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (datesValides.length === 0) return
    setSaving(true)
    setError('')
    try {
      await onSubmit({ dates: datesValides })
    } catch (err) {
      console.error("Erreur lors de l'ajout des études :", err)
      setError(err.message || "Une erreur est survenue, les études n'ont pas été enregistrées.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="text-sm text-slate-500 mb-4">
        Ajoute une date pour une étude ponctuelle, ou plusieurs pour créer une série d'un coup.
      </p>

      <div className="mb-4">
        {dates.map((date, index) => (
          <div key={index} className="flex items-center gap-2 mb-2">
            <input
              type="date"
              className={inputClass}
              value={date}
              onChange={(e) => handleChangeDate(index, e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => handleSupprimerLigne(index)}
              disabled={dates.length === 1}
              className="p-2 text-slate-300 hover:text-red-500 disabled:opacity-30 disabled:pointer-events-none shrink-0"
              aria-label="Retirer cette date"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={handleAjouterLigne}
          className="flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 mt-1"
        >
          <Plus size={15} />
          Ajouter une date
        </button>
      </div>

      <div className="rounded-xl bg-slate-50 px-4 py-3 mb-5">
        <p className="text-xs text-slate-500 mb-0.5">Montant estimé</p>
        <p className="text-xl font-bold text-slate-900">{formatEuros(montantEstime)}</p>
        <p className="text-xs text-slate-400 mt-1">
          {datesValides.length} × {formatEuros(prix)}
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" className="flex-1" disabled={saving || datesValides.length === 0}>
          {saving
            ? 'Enregistrement…'
            : `Enregistrer ${datesValides.length || ''} étude${datesValides.length > 1 ? 's' : ''}`}
        </Button>
      </div>
    </form>
  )
}
