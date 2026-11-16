import { useEffect } from 'react'
import { X } from 'lucide-react'

// =============================================================
//  Fenêtre de l'application Couture : monte du bas sur téléphone,
//  centrée sur ordinateur. Bord supérieur en Vichy.
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
      <div className="absolute inset-0 bg-pink-950/30 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={`couture-apparait relative w-full ${
          large ? 'sm:max-w-xl' : 'sm:max-w-md'
        } bg-[#fffafc] rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl max-h-[92dvh] overflow-y-auto overscroll-contain`}
      >
        <div className="vichy-fin h-3 rounded-t-[2rem]" />
        <div className="px-5 sm:px-7 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
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
