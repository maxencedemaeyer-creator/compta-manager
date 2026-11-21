import { useEffect, useState } from 'react'
import { ExternalLink, X } from 'lucide-react'
import { NIVEAUX, LABELS_STATUT, trouverSource } from '../../data/coach/sources.js'
import { trouverRegle } from '../../data/coach/rules.js'

// =============================================================
//  Petits éléments communs de l'application Coach
// =============================================================

export const bouton =
  'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none'
export const boutonPrincipal = `${bouton} bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md shadow-indigo-500/25`
export const boutonSecondaire = `${bouton} bg-slate-100 text-slate-700 hover:bg-slate-200`
export const boutonDanger = `${bouton} bg-rose-50 text-rose-600 hover:bg-rose-100`
export const champ =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200'

export function Fenetre({ ouverte, onClose, titre, children }) {
  useEffect(() => {
    if (!ouverte) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [ouverte, onClose])
  if (!ouverte) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-slate-950/50" onClick={onClose} />
      <div className="relative max-h-[92dvh] w-full overflow-y-auto overscroll-contain rounded-t-[2rem] bg-white shadow-2xl sm:max-w-xl sm:rounded-[2rem]">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-100 bg-white/95 px-5 py-3.5 backdrop-blur">
          <h2 className="text-lg font-bold text-slate-900">{titre}</h2>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100" aria-label="Fermer">
            <X size={20} />
          </button>
        </div>
        <div className="px-5 pb-8 pt-4">{children}</div>
      </div>
    </div>
  )
}

export function Carte({ children, className = '' }) {
  return <div className={`rounded-3xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-900/5 ${className}`}>{children}</div>
}

export function Etiquette({ children, couleur = 'slate' }) {
  const c = {
    slate: 'bg-slate-100 text-slate-600',
    sky: 'bg-sky-100 text-sky-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-800',
    rose: 'bg-rose-100 text-rose-700',
    violet: 'bg-violet-100 text-violet-700',
  }[couleur]
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${c}`}>{children}</span>
}

const LICENCES = {
  'copyright-cite-only': 'Droits réservés : cité et résumé avec nos mots, jamais recopié',
  'cc-by': 'Licence CC BY (réutilisation avec mention de l’auteur)',
  open: 'Accès libre',
}
const COULEUR_NIVEAU = { A: 'emerald', B: 'sky', C: 'violet', D: 'amber' }

// Fiche d'une source : niveau de preuve, état de vérification, résumé, lien
export function FicheSource({ source }) {
  const niveau = NIVEAUX[source.level]
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <Etiquette couleur={COULEUR_NIVEAU[source.level]}>
          Niveau {source.level} · {niveau.court}
        </Etiquette>
        <Etiquette couleur={source.statut === 'verifie' ? 'emerald' : source.statut === 'partiel' ? 'amber' : 'rose'}>{LABELS_STATUT[source.statut]}</Etiquette>
      </div>
      <p className="mt-2 text-sm font-medium leading-snug text-slate-800">{source.citation}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{source.summaryFr}</p>
      {source.noteVerif && <p className="mt-1.5 text-xs leading-relaxed text-amber-800">À vérifier : {source.noteVerif}</p>}
      <p className="mt-1.5 text-xs text-slate-400">{LICENCES[source.license] || source.license}</p>
      {source.url && (
        <a href={source.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-sky-600">
          Ouvrir la source <ExternalLink size={14} />
        </a>
      )}
    </div>
  )
}

// Bloc règle : énoncé, réserve, sources
export function BlocRegle({ regle }) {
  return (
    <div className="space-y-2.5">
      <div>
        <p className="text-base font-semibold leading-snug text-slate-900">{regle.statementFr}</p>
        {regle.caveatFr && <p className="mt-1 text-sm leading-relaxed text-slate-500">{regle.caveatFr}</p>}
      </div>
      {regle.sources.map((id) => {
        const s = trouverSource(id)
        return s ? <FicheSource key={id} source={s} /> : null
      })}
    </div>
  )
}

// Badge 📚 : ouvre la règle, sa source, son niveau de preuve et le lien
export function BadgeSource({ regles = [], className = '' }) {
  const [ouvert, setOuvert] = useState(false)
  const liste = [...new Set(regles)].map(trouverRegle).filter(Boolean)
  if (!liste.length) return null
  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setOuvert(true)
        }}
        className={`inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100 ${className}`}
        aria-label="Voir les sources"
      >
        <span aria-hidden>📚</span>
        Sources
      </button>
      <Fenetre ouverte={ouvert} onClose={() => setOuvert(false)} titre="D’où vient cette règle ?">
        <div className="space-y-6">
          {liste.map((r) => (
            <BlocRegle key={r.id} regle={r} />
          ))}
        </div>
      </Fenetre>
    </>
  )
}

export function Champ({ label, aide, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
      {aide && <span className="mt-1 block text-xs text-slate-400">{aide}</span>}
    </label>
  )
}

export const TYPE_COULEUR = {
  facile: { puce: 'bg-sky-500', texte: 'text-sky-700', fond: 'bg-sky-50', nom: 'Facile' },
  qualite: { puce: 'bg-rose-500', texte: 'text-rose-700', fond: 'bg-rose-50', nom: 'Qualité' },
  longue: { puce: 'bg-indigo-500', texte: 'text-indigo-700', fond: 'bg-indigo-50', nom: 'Longue' },
  course: { puce: 'bg-amber-500', texte: 'text-amber-700', fond: 'bg-amber-50', nom: 'Course' },
  c25k: { puce: 'bg-emerald-500', texte: 'text-emerald-700', fond: 'bg-emerald-50', nom: 'Débutant 5K' },
  renfo: { puce: 'bg-violet-500', texte: 'text-violet-700', fond: 'bg-violet-50', nom: 'Renfo' },
  fixe: { puce: 'bg-slate-400', texte: 'text-slate-600', fond: 'bg-slate-100', nom: 'Sport fixe' },
  libre: { puce: 'bg-teal-500', texte: 'text-teal-700', fond: 'bg-teal-50', nom: 'Libre' },
}
export const couleurType = (t) => TYPE_COULEUR[t] || TYPE_COULEUR.libre

export const km1 = (x) => (x == null ? '' : (Math.round(x * 10) / 10).toLocaleString('fr-BE', { maximumFractionDigits: 1 }))

export function formatDuree(min) {
  if (!min) return ''
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return h ? `${h} h ${String(m).padStart(2, '0')}` : `${m} min`
}
