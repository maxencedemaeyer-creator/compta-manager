import { useState } from 'react'
import Field, { inputClass } from '../ui/Field.jsx'
import Button from '../ui/Button.jsx'

const today = () => new Date().toISOString().slice(0, 10)

export default function CoursRecurrentForm({ onSubmit, onCancel }) {
  const [eleve, setEleve] = useState('')
  const [prix, setPrix] = useState('')
  const [duree, setDuree] = useState('60')
  const [dateDebut, setDateDebut] = useState(today())
  const [nombreSeances, setNombreSeances] = useState('10')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!eleve || !prix || !duree || !dateDebut || !nombreSeances) return
    setSaving(true)
    setError('')
    try {
      await onSubmit({ eleve, prix, duree, dateDebut, nombreSeances })
    } catch (err) {
      console.error('Erreur lors de la création des cours récurrents :', err)
      setError(err.message || "Une erreur est survenue, les cours n'ont pas été enregistrés.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="text-sm text-slate-500 mb-4">
        Crée plusieurs cours d'un coup pour le même élève, un par semaine à partir de la date de
        début.
      </p>
      <Field label="Prénom de l'élève">
        <input
          className={inputClass}
          value={eleve}
          onChange={(e) => setEleve(e.target.value)}
          placeholder="Ex. Lucas"
          required
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Prix par cours (€)">
          <input
            type="number"
            step="0.01"
            min="0"
            className={inputClass}
            value={prix}
            onChange={(e) => setPrix(e.target.value)}
            placeholder="25"
            required
          />
        </Field>
        <Field label="Durée (min)">
          <input
            type="number"
            min="0"
            step="5"
            className={inputClass}
            value={duree}
            onChange={(e) => setDuree(e.target.value)}
            required
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Première date">
          <input
            type="date"
            className={inputClass}
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            required
          />
        </Field>
        <Field label="Nombre de séances">
          <input
            type="number"
            min="1"
            max="52"
            className={inputClass}
            value={nombreSeances}
            onChange={(e) => setNombreSeances(e.target.value)}
            required
          />
        </Field>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      <div className="flex gap-3 mt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" className="flex-1" disabled={saving}>
          {saving ? 'Création…' : `Créer ${nombreSeances || 0} cours`}
        </Button>
      </div>
    </form>
  )
}
