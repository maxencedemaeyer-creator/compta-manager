import { useEffect, useRef, useState } from 'react'
import { Bed, Bike, Footprints, Armchair, Wind, Zap } from 'lucide-react'
import { Carte, Eclat, Duo } from '../../../components/labo/CadreJeu.jsx'
import { BLEU_SANG, Consigne, PageCirc, ROUGE_SANG, boumTac } from './commun.jsx'

// =============================================================
//  C6 · Le cœur-pompe
//  Chaque tape = un battement : le cœur éjecte un volume de sang
//  (≈ 70 mL au repos, davantage à l'effort). L'élève choisit une
//  activité ; les muscles demandent plus ou moins de sang (donc de
//  dioxygène et de nutriments). Il doit taper assez vite pour remplir
//  la jauge… et découvre le rythme nécessaire. Le tableau se remplit :
//  plus l'effort est intense, plus le cœur doit battre vite.
//  Valeurs : ordres de grandeur pour un adulte (débit cardiaque
//  ≈ 5 L/min au repos, jusqu'à ≈ 20 L/min à l'effort intense).
//  Attendus 68, 69.
// =============================================================
const ACTIVITES = [
  { id: 'sommeil', nom: 'Dormir', icone: Bed, debit: 4, volume: 70, souffle: 12 },
  { id: 'repos', nom: 'Être assis', icone: Armchair, debit: 5, volume: 70, souffle: 15 },
  { id: 'marche', nom: 'Marcher', icone: Footprints, debit: 8, volume: 85, souffle: 20 },
  { id: 'velo', nom: 'Pédaler vite', icone: Bike, debit: 14, volume: 100, souffle: 32 },
  { id: 'sprint', nom: 'Sprinter', icone: Zap, debit: 19, volume: 105, souffle: 45 },
]
const besoinBpm = (a) => Math.round((a.debit * 1000) / a.volume)
const TENIR = 4 // secondes à tenir dans la zone verte
// Jauge : elle montre directement « sang envoyé ÷ sang demandé ».
// 100 % de la jauge = 1,8 × le besoin ; zone verte = de 0,9 × à 1,35 × le besoin.
const ECHELLE = 1.8
const ZONE_MIN = 0.9
const ZONE_MAX = 1.35

export default function PompeView() {
  const [act, setAct] = useState(ACTIVITES[1])
  const [bpm, setBpm] = useState(0)
  const [niveau, setNiveau] = useState(0) // sang envoyé ÷ sang demandé (lissé)
  const [tenu, setTenu] = useState(0)
  const [reussis, setReussis] = useState({})
  const [son, setSon] = useState(true)
  const [battement, setBattement] = useState(0)
  const [eclat, setEclat] = useState({ message: '', cle: 0 })
  const taps = useRef([])
  const etat = useRef({ niveau: 0, tenu: 0 })

  // Calcul continu : rythme des dernières tapes → débit envoyé → jauge des muscles
  useEffect(() => {
    etat.current = { niveau: 0, tenu: 0 }
    taps.current = []
    setNiveau(0)
    setTenu(0)
    setBpm(0)
    let dernier = performance.now()
    let raf
    const boucle = (t) => {
      raf = requestAnimationFrame(boucle)
      const dt = Math.min(0.1, (t - dernier) / 1000)
      dernier = t
      const l = taps.current.filter((x) => t - x < 5000)
      taps.current = l
      // rythme = moyenne des 4 derniers écarts entre tapes (réagit vite, sans trembler)
      let r = 0
      if (l.length >= 3 && t - l[l.length - 1] < 2200) {
        const recent = l.slice(-5)
        const ecarts = recent.slice(1).map((x, i) => x - recent[i])
        r = Math.round(60000 / (ecarts.reduce((a, b) => a + b, 0) / ecarts.length))
      }
      const e = etat.current
      const cible = (r * act.volume) / 1000 / act.debit // 1 = juste ce qu'il faut
      // la jauge suit le débit sans à-coups (monte vite, redescend un peu moins vite)
      e.niveau += (cible - e.niveau) * Math.min(1, dt * (cible > e.niveau ? 7 : 3))
      const dansZone = e.niveau >= ZONE_MIN && e.niveau <= ZONE_MAX
      e.tenu = dansZone ? e.tenu + dt : Math.max(0, e.tenu - dt * 2)
      setBpm(r)
      setNiveau(e.niveau)
      setTenu(e.tenu)
      if (e.tenu >= TENIR) {
        e.tenu = 0
        setReussis((x) => ({ ...x, [act.id]: r }))
        setEclat((x) => ({ message: `${act.nom} : réussi !`, sousTitre: `${r} battements par minute`, cle: x.cle + 1 }))
      }
    }
    raf = requestAnimationFrame(boucle)
    return () => cancelAnimationFrame(raf)
  }, [act])

  function battre() {
    taps.current.push(performance.now())
    setBattement((b) => b + 1)
    if (son) boumTac(0.7, 0.18)
  }

  const debit = ((bpm * act.volume) / 1000).toFixed(1)
  const zone = niveau >= ZONE_MIN && niveau <= ZONE_MAX ? 'ok' : niveau > ZONE_MAX ? 'trop' : 'peu'
  const hauteur = Math.min(1, niveau / ECHELLE)

  return (
    <PageCirc code="C6" titre="Le cœur-pompe" attendus={[68, 69]} ecran large>
      <Eclat message={eclat.message} sousTitre={eclat.sousTitre} cle={eclat.cle} couleur="#FF8AD8" />
      <Duo droite={420}
        commandes={
          <>
      <Consigne couleur="#FF8AD8">
        Tu es le cœur ! <b>Chaque fois que tu tapes, il bat</b> et envoie du sang vers les muscles. Choisis une activité, puis tape au bon rythme pour garder la jauge des muscles dans le vert pendant {TENIR} secondes.
      </Consigne>

      <div className="grid grid-cols-5 gap-1.5">
        {ACTIVITES.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setAct(a)}
            className="flex flex-col items-center gap-1 rounded-2xl border py-2 text-[10.5px] font-bold leading-tight"
            style={act.id === a.id ? { background: '#FF8AD8', color: '#2A0620', borderColor: '#FF8AD8' } : { borderColor: reussis[a.id] ? '#9DFF8A' : 'rgba(255,255,255,.15)', background: 'rgba(18,26,48,.85)' }}
          >
            <a.icone size={20} />
            {a.nom}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_auto] items-stretch gap-3">
        <Carte couleur="rgba(255,138,216,.4)" className="!p-3">
          <p className="labo-mono text-[10px] text-[#FF8AD8]">LES MUSCLES DEMANDENT</p>
          <p className="labo-titre text-2xl font-black text-white">
            {act.debit} <span className="text-sm">L de sang / min</span>
          </p>
          <p className="mt-2 labo-mono text-[10px] text-[#B9C1E3]">TON CŒUR ENVOIE</p>
          <p className="labo-titre text-2xl font-black" style={{ color: zone === 'ok' ? '#9DFF8A' : zone === 'trop' ? '#FFD27A' : '#FF8A9C' }}>
            {debit} <span className="text-sm">L / min</span>
          </p>
          <p className="text-[12px] text-[#8A93B8]">
            = {bpm} battements × {act.volume} mL
          </p>
          <p className="mt-2 flex items-center gap-1 text-[12px] text-[#9FD8FF]">
            <Wind size={13} /> Respiration : ≈ {act.souffle} mouvements / min
          </p>
        </Carte>
        {/* Jauge des muscles : le niveau = sang envoyé ÷ sang demandé */}
        <div className="flex w-[112px] flex-col items-start gap-1">
          <span className="labo-mono text-[9px] text-[#B9C1E3]">MUSCLES</span>
          <div className="relative min-h-[150px] w-9 flex-1">
            <div className="absolute inset-0 overflow-hidden rounded-full border border-white/20 bg-[#0B1122]">
              <div
                className="absolute inset-x-0 bottom-0 transition-[height] duration-100"
                style={{ height: `${hauteur * 100}%`, background: zone === 'ok' ? '#9DFF8A' : zone === 'trop' ? '#FFD27A' : '#FF6B7A' }}
              />
              {/* zone verte à viser */}
              <div className="absolute inset-x-0 border-y-2 border-dashed border-[#9DFF8A]" style={{ bottom: `${(ZONE_MIN / ECHELLE) * 100}%`, height: `${((ZONE_MAX - ZONE_MIN) / ECHELLE) * 100}%`, background: 'rgba(157,255,138,.14)' }} />
            </div>
            <span className="labo-mono pointer-events-none absolute left-full ml-1.5 text-[9px] font-bold text-[#9DFF8A]" style={{ bottom: `${((ZONE_MIN + ZONE_MAX) / 2 / ECHELLE) * 100}%`, transform: 'translateY(50%)' }}>
              ◂ VISE ICI
            </span>
            <span className="labo-mono pointer-events-none absolute left-full ml-1.5 text-[9px] text-[#FFD27A]" style={{ top: 0 }}>
              trop
            </span>
            <span className="labo-mono pointer-events-none absolute bottom-0 left-full ml-1.5 text-[9px] text-[#FF8A9C]">pas assez</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[#9DFF8A] transition-[width] duration-100" style={{ width: `${Math.min(100, (tenu / TENIR) * 100)}%` }} />
          </div>
          <span className="labo-mono text-[9px] text-[#9DFF8A] self-center">{Math.round((tenu / TENIR) * 100)} %</span>
        </div>
      </div>

      <Carte couleur="rgba(255,255,255,.14)">
        <p className="labo-mono text-[11px] text-[#FF8AD8]">MON TABLEAU</p>
        <table className="mt-2 w-full text-left text-[13px]">
          <thead className="text-[#8A93B8]">
            <tr>
              <th className="py-1 font-normal">Activité</th>
              <th className="py-1 font-normal">Sang demandé</th>
              <th className="py-1 text-right font-normal">Mon rythme</th>
            </tr>
          </thead>
          <tbody>
            {ACTIVITES.map((a) => (
              <tr key={a.id} className="border-t border-white/10">
                <td className="py-1 text-white">{a.nom}</td>
                <td className="py-1 text-[#DDE2F7]">{a.debit} L/min</td>
                <td className="labo-mono py-1 text-right" style={{ color: reussis[a.id] ? '#9DFF8A' : '#4A5375' }}>
                  {reussis[a.id] ? `${reussis[a.id]} /min` : '?'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {Object.keys(reussis).length >= 3 && (
          <p className="labo-apparait mt-3 rounded-xl bg-[#9DFF8A]/10 p-2 text-[14px] leading-snug text-[#E8ECFF]">
            <b>Conclusion :</b> plus l’effort est intense, plus les muscles ont besoin de dioxygène et de nutriments. Le cœur bat alors plus vite (et plus fort) pour envoyer plus de sang, et la respiration s’accélère pour apporter plus de dioxygène. Vérifie-le sur toi à l’activité « Pouls » (C4) !
          </p>
        )}
      </Carte>
          </>
        }
      >
        <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-white/10 bg-[#070B16]/60 py-3 tab:min-h-0 tab:flex-1">
      {/* Le cœur à taper */}
      <button
        type="button"
        onPointerDown={battre}
        className="relative mx-auto flex h-64 w-64 select-none tab:h-[min(50dvh,360px)] tab:w-[min(50dvh,360px)] items-center justify-center rounded-full active:scale-[.98]"
        style={{ touchAction: 'manipulation' }}
        aria-label="Faire battre le cœur"
      >
        <CoeurSchema battement={battement} />
        <span className="labo-mono absolute bottom-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] text-white">TAPE ICI</span>
      </button>

      <div className="text-center">
        <p className="labo-titre text-4xl font-black text-white">
          {bpm || '—'} <span className="text-base text-[#B9C1E3]">battements / min</span>
        </p>
        <p className="text-[13px] text-[#8A93B8]">{!bpm && niveau < 0.05 ? 'Tape sur le cœur !' : zone === 'peu' ? 'Plus vite : les muscles manquent de dioxygène !' : zone === 'trop' ? 'Doucement, c’est plus que nécessaire.' : 'Parfait, garde ce rythme !'}</p>
      </div>

      <button type="button" onClick={() => setSon((s) => !s)} className="mx-auto text-[12px] text-[#8A93B8] underline">
        {son ? 'Couper le son' : 'Activer le son'}
      </button>

        </div>
      </Duo>
    </PageCirc>
  )
}

// Cœur en coupe (schéma) : les ventricules se contractent, les valvules s'ouvrent dans un seul sens
function CoeurSchema({ battement }) {
  const [contracte, setContracte] = useState(false)
  useEffect(() => {
    if (!battement) return
    setContracte(true)
    const t = setTimeout(() => setContracte(false), 180)
    return () => clearTimeout(t)
  }, [battement])
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full">
      <defs>
        <radialGradient id="pompe-halo" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#FF4D6D" stopOpacity=".45" />
          <stop offset="1" stopColor="#FF4D6D" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="96" fill="url(#pompe-halo)" opacity={contracte ? 1 : 0.35} style={{ transition: 'opacity .15s' }} />
      {/* vaisseaux */}
      <path d="M78 52 L78 18" stroke={BLEU_SANG} strokeWidth="12" strokeLinecap="round" />
      <path d="M112 50 C112 20 150 18 156 40" stroke={ROUGE_SANG} strokeWidth="13" fill="none" strokeLinecap="round" />
      <path d="M96 52 C96 34 70 30 52 36" stroke={BLEU_SANG} strokeWidth="10" fill="none" strokeLinecap="round" />
      {contracte && (
        <g className="labo-apparait">
          <circle cx="156" cy="44" r="5" fill={ROUGE_SANG} />
          <circle cx="52" cy="36" r="4.5" fill={BLEU_SANG} />
        </g>
      )}
      <g style={{ transform: `scale(${contracte ? 0.92 : 1})`, transformOrigin: '100px 118px', transition: 'transform .12s ease-out' }}>
        {/* cœur droit (à gauche sur le schéma) */}
        <path d="M58 70 Q58 54 74 54 L98 54 L98 172 Q74 166 62 140 Q54 122 56 100 Z" fill={BLEU_SANG} />
        {/* cœur gauche */}
        <path d="M102 54 L128 54 Q146 54 146 72 L146 110 Q144 150 102 176 Z" fill={ROUGE_SANG} />
        <path d="M58 98 L98 98 M102 98 L146 98" stroke="#0B1122" strokeWidth="2.5" />
        {/* valvules entre oreillettes et ventricules : ouvertes au repos, fermées pendant la contraction */}
        <g stroke="#F1E3C8" strokeWidth="3" strokeLinecap="round">
          <path d={contracte ? 'M66 98 L80 98 M94 98 L80 98' : 'M66 98 L74 108 M94 98 L86 108'} />
          <path d={contracte ? 'M108 98 L123 98 M138 98 L123 98' : 'M108 98 L116 108 M138 98 L130 108'} />
        </g>
        <rect x="98" y="54" width="4" height="122" fill="#B9454F" />
        <g fontSize="9" fontWeight="800" fill="#fff" textAnchor="middle">
          <text x="78" y="82">OD</text>
          <text x="78" y="136">VD</text>
          <text x="124" y="82">OG</text>
          <text x="124" y="136">VG</text>
        </g>
      </g>
    </svg>
  )
}
