import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Dices, Heart, LifeBuoy, ListChecks, Pause, Play, Plus, Printer, RotateCcw, Sparkles, Timer, Trash2, X } from 'lucide-react'
import { genererIdee, nombreIdees, relancer } from '../../lib/savoirEcrire/generateur.js'
import { resume } from '../../lib/savoirEcrire/recherche.js'

// =============================================================
//  Mode « tableau » du générateur : grand écran, lisible de loin.
//  On clique sur « Autre idée » (ou barre d'espace) : le sujet, la forme
//  et le défi du jour apparaissent. Chaque tuile peut être relancée seule.
// =============================================================
const STYLE = `
@keyframes se-pop { 0% { transform: scale(.94); opacity: 0 } 60% { transform: scale(1.02); opacity: 1 } 100% { transform: scale(1) } }
@keyframes se-alerte { 0%,100% { transform: scale(1) } 50% { transform: scale(1.06) } }
.se-pop { animation: se-pop .35s ease-out both }
.se-alerte { animation: se-alerte 1s ease-in-out infinite }
@media (prefers-reduced-motion: reduce) { .se-pop, .se-alerte { animation: none } }
@media print { .se-ecran { position: static !important; overflow: visible !important; background: #fff !important } }
`

const DUREES = [5, 10, 15, 20]
const NB_ROULETTE = 8

const concerne = (partie, tuile) =>
  partie === 'tout' || partie === tuile || (partie === 'sujet' && tuile === 'forme')

function temps(secondes) {
  const m = Math.floor(secondes / 60)
  const s = secondes % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function Tuile({ etiquette, couleur, onRelancer, roule, children }) {
  return (
    <div className={`relative rounded-3xl p-5 sm:p-7 text-white shadow-lg ${couleur}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs sm:text-sm font-bold tracking-[0.2em] uppercase text-white/80">{etiquette}</span>
        <button
          type="button"
          onClick={onRelancer}
          aria-label={`Relancer : ${etiquette}`}
          title={`Relancer seulement : ${etiquette.toLowerCase()}`}
          className="print:hidden inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 transition"
        >
          <Dices size={18} className={roule ? 'animate-spin' : ''} />
        </button>
      </div>
      {children}
    </div>
  )
}

export default function TableauIdees({
  fiche,
  tags,
  attendus,
  idees,
  historique,
  favoris,
  onTirage,
  onFavori,
  onRetirerFavori,
  onAjouterIdee,
  onSupprimerIdee,
  onFermer,
}) {
  const niveau = fiche.niveau || 'P5-P6'
  const persoUtiles = useMemo(
    () => idees.filter((p) => !p.tags?.length || p.tags.some((t) => tags.some((x) => x.tag === t))),
    [idees, tags]
  )
  const vus = useRef([...(historique || [])])
  const minuteries = useRef({ roulette: null, chrono: null })
  const reduit = useRef(typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)

  const contexte = useCallback(() => ({ tags, niveau, perso: persoUtiles, exclure: vus.current.slice(-12) }), [tags, niveau, persoUtiles])

  const [idee, setIdee] = useState(() => genererIdee({ tags, niveau, perso: persoUtiles, exclure: vus.current.slice(-12) }))
  const [roule, setRoule] = useState(null) // 'tout' | 'sujet' | 'forme' | 'defi' | null
  const [apercu, setApercu] = useState(null)
  const [panneau, setPanneau] = useState('') // 'criteres' | 'aide' | 'favoris' | 'idees'
  const [nouvelleIdee, setNouvelleIdee] = useState('')
  const [message, setMessage] = useState('')

  // Chrono
  const [duree, setDuree] = useState(10)
  const [reste, setReste] = useState(10 * 60)
  const [enMarche, setEnMarche] = useState(false)

  // Nettoyage des minuteries
  useEffect(
    () => () => {
      clearInterval(minuteries.current.roulette)
      clearInterval(minuteries.current.chrono)
    },
    []
  )

  // La première consigne tirée compte dans l'historique
  useEffect(() => {
    if (idee.sujet.source === 'gabarit' || idee.sujet.source === 'perso') {
      vus.current.push(idee.sujet.id)
      onTirage?.(idee.sujet.id)
    }
    // seulement au premier affichage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!enMarche) return undefined
    minuteries.current.chrono = setInterval(() => {
      setReste((r) => {
        if (r <= 1) {
          clearInterval(minuteries.current.chrono)
          setEnMarche(false)
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(minuteries.current.chrono)
  }, [enMarche])

  const lancer = useCallback(
    (partie = 'tout') => {
      if (roule) return
      const finale = partie === 'tout' ? genererIdee(contexte()) : relancer(idee, partie, contexte())
      const sujetChange = concerne(partie, 'sujet') && partie !== 'forme' && partie !== 'defi'
      const terminer = () => {
        setIdee(finale)
        setRoule(null)
        setApercu(null)
        setMessage('')
        if (sujetChange && (finale.sujet.source === 'gabarit' || finale.sujet.source === 'perso')) {
          vus.current.push(finale.sujet.id)
          onTirage?.(finale.sujet.id)
        }
      }
      if (reduit.current) {
        terminer()
        return
      }
      setRoule(partie)
      let n = 0
      minuteries.current.roulette = setInterval(() => {
        n += 1
        setApercu(genererIdee({ tags, niveau, perso: persoUtiles }))
        if (n >= NB_ROULETTE) {
          clearInterval(minuteries.current.roulette)
          terminer()
        }
      }, 90)
    },
    [roule, idee, contexte, tags, niveau, persoUtiles, onTirage]
  )

  // Clavier : espace = autre idée, Échap = fermer
  useEffect(() => {
    function touche(e) {
      const champ = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)
      if (e.key === 'Escape' && !champ) onFermer()
      if ((e.key === ' ' || e.key === 'Enter') && !champ && e.target?.tagName !== 'BUTTON') {
        e.preventDefault()
        lancer('tout')
      }
    }
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  }, [lancer, onFermer])

  const montre = (tuile) => (roule && apercu && concerne(roule, tuile) ? apercu[tuile] : idee[tuile])
  const basculer = (nom) => setPanneau((p) => (p === nom ? '' : nom))
  const dejaFavori = favoris.some((f) => f.sujet === idee.sujet.texte && f.defi === idee.defi.texte)

  async function garder() {
    if (dejaFavori) return
    try {
      await onFavori({ sujet: idee.sujet.texte, forme: `${idee.forme.nom} · ${idee.forme.longueur}`, defi: idee.defi.texte })
      setMessage('Idée gardée ❤')
    } catch (e) {
      setMessage(e.message || 'Impossible de garder cette idée.')
    }
  }

  function afficherFavori(f) {
    const [nom, longueur] = String(f.forme || '').split(' · ')
    setIdee({ ...idee, sujet: { id: `favori:${f.sujet}`, source: 'favori', texte: f.sujet }, forme: { nom, longueur: longueur || '' }, defi: { texte: f.defi } })
    setPanneau('')
  }

  async function ajouter(e) {
    e.preventDefault()
    const texte = nouvelleIdee.trim()
    if (!texte) return
    try {
      await onAjouterIdee({ texte, tags: tags.slice(0, 3).map((t) => t.tag) })
      setNouvelleIdee('')
      setMessage('Idée ajoutée à ta banque : elle sortira avec les autres.')
    } catch (err) {
      setMessage(err.message || 'Impossible d’ajouter cette idée.')
    }
  }

  function changerDuree(m) {
    setDuree(m)
    setReste(m * 60)
    setEnMarche(false)
  }

  const total = useMemo(() => nombreIdees({ tags, niveau, perso: persoUtiles }), [tags, niveau, persoUtiles])
  const fini = reste === 0

  return (
    <div className="se-ecran fixed inset-0 z-50 overflow-y-auto bg-gradient-to-br from-indigo-50 via-white to-amber-50">
      <style>{STYLE}</style>
      <div className="mx-auto max-w-6xl px-4 sm:px-8 py-4 sm:py-6 flex flex-col gap-4">
        {/* En-tête */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500">Savoir écrire · idée du jour</p>
            <h1 className="text-xl sm:text-3xl font-bold text-slate-800 truncate">{fiche.titre}</h1>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {idee.competences.map((c) => (
                <span key={c.tag} className="inline-flex items-center gap-1 rounded-full bg-white border border-indigo-100 px-2.5 py-0.5 text-xs sm:text-sm font-medium text-indigo-700">
                  <span aria-hidden>{c.emoji}</span>
                  {c.nom}
                </span>
              ))}
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs sm:text-sm text-slate-600">
                {niveau === 'P5-P6' ? 'P5 et P6' : niveau}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 print:hidden shrink-0">
            <button type="button" onClick={() => window.print()} aria-label="Imprimer" title="Imprimer" className="w-10 h-10 inline-flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
              <Printer size={18} />
            </button>
            <button type="button" onClick={onFermer} aria-label="Fermer" title="Fermer (Échap)" className="w-10 h-10 inline-flex items-center justify-center rounded-full bg-slate-800 text-white hover:bg-slate-700">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Les trois tuiles */}
        <div key={`${idee.sujet.texte}|${idee.forme.nom}|${idee.defi.texte}`} className={roule ? '' : 'se-pop'}>
          <Tuile etiquette="Sujet" couleur="bg-gradient-to-br from-indigo-600 to-violet-600" onRelancer={() => lancer('sujet')} roule={roule === 'sujet' || roule === 'tout'}>
            <p className="text-2xl sm:text-4xl tab:text-5xl font-bold leading-snug">{montre('sujet').texte}</p>
          </Tuile>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Tuile etiquette="Forme" couleur="bg-gradient-to-br from-amber-400 to-orange-500" onRelancer={() => lancer('forme')} roule={roule === 'forme' || roule === 'sujet' || roule === 'tout'}>
              <p className="text-2xl sm:text-3xl font-bold leading-snug">{montre('forme').nom}</p>
              {montre('forme').longueur && <p className="mt-2 text-base sm:text-xl font-medium text-white/90">{montre('forme').longueur}</p>}
            </Tuile>
            <Tuile etiquette="Défi" couleur="bg-gradient-to-br from-emerald-500 to-teal-600" onRelancer={() => lancer('defi')} roule={roule === 'defi' || roule === 'tout'}>
              <p className="text-xl sm:text-3xl font-bold leading-snug">{montre('defi').texte}</p>
            </Tuile>
          </div>
        </div>

        {/* Commandes */}
        <div className="print:hidden flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => lancer('tout')}
            disabled={Boolean(roule)}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-lg font-bold text-white shadow-lg hover:brightness-110 active:scale-95 transition disabled:opacity-70"
          >
            <Sparkles size={22} />
            Autre idée
          </button>
          <button type="button" onClick={garder} className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 font-semibold transition ${dejaFavori ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
            <Heart size={18} className={dejaFavori ? 'fill-rose-500' : ''} />
            {dejaFavori ? 'Gardée' : 'Garder'}
          </button>
          <button type="button" onClick={() => basculer('criteres')} className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 font-semibold transition ${panneau === 'criteres' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
            <ListChecks size={18} />
            Critères de réussite
          </button>
          <button type="button" onClick={() => basculer('aide')} className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 font-semibold transition ${panneau === 'aide' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
            <LifeBuoy size={18} />
            Coup de pouce
          </button>
          <button type="button" onClick={() => basculer('favoris')} className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 font-semibold transition ${panneau === 'favoris' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
            <Heart size={18} />
            Gardées ({favoris.length})
          </button>
          <button type="button" onClick={() => basculer('idees')} className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 font-semibold transition ${panneau === 'idees' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
            <Plus size={18} />
            Mes idées
          </button>
        </div>

        {message && <p className="print:hidden text-sm text-slate-500 -mt-2">{message}</p>}

        {/* Panneaux */}
        {panneau === 'criteres' && (
          <section className="rounded-3xl bg-white border border-indigo-100 p-5 sm:p-6 shadow-sm">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-3">Ce qu’on vérifie aujourd’hui</h2>
            <ul className="space-y-2">
              {idee.criteres.map((c) => (
                <li key={c} className="flex items-start gap-3 text-base sm:text-xl text-slate-700">
                  <span className="mt-1.5 inline-block w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-indigo-400 shrink-0" aria-hidden />
                  {c}
                </li>
              ))}
            </ul>
            {attendus.length > 0 && (
              <p className="mt-4 text-xs sm:text-sm text-slate-400">
                Attendus du programme : {attendus.slice(0, 3).map((a) => resume(a, 60)).join(' · ')}
                {attendus.length > 3 ? ` · +${attendus.length - 3}` : ''}
              </p>
            )}
          </section>
        )}

        {panneau === 'aide' && (
          <section className="rounded-3xl bg-amber-50 border border-amber-200 p-5 sm:p-6 shadow-sm">
            <h2 className="text-lg sm:text-xl font-bold text-amber-900 mb-3">Coup de pouce (version allégée)</h2>
            <ul className="space-y-2">
              {idee.aide.map((a) => (
                <li key={a} className="text-base sm:text-xl text-amber-900">
                  {a}
                </li>
              ))}
              <li className="text-base sm:text-xl text-amber-900">Je peux écrire moins de lignes : l’important, c’est de bien réussir le défi.</li>
            </ul>
          </section>
        )}

        {panneau === 'favoris' && (
          <section className="print:hidden rounded-3xl bg-white border border-rose-100 p-5 sm:p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-3">Idées gardées pour cette fiche</h2>
            {favoris.length === 0 ? (
              <p className="text-sm text-slate-400">Rien pour l’instant : touche « Garder » quand une idée te plaît.</p>
            ) : (
              <ul className="space-y-2">
                {favoris.map((f, i) => (
                  <li key={`${f.sujet}-${i}`} className="flex items-start gap-2 rounded-xl bg-slate-50 p-3">
                    <button type="button" onClick={() => afficherFavori(f)} className="flex-1 text-left">
                      <span className="block text-sm font-semibold text-slate-800">{f.sujet}</span>
                      <span className="block text-xs text-slate-500">{f.forme} — {f.defi}</span>
                    </button>
                    <button type="button" onClick={() => onRetirerFavori(i)} aria-label="Retirer" className="text-slate-300 hover:text-rose-500 p-1">
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {panneau === 'idees' && (
          <section className="print:hidden rounded-3xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-1">Mes idées</h2>
            <p className="text-sm text-slate-500 mb-3">Ajoute tes propres consignes : elles sortiront avec celles du site pour ces compétences.</p>
            <form onSubmit={ajouter} className="flex flex-col sm:flex-row gap-2">
              <input
                value={nouvelleIdee}
                onChange={(e) => setNouvelleIdee(e.target.value)}
                placeholder="Ex. : Écris la lettre d’un élève qui revient d’un an sur la Lune."
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                Ajouter
              </button>
            </form>
            {idees.length > 0 && (
              <ul className="mt-3 space-y-2">
                {idees.map((p) => (
                  <li key={p.id} className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                    <span className="flex-1">{p.texte}</span>
                    <button type="button" onClick={() => onSupprimerIdee(p.id)} aria-label="Supprimer" className="text-slate-300 hover:text-rose-500 p-1">
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Chrono */}
        <section className="print:hidden rounded-3xl bg-white border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-wrap items-center gap-3 sm:gap-5">
          <Timer size={22} className="text-slate-400" />
          <span className={`font-mono text-4xl sm:text-5xl font-bold tabular-nums ${fini ? 'text-rose-600 se-alerte' : 'text-slate-800'}`}>{temps(reste)}</span>
          {fini && <span className="text-lg font-bold text-rose-600">Temps écoulé !</span>}
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => (fini ? changerDuree(duree) : setEnMarche((v) => !v))} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2 text-white font-semibold hover:bg-slate-700">
              {enMarche ? <Pause size={16} /> : <Play size={16} />}
              {enMarche ? 'Pause' : fini ? 'Recommencer' : 'Démarrer'}
            </button>
            <button type="button" onClick={() => changerDuree(duree)} aria-label="Remettre à zéro" className="w-10 h-10 inline-flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50">
              <RotateCcw size={16} />
            </button>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            {DUREES.map((m) => (
              <button key={m} type="button" onClick={() => changerDuree(m)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${duree === m ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {m} min
              </button>
            ))}
          </div>
        </section>

        <p className="print:hidden text-center text-xs text-slate-400 pb-4">
          Environ {total.toLocaleString('fr-BE')} idées possibles pour cette fiche · barre d’espace = autre idée · Échap = fermer
        </p>
      </div>
    </div>
  )
}
