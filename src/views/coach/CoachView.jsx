import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, CalendarDays, CalendarRange, Home, Salad, TrendingUp, UserRound } from 'lucide-react'
import { useCoach } from '../../hooks/useCoach.js'
import AujourdhuiTab from '../../components/coach/AujourdhuiTab.jsx'
import CalendrierTab from '../../components/coach/CalendrierTab.jsx'
import PlansTab from '../../components/coach/PlansTab.jsx'
import NutritionTab from '../../components/coach/NutritionTab.jsx'
import ProgresTab from '../../components/coach/ProgresTab.jsx'
import ProfilTab from '../../components/coach/ProfilTab.jsx'
import SourcesTab from '../../components/coach/SourcesTab.jsx'
import SeanceFenetre from '../../components/coach/SeanceFenetre.jsx'

// =============================================================
//  Coach — suivi sportif gratuit et sourcé (course, renfo, nutrition)
//  Route : /maxence/coach/:onglet?
//  Données : Firebase (coachProfil, coachPlans, coachSeances)
//  Voir le fichier claude/coach.md du projet.
// =============================================================
const ONGLETS = [
  { id: 'aujourdhui', nom: 'Aujourd’hui', icone: Home },
  { id: 'calendrier', nom: 'Calendrier', icone: CalendarDays },
  { id: 'plans', nom: 'Plans', icone: CalendarRange },
  { id: 'nutrition', nom: 'Nutrition', icone: Salad },
  { id: 'progres', nom: 'Progrès', icone: TrendingUp },
]
const TITRES = { profil: 'Mon profil', sources: 'Sources & méthode' }

export default function CoachView() {
  const { onglet = 'aujourdhui' } = useParams()
  const navigate = useNavigate()
  const coach = useCoach()
  const [ouverte, setOuverte] = useState(null) // id de la séance ouverte

  const allerA = (id) => navigate(`/maxence/coach/${id === 'aujourdhui' ? '' : id}`)
  if (![...ONGLETS.map((o) => o.id), 'profil', 'sources'].includes(onglet)) return <Navigate to="/maxence/coach" replace />

  const { profil, seances, plans, planActif, chargement, erreur } = coach
  const seance = ouverte ? seances.find((s) => s.id === ouverte) : null
  const premiereFois = !chargement && profil === null
  const titre = TITRES[onglet] || ONGLETS.find((o) => o.id === onglet)?.nom

  let contenu
  if (chargement) {
    contenu = <p className="py-16 text-center text-slate-400">Chargement…</p>
  } else if (onglet === 'sources') {
    contenu = <SourcesTab />
  } else if (premiereFois || onglet === 'profil') {
    contenu = <ProfilTab profil={profil} onSauver={coach.sauverProfil} premiereFois={premiereFois} />
  } else {
    contenu = {
      aujourdhui: (
        <AujourdhuiTab profil={profil} seances={seances} planActif={planActif} onOuvrir={(s) => setOuverte(s.id)} onAjouterLibre={coach.ajouterSeanceLibre} allerA={allerA} />
      ),
      calendrier: <CalendrierTab seances={seances} onOuvrir={(s) => setOuverte(s.id)} />,
      plans: <PlansTab profil={profil} plans={plans} planActif={planActif} onGenerer={coach.genererPlan} onSupprimer={coach.supprimerPlan} allerA={allerA} />,
      nutrition: <NutritionTab profil={profil} seances={seances} />,
      progres: <ProgresTab seances={seances} />,
    }[onglet]
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-sky-50 via-slate-50 to-slate-50 text-slate-900">
      <div className="mx-auto max-w-2xl px-4 pb-28 pt-5 sm:px-6">
        <div className="flex items-center justify-between">
          <Link to="/maxence" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
            <ArrowLeft size={16} />
            Maxence
          </Link>
          <div className="flex gap-1">
            <button
              onClick={() => allerA('sources')}
              className={`rounded-full p-2.5 ${onglet === 'sources' ? 'bg-sky-600 text-white' : 'text-slate-500 hover:bg-white'}`}
              aria-label="Sources et méthode"
            >
              <BookOpen size={20} />
            </button>
            <button
              onClick={() => allerA('profil')}
              className={`rounded-full p-2.5 ${onglet === 'profil' ? 'bg-sky-600 text-white' : 'text-slate-500 hover:bg-white'}`}
              aria-label="Mon profil"
            >
              <UserRound size={20} />
            </button>
          </div>
        </div>

        <header className="mb-5 mt-3 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-2xl text-white shadow-lg shadow-indigo-500/25">🏃</span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Coach</h1>
            <p className="text-sm text-slate-500">{titre}</p>
          </div>
        </header>

        {erreur && <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{erreur}</p>}
        {contenu}
      </div>

      {!premiereFois && (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <ul className="mx-auto grid max-w-2xl grid-cols-5">
            {ONGLETS.map((o) => {
              const actif = o.id === onglet
              const Icone = o.icone
              return (
                <li key={o.id}>
                  <button onClick={() => allerA(o.id)} className={`flex w-full flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${actif ? 'text-sky-600' : 'text-slate-400'}`}>
                    <Icone size={22} strokeWidth={actif ? 2.4 : 2} />
                    {o.nom}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      )}

      {seance && <SeanceFenetre seance={seance} seances={seances} profil={profil} onClose={() => setOuverte(null)} onMaj={coach.majSeance} onSupprimer={coach.supprimerSeance} />}
    </div>
  )
}
