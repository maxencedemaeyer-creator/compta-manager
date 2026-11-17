import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, CheckSquare, Images, Loader2, MonitorPlay, RotateCcw, RotateCw, Square, Trash2, X } from 'lucide-react'
import { lireImage, pivoterPhoto, projeter, useGalerieProjection } from '../../hooks/useProjection.js'

// =============================================================
//  Projection — galerie des photos envoyées
//  Clic sur une photo : aperçu, reprojeter ou supprimer.
//  Mode « Sélectionner » : cocher plusieurs photos (ou tout) et supprimer.
// =============================================================
function formatDate(ts) {
  if (!ts?.toDate) return '…'
  return ts.toDate().toLocaleString('fr-BE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function formatTaille(caracteres) {
  const mo = (caracteres * 0.75) / 1024 / 1024 // base64 → octets
  return mo < 1 ? `${Math.round(mo * 1024)} Ko` : `${mo.toFixed(1)} Mo`
}

// Regroupe les photos par jour
function parJour(photos) {
  const groupes = []
  photos.forEach((p) => {
    const d = p.creeLe?.toDate ? p.creeLe.toDate() : new Date()
    const cle = d.toDateString()
    let g = groupes.find((x) => x.cle === cle)
    if (!g) {
      g = {
        cle,
        titre: d.toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
        photos: [],
      }
      groupes.push(g)
    }
    g.photos.push(p)
  })
  return groupes
}

function Apercu({ photo, projetee, onFermer, onSupprimer }) {
  const [image, setImage] = useState(null)
  const [action, setAction] = useState('')

  useEffect(() => {
    let annule = false
    lireImage(photo.id).then((img) => !annule && setImage(img)).catch(() => {})
    const touche = (e) => e.key === 'Escape' && onFermer()
    window.addEventListener('keydown', touche)
    return () => {
      annule = true
      window.removeEventListener('keydown', touche)
    }
  }, [photo.id, onFermer])

  async function pivoter(sens) {
    if (action) return
    setAction(sens > 0 ? 'droite' : 'gauche')
    try {
      setImage(await pivoterPhoto(photo.id, sens))
    } catch (err) {
      console.error(err)
      window.alert(err.message || 'La rotation a échoué.')
    } finally {
      setAction('')
    }
  }

  async function lancer() {
    setAction('projection')
    try {
      await projeter(photo.id)
    } finally {
      setAction('')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur flex flex-col" onClick={onFermer}>
      <div className="shrink-0 flex items-center justify-between p-4" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm text-white/60">{formatDate(photo.creeLe)}</p>
        <button onClick={onFermer} className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center" aria-label="Fermer">
          <X size={22} />
        </button>
      </div>
      {/* La photo occupe exactement l'espace libre : les boutons restent toujours visibles */}
      <div className="relative flex-1 min-h-0 mx-4">
        <img
          src={image || photo.miniature}
          alt=""
          className={`absolute inset-0 w-full h-full object-contain ${image ? '' : 'blur-sm'}`}
        />
      </div>
      <div className="shrink-0 p-4 flex flex-wrap justify-center gap-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-2">
          <button
            onClick={() => pivoter(-1)}
            disabled={!image || Boolean(action)}
            className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center disabled:opacity-40 transition-colors"
            title="Pivoter vers la gauche"
            aria-label="Pivoter vers la gauche"
          >
            {action === 'gauche' ? <Loader2 size={20} className="animate-spin" /> : <RotateCcw size={20} />}
          </button>
          <button
            onClick={() => pivoter(1)}
            disabled={!image || Boolean(action)}
            className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center disabled:opacity-40 transition-colors"
            title="Pivoter vers la droite"
            aria-label="Pivoter vers la droite"
          >
            {action === 'droite' ? <Loader2 size={20} className="animate-spin" /> : <RotateCw size={20} />}
          </button>
        </div>
        <button
          onClick={lancer}
          disabled={projetee || Boolean(action)}
          className="h-12 px-5 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-600 font-medium inline-flex items-center gap-2 disabled:opacity-60"
        >
          {action === 'projection' ? <Loader2 size={18} className="animate-spin" /> : projetee ? <Check size={18} /> : <MonitorPlay size={18} />}
          {projetee ? 'À l’écran' : 'Projeter'}
        </button>
        <button
          onClick={() => onSupprimer(photo.id)}
          className="h-12 px-5 rounded-2xl bg-white/10 hover:bg-rose-600 font-medium inline-flex items-center gap-2 transition-colors"
        >
          <Trash2 size={18} />
          Supprimer
        </button>
      </div>
    </div>
  )
}

export default function ProjectionGalerieView() {
  const { photos, loading, photoProjetee, supprimer, tailleTotale } = useGalerieProjection()
  const [modeSelection, setModeSelection] = useState(false)
  const [selection, setSelection] = useState(() => new Set())
  const [ouverte, setOuverte] = useState(null)
  const [suppression, setSuppression] = useState(false)

  const groupes = useMemo(() => parJour(photos), [photos])
  const toutSelectionne = photos.length > 0 && selection.size === photos.length

  function basculer(id) {
    setSelection((s) => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  function basculerJour(groupe) {
    const ids = groupe.photos.map((p) => p.id)
    const tous = ids.every((id) => selection.has(id))
    setSelection((s) => {
      const n = new Set(s)
      ids.forEach((id) => (tous ? n.delete(id) : n.add(id)))
      return n
    })
  }

  function quitterSelection() {
    setModeSelection(false)
    setSelection(new Set())
  }

  async function supprimerIds(ids) {
    const texte = ids.length === 1 ? 'Supprimer cette photo ?' : `Supprimer ces ${ids.length} photos ?`
    if (!window.confirm(`${texte}\nCette action est définitive.`)) return
    setSuppression(true)
    try {
      await supprimer(ids)
      setSelection(new Set())
      setOuverte(null)
      if (ids.length === photos.length) setModeSelection(false)
    } catch (err) {
      console.error(err)
      window.alert(err.message || 'La suppression a échoué.')
    } finally {
      setSuppression(false)
    }
  }

  const photoOuverte = photos.find((p) => p.id === ouverte)

  return (
    <div className="min-h-dvh bg-slate-950 text-white">
      {/* Barre du haut (fixe) */}
      <div className="sticky top-0 z-30 bg-slate-950/85 backdrop-blur border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3 flex items-center gap-3">
          {modeSelection ? (
            <>
              <button onClick={quitterSelection} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center" aria-label="Annuler">
                <X size={20} />
              </button>
              <p className="font-medium flex-1">
                {selection.size} sélectionnée{selection.size > 1 ? 's' : ''}
              </p>
              <button
                onClick={() => setSelection(toutSelectionne ? new Set() : new Set(photos.map((p) => p.id)))}
                className="h-10 px-3 rounded-xl hover:bg-white/10 text-sm inline-flex items-center gap-2"
              >
                {toutSelectionne ? <CheckSquare size={18} /> : <Square size={18} />}
                <span className="hidden sm:inline">Tout sélectionner</span>
                <span className="sm:hidden">Tout</span>
              </button>
              <button
                onClick={() => supprimerIds([...selection])}
                disabled={selection.size === 0 || suppression}
                className="h-10 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-sm font-medium inline-flex items-center gap-2 disabled:opacity-40"
              >
                {suppression ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Supprimer
              </button>
            </>
          ) : (
            <>
              <Link to="/maxence/projection" className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white">
                <ArrowLeft size={16} />
                Projection
              </Link>
              <div className="flex-1" />
              <Link to="/maxence/projection/ecran" className="h-10 px-3 rounded-xl hover:bg-white/10 text-sm inline-flex items-center gap-2 text-white/70">
                <MonitorPlay size={18} />
                <span className="hidden sm:inline">Écran</span>
              </Link>
              {photos.length > 0 && (
                <button onClick={() => setModeSelection(true)} className="h-10 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-medium">
                  Sélectionner
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Galerie</h1>
            {!loading && (
              <p className="text-sm text-white/50 mt-1">
                {photos.length} photo{photos.length > 1 ? 's' : ''} · {formatTaille(tailleTotale)} utilisés
              </p>
            )}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-white/40">Chargement…</p>
        ) : photos.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 p-10 text-center">
            <Images size={36} className="mx-auto text-white/30" />
            <p className="mt-3 text-white/60">Aucune photo pour l’instant.</p>
            <Link to="/maxence/projection/photo" className="inline-block mt-4 text-sm text-amber-300 hover:text-amber-200">
              Prendre une photo →
            </Link>
          </div>
        ) : (
          groupes.map((g) => {
            const jourComplet = g.photos.every((p) => selection.has(p.id))
            return (
              <section key={g.cle} className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-white/40 first-letter:uppercase">{g.titre}</h2>
                  {modeSelection && (
                    <button onClick={() => basculerJour(g)} className="text-xs text-white/50 hover:text-white">
                      {jourComplet ? 'Désélectionner le jour' : 'Sélectionner le jour'}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
                  {g.photos.map((p) => {
                    const choisie = selection.has(p.id)
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => (modeSelection ? basculer(p.id) : setOuverte(p.id))}
                        className={`relative aspect-square rounded-xl overflow-hidden bg-white/5 group transition-all ${
                          choisie ? 'ring-4 ring-violet-500 scale-[0.96]' : 'hover:ring-2 hover:ring-white/30'
                        }`}
                      >
                        <img src={p.miniature} alt="" className="w-full h-full object-cover" loading="lazy" />
                        {photoProjetee === p.id && (
                          <span className="absolute bottom-1.5 left-1.5 text-[10px] font-semibold uppercase tracking-wide bg-violet-600 rounded-md px-1.5 py-0.5">
                            À l’écran
                          </span>
                        )}
                        {modeSelection && (
                          <span
                            className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              choisie ? 'bg-violet-500 border-violet-500' : 'bg-black/30 border-white/80'
                            }`}
                          >
                            {choisie && <Check size={14} strokeWidth={3} />}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </section>
            )
          })
        )}
      </div>

      {photoOuverte && (
        <Apercu
          photo={photoOuverte}
          projetee={photoProjetee === photoOuverte.id}
          onFermer={() => setOuverte(null)}
          onSupprimer={(id) => supprimerIds([id])}
        />
      )}
    </div>
  )
}
