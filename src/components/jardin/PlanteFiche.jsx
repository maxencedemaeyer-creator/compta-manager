import { useEffect, useState } from 'react'
import { ChevronDown, Pencil } from 'lucide-react'
import Feuille from './Feuille.jsx'
import { baseDePlante, VOLETS } from '../../data/jardin/plantes.js'
import { lirePhotosPlante, nomPlante } from '../../hooks/useJardin.js'

export const LIEUX = { interieur: '🏠 Intérieur', exterieur: '🌤️ Extérieur' }
export const CULTURES = { pot: '🪴 En pot', terre: '🌍 Pleine terre' }

// Fiche d'une plante du jardin : mes infos + présentation + conseils dans des volets
export default function PlanteFiche({ jardinId, plante, onClose, onModifier }) {
  const base = baseDePlante(plante)
  const [photos, setPhotos] = useState([])
  const [ouvert, setOuvert] = useState(null)
  const [zoom, setZoom] = useState(null)

  useEffect(() => {
    if (!plante.photoIds?.length) return
    let annule = false
    lirePhotosPlante(jardinId, plante.photoIds)
      .then((l) => !annule && setPhotos(l))
      .catch((e) => console.error(e))
    return () => {
      annule = true
    }
  }, [jardinId, plante.photoIds])

  return (
    <Feuille open onClose={onClose} titre={nomPlante(plante)} large>
      <div className="space-y-5">
        {base && <p className="-mt-2 text-sm italic text-emerald-800/60">{base.latin}</p>}

        {/* Photos */}
        {photos.length > 0 && (
          <div className="flex gap-3 overflow-x-auto -mx-1 px-1 pb-1">
            {photos.map((p) => (
              <button key={p.id} onClick={() => setZoom(p.src)} className="h-40 w-40 shrink-0 overflow-hidden rounded-2xl bg-emerald-50">
                <img src={p.src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Mes infos */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-bold text-white">×{plante.quantite}</span>
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800">{LIEUX[plante.lieu]}</span>
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800">{CULTURES[plante.culture]}</span>
        </div>
        {plante.notes && <p className="rounded-2xl bg-emerald-50/70 px-4 py-3 text-sm text-emerald-950">{plante.notes}</p>}

        <button
          onClick={onModifier}
          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"
        >
          <Pencil size={15} />
          Modifier mes infos et photos
        </button>

        {/* Infos de la base */}
        {base ? (
          <>
            <p className="text-[15px] leading-relaxed text-emerald-950">{base.resume}</p>
            <div className="space-y-2">
              {VOLETS.map((v) => {
                const puces = base.conseils[v.id] || []
                if (!puces.length) return null
                const est = ouvert === v.id
                return (
                  <div key={v.id} className="overflow-hidden rounded-2xl border border-emerald-100">
                    <button
                      onClick={() => setOuvert(est ? null : v.id)}
                      className={`flex w-full items-center gap-3 px-4 py-3.5 text-left font-semibold ${
                        est ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-950'
                      }`}
                    >
                      <span className="text-lg">{v.emoji}</span>
                      <span className="flex-1">{v.nom}</span>
                      <ChevronDown size={18} className={`transition-transform ${est ? 'rotate-180' : ''}`} />
                    </button>
                    {est && (
                      <ul className="space-y-2 bg-emerald-50/50 px-4 py-3.5 text-[14.5px] text-emerald-950">
                        {puces.map((t, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-emerald-500">•</span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <p className="rounded-2xl bg-emerald-50/70 px-4 py-3 text-sm text-emerald-900/70">
            Cette plante est ajoutée librement : elle n'est pas dans la base, donc pas de conseils ni de tâches dans le calendrier.
          </p>
        )}
      </div>

      {zoom && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4" onClick={() => setZoom(null)}>
          <img src={zoom} alt="" className="max-h-full max-w-full rounded-xl" />
        </div>
      )}
    </Feuille>
  )
}
