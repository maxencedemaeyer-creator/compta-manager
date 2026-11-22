import { Loader2, Pause, Play, RotateCcw, Square, X } from 'lucide-react'

// =============================================================
//  Appli « Lis-moi » : la barre de lecture (en bas de l'écran)
//  ⟲, ▶ / ⏸, arrêt, et ce qui va être lu.
//  (La vitesse se règle dans le panneau « Aa » ; pas de choix de voix : décision de Max,
//  voix fixée dans config/lectureVoix.js)
// =============================================================
export default function BarreLecture({ etat, resume, aSelection, onEffacerSelection, onPlay, onStop, onRevenir, erreur, preparationVoix = null }) {
  const enCours = etat === 'lecture' || etat === 'pause' || etat === 'chargement'

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto mx-auto max-w-3xl">
        {preparationVoix !== null && (
          <div className="mb-2 rounded-2xl bg-indigo-950/90 px-4 py-2.5 text-sm text-white shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <span>Je prépare la voix… (la première fois seulement)</span>
              <span className="font-semibold">{preparationVoix} %</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-violet-400 transition-[width]" style={{ width: `${Math.max(3, preparationVoix)}%` }} />
            </div>
          </div>
        )}
        {erreur && (
          <p className="mb-2 rounded-2xl bg-rose-600 px-4 py-2.5 text-center text-sm font-medium text-white shadow-lg">{erreur}</p>
        )}

        <div className="rounded-[2rem] border border-white/70 bg-white/90 p-2.5 shadow-2xl shadow-indigo-950/20 backdrop-blur-xl">
          {/* Ce qui sera lu */}
          <div className="flex items-center justify-between gap-2 px-2 pb-2">
            <p className="min-w-0 truncate text-sm text-indigo-950/60">
              {aSelection ? <span className="font-semibold text-sky-700">{resume}</span> : resume}
            </p>
            {aSelection && (
              <button
                onClick={onEffacerSelection}
                className="flex shrink-0 items-center gap-1 rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-800 active:bg-sky-200"
              >
                <X size={13} /> Tout le texte
              </button>
            )}
          </div>

          <div className="flex items-center justify-center gap-3">
            {/* Revenir à la phrase précédente */}
            {enCours && (
              <button
                onClick={onRevenir}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-700 active:bg-indigo-100"
                aria-label="Revenir à la phrase précédente"
                title="Revenir en arrière"
              >
                <RotateCcw size={20} />
              </button>
            )}
            {/* Lecture / pause */}
            <button
              onClick={onPlay}
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-600/40 transition active:scale-95"
              aria-label={etat === 'lecture' ? 'Pause' : 'Lire'}
            >
              {etat === 'chargement' ? (
                <Loader2 size={30} className="animate-spin" />
              ) : etat === 'lecture' ? (
                <Pause size={30} fill="currentColor" />
              ) : (
                <Play size={30} fill="currentColor" className="ml-1" />
              )}
            </button>
            {enCours && (
              <button
                onClick={onStop}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-700 active:bg-indigo-100"
                aria-label="Arrêter"
              >
                <Square size={18} fill="currentColor" />
              </button>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
