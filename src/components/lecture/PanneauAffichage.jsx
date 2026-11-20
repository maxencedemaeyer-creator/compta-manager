import { Minus, Plus, X } from 'lucide-react'
import { TAILLES_TEXTE } from '../../config/lectureVoix.js'
import { ESPACEMENTS, FONDS, INTERLIGNES, POLICES } from './reglages.js'

// =============================================================
//  Appli « Lis-moi » : panneau « Aa » (affichage du texte)
//  Police, taille, interligne, espacement, fond doux, focus.
//  Le texte derrière change en direct.
// =============================================================
function Titre({ children }) {
  return <p className="mb-2 mt-4 px-1 text-xs font-semibold uppercase tracking-wider text-indigo-950/45 first:mt-0">{children}</p>
}

function Segments({ options, valeur, onChange }) {
  return (
    <div className="flex rounded-2xl bg-indigo-50/80 p-1">
      {Object.entries(options).map(([id, o]) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex-1 rounded-xl px-2 py-2.5 text-sm font-semibold transition ${valeur === id ? 'bg-white text-indigo-700 shadow' : 'text-indigo-950/55'}`}
        >
          {o.nom}
        </button>
      ))}
    </div>
  )
}

export default function PanneauAffichage({ reglages, changer, onFermer }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center p-3 sm:items-center" onClick={onFermer}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-[2rem] bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl shadow-indigo-950/30 ring-1 ring-indigo-950/5"
      >
        <div className="mb-3 flex items-center justify-between px-1">
          <p className="text-lg font-bold text-indigo-950">Affichage du texte</p>
          <button onClick={onFermer} className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-700" aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        <Titre>Police</Titre>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(POLICES).map(([id, p]) => (
            <button
              key={id}
              onClick={() => changer({ police: id })}
              className={`rounded-2xl px-2 py-3 text-center transition ${reglages.police === id ? 'bg-indigo-600 text-white' : 'bg-indigo-50/70 text-indigo-950'}`}
            >
              <span className="block text-2xl" style={{ fontFamily: p.famille }}>
                Aa
              </span>
              <span className={`block text-xs ${reglages.police === id ? 'text-white/80' : 'text-indigo-950/55'}`}>{p.detail}</span>
            </button>
          ))}
        </div>

        <Titre>Taille</Titre>
        <div className="flex items-center gap-3 rounded-2xl bg-indigo-50/80 p-1.5">
          <button
            onClick={() => changer({ taille: Math.max(0, reglages.taille - 1) })}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-indigo-700 shadow"
            aria-label="Plus petit"
          >
            <Minus size={20} />
          </button>
          <div className="flex flex-1 items-end justify-center gap-1.5">
            {TAILLES_TEXTE.map((t, i) => (
              <span
                key={t}
                className={`rounded-full ${i <= reglages.taille ? 'bg-indigo-600' : 'bg-indigo-200'}`}
                style={{ width: 8, height: 8 + i * 5 }}
              />
            ))}
          </div>
          <button
            onClick={() => changer({ taille: Math.min(TAILLES_TEXTE.length - 1, reglages.taille + 1) })}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-indigo-700 shadow"
            aria-label="Plus grand"
          >
            <Plus size={20} />
          </button>
        </div>

        <Titre>Espace entre les lignes</Titre>
        <Segments options={INTERLIGNES} valeur={reglages.interligne} onChange={(id) => changer({ interligne: id })} />

        <Titre>Espace entre les lettres</Titre>
        <Segments options={ESPACEMENTS} valeur={reglages.espacement} onChange={(id) => changer({ espacement: id })} />

        <Titre>Couleur du fond</Titre>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(FONDS).map(([id, f]) => (
            <button key={id} onClick={() => changer({ fond: id })} className="flex flex-col items-center gap-1.5">
              <span
                className={`flex h-12 w-full items-center justify-center rounded-2xl text-lg font-semibold ring-2 transition ${
                  reglages.fond === id ? 'ring-indigo-600' : 'ring-indigo-950/10'
                }`}
                style={{ background: f.carte, color: f.texte }}
              >
                Aa
              </span>
              <span className="text-xs text-indigo-950/60">{f.nom}</span>
            </button>
          ))}
        </div>

        <Titre>Concentration</Titre>
        <button
          onClick={() => changer({ focus: !reglages.focus })}
          className="flex w-full items-center gap-3 rounded-2xl bg-indigo-50/80 px-4 py-3 text-left"
        >
          <span className="flex-1">
            <span className="block font-semibold text-indigo-950">Focus sur la phrase lue</span>
            <span className="block text-sm text-indigo-950/55">Le reste du texte s’estompe pendant la lecture</span>
          </span>
          <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${reglages.focus ? 'bg-indigo-600' : 'bg-indigo-200'}`}>
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${reglages.focus ? 'left-6' : 'left-1'}`} />
          </span>
        </button>
      </div>
    </div>
  )
}
