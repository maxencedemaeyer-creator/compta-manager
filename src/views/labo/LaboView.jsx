import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import { DecorLabo, Fiole } from '../../components/labo/DecorLabo.jsx'
import { EXPERIENCE, PAILLASSES } from '../../config/laboAteliers.js'
import Squelette from '../../components/labo/Squelette.jsx'
import './labo.css'

// =============================================================
//  Le labo de sciences : accueil public (sans code PIN), ouvert
//  aux élèves. Affiche l'expérience de la semaine et ses paillasses.
// =============================================================
export default function LaboView() {
  const vedette = PAILLASSES.find((p) => p.vedette)
  const autres = PAILLASSES.filter((p) => !p.vedette)

  return (
    <div className="labo relative min-h-[100dvh] overflow-x-hidden">
      <DecorLabo />
      <div className="relative mx-auto flex max-w-5xl flex-col gap-5 px-5 pb-12 pt-[max(20px,env(safe-area-inset-top))]">
        <div className="labo-mono flex items-center justify-between text-[11px] tracking-[.12em]">
          <span className="flex items-center gap-2 text-[#9DFF8A]">
            <span className="labo-led inline-block h-2 w-2 rounded-full bg-[#7CFF6B]" />
            LABO OUVERT
          </span>
          <span className="text-[#8A93B8]">H₂O · Ca²⁺ · C₆H₁₂O₆</span>
        </div>

        <div className="flex items-end gap-3">
          <div className="flex-1">
            <p className="labo-mono mb-1.5 text-xs text-[#B57BFF]">// expériences en cours</p>
            <h1 className="labo-titre text-[40px] font-black leading-[.98] tracking-tight text-[#F4F6FF] sm:text-6xl">
              Le labo
              <br />
              <span className="text-[#7CFF6B]">de sciences</span>
            </h1>
          </div>
          <Fiole />
        </div>

        <section className="labo-apparait rounded-3xl border border-[#7CFF6B]/35 bg-[#121A30]/85 p-4">
          <div className="flex items-center justify-between">
            <span className="labo-mono text-[11px] tracking-[.1em] text-[#7CFF6B]">EXPÉRIENCE N° {EXPERIENCE.numero}</span>
            <span className="text-xs text-[#8A93B8]">{PAILLASSES.length} paillasses</span>
          </div>
          <div className="mt-3 flex gap-4">
            <div className="h-40 w-24 flex-none rounded-2xl border border-white/10 bg-[#070B16]/70 p-1">
              <Squelette className="h-full w-full" />
            </div>
            <div className="flex min-w-0 flex-col justify-between">
              <div>
                <h2 className="labo-titre text-[22px] font-bold leading-tight text-[#F4F6FF]">{EXPERIENCE.titre}</h2>
                <p className="mt-1.5 text-sm leading-snug text-[#B9C1E3]">{EXPERIENCE.accroche}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="rounded-full bg-[#7CFF6B]/15 px-2 py-1 text-[11px] text-[#9DFF8A]">206 os</span>
                <span className="rounded-full bg-[#B57BFF]/15 px-2 py-1 text-[11px] text-[#D2B4FF]">plus de 600 muscles</span>
                <span className="rounded-full bg-white/5 px-2 py-1 text-[11px] text-[#B9C1E3]">Attendus {EXPERIENCE.attendus}</span>
              </div>
            </div>
          </div>
        </section>

        {vedette && (
          <Link
            to={`/labo/${vedette.id}`}
            className="labo-apparait group relative overflow-hidden rounded-3xl border-2 p-4 active:scale-[.98]"
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
                <p className="text-sm text-[#B9C1E3]">Mets-toi devant la caméra : ton squelette apparaît sur toi.</p>
              </div>
              <ArrowRight className="flex-none" style={{ color: vedette.couleur }} />
            </div>
          </Link>
        )}

        <div className="flex items-baseline justify-between">
          <h3 className="labo-titre text-[15px] font-medium text-[#F4F6FF]">Les paillasses</h3>
          <span className="labo-mono text-[11px] text-[#8A93B8]">5 à 10 min chacune</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {autres.map((p, i) => (
            <Link
              key={p.id}
              to={`/labo/${p.id}`}
              className="labo-apparait flex min-h-[44px] flex-col gap-2 rounded-[18px] border p-3 active:scale-[.97]"
              style={{ borderColor: `${p.couleur}66`, background: 'rgba(18,26,48,.85)', animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-center justify-between">
                <span className="labo-mono text-[11px]" style={{ color: p.couleur }}>
                  {p.code}
                </span>
                <span className="labo-mono text-[10px] text-[#8A93B8]">{p.attendus.join('·')}</span>
              </div>
              <p.icon size={30} strokeWidth={1.6} style={{ color: p.couleur }} />
              <span className="text-sm font-bold leading-tight text-[#E8ECFF]">{p.titre}</span>
              <span className="text-xs leading-snug text-[#8A93B8]">{p.texte}</span>
            </Link>
          ))}
        </div>

        <p className="text-center text-xs leading-relaxed text-[#8A93B8]">
          Référentiel P3-P4 · Les forces de l’appareil moteur · Schémas et radios : sources affichées dans chaque paillasse.
        </p>
      </div>
    </div>
  )
}
