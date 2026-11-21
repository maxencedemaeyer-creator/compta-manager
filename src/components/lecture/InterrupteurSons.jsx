import { Loader2 } from 'lucide-react'
import { chargerDictionnaireSons } from '../../utils/phonemes.js'

// =============================================================
//  Appli « Lis-moi » : interrupteur « Sons en couleur »
//  (comme « Aide à la lecture » de la valise de Lola sur l'autre site)
//  Réglage mémorisé sur l'appareil (spécification de Max, 20/11) ; aussi dans le panneau Aa.
// =============================================================
const PASTILLES = ['#e65100', '#4f6d0c', '#a61e8c'] // an, in, é

export default function InterrupteurSons({ actif, chargement, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      aria-label="Sons en couleur"
      title="Sons en couleur"
      onClick={() => onChange(!actif)}
      onPointerEnter={() => void chargerDictionnaireSons().catch(() => {})}
      className={`flex h-11 shrink-0 items-center gap-2 rounded-full pl-3 pr-2 font-semibold shadow-sm ring-1 transition ${
        actif ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-white/90 text-indigo-800 ring-indigo-950/5'
      }`}
    >
      <span className="flex -space-x-1" aria-hidden="true">
        {PASTILLES.map((c) => (
          <span key={c} className="h-3.5 w-3.5 rounded-full ring-2 ring-white" style={{ background: c }} />
        ))}
      </span>
      <span className="hidden text-sm md:inline">Sons en couleur</span>
      <span className="hidden text-sm sm:inline md:hidden">Sons</span>
      <span
        className={`relative flex h-6 w-10 items-center rounded-full transition ${actif ? 'bg-white/30' : 'bg-indigo-100'}`}
        aria-hidden="true"
      >
        <span
          className={`absolute flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition-all ${actif ? 'left-[1.125rem]' : 'left-0.5'}`}
        >
          {chargement && <Loader2 size={12} className="animate-spin text-indigo-600" />}
        </span>
      </span>
    </button>
  )
}
