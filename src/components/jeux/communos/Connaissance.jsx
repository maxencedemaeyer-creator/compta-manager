// =============================================================
//  Anneau de progression « connaissance » (0 à 100 %)
// =============================================================
export function couleurConnaissance(score) {
  if (score >= 80) return '#22d3ee'
  if (score >= 60) return '#a78bfa'
  if (score >= 40) return '#e879f9'
  if (score >= 20) return '#f59e0b'
  return '#64748b'
}

export function AnneauConnaissance({ score, taille = 56, epaisseur = 5 }) {
  const r = (taille - epaisseur) / 2
  const tour = 2 * Math.PI * r
  const couleur = couleurConnaissance(score)
  return (
    <div className="relative shrink-0" style={{ width: taille, height: taille }}>
      <svg width={taille} height={taille} className="-rotate-90">
        <circle cx={taille / 2} cy={taille / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={epaisseur} />
        <circle
          cx={taille / 2}
          cy={taille / 2}
          r={r}
          fill="none"
          stroke={couleur}
          strokeWidth={epaisseur}
          strokeLinecap="round"
          strokeDasharray={`${(tour * Math.max(0, Math.min(100, score))) / 100} ${tour}`}
          style={{ filter: `drop-shadow(0 0 4px ${couleur})`, transition: 'stroke-dasharray .6s ease' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-black tabular-nums" style={{ fontSize: taille * 0.27 }}>
        {score}
        <span className="text-[0.55em] opacity-60">%</span>
      </span>
    </div>
  )
}

// Petite barre de détail (communes connues, rapidité, expérience)
export function BarreDetail({ label, valeur, texte }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] text-white/55">
        <span>{label}</span>
        <span className="tabular-nums">{texte}</span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400" style={{ width: `${Math.round(valeur * 100)}%` }} />
      </div>
    </div>
  )
}
