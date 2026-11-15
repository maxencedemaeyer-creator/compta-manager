import { useRef, useState } from 'react'
import { Camera, Crosshair, Loader2, MapPin, Star, Trash2, X } from 'lucide-react'
import { COULEURS_SEXE, initiales } from './ArbreSablier.jsx'
import { compresserPhoto } from '../../utils/image.js'
import { dates, freresEtSoeurs, nomComplet, parents, unions } from '../../utils/gedcom.js'

function Evenement({ titre, ev, symbole }) {
  if (!ev) return null
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-xl bg-white/[0.07] flex items-center justify-center text-sm text-white/70 shrink-0">
        {symbole}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-white/40">{titre}</p>
        <p className="text-sm text-white">{ev.date || 'Date inconnue'}</p>
        {ev.lieu && (
          <p className="text-xs text-white/50 flex items-center gap-1 mt-0.5">
            <MapPin size={11} className="shrink-0" />
            <span className="truncate">{ev.lieu}</span>
          </p>
        )}
      </div>
    </div>
  )
}

function Puce({ p, photoDe, onSelect, sousTitre }) {
  if (!p) return null
  const c = COULEURS_SEXE[p.sexe] || COULEURS_SEXE.U
  const photo = photoDe(p)
  return (
    <button
      type="button"
      onClick={() => onSelect(p.id)}
      className="flex items-center gap-2.5 w-full text-left rounded-xl px-2 py-1.5 hover:bg-white/[0.07] transition-colors"
    >
      <span
        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden border-2"
        style={{ borderColor: c.trait, background: c.fond, color: c.texte }}
      >
        {photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : initiales(p)}
      </span>
      <span className="min-w-0">
        <span className="block text-sm text-white truncate">{nomComplet(p)}</span>
        <span className="block text-xs text-white/40 truncate">{sousTitre || dates(p)}</span>
      </span>
    </button>
  )
}

function Bloc({ titre, children }) {
  return (
    <div className="mt-6">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/35 mb-2">{titre}</p>
      {children}
    </div>
  )
}

export default function FichePersonne({
  arbre,
  personneId,
  racineEnregistree,
  photoDe,
  aPhotoImportee,
  onSelect,
  onFermer,
  onCentrer,
  onDefinirRacine,
  onPhoto,
  onSupprimerPhoto,
}) {
  const inputRef = useRef(null)
  const [envoi, setEnvoi] = useState(false)
  const p = arbre.personnes[personneId]
  if (!p) return null

  const c = COULEURS_SEXE[p.sexe] || COULEURS_SEXE.U
  const photo = photoDe(p)
  const { pere, mere } = parents(arbre, p.id)
  const lesUnions = unions(arbre, p.id)
  const fratrie = freresEtSoeurs(arbre, p.id)
  const fichiersAttendus = p.fichiersPhotos.filter((f) => !/^https?:/i.test(f))

  async function choisirPhoto(file) {
    if (!file) return
    setEnvoi(true)
    try {
      const dataUrl = await compresserPhoto(file)
      await onPhoto(p.id, dataUrl)
    } catch (err) {
      alert(err.message)
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-slate-900/95 backdrop-blur-xl text-white">
      <div className="flex justify-end p-3 pb-0">
        <button
          type="button"
          onClick={onFermer}
          className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10"
          aria-label="Fermer"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-8">
        {/* En-tête */}
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div
              className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center text-3xl font-bold border-4"
              style={{ borderColor: c.trait, background: c.fond, color: c.texte }}
            >
              {photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : initiales(p)}
            </div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={envoi}
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
              aria-label="Ajouter une photo"
            >
              {envoi ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                choisirPhoto(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </div>
          <h2 className="text-xl font-bold mt-4 leading-tight">{p.prenom}</h2>
          <p className="text-sm font-medium tracking-wide text-white/60 uppercase">{p.nom}</p>
          {dates(p) && (
            <p className="text-sm mt-1" style={{ color: c.texte }}>
              {dates(p)}
            </p>
          )}
          {p.profession && <p className="text-xs text-white/50 mt-1">{p.profession}</p>}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 mt-5">
          <button
            type="button"
            onClick={() => onCentrer(p.id)}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-white text-slate-900 text-sm font-medium py-2.5 hover:bg-white/90"
          >
            <Crosshair size={15} />
            Centrer ici
          </button>
          <button
            type="button"
            onClick={() => onDefinirRacine(p.id)}
            disabled={racineEnregistree === p.id}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-white/10 text-sm font-medium py-2.5 hover:bg-white/15 disabled:opacity-50"
          >
            <Star size={15} className={racineEnregistree === p.id ? 'fill-amber-300 text-amber-300' : ''} />
            {racineEnregistree === p.id ? 'Départ' : 'Mettre au départ'}
          </button>
        </div>
        {aPhotoImportee && (
          <button
            type="button"
            onClick={() => onSupprimerPhoto(p.id)}
            className="w-full mt-2 flex items-center justify-center gap-1.5 rounded-xl text-xs text-white/40 py-2 hover:text-rose-300"
          >
            <Trash2 size={13} />
            Retirer la photo
          </button>
        )}

        {/* Vie */}
        <Bloc titre="Vie">
          <div className="space-y-3">
            <Evenement titre="Naissance" ev={p.naissance} symbole="°" />
            <Evenement titre="Baptême" ev={p.bapteme} symbole="~" />
            <Evenement titre="Décès" ev={p.deces} symbole="†" />
            <Evenement titre="Inhumation" ev={p.inhumation} symbole="⚘" />
            {!p.naissance && !p.bapteme && !p.deces && !p.inhumation && (
              <p className="text-sm text-white/40">Aucun événement renseigné.</p>
            )}
          </div>
        </Bloc>

        {(pere || mere) && (
          <Bloc titre="Parents">
            <Puce p={pere} photoDe={photoDe} onSelect={onSelect} />
            <Puce p={mere} photoDe={photoDe} onSelect={onSelect} />
          </Bloc>
        )}

        {lesUnions.map((u, i) => (
          <Bloc key={u.famille.id} titre={lesUnions.length > 1 ? `Union ${i + 1}` : 'Union'}>
            {u.conjoint ? (
              <Puce
                p={u.conjoint}
                photoDe={photoDe}
                onSelect={onSelect}
                sousTitre={
                  u.famille.mariage
                    ? `∞ ${u.famille.mariage.date || ''}${u.famille.mariage.lieu ? ' · ' + u.famille.mariage.lieu : ''}`
                    : dates(u.conjoint)
                }
              />
            ) : (
              <p className="text-sm text-white/40 px-2">Conjoint inconnu</p>
            )}
            {u.enfants.length > 0 && (
              <div className="ml-4 pl-3 border-l border-white/10 mt-1">
                {u.enfants.map((e) => (
                  <Puce key={e.id} p={e} photoDe={photoDe} onSelect={onSelect} />
                ))}
              </div>
            )}
          </Bloc>
        ))}

        {fratrie.length > 0 && (
          <Bloc titre={`Frères et sœurs (${fratrie.length})`}>
            {fratrie.map((f) => (
              <Puce key={f.id} p={f} photoDe={photoDe} onSelect={onSelect} />
            ))}
          </Bloc>
        )}

        {p.notes && (
          <Bloc titre="Notes">
            <p className="text-sm text-white/70 whitespace-pre-line leading-relaxed">{p.notes}</p>
          </Bloc>
        )}

        {!aPhotoImportee && fichiersAttendus.length > 0 && (
          <Bloc titre="Photo prévue dans le GEDCOM">
            <p className="text-xs text-white/40 break-all">{fichiersAttendus.join(', ')}</p>
          </Bloc>
        )}
      </div>
    </div>
  )
}
