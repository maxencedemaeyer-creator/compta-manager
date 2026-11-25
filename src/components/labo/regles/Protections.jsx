// =============================================================
//  Les dessins des 5 protections menstruelles (schémas simples,
//  vue de dessus ou de face, sans photo).  Boîte de 120 × 120.
// =============================================================
const L = '#7A4458'

function Serviette({ lavable }) {
  return (
    <g>
      {/* ailettes */}
      <path d="M38 48 C24 48 20 58 24 64 C28 70 38 70 38 70 Z" fill={lavable ? '#CDE6DC' : '#FFFFFF'} stroke={L} strokeWidth={2.4} strokeLinejoin="round" />
      <path d="M82 48 C96 48 100 58 96 64 C92 70 82 70 82 70 Z" fill={lavable ? '#CDE6DC' : '#FFFFFF'} stroke={L} strokeWidth={2.4} strokeLinejoin="round" />
      {/* corps */}
      <rect x={38} y={12} width={44} height={96} rx={22} fill={lavable ? '#DFF0E8' : '#FFFFFF'} stroke={L} strokeWidth={2.6} />
      <rect x={47} y={22} width={26} height={76} rx={13} fill={lavable ? '#B9DCCB' : '#FBE3E6'} stroke="#E3A9B1" strokeWidth={1.5} />
      {lavable ? (
        <>
          {[[60, 34], [54, 52], [66, 52], [60, 70], [54, 88], [66, 88]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={2.6} fill="#5E9C86" />
          ))}
          <circle cx={30} cy={59} r={4} fill="#fff" stroke={L} strokeWidth={1.8} />
          <circle cx={90} cy={59} r={4} fill="#fff" stroke={L} strokeWidth={1.8} />
        </>
      ) : (
        <>
          {[34, 46, 58, 70, 82].map((y) => (
            <path key={y} d={`M54 ${y} Q60 ${y + 3} 66 ${y}`} fill="none" stroke="#E3A9B1" strokeWidth={1.6} strokeLinecap="round" />
          ))}
        </>
      )}
    </g>
  )
}

function Tampon() {
  return (
    <g>
      {/* ficelle */}
      <path d="M60 84 C52 96 68 100 58 114" fill="none" stroke={L} strokeWidth={2.6} strokeLinecap="round" />
      {/* corps */}
      <path d="M44 38 C44 14 76 14 76 38 L76 80 Q76 86 70 86 L50 86 Q44 86 44 80 Z" fill="#FFFFFF" stroke={L} strokeWidth={2.6} strokeLinejoin="round" />
      {[34, 44, 54, 64, 74].map((y) => (
        <path key={y} d={`M46 ${y} Q60 ${y + 4} 74 ${y}`} fill="none" stroke="#E3A9B1" strokeWidth={1.8} strokeLinecap="round" />
      ))}
      <path d="M50 28 C50 20 56 17 60 17" fill="none" stroke="#fff" strokeWidth={0} />
    </g>
  )
}

function Cup() {
  return (
    <g>
      {/* tige */}
      <path d="M60 78 L60 108" stroke={L} strokeWidth={7} strokeLinecap="round" />
      <path d="M60 78 L60 108" stroke="#D4C5EC" strokeWidth={3.4} strokeLinecap="round" />
      {/* coupe */}
      <path d="M32 24 C32 62 44 82 60 82 C76 82 88 62 88 24 Z" fill="#D9CCF0" stroke={L} strokeWidth={2.6} strokeLinejoin="round" />
      <ellipse cx={60} cy={24} rx={28} ry={8} fill="#EEE8F8" stroke={L} strokeWidth={2.6} />
      <path d="M44 38 C44 56 50 68 58 74" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" opacity={0.7} />
      {/* petits trous sous le bord */}
      {[48, 60, 72].map((x) => (
        <circle key={x} cx={x} cy={36} r={1.6} fill={L} />
      ))}
    </g>
  )
}

function Culotte() {
  return (
    <g>
      <path d="M16 28 L104 28 L104 40 C104 60 86 66 80 90 L72 104 Q60 110 48 104 L40 90 C34 66 16 60 16 40 Z" fill="#E8DDF5" stroke={L} strokeWidth={2.6} strokeLinejoin="round" />
      <rect x={16} y={24} width={88} height={10} rx={5} fill="#C9B8E8" stroke={L} strokeWidth={2.4} />
      <path d="M48 56 C50 72 50 84 52 98 Q60 102 68 98 C70 84 70 72 72 56 Z" fill="#B9A6DA" stroke={L} strokeWidth={1.8} strokeLinejoin="round" />
      {[66, 76, 86].map((y) => (
        <path key={y} d={`M54 ${y} Q60 ${y + 3} 66 ${y}`} fill="none" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" />
      ))}
    </g>
  )
}

export default function IconeProtection({ id, className = '', titre }) {
  return (
    <svg viewBox="0 0 120 120" className={className} role="img" aria-label={titre}>
      {id === 'serviette' && <Serviette />}
      {id === 'lavable' && <Serviette lavable />}
      {id === 'tampon' && <Tampon />}
      {id === 'cup' && <Cup />}
      {id === 'culotte' && <Culotte />}
    </svg>
  )
}
