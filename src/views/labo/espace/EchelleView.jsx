import { useEffect, useRef, useState } from 'react'
import { Circle, MoveHorizontal, Play, Zap } from 'lucide-react'
import { Carte, Duo } from '../../../components/labo/CadreJeu.jsx'
import { C_LUMIERE, LUNE, PLANETES, SOLEIL, TERRE, dureeLumiere, nombre, OR, ORANGE } from '../../../components/labo/espace/donnees.js'
import { Curseur, Onglets, PageEspace } from './commun.jsx'

// =============================================================
//  S8 · Échelle — la seule activité « À L'ÉCHELLE » : les tailles, les distances (Soleil = ballon d'1 m) et la vitesse de la lumière.
//  Échelle des tailles : 1 000 km = 1 px  (Jupiter 140 px, Terre 12,7 px, Soleil 1 393 px).
//  Échelle des distances : Soleil = 1 m de diamètre → 1 million de km = 0,718 m ; Terre = 9 mm à 107 m ; Neptune = 3,5 cm à 3,2 km.
//  Lumière : 299 792 km/s ; Soleil → Terre = 8 min 19 s.
//  Attendus 99, 100 (voir le référentiel P5-P6 §3.1).
// =============================================================
const M_PAR_MKM = 1 / (SOLEIL.diamKm / 1e6) // mètres par million de km quand le Soleil mesure 1 m
const distM = (p) => p.distMkm * M_PAR_MKM
const tailleCm = (diamKm) => (diamKm / SOLEIL.diamKm) * 100
const fmtCm = (cm) => (cm < 1 ? `${nombre(cm * 10, 1)} mm` : cm < 100 ? `${nombre(cm, 1)} cm` : `${nombre(cm / 100, 2)} m`)
const fmtM = (m) => (m < 1000 ? `${nombre(m, 0)} m` : `${nombre(m / 1000, 2)} km`)
const fmtTemps = (s) => (s < 60 ? `${Math.round(s)} s` : s < 3600 ? `${Math.floor(s / 60)} min ${String(Math.round(s % 60)).padStart(2, '0')} s` : `${Math.floor(s / 3600)} h ${String(Math.round((s % 3600) / 60)).padStart(2, '0')} min`)
// Soleil et Lune : même format que les planètes, pour avoir la même fiche
const ASTRE_SOLEIL = { id: 'soleil', nom: 'Soleil', diamKm: SOLEIL.diamKm, distMkm: 0, couleur: '#FFB347', texture: 'soleil' }
const ASTRE_LUNE = { id: 'lune', nom: 'Lune', diamKm: LUNE.diamKm, distMkm: PLANETES[2].distMkm, couleur: '#D9DAE8', texture: 'lune' }
const TOUS = [ASTRE_SOLEIL, ...PLANETES, ASTRE_LUNE]
const LUNE_CM = (LUNE.distKm / SOLEIL.diamKm) * 100 // distance Terre–Lune quand le Soleil mesure 1 m : 27,6 cm
const AIDE_TAILLE_LUNE = 'une tête d’épingle'
const AIDE_TAILLE = { mercure: 'un grain de riz', venus: 'un petit pois', terre: 'un petit pois', mars: 'un grain de riz', jupiter: 'un pamplemousse', saturne: 'une orange', uranus: 'une prune', neptune: 'une prune' }

// ---------- 1 · Tailles (1 000 km = 1 px) ----------
const POS_X = { mercure: 195, venus: 238, terre: 282, lune: 320, mars: 362, jupiter: 470, saturne: 695, uranus: 870, neptune: 945 }
const ORDRE_T = [PLANETES[0], PLANETES[1], PLANETES[2], ASTRE_LUNE, ...PLANETES.slice(3)]
const DY_T = { venus: 20, lune: 20, mars: 20 }
function Tailles({ choix, setChoix }) {
  const s = 1 / 1000
  const base = 300
  return (
    <svg viewBox="0 0 1000 420" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full" role="img" aria-label="Tailles des planètes à l’échelle">
      <defs>
        <radialGradient id="ech-soleil" cx="0.85" cy="0.5" r="0.9">
          <stop offset="0" stopColor="#FFE9A8" /><stop offset=".55" stopColor="#FFB347" /><stop offset="1" stopColor="#E8501A" />
        </radialGradient>
        <radialGradient id="ech-ombre" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stopColor="#fff" stopOpacity=".18" /><stop offset=".6" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".55" /></radialGradient>
        {ORDRE_T.map((p) => <clipPath key={p.id} id={`ech-clip-${p.id}`}><circle cx={POS_X[p.id]} cy={base - (p.diamKm * s) / 2} r={(p.diamKm * s) / 2} /></clipPath>)}
      </defs>
      <g onClick={() => setChoix('soleil')} style={{ cursor: 'pointer' }}>
        <circle cx={-560} cy={210} r={696} fill="url(#ech-soleil)" stroke={choix === 'soleil' ? '#FFA24D' : 'none'} strokeWidth="6" />
        <text x="18" y="48" className="labo-jeu" fontSize="30" fill="#7A2A00">Soleil</text>
        <text x="18" y="72" fontSize="13" fill="#7A2A00">1 392 700 km</text>
      </g>
      <line x1="150" y1={base} x2="1000" y2={base} stroke="rgba(255,255,255,.15)" />
      {ORDRE_T.map((p) => {
        const r = (p.diamKm * s) / 2
        const cx = POS_X[p.id]
        const cy = base - r
        const actif = choix === p.id
        return (
          <g key={p.id} onClick={() => setChoix(p.id)} style={{ cursor: 'pointer' }}>
            <circle cx={cx} cy={cy} r={Math.max(r + 9, 16)} fill="transparent" />
            {p.id === 'lune' && <circle cx={cx} cy={cy} r={r + 3} fill="none" stroke="#D9DAE8" strokeWidth="1" opacity=".7" />}
            {p.anneaux && <ellipse cx={cx} cy={cy} rx={r * 2.27} ry={r * 0.5} fill="none" stroke="#D9C49A" strokeWidth={r * 0.35} opacity=".55" transform={`rotate(-14 ${cx} ${cy})`} />}
            <image href={`/labo/espace/${p.texture}.jpg`} x={cx - r * 2} y={cy - r} width={r * 4} height={r * 2} preserveAspectRatio="none" clipPath={`url(#ech-clip-${p.id})`} />
            <circle cx={cx} cy={cy} r={r} fill="url(#ech-ombre)" />
            {actif && <circle cx={cx} cy={cy} r={r + 5} fill="none" stroke="#FFA24D" strokeWidth="2.5" />}
            <text x={cx} y={base + 22 + (DY_T[p.id] || 0)} textAnchor="middle" className="labo-jeu" fontSize={POS_X[p.id] < 400 ? 14 : 17} fill={actif ? '#FFA24D' : p.couleur}>{p.nom}</text>
          </g>
        )
      })}
      <text x="500" y="408" textAnchor="middle" fontSize="12" fill="#8A93B8">Échelle : 1 000 km = 1 pixel</text>
    </svg>
  )
}

// ---------- 2 · Distances (Soleil = ballon d'1 m) ----------
function DistancesLune({ pos, setChoix, choix }) {
  const max = 40 // cm
  const X = (cm) => 110 + (cm / max) * 780
  const rT = (TERRE.diamKm / SOLEIL.diamKm) * 100 // cm
  const rL = (LUNE.diamKm / SOLEIL.diamKm) * 100
  const eT = Math.max(rT * 3.2, 7) // un peu agrandis pour rester visibles
  const eL = Math.max(rL * 3.2, 3.2)
  return (
    <svg viewBox="0 0 1000 320" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full" role="img" aria-label="Distance Terre–Lune à l’échelle, Soleil = ballon d’un mètre">
      <line x1="110" y1="170" x2="890" y2="170" stroke="rgba(255,255,255,.3)" strokeWidth="2" />
      {[0, 10, 20, 30, 40].map((m) => (
        <g key={m}>
          <line x1={X(m)} y1="164" x2={X(m)} y2="176" stroke="rgba(255,255,255,.5)" />
          <text x={X(m)} y="198" textAnchor="middle" fontSize="13" fill="#B9C1E3">{m} cm</text>
        </g>
      ))}
      <g onClick={() => setChoix('terre')} style={{ cursor: 'pointer' }}>
        <circle cx={X(0)} cy="170" r="24" fill="transparent" />
        <circle cx={X(0)} cy="170" r={eT} fill={PLANETES[2].couleur} stroke={choix === 'terre' ? '#FFA24D' : 'none'} strokeWidth="3" />
        <text x={X(0)} y="132" textAnchor="middle" className="labo-jeu" fontSize="18" fill={PLANETES[2].couleur}>Terre</text>
        <text x={X(0)} y="116" textAnchor="middle" fontSize="12" fill="#B9C1E3">petit pois</text>
      </g>
      <g onClick={() => setChoix('lune')} style={{ cursor: 'pointer' }}>
        <circle cx={X(LUNE_CM)} cy="170" r="24" fill="transparent" />
        <circle cx={X(LUNE_CM)} cy="170" r={eL} fill={ASTRE_LUNE.couleur} stroke={choix === 'lune' ? '#FFA24D' : 'none'} strokeWidth="3" />
        <text x={X(LUNE_CM)} y="132" textAnchor="middle" className="labo-jeu" fontSize="18" fill={ASTRE_LUNE.couleur}>Lune</text>
        <text x={X(LUNE_CM)} y="116" textAnchor="middle" fontSize="12" fill="#B9C1E3">{AIDE_TAILLE_LUNE}</text>
        <text x={(X(0) + X(LUNE_CM)) / 2} y="246" textAnchor="middle" className="labo-jeu" fontSize="20" fill="#FFD27A">{nombre(LUNE_CM, 1)} cm = 384 400 km</text>
        <line x1={X(0)} y1="232" x2={X(LUNE_CM)} y2="232" stroke="#FFD27A" strokeWidth="2" />
      </g>
      <line x1={X(Math.min(pos, max))} y1="262" x2={X(Math.min(pos, max))} y2="296" stroke="#FFA24D" strokeWidth="2" />
      <polygon points={`${X(pos) - 9},300 ${X(pos) + 9},300 ${X(pos)},282`} fill="#FFA24D" />
      <text x={X(pos)} y="316" textAnchor="middle" className="labo-jeu" fontSize="17" fill="#FFA24D">Toi</text>
    </svg>
  )
}

function Distances({ vue, pos, setChoix, choix }) {
  if (vue === 'lune') return <DistancesLune pos={pos} setChoix={setChoix} choix={choix} />
  const max = vue === 'tout' ? 3300 : 180
  const X = (m) => 70 + (m / max) * 860
  const marques = vue === 'tout' ? [0, 500, 1000, 1500, 2000, 2500, 3000] : [0, 50, 100, 150]
  return (
    <svg viewBox="0 0 1000 320" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full" role="img" aria-label="Distances à l’échelle, Soleil = ballon d’un mètre">
      <line x1="70" y1="170" x2="930" y2="170" stroke="rgba(255,255,255,.3)" strokeWidth="2" />
      {marques.map((m) => (
        <g key={m}>
          <line x1={X(m)} y1="164" x2={X(m)} y2="176" stroke="rgba(255,255,255,.5)" />
          <text x={X(m)} y="198" textAnchor="middle" fontSize="13" fill="#B9C1E3">{m < 1000 ? `${m} m` : `${m / 1000} km`}</text>
        </g>
      ))}
      <g onClick={() => setChoix('soleil')} style={{ cursor: 'pointer' }}>
        <circle cx="70" cy="170" r="38" fill="#FFB347" opacity=".25" />
        <circle cx="70" cy="170" r="24" fill="#FFB347" stroke={choix === 'soleil' ? '#FFA24D' : 'none'} strokeWidth="3" />
      </g>
      <text x="70" y="124" textAnchor="middle" className="labo-jeu" fontSize="18" fill="#FFD27A">Soleil</text>
      <text x="70" y="106" textAnchor="middle" fontSize="12" fill="#B9C1E3">ballon d’1 m</text>
      {PLANETES.map((p, i) => {
        const m = distM(p)
        if (m > max) return null
        const x = X(m)
        const haut = i % 2 === 0
        const actif = choix === p.id
        return (
          <g key={p.id} onClick={() => setChoix(p.id)} style={{ cursor: 'pointer' }}>
            <circle cx={x} cy="170" r="20" fill="transparent" />
            <circle cx={x} cy="170" r={actif ? 9 : 6.5} fill={p.couleur} stroke={actif ? '#FFA24D' : 'none'} strokeWidth="3" />
            <line x1={x} y1="170" x2={x} y2={haut ? 142 : 218} stroke={p.couleur} opacity=".6" />
            <text x={x} y={haut ? 134 : 238} textAnchor="middle" className="labo-jeu" fontSize="16" fill={p.couleur}>{p.nom}</text>
            <text x={x} y={haut ? 118 : 256} textAnchor="middle" fontSize="12" fill="#B9C1E3">{fmtM(m)}</text>
          </g>
        )
      })}
      {pos <= max && (
        <g>
          <line x1={X(pos)} y1="262" x2={X(pos)} y2="296" stroke="#FFA24D" strokeWidth="2" />
          <polygon points={`${X(pos) - 9},300 ${X(pos) + 9},300 ${X(pos)},282`} fill="#FFA24D" />
          <text x={Math.min(Math.max(X(pos), 60), 940)} y="316" textAnchor="middle" className="labo-jeu" fontSize="17" fill="#FFA24D">Toi</text>
        </g>
      )}
    </svg>
  )
}

// ---------- 3 · Lumière ----------
function Lumiere({ t, setChoix }) {
  const dMkm = (t * C_LUMIERE) / 1e6
  const X = (mkm) => 70 + (mkm / 4495.1) * 860
  return (
    <svg viewBox="0 0 1000 300" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full" role="img" aria-label="La lumière du Soleil voyage vers les planètes">
      <line x1="70" y1="150" x2="930" y2="150" stroke="rgba(255,255,255,.25)" strokeWidth="2" />
      <circle cx="70" cy="150" r="22" fill="#FFB347" />
      <circle cx="70" cy="150" r="36" fill="#FFB347" opacity=".25" />
      <line x1="70" y1="150" x2={X(Math.min(dMkm, 4495.1))} y2="150" stroke="#FFE27A" strokeWidth="4" opacity=".85" />
      {PLANETES.map((p, i) => {
        const x = X(p.distMkm)
        const atteinte = dMkm >= p.distMkm
        const haut = i % 2 === 0
        return (
          <g key={p.id} onClick={() => setChoix(p.id)} style={{ cursor: 'pointer' }}>
            {atteinte && <circle cx={x} cy="150" r="17" fill="#FFE27A" opacity=".3" />}
            <circle cx={x} cy="150" r="7" fill={p.couleur} stroke={atteinte ? '#FFE27A' : 'none'} strokeWidth="2.5" />
            <text x={x} y={haut ? 108 : 202} textAnchor="middle" className="labo-jeu" fontSize="16" fill={p.couleur}>{p.nom}</text>
            <text x={x} y={haut ? 92 : 220} textAnchor="middle" fontSize="12" fill={atteinte ? '#FFE27A' : '#8A93B8'}>{dureeLumiere(p.distMkm)}</text>
          </g>
        )
      })}
      {dMkm <= 4495.1 && <circle cx={X(dMkm)} cy="150" r="9" fill="#FFFFFF" style={{ filter: 'drop-shadow(0 0 8px #FFE27A)' }} />}
    </svg>
  )
}

export default function EchelleView() {
  const [onglet, setOnglet] = useState('tailles')
  const [choix, setChoix] = useState('terre')
  const [vue, setVue] = useState('proche')
  const [pos, setPos] = useState(0)
  const [t, setT] = useState(0)
  const [joue, setJoue] = useState(false)
  const enCours = useRef({ joue: false, t: 0 })
  const planete = TOUS.find((p) => p.id === choix)
  const max = vue === 'tout' ? 3300 : vue === 'lune' ? 40 : 180

  useEffect(() => {
    let raf
    let der = performance.now()
    const boucle = (now) => {
      raf = requestAnimationFrame(boucle)
      const dt = Math.min(0.05, (now - der) / 1000)
      der = now
      const e = enCours.current
      if (e.joue) {
        e.t += dt * 1500 // 1 s à l'écran = 25 min réelles
        if (e.t > 15200) {
          e.t = 15200
          e.joue = false
          setJoue(false)
        }
        setT(e.t)
      }
    }
    raf = requestAnimationFrame(boucle)
    return () => cancelAnimationFrame(raf)
  }, [])

  function lancer() {
    enCours.current = { joue: true, t: 0 }
    setJoue(true)
    setT(0)
  }

  const marche = pos / (5000 / 3600) // secondes à 5 km/h

  return (
    <PageEspace code="S8" titre="Échelle" attendus={[99,100]} ecran large>
      <Duo
        visuelDabord
        commandes={
          <>
            <Onglets valeur={onglet} onChange={setOnglet} couleur={ORANGE} options={[['tailles', Circle, 'Tailles'], ['distances', MoveHorizontal, 'Distances'], ['lumiere', Zap, 'Lumière']]} />
            {onglet === 'tailles' && (
              <>
                <Carte couleur="rgba(255,179,71,.45)" className="!p-3">
                  <p className="labo-jeu text-[20px] leading-snug text-white">Le Soleil est énorme !</p>
                  <p className="mt-1 text-[13px] leading-snug text-[#E8ECFF]">Il faudrait aligner <b style={{ color: OR }}>109 Terres</b> pour traverser le Soleil. Et <b style={{ color: OR }}>1 300 000 Terres</b> tiendraient dedans.</p>
                </Carte>
                <Fiche p={planete} />
              </>
            )}
            {onglet === 'distances' && (
              <>
                <Carte couleur="rgba(255,179,71,.45)" className="!p-3">
                  <p className="text-[13px] leading-snug text-[#E8ECFF]">Imagine le Soleil en <b className="text-white">ballon d’1 mètre</b>. La Terre serait un <b className="text-white">petit pois de 9 mm</b>, à <b style={{ color: OR }}>107 mètres</b> !</p>
                </Carte>
                <div className="flex gap-2">
                  {[['proche', 'Proches'], ['tout', 'Tout le système'], ['lune', 'Terre–Lune']].map(([v, nom]) => (
                    <button key={v} type="button" onClick={() => { setVue(v); setPos(0); if (v === 'lune') setChoix('lune') }} className="min-h-[42px] flex-1 rounded-2xl border text-[13px] font-bold active:scale-95" style={vue === v ? { background: ORANGE, color: '#12062A', borderColor: ORANGE } : { color: '#FFD9B0', borderColor: '#FFA24D66', background: 'rgba(11,10,30,.85)' }}>{nom}</button>
                  ))}
                </div>
                {vue === 'lune' ? (
                  <>
                    <Curseur label="Ma règle depuis la Terre" valeur={pos} min={0} max={40} step={0.5} onChange={setPos} format={(v) => `${nombre(v, 1)} cm`} couleur={ORANGE} />
                    <Carte couleur="rgba(255,162,77,.35)" className="!p-3">
                      <p className="labo-mono text-[10px] text-[#B9C1E3]">EN VRAI, ÇA FAIT</p>
                      <p className="labo-jeu text-[26px] leading-none" style={{ color: OR }}>{nombre(Math.round((pos / LUNE_CM) * LUNE.distKm / 100) * 100)} km</p>
                      <p className="mt-1 text-[11px] text-[#B9C1E3]">La lumière met <b className="text-white">1,3 seconde</b> pour aller de la Terre à la Lune. Une fusée Apollo : environ <b className="text-white">3 jours</b>.</p>
                    </Carte>
                  </>
                ) : (
                  <>
                    <Curseur label="Ma marche depuis le Soleil" valeur={pos} min={0} max={max} step={vue === 'tout' ? 5 : 1} onChange={setPos} format={fmtM} couleur={ORANGE} />
                    <Carte couleur="rgba(255,162,77,.35)" className="!p-3">
                      <p className="labo-mono text-[10px] text-[#B9C1E3]">EN MARCHANT À 5 KM/H</p>
                      <p className="labo-jeu text-[26px] leading-none" style={{ color: OR }}>{fmtTemps(marche)}</p>
                      {vue === 'tout' && <p className="mt-1 text-[11px] text-[#B9C1E3]">Jusqu’à Neptune : <b className="text-white">{fmtTemps(distM(PLANETES[7]) / (5000 / 3600))}</b>.</p>}
                    </Carte>
                  </>
                )}
                <Fiche p={planete} taille />
              </>
            )}
            {onglet === 'lumiere' && (
              <>
                <Carte couleur="rgba(255,226,122,.45)" className="!p-3">
                  <p className="text-[13px] leading-snug text-[#E8ECFF]">La lumière va à <b className="text-white">300 000 km par seconde</b> : 7 tours de la Terre en 1 s ! Et pourtant, elle met <b style={{ color: OR }}>8 min 19 s</b> pour venir du Soleil.</p>
                </Carte>
                <button type="button" onClick={lancer} className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl text-[16px] font-bold active:scale-95" style={{ background: ORANGE, color: '#12062A' }}>
                  <Play size={20} /> {t > 0 ? 'Relancer la lumière' : 'Envoyer la lumière'}
                </button>
                <Carte couleur="rgba(255,162,77,.35)" className="!p-3">
                  <p className="labo-mono text-[10px] text-[#B9C1E3]">TEMPS RÉEL ÉCOULÉ</p>
                  <p className="labo-jeu text-[26px] leading-none" style={{ color: OR }}>{fmtTemps(t)}</p>
                  <p className="mt-1 text-[11px] text-[#B9C1E3]">Ici le temps est accéléré 1 500 fois.</p>
                </Carte>
                <Fiche p={planete} lumiere />
              </>
            )}
          </>
        }
      >
        <div className="relative h-[44vh] min-h-[260px] overflow-hidden rounded-3xl border border-white/12 bg-[#05030f]/35 tab:h-auto tab:min-h-0 tab:flex-1">
          {onglet === 'tailles' && <Tailles choix={choix} setChoix={setChoix} />}
          {onglet === 'distances' && <Distances vue={vue} pos={pos} choix={choix} setChoix={setChoix} />}
          {onglet === 'lumiere' && <Lumiere t={t} setChoix={setChoix} />}
          <span className="labo-mono pointer-events-none absolute right-3 top-3 rounded-full border border-white/20 bg-black/50 px-2.5 py-1 text-[10px] tracking-[.08em] text-[#DDE2F7]">{onglet === 'tailles' ? 'À l’échelle' : onglet === 'distances' ? 'À l’échelle · Soleil = 1 m' : 'Distances à l’échelle'}</span>
        </div>
      </Duo>
    </PageEspace>
  )
}

function Fiche({ p, taille = false, lumiere = false }) {
  const m = p.distMkm * M_PAR_MKM
  const soleil = p.id === 'soleil'
  const lune = p.id === 'lune'
  return (
    <Carte couleur={`${p.couleur}77`} className="!p-3">
      <p className="labo-jeu text-[22px] leading-none" style={{ color: p.couleur }}>{p.nom}</p>
      <p className="mt-1 text-[13px] leading-snug text-[#E8ECFF]">
        {lumiere ? (
          soleil ? (
            <>C’est <b style={{ color: OR }}>la source de lumière</b> : elle part d’ici et atteint la Terre en 8 min 19 s.</>
          ) : lune ? (
            <>La Lune ne brille pas : elle <b style={{ color: OR }}>renvoie la lumière du Soleil</b>. Cette lumière met 8 min 19 s pour venir, puis <b style={{ color: OR }}>1,3 s</b> pour aller de la Lune à la Terre.</>
          ) : (
            <>Lumière du Soleil : <b style={{ color: OR }}>{dureeLumiere(p.distMkm)}</b> ({nombre(p.distMkm, 1)} millions de km).</>
          )
        ) : taille ? (
          soleil ? (
            <>À cette échelle, <b style={{ color: OR }}>c’est le ballon d’1 mètre</b> : tout le reste se mesure par rapport à lui.</>
          ) : lune ? (
            <>À cette échelle : {fmtCm(tailleCm(p.diamKm))} (comme {AIDE_TAILLE_LUNE}), à <b style={{ color: OR }}>{nombre(LUNE_CM, 1)} cm</b> de la Terre.</>
          ) : (
            <>À cette échelle : {fmtCm(tailleCm(p.diamKm))} (comme {AIDE_TAILLE[p.id]}), à <b style={{ color: OR }}>{fmtM(m)}</b> du Soleil.</>
          )
        ) : (
          <>{nombre(p.diamKm)} km de diamètre : <b style={{ color: OR }}>{nombre(p.diamKm / TERRE.diamKm, p.diamKm / TERRE.diamKm < 10 ? 1 : 0)} fois</b> la Terre.</>
        )}
      </p>
    </Carte>
  )
}
