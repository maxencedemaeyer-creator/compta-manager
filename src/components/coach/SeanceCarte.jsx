import { ChevronRight } from 'lucide-react'
import { Etiquette, couleurType, km1, formatDuree } from './ui.jsx'
import { nomStatut, couleurStatut } from './SeanceFenetre.jsx'
import { formatCourt, nomJour } from '../../lib/coach/dates.js'

export default function SeanceCarte({ seance, onClick, avecDate = false }) {
  const c = couleurType(seance.type)
  const fait = seance.statut === 'faite' || seance.statut === 'courte'
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3.5 py-3 text-left shadow-sm shadow-slate-900/5 active:bg-slate-50 ${
        seance.statut === 'sautee' ? 'opacity-60' : ''
      }`}
    >
      <span className={`h-11 w-1.5 shrink-0 rounded-full ${c.puce}`} />
      <span className="min-w-0 flex-1">
        {avecDate && (
          <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
            {nomJour(seance.date, false)} {formatCourt(seance.date)}
          </span>
        )}
        <span className={`block truncate text-base font-bold ${fait ? 'text-slate-500' : 'text-slate-900'}`}>{seance.titre}</span>
        <span className="block truncate text-sm text-slate-500">
          {seance.resume}
          {seance.dureeMin ? ` · ${formatDuree(seance.dureeMin)}` : ''}
        </span>
      </span>
      {seance.statut !== 'prevue' ? <Etiquette couleur={couleurStatut(seance.statut)}>{nomStatut(seance.statut)}</Etiquette> : <ChevronRight size={18} className="text-slate-300" />}
    </button>
  )
}

export { km1 }
