import { useMemo, useState } from 'react'
import { Plus, Stethoscope, ChevronDown } from 'lucide-react'
import { useMedecinEntries, useMedecinTypes } from '../hooks/useMedecin.js'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Modal from '../components/ui/Modal.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import MedecinForm from '../components/medecin/MedecinForm.jsx'
import MedecinListItem from '../components/medecin/MedecinListItem.jsx'
import { moisKeyFromDate } from '../utils/dates.js'
import { formatEuros, formatMoisLabel } from '../utils/format.js'

export default function MedecinView() {
  const { types, ajouterType } = useMedecinTypes()
  const { entries, loading, addSoin, togglePaye, removeSoin } = useMedecinEntries()
  const [modalOpen, setModalOpen] = useState(false)
  const [valeursInitiales, setValeursInitiales] = useState(null)
  // Mois dépliés (par défaut : tous repliés)
  const [moisOuverts, setMoisOuverts] = useState(() => new Set())

  function toggleMois(moisKey) {
    setMoisOuverts((prev) => {
      const next = new Set(prev)
      if (next.has(moisKey)) next.delete(moisKey)
      else next.add(moisKey)
      return next
    })
  }

  const groupes = useMemo(() => {
    const map = new Map()
    for (const s of entries) {
      const key = moisKeyFromDate(s.date)
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(s)
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1))
  }, [entries])

  function handleOpenAjouter() {
    setValeursInitiales(null)
    setModalOpen(true)
  }

  function handleDuplicate(soin) {
    setValeursInitiales({
      type: soin.type,
      montantPaye: soin.montantPaye,
      montantMutuelle: soin.montantMutuelle,
    })
    setModalOpen(true)
  }

  async function handleAdd(values) {
    await addSoin(values)
    setModalOpen(false)
  }

  function handleDelete(id) {
    if (confirm('Supprimer ce soin ?')) removeSoin(id)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Médecin</h1>
        <Button onClick={handleOpenAjouter}>
          <Plus size={16} />
          Ajouter
        </Button>
      </div>

      {!loading && entries.length === 0 && (
        <Card>
          <EmptyState
            icon={Stethoscope}
            title="Aucun soin enregistré"
            description="Ajoute un soin reçu (kiné, dentiste…) avec le bouton ci-dessus."
          />
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {groupes.map(([moisKey, items]) => {
          const totalPaye = items.reduce((sum, s) => sum + s.montantPaye, 0)
          const totalMutuelle = items.reduce((sum, s) => sum + s.montantMutuelle, 0)
          const coutReel = totalPaye - totalMutuelle
          const nonRembourses = items.filter((s) => !s.paye).length
          const ouvert = moisOuverts.has(moisKey)
          return (
            <Card key={moisKey}>
              <button
                type="button"
                onClick={() => toggleMois(moisKey)}
                aria-expanded={ouvert}
                className="w-full text-left"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-slate-400 transition-transform duration-200 ${
                        ouvert ? 'rotate-0' : '-rotate-90'
                      }`}
                    />
                    <h3 className="font-semibold text-slate-800 capitalize truncate">
                      {formatMoisLabel(moisKey)}
                    </h3>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                      {items.length} soin{items.length > 1 ? 's' : ''}
                    </span>
                    {nonRembourses > 0 && (
                      <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600">
                        {nonRembourses} à rembourser
                      </span>
                    )}
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-slate-800 tabular-nums">
                    {formatEuros(coutReel)}
                  </p>
                </div>
              </button>

              {ouvert && (
                <div className="mt-3">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mb-1">
                    <p className="text-xs text-slate-500">
                      Coût réel total :{' '}
                      <span className="font-semibold text-slate-800">{formatEuros(coutReel)}</span>
                    </p>
                    <p className="text-sm text-slate-500">
                      Payé {formatEuros(totalPaye)} · Mutuelle {formatEuros(totalMutuelle)}
                    </p>
                  </div>
                  <div>
                    {items.map((s) => (
                      <MedecinListItem
                        key={s.id}
                        soin={s}
                        onTogglePaye={togglePaye}
                        onDuplicate={handleDuplicate}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={valeursInitiales ? 'Dupliquer le soin' : 'Nouveau soin'}
      >
        <MedecinForm
          types={types}
          initialValues={valeursInitiales}
          onSubmit={handleAdd}
          onAjouterType={ajouterType}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  )
}
