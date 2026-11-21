import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, ChevronDown, Dices, PenLine, Save, Search, Sparkles, Trash2, X } from 'lucide-react'
import { aujourdhui, useSavoirEcrire } from '../hooks/useSavoirEcrire.js'
import { SUGGESTIONS } from '../data/savoirEcrire/motsCles.js'
import { TAGS } from '../data/savoirEcrire/tags.js'
import { attendu, chercher, parcourir, resume, tagsPour } from '../lib/savoirEcrire/recherche.js'
import TableauIdees from '../components/savoirEcrire/TableauIdees.jsx'

// =============================================================
//  Savoir écrire — générateur d'idées d'écriture (ancienne appli Français)
//  Route : /maxence/francais
//  1. Le prof tape ce qu'il veut évaluer (« imparfait », « phrase claire »).
//  2. Le site retrouve les attendus P5-P6 du programme qui correspondent.
//  3. Le prof coche ceux qu'il évalue, puis « Générer des idées » ouvre le
//     mode tableau (sujet + forme + défi), à projeter à la classe.
//  Voir le fichier claude/francais.md du projet.
// =============================================================
const MENTION = {
  Compétence: 'bg-slate-800 text-white',
  Savoir: 'bg-slate-200 text-slate-700',
  'Savoir-faire': 'bg-sky-100 text-sky-700',
}

const NIVEAUX = [
  { id: 'P5-P6', nom: 'P5 et P6' },
  { id: 'P5', nom: 'P5' },
  { id: 'P6', nom: 'P6' },
]

function LigneAttendu({ a, coche, onToggle, raison, fort }) {
  return (
    <li>
      <label className={`flex items-start gap-3 px-3 sm:px-4 py-3 cursor-pointer transition-colors ${coche ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
        <input type="checkbox" checked={coche} onChange={onToggle} className="mt-1 h-5 w-5 shrink-0 accent-indigo-600" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm sm:text-base text-slate-800">{a.attendu}</span>
          <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
            <span className={`rounded-full px-2 py-0.5 ${MENTION[a.mention] || 'bg-slate-100 text-slate-600'}`}>{a.mention}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500">{a.niveau}</span>
            <span className="text-slate-400">{a.sous_categorie_nom || a.categorie_nom}</span>
            {raison?.length > 0 && <span className={`rounded-full px-2 py-0.5 ${fort ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{raison.join(' · ')}</span>}
          </span>
        </span>
      </label>
    </li>
  )
}

export default function SavoirEcrireView() {
  const { fiches, idees, chargement, erreur, creerFiche, majFiche, supprimerFiche, noterTirage, ajouterFavori, retirerFavori, ajouterIdee, supprimerIdee } =
    useSavoirEcrire()

  const [requete, setRequete] = useState('')
  const [niveau, setNiveau] = useState('P5-P6')
  const [domaine, setDomaine] = useState('Écrire')
  const [selection, setSelection] = useState([]) // ids d'attendus cochés
  const [ficheId, setFicheId] = useState(null)
  const [titre, setTitre] = useState('')
  const [tableau, setTableau] = useState(false)
  const [message, setMessage] = useState('')
  const [enCours, setEnCours] = useState(false)

  const { resultats, reconnus } = useMemo(() => chercher(requete, { domaine, niveau }), [requete, domaine, niveau])
  const groupes = useMemo(() => parcourir({ domaine, niveau }), [domaine, niveau])
  const tags = useMemo(() => tagsPour({ requete, attendusIds: selection }), [requete, selection])
  const choisis = useMemo(() => selection.map((id) => attendu(id)).filter(Boolean), [selection])
  const ficheCourante = fiches.find((f) => f.id === ficheId) || null

  const toggle = (id) => setSelection((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const cocherLesPlusPertinents = () =>
    setSelection((s) => [...s, ...resultats.filter((r) => r.fort).map((r) => r.attendu.id)].filter((id, i, tous) => tous.indexOf(id) === i))

  function nouvelleFiche() {
    setRequete('')
    setSelection([])
    setFicheId(null)
    setTitre('')
    setMessage('')
  }

  function ouvrirFiche(f) {
    setRequete(f.requete || '')
    setNiveau(f.niveau || 'P5-P6')
    setSelection(f.attendusIds || [])
    setFicheId(f.id)
    setTitre(f.titre || '')
    setMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function titreAuto() {
    const t = titre.trim()
    if (t) return t
    const base = requete.trim() || 'Idées libres'
    return `${base.charAt(0).toUpperCase()}${base.slice(1)}`
  }

  // Enregistre la fiche (création ou mise à jour) et renvoie son id
  async function enregistrer() {
    const donnees = { titre: titreAuto(), requete: requete.trim(), niveau, attendusIds: selection }
    if (ficheId) {
      await majFiche(ficheId, donnees)
      return ficheId
    }
    const id = await creerFiche(donnees)
    setFicheId(id)
    setTitre(donnees.titre)
    return id
  }

  async function clicEnregistrer() {
    setEnCours(true)
    setMessage('')
    try {
      await enregistrer()
      setMessage('Fiche enregistrée.')
    } catch (e) {
      setMessage(e.message || 'Impossible d’enregistrer la fiche.')
    } finally {
      setEnCours(false)
    }
  }

  async function generer() {
    setEnCours(true)
    setMessage('')
    try {
      await enregistrer()
    } catch (e) {
      // Pas de connexion : on ouvre quand même le tableau (sans historique ni favoris)
      setMessage(e.message || 'Fiche non enregistrée.')
    }
    setEnCours(false)
    setTableau(true)
  }

  async function basculerEvaluee(f) {
    try {
      await majFiche(f.id, { evalueLe: f.evalueLe ? null : aujourdhui() })
    } catch (e) {
      setMessage(e.message || 'Impossible de modifier la fiche.')
    }
  }

  async function supprimer(f) {
    if (!window.confirm(`Supprimer la fiche « ${f.titre} » ?`)) return
    try {
      await supprimerFiche(f.id)
      if (f.id === ficheId) nouvelleFiche()
    } catch (e) {
      setMessage(e.message || 'Impossible de supprimer la fiche.')
    }
  }

  const aDesResultats = resultats.length > 0
  const requeteTapee = requete.trim().length > 0

  return (
    <div className="min-h-dvh bg-slate-50 pb-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-8 py-6 sm:py-10">
        {/* En-tête */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
              <PenLine size={22} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Maxence · Français P5-P6</p>
              <h1 className="text-2xl font-semibold text-slate-800">Savoir écrire</h1>
              <p className="text-sm text-slate-500">Dis ce que tu veux évaluer : le site retrouve les attendus et invente des sujets d’écriture.</p>
            </div>
          </div>
          <Link to="/maxence" className="mt-1 inline-flex shrink-0 items-center gap-1 text-xs text-slate-400 hover:text-slate-600">
            <ArrowLeft size={14} /> Maxence
          </Link>
        </div>

        {/* 1. Que voulez-vous évaluer ? */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <label htmlFor="se-requete" className="mb-2 block text-base font-semibold text-slate-800">
            Que voulez-vous évaluer ?
          </label>
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="se-requete"
              type="text"
              value={requete}
              onChange={(e) => setRequete(e.target.value)}
              placeholder="Un ou deux mots-clés : imparfait, phrase bien construite…"
              className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-10 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
              autoComplete="off"
            />
            {requeteTapee && (
              <button type="button" onClick={() => setRequete('')} aria-label="Effacer" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRequete((r) => (r.trim() ? `${r.trim()} ${s}` : s))}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs sm:text-sm text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
              >
                {s}
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <div className="inline-flex rounded-xl bg-slate-100 p-1">
              {NIVEAUX.map((n) => (
                <button key={n.id} type="button" onClick={() => setNiveau(n.id)} className={`rounded-lg px-3 py-1 font-medium transition ${niveau === n.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  {n.nom}
                </button>
              ))}
            </div>
            <label className="inline-flex items-center gap-2 text-slate-500">
              <input type="checkbox" checked={domaine === 'Tous'} onChange={(e) => setDomaine(e.target.checked ? 'Tous' : 'Écrire')} className="h-4 w-4 accent-indigo-600" />
              Chercher aussi dans Lire, Parler et Écouter
            </label>
          </div>
        </section>

        {/* 2. Les attendus trouvés */}
        {requeteTapee && (
          <section className="mb-6">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-slate-800">
                  {aDesResultats ? `${resultats.length} attendu${resultats.length > 1 ? 's' : ''} trouvé${resultats.length > 1 ? 's' : ''}` : 'Aucun attendu trouvé'}
                </h2>
                {reconnus.length > 0 && <p className="text-xs text-slate-500">J’ai reconnu : {reconnus.join(' · ')}</p>}
              </div>
              {resultats.some((r) => r.fort) && (
                <button type="button" onClick={cocherLesPlusPertinents} className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50">
                  <Check size={15} /> Cocher les plus pertinents
                </button>
              )}
            </div>
            {aDesResultats ? (
              <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {resultats.map((r) => (
                  <LigneAttendu key={r.attendu.id} a={r.attendu} coche={selection.includes(r.attendu.id)} onToggle={() => toggle(r.attendu.id)} raison={r.pourquoi} fort={r.fort} />
                ))}
              </ul>
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                Essaie un autre mot (« accord », « vocabulaire », « connecteurs »…) ou parcours tous les attendus d’Écrire ci-dessous. Tu peux aussi générer des idées libres.
              </p>
            )}
          </section>
        )}

        {/* Ma sélection */}
        {choisis.length > 0 && (
          <section className="mb-6 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-base font-semibold text-indigo-900">Ma sélection ({choisis.length})</h2>
              <button type="button" onClick={() => setSelection([])} className="text-xs text-indigo-500 hover:text-indigo-700">
                Tout décocher
              </button>
            </div>
            <ul className="flex flex-wrap gap-1.5">
              {choisis.map((a) => (
                <li key={a.id} className="inline-flex max-w-full items-center gap-1 rounded-full bg-white py-1 pl-3 pr-1 text-xs sm:text-sm text-slate-700 ring-1 ring-indigo-100">
                  <span className="truncate">{resume(a, 70)}</span>
                  <button type="button" onClick={() => toggle(a.id)} aria-label="Retirer" className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                    <X size={13} />
                  </button>
                </li>
              ))}
            </ul>
            {tags.length > 0 && (
              <p className="mt-2 text-xs text-indigo-700">
                Les idées porteront sur : {tags.slice(0, 4).map((t) => `${TAGS[t.tag]?.emoji || ''} ${TAGS[t.tag]?.nom || t.tag}`).join(' · ')}
              </p>
            )}
          </section>
        )}

        {/* Parcourir tout le domaine */}
        <details className="group mb-6 rounded-2xl border border-slate-200 bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-slate-700">
            <span>Parcourir {domaine === 'Tous' ? 'tout le programme' : 'tous les attendus d’Écrire'}</span>
            <ChevronDown size={18} className="text-slate-400 transition group-open:rotate-180" />
          </summary>
          <div className="space-y-4 border-t border-slate-100 p-3 sm:p-4">
            {groupes.map(([titreGroupe, liste]) => (
              <div key={titreGroupe} className="overflow-hidden rounded-xl border border-slate-200">
                <p className="bg-slate-50 px-3 py-2 text-sm italic text-slate-600">{titreGroupe}</p>
                <ul className="divide-y divide-slate-100">
                  {liste.map((a) => (
                    <LigneAttendu key={a.id} a={a} coche={selection.includes(a.id)} onToggle={() => toggle(a.id)} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </details>

        {/* Mes fiches */}
        <section className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">Mes fiches</h2>
            {(ficheId || selection.length > 0 || requeteTapee) && (
              <button type="button" onClick={nouvelleFiche} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                + Nouvelle fiche
              </button>
            )}
          </div>
          {erreur && <p className="mb-2 text-sm text-rose-600">Impossible de charger les fiches.</p>}
          {chargement ? (
            <p className="text-sm text-slate-400">Chargement…</p>
          ) : fiches.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
              Ici, tu retrouveras les fiches d’évaluation que tu as préparées (mots-clés, attendus cochés, idées déjà tirées).
            </p>
          ) : (
            <ul className="space-y-2">
              {fiches.map((f) => (
                <li key={f.id} className={`flex flex-wrap items-center gap-2 rounded-2xl border bg-white p-3 sm:p-4 ${f.id === ficheId ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-slate-200'}`}>
                  <button type="button" onClick={() => ouvrirFiche(f)} className="min-w-0 flex-1 text-left">
                    <span className="block truncate font-medium text-slate-800">{f.titre}</span>
                    <span className="block text-xs text-slate-500">
                      {(f.attendusIds || []).length} attendu{(f.attendusIds || []).length > 1 ? 's' : ''} · {f.niveau === 'P5-P6' ? 'P5 et P6' : f.niveau}
                      {(f.favoris || []).length > 0 ? ` · ${f.favoris.length} idée${f.favoris.length > 1 ? 's' : ''} gardée${f.favoris.length > 1 ? 's' : ''}` : ''}
                      {f.evalueLe ? ` · évaluée le ${f.evalueLe.split('-').reverse().join('/')}` : ''}
                    </span>
                  </button>
                  <button type="button" onClick={() => basculerEvaluee(f)} className={`rounded-full px-3 py-1 text-xs font-medium ${f.evalueLe ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                    {f.evalueLe ? '✓ Évaluée' : 'Marquer évaluée'}
                  </button>
                  <button type="button" onClick={() => supprimer(f)} aria-label="Supprimer la fiche" className="p-1.5 text-slate-300 hover:text-rose-500">
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {message && <p className="mb-4 text-sm text-slate-600">{message}</p>}
      </div>

      {/* Barre d'actions */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2 sm:gap-3">
          <input
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            placeholder={requeteTapee ? `Titre de la fiche (${titreAuto()})` : 'Titre de la fiche (facultatif)'}
            className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <span className="hidden text-sm text-slate-500 sm:inline">{selection.length} coché{selection.length > 1 ? 's' : ''}</span>
          <button type="button" onClick={clicEnregistrer} disabled={enCours} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">
            <Save size={16} />
            <span className="hidden sm:inline">Enregistrer</span>
          </button>
          <button type="button" onClick={generer} disabled={enCours} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:brightness-110 disabled:opacity-70">
            {selection.length > 0 || requeteTapee ? <Sparkles size={18} /> : <Dices size={18} />}
            Générer des idées
          </button>
        </div>
      </div>

      {tableau && (
        <TableauIdees
          fiche={{ id: ficheId, titre: titreAuto(), niveau }}
          tags={tags}
          attendus={choisis}
          idees={idees}
          historique={ficheCourante?.historique || []}
          favoris={ficheCourante?.favoris || []}
          onTirage={(consigneId) => ficheId && noterTirage(ficheId, consigneId).catch(() => {})}
          onFavori={(f) => (ficheId ? ajouterFavori(ficheId, f) : Promise.reject(new Error('Enregistre d’abord la fiche pour garder des idées.')))}
          onRetirerFavori={(i) => ficheId && retirerFavori(ficheId, i)}
          onAjouterIdee={ajouterIdee}
          onSupprimerIdee={supprimerIdee}
          onFermer={() => setTableau(false)}
        />
      )}
    </div>
  )
}
