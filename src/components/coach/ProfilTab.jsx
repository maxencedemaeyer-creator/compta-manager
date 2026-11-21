import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Carte, Champ, champ, boutonPrincipal, boutonSecondaire, BadgeSource } from './ui.jsx'
import { JOURS_LONGS, aujourdhui } from '../../lib/coach/dates.js'
import { lireTemps, vdotDepuisCourse } from '../../lib/coach/vdot.js'
import { fcMaxTanaka } from '../../lib/coach/energie.js'
import { PROFIL_PAR_DEFAUT } from '../../data/coach/profil.js'
import { DISTANCES_COURSE } from '../../lib/coach/plans.js'

const num = (v) => Number(String(v).replace(',', '.'))
const OPTIONS_JOURS = JOURS_LONGS.map((nom, i) => (
  <option key={nom} value={i + 1}>
    {nom}
  </option>
))

export default function ProfilTab({ profil, onSauver, premiereFois = false }) {
  const [p, setP] = useState(() => ({ ...PROFIL_PAR_DEFAUT, ...(profil || {}) }))
  const [enCours, setEnCours] = useState(false)
  const [message, setMessage] = useState(null)

  const maj = (champs) => setP((a) => ({ ...a, ...champs }))
  const majObj = (champs) => setP((a) => ({ ...a, objectif: { ...a.objectif, ...champs } }))
  const majPerf = (champs) => setP((a) => ({ ...a, perfRecente: { ...a.perfRecente, ...champs } }))
  const majSem = (champs) => setP((a) => ({ ...a, semaine: { ...a.semaine, ...champs } }))
  const basculeRenfo = (j) => {
    const cur = (p.semaine.renfo || []).map(Number)
    majSem({ renfo: cur.includes(j) ? cur.filter((x) => x !== j) : [...cur, j].sort() })
  }
  const bascule = (cle, valeur) => {
    const cur = p[cle] || []
    maj({ [cle]: cur.includes(valeur) ? cur.filter((x) => x !== valeur) : [...cur, valeur] })
  }
  const majFixe = (i, champs) => maj({ fixes: p.fixes.map((f, k) => (k === i ? { ...f, ...champs } : f)) })

  const secPerf = lireTemps(p.perfRecente?.temps || '')
  const vdotApercu = secPerf && p.perfRecente.distanceKm ? vdotDepuisCourse(num(p.perfRecente.distanceKm) * 1000, secPerf) : null

  async function sauver() {
    setMessage(null)
    if (!num(p.age) || !num(p.poidsKg) || !num(p.tailleCm)) return setMessage({ ok: false, texte: 'Âge, taille et poids sont nécessaires.' })
    if (!secPerf) return setMessage({ ok: false, texte: 'Temps de ta performance récente illisible. Exemple : 23:41 ou 1:48:57.' })
    if (p.objectif?.tempsCible && !lireTemps(p.objectif.tempsCible)) return setMessage({ ok: false, texte: 'Temps cible illisible. Exemple : 1:50:00.' })
    setEnCours(true)
    try {
      const changeLongue = !profil || Number(profil.plusLongueKm) !== num(p.plusLongueKm)
      await onSauver({
        ...p,
        age: num(p.age),
        tailleCm: num(p.tailleCm),
        poidsKg: num(p.poidsKg),
        fcMax: p.fcMax ? num(p.fcMax) : null,
        fcRepos: p.fcRepos ? num(p.fcRepos) : null,
        plusLongueKm: num(p.plusLongueKm) || 0,
        plusLongueDate: changeLongue || !p.plusLongueDate ? aujourdhui() : p.plusLongueDate,
        perfRecente: { ...p.perfRecente, distanceKm: num(p.perfRecente.distanceKm) },
        objectif: { ...p.objectif, distanceKm: num(p.objectif.distanceKm) },
        facteurActivite: num(p.facteurActivite) || 1.4,
        fixes: (p.fixes || []).map((f) => ({ ...f, jour: Number(f.jour), dureeMin: num(f.dureeMin) || 60 })),
      })
      setMessage({ ok: true, texte: 'Profil enregistré.' })
    } catch (e) {
      setMessage({ ok: false, texte: e.message || 'Impossible d’enregistrer.' })
    } finally {
      setEnCours(false)
    }
  }

  const presetObjectif = (id) => {
    const d = DISTANCES_COURSE.find((x) => x.id === id)
    majObj({ nom: d.nom, distanceKm: d.km })
  }
  const presetActif = DISTANCES_COURSE.find((d) => Math.abs(d.km - num(p.objectif?.distanceKm)) < 0.01)?.id

  return (
    <div className="space-y-4">
      {premiereFois && (
        <Carte className="border-sky-200 bg-sky-50/70">
          <p className="text-base font-bold text-sky-900">Bienvenue dans Coach 👋</p>
          <p className="mt-1 text-sm leading-relaxed text-sky-900/80">
            Vérifie ton profil (celui de test est déjà rempli) puis enregistre-le : tout le reste en est calculé. Chaque conseil de l’appli est relié à une source, avec un bouton 📚.
          </p>
        </Carte>
      )}

      <Carte className="space-y-3">
        <p className="text-sm font-bold text-slate-800">Moi</p>
        <div className="grid grid-cols-2 gap-3">
          <Champ label="Prénom">
            <input className={champ} value={p.prenom || ''} onChange={(e) => maj({ prenom: e.target.value })} />
          </Champ>
          <Champ label="Sexe">
            <select className={champ} value={p.sexe} onChange={(e) => maj({ sexe: e.target.value })}>
              <option value="homme">Homme</option>
              <option value="femme">Femme</option>
            </select>
          </Champ>
          <Champ label="Âge">
            <input className={champ} inputMode="numeric" value={p.age} onChange={(e) => maj({ age: e.target.value })} />
          </Champ>
          <Champ label="Taille (cm)">
            <input className={champ} inputMode="numeric" value={p.tailleCm} onChange={(e) => maj({ tailleCm: e.target.value })} />
          </Champ>
          <Champ label="Poids (kg)">
            <input className={champ} inputMode="decimal" value={p.poidsKg} onChange={(e) => maj({ poidsKg: e.target.value })} />
          </Champ>
          <Champ label="FC repos (bpm)">
            <input className={champ} inputMode="numeric" value={p.fcRepos ?? ''} onChange={(e) => maj({ fcRepos: e.target.value })} />
          </Champ>
          <Champ label="FC max mesurée (bpm)" aide={`Estimation par l’âge : ${fcMaxTanaka(num(p.age) || 30)} bpm (Tanaka)`}>
            <input className={champ} inputMode="numeric" value={p.fcMax ?? ''} onChange={(e) => maj({ fcMax: e.target.value })} />
          </Champ>
        </div>
      </Carte>

      <Carte className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-800">Ma forme actuelle</p>
          <BadgeSource regles={['allures-vdot', 'spike-seance-10pct']} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Champ label="Perf récente : distance (km)">
            <input className={champ} inputMode="decimal" value={p.perfRecente?.distanceKm ?? ''} onChange={(e) => majPerf({ distanceKm: e.target.value })} />
          </Champ>
          <Champ label="Perf récente : temps" aide="ex. 23:41 ou 1:48:57">
            <input className={champ} value={p.perfRecente?.temps ?? ''} onChange={(e) => majPerf({ temps: e.target.value })} />
          </Champ>
        </div>
        {vdotApercu && <p className="rounded-xl bg-sky-50 px-3 py-2 text-sm text-sky-800">VDOT estimé : <strong>{Math.round(vdotApercu * 10) / 10}</strong></p>}
        <Champ label="Plus longue sortie récente (km)" aide="Sert de point de départ à la règle des +10 % par sortie.">
          <input className={champ} inputMode="decimal" value={p.plusLongueKm ?? ''} onChange={(e) => maj({ plusLongueKm: e.target.value })} />
        </Champ>
      </Carte>

      <Carte className="space-y-3">
        <p className="text-sm font-bold text-slate-800">Mon objectif</p>
        <div className="flex flex-wrap gap-2">
          {DISTANCES_COURSE.map((d) => (
            <button
              key={d.id}
              onClick={() => presetObjectif(d.id)}
              className={`rounded-full px-3.5 py-2 text-sm font-semibold ${presetActif === d.id ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              {d.nom}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Champ label="Date de la course">
            <input type="date" className={champ} value={p.objectif?.date || ''} onChange={(e) => majObj({ date: e.target.value })} />
          </Champ>
          <Champ label="Temps visé" aide="facultatif">
            <input className={champ} value={p.objectif?.tempsCible || ''} onChange={(e) => majObj({ tempsCible: e.target.value })} />
          </Champ>
        </div>
      </Carte>

      <Carte className="space-y-3">
        <p className="text-sm font-bold text-slate-800">Ma semaine type</p>
        <div className="grid grid-cols-3 gap-3">
          <Champ label="Qualité">
            <select className={champ} value={p.semaine.qualite} onChange={(e) => majSem({ qualite: Number(e.target.value) })}>
              {OPTIONS_JOURS}
            </select>
          </Champ>
          <Champ label="Facile">
            <select className={champ} value={p.semaine.facile} onChange={(e) => majSem({ facile: Number(e.target.value) })}>
              {OPTIONS_JOURS}
            </select>
          </Champ>
          <Champ label="Longue">
            <select className={champ} value={p.semaine.longue} onChange={(e) => majSem({ longue: Number(e.target.value) })}>
              {OPTIONS_JOURS}
            </select>
          </Champ>
        </div>
        <div>
          <span className="mb-1 block text-sm font-semibold text-slate-700">Renforcement</span>
          <div className="flex flex-wrap gap-2">
            {JOURS_LONGS.map((nom, i) => {
              const actif = (p.semaine.renfo || []).map(Number).includes(i + 1)
              return (
                <button key={nom} onClick={() => basculeRenfo(i + 1)} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${actif ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {nom.slice(0, 3)}.
                </button>
              )
            })}
          </div>
        </div>
      </Carte>

      <Carte className="space-y-3">
        <p className="text-sm font-bold text-slate-800">Sports fixes (padel, foot…)</p>
        {(p.fixes || []).map((f, i) => (
          <div key={i} className="space-y-2 rounded-2xl bg-slate-50 p-3">
            <div className="grid grid-cols-2 gap-2">
              <input className={champ} placeholder="Nom" value={f.nom} onChange={(e) => majFixe(i, { nom: e.target.value })} />
              <select className={champ} value={f.jour} onChange={(e) => majFixe(i, { jour: Number(e.target.value) })}>
                {OPTIONS_JOURS}
              </select>
              <input className={champ} type="time" value={f.heure || ''} onChange={(e) => majFixe(i, { heure: e.target.value })} />
              <input className={champ} inputMode="numeric" placeholder="Durée (min)" value={f.dureeMin} onChange={(e) => majFixe(i, { dureeMin: e.target.value })} />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={!!f.intense} onChange={(e) => majFixe(i, { intense: e.target.checked })} className="h-4 w-4 accent-sky-600" />
                Sport intense
              </label>
              <button onClick={() => maj({ fixes: p.fixes.filter((_, k) => k !== i) })} className="rounded-full p-2 text-rose-500 hover:bg-rose-50" aria-label="Retirer">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
        <button onClick={() => maj({ fixes: [...(p.fixes || []), { nom: '', jour: 4, heure: '20:00', dureeMin: 60, intense: false }] })} className={boutonSecondaire}>
          <Plus size={16} /> Ajouter un sport fixe
        </button>
      </Carte>

      <Carte className="space-y-3">
        <p className="text-sm font-bold text-slate-800">Prévention et réglages</p>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={(p.antecedents || []).includes('ischios')} onChange={() => bascule('antecedents', 'ischios')} className="h-4 w-4 accent-sky-600" />
          Ischio-jambiers fragiles (ajoute le Nordic hamstring)
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={(p.antecedents || []).includes('bandelette')} onChange={() => bascule('antecedents', 'bandelette')} className="h-4 w-4 accent-sky-600" />
          Bandelette ilio-tibiale (ajoute des exercices de hanches)
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={!!p.optionCadence} onChange={(e) => maj({ optionCadence: e.target.checked })} className="h-4 w-4 accent-sky-600" />
          Proposer l’option « cadence » sur les sorties faciles
        </label>
        <Champ label="Activité quotidienne hors sport" aide="1,2 sédentaire · 1,4 modérée · 1,6 active (choix de l’appli, sans source)">
          <input className={champ} inputMode="decimal" value={p.facteurActivite} onChange={(e) => maj({ facteurActivite: e.target.value })} />
        </Champ>
        <p className="text-xs text-slate-400">Si tu as une douleur ou un antécédent sérieux, fais valider le plan par un médecin ou un kiné.</p>
      </Carte>

      {message && <p className={`rounded-2xl px-4 py-3 text-sm ${message.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'}`}>{message.texte}</p>}
      <button disabled={enCours} onClick={sauver} className={`${boutonPrincipal} w-full`}>
        {enCours ? 'Enregistrement…' : 'Enregistrer mon profil'}
      </button>
    </div>
  )
}
