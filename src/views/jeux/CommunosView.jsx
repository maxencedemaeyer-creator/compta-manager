import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, BarChart3, HelpCircle, Flag, Map as IconeCarte, ArrowDownUp, X, Trophy, BookA, Search, Flame, Snowflake, Sparkles } from 'lucide-react'
import Chargement from '../../components/Chargement.jsx'
import CarteCommunos from '../../components/jeux/CarteCommunos.jsx'
import { useCommunos } from '../../hooks/useCommunos.js'
import {
  avantMinuit,
  communeDuJour,
  couleurChaleur,
  COULEUR_REVELEE,
  COULEUR_TROUVEE,
  dateDuJour,
  distanceKm,
  formatKm,
  nom,
  autreNom,
  nomComplet,
  normaliser,
  preparerCarte,
  statistiques,
  suggestions as chercherSuggestions,
  trouverCommune,
} from '../../utils/communos.js'

// =============================================================
//  COMMUNOS : trouver la commune belge du jour (façon Globle)
//  Chaque essai se colore selon sa distance à la commune mystère.
//  Parties enregistrées sur Firebase (collection « communos »).
// =============================================================

const STYLES = `
@keyframes cm-pulse { 0%,100% { stroke-opacity: 1; } 50% { stroke-opacity: .25; } }
@keyframes cm-tremble { 0%,100% { transform: translateX(0); } 20%,60% { transform: translateX(-6px); } 40%,80% { transform: translateX(6px); } }
@keyframes cm-apparait { from { opacity: 0; transform: translateY(6px) scale(.98); } to { opacity: 1; transform: none; } }
@keyframes cm-confetti { 0% { transform: translateY(-20px) rotate(0); opacity: 1; } 100% { transform: translateY(110vh) rotate(720deg); opacity: .9; } }
.cm-pulse { animation: cm-pulse 1.2s ease-in-out 4; }
.cm-tremble { animation: cm-tremble .35s ease-in-out; }
.cm-apparait { animation: cm-apparait .3s ease-out both; }
.cm-titre { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; text-shadow: 0 0 12px rgba(217,70,239,.75), 0 0 28px rgba(99,102,241,.5); }
.cm-confetti { position: fixed; top: 0; width: 9px; height: 14px; border-radius: 2px; pointer-events: none; z-index: 60; animation: cm-confetti linear forwards; }
@media (prefers-reduced-motion: reduce) { .cm-pulse, .cm-tremble, .cm-apparait, .cm-confetti { animation: none; } }
`

function useCarte() {
  const [carte, setCarte] = useState(null)
  const [erreur, setErreur] = useState(null)
  useEffect(() => {
    let actif = true
    import('../../data/communos-communes.json')
      .then((m) => actif && setCarte(preparerCarte(m.default)))
      .catch((e) => actif && setErreur(e))
    return () => { actif = false }
  }, [])
  return { carte, erreur }
}

function useMaintenant(intervalle = 1000) {
  const [maintenant, setMaintenant] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setMaintenant(new Date()), intervalle)
    return () => clearInterval(t)
  }, [intervalle])
  return maintenant
}

function Compteur() {
  const maintenant = useMaintenant(1000)
  const ms = avantMinuit(maintenant)
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  const p = (n) => String(n).padStart(2, '0')
  return <span className="font-mono tabular-nums">{p(h)}:{p(m)}:{p(s)}</span>
}

function Confettis() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        left: Math.random() * 100,
        delai: Math.random() * 0.8,
        duree: 2.2 + Math.random() * 2,
        couleur: ['#22c55e', '#e879f9', '#22d3ee', '#facc15', '#f97316', '#a78bfa'][i % 6],
      })),
    []
  )
  return pieces.map((p, i) => (
    <span
      key={i}
      className="cm-confetti"
      style={{ left: `${p.left}vw`, background: p.couleur, animationDuration: `${p.duree}s`, animationDelay: `${p.delai}s` }}
    />
  ))
}

function Fenetre({ titre, onFermer, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-6" onClick={onFermer}>
      <div
        className="cm-apparait w-full sm:max-w-md max-h-[88dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#0d0a24] border border-white/10 text-white p-5 sm:p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black tracking-tight">{titre}</h2>
          <button type="button" onClick={onFermer} className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/15 flex items-center justify-center" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// Petite silhouette d'une commune (pour les règles)
function Silhouette({ commune, couleur }) {
  const [x0, y0, x1, y1] = commune.boite
  const m = Math.max(x1 - x0, y1 - y0) * 0.08
  return (
    <svg viewBox={`${x0 - m} ${y0 - m} ${x1 - x0 + 2 * m} ${y1 - y0 + 2 * m}`} className="w-16 h-12 shrink-0">
      <path d={commune.chemin} fill={couleur} stroke="#0b1024" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

function Regles({ carte, onFermer }) {
  const exemple = useMemo(() => {
    const cible = carte.communes.find((c) => c.fr === 'Namur')
    const noms = ['Ostende', 'Anvers', 'Charleroi', 'Gembloux']
    return {
      cible,
      essais: noms
        .map((n) => carte.communes.find((c) => c.fr === n))
        .filter(Boolean)
        .map((c) => ({ c, km: distanceKm(carte, c, cible) })),
    }
  }, [carte])

  return (
    <Fenetre titre="Comment jouer ?" onFermer={onFermer}>
      <div className="space-y-3 text-[15px] leading-relaxed text-white/80">
        <p>
          Chaque jour, une <b className="text-white">commune mystère</b> se cache parmi les 565 communes de Belgique.
          Trouve-la en un minimum d’essais !
        </p>
        <p>
          Chaque commune proposée apparaît sur la carte, colorée selon sa distance à la commune mystère :
          plus c’est <b className="text-red-400">chaud</b>, plus tu es proche. Rouge foncé = elle la touche.
        </p>
        <p>Exemple : si la commune mystère est <b className="text-white">Namur</b>…</p>
      </div>
      <div className="mt-3 rounded-2xl bg-white/[0.04] border border-white/10 divide-y divide-white/5">
        {exemple.essais.map(({ c, km }) => (
          <div key={c.id} className="flex items-center gap-3 px-3 py-2">
            <Silhouette commune={c} couleur={couleurChaleur(km)} />
            <span className="font-semibold flex-1">{nom(c)}</span>
            <span className="text-sm text-white/60">{km === 0 ? 'touche Namur' : formatKm(km)}</span>
          </div>
        ))}
      </div>
      <ul className="mt-4 space-y-1.5 text-sm text-white/65">
        <li>✍️ Écris en français ou en néerlandais (Anvers ou Antwerpen), sans te soucier des accents. Les communes s’affichent dans la langue de leur communauté.</li>
        <li>🗺️ Glisse, pince ou utilise les boutons + / − pour explorer la carte. Touche une commune colorée pour voir son nom.</li>
        <li>📏 La distance est mesurée entre les frontières les plus proches des deux communes.</li>
        <li>🌙 Une nouvelle commune chaque jour à minuit.</li>
      </ul>
      <button type="button" onClick={onFermer} className="mt-5 w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 py-3 font-bold shadow-lg shadow-fuchsia-500/30 active:scale-[0.98] transition">
        C’est parti !
      </button>
    </Fenetre>
  )
}

function Stats({ stats, onFermer }) {
  const max = Math.max(1, ...stats.tranches.map((t) => t.n))
  const cases = [
    { v: stats.jouees, l: 'Jouées' },
    { v: `${stats.pourcentage}%`, l: 'Réussites' },
    { v: stats.serie, l: 'Série' },
    { v: stats.meilleureSerie, l: 'Meilleure série' },
  ]
  return (
    <Fenetre titre="Statistiques" onFermer={onFermer}>
      <div className="grid grid-cols-4 gap-2 text-center">
        {cases.map((c) => (
          <div key={c.l} className="rounded-2xl bg-white/[0.05] py-3">
            <p className="text-2xl font-black">{c.v}</p>
            <p className="text-[10px] uppercase tracking-wider text-white/45 leading-tight mt-0.5">{c.l}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-2xl bg-white/[0.05] py-3">
          <p className="text-2xl font-black">{stats.record ?? '—'}</p>
          <p className="text-[10px] uppercase tracking-wider text-white/45">Record d’essais</p>
        </div>
        <div className="rounded-2xl bg-white/[0.05] py-3">
          <p className="text-2xl font-black">{stats.moyenne ? stats.moyenne.toFixed(1).replace('.', ',') : '—'}</p>
          <p className="text-[10px] uppercase tracking-wider text-white/45">Moyenne d’essais</p>
        </div>
      </div>
      <h3 className="mt-5 mb-2 font-mono text-xs tracking-[0.25em] text-white/60">ESSAIS POUR TROUVER</h3>
      <div className="space-y-1.5">
        {stats.tranches.map((t) => (
          <div key={t.label} className="flex items-center gap-2 text-sm">
            <span className="w-12 text-white/60 tabular-nums">{t.label}</span>
            <div className="flex-1 h-6 rounded-lg bg-white/[0.04] overflow-hidden">
              <div
                className="h-full rounded-lg bg-gradient-to-r from-fuchsia-500 to-cyan-400 flex items-center justify-end px-2 text-xs font-bold"
                style={{ width: `${Math.max(t.n ? 12 : 0, (t.n / max) * 100)}%` }}
              >
                {t.n > 0 ? t.n : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Fenetre>
  )
}

// Index : toutes les communes par ordre alphabétique
function Index({ carte, essais, cible, fini, onChoisir, onFermer }) {
  const [filtre, setFiltre] = useState('')
  const kmParId = useMemo(() => new Map(essais.map((e) => [e.id, e.km])), [essais])
  const groupes = useMemo(() => {
    const k = normaliser(filtre)
    const liste = carte.communes
      .filter((c) => !k || c.cles.some((cle) => cle.includes(k)))
      .map((c) => ({ c, n: nom(c) }))
      .sort((a, b) => a.n.localeCompare(b.n, 'fr'))
    const g = []
    for (const x of liste) {
      const lettre = x.n.normalize('NFD')[0].toUpperCase()
      if (!g.length || g[g.length - 1].lettre !== lettre) g.push({ lettre, items: [] })
      g[g.length - 1].items.push(x)
    }
    return g
  }, [carte, filtre])
  const total = groupes.reduce((s, g) => s + g.items.length, 0)

  return (
    <Fenetre titre={`Index · ${total} communes`} onFermer={onFermer}>
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          value={filtre}
          onChange={(e) => setFiltre(e.target.value)}
          placeholder="Filtrer (français ou néerlandais)"
          autoComplete="off"
          className="w-full rounded-2xl bg-white/[0.07] border border-white/15 pl-9 pr-3 py-2.5 text-base placeholder:text-white/35 outline-none focus:border-fuchsia-400/70"
        />
      </div>
      <div className="flex flex-wrap gap-1 mb-3">
        {groupes.map((g) => (
          <a key={g.lettre} href={`#cm-lettre-${g.lettre}`} className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/15 text-xs font-bold flex items-center justify-center">
            {g.lettre}
          </a>
        ))}
      </div>
      <div className="-mx-1">
        {groupes.map((g) => (
          <div key={g.lettre}>
            <p id={`cm-lettre-${g.lettre}`} className="sticky -top-6 z-10 bg-[#0d0a24] px-1 py-1.5 font-mono text-xs tracking-[0.25em] text-fuchsia-300 scroll-mt-2">
              {g.lettre}
            </p>
            {g.items.map(({ c, n }) => {
              const km = kmParId.get(c.id)
              const essaye = km !== undefined
              const estCible = essaye && c.id === cible?.id
              return (
                <button
                  key={c.id}
                  type="button"
                  disabled={fini || essaye}
                  onClick={() => onChoisir(n)}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-xl text-left hover:bg-white/[0.07] disabled:hover:bg-transparent"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: essaye ? (estCible ? COULEUR_TROUVEE : couleurChaleur(km)) : 'rgba(255,255,255,0.12)' }}
                  />
                  <span className={`font-medium ${essaye ? 'text-white/45 line-through decoration-white/20' : ''}`}>{n}</span>
                  {autreNom(c) && <span className="text-sm text-white/35 truncate">{autreNom(c)}</span>}
                  <span className="ml-auto text-[11px] text-white/30 shrink-0">{essaye ? (km === 0 ? 'touche' : formatKm(km)) : ''}</span>
                </button>
              )
            })}
          </div>
        ))}
        {total === 0 && <p className="text-center text-white/50 py-6">Aucune commune ne correspond.</p>}
      </div>
    </Fenetre>
  )
}

export default function CommunosView() {
  const { carte, erreur } = useCarte()
  const { parties, loading, enregistrer } = useCommunos()
  const maintenant = useMaintenant(30000)
  const date = dateDuJour(maintenant)

  const [saisie, setSaisie] = useState('')
  const [message, setMessage] = useState(null) // { texte, ton }
  const [tremble, setTremble] = useState(false)
  const [triDistance, setTriDistance] = useState(true)
  const [reperes, setReperes] = useState(true)
  const [selection, setSelection] = useState(null)
  const [dernier, setDernier] = useState(null)
  const [fenetre, setFenetre] = useState(null) // 'regles' | 'stats' | 'abandon'
  const [fete, setFete] = useState(false)
  const [erreurSauvegarde, setErreurSauvegarde] = useState(null)
  const [essaisLocaux, setEssaisLocaux] = useState(null) // affichage immédiat avant confirmation Firebase
  const champ = useRef(null)
  const reglesVues = useRef(false)

  const partie = parties.find((p) => p.id === date)
  const cible = carte ? communeDuJour(carte, date) : null
  const idsEssais = essaisLocaux?.date === date ? essaisLocaux.ids : partie?.essais || []
  const statut = partie?.trouve || (cible && idsEssais.includes(cible.id)) ? 'trouve' : partie?.abandon ? 'abandon' : 'en-cours'
  const fini = statut !== 'en-cours'

  // Synchronise l'affichage local dès que Firebase confirme
  useEffect(() => {
    if (essaisLocaux && partie && (partie.essais || []).length >= essaisLocaux.ids.length) setEssaisLocaux(null)
  }, [partie, essaisLocaux])

  // Règles affichées automatiquement à la toute première partie
  useEffect(() => {
    if (!loading && carte && !reglesVues.current) {
      reglesVues.current = true
      if (parties.length === 0) setFenetre('regles')
    }
  }, [loading, carte, parties.length])

  const essais = useMemo(() => {
    if (!carte || !cible) return []
    return idsEssais
      .map((id, ordre) => {
        const c = carte.parId.get(id)
        return c ? { id, c, ordre, km: distanceKm(carte, c, cible) } : null
      })
      .filter(Boolean)
  }, [carte, cible, idsEssais])

  const essaisTries = useMemo(
    () => (triDistance ? [...essais].sort((a, b) => a.km - b.km || a.ordre - b.ordre) : [...essais].reverse()),
    [essais, triDistance]
  )
  const plusProche = essais.filter((e) => e.id !== cible?.id).reduce((m, e) => (m && m.km <= e.km ? m : e), null)
  const dejaEssayes = useMemo(() => new Set(idsEssais), [idsEssais])
  const propositions = useMemo(
    () => (carte && !fini ? chercherSuggestions(carte, saisie, dejaEssayes) : []),
    [carte, saisie, dejaEssayes, fini]
  )
  const stats = useMemo(() => statistiques(parties, date), [parties, date])

  function refuser(texte) {
    setMessage({ texte, ton: 'erreur' })
    setTremble(true)
    setTimeout(() => setTremble(false), 400)
  }

  async function proposer(commune) {
    if (fini || !carte || !cible) return
    const c = commune || trouverCommune(carte, saisie)
    if (!c) return refuser(saisie.trim() ? `« ${saisie.trim()} » n’est pas une commune belge` : 'Écris le nom d’une commune')
    if (dejaEssayes.has(c.id)) return refuser(`${nom(c)} : déjà essayé !`)

    const km = distanceKm(carte, c, cible)
    const nouveaux = [...idsEssais, c.id]
    const meilleurAvant = essais.length ? Math.min(...essais.map((e) => e.km)) : null
    const trouve = c.id === cible.id

    if (trouve) {
      setMessage({ texte: `🎉 Bravo ! La commune mystère était ${nom(c)} !`, ton: 'gagne' })
      setFete(true)
      setTimeout(() => setFete(false), 5000)
    } else if (km === 0) {
      setMessage({ texte: `🔥 Brûlant ! ${nom(c)} touche la commune mystère`, ton: 'chaud' })
    } else if (meilleurAvant === null) {
      setMessage({ texte: `${nom(c)} est à ${formatKm(km)} de la commune mystère`, ton: 'neutre' })
    } else if (km < meilleurAvant) {
      setMessage({ texte: `${nom(c)} : plus chaud ! (${formatKm(km)})`, ton: 'chaud' })
    } else if (km > meilleurAvant) {
      setMessage({ texte: `${nom(c)} : plus froid… (${formatKm(km)})`, ton: 'froid' })
    } else {
      setMessage({ texte: `${nom(c)} : aussi proche (${formatKm(km)})`, ton: 'neutre' })
    }

    setSaisie('')
    setDernier(c.id)
    setSelection(null)
    setEssaisLocaux({ date, ids: nouveaux })
    setErreurSauvegarde(null)
    try {
      await enregistrer(date, { cible: cible.id, essais: nouveaux, trouve, abandon: false })
    } catch (e) {
      setErreurSauvegarde(e.message)
    }
  }

  async function abandonner() {
    setFenetre(null)
    setMessage({ texte: `La commune mystère était ${nom(cible)}.`, ton: 'revele' })
    try {
      await enregistrer(date, { cible: cible.id, essais: idsEssais, trouve: false, abandon: true })
    } catch (e) {
      setErreurSauvegarde(e.message)
    }
  }

  if (erreur) {
    return (
      <div className="min-h-dvh bg-[#07031a] text-white flex items-center justify-center p-6 text-center">
        Impossible de charger la carte. Vérifie ta connexion et recharge la page.
      </div>
    )
  }
  if (!carte || loading) return <Chargement message="Chargement de la carte de Belgique…" />

  const tonMessage = {
    erreur: 'text-rose-300',
    chaud: 'text-orange-300',
    froid: 'text-sky-300',
    gagne: 'text-emerald-300',
    revele: 'text-violet-300',
    neutre: 'text-white/80',
  }
  const iconeMessage = message?.ton === 'chaud' ? <Flame size={16} /> : message?.ton === 'froid' ? <Snowflake size={16} /> : null

  return (
    <div className="min-h-dvh bg-[#07031a] text-white relative overflow-x-hidden">
      <style>{STYLES}</style>
      {fete && <Confettis />}
      <div className="pointer-events-none absolute -top-32 -left-24 w-96 h-96 rounded-full bg-fuchsia-600/25 blur-3xl" />
      <div className="pointer-events-none absolute top-60 -right-32 w-96 h-96 rounded-full bg-cyan-500/15 blur-3xl" />

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 pt-5 pb-16">
        {/* En-tête */}
        <div className="flex items-center justify-between gap-2">
          <Link to="/maxence/jeux" className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center hover:bg-white/10" aria-label="Retour au Game Center">
            <ArrowLeft size={18} />
          </Link>
          <div className="text-center">
            <h1 className="cm-titre text-2xl sm:text-3xl font-black tracking-[0.12em]">COMMUNOS</h1>
            <p className="text-[9px] sm:text-[10px] font-mono tracking-[0.2em] whitespace-nowrap text-cyan-300/70 -mt-0.5">LA COMMUNE DU JOUR</p>
          </div>
          <div className="flex gap-1.5">
            <button type="button" onClick={() => setFenetre('index')} className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center hover:bg-white/10" aria-label="Index des communes">
              <BookA size={18} />
            </button>
            <button type="button" onClick={() => setFenetre('regles')} className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center hover:bg-white/10" aria-label="Règles">
              <HelpCircle size={18} />
            </button>
            <button type="button" onClick={() => setFenetre('stats')} className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center hover:bg-white/10" aria-label="Statistiques">
              <BarChart3 size={18} />
            </button>
          </div>
        </div>

        {/* Saisie */}
        {!fini && (
          <form
            className={`mt-5 relative ${tremble ? 'cm-tremble' : ''}`}
            onSubmit={(e) => {
              e.preventDefault()
              proposer(propositions.length === 1 ? propositions[0] : null)
            }}
          >
            <div className="flex gap-2">
              <input
                ref={champ}
                value={saisie}
                onChange={(e) => { setSaisie(e.target.value); setMessage(null) }}
                placeholder={essais.length ? 'Une autre commune…' : 'Nom d’une commune belge'}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="go"
                className="flex-1 min-w-0 rounded-2xl bg-white/[0.07] border border-white/15 px-4 py-3 text-base placeholder:text-white/35 outline-none focus:border-fuchsia-400/70 focus:ring-2 focus:ring-fuchsia-500/30 transition"
              />
              <button type="submit" className="rounded-2xl px-5 font-bold bg-gradient-to-r from-fuchsia-500 to-indigo-500 shadow-lg shadow-fuchsia-500/30 active:scale-95 transition">
                Valider
              </button>
            </div>
            {propositions.length > 0 && (
              <ul className="absolute z-30 left-0 right-0 mt-2 rounded-2xl bg-[#130f33] border border-white/15 shadow-2xl overflow-hidden">
                {propositions.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => { proposer(c); champ.current?.focus() }}
                      className="w-full text-left px-4 py-2.5 hover:bg-white/10 active:bg-white/15 flex items-baseline gap-2"
                    >
                      <span className="font-semibold">{nom(c)}</span>
                      {autreNom(c) && <span className="text-sm text-white/45 truncate">{autreNom(c)}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </form>
        )}

        {/* Message */}
        <div className="min-h-[2.75rem] flex items-center justify-center text-center px-2">
          {message ? (
            <p key={message.texte} className={`cm-apparait text-sm sm:text-base font-semibold inline-flex items-center gap-1.5 ${tonMessage[message.ton]}`}>
              {iconeMessage}
              {message.texte}
            </p>
          ) : !fini ? (
            <p className="text-sm text-white/50">
              {essais.length ? 'Explore la carte et tente une autre commune.' : 'Tape le nom de n’importe quelle commune pour commencer.'}
            </p>
          ) : null}
        </div>

        {/* Bandeau de fin */}
        {fini && cible && (
          <div className={`cm-apparait mb-4 rounded-3xl p-[2px] bg-gradient-to-r ${statut === 'trouve' ? 'from-emerald-400 via-cyan-400 to-fuchsia-500' : 'from-violet-500 to-fuchsia-500'}`}>
            <div className="rounded-[22px] bg-[#0d0a24] p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${statut === 'trouve' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-violet-500/20 text-violet-300'}`}>
                  {statut === 'trouve' ? <Trophy size={24} /> : <Flag size={22} />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-widest text-white/50">
                    {statut === 'trouve' ? `Trouvée en ${essais.length} essai${essais.length > 1 ? 's' : ''}` : 'Commune révélée'}
                  </p>
                  <p className="text-xl font-black truncate">{nomComplet(cible)}</p>
                  <p className="text-sm text-white/55 truncate">{cible.prov}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/[0.05] px-4 py-2.5 text-sm">
                <span className="text-white/60">Prochaine commune dans</span>
                <span className="font-bold text-cyan-300"><Compteur /></span>
              </div>
            </div>
          </div>
        )}

        {/* Carte */}
        <div className="rounded-3xl p-[1.5px] bg-gradient-to-br from-fuchsia-500/60 via-indigo-500/30 to-cyan-400/60 shadow-2xl shadow-indigo-900/40">
          <div className="rounded-[22px] overflow-hidden bg-[radial-gradient(ellipse_at_center,#141a3a_0%,#0a0c22_70%)] p-2 sm:p-3">
            <CarteCommunos
              carte={carte}
              essais={essais}
              cible={cible}
              statut={statut}
              dernier={dernier}
              reperes={reperes}
              selection={selection}
              onToucher={(id) => setSelection(id && (dejaEssayes.has(id) || (fini && id === cible?.id)) ? id : null)}
            />
          </div>
        </div>

        {/* Options de la carte */}
        <div className="mt-3 flex items-center justify-between gap-2 text-sm">
          <button
            type="button"
            onClick={() => setReperes((r) => !r)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 border transition ${reperes ? 'bg-white/10 border-white/20' : 'bg-transparent border-white/10 text-white/50'}`}
          >
            <IconeCarte size={15} />
            Villes repères {reperes ? 'affichées' : 'masquées'}
          </button>
          {!fini && essais.length > 0 && (
            <button type="button" onClick={() => setFenetre('abandon')} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-white/50 hover:text-white/80">
              <Flag size={15} />
              Abandonner
            </button>
          )}
        </div>

        {erreurSauvegarde && (
          <p className="mt-3 rounded-2xl bg-rose-500/15 border border-rose-400/30 px-4 py-3 text-sm text-rose-200">
            Essai non enregistré : {erreurSauvegarde}
          </p>
        )}

        {/* Essais */}
        {essais.length > 0 && (
          <div className="mt-6">
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="font-mono text-xs tracking-[0.25em] text-white/50">ESSAIS · {essais.length}</p>
                {plusProche && (
                  <p className="text-sm mt-1">
                    Frontière la plus proche : <b className="text-orange-300">{formatKm(plusProche.km)}</b>
                  </p>
                )}
              </div>
              <button type="button" onClick={() => setTriDistance((t) => !t)} className="inline-flex items-center gap-1.5 text-xs rounded-xl px-3 py-2 bg-white/[0.06] border border-white/10 hover:bg-white/10">
                <ArrowDownUp size={14} />
                {triDistance ? 'Par distance' : 'Par ordre'}
              </button>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {essaisTries.map((e) => {
                const estCible = e.id === cible?.id
                const couleur = estCible ? COULEUR_TROUVEE : couleurChaleur(e.km)
                return (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => setSelection(e.id)}
                      className={`w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left border transition ${
                        selection === e.id ? 'bg-white/[0.12] border-white/30' : 'bg-white/[0.05] border-white/10 hover:bg-white/[0.08]'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-md shrink-0 ring-1 ring-black/30" style={{ background: couleur, boxShadow: `0 0 12px ${couleur}` }} />
                      <span className="flex-1 min-w-0">
                        <span className="block font-semibold truncate">{nom(e.c)}</span>
                        <span className="block text-[11px] text-white/40 truncate">{e.c.prov}</span>
                      </span>
                      <span className={`text-sm font-bold tabular-nums ${estCible ? 'text-emerald-300' : 'text-white/70'}`}>
                        {estCible ? <Sparkles size={16} /> : e.km === 0 ? 'touche' : formatKm(e.km)}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {/* Légende */}
        <div className="mt-6 rounded-2xl bg-white/[0.04] border border-white/10 p-3">
          <div className="h-2.5 rounded-full" style={{ background: `linear-gradient(90deg, ${[0, 5, 15, 35, 70, 120, 200].map(couleurChaleur).join(',')})` }} />
          <div className="flex justify-between text-[11px] text-white/50 mt-1.5">
            <span>🔥 touche</span>
            <span>~35 km</span>
            <span>🧊 200 km</span>
          </div>
          <div className="flex gap-4 text-[11px] text-white/50 mt-2">
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: COULEUR_TROUVEE }} />Trouvée</span>
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: COULEUR_REVELEE }} />Révélée</span>
          </div>
        </div>
      </div>

      {fenetre === 'index' && (
        <Index
          carte={carte}
          essais={essais}
          cible={cible}
          fini={fini}
          onFermer={() => setFenetre(null)}
          onChoisir={(n) => {
            setSaisie(n)
            setMessage(null)
            setFenetre(null)
            setTimeout(() => champ.current?.focus(), 50)
          }}
        />
      )}
      {fenetre === 'regles' && <Regles carte={carte} onFermer={() => setFenetre(null)} />}
      {fenetre === 'stats' && <Stats stats={stats} onFermer={() => setFenetre(null)} />}
      {fenetre === 'abandon' && (
        <Fenetre titre="Abandonner ?" onFermer={() => setFenetre(null)}>
          <p className="text-white/70">La commune mystère sera révélée et la partie du jour comptera comme perdue (ta série repart à zéro).</p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setFenetre(null)} className="rounded-2xl py-3 font-bold bg-white/10 hover:bg-white/15">
              Je continue
            </button>
            <button type="button" onClick={abandonner} className="rounded-2xl py-3 font-bold bg-gradient-to-r from-violet-500 to-fuchsia-500">
              Révéler
            </button>
          </div>
        </Fenetre>
      )}
    </div>
  )
}
