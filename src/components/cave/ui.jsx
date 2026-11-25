import { useEffect } from 'react'
import { Star, X } from 'lucide-react'

// Briques communes de l'application Cave (thème bordeaux / rosé)

export default function Feuille({ open, onClose, titre, children, large = false }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-rose-950/50" onClick={onClose} />
      <div
        className={`relative w-full ${large ? 'sm:max-w-xl' : 'sm:max-w-md'} bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl max-h-[92dvh] overflow-y-auto overscroll-contain`}
      >
        <div className="sm:hidden mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-rose-100" />
        <div className="px-5 sm:px-7 pt-3 sm:pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between mb-4 gap-3">
            <h2 className="text-2xl font-bold text-rose-950 leading-tight">{titre}</h2>
            <button
              onClick={onClose}
              className="w-9 h-9 shrink-0 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 flex items-center justify-center"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

export const champ =
  'w-full rounded-2xl border border-rose-900/15 bg-white px-4 py-3 text-[15px] text-rose-950 placeholder:text-rose-900/35 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent'
export const bouton =
  'inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-700 hover:bg-rose-800 active:bg-rose-900 text-white font-semibold px-5 py-3.5 transition-colors disabled:opacity-50'
export const boutonDoux =
  'inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-800 font-semibold px-4 py-3 transition-colors disabled:opacity-50'
export const pastille = (actif) =>
  `shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
    actif ? 'bg-rose-700 text-white' : 'bg-white text-rose-900/70 border border-rose-900/10 hover:bg-rose-50'
  }`

export function Etiquette({ children, className = '' }) {
  return <span className={`block text-sm font-semibold text-rose-950/80 mb-1.5 ${className}`}>{children}</span>
}

export function Etoiles({ valeur = 0, onChange, taille = 22 }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(valeur === n ? 0 : n)}
          className={onChange ? 'p-0.5 active:scale-90 transition-transform' : 'p-0'}
          aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
        >
          <Star size={taille} className={n <= valeur ? 'fill-amber-400 text-amber-400' : 'text-rose-200'} />
        </button>
      ))}
    </span>
  )
}

export const COULEUR_PUCE = {
  R: 'bg-rose-100 text-rose-800',
  B: 'bg-amber-100 text-amber-800',
  P: 'bg-pink-100 text-pink-700',
  E: 'bg-yellow-100 text-yellow-800',
  D: 'bg-orange-100 text-orange-800',
  F: 'bg-stone-200 text-stone-800',
}

export const STATUT_GARDE = {
  jeune: { label: 'Trop jeune', classe: 'bg-sky-100 text-sky-800' },
  boire: { label: 'À boire', classe: 'bg-emerald-100 text-emerald-800' },
  vite: { label: 'À boire bientôt', classe: 'bg-amber-100 text-amber-800' },
  passe: { label: 'Passé', classe: 'bg-stone-200 text-stone-700' },
  nv: { label: '', classe: '' },
}

export function aujourdhui() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
