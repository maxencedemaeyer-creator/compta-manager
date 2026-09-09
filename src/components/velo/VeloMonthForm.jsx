import { useMemo, useState } from 'react'
import Field, { inputClass } from '../ui/Field.jsx'
import Button from '../ui/Button.jsx'
import { formatEuros } from '../../utils/format.js'
import { moisKeyActuel } from '../../utils/dates.js'

export default function VeloMonthForm({ config, existingEntries, onSubmit, onCancel }) {
  const [mois, setMois] = useState(moisKeyActuel())
  const [allersRetours, setAllersRetours] = useState('')
  const [saving, setSaving] = useState(false)

  const existant = existingEntries.find((e) => e.mois === mois)

  const montantEstime = useMemo(() => {
    const ar = Number(allersRetours) || 0
    return ar * 2 * Number(config?.distanceKm || 0) * Number(config?.prixKm || 0)
  }, [allersRetours, config])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!allersRetours) return
    setSaving(true)
    try {
      await onSubmit({
        mois,
        allersRetours,
        distanceKm: config?.distanceKm || 0,
        prixKm: config?.prixKm || 0,
        paye: existant?.paye || false,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Mois">
        <input
          type="month"
          className={inputClass}
          value={mois}
          onChange={(e) => setMois(e.target.value)}
          required
        />
      </Field>
      <Field label="Nombre d'allers-retours effectués">
        <input
          type="number"
          min="0"
          className={inputClass}
          value={allersRetours}
          onChange={(e) => setAllersRetours(e.target.value)}
          placeholder="0"
          required
        />
      </Field>

      {existant && (
        <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-4">
          Un enregistrement existe déjà pour ce mois ({existant.allersRetours} allers-retours). Il
          sera remplacé.
        </p>
      )}

      <div className="rounded-xl bg-slate-50 px-4 py-3 mb-5">
        <p className="text-xs text-slate-500 mb-0.5">Montant estimé</p>
        <p className="text-xl font-bold text-slate-900">{formatEuros(montantEstime)}</p>
        <p className="text-xs text-slate-400 mt-1">
          {allersRetours || 0} AR × 2 × {config?.distanceKm || 0} km × {formatEuros(config?.prixKm || 0)}
        </p>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" className="flex-1" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  )
}
