import { useEffect, useRef, useState } from 'react'

// =============================================================
//  Écran de mise à jour du LABO (remplace « Mise à jour du site… »
//  quand on est dans /labo) :
//  1. un erlenmeyer se remplit pendant que la nouvelle version se
//     télécharge VRAIMENT (la page d'accueil et ses fichiers /assets/
//     sont préchargés : le niveau suit le téléchargement) ;
//  2. quand tout est chargé : ça déborde… puis BOUM ! ;
//  3. la page se recharge (onFini).
//  Un petit mot change pendant le chargement.
//  Aperçu sans mise à jour : /labo?apercu-maj
// =============================================================

const MOTS = ['Préparation de la potion…', 'Mélange des ingrédients…', 'Ça chauffe…', 'Ça bouillonne…', 'Encore une goutte…']
const DUREE_MIN = 2800 // le remplissage dure au moins ça (sinon on ne voit rien)
const DUREE_MAX = 9000 // sécurité : réseau lent ou coupé → on termine quand même
const DUREE_DEBORDE = 1300
const DUREE_BOUM = 1100

// Précharge la nouvelle version : la page d'accueil, puis ses fichiers (JS, CSS)
async function prechargerNouvelleVersion(onProgres) {
  const page = await fetch(`/?maj=${Date.now()}`, { cache: 'no-store' })
  const html = await page.text()
  const fichiers = [...new Set([...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]))]
  if (!fichiers.length) return onProgres(1)
  let faits = 0
  await Promise.all(
    fichiers.map((f) =>
      fetch(f)
        .then((r) => r.blob())
        .catch(() => null)
        .finally(() => onProgres(++faits / fichiers.length)),
    ),
  )
}

const INTERIEUR = 'M80 22 L80 99 L28.5 214.5 Q22.5 230 38 232 L162 232 Q177.5 230 171.5 214.5 L120 99 L120 22 Z'
const CONTOUR = 'M76 18 L76 98 L24 214 Q17 233 36 236 L164 236 Q183 233 176 214 L124 98 L124 18'
const HAUT = 22
const BAS = 232

const ECLATS = Array.from({ length: 16 }, (_, i) => {
  const a = (i / 16) * Math.PI * 2 + (i % 2 ? 0.2 : 0)
  const d = 140 + (i % 3) * 70
  return { x: Math.cos(a) * d, y: Math.sin(a) * d - 40, r: (i * 47) % 360, verre: i % 3 === 0, taille: 8 + (i % 4) * 4 }
})

export default function MiseAJourLabo({ onFini }) {
  const [phase, setPhase] = useState('remplit') // remplit | deborde | boum
  const [niveau, setNiveau] = useState(0) // 0 → 1 (affiché)
  const [mot, setMot] = useState(0)
  const charge = useRef(0) // 0 → 1 (téléchargement réel)
  const debut = useRef(performance.now())
  const reduit = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  // téléchargement réel de la nouvelle version
  useEffect(() => {
    prechargerNouvelleVersion((p) => (charge.current = Math.max(charge.current, p))).catch(() => (charge.current = 1))
  }, [])

  // le niveau monte en suivant le téléchargement (et au moins DUREE_MIN)
  useEffect(() => {
    if (phase !== 'remplit') return
    let raf
    const boucle = () => {
      const t = performance.now() - debut.current
      const temps = Math.min(1, t / (reduit ? 800 : DUREE_MIN))
      const cible = t > DUREE_MAX ? 1 : Math.min(temps, charge.current)
      setNiveau((n) => {
        const suivant = n + (cible - n) * 0.08 + (cible > n ? 0.002 : 0)
        return Math.min(cible, suivant)
      })
      raf = requestAnimationFrame(boucle)
    }
    raf = requestAnimationFrame(boucle)
    return () => cancelAnimationFrame(raf)
  }, [phase, reduit])

  // plein → ça déborde → boum → rechargement
  useEffect(() => {
    if (phase === 'remplit' && niveau >= 0.995) setPhase('deborde')
    if (phase === 'deborde') {
      const t = setTimeout(() => setPhase('boum'), reduit ? 300 : DUREE_DEBORDE)
      return () => clearTimeout(t)
    }
    if (phase === 'boum') {
      const t = setTimeout(() => onFini?.(), reduit ? 300 : DUREE_BOUM)
      return () => clearTimeout(t)
    }
  }, [phase, niveau, onFini, reduit])

  // le petit mot change pendant le remplissage
  useEffect(() => {
    if (phase !== 'remplit') return
    const t = setInterval(() => setMot((m) => (m + 1) % MOTS.length), 1100)
    return () => clearInterval(t)
  }, [phase])

  const y = BAS - niveau * (BAS - HAUT)
  const texte = phase === 'remplit' ? MOTS[mot] : phase === 'deborde' ? 'Oh oh… ça déborde !' : 'BOUM ! Le labo est à jour !'

  return (
    <div className="maj-labo" role="status" aria-live="polite">
      <style>{CSS}</style>
      <div className="maj-labo-halo" />
      {phase === 'boum' && <div className="maj-labo-flash" />}

      <p className="maj-labo-titre">MISE À JOUR DU LABO</p>

      <div className={`maj-labo-scene ${phase === 'deborde' ? 'maj-tremble' : ''} ${phase === 'boum' ? 'maj-explose' : ''}`}>
        <svg viewBox="-60 -40 320 300" className="maj-labo-fiole" aria-hidden="true">
          <defs>
            <linearGradient id="maj-liquide" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#C9FFB8" />
              <stop offset=".3" stopColor="#7CFF6B" />
              <stop offset="1" stopColor="#1FAE4A" />
            </linearGradient>
            <linearGradient id="maj-verre" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#CFF3FF" stopOpacity=".22" />
              <stop offset=".4" stopColor="#CFF3FF" stopOpacity=".04" />
              <stop offset="1" stopColor="#CFF3FF" stopOpacity=".18" />
            </linearGradient>
            <clipPath id="maj-interieur">
              <path d={INTERIEUR} />
            </clipPath>
            <filter id="maj-lueur" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
          </defs>

          {/* lueur au sol */}
          <ellipse cx="100" cy="246" rx={60 + niveau * 40} ry="9" fill="#7CFF6B" opacity={0.25 + niveau * 0.35} filter="url(#maj-lueur)" />

          {/* liquide qui monte, avec sa vague et ses bulles */}
          <g clipPath="url(#maj-interieur)">
            <rect x="0" y={y} width="200" height={BAS - y + 4} fill="url(#maj-liquide)" />
            <g className="maj-vague" style={{ transform: `translateY(${y}px)` }}>
              <path d="M-100 0 Q-75 -7 -50 0 T0 0 T50 0 T100 0 T150 0 T200 0 T250 0 T300 0 L300 8 L-100 8 Z" fill="#D8FFCF" opacity=".85" />
            </g>
            {[30, 62, 92, 118, 146, 170].map((x, i) => (
              <circle key={x} cx={x} cy="230" r={2 + (i % 3)} fill="none" stroke="#EFFFEA" strokeWidth="1.2" className="maj-bulle" style={{ animationDelay: `${i * 0.37}s`, '--haut': `${-(BAS - y) + 6}px` }} />
            ))}
          </g>

          {/* graduations */}
          {[0.25, 0.5, 0.75].map((g) => (
            <path key={g} d={`M${100 - 18} ${BAS - g * 150} L${100 + 18} ${BAS - g * 150}`} stroke="#D6F4FF" strokeOpacity=".35" strokeWidth="1.5" />
          ))}

          {/* le verre */}
          <path d={CONTOUR} fill="url(#maj-verre)" stroke="#D6F4FF" strokeOpacity=".7" strokeWidth="3" strokeLinejoin="round" />
          <rect x="70" y="10" width="60" height="10" rx="4" fill="#CFF3FF" fillOpacity=".18" stroke="#D6F4FF" strokeOpacity=".7" strokeWidth="2.5" />
          <path d="M86 30 L86 92" stroke="#FFFFFF" strokeOpacity=".35" strokeWidth="4" strokeLinecap="round" />

          {/* débordement : mousse + coulées le long du verre + flaque */}
          {phase !== 'remplit' && (
            <g>
              {[
                [78, 6, 12],
                [96, 0, 15],
                [116, 4, 13],
                [88, -10, 10],
                [108, -12, 11],
                [100, -22, 9],
              ].map(([cx, cy, r], i) => (
                <circle key={i} cx={cx} cy={cy} r={r} fill="#B8FFA6" className="maj-mousse" style={{ animationDelay: `${i * 0.08}s` }} />
              ))}
              <path d="M74 14 C62 26 66 60 56 110 S30 200 26 238" className="maj-coulee" />
              <path d="M126 14 C138 30 136 70 146 116 S170 200 174 238" className="maj-coulee" style={{ animationDelay: '.15s' }} />
              <ellipse cx="100" cy="242" rx="110" ry="9" fill="#7CFF6B" opacity=".75" className="maj-flaque" />
            </g>
          )}
        </svg>

        {/* explosion : éclats de verre et gouttes */}
        {phase === 'boum' && (
          <div className="maj-eclats">
            {ECLATS.map((e, i) => (
              <span
                key={i}
                className={e.verre ? 'maj-eclat-verre' : 'maj-goutte'}
                style={{ '--x': `${e.x}px`, '--y': `${e.y}px`, '--r': `${e.r}deg`, width: e.taille, height: e.taille }}
              />
            ))}
          </div>
        )}
      </div>

      <p className={`maj-labo-mot ${phase === 'boum' ? 'maj-labo-mot-boum' : ''}`} key={texte}>
        {texte}
      </p>
      <div className="maj-labo-barre">
        <div style={{ width: `${Math.round(niveau * 100)}%` }} />
      </div>
    </div>
  )
}

const CSS = `
.maj-labo { position: fixed; inset: 0; z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; background: #070b16; color: #E8ECFF; overflow: hidden; font-family: 'Space Grotesk', system-ui, sans-serif; }
.maj-labo-halo { position: absolute; width: 70vmin; height: 70vmin; border-radius: 50%; background: radial-gradient(circle, rgba(124,255,107,.22), rgba(181,123,255,.12) 45%, transparent 70%); filter: blur(10px); }
.maj-labo-titre { position: relative; margin: 0; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 12px; letter-spacing: .18em; color: #7CFF6B; }
.maj-labo-scene { position: relative; width: min(62vmin, 340px); aspect-ratio: 320 / 300; }
.maj-labo-fiole { width: 100%; height: 100%; overflow: visible; }
.maj-labo-mot { position: relative; margin: 6px 0 0; min-height: 1.4em; font-family: 'Lilita One', 'Unbounded', system-ui, sans-serif; font-size: clamp(22px, 4.2vmin, 34px); color: #E8FFE2; text-align: center; animation: maj-mot .35s ease-out; text-shadow: 0 0 18px rgba(124,255,107,.5); }
.maj-labo-mot-boum { color: #FFE45E; font-size: clamp(28px, 6vmin, 46px); text-shadow: 0 0 24px rgba(255,228,94,.7); }
.maj-labo-barre { position: relative; width: min(60vmin, 320px); height: 8px; border-radius: 99px; background: rgba(255,255,255,.08); overflow: hidden; }
.maj-labo-barre > div { height: 100%; border-radius: 99px; background: linear-gradient(90deg, #1FAE4A, #7CFF6B, #C9FFB8); box-shadow: 0 0 12px #7CFF6B; }
@keyframes maj-mot { from { opacity: 0; transform: translateY(8px) scale(.96); } to { opacity: 1; transform: none; } }
.maj-vague { animation: maj-vague 1.6s linear infinite; }
@keyframes maj-vague { from { translate: 0 0; } to { translate: -100px 0; } }
.maj-bulle { animation: maj-bulle 1.9s ease-in infinite; }
@keyframes maj-bulle { 0% { transform: translateY(0); opacity: 0; } 15% { opacity: .9; } 100% { transform: translateY(var(--haut, -60px)); opacity: 0; } }
.maj-mousse { transform-box: fill-box; transform-origin: center; animation: maj-mousse .5s cubic-bezier(.2,1.6,.4,1) both, maj-gonfle .6s ease-in-out .5s infinite alternate; }
@keyframes maj-mousse { from { transform: scale(0); } to { transform: scale(1); } }
@keyframes maj-gonfle { to { transform: scale(1.18); } }
.maj-coulee { fill: none; stroke: #7CFF6B; stroke-width: 9; stroke-linecap: round; stroke-dasharray: 320; stroke-dashoffset: 320; filter: drop-shadow(0 0 6px #7CFF6B); animation: maj-coulee 1.1s ease-in forwards; }
@keyframes maj-coulee { to { stroke-dashoffset: 0; } }
.maj-flaque { transform-box: fill-box; transform-origin: center; animation: maj-flaque 1.2s ease-out .6s both; }
@keyframes maj-flaque { from { transform: scaleX(0); opacity: 0; } to { transform: scaleX(1); opacity: .75; } }
.maj-tremble { animation: maj-tremble .12s linear infinite; }
@keyframes maj-tremble { 0% { transform: translate(0,0) rotate(0); } 25% { transform: translate(-3px,1px) rotate(-1.5deg); } 50% { transform: translate(2px,-2px) rotate(1deg); } 75% { transform: translate(-2px,2px) rotate(-.5deg); } 100% { transform: translate(3px,0) rotate(1.5deg); } }
.maj-explose .maj-labo-fiole { animation: maj-boum-fiole .35s ease-out forwards; }
@keyframes maj-boum-fiole { 0% { transform: scale(1); opacity: 1; } 40% { transform: scale(1.25); opacity: 1; filter: brightness(2.5); } 100% { transform: scale(1.6); opacity: 0; } }
.maj-labo-flash { position: absolute; inset: 0; z-index: 2; pointer-events: none; background: radial-gradient(circle at 50% 48%, #FFFFFF, rgba(201,255,184,.9) 20%, rgba(124,255,107,.5) 40%, rgba(181,123,255,.25) 60%, transparent 80%); animation: maj-flash 1s ease-out forwards; }
@keyframes maj-flash { 0% { opacity: 0; transform: scale(.3); } 15% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(1.6); } }
.maj-eclats { position: absolute; left: 50%; top: 55%; z-index: 3; }
.maj-eclat-verre, .maj-goutte { position: absolute; left: 0; top: 0; animation: maj-eclat .9s cubic-bezier(.1,.7,.3,1) forwards; }
.maj-eclat-verre { background: linear-gradient(135deg, rgba(214,244,255,.95), rgba(214,244,255,.3)); clip-path: polygon(0 0, 100% 30%, 60% 100%); }
.maj-goutte { border-radius: 50%; background: #7CFF6B; box-shadow: 0 0 10px #7CFF6B; }
@keyframes maj-eclat { from { transform: translate(0,0) rotate(0) scale(1); opacity: 1; } to { transform: translate(var(--x), var(--y)) rotate(var(--r)) scale(.6); opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  .maj-vague, .maj-bulle, .maj-tremble, .maj-mousse, .maj-labo-mot { animation: none; }
}
`
