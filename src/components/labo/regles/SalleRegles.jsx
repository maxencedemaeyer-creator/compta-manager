import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, FlaskConical, Sparkles, Trophy, X } from 'lucide-react'
import Anatomie from './Anatomie.jsx'
import PiedLabo from '../PiedLabo.jsx'
import { C, DecorRegles, LogoActiviteClair } from './ui.jsx'

// =============================================================
//  La salle de l'expérience « Règle de 3 » (thème clair).
//  Même organisation que SalleView (vedette, activités, Défi),
//  mais sur fond crème et avec des schémas dessinés.
//  Les activités « pret: false » s'affichent « bientôt ».
// =============================================================
export default function SalleRegles({ e }) {
  const [apercu, setApercu] = useState(null)
  const vedette = e.vedette && e.activites.find((a) => a.id === e.vedette.id)
  const test = e.activites.find((a) => a.test)
  const autres = e.activites.filter((a) => a !== vedette && a !== test)

  return (
    <div className="regles relative min-h-[100dvh] overflow-x-hidden">
      <DecorRegles />
      <div className="relative mx-auto flex max-w-5xl flex-col gap-5 px-5 pb-12 pt-[max(16px,env(safe-area-inset-top))]">
        <header className="flex items-center gap-3">
          <Link to="/labo" aria-label="Retour au hall du labo" className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl border-2 bg-white active:scale-95" style={{ borderColor: C.bord, color: C.texte }}>
            <ArrowLeft size={20} strokeWidth={2.5} />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="regles-mono flex items-center gap-1.5 text-[11px] uppercase" style={{ color: C.rose }}>
              <FlaskConical size={13} /> Le labo de sciences
            </p>
            <p className="regles-titre truncate text-sm" style={{ color: C.doux }}>Expérience {e.numero}</p>
          </div>
        </header>

        <section className="regles-apparait rounded-3xl border-2 bg-white p-4" style={{ borderColor: `${e.couleur}88` }}>
          <div className="flex gap-4">
            <div className="relative h-44 w-28 flex-none overflow-hidden rounded-2xl" style={{ background: '#FFF8EC', border: `2px solid ${C.bord}` }}>
              <Anatomie className="h-full w-full" ep={0.55} ovaire={{ etat: 'follicule', p: 0.7 }} />
            </div>
            <div className="flex min-w-0 flex-col justify-between gap-2">
              <div>
                <h1 className="regles-titre text-[28px] leading-tight" style={{ color: C.texte }}>{e.titre}</h1>
                <p className="mt-1 text-[13px] leading-snug" style={{ color: C.doux }}>{e.accroche}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {e.chiffres.map((c, i) => (
                  <span key={c} className="rounded-full px-2.5 py-1 text-[12px] font-bold" style={i % 2 ? { background: C.saugeClair, color: C.sauge } : { background: C.roseClair, color: C.rose }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {vedette && (
          <Link to={`/labo/${e.id}/${vedette.id}`} className="regles-apparait relative overflow-hidden rounded-3xl border-2 bg-white p-4 active:scale-[.98]" style={{ borderColor: vedette.couleur }}>
            <div className="relative flex items-center gap-4">
              <LogoActiviteClair activite={vedette} taille={64} />
              <div className="min-w-0 flex-1">
                <p className="regles-mono flex items-center gap-1.5 text-[11px] uppercase" style={{ color: C.rose }}>
                  <Sparkles size={12} /> Activité vedette · {vedette.code}
                </p>
                <p className="regles-titre text-[28px] leading-tight" style={{ color: C.texte }}>{vedette.nom}</p>
                <p className="text-sm" style={{ color: C.doux }}>{e.vedette.texte}</p>
              </div>
              <ArrowRight className="flex-none" style={{ color: C.rose }} />
            </div>
          </Link>
        )}

        <h2 className="regles-titre text-[17px]" style={{ color: C.texte }}>Les activités</h2>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {autres.map((a, i) => {
            const bientot = a.pret === false
            const contenu = (
              <>
                <span className="regles-mono absolute left-3 top-2.5 text-[11px]" style={{ color: C.doux }}>{a.code}</span>
                {bientot && <span className="regles-mono absolute right-2.5 top-2 rounded-full px-1.5 py-0.5 text-[9px] uppercase" style={{ background: C.abricotClair, color: C.abricot }}>bientôt</span>}
                <LogoActiviteClair activite={a} taille={64} className="mt-3" />
                <span className="regles-titre break-words text-[21px] leading-none" style={{ color: C.texte }}>{a.nom}</span>
                <span className="text-[12px] leading-snug" style={{ color: C.doux }}>{a.consigne}</span>
              </>
            )
            const classes = 'regles-apparait relative flex min-h-[44px] flex-col items-center gap-2 rounded-[22px] border-2 bg-white px-2.5 pb-3 pt-4 text-center active:scale-[.97]'
            const style = { borderColor: bientot ? C.bord : `${a.couleur}`, animationDelay: `${i * 40}ms`, opacity: bientot ? 0.85 : 1 }
            return bientot ? (
              <button key={a.id} type="button" onClick={() => setApercu(a)} className={classes} style={{ ...style, borderStyle: 'dashed' }}>{contenu}</button>
            ) : (
              <Link key={a.id} to={`/labo/${e.id}/${a.id}`} className={classes} style={style}>{contenu}</Link>
            )
          })}
        </div>

        {test && (
          <Link
            to={`/labo/${e.id}/${test.id}`}
            className="regles-apparait relative flex items-center gap-4 overflow-hidden rounded-3xl border-2 p-4 active:scale-[.98]"
            style={{ borderColor: '#E8C85A', background: 'linear-gradient(135deg, #FFF0A8, #FFE07A)' }}
          >
            <span className="relative flex h-16 w-16 flex-none items-center justify-center rounded-[28%]" style={{ background: C.texte }}>
              <Trophy size={32} strokeWidth={2.1} color="#FFE45E" />
            </span>
            <div className="relative min-w-0 flex-1">
              <p className="regles-mono text-[11px] uppercase" style={{ color: '#6B5200' }}>Teste-toi · {test.code}</p>
              <p className="regles-titre text-[30px] leading-none" style={{ color: C.texte }}>{test.nom}</p>
              <p className="mt-1 text-sm font-bold" style={{ color: '#4A3A00' }}>{test.consigne}</p>
            </div>
            <span className="relative flex h-11 w-11 flex-none items-center justify-center rounded-full" style={{ background: C.texte, color: '#FFE45E' }}>
              <ArrowRight size={22} strokeWidth={2.5} />
            </span>
          </Link>
        )}

        <PiedLabo clair className="pt-2" />
      </div>

      {apercu && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-[#3E2A35]/40 p-4 backdrop-blur-sm sm:items-center" onClick={() => setApercu(null)}>
          <div role="dialog" aria-modal="true" aria-label={apercu.nom} className="regles-apparait w-full max-w-md rounded-3xl border-2 bg-[#FFF8EC] p-5" style={{ borderColor: apercu.couleur }} onClick={(ev) => ev.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <LogoActiviteClair activite={apercu} taille={48} />
                <div>
                  <p className="regles-mono text-[11px] uppercase" style={{ color: C.doux }}>Activité {apercu.code} · bientôt</p>
                  <p className="regles-titre text-2xl" style={{ color: C.texte }}>{apercu.nom}</p>
                </div>
              </div>
              <button type="button" aria-label="Fermer" onClick={() => setApercu(null)} className="flex h-10 w-10 flex-none items-center justify-center rounded-xl border-2 bg-white" style={{ borderColor: C.bord, color: C.texte }}>
                <X size={18} />
              </button>
            </div>
            <p className="mt-3 text-[15px] leading-relaxed" style={{ color: C.texte }}>{apercu.detail || apercu.consigne}</p>
          </div>
        </div>
      )}
    </div>
  )
}
