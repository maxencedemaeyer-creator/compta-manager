import { Link } from 'react-router-dom'
import { Lock, Plus, Settings, Users } from 'lucide-react'
import { usePin } from '../context/PinContext.jsx'
import { appsDuProfil } from '../config/apps.js'
import Signature from '../components/Signature.jsx'
import { trouverProfil } from '../config/profils.js'

// =============================================================
//  Page d'accueil d'un profil (/maxence, /julie…) : chaque tuile
//  ouvre une application. La liste est dans src/config/apps.js ;
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
  const { lock, parametres, profilId } = usePin()
  const profil = trouverProfil(profilId)
  const masquees = parametres.appsMasquees || []
  const apps = appsDuProfil(profil, parametres.appsOrdre).filter((a) => !masquees.includes(a.id))
  const date = new Date().toLocaleDateString('fr-BE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="min-h-dvh bg-creme text-emerald-950 relative overflow-hidden">
      {/* Formes douces en arrière-plan */}
      <div className="blob pointer-events-none absolute -top-32 -right-24 w-80 h-80 sm:w-[30rem] sm:h-[30rem] rounded-full bg-emerald-300/40 blur-3xl" />
      <div className="blob pointer-events-none absolute bottom-0 -left-32 w-80 h-80 rounded-full bg-douceur/50 blur-3xl" />

      <div className="relative max-w-3xl mx-auto px-5 sm:px-8 pt-5 sm:pt-10 pb-6 sm:pb-10 min-h-dvh flex flex-col">
        <div className="flex items-center justify-between">
          <p className="text-sm text-emerald-900/60 first-letter:uppercase">{date}</p>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="w-10 h-10 rounded-full bg-white/70 border border-emerald-900/10 flex items-center justify-center text-emerald-900/60 hover:text-emerald-900 hover:bg-white transition-colors"
              aria-label="Changer de profil"
              title="Changer de profil"
            >
              <Users size={16} />
            </Link>
            <button
              onClick={lock}
              className="w-10 h-10 rounded-full bg-white/70 border border-emerald-900/10 flex items-center justify-center text-emerald-900/60 hover:text-emerald-900 hover:bg-white transition-colors"
              aria-label="Verrouiller"
              title="Verrouiller"
            >
              <Lock size={16} />
            </button>
            <Link
              to={`/${profilId}/settings`}
              className="w-10 h-10 rounded-full bg-white/70 border border-emerald-900/10 flex items-center justify-center text-emerald-900/60 hover:text-emerald-900 hover:bg-white transition-colors"
              aria-label="Paramètres"
              title="Paramètres"
            >
              <Settings size={17} />
            </Link>
          </div>
        </div>

        {/* Nom */}
        <header className="mt-8 sm:mt-20 mb-7 sm:mb-16">
          <p className="text-base sm:text-lg text-emerald-900/60">{salutation()},</p>
          <h1 className="nom-profil font-display text-[3.5rem] leading-[1] sm:text-8xl font-semibold tracking-tight text-emerald-900">
            {profil?.nom}
            <span className={profil?.accent || 'text-emerald-500'}>.</span>
          </h1>
        </header>

        {/* Applications */}
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-900/40 mb-3 sm:mb-4">
          Applications
        </p>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {apps.map(({ to, nom, description, icon: Icon, couleur }) => (
            <Link
              key={to}
              to={to}
              className="tuile group flex flex-col items-start sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-3xl bg-white/80 backdrop-blur border border-emerald-900/5 p-4 sm:p-5 shadow-[0_1px_2px_rgba(6,78,59,0.04),0_8px_24px_-12px_rgba(6,78,59,0.18)] hover:bg-white hover:-translate-y-0.5 transition-all"
            >
              <span
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${couleur} flex items-center justify-center text-white shadow-md shrink-0 group-hover:scale-105 transition-transform`}
              >
                <Icon size={24} strokeWidth={2} />
              </span>
              <span className="min-w-0 w-full">
                <span className="block text-base sm:text-lg font-semibold text-emerald-950">{nom}</span>
                <span className="block text-xs sm:text-sm text-emerald-900/55 line-clamp-2 sm:line-clamp-none sm:truncate">
                  {description}
                </span>
              </span>
            </Link>
          ))}

          <div
            className={`tuile tuile-vide flex items-center gap-4 rounded-3xl border-2 border-dashed border-emerald-900/10 p-4 sm:p-5 ${
              apps.length % 2 === 0 ? 'col-span-2 sm:col-span-1' : ''
            }`}
          >
            <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-900/5 flex items-center justify-center text-emerald-900/30 shrink-0">
              <Plus size={24} />
            </span>
            <span>
              <span className="block text-base sm:text-lg font-semibold text-emerald-900/40">
                {apps.length === 0 ? 'Ton espace prend forme' : 'Bientôt'}
              </span>
              <span className="block text-xs sm:text-sm text-emerald-900/35">
                {apps.length === 0 ? 'Tes premières applications arrivent bientôt' : 'La prochaine application'}
              </span>
            </span>
          </div>
        </div>

        <Signature className="mt-auto pt-8 sm:pt-16" />
      </div>
    </div>
  )
}
