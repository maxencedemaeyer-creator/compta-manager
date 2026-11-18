import { useState } from 'react'
import { ArrowLeft, Eye, EyeOff, FlaskConical } from 'lucide-react'
import { DecorLabo } from '../DecorLabo.jsx'
import { EXPERIENCES } from '../../../config/laboAteliers.js'
import { reglerVisibilite, useLaboConfig } from './useLaboConfig.js'

// =============================================================
//  Page d'administration du labo (après le code prof).
//  Pour l'instant : une pastille par expérience pour l'afficher
//  ou la masquer aux élèves. Enregistré tout de suite dans Firebase,
//  pris en compte en direct sur toutes les tablettes.
// =============================================================

function Pastille({ actif, couleur, onClick, disabled, nom }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      aria-label={`${nom} : ${actif ? 'visible' : 'masquée'} pour les élèves`}
      onClick={onClick}
      disabled={disabled}
      className="relative h-9 w-16 flex-none rounded-full border-2 transition-colors active:scale-95 disabled:opacity-60"
      style={actif ? { background: couleur, borderColor: couleur } : { background: '#0A0F20', borderColor: '#3A4366' }}
    >
      <span
        className="absolute top-0.5 h-6 w-6 rounded-full transition-all"
        style={actif ? { left: 'calc(100% - 28px)', background: '#070B16' } : { left: 2, background: '#8A93B8' }}
      />
    </button>
  )
}

export default function AdminLabo({ onQuitter }) {
  const { masquees, pret } = useLaboConfig()
  const [enCours, setEnCours] = useState(null)
  const [erreur, setErreur] = useState('')

  const nbVisibles = EXPERIENCES.filter((e) => !masquees.includes(e.id)).length

  async function basculer(e) {
    const visible = !masquees.includes(e.id)
    setEnCours(e.id)
    setErreur('')
    try {
      await reglerVisibilite(e.id, !visible)
    } catch (err) {
      setErreur(err.message || 'Impossible d’enregistrer. Réessaie.')
    } finally {
      setEnCours(null)
    }
  }

  return (
    <div className="labo relative min-h-[100dvh] overflow-x-hidden">
      <DecorLabo />
      <div className="relative mx-auto flex max-w-2xl flex-col gap-5 px-5 pb-12 pt-[max(16px,env(safe-area-inset-top))]">
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={onQuitter}
            aria-label="Retour au hall du labo"
            className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl border border-white/15 text-[#E8ECFF] active:scale-95"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="labo-mono flex items-center gap-1.5 text-[11px] tracking-[.12em] text-[#7CFF6B]">
              <FlaskConical size={13} /> LE LABO DE SCIENCES
            </p>
            <h1 className="labo-titre text-xl font-black text-[#F4F6FF]">Espace prof</h1>
          </div>
        </header>

        <section className="labo-apparait rounded-3xl border border-[#7CFF6B]/30 bg-[#121A30]/90 p-4">
          <h2 className="labo-titre text-[15px] font-bold text-[#F4F6FF]">Expériences visibles par les élèves</h2>
          <p className="labo-mono mt-1 text-[11px] text-[#8A93B8]">
            {pret ? `${nbVisibles} sur ${EXPERIENCES.length} affichées` : 'Chargement…'}
          </p>

          <ul className="mt-4 flex flex-col gap-2.5">
            {EXPERIENCES.map((e) => {
              const visible = !masquees.includes(e.id)
              return (
                <li
                  key={e.id}
                  className="flex items-center gap-3 rounded-2xl border p-3"
                  style={{ borderColor: visible ? `${e.couleur}66` : 'rgba(255,255,255,.08)', background: 'rgba(14,20,40,.8)' }}
                >
                  <span
                    className="flex h-11 w-11 flex-none items-center justify-center rounded-xl"
                    style={{ background: visible ? `rgba(${e.rgb},.18)` : 'rgba(255,255,255,.05)', color: visible ? e.couleur : '#6B7396' }}
                  >
                    {visible ? <Eye size={22} /> : <EyeOff size={22} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="labo-mono text-[10px] tracking-[.1em]" style={{ color: visible ? e.couleur : '#6B7396' }}>
                      EXPÉRIENCE {e.numero}
                    </p>
                    <p className={`labo-titre truncate text-[15px] font-bold ${visible ? 'text-[#F4F6FF]' : 'text-[#8A93B8]'}`}>{e.titre}</p>
                  </div>
                  <Pastille actif={visible} couleur={e.couleur} nom={e.titre} disabled={!pret || enCours === e.id} onClick={() => basculer(e)} />
                </li>
              )
            })}
          </ul>

          {erreur && <p className="mt-3 text-sm text-[#FF8A95]" role="alert">{erreur}</p>}
        </section>
      </div>
    </div>
  )
}
