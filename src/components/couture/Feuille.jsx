import { useEffect } from 'react'
import { X } from 'lucide-react'

// =============================================================
//  Fenêtre de l'application Couture : monte du bas sur téléphone,
//  centrée sur ordinateur, sur le fond Vichy pastel.
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
      <div className="absolute inset-0 bg-pink-950/35" onClick={onClose} />
      <div
        className={`couture-apparait relative w-full ${
          large ? 'sm:max-w-xl' : 'sm:max-w-md'
        } vichy-doux rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl max-h-[92dvh] overflow-y-auto overscroll-contain`}
      >
        <div className="sm:hidden mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-pink-200" />
        <div className="couture-app px-5 sm:px-7 pt-3 sm:pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between mb-4 gap-3">
            <h2 className="couture-titre text-3xl text-pink-950 leading-tight">{titre}</h2>
            <button
              onClick={onClose}
              className="w-9 h-9 shrink-0 rounded-full bg-pink-50 text-pink-400 hover:text-pink-700 hover:bg-pink-100 flex items-center justify-center"
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
