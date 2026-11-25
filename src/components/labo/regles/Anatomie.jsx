import { useId } from 'react'

// =============================================================
//  Le dessin de l'appareil reproducteur (vue de face, en coupe) :
//  utérus (muscle + endomètre), col, vagin, deux trompes de Fallope
//  avec leurs franges, deux ovaires avec leurs follicules.
//
//  UN SEUL dessin, réutilisé partout (explorateur, cycle, ovule, hall)
//  et piloté par des paramètres :
//    ep        épaisseur de l'endomètre, de 0 (fin) à 1 (épais)
//    regles    le sang s'écoule (gouttes dans le col et le vagin)
//    ovaire    { etat: 'repos' | 'follicule' | 'ovulation' | 'corps', p: 0..1 }  (ovaire de droite du dessin)
//    ovule     position de l'ovule le long de son trajet (0..1) ou null ; voir POINTS_TRAJET
//    embryon   petite boule de cellules posée dans l'utérus (grossesse)
//    surbrillance  ['ovaire', 'trompe', …] : parties entourées
//    onPart    si fourni, chaque partie est cliquable (id de la partie)
//
//  Proportions : vue schématique (pas à l'échelle), mais les formes sont
//  celles d'un vrai schéma d'anatomie : utérus en poire renversée,
//  cavité triangulaire, trompes avec pavillon à franges, ovaires en amande,
//  col qui dépasse dans le vagin.
// =============================================================

const LIGNE = '#7A4458'
const MUSCLE = '#F7C9C3'
const ENDO = '#EE9AA8'
const LUMIERE = '#FFF3E8'
const TROMPE = '#F2B8AE'
const OVAIRE = '#FBD8A6'
const VAGIN = '#F4CFC9'
const SANG = '#D9647C'
const ACCENT = '#1F8A70'

// ---- formes (coordonnées dans une boîte de 360 × 440, axe de symétrie x = 180) ----
const UTERUS =
  'M180 112 C218 112 246 128 247 164 C248 198 226 226 202 250 C201 256 201 262 201 268 L200 302 C200 313 192 319 180 319 C168 319 160 313 160 302 L159 268 C159 262 159 256 158 250 C134 226 112 198 113 164 C114 128 142 112 180 112 Z'
const COL = 'M158 250 L202 250 L200 302 C200 313 192 319 180 319 C168 319 160 313 160 302 Z'
const CAVITE =
  'M140 148 C160 134 200 134 220 148 C226 154 225 162 220 170 C208 196 192 224 187 248 L173 248 C168 224 152 196 140 170 C135 162 134 154 140 148 Z'
const CANAL = 'M173 246 L187 246 L187 314 L173 314 Z'
const VAGIN_D = 'M146 282 C144 330 140 390 138 440 L222 440 C220 390 216 330 214 282 Z'
const VAGIN_LUMIERE = 'M156 296 C155 340 152 392 151 440 L209 440 C208 392 205 340 204 296 Z'
// trompe de droite : deux courbes de Bézier (utérus → pavillon)
const TROMPE_A = [236, 150, 262, 134, 292, 120, 314, 130]
const TROMPE_B = [314, 130, 332, 138, 336, 164, 324, 184]
const TROMPE_D = `M${TROMPE_A[0]} ${TROMPE_A[1]} C${TROMPE_A.slice(2).join(' ')} C${TROMPE_B.slice(2).join(' ')}`
const OVAIRE_C = { x: 288, y: 180, rx: 29, ry: 18.5, rot: 18 }
const FOLLICULE = { x: 302, y: 177 }

const bezier = (p, t) => {
  const u = 1 - t
  return [
    u * u * u * p[0] + 3 * u * u * t * p[2] + 3 * u * t * t * p[4] + t * t * t * p[6],
    u * u * u * p[1] + 3 * u * u * t * p[3] + 3 * u * t * t * p[5] + t * t * t * p[7],
  ]
}

// Trajet de l'ovule : follicule → surface de l'ovaire → pavillon → trompe → utérus
// (liste de points, paramétrée par la longueur : u = 0 au follicule, u = 1 dans la cavité)
const BRUT = [
  [FOLLICULE.x, FOLLICULE.y],
  [314, 180],
  [323, 186],
  ...Array.from({ length: 11 }, (_, i) => bezier(TROMPE_B, 1 - (i + 1) / 11)),
  ...Array.from({ length: 11 }, (_, i) => bezier(TROMPE_A, 1 - (i + 1) / 11)),
  [226, 154],
  [212, 168],
  [198, 192],
]
const LONG = BRUT.reduce((acc, p, i) => [...acc, i === 0 ? 0 : acc[i - 1] + Math.hypot(p[0] - BRUT[i - 1][0], p[1] - BRUT[i - 1][1])], [])
const TOTAL = LONG.at(-1)

export function pointTrajet(u) {
  const d = Math.min(1, Math.max(0, u)) * TOTAL
  let i = 1
  while (i < LONG.length - 1 && LONG[i] < d) i++
  const t = (d - LONG[i - 1]) / (LONG[i] - LONG[i - 1] || 1)
  return [BRUT[i - 1][0] + (BRUT[i][0] - BRUT[i - 1][0]) * t, BRUT[i - 1][1] + (BRUT[i][1] - BRUT[i - 1][1]) * t]
}
// Repères du trajet (valeurs de u)
const repere = (index) => LONG[index] / TOTAL
export const ETAPES_TRAJET = { follicule: 0, surface: repere(1), pavillon: repere(2), trompe: repere(14), pres: repere(23), cavite: 1 }

// ---- les parties (pour la surbrillance et le toucher) ----
function FormesPartie({ id, couleur, largeur = 4, rempli = false }) {
  const p = { fill: rempli ? couleur : 'none', stroke: rempli ? 'none' : couleur, strokeWidth: largeur, strokeLinejoin: 'round', strokeLinecap: 'round' }
  switch (id) {
    case 'uterus':
      return <path d={UTERUS} {...p} />
    case 'col':
      return <path d={COL} {...p} />
    case 'endometre':
      return <path d={CAVITE} {...p} />
    case 'vagin':
      return <path d={VAGIN_D} {...p} />
    default:
      return null
  }
}
function FormesCote({ id, couleur, largeur = 4, rempli = false }) {
  const trait = { fill: 'none', stroke: couleur, strokeWidth: largeur, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (id === 'trompe')
    return (
      <>
        <path d={TROMPE_D} {...trait} strokeWidth={rempli ? 26 : 28} strokeOpacity={rempli ? 1 : 0.5} />
        {rempli && <circle cx={316} cy={182} r={24} fill={couleur} stroke="none" />}
      </>
    )
  if (id === 'ovaire')
    return <ellipse cx={OVAIRE_C.x} cy={OVAIRE_C.y} rx={OVAIRE_C.rx + (rempli ? 6 : 3)} ry={OVAIRE_C.ry + (rempli ? 6 : 3)} transform={`rotate(${OVAIRE_C.rot} ${OVAIRE_C.x} ${OVAIRE_C.y})`} {...trait} fill={rempli ? couleur : 'none'} strokeWidth={rempli ? 0 : largeur} />
  return null
}
const PARTIES_CENTRE = ['vagin', 'uterus', 'col', 'endometre']
const PARTIES_COTE = ['trompe', 'ovaire']

// ---- un côté (trompe + ovaire), dessiné « à droite » ; l'autre côté est son reflet ----
function Cote({ actif, ovaire, lueur = false }) {
  const { etat = 'repos', p = 0 } = ovaire || {}
  const petits = actif ? [[272, 176], [279, 189], [292, 170], [286, 183], [295, 191]] : [[272, 176], [281, 189], [294, 172], [300, 183], [287, 182]]
  return (
    <g>
      {/* ligament de l'ovaire (le relie à l'utérus) */}
      <path d="M262 175 C252 171 246 169 238 167" fill="none" stroke={LIGNE} strokeWidth={2.2} strokeLinecap="round" strokeDasharray="1 4" />
      {/* trompe (avec un halo derrière quand elle est mise en avant) */}
      {lueur && <path className="regles-halo" d={TROMPE_D} fill="none" stroke={ACCENT} strokeOpacity={0.55} strokeWidth={34} strokeLinecap="round" />}
      <path d={TROMPE_D} fill="none" stroke={LIGNE} strokeWidth={16} strokeLinecap="round" />
      <path d={TROMPE_D} fill="none" stroke={TROMPE} strokeWidth={12} strokeLinecap="round" />
      <path d={`M${TROMPE_B[0]} ${TROMPE_B[1]} C${TROMPE_B.slice(2).join(' ')}`} fill="none" stroke={LIGNE} strokeWidth={21} strokeLinecap="round" />
      <path d={`M${TROMPE_B[0]} ${TROMPE_B[1]} C${TROMPE_B.slice(2).join(' ')}`} fill="none" stroke={TROMPE} strokeWidth={17} strokeLinecap="round" />
      <path d={TROMPE_D} fill="none" stroke={LUMIERE} strokeWidth={3.6} strokeLinecap="round" />
      {/* franges du pavillon */}
      {[122, 148, 174, 200, 226].map((a) => {
        const r = (a * Math.PI) / 180
        const x2 = 324 + Math.cos(r) * 21
        const y2 = 187 + Math.sin(r) * 21
        return (
          <g key={a}>
            <line x1={324} y1={187} x2={x2} y2={y2} stroke={LIGNE} strokeWidth={7} strokeLinecap="round" />
            <line x1={324} y1={187} x2={x2} y2={y2} stroke={TROMPE} strokeWidth={4} strokeLinecap="round" />
          </g>
        )
      })}
      {/* ovaire */}
      <ellipse cx={OVAIRE_C.x} cy={OVAIRE_C.y} rx={OVAIRE_C.rx} ry={OVAIRE_C.ry} transform={`rotate(${OVAIRE_C.rot} ${OVAIRE_C.x} ${OVAIRE_C.y})`} fill={OVAIRE} stroke={LIGNE} strokeWidth={2.5} />
      {petits.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3 + (i % 2) * 0.8} fill="#FFF6E2" stroke="#C98B4E" strokeWidth={1.1} />
      ))}
      {actif && etat === 'follicule' && (
        <g>
          <circle cx={FOLLICULE.x} cy={FOLLICULE.y} r={4 + 9 * p} fill="#FFF6E2" stroke="#C98B4E" strokeWidth={1.6} />
          <circle cx={FOLLICULE.x + (p > 0.5 ? -2 : 0)} cy={FOLLICULE.y - (p > 0.5 ? 2 : 0)} r={2.4} fill="#FFFDF5" stroke="#C98B4E" strokeWidth={1} />
        </g>
      )}
      {actif && etat === 'ovulation' && (
        <g>
          <circle cx={FOLLICULE.x + 2} cy={FOLLICULE.y} r={13} fill="#FFF6E2" stroke="#C98B4E" strokeWidth={1.6} />
          <path d="M311 172 L317 178" stroke={OVAIRE} strokeWidth={5} strokeLinecap="round" />
        </g>
      )}
      {actif && etat === 'corps' && (
        <path
          d={`M${FOLLICULE.x - 6 - 6 * p} ${FOLLICULE.y} C${FOLLICULE.x - 6 - 6 * p} ${FOLLICULE.y - 9 - 4 * p} ${FOLLICULE.x + 2} ${FOLLICULE.y - 9 - 5 * p} ${FOLLICULE.x + 7 + 5 * p} ${FOLLICULE.y - 3} C${FOLLICULE.x + 9 + 5 * p} ${FOLLICULE.y + 6 + 4 * p} ${FOLLICULE.x} ${FOLLICULE.y + 9 + 4 * p} ${FOLLICULE.x - 6 - 6 * p} ${FOLLICULE.y} Z`}
          fill="#F3C94E"
          stroke="#B5801C"
          strokeWidth={1.6}
        />
      )}
    </g>
  )
}

export default function Anatomie({
  ep = 0.6,
  regles = false,
  ovaire = { etat: 'repos', p: 0 },
  ovule = null,
  embryon = false,
  surbrillance = [],
  onPart,
  className = '',
  titre = 'Schéma de l’appareil reproducteur : utérus, trompes, ovaires et vagin',
}) {
  const id = useId().replace(/:/g, '')
  // La lumière de l'utérus rétrécit quand l'endomètre s'épaissit
  const echelle = 0.93 - 0.55 * Math.min(1, Math.max(0, ep))
  const touche = typeof onPart === 'function'
  const zones = (Comp, liste) =>
    touche &&
    liste.map((p) => (
      <g key={p} onClick={() => onPart(p)} style={{ cursor: 'pointer', outline: 'none' }} data-partie={p}>
        <Comp id={p} couleur="rgba(0,0,0,0.001)" largeur={16} rempli />
      </g>
    ))
  const halos = (Comp, liste) =>
    liste.filter((p) => surbrillance.includes(p)).map((p) => (
      <g key={p} className="regles-halo" style={{ pointerEvents: 'none' }}>
        <Comp id={p} couleur="#fff" largeur={9} />
        <Comp id={p} couleur={ACCENT} largeur={4.5} />
      </g>
    ))
  const [ox, oy] = ovule == null ? [0, 0] : pointTrajet(ovule)
  const embryons = [[196, 176], [204, 172], [199, 168], [192, 170], [201, 180], [194, 182]]

  return (
    <svg viewBox="0 0 360 440" className={className} role="img" aria-label={titre} style={{ touchAction: 'manipulation' }}>
      <defs>
        <linearGradient id={`${id}-fondu`} x1="0" y1="380" x2="0" y2="440" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
        <mask id={`${id}-masque`} maskUnits="userSpaceOnUse" x="0" y="0" width="360" height="440">
          <rect x="0" y="0" width="360" height="440" fill={`url(#${id}-fondu)`} />
        </mask>
      </defs>

      {/* vagin (il se perd en fondu vers l'extérieur du dessin) */}
      <g mask={`url(#${id}-masque)`}>
        <path d={VAGIN_D} fill={VAGIN} stroke={LIGNE} strokeWidth={2.5} strokeLinejoin="round" />
        <path d={VAGIN_LUMIERE} fill={LUMIERE} />
        {[318, 344, 370, 396].map((y) => (
          <path key={y} d={`M158 ${y} Q180 ${y + 7} 202 ${y}`} fill="none" stroke="#E8B2AB" strokeWidth={2} strokeLinecap="round" />
        ))}
      </g>

      {/* trompes et ovaires : à droite (actif), à gauche (reflet, au repos) */}
      <Cote actif ovaire={ovaire} lueur={surbrillance.includes('trompe')} />
      <g transform="translate(360 0) scale(-1 1)">
        <Cote actif={false} ovaire={{ etat: 'repos', p: 0 }} lueur={surbrillance.includes('trompe')} />
      </g>

      {/* utérus : muscle, puis endomètre, puis lumière */}
      <path d={UTERUS} fill={MUSCLE} stroke={LIGNE} strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M226 152 L242 150" stroke={LUMIERE} strokeWidth={3.6} strokeLinecap="round" />
      <path d="M134 152 L118 150" stroke={LUMIERE} strokeWidth={3.6} strokeLinecap="round" />
      <path d={CAVITE} fill={ENDO} stroke="#C97B8B" strokeWidth={1.5} strokeLinejoin="round" />
      <path d={CAVITE} fill={regles ? '#F2A5B2' : LUMIERE} transform={`translate(180 190) scale(${echelle}) translate(-180 -190)`} />
      <path d={CANAL} fill={regles ? '#F2A5B2' : '#F9D5CF'} stroke="#D9A39B" strokeWidth={1} />

      {/* grossesse : petite boule de cellules */}
      {embryon && (
        <g className="regles-flotte">
          {embryons.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={5.2} fill="#FFFDF5" stroke="#C98B4E" strokeWidth={1.3} />
          ))}
        </g>
      )}

      {/* sang : gouttes qui descendent par le col et le vagin */}
      {regles &&
        [0, 0.9, 1.7].map((delai, i) => (
          <circle key={i} className="regles-goutte" cx={180 + (i - 1) * 3} cy={236} r={4.2} fill={SANG} style={{ animationDelay: `${delai}s`, '--chute': '168px' }} />
        ))}

      {/* l'ovule (cellule ronde avec son enveloppe) */}
      {ovule != null && (
        <g className="regles-ovule" style={{ transform: `translate(${ox}px, ${oy}px)` }}>
          <circle r={7.5} fill="#FFFDF5" stroke="#C98B4E" strokeWidth={1.8} />
          <circle r={3.2} fill="#F3D9A8" stroke="#C98B4E" strokeWidth={1} />
        </g>
      )}

      {/* parties cliquables et surbrillance */}
      {zones(FormesPartie, ['vagin', 'uterus', 'col', 'endometre'])}
      {zones(FormesCote, PARTIES_COTE)}
      <g transform="translate(360 0) scale(-1 1)">{zones(FormesCote, PARTIES_COTE)}</g>
      {halos(FormesPartie, PARTIES_CENTRE)}
      {halos(FormesCote, ['ovaire'])}
      <g transform="translate(360 0) scale(-1 1)">{halos(FormesCote, ['ovaire'])}</g>
    </svg>
  )
}
