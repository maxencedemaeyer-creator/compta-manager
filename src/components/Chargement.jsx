// =============================================================
//  Écran de chargement plein écran (ouverture du site,
//  connexion à Firebase, mise à jour du site…)
//  Même look que l'écran affiché dans index.html, pour que
//  le passage de l'un à l'autre soit invisible.
//  Le nom affiché et les couleurs suivent l'espace de la page
//  (Julie en rose, Maxence en vert).
// =============================================================
import { espaceDeLaPage } from '../utils/espace.js'

export default function Chargement({ message = 'Chargement…', superpose = false }) {
  const espace = espaceDeLaPage()
  return (
    <div
      className={`${espace.theme ? `theme-${espace.theme} ` : ''}${
        superpose ? 'fixed inset-0 z-[100] bg-creme/95 backdrop-blur-sm' : 'relative min-h-dvh bg-creme'
      } flex flex-col items-center justify-center text-emerald-950 overflow-hidden`}
      role="status"
      aria-live="polite"
    >
      {/* Formes douces en arrière-plan */}
      <div className="blob pointer-events-none absolute -top-32 -right-24 w-80 h-80 rounded-full bg-emerald-300/40 blur-3xl" />
      <div className="blob pointer-events-none absolute bottom-0 -left-32 w-80 h-80 rounded-full bg-douceur/50 blur-3xl" />

      <div className="relative flex flex-col items-center">
        <p className="font-display text-4xl font-semibold tracking-tight">{espace.nom}</p>
        <div className="mt-6 w-8 h-8 rounded-full border-[3px] border-emerald-900/15 border-t-emerald-700 animate-spin" />
        <p className="mt-4 text-sm text-emerald-900/60">{message}</p>
      </div>
    </div>
  )
}
