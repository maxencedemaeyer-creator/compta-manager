import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Leaf, Plus, Settings2 } from 'lucide-react'
import { nomPlante, useJardin, usePlantesJardin, useTachesFaites } from '../../hooks/useJardin.js'
import JardinForm from '../../components/jardin/JardinForm.jsx'
import PlanteForm from '../../components/jardin/PlanteForm.jsx'
import PlanteFiche, { CULTURES, LIEUX } from '../../components/jardin/PlanteFiche.jsx'
import CalendrierJardin from '../../components/jardin/CalendrierJardin.jsx'
import { boutonPrincipal } from '../../components/jardin/Feuille.jsx'
import { baseDePlante } from '../../data/jardin/plantes.js'
import { climatDe } from '../../config/jardinPays.js'
import { emojiDe, themeDe } from '../../config/jardinThemes.js'

// =============================================================
//  Mon jardin — écran 2 : un jardin, deux onglets (Mes plantes / Calendrier)
//  Adresses : /maxence/jardin/:jardinId  et  /maxence/jardin/:jardinId/calendrier
// =============================================================
function CartePlante({ p, onOuvrir }) {
  const base = baseDePlante(p)
  return (
    <li>
      <button
        onClick={onOuvrir}
        className="flex w-full items-center gap-4 rounded-3xl border border-emerald-100 bg-white p-3 text-left shadow-sm shadow-emerald-900/5 hover:bg-emerald-50/50 active:bg-emerald-50"
      >
        <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-50 text-4xl">
          {p.couverture ? <img src={p.couverture} alt="" className="h-full w-full object-cover" /> : base?.emoji || '🌱'}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="truncate text-lg font-bold text-emerald-950">{nomPlante(p)}</span>
            <span className="shrink-0 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">×{p.quantite}</span>
          </span>
          <span className="mt-1.5 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">{LIEUX[p.lieu]}</span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">{CULTURES[p.culture]}</span>
          </span>
        </span>
      </button>
    </li>
  )
}

export default function JardinView() {
  const { jardinId, onglet } = useParams()
  const navigate = useNavigate()
  const jardin = useJardin(jardinId)
  const { plantes, chargement } = usePlantesJardin(jardinId)
  const faites = useTachesFaites(jardinId)

  const [ajout, setAjout] = useState(false)
  const [parametres, setParametres] = useState(false)
  const [ouverte, setOuverte] = useState(null) // id de la plante dont la fiche est ouverte
  const [edition, setEdition] = useState(null) // plante en modification

  const enCalendrier = onglet === 'calendrier'
  const plante = plantes.find((p) => p.id === ouverte)

  if (jardin === null) {
    return (
      <div className="min-h-screen bg-white px-6 py-16 text-center text-emerald-950">
        <p className="text-5xl">🥀</p>
        <p className="mt-3 text-lg font-semibold">Ce jardin n'existe plus.</p>
        <Link to="/maxence/jardin" className="mt-4 inline-block font-semibold text-emerald-700">
          ← Mes jardins
        </Link>
      </div>
    )
  }

  const onglets = [
    { id: 'plantes', nom: 'Mes plantes', Icone: Leaf, to: `/maxence/jardin/${jardinId}` },
    { id: 'calendrier', nom: 'Calendrier', Icone: CalendarDays, to: `/maxence/jardin/${jardinId}/calendrier` },
  ]

  return (
    <div className={`min-h-screen bg-gradient-to-b ${themeDe(jardin).page} text-emerald-950`}>
      <div className="mx-auto max-w-2xl px-5 sm:px-8 pt-5 sm:pt-8 pb-28">
        <div className="flex items-center justify-between">
          <Link to="/maxence/jardin" className="inline-flex items-center gap-1.5 text-sm text-emerald-900/60 hover:text-emerald-900">
            <ArrowLeft size={16} />
            Mes jardins
          </Link>
          <button
            onClick={() => setParametres(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm shadow-emerald-900/10"
            aria-label="Paramètres du jardin"
          >
            <Settings2 size={19} />
          </button>
        </div>

        <div className="mt-3 mb-5 flex items-center gap-3">
          {jardin && (
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${themeDe(jardin).tuile}`}>
              {emojiDe(jardin)}
            </span>
          )}
          <h1 className="min-w-0 truncate text-3xl font-extrabold tracking-tight">{jardin?.nom || '…'}</h1>
        </div>

        {/* Onglets */}
        <div className="mb-5 grid grid-cols-2 gap-1.5 rounded-2xl bg-emerald-100/70 p-1.5">
          {onglets.map(({ id, nom, Icone, to }) => {
            const actif = (id === 'calendrier') === enCalendrier
            return (
              <button
                key={id}
                onClick={() => navigate(to, { replace: true })}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-[15px] font-semibold transition-colors ${
                  actif ? 'bg-white text-emerald-800 shadow-sm' : 'text-emerald-800/60'
                }`}
              >
                <Icone size={18} />
                {nom}
              </button>
            )
          })}
        </div>

        {enCalendrier ? (
          <CalendrierJardin jardinId={jardinId} plantes={plantes} faites={faites} climat={climatDe(jardin)} />
        ) : chargement ? (
          <p className="py-10 text-center text-emerald-900/50">Chargement…</p>
        ) : plantes.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-emerald-200 bg-white/70 px-6 py-12 text-center">
            <p className="text-5xl">🪴</p>
            <p className="mt-3 text-lg font-semibold">Aucune plante pour l'instant</p>
            <p className="mt-1 text-sm text-emerald-900/60">Ajoute ta première plante, avec ses photos.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {plantes.map((p) => (
              <CartePlante key={p.id} p={p} onOuvrir={() => setOuverte(p.id)} />
            ))}
          </ul>
        )}
      </div>

      {/* Bouton d'ajout fixe (onglet Mes plantes) */}
      {!enCalendrier && (
        <div className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-white via-white/95 to-transparent px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6">
          <div className="mx-auto max-w-2xl">
            <button onClick={() => setAjout(true)} className={`${boutonPrincipal} w-full text-base shadow-lg shadow-emerald-600/25`}>
              <Plus size={20} />
              Ajouter une plante
            </button>
          </div>
        </div>
      )}

      {ajout && <PlanteForm jardinId={jardinId} onClose={() => setAjout(false)} />}
      {edition && <PlanteForm jardinId={jardinId} plante={edition} onClose={() => setEdition(null)} onSupprime={() => setOuverte(null)} />}
      {plante && !edition && (
        <PlanteFiche jardinId={jardinId} plante={plante} onClose={() => setOuverte(null)} onModifier={() => setEdition(plante)} />
      )}
      {parametres && jardin && (
        <JardinForm jardin={jardin} onClose={() => setParametres(false)} onSupprime={() => navigate('/maxence/jardin', { replace: true })} />
      )}
    </div>
  )
}
