import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, FlaskConical, Hourglass, Rotate3d, Sparkles, X } from 'lucide-react'
import { DecorLabo } from '../../components/labo/DecorLabo.jsx'
import VisuelExperience from '../../components/labo/VisuelExperience.jsx'
import { EXPERIENCE } from '../../config/laboAteliers.js'
import './labo.css'
import PiedLabo from '../../components/labo/PiedLabo.jsx'

// =============================================================
//  La salle d'une expérience (/labo/:experience) : le chapitre,
//  son visuel, sa paillasse vedette et toutes ses paillasses.
//  Chaque expérience a ses propres couleurs.
// =============================================================
export default function SalleView() {
  const { experience } = useParams()
  const e = EXPERIENCE[experience]
  const [apercu, setApercu] = useState(null)
  if (!e) return <Navigate to="/labo" replace />

  const vedette = e.vedette && e.paillasses.find((p) => p.id === e.vedette.id)
  const autres = e.paillasses.filter((p) => p !== vedette)
  const enPreparation = e.paillasses.every((p) => p.pret === false)

  const visuel = (
    <div className="relative h-44 w-28 flex-none overflow-hidden rounded-2xl border bg-[#070B16]/70" style={{ borderColor: `${e.couleur}66` }}>
      <VisuelExperience type={e.visuel} className="h-full w-full" />
      {e.explorateur && (
        <span className="labo-mono absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 py-1 text-[10px] font-bold text-[#06210A]" style={{ background: `${e.couleur}E6` }}>
          <Rotate3d size={12} /> EXPLORER
        </span>
      )}
    </div>
  )

  return (
    <div className="labo relative min-h-[100dvh] overflow-x-hidden">
      <DecorLabo rgb={e.rgb} rgb2={e.rgb2} flash={false} />
      <div className="relative mx-auto flex max-w-5xl flex-col gap-5 px-5 pb-12 pt-[max(16px,env(safe-area-inset-top))]">
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

        <section className="labo-apparait rounded-3xl border bg-[#121A30]/85 p-4" style={{ borderColor: `${e.couleur}59` }}>
          <div className="flex items-center justify-between">
            <span className="labo-mono text-[11px] tracking-[.1em]" style={{ color: e.couleur }}>
              EXPÉRIENCE N° {e.numero}
            </span>
            <span className="text-xs text-[#8A93B8]">{e.paillasses.length} paillasses</span>
          </div>
          <div className="mt-3 flex gap-4">
            {e.explorateur ? (
              <Link to={`/labo/${e.id}/${e.explorateur.lien}`} aria-label={`Explorer : ${e.explorateur.titre}`} className="active:scale-[.97]">
                {visuel}
              </Link>
            ) : (
              visuel
            )}
            <div className="flex min-w-0 flex-col justify-between gap-2">
              <div>
                <h1 className="labo-titre text-[24px] font-black leading-tight text-[#F4F6FF]">{e.titre}</h1>
                <p className="mt-1.5 text-sm leading-snug text-[#B9C1E3]">{e.accroche}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {e.chiffres.map((c, i) => (
                  <span key={c} className="rounded-full px-2 py-1 text-[11px]" style={i % 2 ? { background: `rgba(${e.rgb2},.15)`, color: e.couleur2 } : { background: `rgba(${e.rgb},.15)`, color: e.couleur }}>
                    {c}
                  </span>
                ))}
                <span className="rounded-full bg-white/5 px-2 py-1 text-[11px] text-[#B9C1E3]">
                  {e.niveau} · attendus {e.attendus}
                </span>
              </div>
            </div>
          </div>
        </section>

        {enPreparation && (
          <div className="flex items-start gap-3 rounded-2xl border p-3 text-sm" style={{ borderColor: `${e.couleur}55`, background: `rgba(${e.rgb},.08)`, color: '#E8ECFF' }}>
            <Hourglass size={20} className="mt-0.5 flex-none" style={{ color: e.couleur }} />
            <p>Ce labo est en construction : voici les paillasses prévues. Touche-en une pour voir ce qu’on y fera.</p>
          </div>
        )}

        {vedette && (
          <Link
            to={`/labo/${e.id}/${vedette.id}`}
            className="labo-apparait relative overflow-hidden rounded-3xl border-2 p-4 active:scale-[.98]"
            style={{ borderColor: vedette.couleur, background: 'rgba(12,20,40,.9)' }}
          >
            <span className="labo-scan opacity-60" style={{ background: vedette.couleur }} />
            <div className="relative flex items-center gap-4">
              <div className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl" style={{ background: `${vedette.couleur}22`, color: vedette.couleur }}>
                <vedette.icon size={30} strokeWidth={1.8} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="labo-mono flex items-center gap-1.5 text-[11px] tracking-[.1em]" style={{ color: vedette.couleur }}>
                  <Sparkles size={12} /> PAILLASSE VEDETTE · {vedette.code}
                </p>
                <p className="labo-titre text-lg font-bold text-[#F4F6FF]">{vedette.titre}</p>
                <p className="text-sm text-[#B9C1E3]">{e.vedette.texte}</p>
              </div>
              <ArrowRight className="flex-none" style={{ color: vedette.couleur }} />
            </div>
          </Link>
        )}

        <div className="flex items-baseline justify-between">
          <h2 className="labo-titre text-[15px] font-medium text-[#F4F6FF]">Les paillasses</h2>
          <span className="labo-mono text-[11px] text-[#8A93B8]">5 à 10 min chacune</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {autres.map((p, i) => {
            const contenu = (
              <>
                <div className="flex items-center justify-between">
                  <span className="labo-mono text-[11px]" style={{ color: p.couleur }}>
                    {p.code}
                  </span>
                  {p.pret === false ? (
                    <span className="labo-mono rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] text-[#B9C1E3]">BIENTÔT</span>
                  ) : (
                    <span className="labo-mono text-[10px] text-[#8A93B8]">{p.attendus.join('·')}</span>
                  )}
                </div>
                <p.icon size={30} strokeWidth={1.6} style={{ color: p.couleur }} />
                <span className="text-sm font-bold leading-tight text-[#E8ECFF]">{p.titre}</span>
                <span className="text-xs leading-snug text-[#8A93B8]">{p.texte}</span>
              </>
            )
            const classes = 'labo-apparait flex min-h-[44px] flex-col gap-2 rounded-[18px] border p-3 text-left active:scale-[.97]'
            const style = { borderColor: `${p.couleur}${p.pret === false ? '40' : '66'}`, background: 'rgba(18,26,48,.85)', animationDelay: `${i * 40}ms` }
            return p.pret === false ? (
              <button key={p.id} type="button" onClick={() => setApercu(p)} className={classes} style={{ ...style, borderStyle: 'dashed' }}>
                {contenu}
              </button>
            ) : (
              <Link key={p.id} to={`/labo/${e.id}/${p.id}`} className={classes} style={style}>
                {contenu}
              </Link>
            )
          })}
        </div>

        <p className="text-center text-xs leading-relaxed text-[#8A93B8]">
          Référentiel {e.niveau} · {e.chapitre} · Sources affichées dans chaque paillasse.
        </p>
        <PiedLabo className="pt-2" />
      </div>

      {apercu && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center" onClick={() => setApercu(null)}>
          <div className="labo-apparait w-full max-w-md rounded-3xl border bg-[#0E1428] p-5" style={{ borderColor: `${apercu.couleur}88` }} onClick={(ev) => ev.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl" style={{ background: `${apercu.couleur}22`, color: apercu.couleur }}>
                  <apercu.icon size={26} />
                </div>
                <div>
                  <p className="labo-mono text-[11px]" style={{ color: apercu.couleur }}>
                    PAILLASSE {apercu.code} · EN PRÉPARATION
                  </p>
                  <p className="labo-titre text-lg font-bold text-white">{apercu.titre}</p>
                </div>
              </div>
              <button type="button" aria-label="Fermer" onClick={() => setApercu(null)} className="flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-white/15">
                <X size={18} />
              </button>
            </div>
            <p className="mt-3 text-[15px] leading-relaxed text-[#DDE2F7]">{apercu.detail}</p>
            {apercu.attendus.length > 0 && (
              <p className="mt-3 text-xs text-[#8A93B8]">
                Attendus {e.niveau} : {apercu.attendus.join(', ')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
