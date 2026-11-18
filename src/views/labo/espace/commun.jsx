import { useEffect, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import CadreJeu from '../../../components/labo/CadreJeu.jsx'
import Scene3D from '../../../components/labo/espace/Scene3D.jsx'
import { VIOLET } from '../../../components/labo/espace/donnees.js'

// =============================================================
//  Éléments communs de l'expérience 04 « L'espace »
//  Couleurs : violet (jamais de bleu : réservé à la météo / cycle de l'eau).
// =============================================================
export const RGB = '166,107,255'
export const RGB2 = '255,162,77'

// Cadre d'une activité de l'espace : violet + orange, ciel étoilé en fond (venu de l'expérience, voir CadreJeu)
export function PageEspace(props) {
  return <CadreJeu rgb={RGB} rgb2={RGB2} couleur={VIOLET} {...props} />
}

// Zone 3D (bordure, fond transparent pour voir les étoiles). Sur tablette/PC : remplit la hauteur.
export function Vue3D({ className = '', hauteur = 'h-[46vh] min-h-[300px]', children, ...scene }) {
  return (
    <div className={`relative rounded-3xl border border-white/12 bg-[#05030f]/35 tab:min-h-0 tab:flex-1 ${className}`}>
      <Scene3D className={`${hauteur} w-full rounded-3xl tab:h-full`} {...scene}>
        {children}
      </Scene3D>
    </div>
  )
}

// Pastille d'avertissement « modèle » (honnêteté scientifique : on dit ce qui n'est pas à l'échelle)
export function PasEchelle({ texte = 'Pas à l’échelle', className = '' }) {
  return (
    <span className={`labo-mono pointer-events-none absolute right-3 top-3 rounded-full border border-white/20 bg-black/50 px-2.5 py-1 text-[10px] tracking-[.08em] text-[#DDE2F7] ${className}`}>{texte}</span>
  )
}

export function Consigne({ children, couleur = VIOLET, className = '' }) {
  return (
    <div className={`rounded-2xl border px-3 py-2.5 text-[14px] leading-snug text-[#E8ECFF] ${className}`} style={{ borderColor: `${couleur}55`, background: 'rgba(11,10,30,.88)' }}>
      {children}
    </div>
  )
}

export function Onglets({ valeur, onChange, options, couleur = VIOLET }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-2xl border border-white/15 bg-[#0B0A1E]/90 p-1">
      {options.map(([v, Icone, nom]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className="flex h-11 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 text-[13px] font-bold"
          style={valeur === v ? { background: couleur, color: '#12062A' } : { color: '#B9C1E3' }}
        >
          {Icone && <Icone size={16} />} {nom}
        </button>
      ))}
    </div>
  )
}

// Curseur large, facile à manipuler au doigt
export function Curseur({ label, valeur, min = 0, max = 100, step = 1, onChange, couleur = VIOLET, format = (v) => v, gauche, droite }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-[#0B0A1E]/85 px-3 pb-2 pt-2">
      <div className="flex items-center justify-between gap-2">
        <span className="labo-mono text-[11px] text-[#B9C1E3]">{label}</span>
        <span className="labo-jeu text-xl leading-none" style={{ color: couleur }}>
          {format(valeur)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={valeur}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 h-9 w-full cursor-pointer"
        style={{ accentColor: couleur }}
        aria-label={label}
      />
      {(gauche || droite) && (
        <div className="-mt-1 flex justify-between text-[10px] text-[#8A93B8]">
          <span>{gauche}</span>
          <span>{droite}</span>
        </div>
      )}
    </div>
  )
}

export function BoutonLecture({ joue, onClick, couleur = VIOLET }) {
  return (
    <button type="button" onClick={onClick} aria-label={joue ? 'Pause' : 'Lecture'} className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl active:scale-95" style={{ background: couleur, color: '#12062A' }}>
      {joue ? <Pause size={22} /> : <Play size={22} />}
    </button>
  )
}

// Réglage de vitesse en 3 boutons (comme C2)
export function Vitesses({ valeur, onChange, options = [['lent', 'Lent'], ['normal', 'Normal'], ['rapide', 'Rapide']], couleur = VIOLET }) {
  return (
    <div className="flex rounded-2xl border border-white/15 bg-[#0B0A1E]/90 p-1">
      {options.map(([v, nom]) => (
        <button key={v} type="button" onClick={() => onChange(v)} className="h-10 flex-1 rounded-xl px-2 text-[12.5px] font-bold" style={valeur === v ? { background: couleur, color: '#12062A' } : { color: '#B9C1E3' }}>
          {nom}
        </button>
      ))}
    </div>
  )
}

// Un nombre qui suit un objet en mouvement sans re-rendre React à 60 images/s :
// lit ref.current toutes les 120 ms.
export function useLecture(ref, lire) {
  const [v, setV] = useState(() => lire(ref.current))
  useEffect(() => {
    const id = setInterval(() => setV(lire(ref.current)), 120)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return v
}

// Petit tableau de faits « étiquette / valeur »
export function Faits({ lignes, couleur = VIOLET }) {
  return (
    <dl className="grid grid-cols-2 gap-1.5">
      {lignes.map(([nom, val, sous]) => (
        <div key={nom} className="rounded-xl bg-[#0B0A1E]/80 px-2.5 py-1.5">
          <dt className="labo-mono text-[10px] text-[#8A93B8]">{nom}</dt>
          <dd className="labo-titre mt-0.5 text-[13px] font-bold leading-tight text-white">{val}</dd>
          {sous && <dd className="text-[10px] leading-tight" style={{ color: couleur }}>{sous}</dd>}
        </div>
      ))}
    </dl>
  )
}

