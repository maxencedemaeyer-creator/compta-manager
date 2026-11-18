// =============================================================
//  Objets du testeur de matériaux (E2). Chaque objet est dessiné
//  posé entre les deux pinces du testeur (de x = −40 à x = 40).
//  materiau : 'metal' (conduit très bien), 'graphite' (conduit,
//  mais moins : l'ampoule brille faiblement), 'isolant'.
//  demi : demi-largeur de l'objet là où les pinces le saisissent →
//  les pinces crocodile viennent mordre ses bords (Composants.jsx,
//  Objet) : l'objet touche TOUJOURS les deux pinces, même petit.
// =============================================================
export const OBJETS = [
  { id: 'cle', nom: 'Clé', matiere: 'acier (métal)', materiau: 'metal', demi: 38 },
  { id: 'trombone', nom: 'Trombone', matiere: 'acier (métal)', materiau: 'metal', demi: 37 },
  { id: 'piece', nom: 'Pièce de 1 €', matiere: 'cupronickel (métal)', materiau: 'metal', demi: 18 },
  { id: 'alu', nom: 'Papier d’aluminium', matiere: 'aluminium (métal)', materiau: 'metal', demi: 40 },
  { id: 'cuillere', nom: 'Cuillère en inox', matiere: 'acier inoxydable (métal)', materiau: 'metal', demi: 40 },
  { id: 'mine', nom: 'Mine de crayon', matiere: 'graphite (carbone)', materiau: 'graphite', demi: 40 },
  { id: 'gomme', nom: 'Gomme', matiere: 'caoutchouc / plastique', materiau: 'isolant', demi: 26 },
  { id: 'regle', nom: 'Règle en plastique', matiere: 'plastique', materiau: 'isolant', demi: 40 },
  { id: 'bois', nom: 'Bâtonnet en bois', matiere: 'bois sec', materiau: 'isolant', demi: 40 },
  { id: 'verre', nom: 'Tube en verre', matiere: 'verre', materiau: 'isolant', demi: 40 },
  { id: 'papier', nom: 'Feuille de papier', matiere: 'papier', materiau: 'isolant', demi: 39 },
  { id: 'bouchon', nom: 'Bouchon de liège', matiere: 'liège', materiau: 'isolant', demi: 20 },
  { id: 'elastique', nom: 'Élastique', matiere: 'caoutchouc', materiau: 'isolant', demi: 40 },
  { id: 'laine', nom: 'Fil de laine', matiere: 'laine', materiau: 'isolant', demi: 40 },
]

export const OBJET = Object.fromEntries(OBJETS.map((o) => [o.id, o]))

export function DessinObjet({ id }) {
  switch (id) {
    case 'cle':
      return (
        <g>
          <circle cx="-24" cy="8" r="13" fill="url(#el-metal)" stroke="#5E6577" />
          <circle cx="-24" cy="8" r="5" fill="#141B2E" />
          <path d="M-12 5 L40 5 L40 11 L34 11 L34 17 L29 17 L29 11 L24 11 L24 16 L19 16 L19 11 L-12 11 Z" fill="url(#el-metal)" stroke="#5E6577" strokeWidth=".8" />
        </g>
      )
    case 'trombone':
      return (
        <path
          d="M-40 10 L28 10 A6 6 0 0 0 28 -2 L-30 -2 A4 4 0 0 0 -30 6 L22 6 A2.5 2.5 0 0 0 22 1"
          fill="none"
          stroke="url(#el-metal)"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      )
    case 'piece':
      return (
        <g>
          <circle cx="0" cy="8" r="18" fill="#D9C36A" stroke="#8C7A2E" />
          <circle cx="0" cy="8" r="12" fill="url(#el-metal)" stroke="#8C93A3" />
          <text x="0" y="13" textAnchor="middle" fontSize="13" fontWeight="900" fill="#5E6577">
            1
          </text>
        </g>
      )
    case 'alu':
      return <path d="M-40 4 L-30 0 L-18 6 L-6 -1 L6 5 L18 -2 L30 4 L40 1 L40 16 L28 13 L16 18 L4 12 L-8 17 L-20 12 L-32 17 L-40 14 Z" fill="url(#el-metal)" stroke="#8C93A3" strokeWidth=".7" />
    case 'cuillere':
      return (
        <g>
          <ellipse cx="24" cy="9" rx="16" ry="10" fill="url(#el-metal)" stroke="#5E6577" />
          <path d="M-40 7 L8 8 L8 11 L-40 12 Z" fill="url(#el-metal)" stroke="#5E6577" strokeWidth=".7" />
        </g>
      )
    case 'mine':
      return (
        <g>
          <rect x="-40" y="6" width="80" height="5" rx="2.5" fill="#3B3F48" />
          <rect x="-40" y="6.5" width="80" height="1.5" fill="#8E95A3" opacity=".7" />
        </g>
      )
    case 'gomme':
      return (
        <g>
          <rect x="-26" y="-2" width="52" height="20" rx="3" fill="#F4EFE6" stroke="#B5AE9F" />
          <rect x="-8" y="-2" width="34" height="20" fill="#3E7BE0" />
          <rect x="-8" y="-2" width="34" height="4" fill="#FFFFFF" opacity=".3" />
        </g>
      )
    case 'regle':
      return (
        <g>
          <rect x="-40" y="2" width="80" height="14" rx="1.5" fill="#7CD1F5" fillOpacity=".75" stroke="#2D8DB8" />
          {Array.from({ length: 16 }, (_, i) => (
            <path key={i} d={`M${-36 + i * 4.8} 2 L${-36 + i * 4.8} ${i % 5 === 0 ? 9 : 6}`} stroke="#1B5F80" strokeWidth=".8" />
          ))}
        </g>
      )
    case 'bois':
      return (
        <g>
          <rect x="-40" y="4" width="80" height="10" rx="3" fill="url(#el-bois)" stroke="#6E4520" strokeWidth=".7" />
          <path d="M-34 7 Q-10 5 10 8 T38 7 M-30 11 Q0 13 32 10" stroke="#7A4A20" strokeWidth=".6" fill="none" />
        </g>
      )
    case 'verre':
      return (
        <g>
          <rect x="-40" y="3" width="80" height="12" rx="6" fill="#D9F1FF" fillOpacity=".35" stroke="#A8D4EE" />
          <rect x="-36" y="5" width="72" height="2.5" rx="1.2" fill="#FFFFFF" opacity=".7" />
        </g>
      )
    case 'papier':
      return (
        <g>
          <path d="M-40 0 L40 2 L38 18 L-38 16 Z" fill="#FAFAF5" stroke="#C9C7BC" />
          {[5, 9, 13].map((y) => (
            <path key={y} d={`M-32 ${y} L32 ${y + 1}`} stroke="#9FC3E8" strokeWidth=".6" />
          ))}
        </g>
      )
    case 'bouchon':
      return (
        <g>
          <path d="M-20 -4 L20 -1 L20 21 L-20 24 Z" fill="#C49A62" stroke="#8C6A3C" />
          {[
            [-12, 3],
            [-4, 14],
            [6, 6],
            [12, 16],
            [-10, 18],
            [2, 0],
          ].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r="1.4" fill="#8C6A3C" />
          ))}
        </g>
      )
    case 'elastique':
      return <ellipse cx="0" cy="9" rx="40" ry="7" fill="none" stroke="#D9A04A" strokeWidth="3" />
    case 'laine':
      return <path d="M-40 9 C-30 3 -20 15 -10 9 S10 3 20 9 S34 15 40 9" fill="none" stroke="#C94A7A" strokeWidth="3.4" strokeLinecap="round" />
    default:
      return null
  }
}
