import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Copy, EyeOff, ExternalLink, Images, Inbox, Loader2, Plus, Shirt } from 'lucide-react'
import { BandeauVichy, StylesCouture, boutonRose } from '../../components/couture/Vichy.jsx'
import ArticleForm from '../../components/couture/ArticleForm.jsx'
import CommandesCentrale from '../../components/couture/CommandesCentrale.jsx'
import {
  CODE_GALERIE,
  changerVisibilite,
  lienGalerie,
  lienWhatsApp,
  useArticlesCouture,
  useCommandesCouture,
} from '../../hooks/useCouture.js'

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
//  Onglet « Mes créations » : galerie + ajout par photo
//  Onglet « Commandes »     : la centrale des « J'en veux un ! »
//  Lien public à partager : /couture (code d'accès : julie)
// =============================================================
export default function CoutureAtelierView() {
  const { onglet } = useParams()
  const navigate = useNavigate()
  const vueCommandes = onglet === 'commandes'
  const { articles, chargement } = useArticlesCouture()
  const { commandes, chargement: chargementCommandes } = useCommandesCouture()
  const [edition, setEdition] = useState({ open: false, article: null })
  const [copie, setCopie] = useState(false)

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

  return (
    <div className="min-h-dvh vichy-doux text-pink-950">
      <StylesCouture />

      <BandeauVichy>
        <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-[max(1rem,env(safe-area-inset-top))] pb-8">
          <div className="flex items-center justify-between py-2">
            <Link
              to="/julie"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-2 text-sm font-medium text-pink-800 shadow-sm"
            >
              <ArrowLeft size={16} /> Accueil
            </Link>
          </div>
          <div className="mt-4 inline-block rounded-[1.75rem] bg-white/90 p-1.5 shadow-lg shadow-pink-900/10">
            <div className="couture-piqure rounded-[1.4rem] px-5 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-pink-400">Couture</p>
              <h1 className="couture-titre text-[2.6rem] leading-none text-pink-950">Mon atelier</h1>
            </div>
          </div>
        </div>
      </BandeauVichy>

      <main className="max-w-3xl mx-auto px-4 sm:px-8 pt-4 pb-16">
        {/* Partage */}
        <div className="rounded-[1.75rem] bg-white ring-1 ring-pink-100 p-4 shadow-[0_10px_30px_-22px_rgba(131,24,67,0.5)]">
          <p className="text-sm font-semibold text-pink-950">Ma galerie à partager</p>
          <p className="text-xs text-pink-900/50 mt-0.5 break-all">
            {lienGalerie().replace(/^https?:\/\//, '')} · code <strong className="text-pink-700">{CODE_GALERIE}</strong>
          </p>
          <div className="mt-3 flex gap-2">
            <a
              href={lienWhatsApp()}
              target="_blank"
              rel="noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-md shadow-green-600/20 active:scale-[0.98] transition"
            >
              <IconeWhatsApp /> Partager ma galerie
            </a>
            <button
              onClick={copierLien}
              className="w-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center"
              aria-label="Copier le lien"
              title="Copier le lien et le code"
            >
              {copie ? <Check size={18} /> : <Copy size={18} />}
            </button>
            <a
              href="/couture"
              target="_blank"
              rel="noreferrer"
              className="w-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center"
              aria-label="Voir ma galerie"
              title="Voir ma galerie comme mes copines"
            >
              <ExternalLink size={18} />
            </a>
          </div>
        </div>

        {/* Onglets */}
        <div className="mt-5 mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-white p-1 ring-1 ring-pink-100">
          <button
            onClick={() => navigate('/julie/couture', { replace: true })}
            className={`inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition ${
              !vueCommandes ? 'bg-pink-500 text-white shadow-sm' : 'text-pink-900/55'
            }`}
          >
            <Shirt size={16} /> Mes créations
          </button>
          <button
            onClick={() => navigate('/julie/couture/commandes', { replace: true })}
            className={`relative inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition ${
              vueCommandes ? 'bg-pink-500 text-white shadow-sm' : 'text-pink-900/55'
            }`}
          >
            <Inbox size={16} /> Commandes
            {nouvelles > 0 && (
              <span
                className={`min-w-5 h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                  vueCommandes ? 'bg-white text-pink-600' : 'bg-pink-500 text-white'
                }`}
              >
                {nouvelles}
              </span>
            )}
          </button>
        </div>

        {vueCommandes ? (
          <CommandesCentrale commandes={commandes} articles={articles} chargement={chargementCommandes} />
        ) : (
          <>
            <button
              onClick={() => setEdition({ open: true, article: null })}
              className={`${boutonRose} w-full py-4 text-base`}
            >
              <Plus size={20} /> Nouvelle création
            </button>

            {chargement ? (
              <div className="py-16 flex justify-center text-pink-300">
                <Loader2 className="animate-spin" />
              </div>
            ) : articles.length === 0 ? (
              <div className="py-14 text-center">
                <p className="couture-titre text-3xl text-pink-900">Ta galerie est vide</p>
                <p className="mt-1 text-sm text-pink-900/50">Prends ta première création en photo ✨</p>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {articles.map((a) => {
                  const cachee = a.visible === false
                  const nb = demandesPar[a.id] || 0
                  return (
                    <div key={a.id} className="rounded-[1.5rem] bg-white p-1.5 ring-1 ring-pink-100 shadow-[0_10px_30px_-22px_rgba(131,24,67,0.5)]">
                      <button onClick={() => setEdition({ open: true, article: a })} className="block w-full text-left">
                        <div className="relative aspect-[4/5] rounded-[1.15rem] overflow-hidden bg-pink-50">
                          {a.couverture ? (
                            <img src={a.couverture} alt={a.nom} className={`w-full h-full object-cover ${cachee ? 'opacity-40 grayscale' : ''}`} />
                          ) : (
                            <div className="w-full h-full vichy" />
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
                          {a.nbPhotos > 1 && (
                            <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[11px] text-white">
                              <Images size={12} /> {a.nbPhotos}
                            </span>
                          )}
                        </div>
                        <p className="px-1.5 pt-2 font-semibold text-sm text-pink-950 truncate">{a.nom}</p>
                      </button>
                      <div className="px-1.5 pb-1 flex items-center justify-between">
                        <span className="text-[11px] text-pink-900/35 truncate">{a.prix || ''}</span>
                        <button
                          onClick={() => changerVisibilite(a.id, cachee).catch((e) => alert(e.message))}
                          className="text-[11px] font-medium text-pink-500 hover:text-pink-700"
                        >
                          {cachee ? 'Afficher' : 'Cacher'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>

      <ArticleForm
        open={edition.open}
        article={edition.article}
        onClose={() => setEdition({ open: false, article: null })}
      />
    </div>
  )
}
