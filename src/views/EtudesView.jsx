import { useState } from 'react'
import { Plus, Settings, BookOpen } from 'lucide-react'
import { useEtudesConfig, useEtudesEntries } from '../hooks/useEtudes.js'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Modal from '../components/ui/Modal.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import EtudesConfigForm from '../components/etudes/EtudesConfigForm.jsx'
import EtudesMonthForm from '../components/etudes/EtudesMonthForm.jsx'
import EtudesEntryRow from '../components/etudes/EtudesEntryRow.jsx'
import { formatEuros } from '../utils/format.js'

export default function EtudesView() {
  const { config, loading: loadingConfig, saveConfig } = useEtudesConfig()
  const { entries, loading: loadingEntries, saveEntry, togglePaye } = useEtudesEntries()
  const [modalConfig, setModalConfig] = useState(false)
  const [modalEntry, setModalEntry] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)

  const configPret = !loadingConfig && config?.prixEtude > 0
  const totalAnnee = entries.reduce((sum, e) => sum + e.montant, 0)

  async function handleSaveConfig(values) {
    await saveConfig(values)
    setModalConfig(false)
  }

  async function handleSaveEntry(values) {
    await saveEntry(values)
    setModalEntry(false)
    setEditingEntry(null)
  }

  function handleOpenNewEntry() {
    setEditingEntry(null)
    setModalEntry(true)
  }

  function handleEditEntry(entry) {
    setEditingEntry(entry)
    setModalEntry(true)
  }

  function handleCloseEntryModal() {
    setModalEntry(false)
    setEditingEntry(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Études</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setModalConfig(true)}>
            <Settings size={16} />
            <span className="hidden sm:inline">Prix</span>
          </Button>
          <Button onClick={handleOpenNewEntry} disabled={!configPret}>
            <Plus size={16} />
            Enregistrer un mois
          </Button>
        </div>
      </div>

      {!loadingConfig && !configPret && (
        <Card className="mb-5 border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-800">
            Configure d'abord le prix par étude avant d'enregistrer un mois.
          </p>
        </Card>
      )}

      {configPret && (
        <Card className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">Prix par étude</p>
            <p className="font-semibold text-slate-800">{formatEuros(config.prixEtude)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Total enregistré</p>
            <p className="font-bold text-slate-900">{formatEuros(totalAnnee)}</p>
          </div>
        </Card>
      )}

      {!loadingEntries && entries.length === 0 && (
        <Card>
          <EmptyState
            icon={BookOpen}
            title="Aucune étude enregistrée"
            description="Enregistre le nombre d'études faites ce mois-ci."
          />
        </Card>
      )}

      {entries.length > 0 && (
        <Card>
          {entries.map((entry) => (
            <EtudesEntryRow
              key={entry.id}
              entry={entry}
              onTogglePaye={togglePaye}
              onEdit={handleEditEntry}
            />
          ))}
        </Card>
      )}

      <Modal open={modalConfig} onClose={() => setModalConfig(false)} title="Prix des études">
        <EtudesConfigForm
          config={config}
          onSubmit={handleSaveConfig}
          onCancel={() => setModalConfig(false)}
        />
      </Modal>

      <Modal
        open={modalEntry}
        onClose={handleCloseEntryModal}
        title={editingEntry ? "Modifier le nombre d'études" : 'Études du mois'}
      >
        <EtudesMonthForm
          config={config}
          existingEntries={entries}
          editingEntry={editingEntry}
          onSubmit={handleSaveEntry}
          onCancel={handleCloseEntryModal}
        />
      </Modal>
    </div>
  )
}
