import { useState } from 'react'
import { Loader2, Pause, Play, Rabbit, RotateCcw, Square, Turtle, X } from 'lucide-react'
import { VITESSES, VOIX } from '../../config/lectureVoix.js'

// =============================================================
//  Appli « Lis-moi » : la barre de lecture (en bas de l'écran)
//  ▶ / ⏸, arrêt, vitesse, voix, et ce qui va être lu.
// =============================================================
export default function BarreLecture({ etat, resume, aSelection, onEffacerSelection, onPlay, onStop, onRevenir, reglages, changer, erreur }) {
  const [choixVoix, setChoixVoix] = useState(false)
  const voix = VOIX.find((v) => v.id === reglages.voix) || VOIX[0]
  const enCours = etat === 'lecture' || etat === 'pause' || etat === 'chargement'

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto mx-auto max-w-3xl">
        {erreur && (
          <p className="mb-2 rounded-2xl bg-rose-600 px-4 py-2.5 text-center text-sm font-medium text-white shadow-lg">{erreur}</p>
        )}

        {choixVoix && (
          <div className="mb-2 rounded-3xl border border-indigo-100 bg-white p-2 shadow-2xl shadow-indigo-950/15">
            <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-indigo-950/40">Choisis une voix</p>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {VOIX.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    changer({ voix: v.id })
                    setChoixVoix(false)
                    if (enCours) onStop()
                  }}
                  className={`rounded-2xl px-3 py-2.5 text-left transition ${
                    v.id === voix.id ? 'bg-indigo-600 text-white' : 'bg-indigo-50/60 text-indigo-950 hover:bg-indigo-100'
                  }`}
                >
                  <span className="block font-semibold">{v.nom}</span>
                  <span className={`block text-xs ${v.id === voix.id ? 'text-white/75' : 'text-indigo-950/50'}`}>{v.detail}</span>
                </button>
              ))}
            </div>
          </div>
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

          <div className="flex items-center gap-2">
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

            {/* Vitesse */}
            <div className="flex min-w-0 flex-1 rounded-full bg-indigo-50/80 p-1">
              {VITESSES.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    changer({ vitesse: v.id })
                    if (enCours) onStop()
                  }}
                  className={`flex min-w-0 flex-1 items-center justify-center gap-1 rounded-full px-2 py-2 text-sm font-semibold transition ${
                    reglages.vitesse === v.id ? 'bg-white text-indigo-700 shadow' : 'text-indigo-950/50'
                  }`}
                >
                  {v.id === 'lent' && <Turtle size={16} className="shrink-0" />}
                  {v.id === 'rapide' && <Rabbit size={16} className="shrink-0" />}
                  <span className={`truncate ${v.id === 'normal' ? '' : 'hidden sm:inline'}`}>{v.nom}</span>
                </button>
              ))}
            </div>

            {/* Voix */}
            <button
              onClick={() => setChoixVoix((c) => !c)}
              className={`flex h-12 shrink-0 items-center gap-2 rounded-full px-3 text-sm font-semibold transition ${
                choixVoix ? 'bg-indigo-600 text-white' : 'bg-indigo-50/80 text-indigo-800'
              }`}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-rose-400 text-xs font-bold text-white">
                {voix.nom[0]}
              </span>
              <span className="hidden sm:inline">{voix.nom}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
