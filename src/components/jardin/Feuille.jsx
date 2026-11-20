import { useEffect } from 'react'
import { X } from 'lucide-react'

// =============================================================
//  Fenêtre de l'application Mon jardin : monte du bas sur téléphone,
//  centrée sur ordinateur. Fond blanc, accents verts.
// =============================================================
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
      <div className="absolute inset-0 bg-emerald-950/40" onClick={onClose} />
      <div
        className={`relative w-full ${
          large ? 'sm:max-w-xl' : 'sm:max-w-md'
        } bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl max-h-[92dvh] overflow-y-auto overscroll-contain`}
      >
        <div className="sm:hidden mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-emerald-100" />
        <div className="px-5 sm:px-7 pt-3 sm:pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between mb-4 gap-3">
            <h2 className="text-2xl font-bold text-emerald-950 leading-tight">{titre}</h2>
            <button
              onClick={onClose}
              className="w-9 h-9 shrink-0 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center"
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

export const champClass =
  'w-full rounded-2xl border border-emerald-900/15 bg-white px-4 py-3 text-[15px] text-emerald-950 placeholder:text-emerald-900/35 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent'
export const boutonPrincipal =
  'inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold px-5 py-3.5 transition-colors disabled:opacity-50'
export const boutonSecondaire =
  'inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold px-5 py-3.5 transition-colors disabled:opacity-50'
