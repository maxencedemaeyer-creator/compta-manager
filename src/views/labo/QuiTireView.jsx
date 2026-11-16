import { useEffect, useState } from 'react'
import { ArrowRight, RotateCcw } from 'lucide-react'
import CadreJeu, { Bouton, Carte, Eclat } from '../../components/labo/CadreJeu.jsx'

// =============================================================
//  A4 · Qui tire ?
//  Un mouvement réel tourne en boucle (vue de profil). Deux muscles
//  sont dessinés : lequel se contracte (raccourcit) ? Un muscle ne
//  peut que TIRER : chaque articulation a donc des muscles opposés.
//  Attendus 120, 121.
// =============================================================

const SCENES = [
  {
    titre: 'Je lève mon verre',
    mouvement: 'Flexion du coude',
    type: 'bras', de: 5, a: 125,
    muscles: { devant: 'Biceps', derriere: 'Triceps' },
    bon: 'devant',
    explication: 'Le biceps, devant le bras, se contracte et tire sur le radius : l’avant-bras monte. Le triceps se relâche.',
  },
  {
    titre: 'Je pousse une porte',
    mouvement: 'Extension du coude',
    type: 'bras', de: 120, a: 5,
    muscles: { devant: 'Biceps', derriere: 'Triceps' },
    bon: 'derriere',
    explication: 'Le triceps, derrière le bras, se contracte et tire sur la pointe du coude (le cubitus) : le bras se tend.',
  },
  {
    titre: 'Je shoote dans le ballon',
    mouvement: 'Extension du genou',
    type: 'jambe', de: 100, a: 0,
    muscles: { devant: 'Quadriceps', derriere: 'Ischio-jambiers' },
    bon: 'devant',
    explication: 'Le quadriceps, devant la cuisse, tire sur le tibia par le tendon qui passe sur la rotule : la jambe se tend.',
  },
  {
    titre: 'Je ramène mon talon vers mes fesses',
    mouvement: 'Flexion du genou',
    type: 'jambe', de: 0, a: 115,
    muscles: { devant: 'Quadriceps', derriere: 'Ischio-jambiers' },
    bon: 'derriere',
    explication: 'Les ischio-jambiers, derrière la cuisse, se contractent et tirent le tibia vers l’arrière.',
  },
  {
    titre: 'Je me mets sur la pointe des pieds',
    mouvement: 'Extension de la cheville',
    type: 'pied', de: 0, a: 40,
    muscles: { devant: 'Jambier antérieur', derriere: 'Mollet' },
    bon: 'derriere',
    explication: 'Le mollet se contracte et tire sur le talon par le tendon d’Achille, le plus solide du corps.',
  },
  {
    titre: 'Je relève la pointe du pied',
    mouvement: 'Flexion de la cheville',
    type: 'pied', de: 10, a: -25,
    muscles: { devant: 'Jambier antérieur', derriere: 'Mollet' },
    bon: 'devant',
    explication: 'Le jambier antérieur, devant le tibia, tire le dessus du pied vers le haut. Le mollet se relâche.',
  },
]

function fuseau(p1, p2, gonflement, sens) {
  const mx = (p1.x + p2.x) / 2
  const my = (p1.y + p2.y) / 2
  const L = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1
  const nx = (-(p2.y - p1.y) / L) * sens
  const ny = ((p2.x - p1.x) / L) * sens
  const t1 = { x: p1.x + (p2.x - p1.x) * 0.14, y: p1.y + (p2.y - p1.y) * 0.14 }
  const t2 = { x: p1.x + (p2.x - p1.x) * 0.86, y: p1.y + (p2.y - p1.y) * 0.86 }
  return {
    corps: `M${t1.x} ${t1.y} Q${mx + nx * gonflement} ${my + ny * gonflement} ${t2.x} ${t2.y} Q${mx - nx * 3} ${my - ny * 3} ${t1.x} ${t1.y} Z`,
    tendons: [[p1, t1], [p2, t2]],
  }
}

function geometrie(type, angle) {
  const r = (angle * Math.PI) / 180
  if (type === 'bras') {
    const j = { x: 160, y: 230 }
    const f = { x: Math.sin(r), y: Math.cos(r) }
    const n = { x: Math.cos(r), y: -Math.sin(r) }
    const sur = (d, c) => ({ x: j.x + f.x * d + n.x * c, y: j.y + f.y * d + n.y * c })
    return {
      os: [[{ x: 160, y: 60 }, j, 15], [sur(-12, -4), sur(190, -4), 7], [j, sur(190, 4), 7]],
      bout: sur(196, 0),
      articulation: j,
      devant: [{ x: 172, y: 78 }, sur(34, 9)],
      derriere: [{ x: 148, y: 78 }, sur(-14, -9)],
      etiquettes: { os1: ['humérus', 186, 140], os2: ['avant-bras', ...Object.values(sur(120, 30))] },
    }
  }
  if (type === 'jambe') {
    const j = { x: 160, y: 220 }
    const f = { x: -Math.sin(r), y: Math.cos(r) }
    const n = { x: Math.cos(r), y: Math.sin(r) }
    const sur = (d, c) => ({ x: j.x + f.x * d + n.x * c, y: j.y + f.y * d + n.y * c })
    return {
      os: [[{ x: 160, y: 40 }, j, 18], [sur(8, 2), sur(190, 2), 13]],
      rotule: { x: j.x + 15, y: j.y - 4 },
      bout: sur(200, 14),
      pied: [sur(196, -8), sur(196, 40)],
      articulation: j,
      devant: [{ x: 176, y: 62 }, sur(30, 12)],
      derriere: [{ x: 144, y: 62 }, sur(28, -12)],
      etiquettes: { os1: ['fémur', 192, 130], os2: ['tibia', ...Object.values(sur(110, 26))] },
    }
  }
  const j = { x: 150, y: 260 }
  const f = { x: Math.cos(r), y: Math.sin(r) }
  const sur = (d, c) => ({ x: j.x + f.x * d - f.y * c, y: j.y + f.y * d + f.x * c })
  return {
    os: [[{ x: 150, y: 50 }, j, 13], [sur(-34, 6), sur(115, 6), 12]],
    articulation: j,
    devant: [{ x: 162, y: 90 }, sur(48, -8)],
    derriere: [{ x: 138, y: 70 }, sur(-36, -2)],
    etiquettes: { os1: ['tibia', 172, 160], os2: ['pied', ...Object.values(sur(80, 30))] },
  }
}

export default function QuiTireView() {
  const [index, setIndex] = useState(0)
  const [reponse, setReponse] = useState(null)
  const [score, setScore] = useState(0)
  const [t, setT] = useState(0)
  const [eclat, setEclat] = useState({ message: '', cle: 0 })

  useEffect(() => {
    let raf
    const debut = performance.now()
    const boucle = (m) => {
      setT(((m - debut) / 2400) % 1)
      raf = requestAnimationFrame(boucle)
    }
    raf = requestAnimationFrame(boucle)
    return () => cancelAnimationFrame(raf)
  }, [])

  const fini = index >= SCENES.length
  const scene = SCENES[Math.min(index, SCENES.length - 1)]
  // va-et-vient doux, avec une pause en fin de mouvement
  const progression = 0.5 - 0.5 * Math.cos(Math.min(1, t * 1.25) * Math.PI)
  const angle = scene.de + (scene.a - scene.de) * progression
  const g = geometrie(scene.type, angle)
  const revele = reponse !== null

  // Gonflement : le muscle qui travaille gonfle pendant le mouvement (une fois la réponse donnée)
  const gonfle = (cote) => {
    if (!revele) return 13
    return cote === scene.bon ? 13 + progression * 14 : 8
  }
  const couleur = (cote) => {
    if (!revele) return 'rgba(220,120,130,.75)'
    return cote === scene.bon ? `rgba(255,${100 - progression * 50},${110 - progression * 60},.95)` : 'rgba(200,170,175,.45)'
  }

  function repondre(cote) {
    if (revele) return
    setReponse(cote)
    if (cote === scene.bon) {
      setScore((s) => s + 1)
      setEclat((x) => ({ message: 'Bien vu !', cle: x.cle + 1 }))
    }
  }

  function suivante() {
    setReponse(null)
    setIndex((i) => i + 1)
  }

  if (fini) {
    return (
      <CadreJeu code="A4" titre="Qui tire ?" attendus={[120, 121]} couleur="#FFB86B">
        <Carte couleur="rgba(255,184,107,.5)" className="text-center">
          <p className="labo-titre text-3xl font-black text-[#FFB86B]">
            {score} / {SCENES.length}
          </p>
          <p className="mt-2 text-[15px] text-[#E8ECFF]">
            À retenir : un muscle ne peut que tirer, jamais pousser. C’est pour ça qu’il y a toujours deux muscles opposés autour d’une articulation : l’un plie, l’autre tend.
          </p>
          <Bouton className="mx-auto mt-4" couleur="#FFB86B" onClick={() => { setIndex(0); setScore(0); setReponse(null) }}>
            <RotateCcw size={18} /> Rejouer
          </Bouton>
        </Carte>
      </CadreJeu>
    )
  }

  const muscle = (cote) => {
    const [p1, p2] = g[cote]
    const f = fuseau(p1, p2, gonfle(cote), cote === 'devant' ? 1 : -1)
    return (
      <g key={cote} onClick={() => repondre(cote)} style={{ cursor: revele ? 'default' : 'pointer' }}>
        <path d={f.corps} fill={couleur(cote)} stroke="#FF8A95" strokeWidth={revele && cote === scene.bon ? 2 : 1} />
        {f.tendons.map(([a, b], i) => (
          <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#F4F6FF" strokeWidth="3" strokeLinecap="round" />
        ))}
      </g>
    )
  }

  return (
    <CadreJeu code="A4" titre="Qui tire ?" attendus={[120, 121]} couleur="#FFB86B" droite={<span className="labo-mono text-lg text-[#FFB86B]">{score}</span>}>
      <Eclat message={eclat.message} cle={eclat.cle} couleur="#FFB86B" />
      <Carte couleur="rgba(255,184,107,.45)">
        <p className="labo-mono text-[11px] text-[#FFB86B]">
          SCÈNE {index + 1} / {SCENES.length} · {scene.mouvement.toUpperCase()}
        </p>
        <p className="labo-titre mt-1 text-xl font-bold text-white">« {scene.titre} »</p>
        <p className="mt-1 text-sm text-[#B9C1E3]">Quel muscle se contracte et tire ? Touche-le sur le schéma ou choisis ci-dessous.</p>
      </Carte>

      <div className="rounded-3xl border border-white/10 bg-[#070B16]/75 p-2">
        <svg viewBox="0 0 320 470" className="mx-auto w-full max-w-sm" role="img" aria-label={`${scene.mouvement}, vue de profil`}>
          {g.os.map(([a, b, w], i) => (
            <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={i === 0 ? '#EDE6D1' : '#D9D0B6'} strokeWidth={w} strokeLinecap="round" />
          ))}
          {g.pied && <line x1={g.pied[0].x} y1={g.pied[0].y} x2={g.pied[1].x} y2={g.pied[1].y} stroke="#D9D0B6" strokeWidth="11" strokeLinecap="round" />}
          {g.rotule && <ellipse cx={g.rotule.x} cy={g.rotule.y} rx={6} ry={9} fill="#EDE6D1" />}
          {muscle('devant')}
          {muscle('derriere')}
          <circle cx={g.articulation.x} cy={g.articulation.y} r={10} fill="#070B16" stroke="#FFD27A" strokeWidth="3" />
          {Object.values(g.etiquettes).map(([nom, x, y]) => (
            <text key={nom} x={x} y={y} fontSize="12" fill="#8A93B8">
              {nom}
            </text>
          ))}
          <text x={300} y={30} textAnchor="end" fontSize="11" fill="#8A93B8">devant →</text>
        </svg>
      </div>

      {!revele ? (
        <div className="grid grid-cols-2 gap-2">
          <Bouton variante="secondaire" onClick={() => repondre('devant')}>{scene.muscles.devant}</Bouton>
          <Bouton variante="secondaire" onClick={() => repondre('derriere')}>{scene.muscles.derriere}</Bouton>
        </div>
      ) : (
        <Carte couleur={reponse === scene.bon ? 'rgba(157,255,138,.5)' : 'rgba(255,138,149,.5)'}>
          <p className={`labo-titre text-lg font-bold ${reponse === scene.bon ? 'text-[#9DFF8A]' : 'text-[#FF8A95]'}`}>
            {reponse === scene.bon ? 'Exact !' : `Non : c’est le ${scene.muscles[scene.bon].toLowerCase()}.`}
          </p>
          <p className="mt-1 text-[15px] leading-relaxed text-[#E8ECFF]">{scene.explication}</p>
          <Bouton className="mt-3 w-full" couleur="#FFB86B" onClick={suivante}>
            Scène suivante <ArrowRight size={18} />
          </Bouton>
        </Carte>
      )}
    </CadreJeu>
  )
}
