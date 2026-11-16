// =============================================================
//  Schéma du squelette humain, vue de face (position anatomique :
//  paumes vers l'avant, donc le radius côté pouce, à l'extérieur).
//  La droite de la personne est à GAUCHE de l'écran.
//  Chaque os est cliquable et peut être coloré selon son état.
//  Os : tous ceux du référentiel P3-P4 (radius, cubitus, humérus,
//  fémur, rotule, péroné, tibia, vertèbres, crâne, côtes) + bonus.
// =============================================================

export const NOMS_OS = {
  crane: 'Crâne',
  vertebres: 'Vertèbres',
  cotes: 'Côtes',
  sternum: 'Sternum',
  clavicule: 'Clavicule',
  humerus: 'Humérus',
  radius: 'Radius',
  cubitus: 'Cubitus',
  bassin: 'Bassin',
  femur: 'Fémur',
  rotule: 'Rotule',
  tibia: 'Tibia',
  perone: 'Péroné',
  main: 'Os de la main',
  pied: 'Os du pied',
}

// Les 10 os à connaître au minimum (référentiel, attendu 112)
export const OS_REFERENTIEL = ['crane', 'vertebres', 'cotes', 'humerus', 'radius', 'cubitus', 'femur', 'rotule', 'tibia', 'perone']

export const NOMS_ARTICULATIONS = {
  epaule: 'Épaule',
  coude: 'Coude',
  poignet: 'Poignet',
  hanche: 'Hanche',
  genou: 'Genou',
  cheville: 'Cheville',
}

// Position des articulations (côté droit de la personne ; le gauche est en miroir)
export const ARTICULATIONS = {
  epaule: [64, 102],
  coude: [56, 171],
  poignet: [48, 236],
  hanche: [82, 224],
  genou: [88, 328],
  cheville: [84, 420],
}

export const miroir = ([x, y]) => [200 - x, y]

const COULEURS = {
  normal: { fill: '#EDE6D1', stroke: '#B9AE8E' },
  ok: { fill: '#9DFF8A', stroke: '#3FAE4A' },
  actif: { fill: '#8FF4FF', stroke: '#2BB5C9' },
  erreur: { fill: '#FF8A95', stroke: '#C2364A' },
  attenue: { fill: '#3A4566', stroke: '#2A3350' },
}

function Os({ x1, y1, x2, y2, w }) {
  return (
    <>
      <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={w} strokeLinecap="round" className="os-trait" />
      <circle cx={x1} cy={y1} r={w * 0.72} className="os-bout" />
      <circle cx={x2} cy={y2} r={w * 0.72} className="os-bout" />
    </>
  )
}

// Formes d'un côté (droit) ; le côté gauche est obtenu par symétrie
function OsCote({ id }) {
  switch (id) {
    case 'clavicule':
      return <path d="M96 99 Q80 92 64 99" fill="none" strokeWidth="4.5" strokeLinecap="round" className="os-trait" />
    case 'humerus':
      return <Os x1={64} y1={104} x2={56} y2={167} w={7.5} />
    case 'radius':
      return <Os x1={51.5} y1={176} x2={43} y2={229} w={4.5} />
    case 'cubitus':
      return <Os x1={59} y1={175} x2={52.5} y2={231} w={4.5} />
    case 'femur':
      return (
        <>
          <path d="M88 223 L78 230 L88 316" fill="none" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round" className="os-trait" />
          <circle cx={88} cy={223} r={5.5} className="os-bout" />
          <circle cx={86} cy={317} r={6.5} className="os-bout" />
          <circle cx={91} cy={317} r={5} className="os-bout" />
        </>
      )
    case 'rotule':
      return <ellipse cx={88} cy={326} rx={5} ry={6} className="os-bout" />
    case 'tibia':
      return <Os x1={89} y1={337} x2={87} y2={414} w={7} />
    case 'perone':
      return <Os x1={79.5} y1={339} x2={80} y2={416} w={3.6} />
    case 'main':
      return (
        <g strokeLinecap="round" fill="none">
          <circle cx={47} cy={240} r={5} className="os-bout" />
          {[
            [41, 244, 34, 258, 30, 270],
            [44, 245, 41, 263, 40, 281],
            [47, 245, 46, 265, 46, 285],
            [50, 245, 51, 264, 52, 282],
            [53, 244, 56, 260, 58, 275],
          ].map(([a, b, c, d, e, f], i) => (
            <path key={i} d={`M${a} ${b} L${c} ${d} L${e} ${f}`} strokeWidth="2.4" className="os-trait" />
          ))}
        </g>
      )
    case 'pied':
      return <path d="M79 423 L92 423 Q97 432 100 442 L72 442 Q72 432 79 423 Z" className="os-bout" />
    default:
      return null
  }
}

const COTES_CENTRE = new Set(['crane', 'vertebres', 'cotes', 'sternum', 'bassin'])

function OsCentre({ id }) {
  switch (id) {
    case 'crane':
      return (
        <>
          <path
            d="M100 6 C124 6 129 28 127 46 C126 56 121 62 117 66 L113 79 L87 79 L83 66 C79 62 74 56 73 46 C71 28 76 6 100 6 Z"
            className="os-bout"
          />
          <ellipse cx={90} cy={41} rx={6.5} ry={5.5} fill="#070B16" opacity=".85" />
          <ellipse cx={110} cy={41} rx={6.5} ry={5.5} fill="#070B16" opacity=".85" />
          <path d="M100 47 L96 56 L104 56 Z" fill="#070B16" opacity=".85" />
          <path d="M89 70 L111 70" stroke="#070B16" strokeOpacity=".6" strokeWidth="1" strokeDasharray="2 1.5" />
        </>
      )
    case 'vertebres':
      return (
        <>
          {[82, 88, 94].map((y) => (
            <rect key={y} x={95.5} y={y} width={9} height={4.5} rx={1.5} className="os-bout" />
          ))}
          {[160, 169, 178, 187, 196].map((y) => (
            <rect key={y} x={93.5} y={y} width={13} height={7} rx={2} className="os-bout" />
          ))}
        </>
      )
    case 'sternum':
      return <path d="M96 103 L104 103 L103.5 148 L100 155 L96.5 148 Z" className="os-bout" />
    case 'cotes':
      return (
        <g fill="none" strokeLinecap="round">
          {Array.from({ length: 9 }, (_, i) => {
            const y = 106 + i * 5.6
            const ecart = 30 + Math.sin(((i + 1) / 10) * Math.PI) * 9
            return (
              <g key={i}>
                <path d={`M96 ${y} C${96 - ecart * 0.7} ${y - 4} ${96 - ecart} ${y + 6} ${96 - ecart + 3} ${y + 18}`} strokeWidth="2.3" className="os-trait" />
                <path d={`M104 ${y} C${104 + ecart * 0.7} ${y - 4} ${104 + ecart} ${y + 6} ${104 + ecart - 3} ${y + 18}`} strokeWidth="2.3" className="os-trait" />
              </g>
            )
          })}
        </g>
      )
    case 'bassin':
      return (
        <>
          <path
            d="M100 210 C88 198 70 197 66 211 C63 225 75 236 89 240 L95 247 L105 247 L111 240 C125 236 137 225 134 211 C130 197 112 198 100 210 Z"
            className="os-bout"
          />
          <ellipse cx={90} cy={236} rx={4} ry={5} fill="#070B16" opacity=".85" />
          <ellipse cx={110} cy={236} rx={4} ry={5} fill="#070B16" opacity=".85" />
          <path d="M94 207 L106 207 L103 226 L97 226 Z" fill="#070B16" opacity=".35" />
        </>
      )
    default:
      return null
  }
}

const ORDRE = ['bassin', 'cotes', 'vertebres', 'sternum', 'crane', 'clavicule', 'humerus', 'radius', 'cubitus', 'main', 'femur', 'rotule', 'tibia', 'perone', 'pied']

// etats : { idOs: 'normal' | 'ok' | 'actif' | 'erreur' | 'attenue' }
export default function Squelette({ etats = {}, decalages = {}, caches = [], onOs, articulations = null, onArticulation, className = '', style, enfants }) {
  return (
    <svg viewBox="0 0 200 450" className={className} style={style} role="img" aria-label="Schéma du squelette humain, vue de face">
      <style>{`
        .os-trait { stroke: var(--os-stroke-fill); }
        .os-bout { fill: var(--os-stroke-fill); stroke: var(--os-contour); stroke-width: .6; }
      `}</style>
      {ORDRE.filter((id) => !caches.includes(id)).map((id) => {
        const c = COULEURS[etats[id] || 'normal']
        const d = decalages[id]
        const vars = {
          '--os-stroke-fill': c.fill,
          '--os-contour': c.stroke,
          transition: 'transform .9s cubic-bezier(.2,1.4,.4,1), filter .3s',
          transformBox: 'fill-box',
          transformOrigin: 'center',
          transform: d ? `translate(${d.dx}px, ${d.dy}px) rotate(${d.rot}deg)` : 'none',
        }
        const glow = etats[id] === 'actif' || etats[id] === 'ok' ? { filter: `drop-shadow(0 0 4px ${c.fill})` } : {}
        const clic = onOs ? { onClick: () => onOs(id), style: { cursor: 'pointer', ...vars, ...glow } } : { style: { ...vars, ...glow } }
        if (COTES_CENTRE.has(id)) {
          return (
            <g key={id} {...clic} data-os={id}>
              <OsCentre id={id} />
            </g>
          )
        }
        return (
          <g key={id} {...clic} data-os={id}>
            <OsCote id={id} />
            <g transform="translate(200 0) scale(-1 1)">
              <OsCote id={id} />
            </g>
          </g>
        )
      })}
      {articulations &&
        Object.entries(ARTICULATIONS).map(([id, pos]) =>
          [pos, miroir(pos)].map(([x, y], i) => {
            const etat = articulations[id] || 'normal'
            const couleur = etat === 'ok' ? '#9DFF8A' : etat === 'erreur' ? '#FF8A95' : etat === 'actif' ? '#FFD27A' : '#6FEFFF'
            return (
              <g key={`${id}${i}`} onClick={onArticulation ? () => onArticulation(id) : undefined} style={{ cursor: onArticulation ? 'pointer' : 'default' }}>
                <circle cx={x} cy={y} r={9} fill="transparent" />
                <circle cx={x} cy={y} r={4.2} fill="#070B16" stroke={couleur} strokeWidth="2" />
              </g>
            )
          })
        )}
      {enfants}
    </svg>
  )
}
