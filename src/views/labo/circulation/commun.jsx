// Éléments communs aux paillasses du système circulatoire
import CadreJeu from '../../../components/labo/CadreJeu.jsx'

export const ROSE = '#FF4D6D'
export const AZUR = '#4DA3FF'
export const ROUGE_SANG = '#E8394A'
export const BLEU_SANG = '#3D6FF0'

// Attendus du référentiel P5-P6 travaillés dans ce chapitre
// (« Les liens entre les systèmes respiratoire, circulatoire et digestif »)
export const ATTENDUS = {
  66: 'Expliquer le rôle du cœur, des différents types de vaisseaux (veines et artères) et du sang',
  67: 'Préciser que les nutriments, le dioxygène et le dioxyde de carbone sont transportés dans l’organisme par le sang',
  68: 'Évaluer le rythme cardiaque, avant et après l’effort, et l’interpréter (chronomètre, répéter et faire une moyenne)',
  69: 'Représenter, décrire et expliquer les interactions entre les systèmes circulatoire, digestif et respiratoire',
  70: 'Utiliser le vocabulaire : cœur, sang, vaisseaux sanguins, veine, artère, rythme cardiaque',
}

// Cadre d'une paillasse du système circulatoire : couleurs rouge sang / bleu
export function PageCirc(props) {
  return <CadreJeu rgb="255,77,109" rgb2="77,163,255" couleur={ROSE} {...props} />
}

export function Consigne({ children, couleur = ROSE }) {
  return (
    <div className="rounded-2xl border px-3 py-2.5 text-[14px] leading-snug text-[#E8ECFF]" style={{ borderColor: `${couleur}55`, background: 'rgba(11,17,34,.88)' }}>
      {children}
    </div>
  )
}

// Petit sélecteur à onglets (modes d'une paillasse)
export function Onglets({ valeur, onChange, options, couleur = ROSE }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-2xl border border-white/15 bg-[#0B1122]/90 p-1">
      {options.map(([v, Icone, nom]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className="flex h-10 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 text-[12.5px] font-bold"
          style={valeur === v ? { background: couleur, color: '#1A0508' } : { color: '#B9C1E3' }}
        >
          {Icone && <Icone size={15} />} {nom}
        </button>
      ))}
    </div>
  )
}

// Son d'un battement de cœur (« boum-tac ») synthétisé : 1er bruit = fermeture des valvules
// entre oreillettes et ventricules, 2e bruit = fermeture des valvules de l'aorte et de l'artère pulmonaire.
let audio = null
export function contexteAudio() {
  if (!audio) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    audio = new AC()
  }
  if (audio.state === 'suspended') audio.resume()
  return audio
}

export function boumTac(volume = 0.9, ecart = 0.32) {
  const ac = contexteAudio()
  if (!ac) return
  const bruit = (debut, freq, duree, fort) => {
    const o = ac.createOscillator()
    const g = ac.createGain()
    const f = ac.createBiquadFilter()
    o.type = 'sine'
    o.frequency.setValueAtTime(freq, debut)
    o.frequency.exponentialRampToValueAtTime(freq * 0.55, debut + duree)
    f.type = 'lowpass'
    f.frequency.value = 180
    g.gain.setValueAtTime(0.0001, debut)
    g.gain.exponentialRampToValueAtTime(fort * volume, debut + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, debut + duree)
    o.connect(f).connect(g).connect(ac.destination)
    o.start(debut)
    o.stop(debut + duree + 0.02)
  }
  const t = ac.currentTime + 0.01
  bruit(t, 62, 0.16, 1)
  bruit(t + ecart, 85, 0.11, 0.7)
}
