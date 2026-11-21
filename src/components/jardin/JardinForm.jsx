import { useState } from 'react'
import { ChevronDown, Trash2 } from 'lucide-react'
import Feuille, { boutonPrincipal, boutonSecondaire, champClass } from './Feuille.jsx'
import { enregistrerJardin, supprimerJardin } from '../../hooks/useJardin.js'
import { CLIMATS, PAYS, PAYS_PAR_DEFAUT, climatDe, drapeau, trouverPays } from '../../config/jardinPays.js'
import { EMOJIS, THEMES, emojiDe, premierEmoji, themeDe } from '../../config/jardinThemes.js'

const THEME_IDS = Object.keys(THEMES)

function themeIdDe(jardin) {
  return THEME_IDS.find((id) => THEMES[id] === themeDe(jardin))
}

// Création / modification / suppression d'un jardin
// (nom, pays et apparence en haut ; « Plus d'infos » est replié par défaut)
export default function JardinForm({ jardin, onClose, onSupprime }) {
  const [nom, setNom] = useState(jardin?.nom || '')
  // Jardins créés avant cette option : Belgique ; « AUTRE » = pays hors liste
  const [pays, setPays] = useState(jardin ? jardin.pays ?? PAYS_PAR_DEFAUT : PAYS_PAR_DEFAUT)
  const [climat, setClimat] = useState(jardin ? climatDe(jardin) : trouverPays(PAYS_PAR_DEFAUT).climat)
  const [emoji, setEmoji] = useState(emojiDe(jardin))
  const [fond, setFond] = useState(themeIdDe(jardin))
  const [emojiLibre, setEmojiLibre] = useState('')
  const [adresse, setAdresse] = useState(jardin?.adresse || '')
  const [contact, setContact] = useState(jardin?.contact || '')
  const [telephone, setTelephone] = useState(jardin?.telephone || '')
  const [notes, setNotes] = useState(jardin?.notes || '')
  const [plus, setPlus] = useState(!!(jardin?.adresse || jardin?.contact || jardin?.telephone || jardin?.notes))
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [confirmer, setConfirmer] = useState(false)

  const theme = THEMES[fond]

  function changerPays(code) {
    setPays(code)
    // Le climat par défaut du pays est proposé ; il reste modifiable juste en dessous
    const p = trouverPays(code)
    if (p) setClimat(p.climat)
  }

  function saisirEmoji(texte) {
    setEmojiLibre(texte)
    const e = premierEmoji(texte)
    if (e) setEmoji(e)
  }

  async function enregistrer(e) {
    e.preventDefault()
    if (!nom.trim()) return
    setEnvoi(true)
    setErreur('')
    try {
      await enregistrerJardin({ id: jardin?.id, nom, pays, climat, emoji, fond, adresse, contact, telephone, notes })
      onClose()
    } catch (err) {
      setErreur(err.message || "Impossible d'enregistrer.")
      setEnvoi(false)
    }
  }

  async function supprimer() {
    setEnvoi(true)
    setErreur('')
    try {
      await supprimerJardin(jardin.id)
      onSupprime?.()
      onClose()
    } catch (err) {
      setErreur(err.message || 'Impossible de supprimer.')
      setEnvoi(false)
    }
  }

  return (
    <Feuille open onClose={onClose} titre={jardin ? 'Modifier le jardin' : 'Nouveau jardin'}>
      {confirmer ? (
        <div className="space-y-4">
          <p className="text-emerald-950">
            Supprimer <strong>{jardin.nom}</strong> ? Toutes ses plantes, leurs photos et les tâches faites seront effacées.
            <br />
            <span className="text-rose-600 font-medium">Cette action est définitive.</span>
          </p>
          {erreur && <p className="text-sm text-rose-600">{erreur}</p>}
          <div className="flex gap-3">
            <button className={`${boutonSecondaire} flex-1`} onClick={() => setConfirmer(false)} disabled={envoi}>
              Annuler
            </button>
            <button
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-3.5 disabled:opacity-50"
              onClick={supprimer}
              disabled={envoi}
            >
              {envoi ? 'Suppression…' : 'Supprimer'}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={enregistrer} className="space-y-5">
          <label className="block">
            <span className="text-sm font-medium text-emerald-900">Nom du jardin</span>
            <input
              className={`${champClass} mt-1`}
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex. Maison, Chez Mamie…"
              autoFocus={!jardin}
              required
            />
          </label>

          {/* Pays et climat : adaptent les dates du calendrier */}
          <div className="space-y-2">
            <label className="block">
              <span className="text-sm font-medium text-emerald-900">Pays</span>
              <select className={`${champClass} mt-1`} value={pays} onChange={(e) => changerPays(e.target.value)}>
                {PAYS.map((p) => (
                  <option key={p.code} value={p.code}>
                    {drapeau(p.code)} {p.nom}
                  </option>
                ))}
                <option value="AUTRE">🌍 Autre pays</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-emerald-900">Climat</span>
              <select className={`${champClass} mt-1`} value={climat} onChange={(e) => setClimat(e.target.value)}>
                {Object.entries(CLIMATS).map(([id, c]) => (
                  <option key={id} value={id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-xs text-emerald-900/60">
              {CLIMATS[climat].detail}. Le calendrier décale ses dates selon le climat (les fiches sont écrites pour la Belgique).
              Pour le sud de la France, par exemple, choisis « Doux et sec ».
            </p>
          </div>

          {/* Apparence */}
          <div className="space-y-3">
            <span className="text-sm font-medium text-emerald-900">Apparence</span>
            <div className={`flex items-center gap-3 rounded-2xl border p-3 ${theme.carte}`}>
              <span className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${theme.tuile}`}>{emoji}</span>
              <span className="truncate text-lg font-bold text-emerald-950">{nom.trim() || 'Mon jardin'}</span>
            </div>

            <div className="grid grid-cols-6 gap-1.5">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => {
                    setEmoji(e)
                    setEmojiLibre('')
                  }}
                  className={`flex h-11 items-center justify-center rounded-xl text-2xl ${
                    emoji === e ? 'bg-emerald-600/15 ring-2 ring-emerald-500' : 'bg-emerald-50'
                  }`}
                  aria-label={`Emoji ${e}`}
                >
                  {e}
                </button>
              ))}
            </div>
            <input
              className={champClass}
              value={emojiLibre}
              onChange={(e) => saisirEmoji(e.target.value)}
              placeholder="Ou tape un autre emoji (clavier 😀)"
            />

            <div className="flex flex-wrap gap-2.5">
              {THEME_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFond(id)}
                  className={`h-10 w-10 rounded-full ${THEMES[id].swatch} ${
                    fond === id ? 'ring-2 ring-offset-2 ring-emerald-700' : ''
                  }`}
                  aria-label={`Fond ${THEMES[id].nom}`}
                  title={THEMES[id].nom}
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPlus((v) => !v)}
            className="flex w-full items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
          >
            Plus d'infos (facultatif)
            <ChevronDown size={18} className={`transition-transform ${plus ? 'rotate-180' : ''}`} />
          </button>

          {plus && (
            <div className="space-y-3">
              <input className={champClass} value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder="Adresse exacte" />
              <input className={champClass} value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Nom et prénom (propriétaire / contact)" />
              <input className={champClass} type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="Téléphone" />
              <textarea className={champClass} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (accès, clé, chien…)" />
            </div>
          )}

          {erreur && <p className="text-sm text-rose-600">{erreur}</p>}

          <button type="submit" className={`${boutonPrincipal} w-full`} disabled={envoi || !nom.trim()}>
            {envoi ? 'Enregistrement…' : jardin ? 'Enregistrer' : 'Créer le jardin'}
          </button>

          {jardin && (
            <button
              type="button"
              onClick={() => setConfirmer(true)}
              className="flex w-full items-center justify-center gap-2 py-2 text-sm font-medium text-rose-600 hover:text-rose-700"
            >
              <Trash2 size={16} />
              Supprimer ce jardin
            </button>
          )}
        </form>
      )}
    </Feuille>
  )
}
