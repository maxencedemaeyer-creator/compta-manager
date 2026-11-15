import { useMemo, useState } from 'react'
import { Plus, CalendarRange, GraduationCap, ChevronDown, History, CalendarClock, Users } from 'lucide-react'
import { useCoursParticuliers } from '../hooks/useCoursParticuliers.js'
import { useEleves, idEleve } from '../hooks/useEleves.js'
import { ListeEleves } from '../components/cours/Eleves.jsx'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Modal from '../components/ui/Modal.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import CoursForm from '../components/cours/CoursForm.jsx'
import CoursRecurrentForm from '../components/cours/CoursRecurrentForm.jsx'
import CoursListItem from '../components/cours/CoursListItem.jsx'
import { moisKeyFromDate, moisKeyActuel, coursEstPasse, anneeActuelle } from '../utils/dates.js'
import { formatEuros, formatMoisLabel } from '../utils/format.js'

// Convertit une date Firestore / Date / chaîne en nombre (ms) pour pouvoir trier
function dateEnMs(date) {
  const d = date instanceof Date ? date : date?.toDate ? date.toDate() : new Date(date)
  return d.getTime()
}

export default function CoursParticuliersView() {
  const { cours, loading, addCours, addCoursRecurrents, togglePaye, removeCours } =
    useCoursParticuliers()
  const [modalSimple, setModalSimple] = useState(false)
  const [modalRecurrent, setModalRecurrent] = useState(false)
  // Fenêtre "Élèves" : null = fermée, sinon l'id de l'élève à mettre en avant ('' = aucun)
  const [modalEleves, setModalEleves] = useState(null)

  const { eleves, profilDe } = useEleves(cours, loading)
  const annee = anneeActuelle()

  // Pour chaque élève : cours déjà passés et montant déjà payé sur l'année en cours
  const statsEleves = useMemo(() => {
    const stats = {}
    for (const c of cours) {
      const d = c.date?.toDate ? c.date.toDate() : new Date(c.date)
      if (d.getFullYear() !== annee) continue
      const id = idEleve(c.eleve)
      if (!stats[id]) stats[id] = { coursPasses: 0, montantPaye: 0 }
      if (coursEstPasse(c.date)) stats[id].coursPasses += 1
      if (c.paye) stats[id].montantPaye += c.prix
    }
    return stats
  }, [cours, annee])

  // Dernier cours (le plus récent) de chaque élève, pour pré-remplir prix et durée
  const derniersCours = useMemo(() => {
    const map = {}
    for (const c of cours) {
      const id = idEleve(c.eleve)
      if (!map[id] || dateEnMs(c.date) > dateEnMs(map[id].date)) map[id] = c
    }
    return map
  }, [cours])
  const dernierCoursDe = (id) => derniersCours[id] || null

  // Onglet affiché : 'actuels' (mois en cours + à venir) ou 'passes' (mois clôturés)
  const [onglet, setOnglet] = useState('actuels')
  // Mois dépliés / repliés manuellement par l'utilisateur ({ "2026-11": true, ... })
  const [ouverts, setOuverts] = useState({})

  const moisActuel = moisKeyActuel()

  // Regroupe les cours par mois ; à l'intérieur d'un mois, du plus ancien au plus récent
  const groupes = useMemo(() => {
    const map = new Map()
    for (const c of cours) {
      const key = moisKeyFromDate(c.date)
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(c)
    }
    for (const items of map.values()) {
      items.sort((a, b) => dateEnMs(a.date) - dateEnMs(b.date))
    }
    return map
  }, [cours])

  // Mois en cours + à venir : ordre chronologique (novembre, puis décembre, ...)
  const moisActuels = useMemo(
    () =>
      Array.from(groupes.entries())
        .filter(([key]) => key >= moisActuel)
        .sort((a, b) => (a[0] < b[0] ? -1 : 1)),
    [groupes, moisActuel]
  )

  // Mois passés : ordre antichronologique (le plus récent en haut)
  const moisPasses = useMemo(
    () =>
      Array.from(groupes.entries())
        .filter(([key]) => key < moisActuel)
        .sort((a, b) => (a[0] < b[0] ? 1 : -1)),
    [groupes, moisActuel]
  )

  const groupesAffiches = onglet === 'actuels' ? moisActuels : moisPasses

  // Par défaut : seul le mois actuel est déplié (ou, s'il n'a aucun cours, le premier mois à venir).
  // Dans les mois passés, tout est replié par défaut.
  const moisDeplieParDefaut =
    onglet === 'actuels' && moisActuels.length > 0
      ? moisActuels.some(([key]) => key === moisActuel)
        ? moisActuel
        : moisActuels[0][0]
      : null

  function estOuvert(key) {
    if (key in ouverts) return ouverts[key]
    return key === moisDeplieParDefaut
  }

  function basculerMois(key) {
    setOuverts((prev) => ({ ...prev, [key]: !estOuvert(key) }))
  }

  function changerOnglet(nouvelOnglet) {
    setOnglet(nouvelOnglet)
    setOuverts({}) // on repart de l'affichage par défaut à chaque changement d'onglet
  }

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

  const onglets = [
    { id: 'actuels', label: 'En cours & à venir', icon: CalendarClock, nombre: moisActuels.length },
    { id: 'passes', label: 'Mois passés', icon: History, nombre: moisPasses.length },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Cours particuliers</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setModalEleves('')} aria-label="Élèves">
            <Users size={16} />
            <span className="hidden sm:inline">Élèves</span>
          </Button>
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

      {/* Sélecteur : mois en cours / à venir  ↔  mois passés */}
      {!loading && cours.length > 0 && (
        <div className="flex sm:justify-end mb-5">
          <div className="flex w-full sm:w-auto bg-slate-100 rounded-xl p-1 gap-1">
            {onglets.map(({ id, label, icon: Icone, nombre }) => {
              const actif = onglet === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => changerOnglet(id)}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    actif
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Icone size={15} />
                  <span>{label}</span>
                  <span
                    className={`text-xs rounded-full px-1.5 py-0.5 ${
                      actif ? 'bg-slate-100 text-slate-600' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {nombre}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {!loading && cours.length === 0 && (
        <Card>
          <EmptyState
            icon={GraduationCap}
            title="Aucun cours enregistré"
            description="Ajoute ton premier cours particulier avec le bouton ci-dessus."
          />
        </Card>
      )}

      {!loading && cours.length > 0 && groupesAffiches.length === 0 && (
        <Card>
          <EmptyState
            icon={onglet === 'actuels' ? CalendarClock : History}
            title={onglet === 'actuels' ? 'Aucun cours à venir' : 'Aucun mois passé'}
            description={
              onglet === 'actuels'
                ? 'Aucun cours prévu ce mois-ci ni les mois suivants.'
                : 'Les mois terminés apparaîtront ici.'
            }
          />
        </Card>
      )}

      <div className="flex flex-col gap-4">
        {groupesAffiches.map(([moisKey, items]) => {
          const total = items.reduce((sum, c) => sum + c.prix, 0)
          const percu = items.filter((c) => c.paye).reduce((sum, c) => sum + c.prix, 0)
          const ouvert = estOuvert(moisKey)
          const estMoisActuel = moisKey === moisActuel
          return (
            <Card key={moisKey}>
              <button
                type="button"
                onClick={() => basculerMois(moisKey)}
                className="w-full flex items-center justify-between gap-3 text-left"
                aria-expanded={ouvert}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-slate-400 transition-transform duration-200 ${
                      ouvert ? '' : '-rotate-90'
                    }`}
                  />
                  <h3 className="font-semibold text-slate-800 capitalize truncate">
                    {formatMoisLabel(moisKey)}
                  </h3>
                  {estMoisActuel && (
                    <span className="shrink-0 text-xs font-medium bg-brand-50 text-brand-700 rounded-full px-2 py-0.5">
                      Ce mois-ci
                    </span>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm text-slate-500">
                    {formatEuros(percu)} / {formatEuros(total)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {items.length} cours
                  </p>
                </div>
              </button>

              {ouvert && (
                <div className="mt-3 pt-1 border-t border-slate-100">
                  {items.map((c) => (
                    <CoursListItem
                      key={c.id}
                      cours={c}
                      profil={profilDe(c.eleve)}
                      onClickEleve={(nom) => setModalEleves(idEleve(nom))}
                      onTogglePaye={togglePaye}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <Modal open={modalSimple} onClose={() => setModalSimple(false)} title="Nouveau cours">
        <CoursForm
          eleves={eleves}
          dernierCoursDe={dernierCoursDe}
          onSubmit={handleAddSimple}
          onCancel={() => setModalSimple(false)}
        />
      </Modal>

      <Modal
        open={modalRecurrent}
        onClose={() => setModalRecurrent(false)}
        title="Cours récurrents"
      >
        <CoursRecurrentForm
          eleves={eleves}
          dernierCoursDe={dernierCoursDe}
          onSubmit={handleAddRecurrent}
          onCancel={() => setModalRecurrent(false)}
        />
      </Modal>

      <Modal open={modalEleves !== null} onClose={() => setModalEleves(null)} title="Élèves">
        <ListeEleves
          eleves={eleves}
          stats={statsEleves}
          annee={annee}
          eleveMisEnAvant={modalEleves}
        />
      </Modal>
    </div>
  )
}
