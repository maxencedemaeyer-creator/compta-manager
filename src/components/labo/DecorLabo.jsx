// =============================================================
//  Décor du labo de sciences : grille de molécules, halos,
//  fumée qui monte, et la fiole Erlenmeyer qui tremble puis
//  explose toutes les 7 secondes.
// =============================================================

// Polices du labo (chargées une seule fois ; si le réseau de l'école bloque
// Google Fonts, le labo s'affiche quand même avec les polices du système)
const POLICES = 'https://fonts.googleapis.com/css2?family=Unbounded:wght@500;700;900&family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono:wght@500&display=swap'
if (typeof document !== 'undefined' && !document.getElementById('polices-labo')) {
  const lien = document.createElement('link')
  lien.id = 'polices-labo'
  lien.rel = 'stylesheet'
  lien.href = POLICES
  document.head.appendChild(lien)
}

const FUMEES = [
  { sx: '40px', left: '-10%', taille: 200, couleur: '124,255,107', alpha: 0.35, delai: '0s' },
  { sx: '-30px', left: '30%', taille: 240, couleur: '181,123,255', alpha: 0.32, delai: '3s' },
  { sx: '-60px', left: '62%', taille: 220, couleur: '62,230,255', alpha: 0.25, delai: '6s' },
  { sx: '50px', left: '15%', taille: 260, couleur: '200,210,240', alpha: 0.18, delai: '4.5s' },
  { sx: '-20px', left: '52%', taille: 200, couleur: '124,255,107', alpha: 0.28, delai: '1.5s' },
]

export function DecorLabo({ flash = true, rgb = '124,255,107', rgb2 = '181,123,255' }) {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      <div
        className="labo-pulse absolute -left-32 -top-20 h-[420px] w-[420px] rounded-full"
        style={{ background: `radial-gradient(circle, rgba(${rgb},.22), rgba(${rgb},0) 65%)` }}
      />
      <div
        className="labo-pulse absolute -right-40 top-64 h-[420px] w-[420px] rounded-full"
        style={{ background: `radial-gradient(circle, rgba(${rgb2},.22), rgba(${rgb2},0) 65%)`, animationDelay: '1.3s' }}
      />
      <div className="labo-hex absolute inset-0" />
      {FUMEES.map((f) => ({ ...f, couleur: f.couleur === "124,255,107" ? rgb : f.couleur === "181,123,255" ? rgb2 : f.couleur })).map((f, i) => (
        <span
          key={i}
          className="labo-fumee"
          style={{
            '--sx': f.sx,
            left: f.left,
            bottom: -f.taille * 0.6,
            width: f.taille,
            height: f.taille,
            animationDelay: f.delai,
            background: `radial-gradient(circle, rgba(${f.couleur},${f.alpha}), rgba(${f.couleur},0) 70%)`,
          }}
        />
      ))}
      {flash && <div className="labo-flash absolute inset-0" style={{ background: '#B8FFAA' }} />}
    </div>
  )
}

const ETINCELLES = [
  { dx: '-70px', dy: '-60px', c: '#FFD27A' },
  { dx: '60px', dy: '-80px', c: '#9DFF8A' },
  { dx: '-20px', dy: '-100px', c: '#C9A3FF' },
  { dx: '80px', dy: '-20px', c: '#6FEFFF' },
  { dx: '-90px', dy: '-10px', c: '#9DFF8A' },
  { dx: '30px', dy: '-110px', c: '#FFD27A' },
]

// Erlenmeyer de 250 ml en verre, avec liquide, bulles, graduations
export function Fiole({ explose = true }) {
  return (
    <div className={`relative h-[150px] w-[110px] flex-none ${explose ? 'labo-tremble' : ''}`} aria-hidden="true">
      <span className="labo-bouffee" style={{ '--sx': '-14px', left: 30, top: -6, width: 36, height: 36 }} />
      <span className="labo-bouffee" style={{ '--sx': '18px', left: 34, top: -4, width: 30, height: 30, animationDelay: '.9s' }} />
      <span className="labo-bouffee" style={{ '--sx': '-4px', left: 32, top: -8, width: 40, height: 40, animationDelay: '1.8s' }} />
      {explose && (
        <>
          <span
            className="labo-boom"
            style={{
              left: -2,
              top: -34,
              width: 100,
              height: 100,
              background:
                'radial-gradient(circle, rgba(255,255,255,.95), rgba(157,255,138,.8) 30%, rgba(181,123,255,.4) 55%, rgba(181,123,255,0) 70%)',
            }}
          />
          {ETINCELLES.map((e, i) => (
            <span key={i} className="labo-etincelle" style={{ '--dx': e.dx, '--dy': e.dy, left: 45, top: 12, background: e.c }} />
          ))}
        </>
      )}
      <svg width="110" height="150" viewBox="0 0 110 150">
        <defs>
          <linearGradient id="labo-verre" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#CFF3FF" stopOpacity=".22" />
            <stop offset=".35" stopColor="#CFF3FF" stopOpacity=".04" />
            <stop offset=".75" stopColor="#CFF3FF" stopOpacity=".03" />
            <stop offset="1" stopColor="#CFF3FF" stopOpacity=".2" />
          </linearGradient>
          <linearGradient id="labo-liquide" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#B8FFA6" stopOpacity=".9" />
            <stop offset=".45" stopColor="#5BE36A" stopOpacity=".9" />
            <stop offset="1" stopColor="#167A33" stopOpacity=".95" />
          </linearGradient>
          <linearGradient id="labo-liquide-bords" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#062A10" stopOpacity=".45" />
            <stop offset=".3" stopColor="#062A10" stopOpacity="0" />
            <stop offset=".7" stopColor="#062A10" stopOpacity="0" />
            <stop offset="1" stopColor="#062A10" stopOpacity=".5" />
          </linearGradient>
          <radialGradient id="labo-coeur" cx=".45" cy=".55" r=".5">
            <stop offset="0" stopColor="#E9FFE4" stopOpacity=".55" />
            <stop offset="1" stopColor="#E9FFE4" stopOpacity="0" />
          </radialGradient>
          <filter id="labo-flou" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" />
          </filter>
          <clipPath id="labo-interieur">
            <path d="M27.5 92 L14.5 123.5 Q11.5 132 19 133.5 L91 133.5 Q98.5 132 95.5 123.5 L82.5 92 Z" />
          </clipPath>
        </defs>
        <ellipse cx="55" cy="142" rx="44" ry="5" fill="#7CFF6B" opacity=".45" filter="url(#labo-flou)" />
        <ellipse cx="55" cy="140" rx="38" ry="2.2" fill="#000" opacity=".55" />
        <path d="M27.5 92 L14.5 123.5 Q11.5 132 19 133.5 L91 133.5 Q98.5 132 95.5 123.5 L82.5 92 Z" fill="url(#labo-liquide)" />
        <path d="M27.5 92 L14.5 123.5 Q11.5 132 19 133.5 L91 133.5 Q98.5 132 95.5 123.5 L82.5 92 Z" fill="url(#labo-liquide-bords)" />
        <g clipPath="url(#labo-interieur)">
          <ellipse cx="52" cy="116" rx="30" ry="16" fill="url(#labo-coeur)" />
          <circle cx="40" cy="128" r="2.2" fill="none" stroke="#EFFFEA" strokeWidth=".8" opacity=".85">
            <animate attributeName="cy" values="130;94" dur="2.6s" repeatCount="indefinite" />
            <animate attributeName="cx" values="40;43;39;42" dur="2.6s" repeatCount="indefinite" />
          </circle>
          <circle cx="58" cy="128" r="1.4" fill="none" stroke="#EFFFEA" strokeWidth=".7" opacity=".8">
            <animate attributeName="cy" values="131;94" dur="2s" begin=".7s" repeatCount="indefinite" />
          </circle>
          <circle cx="70" cy="128" r="2.8" fill="none" stroke="#EFFFEA" strokeWidth=".8" opacity=".7">
            <animate attributeName="cy" values="132;94" dur="3.1s" begin="1.3s" repeatCount="indefinite" />
            <animate attributeName="cx" values="70;67;71;68" dur="3.1s" begin="1.3s" repeatCount="indefinite" />
          </circle>
          <circle cx="50" cy="128" r="1" fill="#EFFFEA" opacity=".8">
            <animate attributeName="cy" values="132;94" dur="1.6s" begin=".3s" repeatCount="indefinite" />
          </circle>
        </g>
        <ellipse cx="55" cy="92" rx="27.5" ry="2.6" fill="#D8FFCF" opacity=".75" />
        <ellipse cx="55" cy="92.6" rx="27.5" ry="2.6" fill="none" stroke="#2E9E45" strokeWidth=".6" opacity=".6" />
        <path
          d="M42 13 L42 54 L12 124 Q8 134 18 136 L92 136 Q102 134 98 124 L68 54 L68 13"
          fill="url(#labo-verre)"
          stroke="#D6F4FF"
          strokeOpacity=".6"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path
          d="M44.5 15 L44.5 54.5 L15 123.5 Q12 131.5 19.5 133.5 L90.5 133.5 Q98 131.5 95 123.5 L65.5 54.5 L65.5 15"
          fill="none"
          stroke="#D6F4FF"
          strokeOpacity=".22"
          strokeWidth=".8"
          strokeLinejoin="round"
        />
        <ellipse cx="55" cy="12" rx="14.5" ry="3" fill="#070B16" fillOpacity=".5" stroke="#E4F8FF" strokeOpacity=".85" strokeWidth="1.6" />
        <path d="M40.5 12 L40.5 16 Q55 20 69.5 16 L69.5 12" fill="none" stroke="#E4F8FF" strokeOpacity=".45" strokeWidth="1" />
        <path d="M47 18 L47 50" stroke="#FFFFFF" strokeOpacity=".55" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M38 64 L21 104" stroke="#FFFFFF" strokeOpacity=".6" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M19.5 110 L17.5 115" stroke="#FFFFFF" strokeOpacity=".5" strokeWidth="2" strokeLinecap="round" />
        <path d="M74 66 L90 104" stroke="#FFFFFF" strokeOpacity=".16" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M24 134 Q55 131 86 134" stroke="#FFFFFF" strokeOpacity=".3" strokeWidth="1" fill="none" />
        <g stroke="#F2FBFF" strokeOpacity=".7" strokeWidth=".7">
          <path d="M58 72 L64 72" />
          <path d="M58 82 L62 82" />
          <path d="M58 92 L64 92" />
          <path d="M58 102 L62 102" />
          <path d="M58 112 L64 112" />
        </g>
        <g fontFamily="JetBrains Mono, monospace" fontSize="5" fill="#F2FBFF" fillOpacity=".75">
          <text x="66" y="74">200</text>
          <text x="66" y="94">150</text>
          <text x="66" y="114">100</text>
          <text x="40" y="76">250 ml</text>
        </g>
      </svg>
    </div>
  )
}
