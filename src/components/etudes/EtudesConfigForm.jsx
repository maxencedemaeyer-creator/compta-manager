import { useState } from 'react'
import Field, { inputClass } from '../ui/Field.jsx'
import Button from '../ui/Button.jsx'

export default function EtudesConfigForm({ config, onSubmit, onCancel }) {
  const [prixEtude, setPrixEtude] = useState(config?.prixEtude ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSubmit({ prixEtude })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Prix par étude (€)">
        <input
          type="number"
          step="0.01"
          min="0"
          className={inputClass}
          value={prixEtude}
          onChange={(e) => setPrixEtude(e.target.value)}
          placeholder="10"
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
