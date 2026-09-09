import { formatEuros, formatMoisLabel } from '../../utils/format.js'

const POSTES = [
  { key: 'cours', label: 'Cours' },
  { key: 'velo', label: 'Vélo' },
  { key: 'etudes', label: 'Études' },
]

export default function HistoriqueMoisRow({ moisKey, valeurs }) {
  const postes = POSTES.filter((p) => valeurs.parPoste?.[p.key] > 0)

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-4 py-3 border-b border-slate-100 last:border-0">
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 min-w-0">
        <p className="font-medium text-slate-800 capitalize shrink-0">{formatMoisLabel(moisKey)}</p>
        {postes.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400">
            {postes.map((p) => (
              <span key={p.key}>
                {p.label}{' '}
                <span className="text-slate-500 font-medium">
                  {formatEuros(valeurs.parPoste[p.key])}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-4 text-sm shrink-0">
        <span className="text-slate-400">{formatEuros(valeurs.total)}</span>
        <span className="text-emerald-600 font-medium w-20 text-right">
          {formatEuros(valeurs.percu)}
        </span>
        {valeurs.aPercevoir > 0 ? (
          <span className="text-red-600 font-semibold w-20 text-right">
            {formatEuros(valeurs.aPercevoir)}
          </span>
        ) : (
          <span className="w-20" />
        )}
      </div>
    </div>
  )
}
