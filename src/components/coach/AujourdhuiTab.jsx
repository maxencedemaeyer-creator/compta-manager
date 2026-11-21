import { useMemo, useState } from 'react'
import { AlertTriangle, CalendarPlus, Flag, Info, Plus, Utensils } from 'lucide-react'
import { Carte, BadgeSource, boutonSecondaire, boutonPrincipal } from './ui.jsx'
import SeanceCarte from './SeanceCarte.jsx'
import SeanceLibre from './SeanceLibre.jsx'
import { alertesDuJour } from '../../lib/coach/analyse.js'
import { macrosDuJour, CLASSES_CHARGE } from '../../lib/coach/nutrition.js'
import { aujourdhui, diffJours, formatLong, formatCourt } from '../../lib/coach/dates.js'
import { tempsPourVdot, formatTemps } from '../../lib/coach/vdot.js'
import { vdotDuProfil } from '../../lib/coach/plans.js'

export default function AujourdhuiTab({ profil, seances, planActif, onOuvrir, onAjouterLibre, allerA }) {
  const jour = aujourdhui()
  const [libre, setLibre] = useState(false)
  const duJour = seances.filter((s) => s.date === jour)
  const aVenir = seances.filter((s) => s.date > jour && s.statut === 'prevue' && s.type !== 'fixe').slice(0, 3)
  const alertes = useMemo(() => alertesDuJour(seances, profil, jour), [seances, profil, jour])
  const macros = useMemo(() => macrosDuJour({ profil, seances: duJour.filter((s) => s.statut !== 'sautee') }), [profil, seances, jour]) // eslint-disable-line react-hooks/exhaustive-deps
  const obj = profil.objectif
  const joursRestants = obj?.date ? diffJours(jour, obj.date) : null
  const vdot = vdotDuProfil(profil)
  const estimation = vdot && obj?.distanceKm ? formatTemps(tempsPourVdot(vdot, obj.distanceKm * 1000)) : null
  const avertPlan = (planActif?.avertissements || []).filter((a) => a.niveau !== 'info')

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold capitalize text-slate-400">{formatLong(jour)}</p>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Salut {profil.prenom || ''} 👋</h2>
      </div>

      {joursRestants != null && joursRestants >= 0 && obj?.distanceKm && (
        <Carte className="bg-gradient-to-br from-sky-500 to-indigo-600 !border-0 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20">
              <Flag size={24} />
            </span>
            <div className="min-w-0">
              <p className="text-3xl font-extrabold leading-none">J-{joursRestants}</p>
              <p className="mt-1 truncate text-sm text-sky-50">
                {obj.nom || 'Objectif'} · {formatCourt(obj.date)} {obj.date.slice(0, 4)}
              </p>
            </div>
          </div>
          {estimation && (
            <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-sky-50">
              Estimation d’après ta dernière perf : <strong className="text-white">{estimation}</strong>
              {obj.tempsCible && <span>· objectif {obj.tempsCible}</span>}
              <BadgeSource regles={['prediction-chrono', 'allures-vdot']} className="!bg-white/20 !text-white" />
            </p>
          )}
        </Carte>
      )}

      {(alertes.length > 0 || avertPlan.length > 0) && (
        <div className="space-y-2">
          {[...alertes, ...avertPlan].map((a, i) => (
            <div
              key={i}
              className={`flex gap-3 rounded-2xl border px-4 py-3 text-sm leading-relaxed ${
                a.niveau === 'rouge' ? 'border-rose-200 bg-rose-50 text-rose-900' : 'border-amber-200 bg-amber-50 text-amber-900'
              }`}
            >
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p>{a.texte}</p>
                <div className="mt-1.5">
                  <BadgeSource regles={a.regles} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <section>
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">Aujourd’hui</h3>
        {duJour.length ? (
          <div className="space-y-2">
            {duJour.map((s) => (
              <SeanceCarte key={s.id} seance={s} onClick={() => onOuvrir(s)} />
            ))}
          </div>
        ) : (
          <Carte className="text-center">
            <p className="text-4xl">😴</p>
            <p className="mt-1 text-lg font-bold text-slate-800">Jour de repos</p>
            <p className="text-sm text-slate-500">{seances.length ? 'Rien de prévu : récupère bien.' : 'Aucun plan pour l’instant : génères-en un dans l’onglet Plans.'}</p>
          </Carte>
        )}
        <div className="mt-3 flex gap-2">
          <button onClick={() => setLibre(true)} className={`${boutonSecondaire} flex-1`}>
            <Plus size={18} /> Séance libre
          </button>
          {!seances.length && (
            <button onClick={() => allerA('plans')} className={`${boutonPrincipal} flex-1`}>
              <CalendarPlus size={18} /> Créer un plan
            </button>
          )}
        </div>
      </section>

      {aVenir.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">À venir</h3>
          <div className="space-y-2">
            {aVenir.map((s) => (
              <SeanceCarte key={s.id} seance={s} avecDate onClick={() => onOuvrir(s)} />
            ))}
          </div>
        </section>
      )}

      <button onClick={() => allerA('nutrition')} className="block w-full text-left">
        <Carte>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <Utensils size={22} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800">Ma journée : {CLASSES_CHARGE[macros.classe].nom.toLowerCase()}</p>
              <p className="text-sm text-slate-500">
                Environ {macros.energie.total.toLocaleString('fr-BE')} kcal · glucides {macros.glucides.grammes[0]}-{macros.glucides.grammes[1]} g · protéines {macros.proteines.grammes[0]}-{macros.proteines.grammes[1]} g
              </p>
            </div>
          </div>
        </Carte>
      </button>

      <p className="flex gap-2 px-1 text-xs leading-relaxed text-slate-400">
        <Info size={14} className="mt-0.5 shrink-0" />
        Repères généraux pour adulte en bonne santé, pas un avis médical. En cas de douleur, d’inquiétude ou d’antécédent, parle à un médecin ou un kiné.
      </p>

      <SeanceLibre ouverte={libre} onClose={() => setLibre(false)} onAjouter={onAjouterLibre} />
    </div>
  )
}
