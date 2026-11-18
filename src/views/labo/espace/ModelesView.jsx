import { useEffect, useRef, useState } from 'react'
import { Hourglass, Orbit as OrbitIcon, Telescope } from 'lucide-react'
import { Carte, Duo, Eclat } from '../../../components/labo/CadreJeu.jsx'
import { OR, ORANGE } from '../../../components/labo/espace/donnees.js'
import { BoutonLecture, Onglets, OrdreCartes, PageEspace } from './commun.jsx'

// =============================================================
//  S11 · Modèles — comment on a compris que la Terre tourne autour du Soleil.
//  Jeu 1 : la chronologie des idées (Terre plate → Terre ronde → modèles de Ptolémée / Copernic → Kepler → Galilée).
//  Jeu 2 : le mouvement de Mars vu de la Terre. Mars semble parfois reculer (« rétrogradation ») :
//     – modèle héliocentrique : la Terre (plus rapide) double Mars, comme une voiture double une autre ;
//     – modèle de Ptolémée : il faut un « épicycle » (petit cercle) pour imiter la même chose.
//  Calcul : Terre à 1 UA, 365,25 j ; Mars à 1,524 UA, 687 j ; opposition à t = 390 j ;
//     direction apparente λ = atan2(Mars − Terre). Géocentrique : Mars = 1,524·e^{iθm} + 1·e^{i(θt+π)} (déférent + épicycle).
//  Attendus 99, 106, 107 (voir le référentiel P5-P6 §3.1).
// =============================================================
const SUIVANT = [
  ['plate', 'Terre plate', 'avant −500', 'Beaucoup de peuples pensaient la Terre plate.', '#C9B6A3'],
  ['aristote', 'Aristote', 'vers −350', 'Il prouve que la Terre est ronde (son ombre sur la Lune est ronde) mais la place au centre.', '#FFD27A'],
  ['aristarque', 'Aristarque', 'vers −270', 'Il a l’idée géniale : le Soleil est au centre ! Personne ne le suit.', '#7CFFB5'],
  ['ptolemee', 'Ptolémée', 'vers 150', 'Il calcule très bien le mouvement des astres… avec la Terre au centre et des « épicycles ».', '#FF8A6B'],
  ['copernic', 'Copernic', '1543', 'Il remet le Soleil au centre : les planètes, dont la Terre, tournent autour.', '#FFA24D'],
  ['kepler', 'Kepler', '1609', 'Les orbites ne sont pas des cercles mais des ellipses.', '#E56BFF'],
  ['galilee', 'Galilée', '1610', 'Sa lunette montre des lunes autour de Jupiter et les phases de Vénus : le Soleil est bien au centre.', '#FFE27A'],
]
const ORDRE = SUIVANT.map((x) => x[0])

function Icone({ id }) {
  const c = SUIVANT.find((x) => x[0] === id)[4]
  const s = { fill: 'none', stroke: c, strokeWidth: 2 }
  return (
    <svg width="46" height="46" viewBox="0 0 46 46" aria-hidden="true">
      {id === 'plate' && (<g><ellipse cx="23" cy="20" rx="19" ry="6" fill={c} opacity=".85" /><rect x="4" y="20" width="38" height="6" fill={c} opacity=".5" /><ellipse cx="23" cy="26" rx="19" ry="5" fill={c} opacity=".4" /></g>)}
      {id === 'aristote' && (<g><circle cx="23" cy="23" r="9" fill="#7FE3A0" /><circle cx="23" cy="23" r="19" {...s} strokeDasharray="3 3" /><circle cx="37" cy="14" r="4" fill="#FFD27A" /></g>)}
      {id === 'aristarque' && (<g><circle cx="23" cy="23" r="8" fill="#FFB347" /><circle cx="23" cy="23" r="17" {...s} strokeDasharray="3 3" /><circle cx="36" cy="14" r="3.5" fill="#7FE3A0" /></g>)}
      {id === 'ptolemee' && (<g><circle cx="23" cy="23" r="4" fill="#7FE3A0" /><circle cx="23" cy="23" r="16" {...s} /><circle cx="35" cy="14" r="7" {...s} /><circle cx="39" cy="10" r="2.5" fill={c} /></g>)}
      {id === 'copernic' && (<g><circle cx="23" cy="23" r="6" fill="#FFB347" /><circle cx="23" cy="23" r="12" {...s} /><circle cx="23" cy="23" r="19" {...s} /><circle cx="35" cy="23" r="3" fill="#7FE3A0" /></g>)}
      {id === 'kepler' && (<g><ellipse cx="23" cy="23" rx="19" ry="11" {...s} /><circle cx="10" cy="23" r="4" fill="#FFB347" /><circle cx="38" cy="19" r="2.8" fill="#7FE3A0" /></g>)}
      {id === 'galilee' && (<g transform="translate(5 5) scale(1.45)"><Telescope size={24} color={c} strokeWidth={2} /></g>)}
    </svg>
  )
}

const CARTES = SUIVANT.map(([id, nom, date, texte, couleur]) => ({
  id, nom, sous: null, date, couleur, texte,
  visuel: (
    <span className="flex flex-col items-center">
      <Icone id={id} />
      <span className="labo-mono text-[10px] leading-none text-[#B9C1E3]">{date}</span>
    </span>
  ),
}))

// ---------- Mars vu de la Terre ----------
const T_OPP = 390
const PH = 2 * Math.PI * T_OPP * (1 / 365.25 - 1 / 687)
const terre = (t) => { const a = (2 * Math.PI * t) / 365.25; return [Math.cos(a), Math.sin(a)] }
const mars = (t) => { const a = (2 * Math.PI * t) / 687 + PH; return [1.524 * Math.cos(a), 1.524 * Math.sin(a)] }
const lam = (t) => { const [ex, ey] = terre(t); const [mx, my] = mars(t); return (Math.atan2(my - ey, mx - ex) * 180) / Math.PI }
const L0 = lam(T_OPP)
const rel = (t) => ((lam(t) - L0 + 540) % 360) - 180
const T_MIN = 250
const T_MAX = 530
const COURBE = (() => { const l = []; for (let t = T_MIN; t <= T_MAX; t += 2) l.push([t, rel(t)]); return l })()
const L_MIN = Math.min(...COURBE.map((x) => x[1]))
const L_MAX = Math.max(...COURBE.map((x) => x[1]))

function MarsDemo({ modele, t }) {
  const K = 74
  const cx = 200
  const cy = 200
  const P = ([x, y]) => [cx + x * K, cy - y * K]
  const [ex, ey] = P(terre(t))
  const [mx, my] = P(mars(t))
  // trace de Mars dans le modèle choisi (60 derniers jours)
  const trace = []
  for (let u = t - 90; u <= t; u += 3) {
    if (modele === 'helio') trace.push(P(mars(u)))
    else {
      // géocentrique : Mars vu depuis la Terre (Terre au centre)
      const [a, b] = terre(u)
      const [m1, m2] = mars(u)
      trace.push([cx + (m1 - a) * K, cy - (m2 - b) * K])
    }
  }
  // géocentrique : déférent (1,524) centré sur la Terre ; épicycle (1) autour du point D
  const aM = (2 * Math.PI * t) / 687 + PH
  const aT = (2 * Math.PI * t) / 365.25
  const D = [cx + 1.524 * K * Math.cos(aM), cy - 1.524 * K * Math.sin(aM)]
  const M = [D[0] + K * Math.cos(aT + Math.PI), D[1] - K * Math.sin(aT + Math.PI)]
  const recule = rel(t + 1) < rel(t - 1)
  return (
    <svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full" role="img" aria-label="Mars vu de la Terre">
      {modele === 'helio' ? (
        <g>
          <circle cx={cx} cy={cy} r={K} fill="none" stroke="rgba(127,227,160,.5)" />
          <circle cx={cx} cy={cy} r={K * 1.524} fill="none" stroke="rgba(226,123,88,.5)" />
          <circle cx={cx} cy={cy} r="11" fill="#FFB347" />
          <circle cx={cx} cy={cy} r="18" fill="#FFB347" opacity=".25" />
          <polyline points={trace.map((p) => p.join(',')).join(' ')} fill="none" stroke="#E27B58" strokeWidth="2" opacity=".7" />
          <line x1={ex} y1={ey} x2={ex + (mx - ex) * 2.1} y2={ey + (my - ey) * 2.1} stroke={recule ? '#FF6B7A' : '#FFE27A'} strokeWidth="1.8" strokeDasharray="5 4" />
          <circle cx={ex} cy={ey} r="8" fill="#7FE3A0" />
          <circle cx={mx} cy={my} r="6.5" fill="#E27B58" />
          <text x={ex} y={ey - 13} textAnchor="middle" fontSize="13" fill="#7FE3A0" className="labo-jeu">Terre</text>
          <text x={mx} y={my - 12} textAnchor="middle" fontSize="13" fill="#E27B58" className="labo-jeu">Mars</text>
          <text x={cx} y={cy + 30} textAnchor="middle" fontSize="12" fill="#FFD27A" className="labo-jeu">Soleil</text>
        </g>
      ) : (
        <g>
          <circle cx={cx} cy={cy} r={K * 1.524} fill="none" stroke="rgba(255,138,107,.5)" />
          <circle cx={D[0]} cy={D[1]} r={K} fill="none" stroke="rgba(255,226,122,.55)" strokeDasharray="4 3" />
          <polyline points={trace.map((p) => p.join(',')).join(' ')} fill="none" stroke="#E27B58" strokeWidth="2" opacity=".7" />
          <line x1={cx} y1={cy} x2={D[0]} y2={D[1]} stroke="rgba(255,255,255,.25)" />
          <line x1={cx} y1={cy} x2={M[0]} y2={M[1]} stroke={recule ? '#FF6B7A' : '#FFE27A'} strokeWidth="1.8" strokeDasharray="5 4" />
          <circle cx={cx} cy={cy} r="9" fill="#7FE3A0" />
          <circle cx={D[0]} cy={D[1]} r="3" fill="#FFE27A" />
          <circle cx={M[0]} cy={M[1]} r="6.5" fill="#E27B58" />
          <text x={cx} y={cy + 24} textAnchor="middle" fontSize="13" fill="#7FE3A0" className="labo-jeu">Terre (au centre)</text>
          <text x={M[0]} y={M[1] - 12} textAnchor="middle" fontSize="13" fill="#E27B58" className="labo-jeu">Mars</text>
          <text x={D[0] + K * 0.75} y={D[1] - K * 0.8} fontSize="11" fill="#FFE27A">épicycle</text>
        </g>
      )}
    </svg>
  )
}

function Ciel({ t }) {
  const W = 400
  const H = 150
  const X = (tt) => 10 + ((tt - T_MIN) / (T_MAX - T_MIN)) * (W - 20)
  const Y = (l) => H - 18 - ((l - L_MIN) / (L_MAX - L_MIN)) * (H - 36)
  const r = rel(t)
  const seg = []
  let cur = null
  COURBE.forEach(([tt, l], i) => {
    const recul = i > 0 && l < COURBE[i - 1][1]
    if (!cur || cur.recul !== recul) { cur = { recul, pts: i > 0 ? [COURBE[i - 1]] : [] }; seg.push(cur) }
    cur.pts.push([tt, l])
  })
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" role="img" aria-label="Position de Mars parmi les étoiles au cours du temps">
      <text x="8" y="12" fontSize="11" fill="#B9C1E3">Position de Mars parmi les étoiles →</text>
      {seg.map((s, i) => <polyline key={i} points={s.pts.map(([tt, l]) => `${X(tt)},${Y(l)}`).join(' ')} fill="none" stroke={s.recul ? '#FF6B7A' : '#FFE27A'} strokeWidth={s.recul ? 3.5 : 2} />)}
      <line x1={X(t)} y1="16" x2={X(t)} y2={H - 8} stroke="rgba(255,255,255,.3)" />
      <circle cx={X(t)} cy={Y(r)} r="6" fill="#E27B58" stroke="#fff" strokeWidth="1.5" />
      <text x={W - 8} y={H - 3} textAnchor="end" fontSize="10" fill="#8A93B8">temps →</text>
    </svg>
  )
}

export default function ModelesView() {
  const [onglet, setOnglet] = useState('chrono')
  const [cle, setCle] = useState(0)
  const [fin, setFin] = useState(null)
  const [modele, setModele] = useState('helio')
  const [t, setT] = useState(300)
  const [joue, setJoue] = useState(false)
  const ref = useRef({ t: 300, joue: false })
  const [eclat, setEclat] = useState({ message: '', cle: 0 })

  useEffect(() => {
    let raf
    let der = performance.now()
    const boucle = (now) => {
      raf = requestAnimationFrame(boucle)
      const dt = Math.min(0.05, (now - der) / 1000)
      der = now
      if (ref.current.joue) {
        ref.current.t += dt * 28
        if (ref.current.t > T_MAX) ref.current.t = T_MIN
        setT(ref.current.t)
      }
    }
    raf = requestAnimationFrame(boucle)
    return () => cancelAnimationFrame(raf)
  }, [])

  const recule = rel(t + 1) < rel(t - 1)
  const jouer = () => { ref.current.joue = !joue; setJoue(!joue) }
  const termine = (erreurs) => { setFin({ erreurs }); setEclat((c) => ({ message: erreurs === 0 ? 'Parfait !' : 'Bravo !', cle: c.cle + 1 })) }

  return (
    <PageEspace code="S11" titre="Modèles" attendus={[99,106,107]} ecran large>
      <Eclat message={eclat.message} cle={eclat.cle} couleur="#FFE27A" />
      <Duo
        visuelDabord
        commandes={
          <>
            <Onglets valeur={onglet} onChange={setOnglet} couleur={ORANGE} options={[['chrono', Hourglass, 'Histoire'], ['mars', OrbitIcon, 'Mars recule ?']]} />
            {onglet === 'chrono' && !fin && (
              <Carte couleur="rgba(166,107,255,.4)" className="!p-3">
                <p className="labo-jeu text-[20px] leading-snug text-white">Remets les idées dans l’ordre du temps.</p>
                <p className="mt-1 text-[12px] text-[#B9C1E3]">Les dates t’aident : « −350 » veut dire 350 ans avant notre ère.</p>
              </Carte>
            )}
            {onglet === 'chrono' && fin && (
              <Carte couleur="rgba(255,226,122,.5)" className="!p-3">
                <p className="labo-jeu text-[24px]" style={{ color: OR }}>{fin.erreurs === 0 ? 'Parfait !' : 'Bravo !'}</p>
                <ul className="mt-2 grid gap-1.5">
                  {CARTES.map((c) => (
                    <li key={c.id} className="rounded-xl bg-[#0B0A1E]/80 px-2.5 py-1.5 text-[12px] leading-snug">
                      <span className="labo-jeu text-[14px]" style={{ color: c.couleur }}>{c.nom}</span> <span className="text-[#B9C1E3]">· {c.date}</span>
                      <br /><span className="text-[#E8ECFF]">{c.texte}</span>
                    </li>
                  ))}
                </ul>
                <button type="button" onClick={() => { setFin(null); setCle((c) => c + 1) }} className="mt-3 min-h-[48px] w-full rounded-2xl text-[15px] font-bold active:scale-95" style={{ background: ORANGE, color: '#12062A' }}>Rejouer</button>
              </Carte>
            )}
            {onglet === 'mars' && (
              <>
                <div className="flex rounded-2xl border border-white/15 bg-[#0B0A1E]/90 p-1">
                  {[['helio', 'Soleil au centre'], ['geo', 'Terre au centre']].map(([v, nom]) => (
                    <button key={v} type="button" onClick={() => setModele(v)} className="h-11 flex-1 rounded-xl px-2 text-[13px] font-bold" style={modele === v ? { background: ORANGE, color: '#12062A' } : { color: '#B9C1E3' }}>{nom}</button>
                  ))}
                </div>
                <Carte couleur={recule ? 'rgba(255,107,122,.6)' : 'rgba(255,226,122,.4)'} className="!p-3">
                  <p className="labo-jeu text-[24px] leading-tight" style={{ color: recule ? '#FF8A96' : OR }}>{recule ? 'Mars semble reculer !' : 'Mars avance'}</p>
                  <p className="mt-1 text-[12.5px] leading-snug text-[#E8ECFF]">
                    {modele === 'helio' ? (recule ? 'La Terre, plus rapide, double Mars : comme une voiture qui en double une autre, l’autre semble reculer. En vrai, Mars avance toujours.' : 'Mars et la Terre tournent autour du Soleil. Regarde la droite pointillée : c’est ce que voit la Terre.') : 'Avec la Terre au centre, il faut inventer un petit cercle (l’épicycle) sur lequel Mars tourne pour retrouver ce recul. Ça marche, mais c’est compliqué.'}
                  </p>
                </Carte>
                <div className="flex items-center gap-2">
                  <BoutonLecture joue={joue} couleur={ORANGE} onClick={jouer} />
                  <input type="range" min={T_MIN} max={T_MAX} step={1} value={Math.round(t)} onChange={(e) => { ref.current.t = Number(e.target.value); ref.current.joue = false; setJoue(false); setT(Number(e.target.value)) }} className="h-10 flex-1" style={{ accentColor: ORANGE }} aria-label="Temps" />
                </div>
                <p className="labo-mono text-[10px] leading-snug text-[#8A93B8]">Les deux modèles donnent le même mouvement. Mais seul le Soleil au centre explique aussi les phases de Vénus et les lunes de Jupiter vues par Galilée.</p>
              </>
            )}
          </>
        }
      >
        {onglet === 'chrono' ? (
          <OrdreCartes key={cle} cartes={CARTES} ordre={ORDRE} colonnes={4} onFin={termine} />
        ) : (
          <div className="flex flex-col gap-2 tab:min-h-0 tab:flex-1">
            <div className="relative h-[40vh] min-h-[250px] overflow-hidden rounded-3xl border border-white/12 bg-[#05030f]/35 tab:h-auto tab:min-h-0 tab:flex-1">
              <MarsDemo modele={modele} t={t} />
              <span className="labo-mono pointer-events-none absolute right-3 top-3 rounded-full border border-white/20 bg-black/50 px-2.5 py-1 text-[10px] text-[#DDE2F7]">Vue du dessus</span>
            </div>
            <div className="h-[130px] flex-none overflow-hidden rounded-3xl border border-white/12 bg-[#05030f]/50 p-1.5">
              <Ciel t={t} />
            </div>
          </div>
        )}
      </Duo>
    </PageEspace>
  )
}
