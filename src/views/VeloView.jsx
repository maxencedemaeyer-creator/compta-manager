import { useState } from 'react'
import { Plus, Settings, Bike } from 'lucide-react'
import { useVeloConfig, useVeloEntries } from '../hooks/useVelo.js'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Modal from '../components/ui/Modal.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import VeloConfigForm from '../components/velo/VeloConfigForm.jsx'
import VeloMonthForm from '../components/velo/VeloMonthForm.jsx'
import VeloEntryRow from '../components/velo/VeloEntryRow.jsx'
import { formatEuros } from '../utils/format.js'

export default function VeloView() {
  const { config, loading: loadingConfig, saveConfig } = useVeloConfig()
  const { entries, loading: loadingEntries, saveEntry, togglePaye } = useVeloEntries()
  const [modalConfig, setModalConfig] = useState(false)
  const [modalEntry, setModalEntry] = useState(false)

  const configPret = !loadingConfig && config?.prixKm > 0 && config?.distanceKm > 0
  const totalAnnee = entries.reduce((sum, e) => sum + e.montant, 0)

  async function handleSaveConfig(values) {
    await saveConfig(values)
    setModalConfig(false)
  }

  async function handleSaveEntry(values) {
    await saveEntry(values)
    setModalEntry(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Vélo</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setModalConfig(true)}>
            <Settings size={16} />
            <span className="hidden sm:inline">Paramètres</span>
          </Button>
          <Button onClick={() => setModalEntry(true)} disabled={!configPret}>
            <Plus size={16} />
            Enregistrer un mois
          </Button>
        </div>
      </div>

      {!loadingConfig && !configPret && (
        <Card className="mb-5 border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-800">
            Configure d'abord le prix au km et la distance domicile → école avant d'enregistrer un
            mois.
          </p>
        </Card>
      )}

      {configPret && (
        <Card className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">Prix au km / Distance (aller simple)</p>
            <p className="font-semibold text-slate-800">
              {formatEuros(config.prixKm)} · {config.distanceKm} km
            </p>
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
            icon={Bike}
            title="Aucun trajet enregistré"
            description="Enregistre le nombre d'aller-retours effectués ce mois-ci."
          />
        </Card>
      )}

      {entries.length > 0 && (
        <Card>
          {entries.map((entry) => (
            <VeloEntryRow key={entry.id} entry={entry} onTogglePaye={togglePaye} />
          ))}
        </Card>
      )}

      <Modal open={modalConfig} onClose={() => setModalConfig(false)} title="Paramètres vélo">
        <VeloConfigForm
          config={config}
          onSubmit={handleSaveConfig}
          onCancel={() => setModalConfig(false)}
        />
      </Modal>

      <Modal
        open={modalEntry}
        onClose={() => setModalEntry(false)}
        title="Frais vélo du mois"
      >
        <VeloMonthForm
          config={config}
          existingEntries={entries}
          onSubmit={handleSaveEntry}
          onCancel={() => setModalEntry(false)}
        />
      </Modal>
    </div>
  )
}
