import { useEffect, useRef, useState } from 'react'
import { Camera, Eye, EyeOff, ImagePlus, Loader2, Star, Trash2, X } from 'lucide-react'
import Feuille from './Feuille.jsx'
import { boutonBlanc, boutonRose, champCouture } from './Vichy.jsx'
import { MAX_PHOTOS, enregistrerArticle, lirePhotos, supprimerArticle } from '../../hooks/useCouture.js'
import { preparerPhotoCouture } from '../../utils/imageCouture.js'

// Nouvelle photo : aperçu immédiat + réduction lancée tout de suite
// (l'enregistrement est ensuite quasi instantané)
function nouvellePhoto(fichier) {
  const prep = preparerPhotoCouture(fichier)
  prep.catch(() => {}) // l'erreur éventuelle est affichée à l'enregistrement
  return { cle: `${fichier.name}-${fichier.size}-${Math.random()}`, fichier, prep, src: URL.createObjectURL(fichier) }
}

// =============================================================
//  Ajout / modification d'une création par Julie.
//  - fichiersInitiaux : photos déjà prises (bouton appareil photo de l'atelier)
//  - La photo avec l'étoile est la couverture de la galerie.
// =============================================================
export default function ArticleForm({ open, onClose, article = null, fichiersInitiaux = null }) {
  const camera = useRef(null)
  const galerie = useRef(null)
  const [photos, setPhotos] = useState([]) // [{ cle, id?, fichier?, prep?, src }]
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
    setPhotos(fichiersInitiaux ? Array.from(fichiersInitiaux).slice(0, MAX_PHOTOS).map(nouvellePhoto) : [])
    if (article?.photoIds?.length) {
      setChargementPhotos(true)
      lirePhotos(article.photoIds)
        .then((liste) => setPhotos(liste.map((p) => ({ cle: p.id, id: p.id, src: p.src }))))
        .catch(() => setErreur('Impossible de charger les photos.'))
        .finally(() => setChargementPhotos(false))
    }
  }, [open, article, fichiersInitiaux])

  function ajouter(fichiers) {
    const liste = Array.from(fichiers || []).filter((f) => f.type.startsWith('image/') || !f.type)
    if (!liste.length) return
    setPhotos((prev) => {
      const place = Math.max(0, MAX_PHOTOS - prev.length)
      if (liste.length > place) setErreur(`Maximum ${MAX_PHOTOS} photos par création.`)
      return [...prev, ...liste.slice(0, place).map(nouvellePhoto)]
    })
  }

  function mettreEnCouverture(i) {
    setPhotos((prev) => [prev[i], ...prev.filter((_, k) => k !== i)])
  }

  function retirer(i) {
    setPhotos((prev) => {
      if (prev[i].fichier) URL.revokeObjectURL(prev[i].src)
      return prev.filter((_, k) => k !== i)
    })
  }

  function fermer() {
    if (envoi) return
    photos.forEach((p) => p.fichier && URL.revokeObjectURL(p.src))
    onClose()
  }

  async function enregistrer(e) {
    e.preventDefault()
    if (!photos.length) return setErreur('Ajoute au moins une photo.')
    if (!nom.trim()) return setErreur('Donne un nom à ta création.')
    document.activeElement?.blur() // ferme le clavier de l'iPhone
    setEnvoi(true)
    setErreur('')
    try {
      await enregistrerArticle({ id: article?.id, nom, description, prix, visible, photos, avant: article })
      photos.forEach((p) => p.fichier && URL.revokeObjectURL(p.src))
      if (navigator.vibrate) navigator.vibrate(30)
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

  const surChoix = (e) => {
    ajouter(e.target.files)
    e.target.value = ''
  }

  return (
    <Feuille open={open} onClose={fermer} titre={article ? 'Modifier' : 'Nouvelle création'} large>
      <form onSubmit={enregistrer}>
        <input ref={camera} type="file" accept="image/*" capture="environment" className="hidden" onChange={surChoix} />
        <input ref={galerie} type="file" accept="image/*" multiple className="hidden" onChange={surChoix} />

        {/* Photos : défilement horizontal, pratique au pouce */}
        <div className="-mx-5 sm:-mx-7 px-5 sm:px-7 flex gap-2.5 overflow-x-auto no-scrollbar snap-x pb-1">
          {chargementPhotos && (
            <div className="w-28 h-36 shrink-0 rounded-2xl bg-white ring-1 ring-pink-100 flex items-center justify-center text-pink-300">
              <Loader2 className="animate-spin" size={20} />
            </div>
          )}
          {photos.map((p, i) => (
            <div key={p.cle} className="relative w-28 h-36 shrink-0 snap-start rounded-2xl overflow-hidden bg-pink-50 ring-1 ring-pink-100">
              <img src={p.src} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => i > 0 && mettreEnCouverture(i)}
                className={`absolute bottom-1.5 left-1.5 h-8 rounded-full flex items-center justify-center gap-1 shadow ${
                  i === 0 ? 'bg-pink-500 text-white px-2.5 text-[11px] font-bold' : 'w-8 bg-white/90 text-pink-400'
                }`}
                aria-label={i === 0 ? 'Photo de couverture' : 'Mettre en couverture'}
              >
                <Star size={14} className={i === 0 ? 'fill-white' : ''} />
                {i === 0 && 'Couverture'}
              </button>
              <button
                type="button"
                onClick={() => retirer(i)}
                className="absolute top-1.5 right-1.5 w-8 h-8 rounded-full bg-black/45 text-white flex items-center justify-center"
                aria-label="Retirer la photo"
              >
                <X size={15} />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <div className={`flex gap-2.5 shrink-0 ${photos.length ? 'flex-col' : ''}`}>
              <button
                type="button"
                onClick={() => camera.current?.click()}
                className={`${photos.length ? 'w-28 h-[4.25rem]' : 'w-36 h-36'} rounded-2xl bg-pink-500 text-white flex flex-col items-center justify-center gap-1 shadow-md shadow-pink-500/25 active:scale-[0.97] transition`}
              >
                <Camera size={photos.length ? 20 : 28} />
                <span className="text-xs font-semibold">Prendre une photo</span>
              </button>
              <button
                type="button"
                onClick={() => galerie.current?.click()}
                className={`${photos.length ? 'w-28 h-[4.25rem]' : 'w-36 h-36'} rounded-2xl bg-white text-pink-600 ring-1 ring-pink-200 flex flex-col items-center justify-center gap-1 active:scale-[0.97] transition`}
              >
                <ImagePlus size={photos.length ? 20 : 28} />
                <span className="text-xs font-semibold">Mes photos</span>
              </button>
            </div>
          )}
        </div>

        {/* Infos */}
        <input
          className={`${champCouture} mt-4 font-semibold`}
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Nom de la création"
          autoCapitalize="sentences"
          enterKeyHint="next"
          maxLength={80}
          aria-label="Nom de la création"
        />
        <textarea
          className={`${champCouture} mt-2.5 min-h-[88px] resize-none`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Infos : tissu, tailles, couleurs possibles…"
          maxLength={1500}
          aria-label="Infos"
        />

        <div className="mt-2.5 flex items-center gap-2.5">
          <input
            className="w-28 rounded-2xl border border-pink-100 bg-white/80 px-3.5 py-2.5 text-sm text-pink-950 placeholder:text-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-300"
            value={prix}
            onChange={(e) => setPrix(e.target.value)}
            placeholder="Prix"
            maxLength={40}
            aria-label="Prix (seulement pour toi)"
          />
          <span className="text-[11px] leading-tight text-pink-900/40">
            Facultatif, seulement pour toi
            <br />
            (jamais affiché dans la galerie)
          </span>
        </div>

        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="mt-4 w-full flex items-center gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-pink-100 text-left"
        >
          {visible ? <Eye size={18} className="text-pink-500" /> : <EyeOff size={18} className="text-slate-400" />}
          <span className="flex-1 text-sm font-medium text-pink-950">
            {visible ? 'Visible dans ma galerie' : 'Cachée (seulement pour moi)'}
          </span>
          <span className={`w-11 h-6 rounded-full p-0.5 transition ${visible ? 'bg-pink-500' : 'bg-slate-200'}`}>
            <span className={`block w-5 h-5 rounded-full bg-white shadow transition ${visible ? 'translate-x-5' : ''}`} />
          </span>
        </button>

        {erreur && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{erreur}</p>}

        <button type="submit" disabled={envoi || chargementPhotos} className={`${boutonRose} w-full mt-5 py-4 text-base`}>
          {envoi && <Loader2 size={18} className="animate-spin" />}
          {envoi ? 'Enregistrement…' : article ? 'Enregistrer' : 'Ajouter à ma galerie'}
        </button>

        {article &&
          (confirmeSuppr ? (
            <div className="mt-3 rounded-2xl bg-red-50 p-3 text-sm text-red-700">
              <p>Supprimer « {article.nom} » ? Les commandes déjà reçues sont gardées.</p>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => setConfirmeSuppr(false)} className={`${boutonBlanc} flex-1 py-2.5`}>
                  Non
                </button>
                <button
                  type="button"
                  onClick={supprimer}
                  disabled={envoi}
                  className="flex-1 rounded-2xl bg-red-500 px-4 py-2.5 font-semibold text-white"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmeSuppr(true)}
              className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-red-400"
            >
              <Trash2 size={15} /> Supprimer cette création
            </button>
          ))}
      </form>
    </Feuille>
  )
}
