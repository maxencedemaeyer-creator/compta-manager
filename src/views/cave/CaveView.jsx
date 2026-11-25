import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, Database, ShoppingBasket, UtensilsCrossed, Wine } from 'lucide-react'
import { useCave } from '../../hooks/useCave.js'
import { decrireBouteille } from '../../lib/cave/bouteille.js'
import CeSoirTab from '../../components/cave/CeSoirTab.jsx'
import MaCaveTab from '../../components/cave/MaCaveTab.jsx'
import HistoriqueTab from '../../components/cave/HistoriqueTab.jsx'
import EnviesTab from '../../components/cave/EnviesTab.jsx'
import DonneesTab from '../../components/cave/DonneesTab.jsx'

// =============================================================
//  Cave — gestionnaire de cave et accords mets-vins
//  Route : /maxence/cave/:onglet?   (soir · cave · historique · achats · donnees)
//  Bases de connaissances : src/data/cave/ ; moteur : src/lib/cave/ ; Firebase : src/hooks/useCave.js
// =============================================================
const ONGLETS = [
  { id: 'soir', nom: 'Ce soir', icone: UtensilsCrossed },
  { id: 'cave', nom: 'Ma cave', icone: Wine },
  { id: 'historique', nom: 'Bus', icone: BookOpen },
  { id: 'achats', nom: 'Achats', icone: ShoppingBasket },
  { id: 'donnees', nom: 'Données', icone: Database },
]

export default function CaveView() {
  const { onglet = 'soir' } = useParams()
  const navigate = useNavigate()
  const { bouteilles, historique, envies, manques, chargement, erreur } = useCave()
  const [formulaire, setFormulaire] = useState(null) // null | 'nouveau' | bouteille | { prefill }
  const decrites = useMemo(() => bouteilles.map(decrireBouteille), [bouteilles])

  if (!ONGLETS.some((o) => o.id === onglet)) return <Navigate to="/maxence/cave" replace />
  const allerA = (id) => navigate(`/maxence/cave${id === 'soir' ? '' : `/${id}`}`)
  const titre = ONGLETS.find((o) => o.id === onglet).nom

  const acheter = (infos) => {
    setFormulaire(infos)
    allerA('cave')
  }

  let contenu
  if (chargement) contenu = <p className="py-16 text-center text-rose-900/50">Chargement…</p>
  else if (onglet === 'soir') contenu = <CeSoirTab bouteilles={decrites} historique={historique} envies={envies} />
  else if (onglet === 'cave') contenu = <MaCaveTab bouteilles={decrites} formulaire={formulaire} setFormulaire={setFormulaire} />
  else if (onglet === 'historique') contenu = <HistoriqueTab historique={historique} />
  else if (onglet === 'achats') contenu = <EnviesTab envies={envies} onAcheter={acheter} />
  else contenu = <DonneesTab manques={manques} />

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-white text-rose-950 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -right-24 h-80 w-80 rounded-full bg-rose-200/50 blur-3xl" />

      <div className="relative mx-auto max-w-2xl px-5 sm:px-8 pt-6 sm:pt-10 pb-32">
        <Link to="/maxence" className="inline-flex items-center gap-1.5 text-sm text-rose-900/60 hover:text-rose-900">
          <ArrowLeft size={16} />
          Maxence
        </Link>

        <header className="mt-5 mb-6 flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-800 text-white shadow-lg shadow-rose-700/25">
            <Wine size={30} />
          </span>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Cave</h1>
            <p className="text-rose-900/60">{titre === 'Ce soir' ? 'Le bon vin pour ton plat' : titre}</p>
          </div>
        </header>

        {erreur && <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{erreur}</p>}
        {contenu}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-rose-900/10 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <ul className="mx-auto flex max-w-2xl">
          {ONGLETS.map(({ id, nom, icone: Icone }) => (
            <li key={id} className="flex-1">
              <button
                onClick={() => allerA(id)}
                className={`flex w-full flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${onglet === id ? 'text-rose-700' : 'text-rose-900/45'}`}
                aria-current={onglet === id ? 'page' : undefined}
              >
                <Icone size={22} />
                {nom}
                {id === 'achats' && envies.length > 0 && <span className="sr-only">{envies.length}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
