import { useEffect, useState } from 'react'
import { Image as ImageIcon, X } from 'lucide-react'
import { lireImagePage } from '../../hooks/useLecture.js'

// =============================================================
//  Appli « Lis-moi » : la photo d'origine, en petit
//  Décision de Max (20 nov.) : c'est sur le TEXTE qu'on choisit ce qu'on
//  lit ; la photo n'est qu'un rappel → petite vignette « Voir la photo »
//  qui s'ouvre en grand (pages 1, 2, 3… ; double-toucher = zoom).
// =============================================================
const memoire = new Map() // « id_n » → image (évite de la recharger)

function useImage(lectureId, page, actif) {
  const [image, setImage] = useState(null)
  useEffect(() => {
    if (!actif) return
    const cle = `${lectureId}_${page}`
    if (memoire.has(cle)) {
      setImage(memoire.get(cle))
      return
    }
    setImage(null)
    let vivant = true
    lireImagePage(lectureId, page)
      .then((img) => {
        if (img) memoire.set(cle, img)
        if (vivant) setImage(img)
      })
      .catch(() => {})
    return () => {
      vivant = false
    }
  }, [lectureId, page, actif])
  return image
}

export default function PhotoPages({ lectureId, pages = 1, miniature }) {
  const [enGrand, setEnGrand] = useState(false)
  const [page, setPage] = useState(0)
  const [zoom, setZoom] = useState(false)
  const image = useImage(lectureId, page, enGrand)

  useEffect(() => {
    if (page >= pages) setPage(Math.max(0, pages - 1))
  }, [pages, page])

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setEnGrand(true)
        }}
        className="flex items-center gap-2.5 rounded-2xl bg-white/80 py-1.5 pl-1.5 pr-3.5 text-sm font-semibold text-indigo-800 shadow-sm ring-1 ring-indigo-950/5 transition active:scale-95"
      >
        {miniature ? (
          <img src={miniature} alt="" className="h-9 w-9 rounded-xl object-cover" />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">
            <ImageIcon size={18} />
          </span>
        )}
        Voir la photo{pages > 1 ? ` (${pages} pages)` : ''}
      </button>

      {enGrand && (
        <div
          className="fixed inset-0 z-50 overflow-auto bg-black/95"
          onClick={(e) => {
            e.stopPropagation()
            // double-toucher / double-clic = zoom (fonctionne aussi sur iPad)
            const maintenant = Date.now()
            if (maintenant - (e.currentTarget.dataset.dernier || 0) < 320) setZoom((z) => !z)
            e.currentTarget.dataset.dernier = maintenant
          }}
        >
          {image ? (
            <img src={image} alt={`Page ${page + 1}`} className={zoom ? 'max-w-none' : 'h-full w-full object-contain'} style={zoom ? { width: '220%' } : undefined} />
          ) : (
            <div className="flex h-full items-center justify-center text-white/60">Chargement…</div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setEnGrand(false)
              setZoom(false)
            }}
            className="fixed right-4 top-[max(1rem,env(safe-area-inset-top))] flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-black shadow-lg"
            aria-label="Fermer"
          >
            <X size={22} />
          </button>
          {pages > 1 && (
            <div className="fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] flex justify-center gap-2">
              {Array.from({ length: pages }, (_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation()
                    setPage(i)
                    setZoom(false)
                  }}
                  className={`h-11 min-w-11 rounded-full px-4 font-semibold shadow-lg ${i === page ? 'bg-indigo-600 text-white' : 'bg-white/90 text-indigo-900'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
