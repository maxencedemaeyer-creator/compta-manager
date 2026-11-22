import { useCallback, useEffect, useRef, useState } from 'react'
import { decouperPourVoix, dureeWav, estimerMots, prononciationVoix, sonVide } from '../../utils/lecture.js'
import { MOTEUR_VOIX } from '../../config/lectureVoix.js'
import { syntheseLocale } from '../../utils/voixPiper.js'
import {
  PLAFOND_MENSUEL,
  caracteresDuMois,
  cleVoix,
  compterCaracteres,
  enregistrerMemoireVoix,
  lireMemoireVoix,
  moisSuivant,
} from '../../utils/voixQuota.js'

// =============================================================
//  Appli « Lis-moi » : le lecteur (voix Azure via /api/tts)
//  Lit un passage du texte morceau par morceau (le premier est court
//  pour démarrer vite, le suivant est préparé pendant la lecture) et
//  indique en continu la position du mot prononcé.
//  Deux moteurs (config/lectureVoix.js, MOTEUR_VOIX) :
//   - 'piper' : voix libre calculée sur l'appareil (gratuit, illimité) ;
//     les moments des mots sont estimés (utils/lecture.js, estimerMots) ;
//   - 'azure' : /api/tts, avec mémoire partagée + plafond mensuel (utils/voixQuota.js).
// =============================================================
const cache = new Map() // « voix|vitesse|texte » → { url, mots } (mémoire de la tablette)
const CACHE_MAX = 60

function enAudio(base64, mots) {
  const octets = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  return { url: URL.createObjectURL(new Blob([octets], { type: 'audio/mpeg' })), mots: mots || [] }
}

function garder(cle, resultat) {
  cache.set(cle, resultat)
  if (cache.size > CACHE_MAX) {
    const [premiere, ancien] = cache.entries().next().value
    URL.revokeObjectURL(ancien.url)
    cache.delete(premiere)
  }
  return resultat
}

// Voix Piper (sur l'appareil, gratuite) : son WAV + moments des mots estimés
async function demanderVoixPiper(texte) {
  const cle = `piper|${texte}`
  if (cache.has(cle)) return cache.get(cle)
  // la voix reçoit le texte avec les prononciations corrigées (« p'tit » → « pti ») ; le surlignage reste calé sur le texte affiché
  const buffer = await syntheseLocale(prononciationVoix(texte))
  const mots = estimerMots(texte, dureeWav(buffer))
  return garder(cle, { url: URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' })), mots })
}

async function demanderVoix(texte, voix, vitesse) {
  if (MOTEUR_VOIX === 'piper') return demanderVoixPiper(texte)
  const cle = `${voix}|${vitesse}|${texte}`
  if (cache.has(cle)) return cache.get(cle)

  // 1) Déjà lu par quelqu'un de la classe ? On reprend la voix gardée (gratuit)
  let empreinte = null
  try {
    empreinte = await cleVoix(voix, vitesse, texte)
    const garde = await lireMemoireVoix(empreinte)
    if (garde?.audio) return garder(cle, enAudio(garde.audio, garde.mots))
  } catch {
    /* pas grave : on demande à Azure */
  }

  // 2) Plafond du mois (pour rester dans le gratuit d'Azure)
  let deja = 0
  try {
    deja = await caracteresDuMois()
  } catch {
    /* compteur illisible : on continue, Azure gratuit s'arrête de lui-même */
  }
  if (deja + texte.length > PLAFOND_MENSUEL) {
    throw new Error(`La voix gratuite de ce mois est épuisée. Elle revient le 1er ${moisSuivant()}.`)
  }

  // 3) Azure
  const rep = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texte, voix, vitesse }),
  })
  let data = null
  try {
    data = await rep.json()
  } catch {
    /* réponse vide */
  }
  if (!rep.ok || !data?.audio) throw new Error(data?.erreur || 'La voix ne répond pas. Réessaie dans un instant.')

  compterCaracteres(texte.length).catch(() => {})
  if (empreinte) enregistrerMemoireVoix(empreinte, data, texte.length).catch(() => {})
  return garder(cle, enAudio(data.audio, data.mots))
}

export default function useLecteur(texte) {
  const [etat, setEtat] = useState('arret') // arret | chargement | lecture | pause
  const [position, setPosition] = useState(-1) // position (caractère) du mot prononcé
  const [erreur, setErreur] = useState(null)

  const audioRef = useRef(null)
  const silenceRef = useRef(null)
  const sessionRef = useRef(0)
  const finMorceauRef = useRef(null) // pour interrompre l'attente de la fin d'un morceau
  const motsRef = useRef([]) // mots du morceau en cours (positions dans le texte complet)
  const rafRef = useRef(0)

  if (!audioRef.current && typeof Audio !== 'undefined') {
    audioRef.current = new Audio()
    audioRef.current.preload = 'auto'
  }

  // Suivi du mot prononcé (60 fois par seconde)
  const suivre = useCallback(() => {
    const audio = audioRef.current
    const t = audio.currentTime * 1000 + 60
    const mots = motsRef.current
    let pos = -1
    for (let i = 0; i < mots.length && mots[i].ms <= t; i++) pos = mots[i].debut
    setPosition((p) => (p === pos ? p : pos))
    rafRef.current = requestAnimationFrame(suivre)
  }, [])

  const arreter = useCallback(() => {
    sessionRef.current++
    cancelAnimationFrame(rafRef.current)
    audioRef.current?.pause()
    finMorceauRef.current?.()
    finMorceauRef.current = null
    motsRef.current = []
    setPosition(-1)
    setEtat('arret')
  }, [])

  // Lit le texte entre les positions debut et fin
  const lire = useCallback(
    async (debut, fin, { voix, vitesse, debit = 1 }) => {
      arreter()
      const session = sessionRef.current
      const audio = audioRef.current
      setErreur(null)
      setEtat('chargement')

      // Débloque le son sur iPad/iPhone : il faut jouer quelque chose
      // tout de suite, pendant le toucher (avant d'attendre la voix).
      if (!silenceRef.current) silenceRef.current = sonVide()
      audio.src = silenceRef.current
      audio.play().catch(() => {})

      // Piper calcule sur l'appareil : morceaux plus courts (≈ une phrase) pour démarrer vite
      const morceaux = decouperPourVoix(texte, debut, fin, MOTEUR_VOIX === 'piper' ? { premier: 140, suivants: 280 } : undefined)
      if (morceaux.length === 0) {
        setEtat('arret')
        return
      }
      const demandes = []
      const obtenir = (i) => {
        if (!demandes[i]) {
          demandes[i] = demanderVoix(morceaux[i].texte, voix, vitesse)
          demandes[i].catch(() => {})
        }
        return demandes[i]
      }

      try {
        for (let i = 0; i < morceaux.length; i++) {
          const { url, mots } = await obtenir(i)
          if (session !== sessionRef.current) return
          if (i + 1 < morceaux.length) obtenir(i + 1) // prépare la suite

          motsRef.current = mots.map((m) => ({ ms: m.ms, debut: morceaux[i].debut + m.debut }))
          audio.src = url
          // vitesse de lecture (Piper) : sans changer la hauteur de la voix
          audio.preservesPitch = true
          audio.defaultPlaybackRate = MOTEUR_VOIX === 'piper' ? debit : 1
          audio.playbackRate = audio.defaultPlaybackRate
          const fini = new Promise((resolve) => {
            const finir = () => {
              audio.removeEventListener('ended', finir)
              resolve()
            }
            audio.addEventListener('ended', finir)
            finMorceauRef.current = finir
          })
          try {
            await audio.play()
          } catch {
            if (session !== sessionRef.current) return
            throw new Error('Touche encore ▶ pour écouter.')
          }
          setEtat('lecture')
          cancelAnimationFrame(rafRef.current)
          rafRef.current = requestAnimationFrame(suivre)
          await fini
          if (session !== sessionRef.current) return
        }
        arreter()
      } catch (e) {
        if (session !== sessionRef.current) return
        arreter()
        setErreur(e.message)
      }
    },
    [texte, arreter, suivre]
  )

  const pause = useCallback(() => {
    audioRef.current?.pause()
    cancelAnimationFrame(rafRef.current)
    setEtat('pause')
  }, [])

  const reprendre = useCallback(() => {
    audioRef.current
      ?.play()
      .then(() => {
        setEtat('lecture')
        rafRef.current = requestAnimationFrame(suivre)
      })
      .catch(() => {})
  }, [suivre])

  // On quitte la page : on coupe le son
  useEffect(() => () => arreter(), [arreter])

  return { etat, position, erreur, effacerErreur: () => setErreur(null), lire, pause, reprendre, arreter }
}
