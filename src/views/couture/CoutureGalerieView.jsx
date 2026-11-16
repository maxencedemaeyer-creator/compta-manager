import { Link } from 'react-router-dom'
import { Heart, Images, Loader2, Scissors } from 'lucide-react'
import { BandeauVichy, Etiquette, StylesCouture } from '../../components/couture/Vichy.jsx'
import { enMs, useArticlesCouture } from '../../hooks/useCouture.js'

// Une création est « Nouveau » pendant 21 jours
const NOUVEAU_MS = 21 * 24 * 3600 * 1000

// =============================================================
//  Galerie publique de Julie (/couture) — lien à partager.
//  Pas de code PIN : on voit les créations visibles et on peut
//  cliquer sur une création pour dire « J'en veux un ! ».
// =============================================================
export default function CoutureGalerieView() {
  const { articles, chargement, erreur } = useArticlesCouture({ visiblesSeulement: true })

  return (
    <div className="couture-app min-h-dvh vichy-doux text-pink-950">
      <StylesCouture />

      <BandeauVichy>
        <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-[max(1.25rem,env(safe-area-inset-top))] pb-2 sm:pt-14 sm:pb-6">
          <div className="mx-auto max-w-md rounded-[2rem] bg-white/90 p-1.5 shadow-xl shadow-pink-900/10">
            <div className="couture-piqure rounded-[1.6rem] px-5 py-5 sm:py-6 text-center">
              <p className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-pink-400">
                <Scissors size={13} /> Fait main
              </p>
              <h1 className="couture-titre mt-1 text-[2.15rem] sm:text-5xl leading-[1.05] text-pink-950">
                Les créations de Julie
              </h1>
              <p className="mt-2 text-sm text-pink-900/60">
                Un modèle te plaît ? Touche-le, puis <strong className="text-pink-600">« J’en veux un ! »</strong>
              </p>
            </div>
          </div>
        </div>
      </BandeauVichy>

      <main className="max-w-5xl mx-auto px-3 sm:px-8 pt-4 pb-[max(3rem,env(safe-area-inset-bottom))]">
        {chargement ? (
          <div className="py-24 flex flex-col items-center text-pink-400">
            <Loader2 className="animate-spin" size={28} />
            <p className="mt-3 text-sm">Ouverture de l’atelier…</p>
          </div>
        ) : erreur ? (
          <p className="py-20 text-center text-sm text-red-500">{erreur}</p>
        ) : articles.length === 0 ? (
          <div className="py-20 text-center">
            <p className="couture-titre text-3xl text-pink-900">L’atelier se prépare…</p>
            <p className="mt-2 text-sm text-pink-900/55">Les premières créations arrivent très bientôt.</p>
          </div>
        ) : (
          <>
            <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-[0.2em] text-pink-900/40">
              {articles.length} création{articles.length > 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-5">
              {articles.map((a, i) => (
                <Link
                  key={a.id}
                  to={`/couture/${a.id}`}
                  className="couture-apparait group block rounded-[1.6rem] bg-white p-1.5 shadow-[0_10px_30px_-18px_rgba(131,24,67,0.45)] ring-1 ring-pink-100 active:scale-[0.98] sm:hover:-translate-y-1 transition-transform"
                  style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[1.25rem] bg-pink-50">
                    {a.couverture ? (
                      <img
                        src={a.couverture}
                        alt={a.nom}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full vichy" />
                    )}
                    <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                      {Date.now() - enMs(a.creeLe) < NOUVEAU_MS && <Etiquette>✨ Nouveau</Etiquette>}
                    </div>
                    {a.nbPhotos > 1 && (
                      <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
                        <Images size={12} /> {a.nbPhotos}
                      </span>
                    )}
                  </div>
                  <div className="px-2 pt-2.5 pb-2">
                    <p className="font-semibold text-[15px] leading-snug text-pink-950 line-clamp-2">{a.nom}</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-pink-400 group-hover:text-pink-600 transition-colors">
                      <Heart size={13} className="group-hover:fill-pink-500 transition-colors" /> J’en veux un
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>

      <footer className="pb-10 text-center text-xs text-pink-900/35">Cousu avec amour par Julie 🧵</footer>
    </div>
  )
}
