import { Check } from 'lucide-react'

// =============================================================
//  Éléments de la colonne de choix de l'ATLAS (série Europe)
//  Même présentation que la série Monde : rond = un seul choix,
//  carré = plusieurs choix possibles.
// =============================================================
export function Titre({ children }) {
  return <h2 className="px-2 pt-3 pb-0.5 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{children}</h2>
}

export function Ligne({ actif, onClick, titre, aide, carre = false, pastille }) {
  return (
    <button
      type="button"
      role={carre ? 'checkbox' : 'radio'}
      aria-checked={actif}
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 rounded-lg px-2 py-1 text-left transition ${actif ? 'bg-sky-50' : 'hover:bg-slate-50'}`}
    >
      <span
        className={`w-[18px] h-[18px] shrink-0 flex items-center justify-center border-2 ${carre ? 'rounded' : 'rounded-full'} ${
          actif ? 'bg-sky-600 border-sky-600 text-white' : 'border-slate-300 bg-white'
        }`}
      >
        {actif && <Check size={12} strokeWidth={4} />}
      </span>
      <span className="leading-tight min-w-0 flex-1">
        <span className={`block text-[15px] ${actif ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>{titre}</span>
        {aide && <span className="block text-[11px] text-slate-500">{aide}</span>}
      </span>
      {pastille && <span className="w-4 h-4 shrink-0 rounded-sm border border-black/10" style={{ background: pastille }} />}
    </button>
  )
}

// Une ligne de légende : une couleur et ce qu'elle veut dire (pas cliquable)
export function Legende({ couleur, titre, aide, nombre }) {
  return (
    <div className="flex items-center gap-2.5 px-2 py-1">
      <span className="w-[18px] h-[18px] shrink-0 rounded border border-black/10" style={{ background: couleur }} />
      <span className="leading-tight min-w-0 flex-1">
        <span className="block text-[15px] font-bold text-slate-900">{titre}</span>
        {aide && <span className="block text-[11px] text-slate-500">{aide}</span>}
      </span>
      {nombre !== undefined && <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[12px] font-black text-slate-700">{nombre}</span>}
    </div>
  )
}

export function Explication({ titre, texte, children }) {
  return (
    <div className="mx-1 mt-3 rounded-xl bg-slate-50 border border-slate-200 p-3">
      {titre && <p className="text-[15px] font-black text-slate-900">{titre}</p>}
      {texte && <p className="mt-1 text-[13px] leading-snug text-slate-700">{texte}</p>}
      {children}
    </div>
  )
}

// Liste dépliable (noms de pays)
export function Liste({ titre, texte }) {
  return (
    <details className="mx-2 mt-1 group">
      <summary className="cursor-pointer select-none text-[12px] font-semibold text-sky-700 hover:text-sky-900">{titre}</summary>
      <p className="mt-1 text-[12px] leading-snug text-slate-600">{texte}</p>
    </details>
  )
}
