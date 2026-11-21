import { useMemo } from 'react'
import { Flame, Footprints, Timer } from 'lucide-react'
import { Carte, Etiquette, formatDuree, km1 } from './ui.jsx'
import { serieSemaines, statsSemaines } from '../../lib/coach/analyse.js'
import { aujourdhui, formatCourt } from '../../lib/coach/dates.js'

function Barres({ donnees, cle, unite, couleur }) {
  const max = Math.max(1, ...donnees.map((d) => d[cle]))
  const H = 110
  return (
    <svg viewBox={`0 0 ${donnees.length * 44} ${H + 34}`} className="w-full" role="img" aria-label={`Évolution : ${unite}`}>
      {donnees.map((d, i) => {
        const h = Math.max(d[cle] > 0 ? 3 : 0, (d[cle] / max) * H)
        const x = i * 44 + 8
        return (
          <g key={d.lundi}>
            <rect x={x} y={H - h + 14} width={28} height={h} rx={6} className={d.courante ? 'fill-sky-300' : couleur} />
            <text x={x + 14} y={H - h + 9} textAnchor="middle" className="fill-slate-500 text-[10px] font-semibold">
              {d[cle] ? Math.round(d[cle]) : ''}
            </text>
            <text x={x + 14} y={H + 28} textAnchor="middle" className="fill-slate-400 text-[9px]">
              {formatCourt(d.lundi).replace('.', '')}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default function ProgresTab({ seances }) {
  const jour = aujourdhui()
  const semaines = useMemo(() => statsSemaines(seances, jour, 8), [seances, jour])
  const serie = useMemo(() => serieSemaines(seances, jour), [seances, jour])
  const faites = seances.filter((s) => s.statut === 'faite' || s.statut === 'courte')
  const kmTotal = faites.reduce((t, s) => t + (s.distanceReelleKm || (s.statut === 'faite' ? s.distanceKm : 0) || 0), 0)
  const minTotal = faites.reduce((t, s) => t + (s.dureeReelleMin || s.dureeMin || 0), 0)
  const recentes = faites.slice(-5).reverse()

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Carte className="!p-3 text-center">
          <Flame className="mx-auto text-orange-500" size={22} />
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{serie}</p>
          <p className="text-[11px] font-semibold leading-tight text-slate-400">semaine{serie > 1 ? 's' : ''} d’affilée</p>
        </Carte>
        <Carte className="!p-3 text-center">
          <Footprints className="mx-auto text-sky-500" size={22} />
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{km1(kmTotal) || 0}</p>
          <p className="text-[11px] font-semibold leading-tight text-slate-400">km courus</p>
        </Carte>
        <Carte className="!p-3 text-center">
          <Timer className="mx-auto text-violet-500" size={22} />
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{formatDuree(minTotal) || '0 min'}</p>
          <p className="text-[11px] font-semibold leading-tight text-slate-400">de sport</p>
        </Carte>
      </div>

      <Carte>
        <p className="mb-1 text-sm font-bold text-slate-800">Kilomètres par semaine</p>
        <Barres donnees={semaines} cle="km" unite="kilomètres par semaine" couleur="fill-sky-500" />
      </Carte>
      <Carte>
        <p className="mb-1 text-sm font-bold text-slate-800">Minutes de sport par semaine</p>
        <Barres donnees={semaines} cle="minutes" unite="minutes de sport par semaine" couleur="fill-violet-500" />
      </Carte>

      <Carte>
        <p className="mb-2 text-sm font-bold text-slate-800">Semaines validées</p>
        <div className="grid grid-cols-8 gap-1.5">
          {semaines.map((s) => (
            <div key={s.lundi} className="text-center">
              <div
                className={`flex h-9 items-center justify-center rounded-xl text-sm font-bold ${
                  s.validee ? 'bg-emerald-500 text-white' : s.nbPrevues === 0 ? 'bg-slate-100 text-slate-300' : s.courante ? 'bg-sky-100 text-sky-700' : 'bg-rose-100 text-rose-600'
                }`}
              >
                {s.nbPrevues ? `${s.nbFaites}/${s.nbPrevues}` : '–'}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-400">Une semaine est validée quand toutes ses séances prévues sont faites (version courte comprise). Règle de l’appli, sans source scientifique.</p>
      </Carte>

      {recentes.length > 0 && (
        <Carte>
          <p className="mb-2 text-sm font-bold text-slate-800">Dernières séances</p>
          <ul className="divide-y divide-slate-100">
            {recentes.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span className="min-w-0 truncate text-slate-700">
                  {formatCourt(s.date)} · {s.titre}
                </span>
                <span className="flex shrink-0 items-center gap-2 text-slate-500">
                  {s.distanceReelleKm ? `${km1(s.distanceReelleKm)} km` : ''}
                  {s.rpe ? <Etiquette couleur="slate">RPE {s.rpe}</Etiquette> : null}
                </span>
              </li>
            ))}
          </ul>
        </Carte>
      )}
    </div>
  )
}
