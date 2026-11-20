import sdk from 'microsoft-cognitiveservices-speech-sdk'
import { LONGUEUR_MAX, VOIX_AUTORISEES, construireSsml, freinAntiRobot, localiserMot, origineAutorisee } from './_lecture.js'

// =============================================================
//  Fonction voix de l'appli « Lis-moi » (Vercel, côté serveur)
//  Reçoit un morceau de texte, le fait lire par une voix Azure et
//  renvoie : l'audio (MP3) + le moment où chaque mot est prononcé
//  (pour surligner le mot en cours sur la tablette).
//  La clé Azure reste ici, cachée : variables Vercel
//  AZURE_SPEECH_KEY et AZURE_SPEECH_REGION.
// =============================================================
function synthetiser(texte, voix, vitesse) {
  const cle = process.env.AZURE_SPEECH_KEY
  const region = process.env.AZURE_SPEECH_REGION
  if (!cle || !region) throw new Error('CONFIG')

  const speechConfig = sdk.SpeechConfig.fromSubscription(cle, region)
  speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio24Khz48KBitRateMonoMp3
  const synth = new sdk.SpeechSynthesizer(speechConfig, null) // null = pas de haut-parleur, on récupère l'audio

  const ssmlInfos = construireSsml(texte, voix, vitesse)
  const mots = []
  let curseur = 0
  synth.wordBoundary = (_s, e) => {
    if (e.boundaryType !== undefined && e.boundaryType !== sdk.SpeechSynthesisBoundaryType.Word) return
    const pos = localiserMot(texte, e, ssmlInfos, curseur)
    if (!pos) return
    curseur = pos.debut + pos.longueur
    mots.push({ ms: Math.round(e.audioOffset / 10000), debut: pos.debut, longueur: pos.longueur })
  }

  return new Promise((resolve, reject) => {
    synth.speakSsmlAsync(
      ssmlInfos.ssml,
      (resultat) => {
        synth.close()
        if (resultat.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          resolve({ audio: Buffer.from(resultat.audioData).toString('base64'), mots })
        } else {
          reject(new Error(resultat.errorDetails || 'Synthèse annulée'))
        }
      },
      (erreur) => {
        synth.close()
        reject(new Error(String(erreur)))
      }
    )
  })
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ erreur: 'Méthode non autorisée' })
  if (!origineAutorisee(req)) return res.status(403).json({ erreur: 'Accès refusé' })

  let corps = req.body
  if (typeof corps === 'string') {
    try {
      corps = JSON.parse(corps)
    } catch {
      corps = {}
    }
  }
  const texte = typeof corps?.texte === 'string' ? corps.texte : ''
  const voix = corps?.voix
  const vitesse = Number(corps?.vitesse) || 0

  if (!texte.trim()) return res.status(400).json({ erreur: 'Texte vide' })
  if (texte.length > LONGUEUR_MAX) return res.status(400).json({ erreur: 'Texte trop long' })
  if (!VOIX_AUTORISEES[voix]) return res.status(400).json({ erreur: 'Voix inconnue' })
  if (vitesse < -50 || vitesse > 50) return res.status(400).json({ erreur: 'Vitesse invalide' })
  if (freinAntiRobot(req, texte.length)) {
    return res.status(429).json({ erreur: 'Beaucoup de lectures en ce moment : réessaie dans quelques minutes.' })
  }

  try {
    const resultat = await synthetiser(texte, voix, vitesse)
    return res.status(200).json(resultat)
  } catch (e) {
    if (e.message === 'CONFIG') {
      return res.status(500).json({ erreur: 'La voix n’est pas encore configurée (clé Azure manquante dans Vercel).' })
    }
    console.error('Azure TTS :', e.message)
    const quota = /429|quota|throttl/i.test(e.message)
    return res.status(quota ? 429 : 502).json({
      erreur: quota
        ? 'Trop de lectures en ce moment, réessaie dans une minute.'
        : 'La voix ne répond pas. Réessaie dans un instant.',
    })
  }
}
