import Card from './Card.jsx'
import { formatEuros } from '../../utils/format.js'

export default function StatCard({ label, total, percu, aPercevoir, accent = false }) {
  return (
    <Card className={accent ? 'ring-2 ring-brand-500' : ''}>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mb-3">{formatEuros(total)}</p>
      <div className="flex items-center gap-4 text-sm">
        <span className="text-emerald-600 font-medium">{formatEuros(percu)} perçu</span>
        {aPercevoir > 0 && (
          <span className="text-red-600 font-semibold">{formatEuros(aPercevoir)} à percevoir</span>
        )}
      </div>
    </Card>
  )
}
