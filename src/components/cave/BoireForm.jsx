import { useState } from 'react'
import Feuille, { champ, bouton, Etiquette, Etoiles, aujourdhui } from './ui.jsx'
import { boireBouteille } from '../../hooks/useCave.js'
import { titreBouteille } from '../../lib/cave/bouteille.js'

// « J'ouvre cette bouteille » : enlève une bouteille de la cave et garde le souvenir (plat, note, avis)
export default function BoireForm({ bouteille, plat: platInitial = '', onClose }) {
  const [plat, setPlat] = useState(platInitial)
  const [note, setNote] = useState(0)
  const [commentaire, setCommentaire] = useState('')
  const [date, setDate] = useState(aujourdhui())
  const [occupe, setOccupe] = useState(false)
  const [erreur, setErreur] = useState('')
  const { titre, sousTitre } = titreBouteille(bouteille)

  const valider = async (e) => {
    e.preventDefault()
    setOccupe(true)
    try {
      await boireBouteille({ bouteille, plat, note, commentaire, date })
      onClose()
    } catch (err) {
      setErreur(err.message)
      setOccupe(false)
    }
  }

  return (
    <Feuille open onClose={onClose} titre="J’ouvre cette bouteille">
      <form onSubmit={valider} className="space-y-4">
        <div className="rounded-2xl bg-rose-50 px-4 py-3">
          <p className="font-bold text-rose-950">{titre}</p>
          {sousTitre && <p className="text-sm text-rose-900/60">{sousTitre}</p>}
          <p className="mt-1 text-xs text-rose-900/50">Il restera {Math.max(0, (bouteille.quantite || 1) - 1)} bouteille(s) en cave.</p>
        </div>
        <div>
          <Etiquette>Avec quel plat ?</Etiquette>
          <input value={plat} onChange={(e) => setPlat(e.target.value)} placeholder="Risotto aux champignons" className={champ} />
        </div>
        <div>
          <Etiquette>Ta note (tu pourras la donner plus tard)</Etiquette>
          <Etoiles valeur={note} onChange={setNote} taille={30} />
        </div>
        <div>
          <Etiquette>Ton avis</Etiquette>
          <textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} rows={2} className={champ} placeholder="Très bon accord, un peu jeune…" />
        </div>
        <div>
          <Etiquette>Date</Etiquette>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={champ} />
        </div>
        {erreur && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{erreur}</p>}
        <button type="submit" disabled={occupe} className={`${bouton} w-full`}>
          {occupe ? 'Enregistrement…' : '🍷 Santé !'}
        </button>
      </form>
    </Feuille>
  )
}
