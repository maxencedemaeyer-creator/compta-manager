// =============================================================
//  Petits visages dessinés (pas de photos) pour les histoires.
//  Variés : peaux, cheveux, coiffures. Humeurs : content, neutre,
//  surpris, inquiet, fier.
// =============================================================
const L = '#5A3A48'

export const VISAGES = {
  lou: { peau: '#F6D2B4', cheveux: '#7A4B2A', coiffure: 'court' },
  sami: { peau: '#9A6A4A', cheveux: '#2E2024', coiffure: 'boucles' },
  ines: { peau: '#E8B890', cheveux: '#3A2A2A', coiffure: 'long' },
  noa: { peau: '#FBE0C8', cheveux: '#C98B3C', coiffure: 'chignon' },
}

function Coiffure({ type, couleur }) {
  switch (type) {
    case 'long':
      return (
        <>
          <path d="M18 56 C14 20 40 10 50 10 C60 10 86 20 82 56 C84 76 80 88 74 92 L74 56 L26 56 L26 92 C20 88 16 76 18 56 Z" fill={couleur} stroke={L} strokeWidth={2.4} strokeLinejoin="round" />
        </>
      )
    case 'boucles':
      return (
        <g fill={couleur} stroke={L} strokeWidth={2.2}>
          {[[24, 40], [32, 26], [46, 20], [60, 20], [72, 26], [78, 40], [20, 54], [80, 54]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={11} />
          ))}
        </g>
      )
    case 'chignon':
      return (
        <>
          <circle cx={50} cy={13} r={12} fill={couleur} stroke={L} strokeWidth={2.4} />
          <path d="M20 50 C18 24 38 18 50 18 C62 18 82 24 80 50 C70 40 58 34 50 34 C42 34 30 40 20 50 Z" fill={couleur} stroke={L} strokeWidth={2.4} strokeLinejoin="round" />
        </>
      )
    default:
      return <path d="M20 52 C16 22 36 14 50 14 C64 14 84 22 80 52 C72 42 62 36 50 36 C38 36 28 42 20 52 Z" fill={couleur} stroke={L} strokeWidth={2.4} strokeLinejoin="round" />
  }
}

export default function Visage({ id = 'lou', humeur = 'content', className = '', titre }) {
  const v = VISAGES[id] || VISAGES.lou
  const derriere = v.coiffure === 'long' || v.coiffure === 'boucles'
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label={titre || `Visage, humeur : ${humeur}`}>
      {derriere && <Coiffure type={v.coiffure} couleur={v.cheveux} />}
      <circle cx={50} cy={54} r={30} fill={v.peau} stroke={L} strokeWidth={2.4} />
      {!derriere && <Coiffure type={v.coiffure} couleur={v.cheveux} />}
      {derriere && v.coiffure === 'long' && <path d="M22 50 C28 36 40 32 50 32 C60 32 72 36 78 50 C70 44 60 42 50 42 C40 42 30 44 22 50 Z" fill={v.cheveux} stroke={L} strokeWidth={2.2} strokeLinejoin="round" />}
      {derriere && v.coiffure === 'boucles' && <path d="M24 48 C30 36 40 34 50 34 C60 34 70 36 76 48 C68 42 60 40 50 40 C40 40 32 42 24 48 Z" fill={v.cheveux} stroke="none" />}
      {/* joues */}
      <circle cx={34} cy={64} r={5} fill="#F2A3A8" opacity={0.55} />
      <circle cx={66} cy={64} r={5} fill="#F2A3A8" opacity={0.55} />
      {/* yeux */}
      {humeur === 'surpris' ? (
        <>
          <circle cx={39} cy={54} r={5} fill="#fff" stroke={L} strokeWidth={2} />
          <circle cx={61} cy={54} r={5} fill="#fff" stroke={L} strokeWidth={2} />
          <circle cx={39} cy={54} r={2} fill={L} />
          <circle cx={61} cy={54} r={2} fill={L} />
        </>
      ) : humeur === 'content' || humeur === 'fier' ? (
        <>
          <path d="M33 55 Q39 49 45 55" fill="none" stroke={L} strokeWidth={2.6} strokeLinecap="round" />
          <path d="M55 55 Q61 49 67 55" fill="none" stroke={L} strokeWidth={2.6} strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx={39} cy={55} r={2.8} fill={L} />
          <circle cx={61} cy={55} r={2.8} fill={L} />
        </>
      )}
      {humeur === 'inquiet' && (
        <>
          <path d="M33 47 L45 44" stroke={L} strokeWidth={2.4} strokeLinecap="round" />
          <path d="M67 47 L55 44" stroke={L} strokeWidth={2.4} strokeLinecap="round" />
        </>
      )}
      {/* bouche */}
      {humeur === 'content' && <path d="M40 68 Q50 78 60 68" fill="none" stroke={L} strokeWidth={2.6} strokeLinecap="round" />}
      {humeur === 'fier' && <path d="M38 67 Q50 82 62 67 Z" fill="#fff" stroke={L} strokeWidth={2.4} strokeLinejoin="round" />}
      {humeur === 'neutre' && <path d="M41 70 H59" stroke={L} strokeWidth={2.6} strokeLinecap="round" />}
      {humeur === 'surpris' && <ellipse cx={50} cy={71} rx={4.5} ry={5.5} fill="#fff" stroke={L} strokeWidth={2.2} />}
      {humeur === 'inquiet' && <path d="M41 74 Q50 66 59 74" fill="none" stroke={L} strokeWidth={2.6} strokeLinecap="round" />}
    </svg>
  )
}
