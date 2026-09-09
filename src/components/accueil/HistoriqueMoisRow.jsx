import { formatEuros, formatMoisLabel } from '../../utils/format.js'

export default function HistoriqueMoisRow({ moisKey, valeurs }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <p className="font-medium text-slate-800 capitalize">{formatMoisLabel(moisKey)}</p>
      <div className="flex items-center gap-4 text-sm">
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
