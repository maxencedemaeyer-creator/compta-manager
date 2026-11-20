// =============================================================
//  Appli « Lis-moi » : la voix Piper, calculée en arrière-plan
//  (« worker ») pour que la page reste fluide pendant le calcul.
//  Voix libre « siwis » (Piper, open source ; données SIWIS, licence
//  CC BY 4.0). Le modèle (~60 Mo) est téléchargé une seule fois puis
//  gardé dans le stockage du navigateur (OPFS) de l'appareil.
// =============================================================
import { TtsSession } from '@mintplex-labs/piper-tts-web'

let session = null
let voixActuelle = null

function preparer(voix) {
  if (!session || voixActuelle !== voix) {
    voixActuelle = voix
    session = TtsSession.create({
      voiceId: voix,
      progress: (p) => {
        // téléchargement du modèle (.onnx) : on renvoie l'avancement à la page
        if (p?.url && p.url.endsWith('.onnx') && p.total) {
          postMessage({ type: 'progression', charge: p.loaded, total: p.total })
        }
      },
    })
    session.catch(() => {
      session = null
    })
  }
  return session
}

onmessage = async (e) => {
  const { id, type, texte, voix } = e.data
  try {
    const s = await preparer(voix)
    if (type === 'preparer') {
      postMessage({ id, type: 'pret' })
      return
    }
    const son = await s.predict(texte)
    const buffer = await son.arrayBuffer()
    postMessage({ id, type: 'son', buffer }, [buffer])
  } catch (err) {
    postMessage({ id, type: 'erreur', message: String(err?.message || err) })
  }
}
