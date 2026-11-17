// Éléments communs aux paillasses d'électricité
import { Image, PenTool } from 'lucide-react'
import CadreJeu from '../../../components/labo/CadreJeu.jsx'
import { Ambiance } from '../../../components/labo/electricite/Banc.jsx'

export const JAUNE = '#FFE45E'
export const BLEU = '#3EC9FF'

// Cadre d'une paillasse d'électricité : couleurs de l'expérience + pièce qui s'éclaire
export function PageElec({ resultat, children, ...props }) {
  return (
    <CadreJeu rgb="255,228,94" rgb2="62,201,255" {...props}>
      {resultat && <Ambiance lumiere={resultat.lumiere} courtCircuit={resultat.courtCircuit} />}
      {children}
    </CadreJeu>
  )
}

// Bascule photo / schéma
export function BasculeVue({ vue, setVue }) {
  return (
    <div className="flex rounded-2xl border border-white/15 bg-[#0B1122]/90 p-1">
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

// Raccourcis pour décrire un circuit dans les données des paillasses
export const comp = (id, type, x, y, autres = {}) => ({ id, type, x, y, rot: 0, ...autres })
export const fil = (a, b, autres = {}) => ({ id: `f-${a}-${b}`, a, b, ...autres })

export const RECEPTEURS = ['ampoule', 'del', 'moteur', 'sonnette']

export function Consigne({ children, couleur = JAUNE }) {
  return (
    <div className="rounded-2xl border px-3 py-2.5 text-[14px] leading-snug text-[#E8ECFF]" style={{ borderColor: `${couleur}55`, background: 'rgba(11,17,34,.88)' }}>
      {children}
    </div>
  )
}
