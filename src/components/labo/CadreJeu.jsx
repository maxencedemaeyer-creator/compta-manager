import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { DecorLabo } from './DecorLabo.jsx'
import '../../views/labo/labo.css'

// =============================================================
//  Cadre commun à toutes les paillasses du labo :
//  décor, bouton retour, titre, attendus du référentiel, score.
// =============================================================
// Adresse de la salle de l'expérience : /labo/locomoteur/miroir → /labo/locomoteur
export function useRetourSalle() {
  const { pathname } = useLocation()
  const morceaux = pathname.replace(/\/+$/, '').split('/')
  return morceaux.length > 3 ? morceaux.slice(0, -1).join('/') : '/labo'
}

export default function CadreJeu({ code, titre, attendus = [], couleur = '#7CFF6B', droite, children, large = false }) {
  const retour = useRetourSalle()
  return (
    <div className="labo relative min-h-[100dvh] overflow-x-hidden">
      <DecorLabo flash={false} />
      <div className={`relative mx-auto flex min-h-[100dvh] flex-col gap-4 px-4 pb-10 pt-[max(16px,env(safe-area-inset-top))] ${large ? 'max-w-5xl' : 'max-w-xl'}`}>
        <header className="flex items-center gap-3">
          <Link
            to={retour}
            aria-label="Retour à l’expérience"
            className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl border border-white/15 text-[#E8ECFF] active:scale-95"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="labo-mono truncate text-[11px] tracking-[.1em]" style={{ color: couleur }}>
              {code ? `PAILLASSE ${code}` : "LE CORPS EN 3D"}
              {attendus.length > 0 && ` · ATTENDUS ${attendus.join(', ')}`}
            </p>
            <h1 className="labo-titre truncate text-xl font-bold text-[#F4F6FF]">{titre}</h1>
          </div>
          {droite}
        </header>
        {children}
      </div>
    </div>
  )
}

// Grand message de réussite avec onde lumineuse (s'efface tout seul)
export function Eclat({ message, sousTitre, couleur = '#7CFF6B', cle }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!message) return
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 2400)
    return () => clearTimeout(t)
  }, [message, cle])
  if (!visible || !message) return null
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      <div className="labo-onde absolute h-40 w-40 rounded-full" style={{ background: `radial-gradient(circle, ${couleur}, transparent 70%)` }} />
      <div className="labo-succes relative mx-6 rounded-3xl border px-6 py-4 text-center" style={{ borderColor: couleur, background: 'rgba(7,11,22,.92)' }}>
        <p className="labo-titre text-2xl font-black" style={{ color: couleur }}>
          {message}
        </p>
        {sousTitre && <p className="mt-1 text-sm text-[#DDE2F7]">{sousTitre}</p>}
      </div>
    </div>
  )
}

export function Bouton({ children, onClick, variante = 'principal', couleur = '#7CFF6B', className = '', ...props }) {
  const styles =
    variante === 'principal'
      ? { background: couleur, color: '#06120A' }
      : { background: 'rgba(18,26,48,.85)', color: '#E8ECFF', border: '1px solid rgba(232,236,255,.2)' }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`labo-titre flex min-h-[48px] items-center justify-center gap-2 rounded-2xl px-5 text-[15px] font-bold transition active:scale-[.97] disabled:opacity-40 ${className}`}
      style={styles}
      {...props}
    >
      {children}
    </button>
  )
}

export function Carte({ children, className = '', couleur = 'rgba(124,255,107,.35)', style }) {
  return (
    <div className={`rounded-3xl border p-4 ${className}`} style={{ background: 'rgba(18,26,48,.85)', borderColor: couleur, ...style }}>
      {children}
    </div>
  )
}

export function melanger(liste) {
  const a = [...liste]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
