import { useEffect, useState } from 'react'
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

// Niveaux de densité des tuiles : hauteur, largeur mini, tailles.
const NIVEAUX = [
  { id: 'normal', h: 84, minW: 240, icone: 'w-14 h-14', ico: 24, pad: 'p-3.5', titre: 'text-lg', desc: true },
  { id: 'compact', h: 64, minW: 210, icone: 'w-10 h-10', ico: 20, pad: 'p-3', titre: 'text-base', desc: true },
  { id: 'dense', h: 50, minW: 175, icone: 'w-8 h-8', ico: 16, pad: 'p-2.5', titre: 'text-sm', desc: false },
]
const GAP = 12
const HAUTEUR_FIXE = 300 // date + nom + libellé + signature + marges
const MAX_PLACEHOLDER = 12 // au-delà, on n'affiche plus la tuile « Bientôt »

function useViewport() {
  const lire = () => ({ w: window.innerWidth, h: window.innerHeight })
  const [vp, setVp] = useState(lire)
  useEffect(() => {
    const maj = () => setVp(lire())
    window.addEventListener('resize', maj)
    return () => window.removeEventListener('resize', maj)
  }, [])
  return vp
}

// Choisit le niveau de densité et le nombre de colonnes pour que
// n tuiles tiennent dans l'écran (sinon, le moins mauvais compromis).
function calculerGrille(n, { w, h }) {
  if (w < 640) return { cols: 2, niveau: null }
  const dispo = h - HAUTEUR_FIXE
  const largeur = w - 64
  let dernier = null
  for (const niveau of NIVEAUX) {
    const maxCols = Math.max(2, Math.floor((largeur + GAP) / (niveau.minW + GAP)))
    dernier = { cols: maxCols, niveau }
    for (let cols = Math.min(2, maxCols); cols <= maxCols; cols++) {
      const rows = Math.ceil(n / cols)
      if (rows * niveau.h + (rows - 1) * GAP <= dispo) return { cols, niveau }
    }
  }
  return dernier
}

export default function HomeView() {
  const vp = useViewport()
  const { lock, parametres, profilId } = usePin()
  const profil = trouverProfil(profilId)
  const masquees = parametres.appsMasquees || []
  const apps = appsDuProfil(profil, parametres.appsOrdre).filter((a) => !masquees.includes(a.id))
  const date = new Date().toLocaleDateString('fr-BE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const placeholder = apps.length < MAX_PLACEHOLDER
  const { cols, niveau } = calculerGrille(apps.length + (placeholder ? 1 : 0), vp)

  return (
    <div className="min-h-dvh bg-creme text-emerald-950 relative overflow-hidden">
      {/* Formes douces en arrière-plan */}
      <div className="blob pointer-events-none absolute -top-32 -right-24 w-80 h-80 sm:w-[30rem] sm:h-[30rem] rounded-full bg-emerald-300/40 blur-3xl" />
      <div className="blob pointer-events-none absolute bottom-0 -left-32 w-80 h-80 rounded-full bg-douceur/50 blur-3xl" />

      <div style={{ maxWidth: niveau ? Math.max(768, cols * (niveau.minW + 40)) : 768 }} className="relative mx-auto w-full px-5 sm:px-8 pt-5 sm:pt-6 pb-4 sm:pb-6 min-h-dvh flex flex-col">
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
        <header className="mt-8 sm:mt-6 lg:mt-4 mb-7 sm:mb-6 lg:mb-5">
          <p className="text-base sm:text-lg text-emerald-900/60">{salutation()},</p>
          <h1 className="nom-profil font-display text-[3.5rem] leading-[1] sm:text-7xl lg:text-6xl font-semibold tracking-tight text-emerald-900">
            {profil?.nom}
            <span className={profil?.accent || 'text-emerald-500'}>.</span>
          </h1>
        </header>

        {/* Applications */}
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-900/40 mb-3 sm:mb-3">
          Applications
        </p>
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {apps.map(({ to, nom, description, icon: Icon, couleur }) =>
            niveau ? (
              <Link
                key={to}
                to={to}
                className={`tuile group flex items-center gap-3 rounded-2xl bg-white/80 backdrop-blur border border-emerald-900/5 ${niveau.pad} shadow-[0_1px_2px_rgba(6,78,59,0.04),0_8px_24px_-12px_rgba(6,78,59,0.18)] hover:bg-white hover:-translate-y-0.5 transition-all`}
              >
                <span
                  className={`${niveau.icone} rounded-xl bg-gradient-to-br ${couleur} flex items-center justify-center text-white shadow-md shrink-0 group-hover:scale-105 transition-transform`}
                >
                  <Icon size={niveau.ico} strokeWidth={2} />
                </span>
                <span className="min-w-0 w-full">
                  <span className={`block ${niveau.titre} font-semibold text-emerald-950 truncate`}>{nom}</span>
                  {niveau.desc && (
                    <span className="block text-xs text-emerald-900/55 truncate">{description}</span>
                  )}
                </span>
              </Link>
            ) : (
              <Link
                key={to}
                to={to}
                className="tuile group flex flex-col items-start gap-3 rounded-3xl bg-white/80 backdrop-blur border border-emerald-900/5 p-4 shadow-[0_1px_2px_rgba(6,78,59,0.04),0_8px_24px_-12px_rgba(6,78,59,0.18)] hover:bg-white hover:-translate-y-0.5 transition-all"
              >
                <span
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${couleur} flex items-center justify-center text-white shadow-md shrink-0 group-hover:scale-105 transition-transform`}
                >
                  <Icon size={24} strokeWidth={2} />
                </span>
                <span className="min-w-0 w-full">
                  <span className="block text-base font-semibold text-emerald-950">{nom}</span>
                  <span className="block text-xs text-emerald-900/55 line-clamp-2">{description}</span>
                </span>
              </Link>
            ),
          )}

          {placeholder && (
            <div
              className={`tuile tuile-vide flex items-center gap-3 rounded-2xl border-2 border-dashed border-emerald-900/10 ${
                niveau ? niveau.pad : 'p-4'
              } ${!niveau && apps.length % 2 === 0 ? 'col-span-2' : ''}`}
            >
              <span
                className={`${niveau ? niveau.icone : 'w-12 h-12'} rounded-xl bg-emerald-900/5 flex items-center justify-center text-emerald-900/30 shrink-0`}
              >
                <Plus size={niveau ? niveau.ico : 24} />
              </span>
              <span className="min-w-0">
                <span className={`block ${niveau ? niveau.titre : 'text-base'} font-semibold text-emerald-900/40 truncate`}>
                  {apps.length === 0 ? 'Ton espace prend forme' : 'Bientôt'}
                </span>
                {(!niveau || niveau.desc) && (
                  <span className="block text-xs text-emerald-900/35 truncate">
                    {apps.length === 0 ? 'Tes premières applications arrivent bientôt' : 'La prochaine application'}
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        <Signature className="mt-auto pt-6 sm:pt-6" />
      </div>
    </div>
  )
}
