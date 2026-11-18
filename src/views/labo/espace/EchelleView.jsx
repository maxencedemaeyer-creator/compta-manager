import { useEffect, useRef, useState } from 'react'
import { Circle, MoveHorizontal, Play, Zap } from 'lucide-react'
import { Carte, Duo } from '../../../components/labo/CadreJeu.jsx'
import { C_LUMIERE, PLANETES, SOLEIL, TERRE, dureeLumiere, nombre, OR, ORANGE } from '../../../components/labo/espace/donnees.js'
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
const AIDE_TAILLE = { mercure: 'un grain de riz', venus: 'un petit pois', terre: 'un petit pois', mars: 'un grain de riz', jupiter: 'un pamplemousse', saturne: 'une orange', uranus: 'une prune', neptune: 'une prune' }

// ---------- 1 · Tailles (1 000 km = 1 px) ----------
const POS_X = { mercure: 205, venus: 252, terre: 300, mars: 346, jupiter: 462, saturne: 690, uranus: 868, neptune: 945 }
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
        {PLANETES.map((p) => <clipPath key={p.id} id={`ech-clip-${p.id}`}><circle cx={POS_X[p.id]} cy={base - (p.diamKm * s) / 2} r={(p.diamKm * s) / 2} /></clipPath>)}
      </defs>
      <circle cx={-560} cy={210} r={696} fill="url(#ech-soleil)" />
      <text x="18" y="48" className="labo-jeu" fontSize="30" fill="#7A2A00">Soleil</text>
      <text x="18" y="72" fontSize="13" fill="#7A2A00">1 392 700 km</text>
      <line x1="150" y1={base} x2="1000" y2={base} stroke="rgba(255,255,255,.15)" />
      {PLANETES.map((p, i) => {
        const r = (p.diamKm * s) / 2
        const cx = POS_X[p.id]
        const cy = base - r
        const actif = choix === p.id
        return (
          <g key={p.id} onClick={() => setChoix(p.id)} style={{ cursor: 'pointer' }}>
            <circle cx={cx} cy={cy} r={Math.max(r + 9, 16)} fill="transparent" />
            {p.anneaux && <ellipse cx={cx} cy={cy} rx={r * 2.27} ry={r * 0.5} fill="none" stroke="#D9C49A" strokeWidth={r * 0.35} opacity=".55" transform={`rotate(-14 ${cx} ${cy})`} />}
            <image href={`/labo/espace/${p.texture}.jpg`} x={cx - r * 2} y={cy - r} width={r * 4} height={r * 2} preserveAspectRatio="none" clipPath={`url(#ech-clip-${p.id})`} />
            <circle cx={cx} cy={cy} r={r} fill="url(#ech-ombre)" />
            {actif && <circle cx={cx} cy={cy} r={r + 5} fill="none" stroke="#FFA24D" strokeWidth="2.5" />}
            <text x={cx} y={base + 22 + (i < 4 && i % 2 ? 20 : 0)} textAnchor="middle" className="labo-jeu" fontSize={i < 4 ? 14 : 17} fill={actif ? '#FFA24D' : p.couleur}>{p.nom}</text>
          </g>
        )
      })}
      <text x="500" y="408" textAnchor="middle" fontSize="12" fill="#8A93B8">Échelle : 1 000 km = 1 pixel</text>
    </svg>
  )
}

// ---------- 2 · Distances (Soleil = ballon d'1 m) ----------
function Distances({ vue, pos, setChoix, choix }) {
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
      <circle cx="70" cy="170" r="24" fill="#FFB347" />
      <circle cx="70" cy="170" r="38" fill="#FFB347" opacity=".25" />
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
  const planete = PLANETES.find((p) => p.id === choix)
  const max = vue === 'tout' ? 3300 : 180

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
                  {[['proche', 'Proches'], ['tout', 'Tout le système']].map(([v, nom]) => (
                    <button key={v} type="button" onClick={() => { setVue(v); setPos(0) }} className="min-h-[42px] flex-1 rounded-2xl border text-[13px] font-bold active:scale-95" style={vue === v ? { background: ORANGE, color: '#12062A', borderColor: ORANGE } : { color: '#FFD9B0', borderColor: '#FFA24D66', background: 'rgba(11,10,30,.85)' }}>{nom}</button>
                  ))}
                </div>
                <Curseur label="Ma marche depuis le Soleil" valeur={pos} min={0} max={max} step={vue === 'tout' ? 5 : 1} onChange={setPos} format={fmtM} couleur={ORANGE} />
                <Carte couleur="rgba(255,162,77,.35)" className="!p-3">
                  <p className="labo-mono text-[10px] text-[#B9C1E3]">EN MARCHANT À 5 KM/H</p>
                  <p className="labo-jeu text-[26px] leading-none" style={{ color: OR }}>{fmtTemps(marche)}</p>
                  {vue === 'tout' && <p className="mt-1 text-[11px] text-[#B9C1E3]">Jusqu’à Neptune : <b className="text-white">{fmtTemps(distM(PLANETES[7]) / (5000 / 3600))}</b>.</p>}
                </Carte>
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
  return (
    <Carte couleur={`${p.couleur}77`} className="!p-3">
      <p className="labo-jeu text-[22px] leading-none" style={{ color: p.couleur }}>{p.nom}</p>
      <p className="mt-1 text-[13px] leading-snug text-[#E8ECFF]">
        {lumiere ? (
          <>Lumière du Soleil : <b style={{ color: OR }}>{dureeLumiere(p.distMkm)}</b> ({nombre(p.distMkm, 1)} millions de km).</>
        ) : taille ? (
          <>À cette échelle : {fmtCm(tailleCm(p.diamKm))} (comme {AIDE_TAILLE[p.id]}), à <b style={{ color: OR }}>{fmtM(m)}</b> du Soleil.</>
        ) : (
          <>{nombre(p.diamKm)} km de diamètre : <b style={{ color: OR }}>{nombre(p.diamKm / TERRE.diamKm, p.diamKm / TERRE.diamKm < 10 ? 1 : 0)} fois</b> la Terre.</>
        )}
      </p>
    </Carte>
  )
}
