import { useEffect, useState } from 'react'
import { Route, Wrench, Zap } from 'lucide-react'
import { Bouton, Carte } from '../../../components/labo/CadreJeu.jsx'
import { PageElec } from './commun.jsx'

// =============================================================
//  E9 · Au cœur de l'ampoule : coupe d'une ampoule à filament.
//  On touche chaque partie, on suit le trajet du courant, on
//  règle la tension (0 à 9 V) : le filament rougit, blanchit…
//  et grille. Comparaison avec la lampe LED. Attendu 111.
// =============================================================
const OR = '#FFD27A'
// Cette ampoule-ci est une ampoule de 4,5 V : au-delà de 2,2 fois sa puissance normale, elle grille
const SEUIL_GRILLE = 2.2

const PARTIES = {
  verre: ['L’ampoule de verre', 'Elle laisse passer la lumière et protège le filament de l’air (sinon il brûlerait).'],
  gaz: ['Le gaz', 'Pas d’air dedans, mais un gaz qui ne brûle pas (souvent de l’argon) : le filament chauffe sans brûler.'],
  filament: ['Le filament', 'Un fil de tungstène très fin, enroulé. Le courant le chauffe très fort : il brille.'],
  electrodes: ['Les fils de support', 'Deux fils de métal qui amènent le courant jusqu’au filament.'],
  pied: ['Le pied en verre', 'Il tient les deux fils de support écartés.'],
  culot: ['Le culot à vis', 'Une des deux bornes de l’ampoule, en métal. Il se visse dans la douille.'],
  isolant: ['L’isolant', 'Il sépare le culot du plot. Sans lui : court-circuit !'],
  plot: ['Le plot', 'L’autre borne de l’ampoule, tout en bas.'],
}

const VERRE = 'M150 22 C82 22 56 80 62 128 C68 172 104 198 110 238 L190 238 C196 198 232 172 238 128 C244 80 218 22 150 22 Z'
const FIL_A = 'M150 352 L147 300 L142 176 L118 122'
const FIL_B = 'M182 122 L158 176 L160 236 L186 262'
const FILAMENT = 'M118 122 q4 -9 8 0 q4 -9 8 0 q4 -9 8 0 q4 -9 8 0 q4 -9 8 0 q4 -9 8 0 q4 -9 8 0 q4 -9 8 0'
const TRAJET = `${FIL_A} ${FILAMENT.replace('M118 122', 'L118 122')} L182 122 L158 176 L160 236 L186 262 L192 300`

function couleurFilament(t) {
  if (t < 0.03) return { fil: '#6E7380', halo: 0, nom: 'éteint' }
  if (t < 0.15) return { fil: '#8E2A1A', halo: 0.15, nom: 'rouge sombre' }
  if (t < 0.45) return { fil: '#E0531F', halo: 0.4, nom: 'orange' }
  if (t < 0.8) return { fil: '#FFB13D', halo: 0.7, nom: 'jaune' }
  if (t < 1.4) return { fil: '#FFF6D8', halo: 1, nom: 'blanc' }
  return { fil: '#FFFFFF', halo: 1.3, nom: 'blanc éblouissant' }
}

export default function AmpouleView() {
  const [partie, setPartie] = useState('filament')
  const [tension, setTension] = useState(4.5)
  const [grillee, setGrillee] = useState(false)
  const [trajet, setTrajet] = useState(true)
  const t = grillee ? 0 : (tension / 4.5) ** 2 // puissance / puissance normale
  const c = couleurFilament(t)
  const surcharge = t > SEUIL_GRILLE

  useEffect(() => {
    if (!surcharge || grillee) return
    const id = setTimeout(() => setGrillee(true), 1200)
    return () => clearTimeout(id)
  }, [surcharge, grillee])

  const zone = (id) => ({
    onClick: () => setPartie(id),
    style: { cursor: 'pointer' },
    stroke: partie === id ? OR : undefined,
    strokeWidth: partie === id ? 3 : undefined,
  })

  return (
    <PageElec code="E9" titre="Au cœur de l’ampoule" attendus={[111]} couleur={OR} large resultat={{ lumiere: Math.min(1, t * c.halo), courtCircuit: false }}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 tab:min-h-0 tab:flex-1 tab:grid-cols-[auto_minmax(0,1fr)]">
        <Carte couleur={`${OR}55`} className="p-2 tab:flex tab:h-full tab:min-h-0 tab:items-center tab:justify-center">
          <svg viewBox="0 0 300 380" className="mx-auto block w-full max-w-[420px] select-none tab:h-full tab:w-auto tab:max-w-none" style={{ aspectRatio: '300 / 380' }}>
            <defs>
              <radialGradient id="am-halo" cx=".5" cy=".5" r=".5">
                <stop offset="0" stopColor="#FFF4C8" stopOpacity=".95" />
                <stop offset=".35" stopColor="#FFD86B" stopOpacity=".45" />
                <stop offset="1" stopColor="#FFC93C" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="am-culot" x1="0" x2="1">
                <stop offset="0" stopColor="#6E7586" />
                <stop offset=".45" stopColor="#E9EDF5" />
                <stop offset="1" stopColor="#5E6577" />
              </linearGradient>
              <linearGradient id="am-plot" x1="0" x2="1">
                <stop offset="0" stopColor="#8C6A1E" />
                <stop offset=".5" stopColor="#FCE9A4" />
                <stop offset="1" stopColor="#8C6A1E" />
              </linearGradient>
              <clipPath id="am-verre">
                <path d={VERRE} />
              </clipPath>
            </defs>

            {c.halo > 0 && <circle cx="150" cy="120" r={70 + 90 * c.halo} fill="url(#am-halo)" opacity={Math.min(1, c.halo)} />}

            {/* verre et gaz */}
            <path d={VERRE} fill="#CFE0FF" fillOpacity=".08" stroke="#DDEBFF" strokeOpacity=".7" strokeWidth="2" {...zone('verre')} />
            <g clipPath="url(#am-verre)">
              <ellipse cx="150" cy="120" rx="70" ry="80" fill="#A3C8FF" fillOpacity={partie === 'gaz' ? 0.22 : 0.05} onClick={() => setPartie('gaz')} style={{ cursor: 'pointer' }} />
              {[
                [104, 80],
                [196, 92],
                [120, 168],
                [186, 160],
                [150, 60],
              ].map(([x, y]) => (
                <circle key={`${x}${y}`} cx={x} cy={y} r="2.2" fill="#A3C8FF" opacity=".5" pointerEvents="none" />
              ))}
            </g>
            {grillee && <ellipse cx="150" cy="70" rx="55" ry="28" fill="#2B2620" opacity=".45" pointerEvents="none" />}
            <path d="M92 60 Q78 90 86 124" stroke="#FFFFFF" strokeOpacity=".6" strokeWidth="4" fill="none" strokeLinecap="round" pointerEvents="none" />

            {/* pied en verre */}
            <path d="M134 242 L141 172 L159 172 L166 242 Z" fill="#DDEBFF" fillOpacity=".25" stroke="#DDEBFF" strokeOpacity=".6" {...zone('pied')} />

            {/* culot, isolant, plot */}
            <g {...zone('culot')}>
              <path d="M110 238 L190 238 L190 326 Q150 336 110 326 Z" fill="url(#am-culot)" stroke={partie === 'culot' ? OR : '#4E5566'} strokeWidth={partie === 'culot' ? 3 : 1} />
              {[252, 270, 288, 306].map((y) => (
                <path key={y} d={`M110 ${y} Q150 ${y + 10} 190 ${y - 4}`} stroke="#5E6577" strokeWidth="2" fill="none" />
              ))}
            </g>
            <path d="M122 328 Q150 336 178 328 L172 346 Q150 352 128 346 Z" fill="#14161C" {...zone('isolant')} />
            <path d="M138 346 Q150 350 162 346 L160 358 Q150 364 140 358 Z" fill="url(#am-plot)" {...zone('plot')} />

            {/* fils de support et filament */}
            <g onClick={() => setPartie('electrodes')} style={{ cursor: 'pointer' }}>
              <path d={FIL_A} stroke="transparent" strokeWidth="14" fill="none" />
              <path d={FIL_B} stroke="transparent" strokeWidth="14" fill="none" />
              <path d={FIL_A} stroke={partie === 'electrodes' ? OR : '#C7CCD6'} strokeWidth="2.4" fill="none" />
              <path d={FIL_B} stroke={partie === 'electrodes' ? OR : '#C7CCD6'} strokeWidth="2.4" fill="none" />
            </g>
            <g onClick={() => setPartie('filament')} style={{ cursor: 'pointer' }}>
              <path d="M112 112 L188 112 L188 132 L112 132 Z" fill="transparent" />
              {grillee ? (
                <path d="M118 122 q4 -9 8 0 q4 -9 8 0 q4 -9 8 0 q3 -6 5 -2 M157 116 q2 4 5 6 q4 -9 8 0 q4 -9 8 0" stroke="#3A3530" strokeWidth="2" fill="none" />
              ) : (
                <path d={FILAMENT} stroke={partie === 'filament' && t < 0.03 ? OR : c.fil} strokeWidth={t > 0.45 ? 3.4 : 2.4} fill="none" style={t > 0.45 ? { filter: 'drop-shadow(0 0 4px #FFF2B0)' } : undefined} />
              )}
            </g>

            {/* trajet du courant */}
            {trajet && !grillee && tension > 0 && (
              <path d={TRAJET} stroke="#3EC9FF" strokeWidth="3" fill="none" strokeLinecap="round" className="elec-courant" style={{ animationDuration: `${Math.max(0.3, 2.2 - tension / 4)}s`, pointerEvents: 'none' }} />
            )}

            {/* étiquettes */}
            <text x="150" y="376" textAnchor="middle" fontSize="10" fill="#8A93B8">
              touche une partie de l’ampoule
            </text>
          </svg>
        </Carte>

        <div className="flex min-w-0 flex-col gap-3 tab:min-h-0 tab:overflow-y-auto">
          <Carte couleur={`${OR}66`}>
            <p className="labo-mono text-[11px]" style={{ color: OR }}>
              {PARTIES[partie][0].toUpperCase()}
            </p>
            <p className="mt-1 text-[13px] leading-snug text-[#DDE2F7]">{PARTIES[partie][1]}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {Object.entries(PARTIES).map(([id, [nom]]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPartie(id)}
                  className="rounded-full border px-2.5 py-1 text-[12px] font-bold"
                  style={partie === id ? { background: OR, color: '#1A1300', borderColor: OR } : { borderColor: 'rgba(255,255,255,.15)', color: '#B9C1E3' }}
                >
                  {nom.replace(/^L’|^Le |^La |^Les /, '')}
                </button>
              ))}
            </div>
          </Carte>

          <Carte couleur="rgba(62,201,255,.4)">
            <div className="flex items-center justify-between">
              <p className="labo-mono flex items-center gap-1.5 text-[11px] text-[#3EC9FF]">
                <Zap size={13} /> TENSION APPLIQUÉE
              </p>
              <p className="labo-titre text-2xl font-black text-white">{tension.toLocaleString('fr-BE')} V</p>
            </div>
            <input type="range" min="0" max="9" step="0.5" value={tension} onChange={(e) => setTension(Number(e.target.value))} className="mt-2 w-full accent-[#3EC9FF]" aria-label="Tension" />
            <div className="flex justify-between text-[11px] text-[#8A93B8]">
              <span>0 V</span>
              <span>4,5 V (normal)</span>
              <span>9 V</span>
            </div>
            <p className="mt-2 text-[14px] leading-snug text-[#DDE2F7]">
              {grillee
                ? 'Trop de tension : le filament a trop chauffé, il a fondu et s’est coupé. Le circuit est ouvert, l’ampoule est grillée.'
                : t < 0.03
                  ? 'Pas assez de courant : le filament ne chauffe pas assez pour briller.'
                  : surcharge
                    ? 'Attention : beaucoup trop de tension pour cette ampoule de 4,5 V !'
                    : `Le filament brille : ${c.nom}. Plus la tension est grande, plus le courant est fort, plus le filament chauffe et brille.`}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => setTrajet(!trajet)} className="flex h-10 items-center gap-1.5 rounded-xl border border-white/15 px-3 text-[13px] font-bold text-[#E8ECFF]">
                <Route size={15} /> {trajet ? 'Cacher' : 'Montrer'} le trajet du courant
              </button>
              {grillee && (
                <Bouton
                  couleur={OR}
                  onClick={() => {
                    setTension(4.5)
                    setGrillee(false)
                  }}
                >
                  <Wrench size={16} /> Ampoule neuve
                </Bouton>
              )}
            </div>
            {trajet && (
              <p className="mt-2 text-[13px] leading-snug text-[#B9C1E3]">
                <span className="font-bold text-[#3EC9FF]">En bleu :</span> le courant entre par le plot, traverse le filament et ressort par le culot. L’ampoule a deux bornes, comme tous les récepteurs.
              </p>
            )}
          </Carte>

          <Carte couleur="rgba(157,255,138,.35)">
            <p className="labo-mono text-[11px] text-[#9DFF8A]">AMPOULE À FILAMENT OU LAMPE LED ?</p>
            <div className="mt-2 space-y-2">
              <div>
                <p className="text-[13px] font-bold text-[#E8ECFF]">Ampoule à filament</p>
                <div className="mt-1 flex h-4 overflow-hidden rounded-full">
                  <div className="h-full bg-[#FFE45E]" style={{ width: '5%' }} />
                  <div className="h-full bg-[#FF6B4A]" style={{ width: '95%' }} />
                </div>
                <p className="mt-0.5 text-[11px] text-[#8A93B8]">≈ 5 % de lumière · ≈ 95 % de chaleur</p>
              </div>
            </div>
            <p className="mt-2 text-[13px] leading-snug text-[#DDE2F7]">
              Une lampe LED donne la même lumière en consommant environ 6 fois moins d’énergie, chauffe très peu et dure environ 15 fois plus longtemps. C’est pourquoi les ampoules à filament ne sont plus vendues en Europe pour éclairer les maisons.
            </p>
          </Carte>
        </div>
      </div>
    </PageElec>
  )
}
