import { useMemo, useState } from 'react'
import { Plus, Settings, BookOpen, List, CalendarDays, Check, ChevronRight } from 'lucide-react'
import { useEtudesConfig, useEtudes } from '../hooks/useEtudes.js'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Modal from '../components/ui/Modal.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import EtudesConfigForm from '../components/etudes/EtudesConfigForm.jsx'
import EtudesDatesForm from '../components/etudes/EtudesDatesForm.jsx'
import EtudesEntryRow from '../components/etudes/EtudesEntryRow.jsx'
import EtudesCalendrier from '../components/etudes/EtudesCalendrier.jsx'
import EtudesJourModal from '../components/etudes/EtudesJourModal.jsx'
import { formatEuros, formatMoisLabel, formatDateLongue } from '../utils/format.js'
import { moisKeyFromDate, moisKeyActuel, dateKeyFromDate } from '../utils/dates.js'

export default function EtudesView() {
  const { config, loading: loadingConfig, saveConfig } = useEtudesConfig()
  const { etudes, loading: loadingEtudes, addEtude, addEtudesSerie, removeEtude, toggleMoisPaye } =
    useEtudes()

  const [vue, setVue] = useState('liste')
  const [moisCalendrier, setMoisCalendrier] = useState(moisKeyActuel())
  const [modalConfig, setModalConfig] = useState(false)
  const [modalAjout, setModalAjout] = useState(false)
  const [jourSelectionne, setJourSelectionne] = useState(null)
  const [moisOuverts, setMoisOuverts] = useState(() => new Set())

  const configPret = !loadingConfig && config?.prixEtude > 0
  const totalGeneral = etudes.reduce((sum, e) => sum + e.prix, 0)

  const groupes = useMemo(() => {
    const map = new Map()
    for (const e of etudes) {
      const key = moisKeyFromDate(e.date)
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(e)
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1))
  }, [etudes])

  const entriesParJour = useMemo(() => {
    const map = {}
    for (const e of etudes) {
      const key = dateKeyFromDate(e.date)
      if (!map[key]) map[key] = []
      map[key].push(e)
    }
    return map
  }, [etudes])

  async function handleSaveConfig(values) {
    await saveConfig(values)
    setModalConfig(false)
  }

  async function handleAjouterDates({ dates }) {
    await addEtudesSerie({ dates, prix: config?.prixEtude || 0 })
    setModalAjout(false)
  }

  async function handleAjouterJour(date) {
    await addEtude({ date, prix: config?.prixEtude || 0 })
  }

  function handleSupprimerEtude(id) {
    if (confirm('Supprimer cette étude ?')) removeEtude(id)
  }

  function toggleMoisOuvert(moisKey) {
    setMoisOuverts((prev) => {
      const next = new Set(prev)
      if (next.has(moisKey)) next.delete(moisKey)
      else next.add(moisKey)
      return next
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Études</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setVue('liste')}
              className={`flex items-center justify-center rounded-lg p-1.5 transition-colors ${
                vue === 'liste'
                  ? 'bg-white shadow-soft text-brand-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              aria-label="Vue liste"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setVue('calendrier')}
              className={`flex items-center justify-center rounded-lg p-1.5 transition-colors ${
                vue === 'calendrier'
                  ? 'bg-white shadow-soft text-brand-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              aria-label="Vue calendrier"
            >
              <CalendarDays size={16} />
            </button>
          </div>
          <Button variant="secondary" onClick={() => setModalConfig(true)}>
            <Settings size={16} />
            <span className="hidden sm:inline">Prix</span>
          </Button>
          <Button onClick={() => setModalAjout(true)} disabled={!configPret}>
            <Plus size={16} />
            <span className="hidden sm:inline">Ajouter</span>
          </Button>
        </div>
      </div>

      {!loadingConfig && !configPret && (
        <Card className="mb-5 border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-800">
            Configure d'abord le prix par étude avant d'en ajouter.
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
            <p className="font-bold text-slate-900">{formatEuros(totalGeneral)}</p>
          </div>
        </Card>
      )}

      {configPret && vue === 'liste' && !loadingEtudes && etudes.length === 0 && (
        <Card>
          <EmptyState
            icon={BookOpen}
            title="Aucune étude enregistrée"
            description="Ajoute une étude, seule ou en série, avec le bouton ci-dessus."
          />
        </Card>
      )}

      {configPret && vue === 'liste' && etudes.length > 0 && (
        <div className="flex flex-col gap-5">
          {groupes.map(([moisKey, items]) => {
            const total = items.reduce((sum, e) => sum + e.prix, 0)
            const toutPaye = items.every((e) => e.paye)
            const estOuvert = moisOuverts.has(moisKey)
            return (
              <Card key={moisKey}>
                <div className="flex items-center justify-between mb-2 gap-3">
                  <button
                    type="button"
                    onClick={() => toggleMoisOuvert(moisKey)}
                    className="flex items-center gap-2 text-left min-w-0 py-1 -my-1"
                  >
                    <ChevronRight
                      size={16}
                      className={`shrink-0 text-slate-400 transition-transform ${
                        estOuvert ? 'rotate-90' : ''
                      }`}
                    />
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-800 capitalize truncate">
                        {formatMoisLabel(moisKey)}
                      </h3>
                      <p className="text-xs text-slate-500">{items.length} études</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="font-semibold text-slate-900 tabular-nums">{formatEuros(total)}</p>
                    <button
                      onClick={() => toggleMoisPaye(moisKey, toutPaye)}
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        toutPaye
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-600 hover:bg-red-100'
                      }`}
                    >
                      <Check size={14} />
                      {toutPaye ? 'Payé' : 'Non payé'}
                    </button>
                  </div>
                </div>
                {estOuvert && (
                  <div>
                    {items.map((entry) => (
                      <EtudesEntryRow key={entry.id} entry={entry} onDelete={handleSupprimerEtude} />
                    ))}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {configPret && vue === 'calendrier' && (
        <EtudesCalendrier
          moisKey={moisCalendrier}
          onChangeMois={setMoisCalendrier}
          entriesParJour={entriesParJour}
          onSelectJour={setJourSelectionne}
        />
      )}

      <Modal open={modalConfig} onClose={() => setModalConfig(false)} title="Prix des études">
        <EtudesConfigForm
          config={config}
          onSubmit={handleSaveConfig}
          onCancel={() => setModalConfig(false)}
        />
      </Modal>

      <Modal open={modalAjout} onClose={() => setModalAjout(false)} title="Ajouter des études">
        <EtudesDatesForm
          config={config}
          onSubmit={handleAjouterDates}
          onCancel={() => setModalAjout(false)}
        />
      </Modal>

      <Modal
        open={!!jourSelectionne}
        onClose={() => setJourSelectionne(null)}
        title={jourSelectionne ? formatDateLongue(jourSelectionne) : ''}
      >
        <EtudesJourModal
          date={jourSelectionne}
          entries={jourSelectionne ? entriesParJour[dateKeyFromDate(jourSelectionne)] || [] : []}
          onAdd={handleAjouterJour}
          onDelete={handleSupprimerEtude}
        />
      </Modal>
    </div>
  )
}
