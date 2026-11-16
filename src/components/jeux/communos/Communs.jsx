import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, X, Search } from 'lucide-react'
import {
  autreNom,
  avantMinuit,
  couleurChaleur,
  COULEUR_TROUVEE,
  distanceKm,
  formatKm,
  nom,
  normaliser,
  preparerCarte,
} from '../../../utils/communos.js'

// =============================================================
//  COMMUNOS — éléments partagés entre les modes de jeu
// =============================================================

export const STYLES = `
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

// La carte (≈ 140 Ko) n'est chargée qu'à l'ouverture du jeu, puis gardée en mémoire
let carteEnMemoire = null
export function useCarte() {
  const [carte, setCarte] = useState(carteEnMemoire)
  const [erreur, setErreur] = useState(null)
  useEffect(() => {
    if (carteEnMemoire) return
    let actif = true
    import('../../../data/communos-communes.json')
      .then((m) => {
        carteEnMemoire = carteEnMemoire || preparerCarte(m.default)
        if (actif) setCarte(carteEnMemoire)
      })
      .catch((e) => actif && setErreur(e))
    return () => { actif = false }
  }, [])
  return { carte, erreur }
}

export function useMaintenant(intervalle = 1000) {
  const [maintenant, setMaintenant] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setMaintenant(new Date()), intervalle)
    return () => clearInterval(t)
  }, [intervalle])
  return maintenant
}

export function Compteur() {
  const maintenant = useMaintenant(1000)
  const ms = avantMinuit(maintenant)
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  const p = (n) => String(n).padStart(2, '0')
  return <span className="font-mono tabular-nums">{p(h)}:{p(m)}:{p(s)}</span>
}

export function Confettis() {
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

export function Fenetre({ titre, onFermer, children }) {
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

export function BoutonIcone({ onClick, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center hover:bg-white/10"
    >
      {children}
    </button>
  )
}

// En-tête commun : retour, titre, boutons à droite
export function EnTete({ retour, sousTitre, children }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Link to={retour} className="w-10 h-10 shrink-0 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center hover:bg-white/10" aria-label="Retour">
        <ArrowLeft size={18} />
      </Link>
      <div className="text-center min-w-0">
        <h1 className="cm-titre text-2xl sm:text-3xl font-black tracking-[0.12em]">COMMUNOS</h1>
        <p className="text-[9px] sm:text-[10px] font-mono tracking-[0.2em] whitespace-nowrap text-cyan-300/70 -mt-0.5 truncate">{sousTitre}</p>
      </div>
      <div className="flex gap-1.5 shrink-0">{children}</div>
    </div>
  )
}

// Choix du mode de jeu
export function OngletsModes({ actif }) {
  const onglets = [
    { id: 'belgique', to: '/maxence/jeux/communos', titre: 'Belgique', sous: 'Défi du jour', emoji: '🇧🇪' },
    { id: 'provinces', to: '/maxence/jeux/communos/provinces', titre: 'Provinces', sous: 'Entraînement', emoji: '🗺️' },
  ]
  return (
    <div className="mt-4 grid grid-cols-2 gap-1.5 rounded-2xl bg-white/[0.05] border border-white/10 p-1.5">
      {onglets.map((o) => (
        <Link
          key={o.id}
          to={o.to}
          className={`rounded-xl px-3 py-2 flex items-center gap-2 transition ${
            actif === o.id ? 'bg-gradient-to-r from-fuchsia-500/90 to-indigo-500/90 shadow-lg shadow-fuchsia-500/20' : 'hover:bg-white/[0.06] text-white/60'
          }`}
        >
          <span className="text-lg">{o.emoji}</span>
          <span className="leading-tight min-w-0">
            <span className="block font-bold text-sm">{o.titre}</span>
            <span className={`block text-[11px] ${actif === o.id ? 'text-white/80' : 'text-white/40'}`}>{o.sous}</span>
          </span>
        </Link>
      ))}
    </div>
  )
}

// Petite silhouette (commune ou province)
export function Silhouette({ chemin, boite, couleur, className = 'w-16 h-12', contour = '#0b1024' }) {
  const [x0, y0, x1, y1] = boite
  const m = Math.max(x1 - x0, y1 - y0) * 0.08
  return (
    <svg viewBox={`${x0 - m} ${y0 - m} ${x1 - x0 + 2 * m} ${y1 - y0 + 2 * m}`} className={`${className} shrink-0`}>
      <path d={chemin} fill={couleur} stroke={contour} strokeWidth="0.8" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  )
}

export function Regles({ carte, onFermer }) {
  const exemple = useMemo(() => {
    const cible = carte.communes.find((c) => c.fr === 'Namur')
    const noms = ['Ostende', 'Anvers', 'Charleroi', 'Gembloux']
    return noms
      .map((n) => carte.communes.find((c) => c.fr === n))
      .filter(Boolean)
      .map((c) => ({ c, km: distanceKm(carte, c, cible) }))
  }, [carte])

  return (
    <Fenetre titre="Comment jouer ?" onFermer={onFermer}>
      <div className="space-y-3 text-[15px] leading-relaxed text-white/80">
        <p>
          Trouve la <b className="text-white">commune mystère</b> en un minimum d’essais. Chaque commune proposée
          apparaît sur la carte, colorée selon sa distance à la commune mystère : plus c’est{' '}
          <b className="text-red-400">chaud</b>, plus tu es proche. Rouge foncé = elle la touche.
        </p>
        <p>Exemple : si la commune mystère est <b className="text-white">Namur</b>…</p>
      </div>
      <div className="mt-3 rounded-2xl bg-white/[0.04] border border-white/10 divide-y divide-white/5">
        {exemple.map(({ c, km }) => (
          <div key={c.id} className="flex items-center gap-3 px-3 py-2">
            <Silhouette chemin={c.chemin} boite={c.boite} couleur={couleurChaleur(km)} />
            <span className="font-semibold flex-1">{nom(c)}</span>
            <span className="text-sm text-white/60">{km === 0 ? 'touche Namur' : formatKm(km)}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-2">
        <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3 text-sm text-white/70">
          <p className="font-bold text-white mb-0.5">🇧🇪 Belgique · défi du jour</p>
          Une commune parmi les 565 du pays, la même pour toute la journée. Nouvelle commune à minuit.
        </div>
        <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3 text-sm text-white/70">
          <p className="font-bold text-white mb-0.5">🗺️ Provinces · entraînement</p>
          Choisis une province et cherche seulement dans ses communes, autant de parties que tu veux.
          Ton pourcentage de connaissance monte selon les communes que tu connais, ta rapidité et le nombre de parties jouées.
        </div>
      </div>
      <ul className="mt-4 space-y-1.5 text-sm text-white/65">
        <li>✍️ Écris en français ou en néerlandais (Anvers ou Antwerpen), sans te soucier des accents. Les communes s’affichent dans la langue de leur communauté.</li>
        <li>🗺️ Glisse, pince ou utilise + / − pour explorer la carte. Touche une commune colorée pour voir son nom.</li>
        <li>📖 Le bouton Index liste toutes les communes par ordre alphabétique.</li>
        <li>📏 La distance est mesurée entre les frontières les plus proches des deux communes.</li>
      </ul>
      <button type="button" onClick={onFermer} className="mt-5 w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 py-3 font-bold shadow-lg shadow-fuchsia-500/30 active:scale-[0.98] transition">
        C’est parti !
      </button>
    </Fenetre>
  )
}

// Index : les communes (du pays ou d'une province) par ordre alphabétique
export function Index({ communes, essais, cible, fini, echelle, onChoisir, onFermer }) {
  const [filtre, setFiltre] = useState('')
  const kmParId = useMemo(() => new Map(essais.map((e) => [e.id, e.km])), [essais])
  const groupes = useMemo(() => {
    const k = normaliser(filtre)
    const liste = communes
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
  }, [communes, filtre])
  const total = groupes.reduce((s, g) => s + g.items.length, 0)

  return (
    <Fenetre titre={`Index · ${total} commune${total > 1 ? 's' : ''}`} onFermer={onFermer}>
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
                    style={{ background: essaye ? (estCible ? COULEUR_TROUVEE : couleurChaleur(km, echelle)) : 'rgba(255,255,255,0.12)' }}
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

// Fond de page commun
export function FondPage({ children }) {
  return (
    <div className="min-h-dvh bg-[#07031a] text-white relative overflow-x-hidden">
      <style>{STYLES}</style>
      <div className="pointer-events-none absolute -top-32 -left-24 w-96 h-96 rounded-full bg-fuchsia-600/25 blur-3xl" />
      <div className="pointer-events-none absolute top-60 -right-32 w-96 h-96 rounded-full bg-cyan-500/15 blur-3xl" />
      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 pt-5 pb-16">{children}</div>
    </div>
  )
}
