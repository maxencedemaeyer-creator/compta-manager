import { useState } from 'react'
import Field, { inputClass } from '../ui/Field.jsx'
import Button from '../ui/Button.jsx'

export default function VeloConfigForm({ config, onSubmit, onCancel }) {
  const [prixKm, setPrixKm] = useState(config?.prixKm ?? '')
  const [distanceKm, setDistanceKm] = useState(config?.distanceKm ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSubmit({ prixKm, distanceKm })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Prix au km (€)">
        <input
          type="number"
          step="0.01"
          min="0"
          className={inputClass}
          value={prixKm}
          onChange={(e) => setPrixKm(e.target.value)}
          placeholder="0.25"
          required
        />
      </Field>
      <Field label="Distance domicile → école (km, aller simple)">
        <input
          type="number"
          step="0.1"
          min="0"
          className={inputClass}
          value={distanceKm}
          onChange={(e) => setDistanceKm(e.target.value)}
          placeholder="3.5"
          required
        />
      </Field>
      <div className="flex gap-3 mt-2">
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
