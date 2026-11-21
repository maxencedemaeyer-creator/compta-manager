import { useCallback, useEffect, useMemo, useState } from 'react'
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore'
import { db } from '../firebase/config.js'
import { usePin } from '../context/PinContext.jsx'
import { withTimeout } from '../utils/withTimeout.js'
import { aujourdhui } from '../lib/coach/dates.js'
import { planC25k, planCourse, planRenfo } from '../lib/coach/plans.js'
import { PROFIL_PAR_DEFAUT } from '../data/coach/profil.js'

// =============================================================
//  Application « Coach » (tout est stocké dans Firebase, jamais en local)
//  - coachProfil/principal : profil du sportif (âge, poids, objectif, semaine type…)
//  - coachPlans/{id}       : { nom, type, resume, avertissements[], creeLe }
//  - coachSeances/{id}     : une séance prévue ou faite
//      id = `${date}__${type}__${n}`
//      { planId, date, type, module, titre, resume, distanceKm, dureeMin, blocs[], versionCourte,
//        criteres[], regles[], intense, sport?,
//        statut: 'prevue' | 'faite' | 'courte' | 'sautee',
//        rpe?, distanceReelleKm?, dureeReelleMin?, note?, faiteLe? }
//  Les plans sont générés par src/lib/coach/plans.js (fonctions pures testées).
// =============================================================
const PROFIL = 'coachProfil'
const PLANS = 'coachPlans'
const SEANCES = 'coachSeances'

// Firestore refuse les valeurs « undefined » : on les retire
const propre = (o) => JSON.parse(JSON.stringify(o))

export function useCoach() {
  const { authReady } = usePin()
  const [profil, setProfil] = useState(undefined) // undefined = chargement, null = pas encore créé
  const [plans, setPlans] = useState([])
  const [seances, setSeances] = useState([])
  const [prets, setPrets] = useState({ profil: false, plans: false, seances: false })
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    if (!authReady) return
    const echec = (nom) => (err) => {
      console.error(`Erreur Firestore (${nom}) :`, err)
      setErreur('Impossible de charger les données du Coach.')
      setPrets((p) => ({ ...p, [nom]: true }))
    }
    const stops = [
      onSnapshot(
        doc(db, PROFIL, 'principal'),
        (d) => {
          setProfil(d.exists() ? d.data() : null)
          setPrets((p) => ({ ...p, profil: true }))
        },
        echec('profil')
      ),
      onSnapshot(
        collection(db, PLANS),
        (snap) => {
          setPlans(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
          setPrets((p) => ({ ...p, plans: true }))
        },
        echec('plans')
      ),
      onSnapshot(
        collection(db, SEANCES),
        (snap) => {
          setSeances(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.date === b.date ? a.id.localeCompare(b.id) : a.date < b.date ? -1 : 1)))
          setPrets((p) => ({ ...p, seances: true }))
        },
        echec('seances')
      ),
    ]
    return () => stops.forEach((s) => s())
  }, [authReady])

  const chargement = !(prets.profil && prets.plans && prets.seances)

  const sauverProfil = useCallback(async (donnees) => {
    await withTimeout(setDoc(doc(db, PROFIL, 'principal'), { ...propre(donnees), majLe: serverTimestamp() }))
  }, [])

  // Enregistre le résultat d'un journal ou un changement de statut
  const majSeance = useCallback(async (id, champs) => {
    await withTimeout(setDoc(doc(db, SEANCES, id), propre(champs), { merge: true }))
  }, [])

  const ajouterSeanceLibre = useCallback(async (seance) => {
    const id = `${seance.date}__libre__${Date.now().toString(36)}`
    await withTimeout(setDoc(doc(db, SEANCES, id), propre({ ...seance, type: 'libre', planId: null, statut: 'faite', faiteLe: new Date().toISOString() })))
  }, [])

  const supprimerSeance = useCallback(async (id) => {
    await withTimeout(deleteDoc(doc(db, SEANCES, id)))
  }, [])

  // Génère un plan et l'écrit : les séances prévues non faites des anciens plans sont remplacées
  const genererPlan = useCallback(
    async (type, options = {}) => {
      const pr = profil || PROFIL_PAR_DEFAUT
      const jour = aujourdhui()
      let resultat
      if (type === 'course') resultat = planCourse(pr, jour)
      else if (type === 'c25k') resultat = planC25k(pr, jour)
      else if (type === 'renfo') resultat = planRenfo(pr, jour, options)
      else throw new Error('Type de plan inconnu.')

      const planId = `${type}-${jour}-${Date.now().toString(36)}`
      const nom =
        type === 'course' ? `${pr.objectif?.nom || 'Course'} · ${resultat.resume.semaines} semaines` : type === 'c25k' ? 'Débutant 5 km (9 semaines)' : `Renforcement (${resultat.resume.semaines} semaines)`

      const batch = writeBatch(db)
      // 1. on retire ce qui n'a pas été fait dans les plans précédents (à partir d'aujourd'hui)
      for (const s of seances) {
        if (s.planId && s.statut === 'prevue' && s.date >= jour) batch.delete(doc(db, SEANCES, s.id))
      }
      // 2. nouveau plan
      batch.set(doc(db, PLANS, planId), propre({ nom, type, resume: resultat.resume, avertissements: resultat.avertissements, creeLe: new Date().toISOString(), actif: true }))
      for (const p of plans) if (p.actif) batch.set(doc(db, PLANS, p.id), { actif: false }, { merge: true })
      // 3. séances
      const compteur = {}
      for (const s of resultat.sessions) {
        const cle = `${s.date}__${s.type}`
        compteur[cle] = (compteur[cle] || 0) + 1
        const id = `${cle}__${compteur[cle]}__${planId.slice(-4)}`
        batch.set(doc(db, SEANCES, id), propre({ ...s, planId, statut: 'prevue' }))
      }
      await withTimeout(batch.commit(), 25000)
      return { planId, ...resultat }
    },
    [profil, plans, seances]
  )

  const supprimerPlan = useCallback(
    async (planId) => {
      const batch = writeBatch(db)
      for (const s of seances) if (s.planId === planId && s.statut === 'prevue') batch.delete(doc(db, SEANCES, s.id))
      batch.delete(doc(db, PLANS, planId))
      await withTimeout(batch.commit(), 25000)
    },
    [seances]
  )

  const planActif = useMemo(() => plans.find((p) => p.actif) || null, [plans])

  return { profil, plans, planActif, seances, chargement, erreur, sauverProfil, majSeance, ajouterSeanceLibre, supprimerSeance, genererPlan, supprimerPlan }
}
