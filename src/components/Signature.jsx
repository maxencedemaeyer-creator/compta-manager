import { useState } from 'react'
import { Cloud, LockKeyhole, Smartphone, Sparkles } from 'lucide-react'
import Modal from './ui/Modal.jsx'

// =============================================================
//  Petite signature en bas des pages d'accueil :
//  « © 2026 · Créé par Maxence De Maeyer · À propos »
//  « À propos » ouvre une fenêtre qui explique la plateforme.
// =============================================================
const POINTS = [
  {
    icon: Sparkles,
    titre: 'Un espace par personne',
    texte: 'Chaque profil a son propre accueil et ses propres applications, pensées pour ses besoins.',
  },
  {
    icon: LockKeyhole,
    titre: 'Protégé par un code PIN',
    texte: "Chaque espace a son code. En cas d'oubli, un code de secours est envoyé par mail.",
  },
  {
    icon: Cloud,
    titre: 'Données dans le cloud',
    texte: 'Tout est enregistré en ligne (Firebase) : rien ne se perd, même en changeant de téléphone.',
  },
  {
    icon: Smartphone,
    titre: 'Comme une vraie appli',
    texte: "Sur iPhone : Safari → Partager → « Sur l'écran d'accueil » pour l'ouvrir en plein écran.",
  },
]

export default function Signature({ className = '' }) {
  const [ouvert, setOuvert] = useState(false)
  const annee = new Date().getFullYear()

  return (
    <>
      <p className={`text-center text-xs text-emerald-900/40 ${className}`}>
        © {annee} · Créé par Maxence De Maeyer ·{' '}
        <button
          type="button"
          onClick={() => setOuvert(true)}
          className="underline underline-offset-2 decoration-emerald-900/25 hover:text-emerald-900/70"
        >
          À propos
        </button>
      </p>

      <Modal open={ouvert} onClose={() => setOuvert(false)} title="À propos">
        <p className="text-sm text-slate-600 mb-5">
          Une plateforme familiale imaginée et créée par Maxence De Maeyer : un petit coin d'internet
          qui rassemble, pour chacun, les outils du quotidien — comptes, projets, classe, famille.
        </p>
        <ul className="space-y-4">
          {POINTS.map(({ icon: Icon, titre, texte }) => (
            <li key={titre} className="flex gap-3">
              <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Icon size={17} />
              </span>
              <span>
                <span className="block text-sm font-semibold text-slate-900">{titre}</span>
                <span className="block text-sm text-slate-500">{texte}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-slate-400 mt-6 text-center">© {annee} Maxence De Maeyer</p>
      </Modal>
    </>
  )
}
