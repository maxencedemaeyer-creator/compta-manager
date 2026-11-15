import { Link } from 'react-router-dom'
import { Lock, Plus, Settings } from 'lucide-react'
import { usePin } from '../context/PinContext.jsx'
import { appsOrdonnees } from '../config/apps.js'

// =============================================================
//  Page d'accueil "Maxence" : chaque tuile ouvre une application.
//  La liste des applications est dans src/config/apps.js ;
//  l'ordre et la visibilité se règlent dans Paramètres.
// =============================================================

function salutation() {
  const h = new Date().getHours()
  if (h < 5) return 'Bonne nuit'
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

export default function HomeView() {
  const { lock, parametres } = usePin()
  const masquees = parametres.appsMasquees || []
  const apps = appsOrdonnees(parametres.appsOrdre).filter((a) => !masquees.includes(a.id))
  const date = new Date().toLocaleDateString('fr-BE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="min-h-screen bg-[#f4f1ea] text-emerald-950 relative overflow-hidden">
      {/* Formes douces en arrière-plan */}
      <div className="pointer-events-none absolute -top-32 -right-24 w-80 h-80 sm:w-[30rem] sm:h-[30rem] rounded-full bg-emerald-300/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -left-32 w-80 h-80 rounded-full bg-amber-200/50 blur-3xl" />

      <div className="relative max-w-3xl mx-auto px-5 sm:px-8 pt-6 sm:pt-10 pb-16 min-h-screen flex flex-col">
        <div className="flex items-center justify-between">
          <p className="text-sm text-emerald-900/60 first-letter:uppercase">{date}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={lock}
              className="w-10 h-10 rounded-full bg-white/70 border border-emerald-900/10 flex items-center justify-center text-emerald-900/60 hover:text-emerald-900 hover:bg-white transition-colors"
              aria-label="Verrouiller"
              title="Verrouiller"
            >
              <Lock size={16} />
            </button>
            <Link
              to="/settings"
              className="w-10 h-10 rounded-full bg-white/70 border border-emerald-900/10 flex items-center justify-center text-emerald-900/60 hover:text-emerald-900 hover:bg-white transition-colors"
              aria-label="Paramètres"
              title="Paramètres"
            >
              <Settings size={17} />
            </Link>
          </div>
        </div>

        {/* Nom */}
        <header className="mt-14 sm:mt-20 mb-12 sm:mb-16">
          <p className="text-lg text-emerald-900/60">{salutation()},</p>
          <h1 className="font-display text-[3.75rem] leading-[0.95] sm:text-8xl font-semibold tracking-tight text-emerald-900">
            Maxence<span className="text-emerald-500">.</span>
          </h1>
        </header>

        {/* Applications */}
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-900/40 mb-4">
          Applications
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {apps.map(({ to, nom, description, icon: Icon, couleur }) => (
            <Link
              key={to}
              to={to}
              className="group flex items-center gap-4 rounded-3xl bg-white/80 backdrop-blur border border-emerald-900/5 p-4 sm:p-5 shadow-[0_1px_2px_rgba(6,78,59,0.04),0_8px_24px_-12px_rgba(6,78,59,0.18)] hover:bg-white hover:-translate-y-0.5 transition-all"
            >
              <span
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${couleur} flex items-center justify-center text-white shadow-md shrink-0 group-hover:scale-105 transition-transform`}
              >
                <Icon size={26} strokeWidth={2} />
              </span>
              <span className="min-w-0">
                <span className="block text-lg font-semibold text-emerald-950">{nom}</span>
                <span className="block text-sm text-emerald-900/55 truncate">{description}</span>
              </span>
            </Link>
          ))}

          <div className="flex items-center gap-4 rounded-3xl border-2 border-dashed border-emerald-900/10 p-4 sm:p-5">
            <span className="w-14 h-14 rounded-2xl bg-emerald-900/5 flex items-center justify-center text-emerald-900/30 shrink-0">
              <Plus size={24} />
            </span>
            <span>
              <span className="block text-lg font-semibold text-emerald-900/40">Bientôt</span>
              <span className="block text-sm text-emerald-900/35">La prochaine application</span>
            </span>
          </div>
        </div>

        <p className="mt-auto pt-16 text-center text-xs text-emerald-900/30">maxence · espace personnel</p>
      </div>
    </div>
  )
}
