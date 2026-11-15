import { formatEuros, formatMoisLabel } from '../../utils/format.js'

// Les 3 rentrées d'argent, avec leur couleur (identique dans tout l'Accueil)
export const POSTES = [
  { key: 'cours', label: 'Cours', couleur: 'bg-brand-500' },
  { key: 'velo', label: 'Vélo', couleur: 'bg-emerald-500' },
  { key: 'etudes', label: 'Études', couleur: 'bg-amber-400' },
]

// Une ligne de l'historique : le mois, son total, et en petit le détail par volet.
// La barre de couleur montre la taille du mois par rapport au meilleur mois.
export default function HistoriqueMoisRow({ moisKey, valeurs, max, enCours = false }) {
  const largeur = max > 0 ? (valeurs.total / max) * 100 : 0
  return (
    <div className="py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <p className="font-medium text-slate-800 capitalize truncate">
            {formatMoisLabel(moisKey)}
          </p>
          {enCours && (
            <span className="shrink-0 text-[11px] font-medium bg-brand-50 text-brand-700 rounded-full px-2 py-0.5">
              en cours
            </span>
          )}
        </div>
        <p className="shrink-0 font-bold text-slate-900 tabular-nums">{formatEuros(valeurs.total)}</p>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
        {POSTES.filter((p) => valeurs.parPoste[p.key] > 0).map((p) => (
          <span key={p.key} className="flex items-center gap-1 text-xs text-slate-500">
            <span className={`w-1.5 h-1.5 rounded-full ${p.couleur}`} />
            {p.label} <span className="tabular-nums">{formatEuros(valeurs.parPoste[p.key])}</span>
          </span>
        ))}
      </div>

      <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full flex" style={{ width: `${largeur}%` }}>
          {POSTES.map((p) =>
            valeurs.parPoste[p.key] > 0 ? (
              <div
                key={p.key}
                className={p.couleur}
                style={{ width: `${(valeurs.parPoste[p.key] / valeurs.total) * 100}%` }}
              />
            ) : null
          )}
        </div>
      </div>
    </div>
  )
}
