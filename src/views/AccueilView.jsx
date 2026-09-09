import { AlertCircle } from 'lucide-react'
import { useComptabilite } from '../hooks/useComptabilite.js'
import Card from '../components/ui/Card.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import HistoriqueMoisRow from '../components/accueil/HistoriqueMoisRow.jsx'
import { formatEuros } from '../utils/format.js'

export default function AccueilView() {
  const { loading, ceMois, moisDernier, totalAnnee, historique, totalEnAttente, anneeCourante } =
    useComptabilite()

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Comptabilité totale</h1>

      {!loading && totalEnAttente > 0 && (
        <Card className="mb-5 border-red-200 bg-red-50 flex items-center gap-3">
          <AlertCircle className="text-red-500 shrink-0" size={20} />
          <p className="text-sm text-red-700">
            <span className="font-semibold">{formatEuros(totalEnAttente)}</span> restent à
            percevoir au total, tous mois confondus.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Ce mois-ci" {...ceMois} accent />
        <StatCard label="Mois dernier" {...moisDernier} />
        <StatCard label={`Total ${anneeCourante}`} {...totalAnnee} />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-slate-800">Historique par mois</h2>
          <div className="hidden sm:flex items-center gap-4 text-xs text-slate-400">
            <span className="w-20 text-right">Total</span>
            <span className="w-20 text-right">Perçu</span>
            <span className="w-20 text-right">À percevoir</span>
          </div>
        </div>

        {!loading && historique.length === 0 && (
          <EmptyState
            title="Pas encore de données"
            description="Ajoute des cours, des trajets vélo ou des études pour voir ton historique ici."
          />
        )}

        {historique.map(([moisKey, valeurs]) => (
          <HistoriqueMoisRow key={moisKey} moisKey={moisKey} valeurs={valeurs} />
        ))}
      </Card>
    </div>
  )
}
