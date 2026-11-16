import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { PROFILS } from '../config/profils.js'
import Signature from '../components/Signature.jsx'

// =============================================================
//  Écran d'entrée du site (/) : on choisit son profil,
//  puis le code PIN de ce profil est demandé.
//  La liste des profils est dans src/config/profils.js.
// =============================================================
export default function ChoixProfilView() {
  return (
    <div className="min-h-dvh bg-creme text-emerald-950 relative overflow-hidden">
      {/* Formes douces en arrière-plan */}
      <div className="blob pointer-events-none absolute -top-32 -right-24 w-80 h-80 sm:w-[30rem] sm:h-[30rem] rounded-full bg-emerald-300/40 blur-3xl" />
      <div className="blob pointer-events-none absolute bottom-0 -left-32 w-80 h-80 rounded-full bg-rose-200/50 blur-3xl" />

      <div className="relative max-w-xl mx-auto px-5 sm:px-8 pt-14 sm:pt-24 pb-6 sm:pb-10 min-h-dvh flex flex-col">
        <header className="mb-10 sm:mb-14">
          <p className="text-lg text-emerald-900/60">Bienvenue,</p>
          <h1 className="font-display text-[3.25rem] leading-[0.95] sm:text-7xl font-semibold tracking-tight text-emerald-900">
            Qui est là<span className="text-emerald-500"> ?</span>
          </h1>
        </header>

        <div className="space-y-3 sm:space-y-4">
          {PROFILS.map((p) => (
            <Link
              key={p.id}
              to={`/${p.id}`}
              className="group flex items-center gap-4 rounded-3xl bg-white/80 backdrop-blur border border-emerald-900/5 p-4 sm:p-5 shadow-[0_1px_2px_rgba(6,78,59,0.04),0_8px_24px_-12px_rgba(6,78,59,0.18)] hover:bg-white hover:-translate-y-0.5 transition-all"
            >
              <span
                className={`w-16 h-16 rounded-full bg-gradient-to-br ${p.couleur} flex items-center justify-center text-white text-2xl font-display font-semibold shadow-md shrink-0 group-hover:scale-105 transition-transform`}
              >
                {p.nom.charAt(0)}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-xl font-semibold text-emerald-950">{p.nom}</span>
                <span className="block text-sm text-emerald-900/50">/{p.id}</span>
              </span>
              <ChevronRight size={20} className="text-emerald-900/30 group-hover:text-emerald-900/60 transition-colors" />
            </Link>
          ))}
        </div>

        <p className="mt-auto pt-10 text-center text-xs text-emerald-900/35">Chaque espace est protégé par son propre code PIN</p>
        <Signature className="mt-2" />
      </div>
    </div>
  )
}
