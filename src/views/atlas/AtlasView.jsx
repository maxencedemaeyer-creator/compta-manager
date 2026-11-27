import { Link } from 'react-router-dom'
import { ArrowLeft, Map as CarteIcone } from 'lucide-react'
import { RUBRIQUES_ATLAS, SERIES_ATLAS } from '../../config/atlas.js'

// =============================================================
//  ATLAS : la bibliothèque de cartes (écran d'accueil de l'appli)
//  Conçue pour un écran d'ordinateur ou une tablette (projection en classe).
// =============================================================
export default function AtlasView() {
  return (
    <div className="min-h-dvh bg-[#f4f6f8] text-slate-900">
      <header className="flex items-center gap-4 px-8 py-5 bg-white border-b border-slate-200">
        <Link to="/maxence" aria-label="Retour à l’accueil" className="w-11 h-11 rounded-xl border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-50 active:scale-95">
          <ArrowLeft size={22} />
        </Link>
        <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-400 via-cyan-500 to-emerald-500 text-white flex items-center justify-center">
          <CarteIcone size={24} />
        </span>
        <div>
          <h1 className="text-3xl font-black tracking-tight">ATLAS</h1>
          <p className="text-sm text-slate-500">Bibliothèque de cartes</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-8 space-y-10">
        {RUBRIQUES_ATLAS.map((rubrique) => {
          const series = SERIES_ATLAS.filter((s) => s.rubrique === rubrique)
          if (!series.length) return null
          return (
            <section key={rubrique}>
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">{rubrique}</h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {series.map((s) => {
                  const Icone = s.icon
                  return (
                    <Link
                      key={s.id}
                      to={s.to}
                      className="group rounded-3xl bg-white border border-slate-200 shadow-soft p-6 flex flex-col gap-4 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99] transition"
                    >
                      <span className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${s.couleur} text-white flex items-center justify-center shadow-md`}>
                        <Icone size={32} />
                      </span>
                      <div>
                        <p className="text-2xl font-black">{s.titre}</p>
                        <p className="mt-1 text-sm text-slate-500 leading-snug">{s.texte}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )
        })}
      </main>
    </div>
  )
}
