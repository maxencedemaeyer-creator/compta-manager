import { Link } from 'react-router-dom'
import { ArrowLeft, Gamepad2, Lock, Trophy, Zap, Star, Joystick } from 'lucide-react'

// =============================================================
//  Application Jeux : le « Game Center » de Maxence
//  Pour ajouter un jeu : remplir un emplacement dans JEUX
//  (to = adresse du jeu, pret = true quand il est jouable).
// =============================================================
const JEUX = [
  {
    id: 'jeu-1',
    titre: 'Jeu n°1',
    texte: 'En préparation…',
    couleur: 'from-fuchsia-500 via-purple-500 to-indigo-600',
    lueur: 'shadow-fuchsia-500/40',
    pret: false,
    to: null,
  },
  {
    id: 'jeu-2',
    titre: 'Jeu n°2',
    texte: 'En préparation…',
    couleur: 'from-cyan-400 via-sky-500 to-blue-600',
    lueur: 'shadow-cyan-400/40',
    pret: false,
    to: null,
  },
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

function CarteJeu({ jeu, numero }) {
  const contenu = (
    <div
      className={`relative h-full rounded-3xl p-[2px] bg-gradient-to-br ${jeu.couleur} shadow-xl ${jeu.lueur} transition-transform duration-200 ${
        jeu.pret ? 'hover:-translate-y-1 hover:scale-[1.02]' : ''
      }`}
    >
      <div className="relative h-full rounded-[22px] bg-slate-950/90 overflow-hidden p-5 flex flex-col">
        {/* Reflet qui balaie la carte */}
        <div className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 jx-balaye" />

        <div className="flex items-start justify-between">
          <span className="font-mono text-xs tracking-[0.3em] text-white/40">SLOT 0{numero}</span>
          {jeu.pret ? (
            <span className="text-[10px] font-bold tracking-widest px-2 py-1 rounded-full bg-emerald-400/20 text-emerald-300">
              JOUER
            </span>
          ) : (
            <span className="text-[10px] font-bold tracking-widest px-2 py-1 rounded-full bg-white/10 text-white/60">
              BIENTÔT
            </span>
          )}
        </div>

        <div className="flex-1 flex items-center justify-center py-8">
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${jeu.couleur} flex items-center justify-center shadow-lg ${jeu.lueur} ${jeu.pret ? '' : 'opacity-60'}`}>
            {jeu.pret ? <Joystick size={38} /> : <Lock size={34} />}
          </div>
        </div>

        <p className="font-bold text-lg tracking-tight">{jeu.titre}</p>
        <p className="text-sm text-white/50">{jeu.texte}</p>
      </div>
    </div>
  )

  return jeu.pret && jeu.to ? (
    <Link to={jeu.to} className="block h-full">{contenu}</Link>
  ) : (
    <div className="h-full cursor-default">{contenu}</div>
  )
}

export default function JeuxView() {
  const prets = JEUX.filter((j) => j.pret).length

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
                LV 1
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-lg leading-tight">Maxence</p>
              <p className="text-xs text-white/50">Joueur principal</p>
              <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full w-[8%] rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 jx-pulse" />
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-white/[0.04] py-2">
              <Joystick size={16} className="mx-auto text-fuchsia-400" />
              <p className="font-black text-lg mt-0.5">{prets}/{JEUX.length}</p>
              <p className="text-[10px] uppercase tracking-wider text-white/40">Jeux</p>
            </div>
            <div className="rounded-2xl bg-white/[0.04] py-2">
              <Trophy size={16} className="mx-auto text-amber-300" />
              <p className="font-black text-lg mt-0.5">0</p>
              <p className="text-[10px] uppercase tracking-wider text-white/40">Trophées</p>
            </div>
            <div className="rounded-2xl bg-white/[0.04] py-2">
              <Star size={16} className="mx-auto text-cyan-300" />
              <p className="font-black text-lg mt-0.5">—</p>
              <p className="text-[10px] uppercase tracking-wider text-white/40">Record</p>
            </div>
          </div>
        </div>

        {/* Liste des jeux */}
        <div className="mt-8 flex items-center gap-2">
          <Zap size={16} className="text-amber-300" />
          <h2 className="font-mono text-sm tracking-[0.25em] text-white/70">SÉLECTIONNE UN JEU</h2>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:gap-5">
          {JEUX.map((jeu, i) => (
            <CarteJeu key={jeu.id} jeu={jeu} numero={i + 1} />
          ))}
        </div>

        <p className="mt-10 text-center font-mono text-xs tracking-[0.3em] text-white/40">
          INSERT COIN <span className="jx-clignote">▮</span>
        </p>
      </div>
    </div>
  )
}
