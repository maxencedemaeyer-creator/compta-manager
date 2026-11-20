import { useEffect, useState } from 'react'
import { Maximize2, X } from 'lucide-react'
import { lireImagePage } from '../../hooks/useLecture.js'

// =============================================================
//  Appli « Lis-moi » : la (ou les) photo(s) de la lecture
//  Toucher la photo l'ouvre en grand ; double-toucher pour zoomer.
// =============================================================
const memoire = new Map() // « id_n » → image (évite de la recharger)

export default function PhotoPages({ lectureId, pages = 1, className = '' }) {
  const [page, setPage] = useState(0)
  const [image, setImage] = useState(null)
  const [enGrand, setEnGrand] = useState(false)
  const [zoom, setZoom] = useState(false)

  useEffect(() => {
    if (page >= pages) setPage(pages - 1)
  }, [pages, page])

  useEffect(() => {
    const cle = `${lectureId}_${page}`
    if (memoire.has(cle)) {
      setImage(memoire.get(cle))
      return
    }
    setImage(null)
    let actif = true
    lireImagePage(lectureId, page)
      .then((img) => {
        if (img) memoire.set(cle, img)
        if (actif) setImage(img)
      })
      .catch(() => {})
    return () => {
      actif = false
    }
  }, [lectureId, page])

  return (
    <div className={`flex flex-col ${className}`}>
      <button
        onClick={() => image && setEnGrand(true)}
        className="group relative min-h-0 flex-1 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-indigo-950/5"
      >
        {image ? (
          <img src={image} alt={`Page ${page + 1}`} className="h-full w-full object-contain" />
        ) : (
          <div className="h-full w-full animate-pulse bg-indigo-50" />
        )}
        <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-indigo-700 shadow">
          <Maximize2 size={16} />
        </span>
      </button>

      {pages > 1 && (
        <div className="mt-2 flex justify-center gap-1.5">
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`h-9 min-w-9 rounded-full px-3 text-sm font-semibold ${
                i === page ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-900/60 ring-1 ring-indigo-950/10'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {enGrand && (
        <div
          className="fixed inset-0 z-50 overflow-auto bg-black/95"
          onClick={(e) => {
            // double-toucher (fonctionne aussi sur iPad)
            const maintenant = Date.now()
            if (maintenant - (e.currentTarget.dataset.dernier || 0) < 320) setZoom((z) => !z)
            e.currentTarget.dataset.dernier = maintenant
          }}
        >
          <img
            src={image}
            alt=""
            className={zoom ? 'max-w-none' : 'h-full w-full object-contain'}
            style={zoom ? { width: '220%' } : undefined}
          />
          <button
            onClick={() => {
              setEnGrand(false)
              setZoom(false)
            }}
            className="fixed right-4 top-[max(1rem,env(safe-area-inset-top))] flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-black shadow-lg"
            aria-label="Fermer"
          >
            <X size={22} />
          </button>
        </div>
      )}
    </div>
  )
}
