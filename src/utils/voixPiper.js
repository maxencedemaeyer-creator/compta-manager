// =============================================================
//  Appli « Lis-moi » : accès à la voix Piper (voir piperWorker.js)
//  - prechargerPiper() : prépare la voix dès l'ouverture d'une lecture
//  - syntheseLocale(texte) : renvoie le son (WAV) d'un petit texte
//  - ecouterPreparation(fn) : avancement du 1er téléchargement (0 → 100)
// =============================================================
import { VOIX_PIPER } from '../config/lectureVoix.js'

let travailleur = null
let compteur = 0
const attentes = new Map()
const ecouteurs = new Set()
let etat = { pret: false, pourcent: null, erreur: null }

function annoncer(modif) {
  etat = { ...etat, ...modif }
  ecouteurs.forEach((f) => f(etat))
}

function obtenir() {
  if (travailleur) return travailleur
  travailleur = new Worker(new URL('./piperWorker.js', import.meta.url), { type: 'module' })
  travailleur.onmessage = (e) => {
    const m = e.data
    if (m.type === 'progression') {
      annoncer({ pourcent: Math.min(99, Math.round((m.charge / m.total) * 100)) })
      return
    }
    const attente = attentes.get(m.id)
    if (!attente) return
    attentes.delete(m.id)
    if (m.type === 'erreur') {
      annoncer({ erreur: m.message })
      attente.rejeter(new Error('La voix n’a pas pu se préparer. Vérifie la connexion internet et réessaie.'))
    } else {
      annoncer({ pret: true, pourcent: null, erreur: null })
      attente.resoudre(m.buffer)
    }
  }
  travailleur.onerror = () => {
    attentes.forEach((a) => a.rejeter(new Error('La voix ne fonctionne pas sur cet appareil.')))
    attentes.clear()
    travailleur = null
  }
  return travailleur
}

function demander(type, texte) {
  return new Promise((resoudre, rejeter) => {
    const id = ++compteur
    attentes.set(id, { resoudre, rejeter })
    obtenir().postMessage({ id, type, texte, voix: VOIX_PIPER })
  })
}

export function prechargerPiper() {
  if (etat.pret) return Promise.resolve()
  return demander('preparer').catch(() => {})
}

export function syntheseLocale(texte) {
  return demander('dire', texte)
}

export function ecouterPreparation(fn) {
  ecouteurs.add(fn)
  fn(etat)
  return () => ecouteurs.delete(fn)
}
