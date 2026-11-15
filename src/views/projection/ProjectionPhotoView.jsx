import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Camera, Check, ImagePlus, Images, Loader2, RotateCcw, Send } from 'lucide-react'
import { envoyerPhoto } from '../../hooks/useProjection.js'

// =============================================================
//  Projection — page du téléphone
//  Prendre une photo → Envoyer → elle s'affiche sur l'écran de la classe
// =============================================================
export default function ProjectionPhotoView() {
  const cameraRef = useRef(null)
  const galerieRef = useRef(null)
  const [fichier, setFichier] = useState(null)
  const [apercu, setApercu] = useState(null)
  const [etape, setEtape] = useState('pret') // pret | apercu | envoi | envoye
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    if (!fichier) {
      setApercu(null)
      return
    }
    const url = URL.createObjectURL(fichier)
    setApercu(url)
    return () => URL.revokeObjectURL(url)
  }, [fichier])

  function choisir(file) {
    if (!file) return
    setErreur('')
    setFichier(file)
    setEtape('apercu')
  }

  async function envoyer() {
    setEtape('envoi')
    setErreur('')
    try {
      await envoyerPhoto(fichier)
      setEtape('envoye')
      if (navigator.vibrate) navigator.vibrate(60)
    } catch (err) {
      console.error(err)
      setErreur(err.message || "L'envoi a échoué.")
      setEtape('apercu')
    }
  }

  function recommencer() {
    setFichier(null)
    setEtape('pret')
    setErreur('')
    cameraRef.current?.click()
  }

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-white flex flex-col">
      <div className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
        <Link to="/projection" className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white">
          <ArrowLeft size={16} />
          Projection
        </Link>
        <Link to="/projection/galerie" className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white">
          <Images size={16} />
          Galerie
        </Link>
      </div>

      <div className="flex-1 flex flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {/* Zone centrale : aperçu ou invitation */}
        <div className="flex-1 flex items-center justify-center py-4">
          {apercu && etape !== 'pret' ? (
            <div className="relative w-full h-full max-h-[65dvh] flex items-center justify-center">
              <img src={apercu} alt="Aperçu" className="max-w-full max-h-[65dvh] rounded-2xl object-contain shadow-2xl" />
              {etape === 'envoi' && (
                <div className="absolute inset-0 rounded-2xl bg-black/50 flex flex-col items-center justify-center gap-3">
                  <Loader2 size={40} className="animate-spin" />
                  <p className="font-medium">Envoi vers l’écran…</p>
                </div>
              )}
              {etape === 'envoye' && (
                <div className="absolute inset-0 rounded-2xl bg-emerald-600/60 flex flex-col items-center justify-center gap-3">
                  <span className="w-16 h-16 rounded-full bg-white text-emerald-600 flex items-center justify-center">
                    <Check size={36} strokeWidth={3} />
                  </span>
                  <p className="font-semibold text-lg">Projetée au tableau !</p>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex flex-col items-center justify-center gap-3 shadow-[0_20px_60px_-15px_rgba(251,146,60,0.6)] active:scale-95 transition-transform"
            >
              <Camera size={64} strokeWidth={1.6} />
              <span className="text-xl font-semibold">Prendre une photo</span>
            </button>
          )}
        </div>

        {erreur && <p className="text-sm text-rose-300 text-center mb-3">{erreur}</p>}

        {/* Boutons du bas */}
        {etape === 'pret' && (
          <button
            type="button"
            onClick={() => galerieRef.current?.click()}
            className="mx-auto inline-flex items-center gap-2 text-sm text-white/60 hover:text-white py-3"
          >
            <ImagePlus size={18} />
            Choisir une photo existante
          </button>
        )}

        {(etape === 'apercu' || etape === 'envoi') && (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={recommencer}
              disabled={etape === 'envoi'}
              className="h-14 rounded-2xl bg-white/10 font-medium inline-flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <RotateCcw size={20} />
              Reprendre
            </button>
            <button
              type="button"
              onClick={envoyer}
              disabled={etape === 'envoi'}
              className="h-14 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 font-semibold text-lg inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Send size={20} />
              Envoyer
            </button>
          </div>
        )}

        {etape === 'envoye' && (
          <button
            type="button"
            onClick={recommencer}
            className="h-14 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 font-semibold text-lg inline-flex items-center justify-center gap-2"
          >
            <Camera size={22} />
            Prendre une autre photo
          </button>
        )}
      </div>

      {/* capture="environment" ouvre directement l'appareil photo arrière */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          choisir(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      <input
        ref={galerieRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          choisir(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </div>
  )
}
