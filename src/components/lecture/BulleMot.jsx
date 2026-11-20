import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Check, Pencil, Volume2, X } from 'lucide-react'

// =============================================================
//  Appli « Lis-moi » : petite bulle au-dessus du mot touché
//  🔊 écouter ce mot · « Phrase » (choisir et lire la phrase) · ✏️ corriger ce mot
// =============================================================
export default function BulleMot({ mot, ancre, onEcouterMot, onPhrase, onCorriger, onFermer }) {
  const [edition, setEdition] = useState(null)
  const [pos, setPos] = useState(null)
  const bulle = useRef(null)

  // Position : au-dessus du mot (ou en dessous s'il n'y a pas la place)
  useLayoutEffect(() => {
    if (!ancre || !bulle.current) return
    const r = ancre.getBoundingClientRect()
    const b = bulle.current.getBoundingClientRect()
    const marge = 10
    let top = r.top - b.height - marge
    const dessous = top < 70
    if (dessous) top = r.bottom + marge
    const left = Math.min(window.innerWidth - b.width - 8, Math.max(8, r.left + r.width / 2 - b.width / 2))
    setPos({ top, left, dessous })
  }, [ancre, edition])

  // On fait défiler la page : la bulle disparaît
  useEffect(() => {
    if (edition !== null) return
    const fermer = () => onFermer()
    window.addEventListener('scroll', fermer, { passive: true, once: true })
    return () => window.removeEventListener('scroll', fermer)
  }, [onFermer, edition])

  const valider = () => {
    const v = edition.trim()
    if (v && v !== mot.texte) onCorriger(v)
    else onFermer()
  }

  return (
    <div
      ref={bulle}
      className="fixed z-30 rounded-2xl bg-indigo-950 p-1.5 text-white shadow-2xl shadow-indigo-950/40"
      style={pos ? { top: pos.top, left: pos.left } : { top: -999, left: -999 }}
      onClick={(e) => e.stopPropagation()}
    >
      {edition === null ? (
        <div className="flex items-center gap-1">
          <button onClick={onEcouterMot} className="flex h-11 items-center gap-1.5 rounded-xl px-3 font-semibold active:bg-white/15" aria-label="Écouter ce mot">
            <Volume2 size={20} /> Mot
          </button>
          <button onClick={onPhrase} className="flex h-11 items-center rounded-xl bg-white/10 px-3 font-semibold active:bg-white/20">
            Phrase
          </button>
          <button onClick={() => setEdition(mot.texte)} className="flex h-11 w-11 items-center justify-center rounded-xl active:bg-white/15" aria-label="Corriger ce mot">
            <Pencil size={18} />
          </button>
        </div>
      ) : (
        <form
          className="flex items-center gap-1"
          onSubmit={(e) => {
            e.preventDefault()
            valider()
          }}
        >
          <input
            autoFocus
            value={edition}
            onChange={(e) => setEdition(e.target.value)}
            className="h-11 w-44 rounded-xl bg-white px-3 text-lg text-indigo-950 outline-none"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <button type="submit" className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500" aria-label="Valider">
            <Check size={20} />
          </button>
          <button type="button" onClick={onFermer} className="flex h-11 w-11 items-center justify-center rounded-xl active:bg-white/15" aria-label="Annuler">
            <X size={20} />
          </button>
        </form>
      )}
      {/* petite pointe vers le mot */}
      {pos && !pos.dessous && (
        <span className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-8 border-t-8 border-x-transparent border-t-indigo-950" />
      )}
    </div>
  )
}
