import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Check, Pencil, Play, Volume2, X } from 'lucide-react'

// =============================================================
//  Appli « Lis-moi » : petite bulle au-dessus du mot touché
//  Un mot   : 🔊 écouter ce mot · « Phrase » (choisir et lire la phrase)
//             · « D'ici » (lire jusqu'à la fin) · ✏️ corriger ce mot
//  Un passage (après un glissement) : ▶ Lire le passage
// =============================================================
export default function BulleMot({ mot, ancre, passage = false, onLirePassage, onLireDIci, onEcouterMot, onPhrase, onCorriger, onFermer }) {
  const [edition, setEdition] = useState(null)
  const [pos, setPos] = useState(null)
  const bulle = useRef(null)

  // Position : au-dessus du mot (ou en dessous s'il n'y a pas la place)
  useLayoutEffect(() => {
    if (!ancre || !bulle.current) return
    const r = ancre.getBoundingClientRect()
    const b = bulle.current.getBoundingClientRect()
    const marge = 10
    // un passage : bulle sous le dernier mot (pour ne pas cacher le texte choisi)
    let dessous = passage ? r.bottom + marge + b.height < window.innerHeight - 190 : r.top - b.height - marge < 70
    if (passage && !dessous && r.top - b.height - marge < 70) dessous = true
    const top = dessous ? r.bottom + marge : r.top - b.height - marge
    const left = Math.min(window.innerWidth - b.width - 8, Math.max(8, r.left + r.width / 2 - b.width / 2))
    setPos({ top, left, dessous })
  }, [ancre, edition, passage])

  // On fait défiler la page : la bulle disparaît
  useEffect(() => {
    if (edition !== null) return
    const fermer = () => onFermer()
    window.addEventListener('scroll', fermer, { passive: true, once: true })
    return () => window.removeEventListener('scroll', fermer)
  }, [onFermer, edition])

  const valider = () => {
    const v = edition.trim()
    // case vide = supprimer le mot (ex. une lettre qui n'existe pas, lue par erreur sur la photo)
    if (v !== mot.texte) onCorriger(v)
    else onFermer()
  }

  return (
    <div
      ref={bulle}
      className="fixed z-30 rounded-2xl bg-indigo-950 p-1.5 text-white shadow-2xl shadow-indigo-950/40"
      style={pos ? { top: pos.top, left: pos.left } : { top: -999, left: -999 }}
      onClick={(e) => e.stopPropagation()}
    >
      {passage ? (
        <div className="flex items-center gap-1">
          <button onClick={onLirePassage} className="flex h-11 items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-4 font-semibold">
            <Play size={18} fill="currentColor" /> Lire le passage
          </button>
          <button onClick={onFermer} className="flex h-11 w-11 items-center justify-center rounded-xl active:bg-white/15" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
      ) : edition === null ? (
        <div className="flex items-center gap-1">
          <button onClick={onEcouterMot} className="flex h-11 items-center gap-1.5 rounded-xl px-3 font-semibold active:bg-white/15" aria-label="Écouter ce mot">
            <Volume2 size={20} /> Mot
          </button>
          <button onClick={onPhrase} className="flex h-11 items-center rounded-xl bg-white/10 px-3 font-semibold active:bg-white/20">
            Phrase
          </button>
          <button onClick={onLireDIci} className="flex h-11 items-center gap-1.5 rounded-xl px-3 font-semibold active:bg-white/15" aria-label="Lire à partir d'ici">
            <Play size={16} fill="currentColor" /> D’ici
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
            placeholder="Vide = supprimer"
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
      {pos && pos.dessous && (
        <span className="absolute bottom-full left-1/2 h-0 w-0 -translate-x-1/2 border-x-8 border-b-8 border-x-transparent border-b-indigo-950" />
      )}
    </div>
  )
}
