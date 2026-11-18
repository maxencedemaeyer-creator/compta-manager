// Éléments communs aux activités d'électricité
import { useState } from 'react'
import { BookOpen, Image, PenTool, RotateCcw, Volume2, VolumeX, X } from 'lucide-react'
import CadreJeu from '../../../components/labo/CadreJeu.jsx'
import { Ambiance, Vignette } from '../../../components/labo/electricite/Banc.jsx'
import { COMPOSANTS } from '../../../components/labo/electricite/circuit.js'

export const JAUNE = '#FFE45E'
export const BLEU = '#3EC9FF'

// Cadre d'une activité d'électricité : couleurs de l'expérience + pièce qui s'éclaire.
// ecran : sur tablette en paysage, tout tient sur un écran (pas de défilement).
export function PageElec({ resultat, children, ecran = true, ...props }) {
  return (
    <CadreJeu rgb="255,228,94" rgb2="62,201,255" ecran={ecran} {...props}>
      {resultat && <Ambiance lumiere={resultat.lumiere} courtCircuit={resultat.courtCircuit} />}
      {children}
    </CadreJeu>
  )
}

// Bascule photo / schéma
export function BasculeVue({ vue, setVue }) {
  return (
    <div className="flex flex-none rounded-2xl border border-white/15 bg-[#0B1122]/90 p-1">
      {[
        ['photo', Image, 'Photo'],
        ['schema', PenTool, 'Schéma'],
      ].map(([v, Icone, nom]) => (
        <button
          key={v}
          type="button"
          onClick={() => setVue(v)}
          className="flex h-9 items-center gap-1 rounded-xl px-2.5 text-[12px] font-bold"
          style={vue === v ? { background: JAUNE, color: '#1A1500' } : { color: '#B9C1E3' }}
        >
          <Icone size={14} /> {nom}
        </button>
      ))}
    </div>
  )
}

// Barre d'outils commune : photo/schéma, son, Recommencer — toujours sur UNE ligne
export function Outils({ vue, setVue, son, setSon, onRecommencer, texteRecommencer = 'Recommencer', children }) {
  return (
    <div className="flex flex-none flex-wrap items-center gap-2 md:flex-nowrap">
      {setVue && <BasculeVue vue={vue} setVue={setVue} />}
      {setSon && (
        <button type="button" aria-label={son ? 'Couper le son' : 'Activer le son'} onClick={() => setSon(!son)} className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl border border-white/15 bg-[#0B1122]/90 text-[#E8ECFF]">
          {son ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      )}
      {onRecommencer && (
        <button type="button" onClick={onRecommencer} className="flex h-11 flex-none items-center gap-1.5 whitespace-nowrap rounded-2xl border border-white/15 bg-[#0B1122]/90 px-3 text-[13px] font-bold text-[#E8ECFF]">
          <RotateCcw size={16} /> {texteRecommencer}
        </button>
      )}
      {children}
    </div>
  )
}

// Raccourcis pour décrire un circuit dans les données des activités
export const comp = (id, type, x, y, autres = {}) => ({ id, type, x, y, rot: 0, ...autres })
export const fil = (a, b, autres = {}) => ({ id: `f-${a}-${b}`, a, b, ...autres })

export const RECEPTEURS = ['ampoule', 'del', 'moteur', 'sonnette', 'console', 'enceinte']

export function Consigne({ children, couleur = JAUNE }) {
  return (
    <div className="rounded-2xl border px-3 py-2.5 text-[14px] leading-snug text-[#E8ECFF]" style={{ borderColor: `${couleur}55`, background: 'rgba(11,17,34,.88)' }}>
      {children}
    </div>
  )
}

// Petit bouton « symboles » + fenêtre qui rappelle le symbole de chaque objet (E4)
const AIDE = ['pile', 'ampoule', 'del', 'moteur', 'sonnette', 'interrupteur', 'poussoir']
export function AideSymboles({ couleur = '#C9A3FF', className = '' }) {
  const [ouvert, setOuvert] = useState(false)
  return (
    <>
      <button
        type="button"
        aria-label="Rappel des symboles"
        onClick={() => setOuvert(true)}
        className={`flex h-10 items-center gap-1.5 rounded-xl border px-2.5 text-[12px] font-bold ${className}`}
        style={{ borderColor: `${couleur}88`, background: 'rgba(11,17,34,.92)', color: couleur }}
      >
        <BookOpen size={15} /> Symboles
      </button>
      {ouvert && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm" onClick={() => setOuvert(false)}>
          <div className="labo-apparait max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-3xl border bg-[#0E1428] p-4" style={{ borderColor: `${couleur}88` }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="labo-jeu text-2xl" style={{ color: couleur }}>
                Les symboles
              </p>
              <button type="button" aria-label="Fermer" onClick={() => setOuvert(false)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 text-white">
                <X size={18} />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {AIDE.map((t) => (
                <div key={t} className="rounded-2xl border border-white/10 bg-[#141B2E] p-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Vignette type={t} vue="photo" taille={54} />
                    <span className="text-lg text-[#8A93B8]">→</span>
                    <span className="rounded-xl bg-[#F7F5EE] p-0.5">
                      <Vignette type={t} vue="schema" taille={54} />
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] font-bold leading-tight text-[#E8ECFF]">{COMPOSANTS[t].nom}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
