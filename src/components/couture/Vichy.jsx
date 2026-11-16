// =============================================================
//  Habillage de l'application Couture : motif Vichy blanc / rose,
//  coutures en pointillés, titres en serif italique.
//  <StylesCouture /> est à placer une fois en haut de chaque page.
// =============================================================
const STYLES = `
.vichy {
  background-color: #fff;
  background-image:
    linear-gradient(90deg, rgba(244,114,182,.30) 50%, transparent 50%),
    linear-gradient(rgba(244,114,182,.30) 50%, transparent 50%);
  background-size: 30px 30px;
}
.vichy-fin {
  background-color: #fff;
  background-image:
    linear-gradient(90deg, rgba(244,114,182,.26) 50%, transparent 50%),
    linear-gradient(rgba(244,114,182,.26) 50%, transparent 50%);
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
/* Bas du bandeau en festons */
.couture-festons {
  height: 14px;
  background:
    radial-gradient(circle at 10px 0, transparent 9px, #fffafc 10px) 0 0 / 20px 14px repeat-x;
}
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

// Bandeau Vichy en haut de page, avec titre
export function BandeauVichy({ children, className = '' }) {
  return (
    <div className={`relative vichy ${className}`}>
      <div className="relative">{children}</div>
      <div className="couture-festons absolute -bottom-px left-0 right-0" />
    </div>
  )
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
