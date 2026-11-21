import { useState } from 'react'
import { Fenetre, Champ, champ, boutonPrincipal } from './ui.jsx'
import { aujourdhui } from '../../lib/coach/dates.js'

// Séance hors plan (sortie improvisée, vélo, match…) : elle compte dans le journal et la progression
const SPORTS = [
  { id: 'course', nom: 'Course à pied', module: 'course' },
  { id: 'renfo', nom: 'Renforcement', module: 'renfo' },
  { id: 'velo', nom: 'Vélo', module: 'autre' },
  { id: 'padel', nom: 'Padel', module: 'autre' },
  { id: 'autre', nom: 'Autre sport', module: 'autre' },
]

export default function SeanceLibre({ ouverte, onClose, onAjouter }) {
  const [sport, setSport] = useState('course')
  const [date, setDate] = useState(aujourdhui())
  const [distance, setDistance] = useState('')
  const [duree, setDuree] = useState('')
  const [rpe, setRpe] = useState(5)
  const [note, setNote] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState('')

  async function valider() {
    const s = SPORTS.find((x) => x.id === sport)
    const min = Number(String(duree).replace(',', '.'))
    if (!min) return setErreur('Indique la durée.')
    setEnCours(true)
    setErreur('')
    try {
      const km = Number(String(distance).replace(',', '.'))
      await onAjouter({
        date,
        module: s.module,
        sport: s.nom,
        titre: s.nom,
        resume: km ? `${km} km · ${min} min` : `${min} min`,
        distanceKm: s.module === 'course' && km ? km : null,
        distanceReelleKm: s.module === 'course' && km ? km : null,
        dureeMin: min,
        dureeReelleMin: min,
        intense: Number(rpe) >= 7,
        rpe: Number(rpe),
        note: note.trim(),
        blocs: [],
        criteres: [],
        regles: [],
      })
      setDistance('')
      setDuree('')
      setNote('')
      onClose()
    } catch (e) {
      setErreur(e.message || 'Impossible d’enregistrer.')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <Fenetre ouverte={ouverte} onClose={onClose} titre="Ajouter une séance faite">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {SPORTS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSport(s.id)}
              className={`rounded-full px-3.5 py-2 text-sm font-semibold ${sport === s.id ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              {s.nom}
            </button>
          ))}
        </div>
        <Champ label="Date">
          <input type="date" className={champ} value={date} onChange={(e) => setDate(e.target.value)} />
        </Champ>
        <div className="grid grid-cols-2 gap-3">
          {sport === 'course' && (
            <Champ label="Distance (km)">
              <input className={champ} inputMode="decimal" value={distance} onChange={(e) => setDistance(e.target.value)} />
            </Champ>
          )}
          <Champ label="Durée (min)">
            <input className={champ} inputMode="decimal" value={duree} onChange={(e) => setDuree(e.target.value)} />
          </Champ>
        </div>
        <Champ label={`Effort ressenti (RPE) : ${rpe} / 10`}>
          <input type="range" min={1} max={10} value={rpe} onChange={(e) => setRpe(e.target.value)} className="w-full accent-sky-600" />
        </Champ>
        <Champ label="Note">
          <textarea className={champ} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </Champ>
        {erreur && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{erreur}</p>}
        <button disabled={enCours} onClick={valider} className={`${boutonPrincipal} w-full`}>
          Enregistrer
        </button>
      </div>
    </Fenetre>
  )
}
