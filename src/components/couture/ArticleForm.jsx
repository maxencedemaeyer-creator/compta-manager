import { useEffect, useRef, useState } from 'react'
import { Camera, ChevronLeft, ChevronRight, Eye, EyeOff, ImagePlus, Loader2, Star, Trash2, X } from 'lucide-react'
import Feuille from './Feuille.jsx'
import { boutonBlanc, boutonRose, champCouture } from './Vichy.jsx'
import { MAX_PHOTOS, enregistrerArticle, lirePhotos, supprimerArticle } from '../../hooks/useCouture.js'

// =============================================================
//  Ajout / modification d'une création par Julie :
//  photos prises directement (ou choisies), nom, infos, prix.
//  La première photo est la photo de couverture de la galerie.
// =============================================================
export default function ArticleForm({ open, onClose, article = null }) {
  const camera = useRef(null)
  const galerie = useRef(null)
  const [photos, setPhotos] = useState([]) // [{ cle, id?, fichier?, src }]
  const [chargementPhotos, setChargementPhotos] = useState(false)
  const [nom, setNom] = useState('')
  const [description, setDescription] = useState('')
  const [prix, setPrix] = useState('')
  const [visible, setVisible] = useState(true)
  const [envoi, setEnvoi] = useState(false)
  const [confirmeSuppr, setConfirmeSuppr] = useState(false)
  const [erreur, setErreur] = useState('')

  // Remplissage du formulaire à l'ouverture
  useEffect(() => {
    if (!open) return
    setNom(article?.nom || '')
    setDescription(article?.description || '')
    setPrix(article?.prix || '')
    setVisible(article ? article.visible !== false : true)
    setErreur('')
    setConfirmeSuppr(false)
    setPhotos([])
    if (article?.photoIds?.length) {
      setChargementPhotos(true)
      lirePhotos(article.photoIds)
        .then((liste) => setPhotos(liste.map((p) => ({ cle: p.id, id: p.id, src: p.src }))))
        .catch(() => setErreur('Impossible de charger les photos.'))
        .finally(() => setChargementPhotos(false))
    }
  }, [open, article])

  // Libère les aperçus des nouvelles photos
  useEffect(() => {
    return () => photos.forEach((p) => p.fichier && URL.revokeObjectURL(p.src))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function ajouter(fichiers) {
    const liste = Array.from(fichiers || []).filter((f) => f.type.startsWith('image/') || !f.type)
    if (!liste.length) return
    setPhotos((prev) => {
      const place = MAX_PHOTOS - prev.length
      if (liste.length > place) setErreur(`Maximum ${MAX_PHOTOS} photos par création.`)
      return [
        ...prev,
        ...liste.slice(0, Math.max(0, place)).map((f) => ({
          cle: `${f.name}-${f.size}-${Math.random()}`,
          fichier: f,
          src: URL.createObjectURL(f),
        })),
      ]
    })
  }

  function deplacer(i, sens) {
    setPhotos((prev) => {
      const j = i + sens
      if (j < 0 || j >= prev.length) return prev
      const copie = [...prev]
      ;[copie[i], copie[j]] = [copie[j], copie[i]]
      return copie
    })
  }

  function mettreEnCouverture(i) {
    setPhotos((prev) => [prev[i], ...prev.filter((_, k) => k !== i)])
  }

  function retirer(i) {
    setPhotos((prev) => {
      const p = prev[i]
      if (p.fichier) URL.revokeObjectURL(p.src)
      return prev.filter((_, k) => k !== i)
    })
  }

  async function enregistrer(e) {
    e.preventDefault()
    if (!photos.length) return setErreur('Ajoute au moins une photo.')
    if (!nom.trim()) return setErreur('Donne un nom à ta création.')
    setEnvoi(true)
    setErreur('')
    try {
      await enregistrerArticle({ id: article?.id, nom, description, prix, visible, photos, avant: article })
      onClose()
    } catch (err) {
      console.error(err)
      setErreur(err.message || "L'enregistrement a échoué.")
    } finally {
      setEnvoi(false)
    }
  }

  async function supprimer() {
    setEnvoi(true)
    try {
      await supprimerArticle(article)
      onClose()
    } catch (err) {
      setErreur(err.message || 'La suppression a échoué.')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <Feuille open={open} onClose={() => !envoi && onClose()} titre={article ? 'Modifier la création' : 'Nouvelle création'} large>
      <form onSubmit={enregistrer}>
        {/* Photos */}
        <input
          ref={camera}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            ajouter(e.target.files)
            e.target.value = ''
          }}
        />
        <input
          ref={galerie}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            ajouter(e.target.files)
            e.target.value = ''
          }}
        />

        {photos.length === 0 && !chargementPhotos ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => camera.current?.click()}
              className="vichy rounded-3xl p-1.5 shadow-sm active:scale-[0.98] transition"
            >
              <span className="couture-piqure flex flex-col items-center justify-center gap-2 rounded-[1.25rem] bg-white/85 py-8">
                <span className="w-12 h-12 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-md shadow-pink-500/30">
                  <Camera size={22} />
                </span>
                <span className="text-sm font-semibold text-pink-900">Prendre une photo</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => galerie.current?.click()}
              className="rounded-3xl p-1.5 bg-white ring-1 ring-pink-100 shadow-sm active:scale-[0.98] transition"
            >
              <span className="couture-piqure flex flex-col items-center justify-center gap-2 rounded-[1.25rem] py-8">
                <span className="w-12 h-12 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center">
                  <ImagePlus size={22} />
                </span>
                <span className="text-sm font-semibold text-pink-900">Choisir des photos</span>
              </span>
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              {chargementPhotos && (
                <div className="aspect-square rounded-2xl bg-pink-50 flex items-center justify-center text-pink-300">
                  <Loader2 className="animate-spin" size={20} />
                </div>
              )}
              {photos.map((p, i) => (
                <div key={p.cle} className="relative aspect-square rounded-2xl overflow-hidden bg-pink-50 ring-1 ring-pink-100">
                  <img src={p.src} alt="" className="w-full h-full object-cover" />
                  {i === 0 ? (
                    <span className="absolute top-1.5 left-1.5 rounded-full bg-pink-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                      Couverture
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => mettreEnCouverture(i)}
                      className="absolute top-1.5 left-1.5 w-7 h-7 rounded-full bg-white/90 text-pink-500 flex items-center justify-center shadow"
                      aria-label="Mettre en couverture"
                      title="Mettre en couverture"
                    >
                      <Star size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => retirer(i)}
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/45 text-white flex items-center justify-center"
                    aria-label="Retirer la photo"
                  >
                    <X size={14} />
                  </button>
                  {photos.length > 1 && (
                    <div className="absolute bottom-1.5 inset-x-1.5 flex justify-between">
                      <button
                        type="button"
                        onClick={() => deplacer(i, -1)}
                        disabled={i === 0}
                        className="w-7 h-7 rounded-full bg-white/90 text-pink-700 flex items-center justify-center shadow disabled:opacity-0"
                        aria-label="Avancer"
                      >
                        <ChevronLeft size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deplacer(i, 1)}
                        disabled={i === photos.length - 1}
                        className="w-7 h-7 rounded-full bg-white/90 text-pink-700 flex items-center justify-center shadow disabled:opacity-0"
                        aria-label="Reculer"
                      >
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {photos.length < MAX_PHOTOS && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button type="button" onClick={() => camera.current?.click()} className={boutonBlanc}>
                  <Camera size={16} /> Photo
                </button>
                <button type="button" onClick={() => galerie.current?.click()} className={boutonBlanc}>
                  <ImagePlus size={16} /> Galerie
                </button>
              </div>
            )}
          </>
        )}

        {/* Infos */}
        <label className="block mt-5 mb-4">
          <span className="block text-sm font-semibold text-pink-950 mb-1.5">Nom de la création</span>
          <input
            className={champCouture}
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Ex. Trousse Vichy fleurie"
            maxLength={80}
          />
        </label>
        <label className="block mb-4">
          <span className="block text-sm font-semibold text-pink-950 mb-1.5">
            Infos <span className="font-normal text-pink-900/45">(tissu, tailles, couleurs possibles…)</span>
          </span>
          <textarea
            className={`${champCouture} min-h-[100px] resize-y`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Coton doublé, fermeture éclair. Existe en rose, bleu ou vert."
            maxLength={1500}
          />
        </label>
        <label className="block mb-4">
          <span className="block text-sm font-semibold text-pink-950 mb-1.5">
            Prix <span className="font-normal text-pink-900/45">(facultatif — seulement pour toi, jamais affiché dans la galerie)</span>
          </span>
          <input
            className={champCouture}
            value={prix}
            onChange={(e) => setPrix(e.target.value)}
            placeholder="Ex. 15 €"
            maxLength={40}
          />
        </label>

        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="w-full flex items-center gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-pink-100 text-left mb-5"
        >
          <span
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              visible ? 'bg-pink-500 text-white' : 'bg-slate-100 text-slate-400'
            }`}
          >
            {visible ? <Eye size={18} /> : <EyeOff size={18} />}
          </span>
          <span className="flex-1">
            <span className="block text-sm font-semibold text-pink-950">
              {visible ? 'Visible dans la galerie' : 'Cachée de la galerie'}
            </span>
            <span className="block text-xs text-pink-900/50">
              {visible ? 'Tes copines la voient avec le lien' : 'Seulement visible pour toi'}
            </span>
          </span>
          <span className={`w-11 h-6 rounded-full p-0.5 transition ${visible ? 'bg-pink-500' : 'bg-slate-200'}`}>
            <span className={`block w-5 h-5 rounded-full bg-white shadow transition ${visible ? 'translate-x-5' : ''}`} />
          </span>
        </button>

        {erreur && <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{erreur}</p>}

        <button type="submit" disabled={envoi || chargementPhotos} className={`${boutonRose} w-full py-3.5`}>
          {envoi && <Loader2 size={18} className="animate-spin" />}
          {envoi ? 'Enregistrement des photos…' : article ? 'Enregistrer' : 'Ajouter à ma galerie'}
        </button>

        {article &&
          (confirmeSuppr ? (
            <div className="mt-3 rounded-2xl bg-red-50 p-3 text-sm text-red-700">
              <p>Supprimer « {article.nom} » et ses photos ? Les commandes déjà reçues sont gardées.</p>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => setConfirmeSuppr(false)} className={`${boutonBlanc} flex-1 py-2`}>
                  Non
                </button>
                <button
                  type="button"
                  onClick={supprimer}
                  disabled={envoi}
                  className="flex-1 rounded-2xl bg-red-500 px-4 py-2 font-semibold text-white"
                >
                  Oui, supprimer
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmeSuppr(true)}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50"
            >
              <Trash2 size={15} /> Supprimer cette création
            </button>
          ))}
      </form>
    </Feuille>
  )
}
