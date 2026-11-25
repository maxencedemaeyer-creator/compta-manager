import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Gamepad2, Loader2, Lock, Plus, Trash2, Trophy, X, Zap, Flame, Joystick, MapPinned, WholeWord } from 'lucide-react'
import { usePin } from '../context/PinContext.jsx'
import { faviconDe, hoteDe, normaliserUrl } from '../config/apps.js'
import { useCommunos } from '../hooks/useCommunos.js'
import { dateDuJour, statistiques } from '../utils/communos.js'

// =============================================================
//  Application Jeux : le « Game Center » de Maxence
//  Pour ajouter un jeu : remplir un emplacement dans JEUX
//  (to = adresse du jeu, pret = true quand il est jouable).
// =============================================================
const JEUX = [
  {
    id: 'communos',
    titre: 'COMMUNOS',
    texte: 'Commune du jour + entraînement par province',
    couleur: 'from-fuchsia-500 via-purple-500 to-indigo-600',
    lueur: 'shadow-fuchsia-500/40',
    icon: MapPinned,
    pret: true,
    to: '/maxence/jeux/communos',
  },
  {
    id: 'motus',
    titre: 'MOTUS',
    texte: 'Le mot en 6 essais · parties illimitées',
    couleur: 'from-lime-300 via-emerald-500 to-sky-600',
    lueur: 'shadow-lime-400/40',
    icon: WholeWord,
    pret: true,
    to: '/maxence/jeux/motus',
  },
]

// Jeux ajoutés à la main (liens vers un site) : couleurs néon en rotation
const COULEURS_PERSO = [
  { couleur: 'from-cyan-400 via-sky-500 to-blue-600', lueur: 'shadow-cyan-400/40' },
  { couleur: 'from-amber-300 via-orange-500 to-rose-600', lueur: 'shadow-orange-400/40' },
  { couleur: 'from-pink-400 via-rose-500 to-red-600', lueur: 'shadow-pink-500/40' },
  { couleur: 'from-emerald-300 via-teal-500 to-cyan-600', lueur: 'shadow-teal-400/40' },
]

// Animations propres au Game Center
const STYLES = `
@keyframes jx-grille { from { background-position: 0 0; } to { background-position: 0 48px; } }
@keyframes jx-flotte { 0%,100% { transform: translateY(0) rotate(-6deg); } 50% { transform: translateY(-10px) rotate(6deg); } }
@keyframes jx-clignote { 0%,49% { opacity: 1; } 50%,100% { opacity: 0; } }
@keyframes jx-balaye { from { transform: translateX(-120%); } to { transform: translateX(220%); } }
@keyframes jx-pulse { 0%,100% { opacity: .55; } 50% { opacity: 1; } }
.jx-grille {
  background-image:
    linear-gradient(rgba(168,85,247,.25) 1px, transparent 1px),
    linear-gradient(90deg, rgba(168,85,247,.25) 1px, transparent 1px);
  background-size: 48px 48px;
  animation: jx-grille 2.5s linear infinite;
  transform: perspective(420px) rotateX(62deg);
  transform-origin: top center;
  mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
}
.jx-flotte { animation: jx-flotte 4s ease-in-out infinite; }
.jx-clignote { animation: jx-clignote 1.1s steps(1) infinite; }
.jx-balaye { animation: jx-balaye 2.8s ease-in-out infinite; }
.jx-pulse { animation: jx-pulse 2.2s ease-in-out infinite; }
.jx-titre {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  text-shadow: 0 0 12px rgba(217,70,239,.8), 0 0 32px rgba(99,102,241,.6);
}
@media (prefers-reduced-motion: reduce) {
  .jx-grille, .jx-flotte, .jx-clignote, .jx-balaye, .jx-pulse { animation: none; }
}
`

function CarteJeu({ jeu, numero, onSupprimer }) {
  const Icone = jeu.icon || Joystick
  const [echec, setEchec] = useState(false)
  const favicon = jeu.externe && !echec ? faviconDe(jeu.url) : null
  const contenu = (
    <div
      className={`relative h-full rounded-3xl p-[2px] bg-gradient-to-br ${jeu.couleur} shadow-xl ${jeu.lueur} transition-transform duration-200 ${
        jeu.pret ? 'hover:-translate-y-1 hover:scale-[1.02]' : ''
      }`}
    >
      <div className="relative h-full rounded-[22px] bg-slate-950/90 overflow-hidden p-4 flex flex-col">
        {/* Reflet qui balaie la carte */}
        <div className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 jx-balaye" />

        <div className="flex items-start justify-between">
          <span className="font-mono text-xs tracking-[0.3em] text-white/40">SLOT 0{numero}</span>
        </div>

        <div className="flex-1 flex items-center justify-center py-5">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${jeu.couleur} flex items-center justify-center shadow-lg ${jeu.lueur} ${jeu.pret ? '' : 'opacity-60'}`}>
            {favicon ? (
              <span className="w-11 h-11 rounded-xl bg-white flex items-center justify-center">
                <img src={favicon} alt="" referrerPolicy="no-referrer" onError={() => setEchec(true)} className="w-7 h-7 object-contain" />
              </span>
            ) : jeu.pret ? (
              <Icone size={32} />
            ) : (
              <Lock size={28} />
            )}
          </div>
        </div>

        <p className="font-bold text-lg tracking-tight">{jeu.titre}</p>
      </div>
    </div>
  )

  if (jeu.externe) {
    return (
      <div className="relative h-full">
        <a href={jeu.url} target="_blank" rel="noopener noreferrer" className="block h-full">{contenu}</a>
        <button
          type="button"
          onClick={() => onSupprimer(jeu)}
          className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/10 hover:bg-red-500/30 text-white/50 hover:text-red-200 flex items-center justify-center transition-colors"
          aria-label={`Supprimer ${jeu.titre}`}
        >
          <Trash2 size={14} />
        </button>
      </div>
    )
  }
  return jeu.pret && jeu.to ? (
    <Link to={jeu.to} className="block h-full">{contenu}</Link>
  ) : (
    <div className="h-full cursor-default">{contenu}</div>
  )
}

// Slot vide « NOUVEAU JEU » : ouvre la fenêtre d'ajout
function SlotNouveau({ numero, onClick }) {
  return (
    <button type="button" onClick={onClick} className="group relative h-full w-full text-left">
      <div className="relative h-full rounded-3xl p-[2px] bg-gradient-to-br from-fuchsia-500/40 via-purple-500/30 to-cyan-400/40 group-hover:from-fuchsia-500 group-hover:to-cyan-400 group-hover:shadow-xl group-hover:shadow-fuchsia-500/30 transition-all duration-200 group-hover:-translate-y-1">
        <div className="relative h-full rounded-[22px] bg-slate-950/90 border-2 border-dashed border-white/10 p-4 flex flex-col">
          <div className="flex items-start justify-between">
            <span className="font-mono text-xs tracking-[0.3em] text-white/40">SLOT 0{numero}</span>
          </div>
          <div className="flex-1 flex items-center justify-center py-5">
            <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-white/20 group-hover:border-fuchsia-400 group-hover:shadow-lg group-hover:shadow-fuchsia-500/40 flex items-center justify-center text-white/40 group-hover:text-fuchsia-300 transition-all">
              <Plus size={32} />
            </div>
          </div>
          <p className="font-bold text-lg tracking-tight text-white/70">NOUVEAU JEU</p>
        </div>
      </div>
    </button>
  )
}

// Fenêtre d'ajout d'un jeu (lien vers un site)
function FenetreNouveauJeu({ onFermer, onAjouter }) {
  const [url, setUrl] = useState('')
  const [nom, setNom] = useState('')
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const adresse = normaliserUrl(url)
  const apercu = adresse ? faviconDe(adresse) : null

  async function valider(e) {
    e.preventDefault()
    if (!adresse) return setErreur("Cette adresse n'a pas l'air valide (ex. chess.com).")
    setEnvoi(true)
    setErreur('')
    try {
      await onAjouter({ nom: nom.trim() || hoteDe(adresse), url: adresse })
      onFermer()
    } catch (err) {
      setErreur(err.message || "Impossible d'ajouter le jeu.")
      setEnvoi(false)
    }
  }

  const champ = 'w-full rounded-xl bg-white/[0.06] border border-white/15 px-3 py-2.5 text-base text-white placeholder:text-white/30 outline-none focus:border-fuchsia-400 focus:shadow-[0_0_16px_rgba(217,70,239,.35)]'
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onFermer}>
      <form onSubmit={valider} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-3xl p-[2px] bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-400 shadow-2xl shadow-fuchsia-500/30">
        <div className="rounded-[22px] bg-[#0c0626] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-mono text-[10px] tracking-[0.3em] text-cyan-300/80">NOUVEAU SLOT</p>
              <h2 className="jx-titre text-xl font-black uppercase">Ajouter un jeu</h2>
            </div>
            <button type="button" onClick={onFermer} className="w-9 h-9 rounded-full flex items-center justify-center text-white/50 hover:bg-white/10" aria-label="Fermer">
              <X size={18} />
            </button>
          </div>
          <label className="block font-mono text-xs tracking-widest text-white/50 mb-1">ADRESSE DU SITE</label>
          <input autoFocus inputMode="url" autoCapitalize="none" autoCorrect="off" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.chess.com" className={`${champ} mb-3`} />
          <label className="block font-mono text-xs tracking-widest text-white/50 mb-1">NOM DU JEU</label>
          <div className="flex items-center gap-3 mb-1">
            <span className="w-11 h-11 rounded-xl bg-white/[0.06] border border-white/15 flex items-center justify-center shrink-0">
              {apercu ? <img src={apercu} alt="" className="w-7 h-7 object-contain" /> : <Plus size={18} className="text-white/30" />}
            </span>
            <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder={adresse ? hoteDe(adresse) : 'Échecs'} maxLength={24} className={champ} />
          </div>
          <p className="text-xs text-white/40 mb-4">L'icône est celle du site (favicon).</p>
          {erreur && <p className="text-sm text-red-400 mb-3">{erreur}</p>}
          <button type="submit" disabled={envoi || !url.trim()} className="w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-400 disabled:opacity-40 text-slate-950 font-black tracking-widest py-3 inline-flex items-center justify-center gap-2 shadow-lg shadow-fuchsia-500/30">
            {envoi && <Loader2 size={16} className="animate-spin" />}
            AJOUTER AU GAME CENTER
          </button>
        </div>
      </form>
    </div>
  )
}

export default function JeuxView() {
  const { parametres, majParametres } = usePin()
  const [ajout, setAjout] = useState(false)
  const perso = (parametres.jeuxPerso || []).map((j, i) => ({
    id: j.id,
    titre: j.nom.toUpperCase(),
    texte: hoteDe(j.url),
    url: j.url,
    externe: true,
    pret: true,
    ...COULEURS_PERSO[i % COULEURS_PERSO.length],
  }))
  const tous = [...JEUX, ...perso]
  const prets = tous.filter((j) => j.pret).length

  async function ajouterJeu({ nom, url }) {
    const id = `jeu-${Date.now().toString(36)}`
    await majParametres({ jeuxPerso: [...(parametres.jeuxPerso || []), { id, nom, url }] })
  }
  function supprimerJeu(jeu) {
    if (!window.confirm(`Retirer « ${jeu.titre} » du Game Center ?`)) return
    majParametres({ jeuxPerso: (parametres.jeuxPerso || []).filter((j) => j.id !== jeu.id) })
  }
  const { parties } = useCommunos()
  const aujourdhui = dateDuJour()
  const stats = statistiques(parties, aujourdhui)
  const niveau = 1 + Math.floor(stats.gagnees / 5)
  const progression = ((stats.gagnees % 5) / 5) * 100

  return (
    <div className="min-h-dvh bg-[#07031a] text-white relative overflow-hidden">
      <style>{STYLES}</style>

      {/* Décor : halos néon + sol quadrillé en perspective */}
      <div className="pointer-events-none absolute -top-32 -left-24 w-96 h-96 rounded-full bg-fuchsia-600/30 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -right-32 w-96 h-96 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-[-50%] bottom-0 h-[55%] jx-grille" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
        <Link to="/maxence" className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors">
          <ArrowLeft size={16} />
          Maxence
        </Link>

        {/* En-tête */}
        <div className="mt-8 flex items-center gap-4">
          <div className="jx-flotte w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-purple-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-fuchsia-500/50 shrink-0">
            <Gamepad2 size={34} />
          </div>
          <div>
            <p className="font-mono text-[11px] tracking-[0.35em] text-cyan-300/80">GAME CENTER</p>
            <h1 className="jx-titre text-3xl sm:text-5xl font-black tracking-tight uppercase">Jeux</h1>
          </div>
        </div>

        {/* Carte joueur */}
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.05] backdrop-blur p-4 sm:p-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-300 to-pink-500 flex items-center justify-center text-2xl font-black text-slate-950">
                M
              </div>
              <span className="absolute -bottom-1 -right-1 text-[10px] font-black px-1.5 py-0.5 rounded-md bg-cyan-400 text-slate-950">
                LV {niveau}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-lg leading-tight">Maxence</p>
              <p className="text-xs text-white/50">Joueur principal</p>
              <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 jx-pulse" style={{ width: `${Math.max(6, progression)}%` }} />
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-white/[0.04] py-2">
              <Joystick size={16} className="mx-auto text-fuchsia-400" />
              <p className="font-black text-lg mt-0.5">{prets}/{tous.length}</p>
              <p className="text-[10px] uppercase tracking-wider text-white/40">Jeux</p>
            </div>
            <div className="rounded-2xl bg-white/[0.04] py-2">
              <Trophy size={16} className="mx-auto text-amber-300" />
              <p className="font-black text-lg mt-0.5">{stats.gagnees}</p>
              <p className="text-[10px] uppercase tracking-wider text-white/40">Trophées</p>
            </div>
            <div className="rounded-2xl bg-white/[0.04] py-2">
              <Flame size={16} className="mx-auto text-orange-400" />
              <p className="font-black text-lg mt-0.5">{stats.serie}</p>
              <p className="text-[10px] uppercase tracking-wider text-white/40">Série</p>
            </div>
          </div>
        </div>

        {/* Liste des jeux */}
        <div className="mt-8 flex items-center gap-2">
          <Zap size={16} className="text-amber-300" />
          <h2 className="font-mono text-sm tracking-[0.25em] text-white/70">SÉLECTIONNE UN JEU</h2>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:gap-5">
          {tous.map((jeu, i) => (
            <CarteJeu key={jeu.id} jeu={jeu} numero={i + 1} onSupprimer={supprimerJeu} />
          ))}
          <SlotNouveau numero={tous.length + 1} onClick={() => setAjout(true)} />
        </div>

        <p className="mt-10 text-center font-mono text-xs tracking-[0.3em] text-white/40">
          INSERT COIN <span className="jx-clignote">▮</span>
        </p>
      </div>
      {ajout && <FenetreNouveauJeu onFermer={() => setAjout(false)} onAjouter={ajouterJeu} />}
    </div>
  )
}
