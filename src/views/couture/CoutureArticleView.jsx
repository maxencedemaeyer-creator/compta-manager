import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, Heart, Loader2, Share2 } from 'lucide-react'
import { StylesCouture, boutonRose } from '../../components/couture/Vichy.jsx'
import EnVeuxUnForm from '../../components/couture/EnVeuxUnForm.jsx'
import { baseGalerie, useArticleCouture } from '../../hooks/useCouture.js'

// =============================================================
//  Page d'une création (/couture/:articleId) : photos en grand,
//  infos, et le bouton « J'en veux un ! ».
// =============================================================
export default function CoutureArticleView() {
  const { articleId } = useParams()
  const { article, photos } = useArticleCouture(articleId)
  const [formulaire, setFormulaire] = useState(false)
  const [index, setIndex] = useState(0)
  const piste = useRef(null)

  function allerA(i) {
    const el = piste.current
    if (!el) return
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  }

  function surDefilement() {
    const el = piste.current
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth))
  }

  async function partager() {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: article?.nom, url })
      else {
        await navigator.clipboard.writeText(url)
        alert('Lien copié !')
      }
    } catch {
      /* partage annulé */
    }
  }

  const disponible = article && article.visible !== false
  // Tant que les grandes photos chargent, on montre la miniature
  const images = photos.length ? photos.map((p) => p.src) : article?.couverture ? [article.couverture] : []

  return (
    <div className="couture-app min-h-dvh vichy-doux text-pink-950">
      <StylesCouture />

      <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-[max(1rem,env(safe-area-inset-top))] pb-32 sm:pb-16">
        <div className="flex items-center justify-between py-2">
          <Link
            to={baseGalerie() || '/'}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 h-10 text-sm font-medium text-pink-800 ring-1 ring-pink-100 shadow-sm hover:bg-white"
          >
            <ArrowLeft size={16} /> Créations
          </Link>
          {disponible && (
            <button
              onClick={partager}
              className="w-10 h-10 rounded-full bg-white/90 ring-1 ring-pink-100 shadow-sm flex items-center justify-center text-pink-700 hover:bg-white"
              aria-label="Partager"
            >
              <Share2 size={17} />
            </button>
          )}
        </div>

        {article === undefined ? (
          <div className="py-32 flex justify-center text-pink-400">
            <Loader2 className="animate-spin" size={28} />
          </div>
        ) : !disponible ? (
          <div className="py-24 text-center">
            <p className="couture-titre text-3xl text-pink-900">Cette création n’est plus disponible</p>
            <Link to={baseGalerie() || '/'} className={`${boutonRose} mt-6`}>
              Voir les autres créations
            </Link>
          </div>
        ) : (
          <div className="mt-3 grid sm:grid-cols-2 gap-6 sm:gap-10 items-start">
            {/* Photos */}
            <div className="rounded-[2rem] bg-white p-2 shadow-[0_14px_40px_-20px_rgba(131,24,67,0.5)] ring-1 ring-pink-100">
              <div className="relative overflow-hidden rounded-[1.6rem] bg-pink-50">
                <div
                  ref={piste}
                  onScroll={surDefilement}
                  className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar aspect-[4/5]"
                >
                  {images.length === 0 && <div className="w-full shrink-0 vichy" />}
                  {images.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`${article.nom} — photo ${i + 1}`}
                      decoding="async"
                      draggable={false}
                      className="w-full h-full shrink-0 snap-center snap-always object-cover"
                    />
                  ))}
                </div>
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => allerA(Math.max(0, index - 1))}
                      className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 items-center justify-center text-pink-700 shadow"
                      aria-label="Photo précédente"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={() => allerA(Math.min(images.length - 1, index + 1))}
                      className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 items-center justify-center text-pink-700 shadow"
                      aria-label="Photo suivante"
                    >
                      <ChevronRight size={18} />
                    </button>
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                      {images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => allerA(i)}
                          className={`h-2 rounded-full transition-all ${i === index ? 'w-5 bg-white' : 'w-2 bg-white/60'}`}
                          aria-label={`Photo ${i + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar pt-2 px-0.5">
                  {images.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => allerA(i)}
                      className={`w-14 h-14 shrink-0 rounded-xl overflow-hidden ring-2 transition ${
                        i === index ? 'ring-pink-500' : 'ring-transparent opacity-70'
                      }`}
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Infos */}
            <div className="sm:pt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-pink-400">Création de Julie</p>
              <h1 className="couture-titre mt-1 text-[2.75rem] sm:text-6xl leading-[1.02] text-pink-950">{article.nom}</h1>
              {article.description && (
                <div className="mt-5 rounded-3xl bg-white/80 p-1 ring-1 ring-pink-100">
                  <p className="couture-piqure rounded-[1.25rem] px-4 py-3.5 text-[15px] leading-relaxed text-pink-950/80 whitespace-pre-line">
                    {article.description}
                  </p>
                </div>
              )}
              <p className="mt-5 text-sm text-pink-900/55">
                Chaque pièce est cousue à la main : dis à Julie ta taille, ta couleur préférée… elle s’occupe du reste.
              </p>

              {/* Bouton (fixé en bas sur téléphone) */}
              <div className="fixed sm:static inset-x-0 bottom-0 z-30 px-4 sm:px-0 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-0 sm:mt-7 bg-gradient-to-t from-[#fffafc] via-[#fffafc]/90 to-transparent sm:bg-none">
                <button onClick={() => setFormulaire(true)} className={`${boutonRose} w-full text-base py-4`}>
                  <Heart size={19} className="fill-white" /> J’en veux un !
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <EnVeuxUnForm article={article} open={formulaire} onClose={() => setFormulaire(false)} />
    </div>
  )
}
