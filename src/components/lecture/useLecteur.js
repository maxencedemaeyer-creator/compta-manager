import { useCallback, useEffect, useRef, useState } from 'react'
import { decouperPourVoix, sonVide } from '../../utils/lecture.js'

// =============================================================
//  Appli « Lis-moi » : le lecteur (voix Azure via /api/tts)
//  Lit un passage du texte morceau par morceau (le premier est court
//  pour démarrer vite, le suivant est préparé pendant la lecture) et
//  indique en continu la position du mot prononcé.
// =============================================================
const cache = new Map() // « voix|vitesse|texte » → { url, mots }
const CACHE_MAX = 60

async function demanderVoix(texte, voix, vitesse) {
  const cle = `${voix}|${vitesse}|${texte}`
  if (cache.has(cle)) return cache.get(cle)
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
  const octets = Uint8Array.from(atob(data.audio), (c) => c.charCodeAt(0))
  const resultat = { url: URL.createObjectURL(new Blob([octets], { type: 'audio/mpeg' })), mots: data.mots || [] }
  cache.set(cle, resultat)
  if (cache.size > CACHE_MAX) {
    const [premiere, ancien] = cache.entries().next().value
    URL.revokeObjectURL(ancien.url)
    cache.delete(premiere)
  }
  return resultat
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
    async (debut, fin, { voix, vitesse }) => {
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

      const morceaux = decouperPourVoix(texte, debut, fin)
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
