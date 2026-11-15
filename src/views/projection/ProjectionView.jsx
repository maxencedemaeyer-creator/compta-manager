import { Link } from 'react-router-dom'
import { ArrowLeft, Camera, ChevronRight, Images, MonitorPlay, Projector } from 'lucide-react'

// =============================================================
//  Application Projection : page d'accueil
//  - /projection/photo  → sur le téléphone (prendre et envoyer)
//  - /projection/ecran  → sur l'ordinateur de la classe (TBI)
//  - /projection/galerie → revoir / supprimer les photos
// =============================================================
const ENTREES = [
  {
    to: '/projection/photo',
    titre: 'Prendre une photo',
    texte: 'Sur le téléphone : photographie et envoie à l’écran',
    icon: Camera,
    couleur: 'from-amber-400 to-orange-500',
  },
  {
    to: '/projection/ecran',
    titre: 'Écran de projection',
    texte: 'Sur l’ordinateur de la classe : affiche la dernière photo',
    icon: MonitorPlay,
    couleur: 'from-violet-500 to-indigo-600',
  },
  {
    to: '/projection/galerie',
    titre: 'Galerie',
    texte: 'Revoir, reprojeter ou supprimer les anciennes photos',
    icon: Images,
    couleur: 'from-sky-400 to-cyan-600',
  },
]

export default function ProjectionView() {
  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 right-0 w-96 h-96 rounded-full bg-violet-600/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -left-32 w-80 h-80 rounded-full bg-amber-500/15 blur-3xl" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-8 py-6 sm:py-12">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors">
          <ArrowLeft size={16} />
          Maxence
        </Link>

        <div className="mt-8 mb-8 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-amber-400 flex items-center justify-center shadow-lg shrink-0">
            <Projector size={28} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">Projection</h1>
            <p className="text-white/60 text-sm mt-1">Une photo prise en classe, aussitôt au tableau.</p>
          </div>
        </div>

        <div className="grid gap-3">
          {ENTREES.map(({ to, titre, texte, icon: Icon, couleur }) => (
            <Link
              key={to}
              to={to}
              className="group rounded-3xl bg-white/[0.06] border border-white/10 p-4 sm:p-5 hover:bg-white/[0.1] transition-colors flex items-center gap-4"
            >
              <span className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${couleur} flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform`}>
                <Icon size={26} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-lg">{titre}</p>
                <p className="text-sm text-white/55">{texte}</p>
              </div>
              <ChevronRight className="text-white/30 group-hover:text-white/70 transition-colors" />
            </Link>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/60 leading-relaxed">
          <p className="font-medium text-white/80 mb-1">Astuce</p>
          Ouvre <span className="text-white">Prendre une photo</span> sur ton téléphone et ajoute-la à l’écran
          d’accueil (« Partager » → « Sur l’écran d’accueil »). Sur l’ordinateur de la classe, garde
          <span className="text-white"> Écran de projection</span> en favori ou sur le bureau.
        </div>
      </div>
    </div>
  )
}
