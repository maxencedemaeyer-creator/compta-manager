import { useState } from 'react'
import Field, { inputClass } from '../ui/Field.jsx'
import Button from '../ui/Button.jsx'

const NOUVELLE = '__nouvelle__'

export default function RemboursementForm({ personnes, onSubmit, onAjouterPersonne, onCancel }) {
  // Pas de personne mémorisée : on démarre directement en mode "nouvelle personne".
  const [personne, setPersonne] = useState(personnes[0] || '')
  const [nouvellePersonne, setNouvellePersonne] = useState('')
  const [modeNouvelle, setModeNouvelle] = useState(personnes.length === 0)
  const [montant, setMontant] = useState('')
  const [motif, setMotif] = useState('')
  const [saving, setSaving] = useState(false)

  function annulerNouvelle() {
    setModeNouvelle(false)
    setPersonne(personnes[0] || '')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const personneFinale = modeNouvelle ? nouvellePersonne.trim() : personne
    if (!personneFinale || !montant) return
    setSaving(true)
    try {
      if (modeNouvelle) {
        await onAjouterPersonne(personneFinale)
      }
      await onSubmit({ personne: personneFinale, montant, motif })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Personne">
        {!modeNouvelle ? (
          <select
            className={inputClass}
            value={personne}
            onChange={(e) => {
              if (e.target.value === NOUVELLE) {
                setModeNouvelle(true)
                setNouvellePersonne('')
              } else {
                setPersonne(e.target.value)
              }
            }}
          >
            {personnes.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
            <option value={NOUVELLE}>+ Ajouter une nouvelle personne…</option>
          </select>
        ) : (
          <div className="flex gap-2">
            <input
              className={inputClass}
              value={nouvellePersonne}
              onChange={(e) => setNouvellePersonne(e.target.value)}
              placeholder="Ex. Ludovic"
              autoFocus
              required
            />
            {personnes.length > 0 && (
              <Button type="button" variant="secondary" onClick={annulerNouvelle}>
                Annuler
              </Button>
            )}
          </div>
        )}
      </Field>
      <Field label="Montant (€)">
        <input
          type="number"
          step="0.01"
          min="0"
          className={inputClass}
          value={montant}
          onChange={(e) => setMontant(e.target.value)}
          placeholder="40"
          required
        />
      </Field>
      <Field label="Pour quoi ?">
        <input
          className={inputClass}
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
          placeholder="Ex. Une plante"
        />
      </Field>
      <div className="flex gap-3 mt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" className="flex-1" disabled={saving}>
          {saving ? 'Ajout…' : 'Ajouter'}
        </Button>
      </div>
    </form>
  )
}
