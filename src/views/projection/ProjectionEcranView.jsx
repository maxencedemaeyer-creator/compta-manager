import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Camera, Images, Loader2, Maximize, Minimize, RotateCcw, RotateCw, X } from 'lucide-react'
import { masquer, pivoterPhoto, useEcranProjection } from '../../hooks/useProjection.js'

// =============================================================
//  Projection — écran de la classe (ordinateur relié au TBI)
//  Page d'attente, puis la dernière photo envoyée s'affiche en grand
//  automatiquement. Les boutons disparaissent quand la souris ne bouge
//  plus, pour ne pas gêner la projection.
// =============================================================
function useHorloge() {
  const [maintenant, setMaintenant] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setMaintenant(new Date()), 10000)
    return () => clearInterval(t)
  }, [])
  return maintenant
}

export default function ProjectionEcranView() {
  const { chargement, photoId, image } = useEcranProjection()
  const [controlesVisibles, setControlesVisibles] = useState(true)
  const [pleinEcran, setPleinEcran] = useState(false)
  const minuteur = useRef(null)
  const maintenant = useHorloge()

  // Boutons visibles quand la souris bouge, cachés après 3 secondes
  useEffect(() => {
    function montrer() {
      setControlesVisibles(true)
      clearTimeout(minuteur.current)
      minuteur.current = setTimeout(() => setControlesVisibles(false), 3000)
    }
    montrer()
    window.addEventListener('pointermove', montrer)
    window.addEventListener('pointerdown', montrer)
    return () => {
      window.removeEventListener('pointermove', montrer)
      window.removeEventListener('pointerdown', montrer)
      clearTimeout(minuteur.current)
    }
  }, [])

  // Empêche l'ordinateur de se mettre en veille pendant la projection
  useEffect(() => {
    let verrou = null
    async function demander() {
      try {
        if ('wakeLock' in navigator && document.visibilityState === 'visible') {
          verrou = await navigator.wakeLock.request('screen')
        }
      } catch {
        /* pas grave si refusé */
      }
    }
    demander()
    document.addEventListener('visibilitychange', demander)
    return () => {
      document.removeEventListener('visibilitychange', demander)
      verrou?.release?.().catch(() => {})
    }
  }, [])

  useEffect(() => {
    const maj = () => setPleinEcran(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', maj)
    return () => document.removeEventListener('fullscreenchange', maj)
  }, [])

  // Rotation de la photo projetée (enregistrée : la galerie suit aussi)
  const [rotation, setRotation] = useState('')
  async function pivoter(sens) {
    if (!photoId || rotation) return
    setRotation(sens > 0 ? 'droite' : 'gauche')
    try {
      await pivoterPhoto(photoId, sens)
    } catch (err) {
      console.error(err)
      window.alert(err.message || 'La rotation a échoué.')
    } finally {
      setRotation('')
    }
  }

  function basculerPleinEcran() {
    if (document.fullscreenElement) document.exitFullscreen?.()
    else document.documentElement.requestFullscreen?.().catch(() => {})
  }

  // Touche Échap = fermer la photo (quand on n'est pas en plein écran)
  useEffect(() => {
    function touche(e) {
      if (e.key === 'Escape' && photoId && !document.fullscreenElement) masquer()
    }
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  }, [photoId])

  const bouton =
    'w-12 h-12 rounded-full bg-black/50 backdrop-blur border border-white/15 text-white flex items-center justify-center hover:bg-black/70 transition-colors'

  return (
    <div
      className={`fixed inset-0 bg-black text-white overflow-hidden select-none ${
        controlesVisibles ? '' : 'cursor-none'
      }`}
    >
      {/* Photo projetée */}
      {photoId && image ? (
        <img
          key={photoId}
          src={image}
          alt="Photo projetée"
          className="absolute inset-0 w-full h-full object-contain animate-[apparition_.5s_ease-out]"
          draggable={false}
        />
      ) : (
        !chargement && (
          // Écran d'attente
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,_#1e1b4b_0%,_#020617_70%)]">
            <p className="text-[18vmin] font-light tracking-tight leading-none text-white/90 tabular-nums">
              {maintenant.toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="mt-4 text-[3vmin] text-white/50 first-letter:uppercase">
              {maintenant.toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <p className="mt-[8vmin] inline-flex items-center gap-3 text-[2.2vmin] text-white/30">
              <Camera className="w-[2.6vmin] h-[2.6vmin]" />
              En attente d’une photo…
            </p>
          </div>
        )
      )}

      {/* Chargement de l'image en grand */}
      {photoId && !image && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-white/15 border-t-white/70 animate-spin" />
        </div>
      )}

      {/* Boutons (se cachent tout seuls) */}
      <div
        className={`absolute top-4 left-4 flex gap-2 transition-opacity duration-500 ${
          controlesVisibles ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <Link to="/maxence/projection" className={bouton} title="Retour">
          <ArrowLeft size={20} />
        </Link>
        <Link to="/maxence/projection/galerie" className={bouton} title="Galerie">
          <Images size={20} />
        </Link>
        <button type="button" onClick={basculerPleinEcran} className={bouton} title="Plein écran">
          {pleinEcran ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
        {photoId && image && (
          <>
            <button
              type="button"
              onClick={() => pivoter(-1)}
              disabled={Boolean(rotation)}
              className={`${bouton} disabled:opacity-60`}
              title="Pivoter vers la gauche"
              aria-label="Pivoter vers la gauche"
            >
              {rotation === 'gauche' ? <Loader2 size={20} className="animate-spin" /> : <RotateCcw size={20} />}
            </button>
            <button
              type="button"
              onClick={() => pivoter(1)}
              disabled={Boolean(rotation)}
              className={`${bouton} disabled:opacity-60`}
              title="Pivoter vers la droite"
              aria-label="Pivoter vers la droite"
            >
              {rotation === 'droite' ? <Loader2 size={20} className="animate-spin" /> : <RotateCw size={20} />}
            </button>
          </>
        )}
      </div>

      {photoId && (
        <button
          type="button"
          onClick={() => masquer()}
          className={`absolute top-4 right-4 w-14 h-14 rounded-full bg-black/60 backdrop-blur border border-white/20 text-white flex items-center justify-center hover:bg-rose-600 transition-all duration-500 ${
            controlesVisibles ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          title="Fermer la photo"
          aria-label="Fermer la photo"
        >
          <X size={28} />
        </button>
      )}
    </div>
  )
}
