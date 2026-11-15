import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

// Petite carte récap d'un volet, cliquable pour ouvrir le volet en question
export default function RecapVolet({ to, icon: Icone, titre, teinte, children }) {
  return (
    <Link
      to={to}
      className="group block bg-white rounded-2xl shadow-soft border border-slate-100 p-4 hover:border-slate-200 active:scale-[0.99] transition-all"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className={`flex items-center justify-center w-8 h-8 rounded-xl ${teinte}`}>
          <Icone size={17} />
        </span>
        <h2 className="flex-1 font-semibold text-slate-800">{titre}</h2>
        <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500" />
      </div>
      {children}
    </Link>
  )
}

// Le chiffre principal d'une carte (rouge s'il reste de l'argent à recevoir, vert sinon)
export function ChiffreCle({ montant, libelle, alerte, toutBon }) {
  if (!alerte) {
    return (
      <p className="text-sm font-medium text-emerald-600 mb-1">✓ {toutBon}</p>
    )
  }
  return (
    <div className="mb-1">
      <p className="text-2xl font-bold text-red-600 tabular-nums leading-tight">{montant}</p>
      <p className="text-xs text-slate-500">{libelle}</p>
    </div>
  )
}

// Petite ligne d'info en bas de carte
export function Info({ children }) {
  return <p className="text-xs text-slate-500 mt-2">{children}</p>
}
