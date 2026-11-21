import { useState } from 'react'
import { Dumbbell, Footprints, Trash2, Trophy } from 'lucide-react'
import { Carte, BadgeSource, boutonPrincipal, boutonSecondaire, boutonDanger, Etiquette } from './ui.jsx'
import { formatCourt } from '../../lib/coach/dates.js'
import { formatAllure } from '../../lib/coach/vdot.js'

const NOMS_ALLURES = { E: 'Facile (E)', M: 'Allure marathon (M)', T: 'Seuil (T)', I: 'Intervalles (I)', R: 'Répétitions (R)' }

export default function PlansTab({ profil, plans, planActif, onGenerer, onSupprimer, allerA }) {
  const [enCours, setEnCours] = useState('')
  const [message, setMessage] = useState(null)

  async function lancer(type, options) {
    setEnCours(type)
    setMessage(null)
    try {
      const r = await onGenerer(type, options)
      setMessage({ ok: true, texte: `Plan créé : ${r.sessions.length} séances.` })
      allerA('calendrier')
    } catch (e) {
      setMessage({ ok: false, texte: e.message || 'Impossible de créer le plan.' })
    } finally {
      setEnCours('')
    }
  }

  const objectifOk = profil.objectif?.date && profil.objectif?.distanceKm
  const choix = [
    {
      type: 'course',
      icone: Trophy,
      titre: `Préparer ${profil.objectif?.nom || 'ma course'}`,
      texte: objectifOk
        ? `Jusqu’au ${formatCourt(profil.objectif.date)} ${profil.objectif.date.slice(0, 4)} : 3 sorties par semaine, limite de +10 % par sortie, affûtage de 2 semaines.`
        : 'Renseigne d’abord la distance et la date de ta course dans le Profil.',
      regles: ['spike-seance-10pct', 'allures-vdot', 'distribution-intensite', 'affutage'],
      desactive: !objectifOk,
    },
    {
      type: 'c25k',
      icone: Footprints,
      titre: 'Débutant 5 km (9 semaines)',
      texte: 'Programme progressif marche/course, 3 sorties par semaine, d’après le plan NHS Couch to 5K décrit avec nos mots.',
      regles: ['debutant-c25k'],
    },
    {
      type: 'renfo',
      icone: Dumbbell,
      titre: 'Renforcement général (8 semaines)',
      texte: 'Deux séances corps entier par semaine (mercredi et dimanche par défaut), avec prévention des ischios et des hanches si tu l’as déclarée.',
      regles: ['renfo-acsm2026', 'nordic-ischios'],
    },
  ]

  return (
    <div className="space-y-5">
      {planActif && (
        <Carte className="border-sky-200 bg-sky-50/60">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Etiquette couleur="sky">Plan actif</Etiquette>
              <p className="mt-1.5 text-lg font-bold text-slate-900">{planActif.nom}</p>
              {planActif.resume?.debut && (
                <p className="text-sm text-slate-500">
                  Du {formatCourt(planActif.resume.debut)} au {formatCourt(planActif.resume.fin)} · {planActif.resume.semaines} semaines
                </p>
              )}
            </div>
          </div>
          {planActif.resume?.vdot && (
            <div className="mt-3 rounded-2xl bg-white px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-800">VDOT {planActif.resume.vdot}</p>
                <BadgeSource regles={['allures-vdot']} />
              </div>
              <ul className="mt-1.5 space-y-0.5 text-sm text-slate-600">
                {Object.entries(NOMS_ALLURES).map(([k, nom]) => (
                  <li key={k} className="flex justify-between">
                    <span>{nom}</span>
                    <strong className="text-slate-800">{formatAllure(planActif.resume.allures[k])}</strong>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-slate-400">Estimations à partir d’une seule performance : mets le profil à jour après une bonne course.</p>
            </div>
          )}
          {planActif.avertissements?.length > 0 && (
            <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
              {planActif.avertissements.map((a, i) => (
                <li key={i} className="flex gap-2">
                  <span>{a.niveau === 'info' ? 'ℹ️' : '⚠️'}</span>
                  <span>{a.texte}</span>
                </li>
              ))}
            </ul>
          )}
          <button
            onClick={() => window.confirm('Supprimer ce plan et ses séances non faites ?') && onSupprimer(planActif.id)}
            className={`${boutonDanger} mt-3 w-full`}
          >
            <Trash2 size={16} /> Supprimer ce plan
          </button>
        </Carte>
      )}

      <section className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">{planActif ? 'Remplacer par un autre plan' : 'Choisir un plan'}</h3>
        {choix.map((c) => {
          const Icone = c.icone
          return (
            <Carte key={c.type}>
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                  <Icone size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold text-slate-900">{c.titre}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-500">{c.texte}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <button disabled={!!enCours || c.desactive} onClick={() => lancer(c.type)} className={`${boutonPrincipal} !py-2`}>
                      {enCours === c.type ? 'Création…' : 'Générer'}
                    </button>
                    <BadgeSource regles={c.regles} />
                  </div>
                </div>
              </div>
            </Carte>
          )
        })}
        {message && <p className={`rounded-2xl px-4 py-3 text-sm ${message.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'}`}>{message.texte}</p>}
        <p className="px-1 text-xs leading-relaxed text-slate-400">
          Générer un plan remplace les séances prévues pas encore faites ; ton journal (séances faites) est conservé. Les sports fixes du profil (ex. padel) sont ajoutés au calendrier.
        </p>
        <button onClick={() => allerA('profil')} className={`${boutonSecondaire} w-full`}>
          Modifier mon profil
        </button>
      </section>
    </div>
  )
}
