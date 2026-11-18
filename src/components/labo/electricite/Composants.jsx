// =============================================================
//  Dessins des composants électriques (vue « photo ») et leurs
//  symboles normalisés (vue « schéma »).
//  Repère local : centre (0, 0) ; les 2 bornes sont TOUJOURS en
//  (−42, 24) [borne 0] et (42, 24) [borne 1], sur un socle comme
//  dans les boîtes de matériel de classe.
//  Pile : borne 0 = +, borne 1 = −. Lampe LED (« del »), console,
//  enceinte : borne 0 = + (ils ne marchent que dans un sens).
// =============================================================
import { COMPOSANTS } from './circuit.js'
import { DessinObjet } from './objets.jsx'

export const BORNES = [
  [-42, 24],
  [42, 24],
]

// Dégradés partagés : à placer une fois dans le <svg>
export function DefsComposants() {
  return (
    <defs>
      <linearGradient id="el-socle" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3A4560" />
        <stop offset="1" stopColor="#222A3D" />
      </linearGradient>
      <linearGradient id="el-laiton" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FCE9A4" />
        <stop offset=".45" stopColor="#D4A93E" />
        <stop offset="1" stopColor="#8C6A1E" />
      </linearGradient>
      <linearGradient id="el-pile" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#8E1C25" />
        <stop offset=".35" stopColor="#E0384A" />
        <stop offset=".6" stopColor="#C42536" />
        <stop offset="1" stopColor="#6E121B" />
      </linearGradient>
      <linearGradient id="el-metal" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#7C8496" />
        <stop offset=".4" stopColor="#EEF1F7" />
        <stop offset=".7" stopColor="#AEB5C4" />
        <stop offset="1" stopColor="#5E6577" />
      </linearGradient>
      <radialGradient id="el-cloche" cx=".35" cy=".3" r=".75">
        <stop offset="0" stopColor="#FFF3C2" />
        <stop offset=".4" stopColor="#E5B84B" />
        <stop offset="1" stopColor="#8A6418" />
      </radialGradient>
      <radialGradient id="el-verre" cx=".35" cy=".35" r=".7">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity=".55" />
        <stop offset=".6" stopColor="#DDEBFF" stopOpacity=".12" />
        <stop offset="1" stopColor="#CFE0FF" stopOpacity=".3" />
      </radialGradient>
      <radialGradient id="el-verre-allume" cx=".5" cy=".55" r=".6">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset=".35" stopColor="#FFF4B8" />
        <stop offset="1" stopColor="#FFC93C" stopOpacity=".85" />
      </radialGradient>
      <radialGradient id="el-halo" cx=".5" cy=".5" r=".5">
        <stop offset="0" stopColor="#FFF4B8" stopOpacity=".95" />
        <stop offset=".3" stopColor="#FFE16B" stopOpacity=".45" />
        <stop offset="1" stopColor="#FFD23F" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="el-halo-rouge" cx=".5" cy=".5" r=".5">
        <stop offset="0" stopColor="#FFD0D0" stopOpacity=".95" />
        <stop offset=".3" stopColor="#FF4040" stopOpacity=".5" />
        <stop offset="1" stopColor="#FF2020" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="el-del" cx=".4" cy=".3" r=".8">
        <stop offset="0" stopColor="#FF9C9C" stopOpacity=".9" />
        <stop offset="1" stopColor="#8E0F0F" stopOpacity=".85" />
      </radialGradient>
      <radialGradient id="el-del-allumee" cx=".45" cy=".4" r=".7">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset=".35" stopColor="#FF6A6A" />
        <stop offset="1" stopColor="#E01010" />
      </radialGradient>
      <radialGradient id="el-halo-led" cx=".5" cy=".5" r=".5">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity=".95" />
        <stop offset=".3" stopColor="#DDF2FF" stopOpacity=".5" />
        <stop offset="1" stopColor="#BFE6FF" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="el-ruban" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#F4F1E6" />
        <stop offset="1" stopColor="#D8D2BE" />
      </linearGradient>
      <linearGradient id="el-console" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#5B6CFF" />
        <stop offset="1" stopColor="#2E36A8" />
      </linearGradient>
      <linearGradient id="el-bobine" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#E8915A" />
        <stop offset=".5" stopColor="#B85A24" />
        <stop offset="1" stopColor="#7A3410" />
      </linearGradient>
      <linearGradient id="el-bois" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#C8925A" />
        <stop offset="1" stopColor="#8E5B2C" />
      </linearGradient>
      <filter id="el-ombre" x="-30%" y="-30%" width="160%" height="170%">
        <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#000" floodOpacity=".45" />
      </filter>
    </defs>
  )
}

// Socle commun avec ses deux bornes à vis en laiton
function Socle({ largeur = 104, haut = 8 }) {
  return (
    <g>
      <rect x={-largeur / 2} y={haut} width={largeur} height={30} rx="8" fill="url(#el-socle)" stroke="#11182A" strokeWidth="1" filter="url(#el-ombre)" />
      <rect x={-largeur / 2 + 3} y={haut + 2} width={largeur - 6} height="3" rx="1.5" fill="#FFFFFF" opacity=".08" />
      {BORNES.map(([x, y]) => (
        <g key={x}>
          <circle cx={x} cy={y} r="7.5" fill="url(#el-laiton)" stroke="#6B4F12" strokeWidth=".8" />
          <path d={`M${x - 4} ${y - 1.2} L${x + 4} ${y + 1.2}`} stroke="#6B4F12" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      ))}
    </g>
  )
}

// Bandes de métal qui relient une borne au composant
function Liaison({ de, a }) {
  return <path d={`M${de[0]} ${de[1]} L${a[0]} ${a[1]}`} stroke="url(#el-laiton)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
}

// ---------------- Vue « photo » ----------------
export function Photo({ c, r = {} }) {
  switch (c.type) {
    case 'pile':
      return <Pile c={c} r={r} />
    case 'ampoule':
      return <Ampoule c={c} r={r} />
    case 'del':
      return <RubanLed r={r} />
    case 'console':
      return <Console r={r} />
    case 'enceinte':
      return <Enceinte r={r} />
    case 'moteur':
      return <Moteur r={r} />
    case 'sonnette':
      return <Sonnette r={r} />
    case 'interrupteur':
      return <Interrupteur c={c} />
    case 'poussoir':
      return <Poussoir c={c} />
    case 'objet':
      return <Objet c={c} />
    default:
      return null
  }
}

function Pile({ c, r }) {
  const chauffe = r.courtCircuit
  return (
    <g>
      <Socle />
      {/* lamelles : la courte (+) à gauche, la longue (−) à droite */}
      <path d="M-14 -44 L-14 -52 L-36 -52 L-36 6 L-42 18" fill="none" stroke="url(#el-laiton)" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M14 -44 L14 -58 L36 -58 L36 6 L42 18" fill="none" stroke="url(#el-laiton)" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
      <rect x="-30" y="-46" width="60" height="58" rx="5" fill="url(#el-pile)" stroke="#4A0C12" strokeWidth="1" />
      <rect x="-30" y="-46" width="60" height="9" rx="4" fill="#1B1E27" />
      <rect x="-26" y="-30" width="52" height="24" rx="3" fill="#FFFFFF" opacity=".93" />
      <path d="M3 -28 L-6 -17 L0 -17 L-3 -8 L7 -20 L1 -20 Z" fill="#B3202E" />
      <rect x="-26" y="-2" width="52" height="3" fill="#FFFFFF" opacity=".25" />
      <text x="-22" y="-56" textAnchor="middle" fontSize="15" fontWeight="900" fill="#FF6B7A">
        +
      </text>
      <text x="22" y="-62" textAnchor="middle" fontSize="17" fontWeight="900" fill="#7CB8FF">
        −
      </text>
      {chauffe && <rect x="-32" y="-48" width="64" height="62" rx="6" fill="#FF5A1F" className="elec-chauffe" style={{ mixBlendMode: 'screen' }} />}
    </g>
  )
}

function Ampoule({ c, r }) {
  const e = c.grillee ? 0 : Math.min(2.6, r.eclat ?? 0) // 1 = une pile, 2,6 = deux piles ou plus
  return (
    <g>
      <Socle />
      <Liaison de={[-42, 24]} a={[-11, 10]} />
      <Liaison de={[42, 24]} a={[11, 10]} />
      {/* douille */}
      <rect x="-15" y="-6" width="30" height="18" rx="2" fill="url(#el-metal)" stroke="#4E5566" strokeWidth=".8" />
      {[-2, 3, 8].map((y) => (
        <path key={y} d={`M-15 ${y} L15 ${y}`} stroke="#5E6577" strokeWidth="1" />
      ))}
      {/* ampoule */}
      <path
        d="M0 -64 C-22 -64 -27 -44 -24 -33 C-21 -23 -12 -18 -11 -8 L11 -8 C12 -18 21 -23 24 -33 C27 -44 22 -64 0 -64 Z"
        fill={c.grillee ? '#7C7466' : e > 0 ? 'url(#el-verre-allume)' : 'url(#el-verre)'}
        fillOpacity={c.grillee ? 0.55 : e > 0 ? 0.35 + 0.65 * Math.min(1, e) : 1}
        stroke={e > 0 ? '#FFF2B0' : '#DDEBFF'}
        strokeOpacity=".75"
        strokeWidth="1.3"
      />
      {/* fils de support et filament */}
      <path d="M-5 -8 L-6 -34 M5 -8 L6 -34" stroke="#C7CCD6" strokeWidth="1" fill="none" />
      {c.grillee ? (
        <path d="M-6 -34 Q-3 -40 -1 -36 M6 -34 Q3 -39 2 -41" stroke="#3A3530" strokeWidth="1.4" fill="none" />
      ) : (
        <path d="M-6 -34 Q-4 -41 -2 -34 Q0 -41 2 -34 Q4 -41 6 -34" stroke={e > 0 ? '#FFFFFF' : '#8A8E99'} strokeWidth={e > 0 ? 2 : 1.2} fill="none" />
      )}
      <path d="M-14 -52 Q-18 -44 -16 -36" stroke="#FFFFFF" strokeOpacity=".75" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* cœur éblouissant quand l'ampoule reçoit plus que d'habitude (2 ou 3 piles) */}
      {e > 1.1 && <circle cx="0" cy="-36" r={8 + 9 * (e - 1)} fill="#FFFFFF" opacity={Math.min(0.95, 0.35 + 0.4 * (e - 1))} style={{ filter: 'blur(3px)' }} />}
      {c.grillee && <ellipse cx="2" cy="-48" rx="9" ry="5" fill="#2B2620" opacity=".55" />}
      {r.surcharge && !c.grillee && <circle cx="0" cy="-36" r="30" fill="#FFFFFF" className="elec-chauffe" opacity=".6" />}
    </g>
  )
}

// Lampe LED : un petit morceau de ruban de LED (3 LED sur une bande souple)
function RubanLed({ r }) {
  const e = r.allumee ? Math.min(2.6, r.eclat ?? 1) : 0
  return (
    <g>
      <Socle />
      {/* fils soudés aux pastilles + et − du ruban */}
      <path d="M-38 -22 C-46 -14 -46 4 -42 18" stroke="#E0384A" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M38 -22 C46 -14 46 4 42 18" stroke="#1E2230" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* la bande souple */}
      <rect x="-42" y="-32" width="84" height="20" rx="3" fill="url(#el-ruban)" stroke="#A39C84" strokeWidth=".8" filter="url(#el-ombre)" />
      <path d="M-40 -16 L40 -16" stroke="#C9A64A" strokeWidth="1.2" />
      <path d="M-40 -28 L40 -28" stroke="#C9A64A" strokeWidth="1.2" />
      {/* pastilles de cuivre */}
      <rect x="-40" y="-29" width="7" height="14" rx="1.5" fill="url(#el-laiton)" />
      <rect x="33" y="-29" width="7" height="14" rx="1.5" fill="url(#el-laiton)" />
      {/* les 3 LED */}
      {[-18, 0, 18].map((x) => (
        <g key={x}>
          <rect x={x - 6} y="-28" width="12" height="12" rx="1.5" fill="#F5F7FA" stroke="#B9BFCC" strokeWidth=".7" />
          <circle cx={x} cy="-22" r="4.2" fill={e > 0 ? '#FFFFFF' : '#F2E38A'} stroke={e > 0 ? '#DDF2FF' : '#D9C35A'} strokeWidth=".8" />
          {e > 0 && <circle cx={x} cy="-22" r={6 + 3 * e} fill="#FFFFFF" opacity={Math.min(0.9, 0.35 + 0.25 * e)} style={{ filter: 'blur(2.5px)' }} />}
        </g>
      ))}
      {/* petites résistances entre les LED */}
      {[-9, 9].map((x) => (
        <rect key={x} x={x - 2.5} y="-19" width="5" height="3" fill="#1B1E27" />
      ))}
      <text x="-36" y="-37" textAnchor="middle" fontSize="13" fontWeight="900" fill="#FF6B7A">
        +
      </text>
      <text x="36" y="-36" textAnchor="middle" fontSize="15" fontWeight="900" fill="#7CB8FF">
        −
      </text>
    </g>
  )
}

// Console de jeu portable (fonctionne avec des piles) : l'écran s'allume et le jeu tourne
function Console({ r }) {
  const on = !!r.allumee
  return (
    <g>
      <Socle />
      <path d="M-30 -2 C-40 4 -44 10 -42 18" stroke="#E0384A" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M30 -2 C40 4 44 10 42 18" stroke="#1E2230" strokeWidth="3" fill="none" strokeLinecap="round" />
      <rect x="-34" y="-62" width="68" height="64" rx="12" fill="url(#el-console)" stroke="#1B1F5E" strokeWidth="1" filter="url(#el-ombre)" />
      <rect x="-22" y="-56" width="44" height="30" rx="3" fill={on ? '#0E2A1A' : '#151A26'} stroke="#0B0E15" />
      {on && (
        <g>
          <rect x="-22" y="-56" width="44" height="30" rx="3" fill="#3BE37A" opacity=".18" />
          <rect x="-20" y="-32" width="40" height="3" fill="#7CFF6B" />
          {/* petit héros qui saute, pièces qui défilent */}
          <g className="elec-saut">
            <rect x="-12" y="-41" width="6" height="7" rx="1" fill="#FFE45E" />
            <rect x="-11" y="-44" width="4" height="3" fill="#FFB86B" />
          </g>
          <g className="elec-defile">
            <circle cx="8" cy="-44" r="2" fill="#FFE45E" />
            <circle cx="16" cy="-40" r="2" fill="#FFE45E" />
            <rect x="12" y="-36" width="5" height="4" fill="#FF6B7A" />
          </g>
          <rect x="-22" y="-56" width="44" height="30" rx="3" fill="#FFFFFF" opacity={Math.min(0.25, 0.05 * (r.niveau ?? 1))} />
        </g>
      )}
      {/* croix directionnelle et boutons */}
      <path d="M-20 -17 L-12 -17 M-16 -21 L-16 -13" stroke="#0B0E15" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="12" cy="-14" r="3.2" fill="#FF6B7A" />
      <circle cx="20" cy="-19" r="3.2" fill="#FFE45E" />
      <circle cx="24" cy="-54" r="1.8" fill={on ? '#9DFF8A' : '#3A3F55'} />
      <text x="-38" y="-6" textAnchor="middle" fontSize="12" fontWeight="900" fill="#FF6B7A">
        +
      </text>
    </g>
  )
}

// Petite enceinte musicale : la membrane vibre, des notes s'envolent
function Enceinte({ r }) {
  const on = !!r.joue
  return (
    <g>
      <Socle />
      <path d="M-24 0 C-38 4 -44 10 -42 18" stroke="#E0384A" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M24 0 C38 4 44 10 42 18" stroke="#1E2230" strokeWidth="3" fill="none" strokeLinecap="round" />
      <rect x="-26" y="-62" width="52" height="66" rx="10" fill="#22283A" stroke="#0B0E15" strokeWidth="1" filter="url(#el-ombre)" />
      <circle cx="0" cy="-48" r="5" fill="#0B0E15" stroke="#4E5566" />
      <g className={on ? 'elec-membrane' : ''} style={{ transformOrigin: '0px -20px' }}>
        <circle cx="0" cy="-20" r="17" fill="#0B0E15" stroke="#5E6577" strokeWidth="1.5" />
        <circle cx="0" cy="-20" r="11" fill="#2A3147" />
        <circle cx="0" cy="-20" r="4.5" fill="#5E6577" />
      </g>
      <circle cx="16" cy="-56" r="1.8" fill={on ? '#3EC9FF' : '#3A3F55'} />
      {on &&
        [
          [30, 0],
          [36, 0.6],
          [26, 1.2],
        ].map(([x, d]) => (
          <text key={d} x={x} y="-40" fontSize="15" fontWeight="900" fill="#3EC9FF" className="elec-note" style={{ animationDelay: `${d}s` }}>
            ♪
          </text>
        ))}
      <text x="-32" y="-2" textAnchor="middle" fontSize="12" fontWeight="900" fill="#FF6B7A">
        +
      </text>
    </g>
  )
}

function Moteur({ r }) {
  const v = r.vitesse ?? 0
  const duree = v ? `${(0.5 / Math.abs(v)).toFixed(2)}s` : '0s'
  return (
    <g>
      <Socle />
      <Liaison de={[-42, 24]} a={[-14, 8]} />
      <Liaison de={[42, 24]} a={[14, 8]} />
      {/* support et corps du moteur (vu de face) */}
      <path d="M-22 10 L-16 -8 L16 -8 L22 10 Z" fill="#2A3147" stroke="#141A2B" strokeWidth=".8" />
      <circle cx="0" cy="-26" r="22" fill="url(#el-metal)" stroke="#4E5566" strokeWidth="1" />
      <circle cx="0" cy="-26" r="15" fill="#C9CED8" stroke="#8C93A3" strokeWidth=".8" />
      {[0, 120, 240].map((a) => (
        <rect key={a} x="-2" y="-41" width="4" height="6" rx="1" fill="#6E7586" transform={`rotate(${a} 0 -26)`} />
      ))}
      {/* hélice */}
      <g className={v ? 'elec-tourne' : ''} style={{ animationDuration: duree, animationDirection: v < 0 ? 'reverse' : 'normal' }}>
        {[0, 120, 240].map((a) => (
          <path key={a} d="M0 -26 C6 -36 6 -52 -1 -58 C-7 -50 -7 -36 0 -26 Z" fill="#3EC9FF" stroke="#0F6E8F" strokeWidth=".8" opacity=".95" transform={`rotate(${a} 0 -26)`} />
        ))}
        <circle cx="0" cy="-26" r="4.5" fill="#1B2232" stroke="#8C93A3" />
      </g>
      {v !== 0 && (
        <text x="36" y="-46" textAnchor="middle" fontSize="16" fontWeight="900" fill="#3EC9FF">
          {v > 0 ? '↻' : '↺'}
        </text>
      )}
    </g>
  )
}

function Sonnette({ r }) {
  return (
    <g>
      <Socle />
      <Liaison de={[-42, 24]} a={[-24, 8]} />
      <Liaison de={[42, 24]} a={[-16, 8]} />
      {/* électroaimant (bobine de cuivre) */}
      <rect x="-30" y="-24" width="20" height="32" rx="3" fill="url(#el-bobine)" stroke="#5A2508" strokeWidth=".8" />
      {[-20, -14, -8, -2, 4].map((y) => (
        <path key={y} d={`M-30 ${y} L-10 ${y}`} stroke="#6B300C" strokeWidth=".8" />
      ))}
      {/* cloche (timbre) */}
      <path d="M2 -6 L40 -6 C40 -34 34 -44 21 -44 C8 -44 2 -34 2 -6 Z" fill="url(#el-cloche)" stroke="#6B4C10" strokeWidth="1" />
      <rect x="18" y="-6" width="6" height="14" fill="#2A3147" />
      {/* marteau */}
      <g className={r.sonne ? 'elec-sonne' : ''} style={{ transformOrigin: '-20px -24px' }}>
        <path d="M-20 -24 L-6 -36" stroke="#AEB5C4" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="-4" cy="-37" r="4.5" fill="#2A3147" stroke="#AEB5C4" />
      </g>
      {r.sonne &&
        [0, 0.23, 0.46].map((d) => (
          <path key={d} d="M46 -38 Q54 -26 46 -14" fill="none" stroke="#FFE45E" strokeWidth="2.2" strokeLinecap="round" className="elec-onde" style={{ animationDelay: `${d}s` }} />
        ))}
    </g>
  )
}

// Les deux pinces du testeur, avec l'objet glissé entre elles
function Objet({ c }) {
  return (
    <g>
      <Socle />
      <path d="M-42 18 L-42 -8 M42 18 L42 -8" stroke="url(#el-laiton)" strokeWidth="3" />
      {c.objet ? (
        <g transform="translate(0 -16)">
          <DessinObjet id={c.objet} />
        </g>
      ) : (
        <g className="labo-pulse">
          <rect x="-34" y="-36" width="68" height="44" rx="8" fill="rgba(62,201,255,.10)" stroke="#3EC9FF" strokeWidth="2.2" strokeDasharray="6 4" />
          <text x="0" y="-16" textAnchor="middle" fontSize="11" fontWeight="900" fill="#3EC9FF">
            Place un
          </text>
          <text x="0" y="-3" textAnchor="middle" fontSize="11" fontWeight="900" fill="#3EC9FF">
            objet ici
          </text>
        </g>
      )}
      {[-1, 1].map((s) => (
        <g key={s} transform={`translate(${s * 42} -10) scale(${s} 1)`}>
          <path d="M0 -8 L-14 -5 L-14 3 L0 0 Z" fill="#E0384A" stroke="#6E121B" strokeWidth=".6" />
          <path d="M0 4 L-14 9 L-14 15 L0 10 Z" fill="#C42536" stroke="#6E121B" strokeWidth=".6" />
          <path d="M-14 -3 L-6 -1 M-14 12 L-6 9" stroke="url(#el-metal)" strokeWidth="2" />
        </g>
      ))}
    </g>
  )
}

function Interrupteur({ c }) {
  const angle = c.ferme ? 0 : -52
  return (
    <g>
      <Socle />
      <rect x="-40" y="-2" width="80" height="12" rx="3" fill="url(#el-bois)" />
      <Liaison de={[-42, 24]} a={[-26, 6]} />
      <Liaison de={[42, 24]} a={[26, 6]} />
      {/* pince d'arrivée */}
      <path d="M22 -10 L22 4 M30 -10 L30 4" stroke="url(#el-laiton)" strokeWidth="3" />
      <rect x="21" y="2" width="10" height="6" fill="url(#el-laiton)" />
      {/* pivot + lame */}
      <rect x="-31" y="-6" width="10" height="14" rx="2" fill="url(#el-laiton)" />
      <g transform={`rotate(${angle} -26 -3)`} style={{ transition: 'transform .25s ease-out' }}>
        <rect x="-26" y="-6" width="56" height="6" rx="2" fill="url(#el-metal)" stroke="#4E5566" strokeWidth=".6" />
        <rect x="26" y="-15" width="8" height="12" rx="3" fill="#1B1E27" />
        <circle cx="30" cy="-19" r="7" fill="#E0384A" stroke="#6E121B" />
      </g>
      <circle cx="-26" cy="-3" r="3" fill="#6B4F12" />
      {/* zone tactile : levier */}
      <circle data-action="1" cx="6" cy="-14" r="30" fill="transparent" />
      <text x="0" y="-38" textAnchor="middle" fontSize="9" fontWeight="700" fill={c.ferme ? '#9DFF8A' : '#FFB86B'}>
        {c.ferme ? 'FERMÉ' : 'OUVERT'}
      </text>
    </g>
  )
}

function Poussoir({ c }) {
  const p = !!c.presse
  return (
    <g>
      <Socle />
      <Liaison de={[-42, 24]} a={[-14, 6]} />
      <Liaison de={[42, 24]} a={[14, 6]} />
      <rect x="-20" y="-20" width="40" height="28" rx="5" fill="#1B1E27" stroke="#0B0E15" />
      <rect x="-20" y="-20" width="40" height="5" rx="3" fill="#FFFFFF" opacity=".08" />
      <ellipse cx="0" cy={p ? -18 : -24} rx="13" ry="5" fill="#8E1C25" />
      <rect x="-13" y={p ? -26 : -34} width="26" height={p ? 8 : 10} fill="#C42536" />
      <ellipse cx="0" cy={p ? -26 : -34} rx="13" ry="5" fill={p ? '#FF6B7A' : '#E0384A'} stroke="#6E121B" strokeWidth=".6" />
      <circle data-action="1" cx="0" cy="-22" r="26" fill="transparent" />
      <text x="0" y="-46" textAnchor="middle" fontSize="9" fontWeight="700" fill={p ? '#9DFF8A' : '#8A93B8'}>
        {p ? 'APPUYÉ' : 'APPUIE'}
      </text>
    </g>
  )
}

// Halo de lumière d'une ampoule / DEL allumée (dessiné sous les fils)
export function Halo({ c, r }) {
  if (c.type === 'ampoule' && !c.grillee && r?.eclat > 0) {
    // plus de piles → halo nettement plus grand et plus lumineux
    const e = Math.min(2.6, r.eclat)
    const t = 52 + 58 * e
    return <circle cx="0" cy="-36" r={t} fill="url(#el-halo)" opacity={Math.min(1, 0.3 + e * 0.45)} />
  }
  if (c.type === 'del' && r?.allumee) {
    const e = Math.min(2.6, r.eclat ?? 1)
    return <circle cx="0" cy="-22" r={42 + 22 * e} fill="url(#el-halo-led)" opacity={Math.min(1, 0.45 + 0.25 * e)} />
  }
  if (c.type === 'console' && r?.allumee) return <circle cx="0" cy="-42" r={46} fill="url(#el-halo-led)" opacity={0.35} />
  return null
}

// ---------------- Vue « schéma » (symboles normalisés) ----------------
export function Symbole({ c }) {
  const t = { stroke: '#151A26', strokeWidth: 2.4, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }
  const y = 24
  const fil = (x1, x2) => <path d={`M${x1} ${y} L${x2} ${y}`} {...t} />
  const borne = BORNES.map(([x]) => <circle key={x} cx={x} cy={y} r="3" fill="#151A26" />)
  // contact d'interrupteur : petit cercle creux
  const contact = (x) => <circle cx={x} cy={y} r="3.4" fill="#F7F5EE" stroke="#151A26" strokeWidth="1.8" />
  let corps = null
  switch (c.type) {
    case 'pile':
      corps = (
        <>
          {fil(-42, -5)}
          {fil(5, 42)}
          <path d={`M-5 ${y - 18} L-5 ${y + 18}`} {...t} />
          <path d={`M5 ${y - 9} L5 ${y + 9}`} {...t} strokeWidth="6" strokeLinecap="butt" />
          <text x="-14" y={y - 12} textAnchor="middle" fontSize="13" fontWeight="800" fill="#151A26">
            +
          </text>
          <text x="15" y={y - 12} textAnchor="middle" fontSize="14" fontWeight="800" fill="#151A26">
            −
          </text>
        </>
      )
      break
    case 'ampoule':
      corps = (
        <>
          {fil(-42, -13)}
          {fil(13, 42)}
          <circle cx="0" cy={y} r="13" {...t} />
          <path d={`M-9 ${y - 9} L9 ${y + 9} M9 ${y - 9} L-9 ${y + 9}`} {...t} />
        </>
      )
      break
    case 'moteur':
      corps = (
        <>
          {fil(-42, -13)}
          {fil(13, 42)}
          <circle cx="0" cy={y} r="13" {...t} />
          <text x="0" y={y + 5} textAnchor="middle" fontSize="15" fontWeight="800" fill="#151A26">
            M
          </text>
        </>
      )
      break
    case 'sonnette':
      corps = (
        <>
          {fil(-42, -10)}
          {fil(10, 42)}
          <path d={`M-10 ${y} L-10 ${y - 6} M10 ${y} L10 ${y - 6}`} {...t} />
          <path d={`M-16 ${y - 6} L16 ${y - 6} A16 16 0 0 0 -16 ${y - 6} Z`} {...t} />
        </>
      )
      break
    case 'del':
      corps = (
        <>
          {fil(-42, -24)}
          {fil(-6, 10)}
          {fil(30, 42)}
          <path d={`M-24 ${y - 9} L-24 ${y + 9} L-8 ${y} Z`} {...t} fill="#151A26" />
          <path d={`M-7 ${y - 10} L-7 ${y + 10}`} {...t} />
          <path d={`M-16 ${y - 13} L-10 ${y - 21} M-11 ${y - 15} L-10 ${y - 21} L-15 ${y - 20}`} {...t} strokeWidth="1.6" />
          <path d={`M-9 ${y - 12} L-3 ${y - 20} M-4 ${y - 14} L-3 ${y - 20} L-8 ${y - 19}`} {...t} strokeWidth="1.6" />
          <rect x="10" y={y - 5} width="20" height="10" {...t} />
        </>
      )
      break
    case 'console':
      // récepteur quelconque : un rectangle (+ le côté « + »)
      corps = (
        <>
          {fil(-42, -18)}
          {fil(18, 42)}
          <rect x="-18" y={y - 10} width="36" height="20" {...t} />
          <path d={`M-8 ${y} L-2 ${y} M-5 ${y - 3} L-5 ${y + 3}`} {...t} strokeWidth="1.6" />
          <circle cx="7" cy={y} r="2" fill="#151A26" />
          <text x="-28" y={y - 8} textAnchor="middle" fontSize="12" fontWeight="800" fill="#151A26">
            +
          </text>
        </>
      )
      break
    case 'enceinte':
      // symbole normalisé du haut-parleur
      corps = (
        <>
          {fil(-42, -12)}
          {fil(12, 42)}
          <path d={`M-12 ${y} L-12 ${y - 10} M12 ${y} L12 ${y - 10}`} {...t} />
          <rect x="-12" y={y - 22} width="24" height="12" {...t} />
          <path d={`M-12 ${y - 22} L-22 ${y - 36} L22 ${y - 36} L12 ${y - 22}`} {...t} />
          <text x="-28" y={y - 8} textAnchor="middle" fontSize="12" fontWeight="800" fill="#151A26">
            +
          </text>
        </>
      )
      break
    case 'interrupteur':
      corps = c.ferme ? (
        <>
          {fil(-42, -14)}
          {fil(14, 42)}
          <path d={`M-14 ${y} L14 ${y - 1}`} {...t} strokeWidth="3" />
          {contact(-14)}
          {contact(14)}
        </>
      ) : (
        <>
          {fil(-42, -14)}
          {fil(14, 42)}
          <path d={`M-14 ${y} L12 ${y - 16}`} {...t} />
          {contact(-14)}
          {contact(14)}
        </>
      )
      break
    case 'poussoir':
      corps = (
        <>
          {fil(-42, -14)}
          {fil(14, 42)}
          <path d={c.presse ? `M-14 ${y} L14 ${y}` : `M-14 ${y - 9} L14 ${y - 9}`} {...t} strokeWidth="3" />
          <path d={c.presse ? `M0 ${y} L0 ${y - 14} M-7 ${y - 14} L7 ${y - 14}` : `M0 ${y - 9} L0 ${y - 22} M-7 ${y - 22} L7 ${y - 22}`} {...t} />
          {contact(-14)}
          {contact(14)}
        </>
      )
      break
    default:
      corps = fil(-42, 42)
  }
  return (
    <g>
      <rect x="-50" y={y - 30} width="100" height="60" fill="transparent" />
      {corps}
      {borne}
      {c.type === 'interrupteur' && <circle data-action="1" cx="0" cy={y - 6} r="22" fill="transparent" />}
      {c.type === 'poussoir' && <circle data-action="1" cx="0" cy={y - 12} r="22" fill="transparent" />}
    </g>
  )
}

export const nomComposant = (c) => COMPOSANTS[c.type]?.nom ?? c.type
