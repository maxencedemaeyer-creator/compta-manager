import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Carte, Duo } from '../../../components/labo/CadreJeu.jsx'
import { dessinerGalaxie } from '../../../components/labo/espace/FondEspace.jsx'
import { PLANETES, OR, ORANGE } from '../../../components/labo/espace/donnees.js'
import { PageEspace } from './commun.jsx'

// =============================================================
//  S10 · Galaxie — du Système solaire à l'Univers, en 5 niveaux de zoom.
//  Chiffres : Neptune à 4,5 milliards de km ; 1 année‑lumière ≈ 9 460 milliards de km ; Proxima du Centaure à 4,24 al ;
//  Voie lactée : ≈ 100 000 al de diamètre, 100 à 400 milliards d'étoiles, Soleil à ≈ 26 000 al du centre (rayon ≈ 50 000 al),
//  un tour du centre en ≈ 230 millions d'années ; Andromède à ≈ 2,5 millions d'al ; des centaines de milliards de galaxies.
//  Le dessin des étoiles voisines est un schéma (les directions sont inventées, les distances sont réelles).
//  Attendus 100 (voir le référentiel P5-P6 §3.1).
// =============================================================
const NIVEAUX = [
  { id: 'systeme', nom: 'Système solaire', texte: 'Une étoile, le Soleil, et ses huit planètes.', chiffre: '4,5 milliards de km', sous: 'jusqu’à Neptune : la lumière met 4 h 10 min', couleur: '#FFD27A' },
  { id: 'voisines', nom: 'Étoiles voisines', texte: 'D’autres étoiles, très très loin. La plus proche est Proxima du Centaure.', chiffre: '4,2 années‑lumière', sous: '1 année‑lumière ≈ 9 460 milliards de km', couleur: '#C9A3FF' },
  { id: 'voielactee', nom: 'La Voie lactée', texte: 'Notre galaxie : un immense tourbillon de 100 à 400 milliards d’étoiles.', chiffre: '100 000 années‑lumière', sous: 'le Soleil en fait le tour en 230 millions d’années', couleur: '#FF9AE0' },
  { id: 'galaxies', nom: 'Les galaxies', texte: 'Il y a des galaxies de plusieurs formes. Touche‑les !', chiffre: '2,5 millions d’années‑lumière', sous: 'jusqu’à Andromède, la grande voisine', couleur: '#FFA24D' },
  { id: 'univers', nom: 'L’Univers', texte: 'Des centaines de milliards de galaxies, en amas et en longs filaments.', chiffre: 'des milliards d’années‑lumière', sous: 'et on ne voit pas le bord', couleur: '#E56BFF' },
]
const FORMES = [
  { id: 'spirale', nom: 'Spirale', texte: 'Un centre brillant et des bras en spirale. Andromède et la Voie lactée sont des spirales.', exemple: 'Andromède' },
  { id: 'barree', nom: 'Spirale barrée', texte: 'Une « barre » d’étoiles traverse le centre, et les bras en partent. Notre Voie lactée a une petite barre.', exemple: 'Voie lactée' },
  { id: 'elliptique', nom: 'Elliptique', texte: 'Une grosse boule d’étoiles âgées, sans bras.', exemple: 'M87' },
  { id: 'irreguliere', nom: 'Irrégulière', texte: 'Sans forme précise. Souvent petite.', exemple: 'Grand Nuage de Magellan' },
]

function hasard(graine) {
  let s = graine
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
}
function dessinerElliptique(c) {
  const g = c.getContext('2d')
  const T = c.width
  const m = T / 2
  const rnd = hasard(11)
  g.clearRect(0, 0, T, T)
  g.globalCompositeOperation = 'lighter'
  const h = g.createRadialGradient(m, m, 0, m, m, m * 0.85)
  h.addColorStop(0, 'rgba(255,236,200,.95)')
  h.addColorStop(0.25, 'rgba(255,205,150,.55)')
  h.addColorStop(0.7, 'rgba(230,150,110,.14)')
  h.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = h
  g.fillRect(0, 0, T, T)
  for (let i = 0; i < 6000; i++) {
    const r = Math.pow(rnd(), 1.8) * m * 0.8
    const a = rnd() * 6.283
    g.fillStyle = `rgba(255,${200 + rnd() * 40},${150 + rnd() * 60},${0.2 + rnd() * 0.6})`
    g.beginPath()
    g.arc(m + Math.cos(a) * r * 1.15, m + Math.sin(a) * r * 0.85, 0.6 + rnd() * 1.2, 0, 7)
    g.fill()
  }
}
function dessinerIrreguliere(c) {
  const g = c.getContext('2d')
  const T = c.width
  const rnd = hasard(23)
  g.clearRect(0, 0, T, T)
  g.globalCompositeOperation = 'lighter'
  for (let k = 0; k < 7; k++) {
    const cx = T * (0.28 + rnd() * 0.44)
    const cy = T * (0.28 + rnd() * 0.44)
    const rr = T * (0.07 + rnd() * 0.1)
    const gr = g.createRadialGradient(cx, cy, 0, cx, cy, rr)
    gr.addColorStop(0, 'rgba(255,170,220,.5)')
    gr.addColorStop(1, 'rgba(255,170,220,0)')
    g.fillStyle = gr
    g.fillRect(cx - rr, cy - rr, rr * 2, rr * 2)
    for (let i = 0; i < 700; i++) {
      const a = rnd() * 6.283
      const d = Math.pow(rnd(), 1.5) * rr
      g.fillStyle = `rgba(${200 + rnd() * 55},${200 + rnd() * 55},255,${0.25 + rnd() * 0.6})`
      g.beginPath()
      g.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 0.5 + rnd() * 1.1, 0, 7)
      g.fill()
    }
  }
}
function dessinerUnivers(c) {
  const g = c.getContext('2d')
  const T = c.width
  const rnd = hasard(99)
  g.clearRect(0, 0, T, T)
  g.fillStyle = 'rgba(8,4,28,.92)'
  g.fillRect(0, 0, T, T)
  g.globalCompositeOperation = 'lighter'
  // « toile cosmique » : des filaments, des amas aux nœuds
  const noeuds = Array.from({ length: 22 }, () => [rnd() * T, rnd() * T])
  for (let f = 0; f < 46; f++) {
    const a = noeuds[Math.floor(rnd() * noeuds.length)]
    const b = noeuds[Math.floor(rnd() * noeuds.length)]
    for (let i = 0; i < 160; i++) {
      const t = rnd()
      const x = a[0] + (b[0] - a[0]) * t + (rnd() - 0.5) * 22
      const y = a[1] + (b[1] - a[1]) * t + (rnd() - 0.5) * 22
      g.fillStyle = `rgba(${220 + rnd() * 35},${170 + rnd() * 70},${200 + rnd() * 55},${0.15 + rnd() * 0.5})`
      g.beginPath()
      g.arc(x, y, 0.5 + rnd() * 1.1, 0, 7)
      g.fill()
    }
  }
  noeuds.forEach(([x, y]) => {
    const gr = g.createRadialGradient(x, y, 0, x, y, 38)
    gr.addColorStop(0, 'rgba(255,200,170,.38)')
    gr.addColorStop(1, 'rgba(255,200,170,0)')
    g.fillStyle = gr
    g.fillRect(x - 40, y - 40, 80, 80)
    for (let i = 0; i < 90; i++) {
      const a = rnd() * 6.283
      const d = Math.pow(rnd(), 1.6) * 34
      g.fillStyle = `rgba(255,${220 + rnd() * 30},${200 + rnd() * 40},${0.3 + rnd() * 0.6})`
      g.beginPath()
      g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 0.6 + rnd() * 1.3, 0, 7)
      g.fill()
    }
  })
}

function Toile({ dessin, taille = 640, className = '', style }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) dessin(ref.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return <canvas ref={ref} width={taille} height={taille} className={className} style={style} />
}

function Systeme() {
  return (
    <svg viewBox="-100 -100 200 200" className="h-full w-full" role="img" aria-label="Le Système solaire">
      <defs><radialGradient id="g-sol"><stop offset="0" stopColor="#FFF3C4" /><stop offset=".5" stopColor="#FFB347" /><stop offset="1" stopColor="#FF7A2E" stopOpacity="0" /></radialGradient></defs>
      <circle r="16" fill="url(#g-sol)" />
      <circle r="5" fill="#FFD27A" />
      {PLANETES.map((p, i) => {
        const r = 14 + 11.5 * Math.sqrt(p.distMkm / 149.6) * 0.8
        const a = (i * 2.3 + 0.7) % 6.283
        return (
          <g key={p.id}>
            <circle r={r} fill="none" stroke="rgba(201,163,255,.3)" strokeWidth=".4" />
            <circle cx={Math.cos(a) * r} cy={Math.sin(a) * r} r={p.id === 'jupiter' || p.id === 'saturne' ? 3.4 : p.id === 'uranus' || p.id === 'neptune' ? 2.6 : 1.8} fill={p.couleur} />
            <text x={Math.cos(a) * r} y={Math.sin(a) * r - 5} textAnchor="middle" fontSize="4.6" fill={p.couleur} className="labo-jeu">{p.nom}</text>
          </g>
        )
      })}
    </svg>
  )
}

function Voisines() {
  const E = [
    { nom: 'Proxima du Centaure', d: 4.24, a: 200, c: '#FF9A7A' },
    { nom: 'Alpha du Centaure', d: 4.37, a: 215, c: '#FFE9B8' },
    { nom: 'Étoile de Barnard', d: 5.96, a: 330, c: '#FF9A7A' },
    { nom: 'Sirius', d: 8.6, a: 120, c: '#FFFFFF' },
    { nom: 'Procyon', d: 11.5, a: 40, c: '#FFF3D0' },
    { nom: 'Tau Ceti', d: 11.9, a: 265, c: '#FFE9B8' },
  ]
  const K = 8.2
  return (
    <svg viewBox="-100 -100 200 200" className="h-full w-full" role="img" aria-label="Les étoiles voisines du Soleil">
      {[5, 10].map((d) => (
        <g key={d}>
          <circle r={d * K} fill="none" stroke="rgba(201,163,255,.35)" strokeDasharray="2 2.5" strokeWidth=".4" />
          <text x={d * K * 0.71} y={-d * K * 0.71 - 1} fontSize="4.6" fill="#C9A3FF">{d} al</text>
        </g>
      ))}
      <circle r="4" fill="#FFD27A" />
      <circle r="9" fill="#FFB347" opacity=".25" />
      <text y="-8" textAnchor="middle" fontSize="5.4" fill="#FFD27A" className="labo-jeu">Soleil</text>
      {E.map((e) => {
        const x = Math.cos((e.a * Math.PI) / 180) * e.d * K
        const y = -Math.sin((e.a * Math.PI) / 180) * e.d * K
        return (
          <g key={e.nom}>
            <circle cx={x} cy={y} r="5" fill={e.c} opacity=".25" />
            <circle cx={x} cy={y} r="2.2" fill={e.c} />
            <text x={x} y={y + 8} textAnchor="middle" fontSize="4.6" fill="#E8ECFF" className="labo-jeu">{e.nom}</text>
            <text x={x} y={y + 13} textAnchor="middle" fontSize="3.8" fill="#B9C1E3">{String(e.d).replace('.', ',')} al</text>
          </g>
        )
      })}
    </svg>
  )
}

export default function GalaxieView() {
  const [n, setN] = useState(0)
  const [forme, setForme] = useState('spirale')
  const niv = NIVEAUX[n]
  const f = FORMES.find((x) => x.id === forme)

  return (
    <PageEspace code="S10" titre="Galaxie" attendus={[100]} ecran large>
      <Duo
        visuelDabord
        commandes={
          <>
            <Carte couleur={`${niv.couleur}88`} className="!p-3">
              <p className="labo-mono text-[10px] text-[#B9C1E3]">NIVEAU {n + 1} SUR 5</p>
              <p className="labo-jeu text-[27px] leading-tight" style={{ color: niv.couleur }}>{niv.nom}</p>
              <p className="mt-1 text-[13px] leading-snug text-[#E8ECFF]">{niv.texte}</p>
              <p className="labo-jeu mt-2 text-[20px] leading-tight" style={{ color: OR }}>{niv.chiffre}</p>
              <p className="text-[11px] leading-snug text-[#B9C1E3]">{niv.sous}</p>
            </Carte>
            {n === 3 && (
              <Carte couleur="rgba(255,162,77,.4)" className="!p-3">
                <p className="labo-jeu text-[18px]" style={{ color: ORANGE }}>{f.nom}</p>
                <p className="mt-1 text-[12.5px] leading-snug text-[#E8ECFF]">{f.texte}</p>
                <p className="mt-1 text-[11px] text-[#B9C1E3]">Exemple : {f.exemple}</p>
              </Carte>
            )}
            <div className="flex items-center gap-2">
              <button type="button" disabled={n === 0} onClick={() => setN(n - 1)} aria-label="Zoom avant" className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl border border-white/20 bg-[#0B0A1E]/85 text-white active:scale-95 disabled:opacity-30">
                <ChevronLeft size={26} />
              </button>
              <div className="flex flex-1 items-center justify-center gap-2">
                {NIVEAUX.map((x, i) => (
                  <button key={x.id} type="button" onClick={() => setN(i)} aria-label={x.nom} className="flex h-9 w-9 items-center justify-center rounded-full">
                    <span className="block rounded-full transition-all" style={{ width: i === n ? 18 : 11, height: i === n ? 18 : 11, background: i === n ? ORANGE : 'rgba(232,236,255,.3)' }} />
                  </button>
                ))}
              </div>
              <button type="button" disabled={n === NIVEAUX.length - 1} onClick={() => setN(n + 1)} aria-label="Zoom arrière" className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl text-[#12062A] active:scale-95 disabled:opacity-30" style={{ background: ORANGE }}>
                <ChevronRight size={26} />
              </button>
            </div>
            <p className="labo-mono text-[10px] leading-snug text-[#8A93B8]">Chaque niveau « dézoome » : le dessin précédent devient un tout petit point. Les étoiles voisines sont un schéma.</p>
          </>
        }
      >
        <div className="relative h-[46vh] min-h-[300px] overflow-hidden rounded-3xl border border-white/12 bg-[#05030f]/35 tab:h-auto tab:min-h-0 tab:flex-1">
          <div key={niv.id} className="espace-zoom absolute inset-0 flex items-center justify-center p-2">
            {n === 0 && <div className="aspect-square h-full max-w-full"><Systeme /></div>}
            {n === 1 && <div className="aspect-square h-full max-w-full"><Voisines /></div>}
            {n === 2 && (
              <div className="relative aspect-square h-full max-w-full">
                <Toile dessin={(c) => dessinerGalaxie(c, { bras: 4, graine: 5, barre: true })} className="h-full w-full" />
                <div className="absolute" style={{ left: '66%', top: '70%' }}>
                  <span className="absolute -left-3 -top-3 h-6 w-6 animate-ping rounded-full bg-[#FFA24D]/60" />
                  <span className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full border-2 border-white bg-[#FFA24D]" />
                  <span className="labo-jeu absolute left-3 top-2 whitespace-nowrap rounded-full bg-black/55 px-2 py-0.5 text-[14px] text-[#FFD9B0]">Tu es ici</span>
                </div>
                <span className="labo-jeu absolute text-[13px] text-[#FFE9B8]" style={{ left: '50%', top: '38%', transform: 'translateX(-50%)' }}>centre</span>
              </div>
            )}
            {n === 3 && (
              <div className="grid h-full max-h-full w-full max-w-[640px] grid-cols-2 grid-rows-2 gap-2">
                {FORMES.map((x) => (
                  <button key={x.id} type="button" onClick={() => setForme(x.id)} className="relative flex min-h-0 items-center justify-center overflow-hidden rounded-2xl border-2 bg-black/30 active:scale-[.98]" style={{ borderColor: forme === x.id ? ORANGE : 'rgba(232,236,255,.14)' }}>
                    <Toile
                      taille={420}
                      dessin={(c) => (x.id === 'spirale' ? dessinerGalaxie(c, { bras: 2, graine: 3, teinte: [255, 224, 190], bout: [200, 170, 255] }) : x.id === 'barree' ? dessinerGalaxie(c, { bras: 2, graine: 9, barre: true, teinte: [255, 200, 150], bout: [255, 150, 220] }) : x.id === 'elliptique' ? dessinerElliptique(c) : dessinerIrreguliere(c))}
                      className="max-h-full max-w-full object-contain"
                      style={{ height: '100%', aspectRatio: '1 / 1' }}
                    />
                    <span className="labo-jeu absolute bottom-1.5 left-2 text-[14px]" style={{ color: forme === x.id ? ORANGE : '#E8ECFF', textShadow: '0 1px 4px #000' }}>{x.nom}</span>
                  </button>
                ))}
              </div>
            )}
            {n === 4 && (
              <div className="relative aspect-square h-full max-w-full overflow-hidden rounded-2xl">
                <Toile dessin={dessinerUnivers} className="h-full w-full" />
                <span className="labo-jeu absolute bottom-2 right-2 rounded-full bg-black/55 px-2.5 py-1 text-[13px] text-[#FFD9B0]">Chaque point = une galaxie</span>
              </div>
            )}
          </div>
        </div>
      </Duo>
    </PageEspace>
  )
}
