import Corps3D from './Corps3D.jsx'
import Circulation3D from './circulation/Circulation3D.jsx'

// =============================================================
//  Le visuel animé de chaque expérience (hall et salle) :
//  le vrai squelette 3D qui tourne, l'ampoule qui s'allume
//  ou le vrai cœur 3D qui bat.
// =============================================================
export default function VisuelExperience({ type, className = '' }) {
  if (type === 'squelette') return <Corps3D className={`pointer-events-none ${className}`} tourner credit={false} marge={1.02} />
  if (type === 'ampoule') return <Ampoule className={className} />
  if (type === 'coeur')
    return (
      <Circulation3D
        className={`pointer-events-none ${className}`}
        tourner
        credit={false}
        marge={1.04}
        cadrage={{ groupes: ['paroi_ventricules', 'paroi_oreillette_d', 'paroi_oreillette_g', 'tronc_pulmonaire', 'veine_cave_sup'] }}
        battement={66}
        afficher={['coeur', 'aorte', 'tronc_pulmonaire', 'veine_cave_sup', 'veine_cave_inf', 'tronc_brachiocephalique', 'carotide', 'sous_claviere_a', 'veines_brachiocephaliques']}
      />
    )
  return null
}

// Ampoule à filament dans un petit circuit : le courant fait le tour, l'ampoule s'allume
function Ampoule({ className }) {
  const boucle = 'M70 150 L30 150 L30 86 L88 86 M100 97 L100 116 L170 116 L170 150 L130 150'
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-label="Circuit avec une pile et une ampoule allumée">
        <defs>
          <radialGradient id="ampoule-halo" cx=".5" cy=".5" r=".5">
            <stop offset="0" stopColor="#FFF4B8" stopOpacity=".95" />
            <stop offset=".35" stopColor="#FFE45E" stopOpacity=".55" />
            <stop offset="1" stopColor="#FFE45E" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ampoule-verre" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity=".35" />
            <stop offset=".5" stopColor="#FFF6C9" stopOpacity=".12" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity=".28" />
          </linearGradient>
          <linearGradient id="ampoule-culot" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#8E96A8" />
            <stop offset=".45" stopColor="#E3E8F2" />
            <stop offset="1" stopColor="#6C7385" />
          </linearGradient>
        </defs>
        {/* fils */}
        <path d={boucle} fill="none" stroke="#C77B3A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {/* courant qui circule (sens conventionnel : de la borne + vers la borne −, en passant par l'ampoule) */}
        {[0, 0.5, 1, 1.5, 2, 2.5].map((d) => (
          <circle key={d} r="3.2" fill="#FFF4B8">
            <animateMotion dur="3s" begin={`-${d}s`} repeatCount="indefinite" path="M70 150 L30 150 L30 86 L88 86 M100 97 L100 116 L170 116 L170 150 L130 150" />
          </circle>
        ))}
        {/* pile */}
        <rect x="70" y="138" width="60" height="24" rx="4" fill="#1D2438" stroke="#FFE45E" strokeWidth="2" />
        <rect x="70" y="138" width="22" height="24" rx="4" fill="#FFE45E" />
        <text x="81" y="155" textAnchor="middle" fontSize="12" fontWeight="900" fill="#1D2438">+</text>
        <text x="118" y="155" textAnchor="middle" fontSize="12" fontWeight="900" fill="#FFE45E">−</text>
        <text x="100" y="178" textAnchor="middle" fontSize="9" fill="#8A93B8">pile 4,5 V</text>
        {/* ampoule */}
        <circle cx="100" cy="62" r="54" fill="url(#ampoule-halo)" className="labo-pulse" />
        <path d="M100 26 C80 26 72 42 74 55 C76 66 86 70 88 80 L112 80 C114 70 124 66 126 55 C128 42 120 26 100 26 Z" fill="url(#ampoule-verre)" stroke="#FFF6C9" strokeOpacity=".8" strokeWidth="1.5" />
        <path d="M94 78 L94 60 M106 78 L106 60" stroke="#B9C1E3" strokeWidth="1" />
        <path d="M94 60 Q97 52 100 60 Q103 52 106 60" fill="none" stroke="#FFF4B8" strokeWidth="2.2" strokeLinecap="round">
          <animate attributeName="stroke" values="#FFF4B8;#FFFFFF;#FFE45E;#FFF4B8" dur="1.6s" repeatCount="indefinite" />
        </path>
        <rect x="88" y="80" width="24" height="12" rx="2" fill="url(#ampoule-culot)" />
        <path d="M88 84 L112 84 M88 88 L112 88" stroke="#5A6173" strokeWidth="1" />
        <path d="M92 92 L108 92 L104 97 L96 97 Z" fill="#3A4152" />
        <path d="M80 40 Q78 48 80 56" fill="none" stroke="#FFFFFF" strokeOpacity=".7" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  )
}
