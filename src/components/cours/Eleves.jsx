import { COULEURS_ELEVES, idEleve } from '../../hooks/useEleves.js'
import { inputClass } from '../ui/Field.jsx'
import { formatEuros } from '../../utils/format.js'

// Petite pastille ronde de couleur avec l'emoji de l'élève
export function PastilleEleve({ eleve, taille = 'sm' }) {
  const couleur = COULEURS_ELEVES[eleve?.couleur] || 'bg-slate-100 ring-slate-300'
  const dimensions = taille === 'md' ? 'w-7 h-7 text-sm' : 'w-5 h-5 text-[11px]'
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 rounded-full ring-1 leading-none ${couleur} ${dimensions}`}
      aria-hidden="true"
    >
      {eleve?.emoji || ''}
    </span>
  )
}

// Choix d'un élève dans un formulaire : élèves déjà connus en boutons + champ pour un nouveau prénom
export function EleveSelecteur({ eleves, value, onChange }) {
  const idChoisi = idEleve(value)
  return (
    <div className="mb-4">
      <span className="block text-sm font-medium text-slate-700 mb-1.5">Élève</span>
      {eleves.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {eleves.map((e) => {
            const actif = e.id === idChoisi
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => onChange(e.nom, e)}
                className={`flex items-center gap-1.5 rounded-full pl-1 pr-3 py-1 text-sm font-medium border transition-colors ${
                  actif
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <PastilleEleve eleve={e} />
                {e.nom}
              </button>
            )
          })}
        </div>
      )}
      <input
        className={inputClass}
        value={value}
        onChange={(ev) => onChange(ev.target.value, null)}
        placeholder={eleves.length > 0 ? 'Ou le prénom d’un nouvel élève' : 'Ex. Lucas'}
        required
      />
    </div>
  )
}

// Contenu de la fenêtre "Élèves" : cours passés et montant payé cette année
export function ListeEleves({ eleves, stats, annee, eleveMisEnAvant }) {
  if (eleves.length === 0) {
    return <p className="text-sm text-slate-500">Aucun élève pour l’instant.</p>
  }
  return (
    <div>
      <p className="text-xs text-slate-500 mb-3">Cours déjà passés et montant déjà payé en {annee}</p>
      <div className="flex flex-col">
        {eleves.map((e) => {
          const s = stats[e.id] || { coursPasses: 0, montantPaye: 0 }
          const misEnAvant = e.id === eleveMisEnAvant
          return (
            <div
              key={e.id}
              className={`flex items-center gap-3 py-3 px-2 -mx-2 rounded-xl border-b border-slate-100 last:border-0 ${
                misEnAvant ? 'bg-brand-50' : ''
              }`}
            >
              <PastilleEleve eleve={e} taille="md" />
              <p className="flex-1 min-w-0 font-medium text-slate-900 truncate">{e.nom}</p>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-slate-900 tabular-nums">
                  {formatEuros(s.montantPaye)}
                </p>
                <p className="text-xs text-slate-500">
                  {s.coursPasses} cours passé{s.coursPasses > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
