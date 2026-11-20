import { useEffect, useRef, useState } from 'react'
import { Camera, Minus, Plus, Search, Star, Trash2, X } from 'lucide-react'
import Feuille, { boutonPrincipal, boutonSecondaire, champClass } from './Feuille.jsx'
import { chercherPlantes, trouverPlante } from '../../data/jardin/plantes.js'
import { enregistrerPlante, lirePhotosPlante, MAX_PHOTOS_PLANTE, supprimerPlante } from '../../hooks/useJardin.js'
import { preparerPhotoCouture } from '../../utils/imageCouture.js'

function Choix({ options, valeur, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`rounded-2xl px-3 py-3 text-sm font-semibold transition-colors ${
            valeur === o.id ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
          }`}
        >
          {o.nom}
        </button>
      ))}
    </div>
  )
}

// Ajout / modification d'une plante du jardin
export default function PlanteForm({ jardinId, plante, onClose, onSupprime }) {
  const [planteId, setPlanteId] = useState(plante?.planteId || null)
  const [nomLibre, setNomLibre] = useState(plante?.nomLibre || '')
  const [recherche, setRecherche] = useState('')
  const [libre, setLibre] = useState(!!plante && !plante.planteId)
  const [quantite, setQuantite] = useState(plante?.quantite || 1)
  const [lieu, setLieu] = useState(plante?.lieu || 'exterieur')
  const [culture, setCulture] = useState(plante?.culture || 'terre')
  const [notes, setNotes] = useState(plante?.notes || '')
  const [photos, setPhotos] = useState([])
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [confirmer, setConfirmer] = useState(false)
  const inputPhoto = useRef(null)

  const base = trouverPlante(planteId)
  const suggestions = chercherPlantes(recherche)
  const choisie = !!base || (libre && nomLibre.trim())

  // Photos déjà enregistrées (modification)
  useEffect(() => {
    if (!plante?.photoIds?.length) return
    let annule = false
    lirePhotosPlante(jardinId, plante.photoIds)
      .then((liste) => !annule && setPhotos(liste.map((p) => ({ id: p.id, src: p.src }))))
      .catch((e) => console.error(e))
    return () => {
      annule = true
    }
  }, [jardinId, plante])

  function ajouterPhotos(e) {
    const fichiers = Array.from(e.target.files || [])
    e.target.value = ''
    setPhotos((actuelles) => {
      const place = MAX_PHOTOS_PLANTE - actuelles.length
      const nouvelles = fichiers.slice(0, Math.max(0, place)).map((fichier) => {
        const prep = preparerPhotoCouture(fichier)
        prep.catch(() => {})
        return { fichier, prep, src: URL.createObjectURL(fichier), cle: Math.random().toString(36).slice(2) }
      })
      return [...actuelles, ...nouvelles]
    })
  }

  const retirer = (i) => setPhotos((l) => l.filter((_, j) => j !== i))
  const couverture = (i) => setPhotos((l) => [l[i], ...l.filter((_, j) => j !== i)])

  async function enregistrer(e) {
    e.preventDefault()
    if (!choisie) return
    setEnvoi(true)
    setErreur('')
    try {
      await enregistrerPlante({
        jardinId,
        id: plante?.id,
        planteId: libre ? null : planteId,
        nomLibre: libre ? nomLibre : '',
        quantite,
        lieu,
        culture,
        notes,
        photos,
        avant: plante,
      })
      onClose()
    } catch (err) {
      setErreur(err.message || "Impossible d'enregistrer.")
      setEnvoi(false)
    }
  }

  async function supprimer() {
    setEnvoi(true)
    try {
      await supprimerPlante(jardinId, plante)
      onSupprime?.()
      onClose()
    } catch (err) {
      setErreur(err.message || 'Impossible de supprimer.')
      setEnvoi(false)
    }
  }

  return (
    <Feuille open onClose={onClose} titre={plante ? 'Modifier la plante' : 'Ajouter une plante'} large>
      {confirmer ? (
        <div className="space-y-4">
          <p className="text-emerald-950">
            Retirer cette plante du jardin ? Ses photos seront aussi effacées.
          </p>
          {erreur && <p className="text-sm text-rose-600">{erreur}</p>}
          <div className="flex gap-3">
            <button className={`${boutonSecondaire} flex-1`} onClick={() => setConfirmer(false)} disabled={envoi}>
              Annuler
            </button>
            <button
              className="flex-1 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-3.5 disabled:opacity-50"
              onClick={supprimer}
              disabled={envoi}
            >
              Retirer
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={enregistrer} className="space-y-5">
          {/* Quelle plante ? */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-emerald-900">Quelle plante ?</span>
            {base && !libre ? (
              <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3">
                <span className="text-2xl">{base.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-emerald-950">{base.nom}</p>
                  <p className="text-xs italic text-emerald-800/60 truncate">{base.latin}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPlanteId(null)
                    setRecherche('')
                  }}
                  className="text-sm font-medium text-emerald-700"
                >
                  Changer
                </button>
              </div>
            ) : libre ? (
              <div className="space-y-2">
                <input
                  className={champClass}
                  value={nomLibre}
                  onChange={(e) => setNomLibre(e.target.value)}
                  placeholder="Nom de la plante"
                  autoFocus
                />
                <button type="button" onClick={() => setLibre(false)} className="text-sm font-medium text-emerald-700">
                  ← Chercher dans la base de plantes
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700/50" />
                  <input
                    className={`${champClass} pl-11`}
                    value={recherche}
                    onChange={(e) => setRecherche(e.target.value)}
                    placeholder="Tape un nom : char…, lav…, rosier…"
                    autoFocus={!plante}
                  />
                </div>
                {suggestions.length > 0 && (
                  <ul className="rounded-2xl border border-emerald-100 divide-y divide-emerald-50 overflow-hidden">
                    {suggestions.map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => setPlanteId(s.id)}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-emerald-50"
                        >
                          <span className="text-xl">{s.emoji}</span>
                          <span className="font-medium text-emerald-950">{s.nom}</span>
                          <span className="ml-auto text-xs italic text-emerald-800/50 truncate">{s.latin}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {recherche.trim() && suggestions.length === 0 && (
                  <p className="text-sm text-emerald-900/60">Aucune plante trouvée dans la base.</p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setLibre(true)
                    setNomLibre(recherche)
                  }}
                  className="text-sm font-medium text-emerald-700"
                >
                  Ma plante n'est pas dans la liste → l'ajouter librement
                </button>
              </div>
            )}
          </div>

          {/* Quantité */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-emerald-900">Quantité</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantite((q) => Math.max(1, q - 1))}
                className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center"
                aria-label="Moins"
              >
                <Minus size={20} />
              </button>
              <input
                type="number"
                min="1"
                inputMode="numeric"
                value={quantite}
                onChange={(e) => setQuantite(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="h-12 w-20 rounded-2xl border border-emerald-900/15 text-center text-lg font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => setQuantite((q) => q + 1)}
                className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center"
                aria-label="Plus"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium text-emerald-900">Où ?</span>
            <Choix
              valeur={lieu}
              onChange={setLieu}
              options={[
                { id: 'exterieur', nom: '🌤️ Extérieur' },
                { id: 'interieur', nom: '🏠 Intérieur' },
              ]}
            />
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium text-emerald-900">Comment ?</span>
            <Choix
              valeur={culture}
              onChange={setCulture}
              options={[
                { id: 'terre', nom: '🌍 Pleine terre' },
                { id: 'pot', nom: '🪴 En pot' },
              ]}
            />
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-emerald-900">
              Photos <span className="text-emerald-900/40 font-normal">({photos.length}/{MAX_PHOTOS_PLANTE})</span>
            </span>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
              {photos.map((p, i) => (
                <div key={p.id || p.cle} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-emerald-50">
                  <img src={p.src} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => retirer(i)}
                    className="absolute right-1 top-1 h-6 w-6 rounded-full bg-black/55 text-white flex items-center justify-center"
                    aria-label="Retirer la photo"
                  >
                    <X size={14} />
                  </button>
                  {i === 0 ? (
                    <span className="absolute bottom-1 left-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      Couverture
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => couverture(i)}
                      className="absolute bottom-1 left-1 h-6 w-6 rounded-full bg-black/55 text-white flex items-center justify-center"
                      aria-label="Mettre en couverture"
                    >
                      <Star size={13} />
                    </button>
                  )}
                </div>
              ))}
              {photos.length < MAX_PHOTOS_PLANTE && (
                <button
                  type="button"
                  onClick={() => inputPhoto.current?.click()}
                  className="h-24 w-24 shrink-0 rounded-2xl border-2 border-dashed border-emerald-300 text-emerald-600 flex flex-col items-center justify-center gap-1 text-xs font-semibold"
                >
                  <Camera size={22} />
                  Photo
                </button>
              )}
            </div>
            <input ref={inputPhoto} type="file" accept="image/*" multiple className="hidden" onChange={ajouterPhotos} />
          </div>

          <textarea
            className={champClass}
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Note (facultatif) : côté nord, planté en 2024…"
          />

          {erreur && <p className="text-sm text-rose-600">{erreur}</p>}

          <button type="submit" className={`${boutonPrincipal} w-full`} disabled={envoi || !choisie}>
            {envoi ? 'Enregistrement…' : plante ? 'Enregistrer' : 'Ajouter au jardin'}
          </button>

          {plante && (
            <button
              type="button"
              onClick={() => setConfirmer(true)}
              className="flex w-full items-center justify-center gap-2 py-2 text-sm font-medium text-rose-600"
            >
              <Trash2 size={16} />
              Retirer cette plante
            </button>
          )}
        </form>
      )}
    </Feuille>
  )
}
