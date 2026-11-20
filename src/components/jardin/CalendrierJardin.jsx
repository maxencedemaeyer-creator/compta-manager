import { useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Scissors, Undo2, Wheat } from 'lucide-react'
import { MOIS } from '../../data/jardin/plantes.js'
import { marquerFait, nomPlante, tachesDuMois } from '../../hooks/useJardin.js'

function dateCourte(d) {
  return d ? d.toLocaleDateString('fr-BE', { day: 'numeric', month: 'numeric' }) : "aujourd'hui"
}

function Ligne({ t, jardinId, annee }) {
  const [envoi, setEnvoi] = useState(false)
  const recolte = t.action.type === 'recolte'
  const Icone = recolte ? Wheat : Scissors

  async function basculer() {
    setEnvoi(true)
    try {
      await marquerFait(jardinId, t.plante.id, t.action.id, t.fenetre, !t.fait)
    } catch (e) {
      console.error(e)
    } finally {
      setEnvoi(false)
    }
  }

  const fond = t.fait ? 'bg-emerald-50/60 border-emerald-100' : t.enRetard ? 'bg-orange-50 border-orange-200' : 'bg-white border-emerald-100'
  const icone = t.fait
    ? 'bg-emerald-100 text-emerald-600'
    : t.enRetard
      ? 'bg-orange-100 text-orange-600'
      : recolte
        ? 'bg-amber-100 text-amber-700'
        : 'bg-emerald-100 text-emerald-700'

  return (
    <li className={`flex items-center gap-3 rounded-2xl border px-3.5 py-3 ${fond}`}>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${icone}`}>
        <Icone size={19} />
      </span>
      <div className="min-w-0 flex-1">
        <p className={`font-semibold leading-snug ${t.fait ? 'text-emerald-900/50 line-through' : 'text-emerald-950'}`}>
          {t.action.texte}
        </p>
        <p className="text-sm text-emerald-900/60 truncate">
          {t.base.emoji} {nomPlante(t.plante)} <span className="font-semibold">×{t.plante.quantite}</span>
          {t.fait && <span className="text-emerald-700"> · fait le {dateCourte(t.faitLe)}</span>}
          {t.enRetard && <span className="font-semibold text-orange-600"> · en retard</span>}
        </p>
      </div>
      <button
        onClick={basculer}
        disabled={envoi}
        className={
          t.fait
            ? 'h-10 w-10 shrink-0 rounded-xl bg-white text-emerald-700 border border-emerald-200 flex items-center justify-center disabled:opacity-50'
            : 'shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-3.5 h-10 disabled:opacity-50'
        }
        aria-label={t.fait ? 'Annuler' : "C'est fait"}
        title={t.fait ? 'Annuler' : "C'est fait"}
      >
        {t.fait ? (
          <Undo2 size={17} />
        ) : (
          <>
            <Check size={16} />
            C'est fait
          </>
        )}
      </button>
    </li>
  )
}

// Calendrier : tailles/coupes et récoltes du mois pour les plantes du jardin
export default function CalendrierJardin({ jardinId, plantes, faites }) {
  const aujourdhui = new Date()
  const [vue, setVue] = useState({ annee: aujourdhui.getFullYear(), mois: aujourdhui.getMonth() + 1 })

  const { normales, retard } = tachesDuMois({ plantes, faites, annee: vue.annee, mois: vue.mois, aujourdhui })
  // À faire d'abord, puis les faites ; tailles avant récoltes
  const trier = (a, b) =>
    Number(a.fait) - Number(b.fait) ||
    (a.action.type === b.action.type ? 0 : a.action.type === 'taille' ? -1 : 1) ||
    nomPlante(a.plante).localeCompare(nomPlante(b.plante), 'fr')
  const liste = [...retard, ...normales.sort(trier)]

  const decaler = (d) =>
    setVue((v) => {
      const total = v.annee * 12 + (v.mois - 1) + d
      return { annee: Math.floor(total / 12), mois: (total % 12) + 1 }
    })
  const estCourant = vue.annee === aujourdhui.getFullYear() && vue.mois === aujourdhui.getMonth() + 1

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-2xl bg-emerald-600 px-2 py-2 text-white">
        <button onClick={() => decaler(-1)} className="h-10 w-10 rounded-xl flex items-center justify-center hover:bg-white/15" aria-label="Mois précédent">
          <ChevronLeft size={22} />
        </button>
        <button onClick={() => setVue({ annee: aujourdhui.getFullYear(), mois: aujourdhui.getMonth() + 1 })} className="text-center">
          <p className="text-lg font-bold leading-tight">{MOIS[vue.mois - 1]}</p>
          <p className="text-xs text-white/70">{estCourant ? 'ce mois-ci' : `${vue.annee} · revenir à aujourd'hui`}</p>
        </button>
        <button onClick={() => decaler(1)} className="h-10 w-10 rounded-xl flex items-center justify-center hover:bg-white/15" aria-label="Mois suivant">
          <ChevronRight size={22} />
        </button>
      </div>

      {plantes.length === 0 ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-6 text-center text-emerald-900/70">
          Ajoute des plantes dans « Mes plantes » : les tailles et récoltes du mois apparaîtront ici.
        </p>
      ) : liste.length === 0 ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-6 text-center text-emerald-900/70">
          🌿 Rien à tailler ni à récolter en {MOIS[vue.mois - 1].toLowerCase()}.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {liste.map((t) => (
            <Ligne key={t.cle + (t.enRetard ? '-r' : '')} t={t} jardinId={jardinId} annee={vue.annee} />
          ))}
        </ul>
      )}
    </div>
  )
}
