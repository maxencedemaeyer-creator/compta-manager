import { useMemo, useState } from 'react'
import Field, { inputClass } from '../ui/Field.jsx'
import Button from '../ui/Button.jsx'
import { formatEuros } from '../../utils/format.js'
import { moisKeyActuel } from '../../utils/dates.js'

export default function EtudesMonthForm({ config, existingEntries, onSubmit, onCancel }) {
  const [mois, setMois] = useState(moisKeyActuel())
  const [nombre, setNombre] = useState('')
  const [saving, setSaving] = useState(false)

  const existant = existingEntries.find((e) => e.mois === mois)

  const montantEstime = useMemo(() => {
    return (Number(nombre) || 0) * Number(config?.prixEtude || 0)
  }, [nombre, config])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!nombre) return
    setSaving(true)
    try {
      await onSubmit({
        mois,
        nombre,
        prixUnitaire: config?.prixEtude || 0,
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
      <Field label="Nombre d'études faites">
        <input
          type="number"
          min="0"
          className={inputClass}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="0"
          required
        />
      </Field>

      {existant && (
        <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-4">
          Un enregistrement existe déjà pour ce mois ({existant.nombre} études). Il sera remplacé.
        </p>
      )}

      <div className="rounded-xl bg-slate-50 px-4 py-3 mb-5">
        <p className="text-xs text-slate-500 mb-0.5">Montant estimé</p>
        <p className="text-xl font-bold text-slate-900">{formatEuros(montantEstime)}</p>
        <p className="text-xs text-slate-400 mt-1">
          {nombre || 0} × {formatEuros(config?.prixEtude || 0)}
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
