import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Pencil, Plus, Sprout } from 'lucide-react'
import { useJardins } from '../../hooks/useJardin.js'
import JardinForm from '../../components/jardin/JardinForm.jsx'
import { boutonPrincipal } from '../../components/jardin/Feuille.jsx'

// =============================================================
//  Mon jardin — écran 1 : choisir (ou créer) un jardin
// =============================================================
export default function JardinListeView() {
  const { jardins, chargement, erreur } = useJardins()
  const [formulaire, setFormulaire] = useState(null) // null | 'nouveau' | jardin
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white text-emerald-950 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -right-24 h-80 w-80 rounded-full bg-emerald-200/50 blur-3xl" />

      <div className="relative mx-auto max-w-2xl px-5 sm:px-8 pt-6 sm:pt-10 pb-24">
        <Link to="/maxence" className="inline-flex items-center gap-1.5 text-sm text-emerald-900/60 hover:text-emerald-900">
          <ArrowLeft size={16} />
          Maxence
        </Link>

        <header className="mt-5 mb-7 flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 text-white shadow-lg shadow-emerald-600/25">
            <Sprout size={30} />
          </span>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Mon jardin</h1>
            <p className="text-emerald-900/60">Choisis un jardin</p>
          </div>
        </header>

        {erreur && <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{erreur}</p>}

        {chargement ? (
          <p className="py-10 text-center text-emerald-900/50">Chargement…</p>
        ) : jardins.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-emerald-200 bg-white/70 px-6 py-12 text-center">
            <p className="text-5xl">🌱</p>
            <p className="mt-3 text-lg font-semibold">Pas encore de jardin</p>
            <p className="mt-1 text-sm text-emerald-900/60">Crée le premier : « Maison », « Chez Mamie »…</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {jardins.map((j) => (
              <li key={j.id} className="flex items-stretch overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm shadow-emerald-900/5">
                <button
                  onClick={() => navigate(`/maxence/jardin/${j.id}`)}
                  className="flex min-w-0 flex-1 items-center gap-4 px-5 py-5 text-left hover:bg-emerald-50/60 active:bg-emerald-50"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">🌳</span>
                  <span className="min-w-0">
                    <span className="block truncate text-xl font-bold">{j.nom}</span>
                    {j.adresse && (
                      <span className="mt-0.5 flex items-center gap-1 truncate text-sm text-emerald-900/55">
                        <MapPin size={13} className="shrink-0" />
                        {j.adresse}
                      </span>
                    )}
                  </span>
                </button>
                <button
                  onClick={() => setFormulaire(j)}
                  className="flex w-14 shrink-0 items-center justify-center border-l border-emerald-50 text-emerald-600 hover:bg-emerald-50"
                  aria-label={`Modifier ${j.nom}`}
                >
                  <Pencil size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <button onClick={() => setFormulaire('nouveau')} className={`${boutonPrincipal} mt-6 w-full text-base`}>
          <Plus size={20} />
          Nouveau jardin
        </button>
      </div>

      {formulaire && (
        <JardinForm jardin={formulaire === 'nouveau' ? null : formulaire} onClose={() => setFormulaire(null)} />
      )}
    </div>
  )
}
