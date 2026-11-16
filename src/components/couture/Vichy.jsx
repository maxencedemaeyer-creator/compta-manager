// =============================================================
//  Habillage de l'application Couture : motif Vichy blanc / rose pastel
//  en fond de toutes les pages (.vichy-doux),
//  coutures en pointillés, titres en serif italique.
//  <StylesCouture /> est à placer une fois en haut de chaque page.
// =============================================================
const STYLES = `
.vichy {
  background-color: #fff;
  background-image:
    linear-gradient(90deg, rgba(244,114,182,.11) 50%, transparent 50%),
    linear-gradient(rgba(244,114,182,.11) 50%, transparent 50%);
  background-size: 30px 30px;
}
.vichy-fin {
  background-color: #fff;
  background-image:
    linear-gradient(90deg, rgba(244,114,182,.12) 50%, transparent 50%),
    linear-gradient(rgba(244,114,182,.12) 50%, transparent 50%);
  background-size: 14px 14px;
}
.vichy-doux {
  background-color: #fffafc;
  background-image:
    linear-gradient(90deg, rgba(244,114,182,.07) 50%, transparent 50%),
    linear-gradient(rgba(244,114,182,.07) 50%, transparent 50%);
  background-size: 44px 44px;
}
.couture-titre {
  font-family: 'Instrument Serif', Georgia, serif;
  font-style: italic;
  font-weight: 400;
  letter-spacing: -0.01em;
}
/* Ligne de couture en pointillés */
.couture-piqure {
  border: 2px dashed rgba(236,72,153,.35);
}
/* iPhone : pas de délai ni de zoom au double tap, pas de surlignage gris */
.couture-app, .couture-app * { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
.couture-app img { -webkit-user-drag: none; -webkit-touch-callout: none; user-select: none; }
@keyframes couture-coeur { 0% { transform: scale(.4); opacity: 0 } 60% { transform: scale(1.15); opacity: 1 } 100% { transform: scale(1) } }
.couture-coeur { animation: couture-coeur .6s ease-out both; }
@keyframes couture-apparait { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
.couture-apparait { animation: couture-apparait .35s ease-out both; }
@media (prefers-reduced-motion: reduce) {
  .couture-coeur, .couture-apparait { animation: none; }
}
`

export function StylesCouture() {
  return <style>{STYLES}</style>
}

// Haut de page : directement sur le fond Vichy pastel (plus de bandeau vif)
export function BandeauVichy({ children, className = '' }) {
  return <div className={`relative ${className}`}>{children}</div>
}

// Petite étiquette façon « étiquette cousue »
export function Etiquette({ children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-pink-700 ring-1 ring-pink-200 shadow-sm ${className}`}
    >
      {children}
    </span>
  )
}

export const champCouture =
  'w-full rounded-2xl border border-pink-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent'

export const boutonRose =
  'inline-flex items-center justify-center gap-2 rounded-2xl bg-pink-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/25 hover:bg-pink-600 active:scale-[0.98] transition disabled:opacity-50 disabled:pointer-events-none'

export const boutonBlanc =
  'inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-pink-700 ring-1 ring-pink-200 hover:bg-pink-50 active:scale-[0.98] transition disabled:opacity-50 disabled:pointer-events-none'
