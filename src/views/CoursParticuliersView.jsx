import { useMemo, useState } from 'react'
import { Plus, CalendarRange, GraduationCap } from 'lucide-react'
import { useCoursParticuliers } from '../hooks/useCoursParticuliers.js'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Modal from '../components/ui/Modal.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import CoursForm from '../components/cours/CoursForm.jsx'
import CoursRecurrentForm from '../components/cours/CoursRecurrentForm.jsx'
import CoursListItem from '../components/cours/CoursListItem.jsx'
import { moisKeyFromDate } from '../utils/dates.js'
import { formatEuros, formatMoisLabel } from '../utils/format.js'

export default function CoursParticuliersView() {
  const { cours, loading, addCours, addCoursRecurrents, togglePaye, removeCours } =
    useCoursParticuliers()
  const [modalSimple, setModalSimple] = useState(false)
  const [modalRecurrent, setModalRecurrent] = useState(false)

  const groupes = useMemo(() => {
    const map = new Map()
    for (const c of cours) {
      const key = moisKeyFromDate(c.date)
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(c)
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1))
  }, [cours])

  async function handleAddSimple(values) {
    await addCours(values)
    setModalSimple(false)
  }

  async function handleAddRecurrent(values) {
    await addCoursRecurrents(values)
    setModalRecurrent(false)
  }

  function handleDelete(id) {
    if (confirm('Supprimer ce cours ?')) removeCours(id)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Cours particuliers</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setModalRecurrent(true)}>
            <CalendarRange size={16} />
            <span className="hidden sm:inline">Récurrent</span>
          </Button>
          <Button onClick={() => setModalSimple(true)}>
            <Plus size={16} />
            Ajouter
          </Button>
        </div>
      </div>

      {!loading && cours.length === 0 && (
        <Card>
          <EmptyState
            icon={GraduationCap}
            title="Aucun cours enregistré"
            description="Ajoute ton premier cours particulier avec le bouton ci-dessus."
          />
        </Card>
      )}

      <div className="flex flex-col gap-5">
        {groupes.map(([moisKey, items]) => {
          const total = items.reduce((sum, c) => sum + c.prix, 0)
          const percu = items.filter((c) => c.paye).reduce((sum, c) => sum + c.prix, 0)
          return (
            <Card key={moisKey}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-800 capitalize">
                  {formatMoisLabel(moisKey)}
                </h3>
                <p className="text-sm text-slate-500">
                  {formatEuros(percu)} / {formatEuros(total)}
                </p>
              </div>
              <div>
                {items.map((c) => (
                  <CoursListItem
                    key={c.id}
                    cours={c}
                    onTogglePaye={togglePaye}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </Card>
          )
        })}
      </div>

      <Modal open={modalSimple} onClose={() => setModalSimple(false)} title="Nouveau cours">
        <CoursForm onSubmit={handleAddSimple} onCancel={() => setModalSimple(false)} />
      </Modal>

      <Modal
        open={modalRecurrent}
        onClose={() => setModalRecurrent(false)}
        title="Cours récurrents"
      >
        <CoursRecurrentForm onSubmit={handleAddRecurrent} onCancel={() => setModalRecurrent(false)} />
      </Modal>
    </div>
  )
}
