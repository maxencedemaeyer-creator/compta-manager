// Détecteur de posture MediaPipe (le même que le miroir A1), en mode vidéo ou photo
const WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm'
const MODELE = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'

let vision = null
export async function creerPose(mode = 'VIDEO') {
  // (tests automatiques : un détecteur factice peut être fourni)
  if (typeof window !== 'undefined' && window.__laboPoseFactice) return window.__laboPoseFactice
  const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision')
  vision = vision || (await FilesetResolver.forVisionTasks(WASM))
  const options = (delegate) => ({ baseOptions: { modelAssetPath: MODELE, delegate }, runningMode: mode, numPoses: 1 })
  try {
    return await PoseLandmarker.createFromOptions(vision, options('GPU'))
  } catch {
    return PoseLandmarker.createFromOptions(vision, options('CPU'))
  }
}

export async function ouvrirCamera(face = 'user') {
  return navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: face }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
}

export const messageErreurCamera = (e) =>
  e?.name === 'NotAllowedError'
    ? 'La caméra a été refusée. Autorise-la dans les réglages du navigateur, puis réessaie.'
    : 'Impossible de démarrer la caméra sur cet appareil. Essaie avec Chrome ou Safari, sur une tablette ou un ordinateur avec caméra.'

// Étiquette arrondie sur un canvas : « la » (couleur du genre) + « tête »
export function etiquette(ctx, x, y, article, mot, couleur, taille = 18, ancre = null) {
  ctx.save()
  ctx.font = `800 ${taille}px "Space Grotesk", system-ui, sans-serif`
  const espace = article.endsWith('’') ? 0 : taille * 0.3
  const wa = ctx.measureText(article).width
  const wm = ctx.measureText(mot).width
  const w = wa + espace + wm + taille * 1.1
  const h = taille * 1.75
  const bx = Math.max(4, Math.min(ctx.canvas.clientWidth - w - 4, x - w / 2))
  const by = y - h / 2
  if (ancre) {
    ctx.strokeStyle = couleur
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(ancre.x, ancre.y)
    ctx.lineTo(bx + w / 2, by + h / 2)
    ctx.stroke()
    ctx.fillStyle = couleur
    ctx.beginPath()
    ctx.arc(ancre.x, ancre.y, 5, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.shadowColor = 'rgba(0,0,0,.5)'
  ctx.shadowBlur = 8
  ctx.fillStyle = 'rgba(7,11,22,.9)'
  ctx.beginPath()
  ctx.roundRect(bx, by, w, h, h / 2)
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.strokeStyle = couleur
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.textBaseline = 'middle'
  ctx.fillStyle = couleur
  ctx.fillText(article, bx + taille * 0.55, by + h / 2 + 1)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillText(mot, bx + taille * 0.55 + wa + espace, by + h / 2 + 1)
  ctx.restore()
}
