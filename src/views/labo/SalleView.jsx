import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, FlaskConical, Hourglass, Rotate3d, Sparkles, Trophy, X } from 'lucide-react'
import { DecorLabo } from '../../components/labo/DecorLabo.jsx'
import VisuelExperience from '../../components/labo/VisuelExperience.jsx'
import { EXPERIENCE } from '../../config/laboAteliers.js'
import './labo.css'
import PiedLabo from '../../components/labo/PiedLabo.jsx'
import LogoActivite from '../../components/labo/LogoActivite.jsx'
import SalleRegles from '../../components/labo/regles/SalleRegles.jsx'

// =============================================================
//  La salle d'une expérience (/labo/:experience) : le chapitre,
//  son visuel, l'activité vedette et toutes ses activités.
//  Chaque activité a une identité « comme une appli » : son logo
//  au centre, son nom en UN mot (police des jeux), sa consigne.
//  L'activité « Défi » (test: true) est le grand test de
//  l'expérience : carte jaune pleine largeur, en évidence.
//  Les attendus ne sont PAS affichés (gardés dans laboAteliers.js).
// =============================================================

export default function SalleView() {
  const { experience } = useParams()
  const e = EXPERIENCE[experience]
  const [apercu, setApercu] = useState(null)
  if (!e) return <Navigate to="/labo" replace />
  // Expérience en thème clair (« Règle de 3 ») : sa propre salle
  if (e.clair) return <SalleRegles e={e} />

  const vedette = e.vedette && e.activites.find((a) => a.id === e.vedette.id)
  const test = e.activites.find((a) => a.test)
  const autres = e.activites.filter((a) => a !== vedette && a !== test)
  const enPreparation = e.activites.every((a) => a.pret === false)

  const visuel = (
    <div className="relative h-44 w-28 flex-none overflow-hidden tab:h-24 md:h-24 tab:w-16 md:w-16 rounded-2xl border bg-[#070B16]/70" style={{ borderColor: `${e.couleur}66` }}>
      <VisuelExperience type={e.visuel} className="h-full w-full" />
      {e.explorateur && (
        <span className="labo-mono absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 py-1 text-[10px] font-bold text-[#06210A]" style={{ background: `${e.couleur}E6` }}>
          <Rotate3d size={12} /> EXPLORER
        </span>
      )}
    </div>
  )

  return (
    <div className="labo relative min-h-[100dvh] overflow-x-hidden tab:h-[100dvh] tab:overflow-hidden">
      <DecorLabo rgb={e.rgb} rgb2={e.rgb2} flash={false} fond={e.fond} />
      <div className="relative mx-auto flex max-w-5xl flex-col gap-5 px-5 pb-12 pt-[max(16px,env(safe-area-inset-top))] tab:h-[100dvh] tab:max-w-6xl tab:gap-2 tab:pb-1 tab:pt-[max(8px,env(safe-area-inset-top))]">
        <header className="flex items-center gap-3">
          <Link to="/labo" aria-label="Retour au hall du labo" className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl border border-white/15 text-[#E8ECFF] active:scale-95">
            <ArrowLeft size={20} strokeWidth={2.5} />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="labo-mono flex items-center gap-1.5 text-[11px] tracking-[.12em]" style={{ color: e.couleur }}>
              <FlaskConical size={13} /> LE LABO DE SCIENCES
            </p>
            <p className="labo-titre truncate text-sm font-bold text-[#B9C1E3]">Expérience {e.numero}</p>
          </div>
        </header>

        <section className="labo-apparait rounded-3xl border bg-[#121A30]/85 p-4 tab:p-3 md:p-3" style={{ borderColor: `${e.couleur}59` }}>
          <span className="labo-mono text-[11px] tracking-[.1em] tab:hidden md:hidden" style={{ color: e.couleur }}>
            EXPÉRIENCE N° {e.numero}
          </span>
          <div className="mt-3 flex gap-4 tab:mt-0 md:mt-0 tab:items-center md:items-center">
            {e.explorateur ? (
              <Link to={`/labo/${e.id}/${e.explorateur.lien}`} aria-label={`Explorer : ${e.explorateur.titre}`} className="active:scale-[.97]">
                {visuel}
              </Link>
            ) : (
              visuel
            )}
            <div className="flex min-w-0 flex-col justify-between gap-2 tab:flex-1 tab:flex-row md:flex-row tab:items-center md:items-center tab:gap-4 md:gap-4">
              <div className="tab:min-w-0 tab:flex-1">
                <h1 className="labo-titre text-[24px] font-black leading-tight text-[#F4F6FF] tab:text-[22px] md:text-[22px]">{e.titre}</h1>
                <p className="mt-1 text-[11px] leading-snug text-[#8A93B8]">{e.accroche}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {e.chiffres.map((c, i) => (
                  <span key={c} className="rounded-full px-2 py-1 text-[11px]" style={i % 2 ? { background: `rgba(${e.rgb2},.15)`, color: e.couleur2 } : { background: `rgba(${e.rgb},.15)`, color: e.couleur }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {enPreparation && (
          <div className="flex items-start gap-3 rounded-2xl border p-3 text-sm" style={{ borderColor: `${e.couleur}55`, background: `rgba(${e.rgb},.08)`, color: '#E8ECFF' }}>
            <Hourglass size={20} className="mt-0.5 flex-none" style={{ color: e.couleur }} />
            <p>Ce labo est en construction : touche une activité pour voir ce qu’on y fera.</p>
          </div>
        )}

        {vedette && (
          <Link
            to={`/labo/${e.id}/${vedette.id}`}
            className="labo-apparait relative overflow-hidden rounded-3xl border-2 p-4 tab:p-2.5 md:p-2.5 active:scale-[.98]"
            style={{ borderColor: vedette.couleur, background: 'rgba(12,20,40,.9)' }}
          >
            <span className="labo-scan opacity-60" style={{ background: vedette.couleur }} />
            <div className="relative flex items-center gap-4">
              <LogoActivite activite={vedette} taille={56} />
              <div className="min-w-0 flex-1">
                <p className="labo-mono flex items-center gap-1.5 text-[11px] tracking-[.1em]" style={{ color: vedette.couleur }}>
                  <Sparkles size={12} /> ACTIVITÉ VEDETTE · {vedette.code}
                </p>
                <p className="labo-jeu text-[28px] leading-tight tab:text-[24px] md:text-[24px]" style={{ color: vedette.couleur }}>
                  {vedette.nom}
                </p>
                <p className="text-sm text-[#B9C1E3]">{e.vedette.texte}</p>
              </div>
              <ArrowRight className="flex-none" style={{ color: vedette.couleur }} />
            </div>
          </Link>
        )}

        <h2 className="labo-titre text-[15px] font-medium text-[#F4F6FF] tab:-mb-1 md:-mb-1 tab:text-sm md:text-sm">Les activités</h2>

        <div className="tab:min-h-0 tab:flex-1 tab:overflow-y-auto">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5 tab:grid-cols-6 tab:gap-2">
          {autres.map((a, i) => {
            const contenu = (
              <>
                <span className="labo-mono absolute left-3 top-2.5 text-[11px]" style={{ color: a.couleur }}>
                  {a.code}
                </span>
                {a.pret === false && <span className="labo-mono absolute right-2.5 top-2 rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] text-[#B9C1E3]">BIENTÔT</span>}
                <LogoActivite activite={a} taille={56} className="mt-3 tab:mt-2 md:mt-2" />
                <span className="labo-jeu break-words text-[22px] leading-none tab:text-[19px] md:text-[19px]" style={{ color: a.couleur }}>
                  {a.nom}
                </span>
                <span className="text-[11px] leading-snug text-[#8A93B8] tab:line-clamp-2 md:line-clamp-2 tab:text-[10px] md:text-[10px]">{a.consigne}</span>
              </>
            )
            const classes = 'labo-apparait relative flex min-h-[44px] flex-col items-center gap-2 rounded-[22px] border px-2.5 pb-3 pt-4 text-center tab:gap-1 md:gap-1 tab:pb-2 md:pb-2 tab:pt-3 md:pt-3 active:scale-[.97]'
            const style = { borderColor: `${a.couleur}${a.pret === false ? '40' : '66'}`, background: 'rgba(18,26,48,.85)', animationDelay: `${i * 40}ms` }
            return a.pret === false ? (
              <button key={a.id} type="button" onClick={() => setApercu(a)} className={classes} style={{ ...style, borderStyle: 'dashed' }}>
                {contenu}
              </button>
            ) : (
              <Link key={a.id} to={`/labo/${e.id}/${a.id}`} className={classes} style={style}>
                {contenu}
              </Link>
            )
          })}
        </div>
        </div>

        {test && (
          <Link
            to={`/labo/${e.id}/${test.id}`}
            className="labo-apparait relative flex items-center gap-4 overflow-hidden rounded-3xl border-2 p-4 tab:p-2.5 md:p-2.5 active:scale-[.98]"
            style={{ borderColor: '#FFF3A6', background: 'linear-gradient(135deg, #FFE45E, #FFC93C)', boxShadow: '0 10px 40px rgba(255,228,94,.35)' }}
          >
            <span className="labo-reflet" />
            <span className="relative flex h-16 w-16 flex-none tab:h-12 md:h-12 tab:w-12 md:w-12 items-center justify-center rounded-[28%] bg-[#070B16]">
              <Trophy size={34} strokeWidth={2.1} color="#FFE45E" />
            </span>
            <div className="relative min-w-0 flex-1">
              <p className="labo-mono text-[11px] font-bold tracking-[.1em] text-[#5C4A00]">TESTE-TOI · {test.code}</p>
              <p className="labo-jeu text-[32px] leading-none text-[#070B16] tab:text-[26px] md:text-[26px]">{test.nom}</p>
              <p className="mt-1 text-sm font-medium text-[#3D3200]">{test.consigne}</p>
            </div>
            <span className="relative flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[#070B16] text-[#FFE45E]">
              <ArrowRight size={22} strokeWidth={2.5} />
            </span>
          </Link>
        )}

        <PiedLabo className="pt-2 tab:pt-0 md:pt-0 tab:leading-tight md:leading-tight" />
      </div>

      {apercu && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center" onClick={() => setApercu(null)}>
          <div className="labo-apparait w-full max-w-md rounded-3xl border bg-[#0E1428] p-5" style={{ borderColor: `${apercu.couleur}88` }} onClick={(ev) => ev.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <LogoActivite activite={apercu} taille={48} />
                <div>
                  <p className="labo-mono text-[11px]" style={{ color: apercu.couleur }}>
                    ACTIVITÉ {apercu.code} · BIENTÔT
                  </p>
                  <p className="labo-jeu text-2xl" style={{ color: apercu.couleur }}>
                    {apercu.nom}
                  </p>
                </div>
              </div>
              <button type="button" aria-label="Fermer" onClick={() => setApercu(null)} className="flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-white/15">
                <X size={18} />
              </button>
            </div>
            <p className="mt-3 text-[15px] leading-relaxed text-[#DDE2F7]">{apercu.detail || apercu.consigne}</p>
          </div>
        </div>
      )}
    </div>
  )
}
