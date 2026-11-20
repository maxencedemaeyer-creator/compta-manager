import { useState } from 'react'
import { ChevronDown, Trash2 } from 'lucide-react'
import Feuille, { boutonPrincipal, boutonSecondaire, champClass } from './Feuille.jsx'
import { enregistrerJardin, supprimerJardin } from '../../hooks/useJardin.js'

// Création / modification / suppression d'un jardin
// (le nom est seul obligatoire ; « Plus d'infos » est replié par défaut)
export default function JardinForm({ jardin, onClose, onSupprime }) {
  const [nom, setNom] = useState(jardin?.nom || '')
  const [adresse, setAdresse] = useState(jardin?.adresse || '')
  const [contact, setContact] = useState(jardin?.contact || '')
  const [telephone, setTelephone] = useState(jardin?.telephone || '')
  const [notes, setNotes] = useState(jardin?.notes || '')
  const [plus, setPlus] = useState(!!(jardin?.adresse || jardin?.contact || jardin?.telephone || jardin?.notes))
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [confirmer, setConfirmer] = useState(false)

  async function enregistrer(e) {
    e.preventDefault()
    if (!nom.trim()) return
    setEnvoi(true)
    setErreur('')
    try {
      await enregistrerJardin({ id: jardin?.id, nom, adresse, contact, telephone, notes })
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
        <form onSubmit={enregistrer} className="space-y-4">
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
