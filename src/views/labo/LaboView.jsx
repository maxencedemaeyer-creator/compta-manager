import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { DecorLabo, Fiole } from '../../components/labo/DecorLabo.jsx'
import VisuelExperience from '../../components/labo/VisuelExperience.jsx'
import { EXPERIENCES } from '../../config/laboAteliers.js'
import './labo.css'
import PiedLabo from '../../components/labo/PiedLabo.jsx'

// =============================================================
//  Le hall du labo de sciences (/labo) : public, sans code PIN.
//  Une grande porte par expérience (un chapitre du cours).
//  Toutes les expériences sont ouvertes : les élèves peuvent
//  revenir rejouer un ancien chapitre quand ils veulent.
// =============================================================
export default function LaboView() {
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
            <p className="labo-mono mb-1.5 text-xs text-[#B57BFF]">// choisis ton expérience</p>
            <h1 className="labo-titre text-[40px] font-black leading-[.98] tracking-tight text-[#F4F6FF] sm:text-6xl">
              Le labo
              <br />
              <span className="text-[#7CFF6B]">de sciences</span>
            </h1>
          </div>
          <Fiole />
        </div>

        <div className="flex items-baseline justify-between">
          <h2 className="labo-titre text-[15px] font-medium text-[#F4F6FF]">Les expériences</h2>
          <span className="labo-mono text-[11px] text-[#8A93B8]">{EXPERIENCES.length} chapitres</span>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {EXPERIENCES.map((e, i) => {
            const prets = e.paillasses.filter((p) => p.pret !== false).length
            return (
              <Link
                key={e.id}
                to={`/labo/${e.id}`}
                className="labo-apparait group relative flex overflow-hidden rounded-3xl border-2 active:scale-[.98]"
                style={{ borderColor: `${e.couleur}88`, background: 'rgba(14,20,40,.9)', animationDelay: `${i * 80}ms` }}
              >
                <span className="labo-scan opacity-40" style={{ background: e.couleur }} />
                <div className="relative h-44 w-32 flex-none" style={{ background: `radial-gradient(circle at 50% 45%, rgba(${e.rgb},.18), transparent 70%)` }}>
                  <VisuelExperience type={e.visuel} className="h-full w-full" />
                </div>
                <div className="relative flex min-w-0 flex-1 flex-col justify-between gap-2 p-4 pl-1">
                  <div>
                    <p className="labo-mono text-[11px] tracking-[.1em]" style={{ color: e.couleur }}>
                      EXPÉRIENCE {e.numero} · {e.niveau}
                    </p>
                    <h3 className="labo-titre mt-1 text-[21px] font-bold leading-tight text-[#F4F6FF]">{e.titre}</h3>
                    <p className="mt-1 text-sm leading-snug text-[#B9C1E3]">{e.accroche}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full px-2.5 py-1 text-[11px]" style={{ background: `rgba(${e.rgb},.15)`, color: e.couleur }}>
                      {prets > 0 ? `${prets} paillasses` : `${e.paillasses.length} paillasses en préparation`}
                    </span>
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full transition group-hover:translate-x-0.5" style={{ background: e.couleur, color: '#070B16' }}>
                      <ArrowRight size={20} strokeWidth={2.5} />
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        <p className="text-center text-xs leading-relaxed text-[#8A93B8]">Toutes les expériences restent ouvertes : reviens rejouer quand tu veux.</p>
        <PiedLabo className="pt-2" />
      </div>
    </div>
  )
}
