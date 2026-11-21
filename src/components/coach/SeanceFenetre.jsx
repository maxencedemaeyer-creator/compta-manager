import { useEffect, useState } from 'react'
import { Check, RotateCcw, Timer, Trash2, X } from 'lucide-react'
import { Fenetre, BadgeSource, Etiquette, Champ, champ, boutonPrincipal, boutonSecondaire, boutonDanger, couleurType, km1, formatDuree } from './ui.jsx'
import { evaluerSeance } from '../../lib/coach/analyse.js'
import { planRavitaillement } from '../../lib/coach/nutrition.js'
import { trouverExercice } from '../../data/coach/exercices.js'
import { formatLong } from '../../lib/coach/dates.js'

// =============================================================
//  Fiche d'une séance : détail, version 30 min, ravitaillement,
//  alerte spike et journal (fait / version courte / sautée + RPE)
// =============================================================
const STATUTS = {
  prevue: { nom: 'Prévue', couleur: 'slate' },
  faite: { nom: 'Faite', couleur: 'emerald' },
  courte: { nom: 'Version courte', couleur: 'amber' },
  sautee: { nom: 'Sautée', couleur: 'rose' },
}
export const nomStatut = (s) => STATUTS[s]?.nom || 'Prévue'
export const couleurStatut = (s) => STATUTS[s]?.couleur || 'slate'

const NIVEAUX_ALERTE = {
  orange: 'border-amber-200 bg-amber-50 text-amber-900',
  rouge: 'border-rose-200 bg-rose-50 text-rose-900',
}

export default function SeanceFenetre({ seance, seances, profil, onClose, onMaj, onSupprimer }) {
  const [rpe, setRpe] = useState(5)
  const [distance, setDistance] = useState('')
  const [duree, setDuree] = useState('')
  const [note, setNote] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState('')
  const [voirCourte, setVoirCourte] = useState(false)

  useEffect(() => {
    if (!seance) return
    setRpe(seance.rpe ?? 5)
    setDistance(seance.distanceReelleKm != null ? String(seance.distanceReelleKm) : seance.distanceKm ? String(seance.distanceKm) : '')
    setDuree(seance.dureeReelleMin != null ? String(seance.dureeReelleMin) : seance.dureeMin ? String(seance.dureeMin) : '')
    setNote(seance.note || '')
    setErreur('')
    setVoirCourte(false)
  }, [seance?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!seance) return null
  const c = couleurType(seance.type)
  const ev = seance.statut === 'prevue' ? evaluerSeance(seance, seances, profil) : null
  const ravito = planRavitaillement(seance)
  const estLibre = seance.type === 'libre'
  const aDistance = seance.module === 'course' || estLibre

  async function enregistrer(statut) {
    setEnCours(true)
    setErreur('')
    try {
      const champs = { statut }
      if (statut === 'faite' || statut === 'courte') {
        champs.rpe = Number(rpe)
        champs.note = note.trim()
        champs.faiteLe = new Date().toISOString()
        if (aDistance && distance !== '') champs.distanceReelleKm = Number(String(distance).replace(',', '.'))
        if (duree !== '') champs.dureeReelleMin = Number(String(duree).replace(',', '.'))
      }
      await onMaj(seance.id, champs)
      onClose()
    } catch (e) {
      setErreur(e.message || 'Impossible d’enregistrer.')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <Fenetre ouverte onClose={onClose} titre={seance.titre}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Etiquette couleur={couleurStatut(seance.statut)}>{nomStatut(seance.statut)}</Etiquette>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.fond} ${c.texte}`}>{c.nom}</span>
          <span className="text-sm text-slate-500">{formatLong(seance.date)}</span>
          <BadgeSource regles={seance.regles} className="ml-auto" />
        </div>

        <p className="text-lg font-semibold leading-snug text-slate-900">{seance.resume}</p>
        <p className="-mt-3 text-sm text-slate-500">
          {seance.distanceKm ? `${km1(seance.distanceKm)} km · ` : ''}
          {seance.dureeMin ? `environ ${formatDuree(seance.dureeMin)}` : ''}
        </p>

        {ev && (ev.niveau === 'orange' || ev.niveau === 'rouge') && (
          <div className={`rounded-2xl border px-4 py-3 text-sm leading-relaxed ${NIVEAUX_ALERTE[ev.niveau]}`}>
            <p className="font-semibold">{ev.niveau === 'rouge' ? 'Attention : saut important' : 'Vigilance'}</p>
            <p>{ev.message}</p>
            <div className="mt-2">
              <BadgeSource regles={['spike-seance-10pct']} />
            </div>
          </div>
        )}

        <div className="space-y-3">
          {seance.blocs?.map((b, i) => {
            const ex = b.exerciceCle ? trouverExercice(b.exerciceCle) : null
            return (
              <div key={i} className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-sm font-bold text-slate-800">{b.titre}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{b.detail}</p>
                {ex && (
                  <p className="mt-1 text-xs text-slate-400">
                    {ex.muscles} · {ex.materiel}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {seance.criteres?.length > 0 && (
          <div>
            <p className="mb-1.5 text-sm font-bold text-slate-800">Critères de réussite</p>
            <ul className="space-y-1">
              {seance.criteres.map((t, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-600">
                  <Check size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}

        {seance.versionCourte && (
          <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3">
            <button onClick={() => setVoirCourte(!voirCourte)} className="flex w-full items-center gap-2 text-left text-sm font-bold text-amber-900">
              <Timer size={16} /> Pas le temps ? {seance.versionCourte.titre}
            </button>
            {voirCourte && <p className="mt-1.5 text-sm leading-relaxed text-amber-900/80">{seance.versionCourte.detail}</p>}
          </div>
        )}

        {ravito && (
          <div className="rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-sky-900">Ravitaillement pendant la séance</p>
              <BadgeSource regles={ravito.regles} />
            </div>
            <p className="mt-1 text-sm text-sky-900">
              {ravito.glucidesGh[0]} à {ravito.glucidesGh[1]} g de glucides par heure, soit {ravito.totalG[0]} à {ravito.totalG[1]} g au total.
            </p>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-sm text-sky-900/80">
              {ravito.conseils.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        )}

        {seance.type !== 'fixe' && (
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <p className="text-sm font-bold text-slate-800">Mon journal</p>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Effort ressenti (RPE) : {rpe} / 10</span>
                <BadgeSource regles={['rpe-borg']} />
              </div>
              <input type="range" min={1} max={10} step={1} value={rpe} onChange={(e) => setRpe(e.target.value)} className="w-full accent-sky-600" />
              <div className="flex justify-between text-xs text-slate-400">
                <span>très facile</span>
                <span>très dur</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {aDistance && (
                <Champ label="Distance (km)">
                  <input className={champ} inputMode="decimal" value={distance} onChange={(e) => setDistance(e.target.value)} />
                </Champ>
              )}
              <Champ label="Durée (min)">
                <input className={champ} inputMode="decimal" value={duree} onChange={(e) => setDuree(e.target.value)} />
              </Champ>
            </div>
            <Champ label="Note">
              <textarea className={champ} rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Sensations, douleur, météo…" />
            </Champ>
            {erreur && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{erreur}</p>}
            <div className="grid grid-cols-2 gap-2">
              <button disabled={enCours} onClick={() => enregistrer('faite')} className={boutonPrincipal}>
                <Check size={18} /> Faite
              </button>
              {seance.versionCourte ? (
                <button disabled={enCours} onClick={() => enregistrer('courte')} className={boutonSecondaire}>
                  <Timer size={18} /> Version courte
                </button>
              ) : (
                <span />
              )}
              <button disabled={enCours} onClick={() => enregistrer('sautee')} className={boutonSecondaire}>
                <X size={18} /> Sautée
              </button>
              {seance.statut !== 'prevue' && (
                <button disabled={enCours} onClick={() => enregistrer('prevue')} className={boutonSecondaire}>
                  <RotateCcw size={18} /> Remettre prévue
                </button>
              )}
            </div>
            {estLibre && onSupprimer && (
              <button
                disabled={enCours}
                onClick={async () => {
                  await onSupprimer(seance.id)
                  onClose()
                }}
                className={`${boutonDanger} w-full`}
              >
                <Trash2 size={18} /> Supprimer cette séance
              </button>
            )}
          </div>
        )}
      </div>
    </Fenetre>
  )
}
