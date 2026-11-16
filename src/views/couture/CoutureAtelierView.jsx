import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Camera, Check, Copy, EyeOff, Inbox, Loader2, Shirt } from 'lucide-react'
import { StylesCouture } from '../../components/couture/Vichy.jsx'
import ArticleForm from '../../components/couture/ArticleForm.jsx'
import CommandesCentrale from '../../components/couture/CommandesCentrale.jsx'
import { CODE_GALERIE, lienGalerie, lienWhatsApp, useArticlesCouture, useCommandesCouture } from '../../hooks/useCouture.js'

// Logo WhatsApp (simple, en SVG)
function IconeWhatsApp({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-.7-.3-1.4-.7-2-1.3-.6-.5-1-1.1-1.4-1.8-.1-.2 0-.4.1-.5l.4-.4.2-.4v-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.6.6-.9 1.3-.9 2.1 0 .9.4 1.8.9 2.5 1 1.5 2.3 2.7 3.9 3.5.5.2.9.4 1.4.5.6.2 1.1.2 1.6.1.6-.1 1.5-.6 1.7-1.2.2-.5.2-1 .1-1.1l-.5-.3Z" />
    </svg>
  )
}

// =============================================================
//  Application Couture — l'atelier de Julie (/julie/couture)
//  Pensée pour l'iPhone : barre en bas avec
//  « Créations » · bouton appareil photo · « Commandes ».
//  Le bouton appareil photo ouvre directement la caméra, puis
//  le formulaire de la nouvelle création.
//  Lien public à partager : /couture (code d'accès : julie)
// =============================================================
export default function CoutureAtelierView() {
  const { onglet } = useParams()
  const navigate = useNavigate()
  const vueCommandes = onglet === 'commandes'
  const { articles, chargement } = useArticlesCouture()
  const { commandes, chargement: chargementCommandes } = useCommandesCouture()
  const [edition, setEdition] = useState({ open: false, article: null, fichiers: null })
  const [copie, setCopie] = useState(false)
  const camera = useRef(null)

  const nouvelles = commandes.filter((c) => c.statut === 'nouvelle').length
  const demandesPar = commandes.reduce((acc, c) => {
    if (c.articleId && c.statut !== 'annulee') acc[c.articleId] = (acc[c.articleId] || 0) + 1
    return acc
  }, {})

  async function copierLien() {
    try {
      await navigator.clipboard.writeText(`${lienGalerie()}\nCode d'accès : ${CODE_GALERIE}`)
      setCopie(true)
      setTimeout(() => setCopie(false), 2000)
    } catch {
      prompt('Copie ce lien :', lienGalerie())
    }
  }

  const aller = (versCommandes) => {
    navigate(versCommandes ? '/julie/couture/commandes' : '/julie/couture', { replace: true })
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="couture-app min-h-dvh vichy-doux text-pink-950">
      <StylesCouture />

      <input
        ref={camera}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const fichiers = e.target.files?.length ? Array.from(e.target.files) : null
          e.target.value = ''
          if (fichiers) setEdition({ open: true, article: null, fichiers })
        }}
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-8 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[calc(7rem+env(safe-area-inset-bottom))]">
        {/* En-tête */}
        <div className="flex items-center justify-between py-2">
          <Link
            to="/julie"
            className="w-10 h-10 rounded-full bg-white/90 ring-1 ring-pink-100 shadow-sm flex items-center justify-center text-pink-700"
            aria-label="Retour à l'accueil"
          >
            <ArrowLeft size={18} />
          </Link>
          <button
            onClick={copierLien}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/90 ring-1 ring-pink-100 px-3.5 h-10 text-xs font-medium text-pink-700 shadow-sm"
          >
            {copie ? <Check size={14} /> : <Copy size={14} />} {copie ? 'Copié !' : 'Copier le lien'}
          </button>
        </div>
        <h1 className="couture-titre mt-2 text-[2.75rem] leading-none text-pink-950">
          {vueCommandes ? 'Mes commandes' : 'Mon atelier'}
        </h1>

        {!vueCommandes && (
          <a
            href={lienWhatsApp()}
            target="_blank"
            rel="noreferrer"
            className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 py-3.5 text-[15px] font-semibold text-white shadow-md shadow-green-600/20 active:scale-[0.98] transition"
          >
            <IconeWhatsApp /> Partager ma galerie
          </a>
        )}

        <div className="mt-5">
          {vueCommandes ? (
            <CommandesCentrale commandes={commandes} articles={articles} chargement={chargementCommandes} />
          ) : chargement ? (
            <div className="py-16 flex justify-center text-pink-300">
              <Loader2 className="animate-spin" />
            </div>
          ) : articles.length === 0 ? (
            <button onClick={() => camera.current?.click()} className="w-full py-14 text-center">
              <span className="mx-auto w-16 h-16 rounded-full bg-white ring-1 ring-pink-100 flex items-center justify-center text-pink-400">
                <Camera size={26} />
              </span>
              <p className="mt-3 couture-titre text-3xl text-pink-900">Ta galerie est vide</p>
              <p className="mt-1 text-sm text-pink-900/50">Prends ta première création en photo ✨</p>
            </button>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {articles.map((a) => {
                const cachee = a.visible === false
                const nb = demandesPar[a.id] || 0
                return (
                  <button
                    key={a.id}
                    onClick={() => setEdition({ open: true, article: a, fichiers: null })}
                    className="text-left rounded-[1.4rem] bg-white p-1.5 ring-1 ring-pink-100 shadow-[0_10px_30px_-22px_rgba(131,24,67,0.5)] active:scale-[0.98] transition"
                  >
                    <div className="relative aspect-[4/5] rounded-[1.1rem] overflow-hidden bg-pink-50">
                      {a.couverture && (
                        <img
                          src={a.couverture}
                          alt={a.nom}
                          decoding="async"
                          className={`w-full h-full object-cover ${cachee ? 'opacity-40 grayscale' : ''}`}
                        />
                      )}
                      {cachee && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 shadow">
                            <EyeOff size={13} /> Cachée
                          </span>
                        </span>
                      )}
                      {nb > 0 && (
                        <span className="absolute top-2 left-2 rounded-full bg-pink-500 px-2 py-0.5 text-[11px] font-bold text-white shadow">
                          💌 {nb}
                        </span>
                      )}
                    </div>
                    <p className="px-1.5 pt-2 pb-1 font-semibold text-sm text-pink-950 truncate">{a.nom}</p>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* Barre du bas (zone du pouce sur iPhone) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-md relative flex items-center rounded-[1.75rem] bg-white/95 ring-1 ring-pink-100 shadow-[0_12px_40px_-12px_rgba(131,24,67,0.35)] h-16 px-2">
          <button
            onClick={() => aller(false)}
            className={`flex-1 h-12 rounded-2xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${
              !vueCommandes ? 'text-pink-600' : 'text-pink-900/40'
            }`}
          >
            <Shirt size={21} /> Créations
          </button>

          <button
            onClick={() => camera.current?.click()}
            className="-mt-9 w-[4.25rem] h-[4.25rem] shrink-0 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-lg shadow-pink-500/40 ring-[5px] ring-[#fffafc] active:scale-95 transition"
            aria-label="Nouvelle création (prendre une photo)"
          >
            <Camera size={28} />
          </button>

          <button
            onClick={() => aller(true)}
            className={`relative flex-1 h-12 rounded-2xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${
              vueCommandes ? 'text-pink-600' : 'text-pink-900/40'
            }`}
          >
            <Inbox size={21} /> Commandes
            {nouvelles > 0 && (
              <span className="absolute top-0 left-1/2 ml-2 min-w-[1.25rem] h-5 px-1 rounded-full bg-pink-500 text-white text-[11px] font-bold flex items-center justify-center ring-2 ring-white">
                {nouvelles}
              </span>
            )}
          </button>
        </div>
      </nav>

      <ArticleForm
        open={edition.open}
        article={edition.article}
        fichiersInitiaux={edition.fichiers}
        onClose={() => setEdition({ open: false, article: null, fichiers: null })}
      />
    </div>
  )
}
