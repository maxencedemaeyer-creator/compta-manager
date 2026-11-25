import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useRetourSalle } from '../CadreJeu.jsx'
import PiedLabo from '../PiedLabo.jsx'
import LogoActivite from '../LogoActivite.jsx'
import { activiteDepuisAdresse } from '../../../config/laboAteliers.js'
import { useLocation } from 'react-router-dom'
import './regles.css'

// =============================================================
//  Pièces communes de l'expérience « Règle de 3 » (thème clair).
//  Pas de 3D, pas de photos : des schémas dessinés (SVG).
// =============================================================

// Polices (chargées une seule fois ; sans réseau, polices du système)
if (typeof document !== 'undefined' && !document.getElementById('polices-regles')) {
  const lien = document.createElement('link')
  lien.id = 'polices-regles'
  lien.rel = 'stylesheet'
  lien.href = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@500;700;800&display=swap'
  document.head.appendChild(lien)
}

// Palette (contrastes vérifiés sur le fond crème)
export const C = {
  fond: '#FFF8EC',
  carte: '#FFFFFF',
  bord: '#EBD9C4',
  texte: '#3E2A35',
  doux: '#6F5864',
  rose: '#C24C68', // boutons (texte blanc dessus)
  roseClair: '#FBE3E6',
  sauge: '#2F6F5C',
  saugeClair: '#E3F1EA',
  abricot: '#B8661C',
  abricotClair: '#FDEBD3',
  bleu: '#3C6E96',
  bleuClair: '#E2EFF8',
  lilas: '#6B55A0',
  lilasClair: '#EEE8F8',
  ok: '#2F7D4F',
  okClair: '#E1F3E6',
  non: '#A3412F',
  nonClair: '#FBE6E1',
}

// Décor très doux : trois grosses taches de couleur floues
export function DecorRegles() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -left-24 -top-16 h-80 w-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(244,166,160,.35), rgba(244,166,160,0) 70%)' }} />
      <div className="absolute -right-24 top-1/3 h-80 w-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(155,203,176,.30), rgba(155,203,176,0) 70%)' }} />
      <div className="absolute -bottom-24 left-1/4 h-80 w-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(246,199,126,.28), rgba(246,199,126,0) 70%)' }} />
    </div>
  )
}

// Cadre d'une activité : fond crème, retour, logo, nom. (comme CadreJeu mais clair)
export function PageRegles({ children, large = false, tresLarge = false, droite }) {
  const retour = useRetourSalle()
  const { pathname } = useLocation()
  const { activite } = activiteDepuisAdresse(pathname)
  return (
    <div className="regles relative min-h-[100dvh] overflow-x-hidden">
      <DecorRegles />
      <div className={`relative mx-auto flex min-h-[100dvh] flex-col gap-4 px-4 pb-10 pt-[max(16px,env(safe-area-inset-top))] ${tresLarge ? 'max-w-6xl' : large ? 'max-w-4xl' : 'max-w-xl'}`}>
        <header className="flex items-center gap-3">
          <Link
            to={retour}
            aria-label="Retour à l’expérience"
            className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl border bg-white active:scale-95"
            style={{ borderColor: C.bord, color: C.texte }}
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </Link>
          {activite && <LogoActiviteClair activite={activite} taille={44} />}
          <div className="min-w-0 flex-1">
            <p className="regles-mono truncate text-[11px] uppercase" style={{ color: C.doux }}>
              Règle de 3 · activité {activite?.code}
            </p>
            <h1 className="regles-titre truncate text-[26px] leading-tight" style={{ color: C.texte }}>
              {activite?.nom}
            </h1>
          </div>
          {droite}
        </header>
        {children}
        <PiedLabo clair />
      </div>
    </div>
  )
}

// Logo d'activité (tuile pastel, icône prune) pour le thème clair
export function LogoActiviteClair({ activite, taille = 64, className = '' }) {
  const c = activite.couleur
  return (
    <span
      className={`flex flex-none items-center justify-center rounded-[28%] ${className}`}
      style={{ width: taille, height: taille, background: c, boxShadow: `0 4px 14px ${c}88, inset 0 -3px 0 rgba(62,42,53,.12)` }}
    >
      <activite.icon size={Math.round(taille * 0.54)} strokeWidth={2.2} color="#3E2A35" />
    </span>
  )
}

export function CarteR({ children, className = '', couleur = C.bord, fond = C.carte, style }) {
  return (
    <div className={`rounded-3xl border-2 p-4 ${className}`} style={{ background: fond, borderColor: couleur, ...style }}>
      {children}
    </div>
  )
}

export function BoutonR({ children, onClick, variante = 'principal', couleur = C.rose, className = '', ...props }) {
  const styles =
    variante === 'principal'
      ? { background: couleur, color: '#fff' }
      : { background: '#fff', color: C.texte, border: `2px solid ${C.bord}` }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`regles-titre flex min-h-[48px] items-center justify-center gap-2 rounded-2xl px-5 text-[16px] transition active:scale-[.97] disabled:opacity-40 ${className}`}
      style={styles}
      {...props}
    >
      {children}
    </button>
  )
}

// Phrase d'explication en haut d'une activité
export function Consigne({ children, couleur = C.rose }) {
  return (
    <div className="rounded-2xl border-2 px-3.5 py-3 text-[15px] leading-snug" style={{ borderColor: `${couleur}66`, background: '#fff', color: C.texte }}>
      {children}
    </div>
  )
}

// Petit sélecteur à onglets (modes d'une activité)
export function Onglets({ valeur, onChange, options, couleur = C.rose }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-2xl border-2 bg-white p-1" style={{ borderColor: C.bord }}>
      {options.map(([v, Icone, nom]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className="regles-titre flex min-h-[44px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-[14px]"
          style={valeur === v ? { background: couleur, color: '#fff' } : { color: C.doux }}
        >
          {Icone && <Icone size={16} />} {nom}
        </button>
      ))}
    </div>
  )
}

// Bulle de retour après une réponse (bien / pas tout à fait)
export function Retour({ ok, titre, children }) {
  return (
    <div
      role="status"
      className="regles-apparait rounded-2xl border-2 px-3.5 py-3 text-[15px] leading-snug"
      style={{ borderColor: ok ? C.ok : C.abricot, background: ok ? C.okClair : C.abricotClair, color: C.texte }}
    >
      {titre && (
        <p className="regles-titre text-[16px]" style={{ color: ok ? C.ok : C.abricot }}>
          {titre}
        </p>
      )}
      {children}
    </div>
  )
}

export { melanger } from '../CadreJeu.jsx'
