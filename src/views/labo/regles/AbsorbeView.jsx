import { useState } from 'react'
import { Droplet, RotateCcw, Ruler } from 'lucide-react'
import { BoutonR, C, CarteR, Consigne, Onglets, PageRegles, Retour } from '../../../components/labo/regles/ui.jsx'

// =============================================================
//  R6 · Absorbe — le rôle des protections et la vraie quantité.
//  Deux modes :
//   - Combien ? : on estime la quantité totale de sang (en cuillères
//     à soupe) sur un verre gradué, puis on découvre la réponse
//     (environ 30 à 80 ml, soit 2 à 5 cuillères à soupe).
//   - Ça absorbe : coupe d'une protection ; on verse des gouttes et
//     on voit où va le liquide (absorbé, recueilli, bloqué).
//  Ordres de grandeur ; les produits réels varient selon les marques.
// =============================================================
const SANG = '#D9647C'
const L = '#7A4458'

export default function AbsorbeView() {
  const [mode, setMode] = useState('combien')
  return (
    <PageRegles large>
      <Onglets
        valeur={mode}
        onChange={setMode}
        couleur="#2F8FA3"
        options={[
          ['combien', Ruler, 'Combien ?'],
          ['absorbe', Droplet, 'Ça absorbe'],
        ]}
      />
      {mode === 'combien' ? <Combien /> : <Absorbe />}
    </PageRegles>
  )
}

// ---------------- Combien ? ----------------
const ML_CUILLERE = 15
const VERRE_ML = 150

function Verre({ ml, zone }) {
  const haut = 150
  const y = (v) => 20 + haut - (Math.min(v, VERRE_ML) / VERRE_ML) * haut
  return (
    <svg viewBox="0 0 160 200" className="mx-auto h-56 w-auto" role="img" aria-label={`Un verre contenant ${Math.round(ml)} millilitres`}>
      {zone && <rect x={30} y={y(80)} width={100} height={y(30) - y(80)} fill="#A8D5A2" opacity={0.55} />}
      <clipPath id="verre-int"><path d="M36 20 L124 20 L116 170 Q80 178 44 170 Z" /></clipPath>
      <g clipPath="url(#verre-int)">
        <rect x={20} y={y(ml)} width={120} height={200} fill={SANG} opacity={0.85} />
      </g>
      <path d="M36 20 L124 20 L116 170 Q80 178 44 170 Z" fill="none" stroke={L} strokeWidth={3} strokeLinejoin="round" />
      {[30, 60, 90, 120, 150].map((v) => (
        <g key={v}>
          <line x1={124 - (v === 150 ? 0 : 0)} y1={y(v)} x2={134} y2={y(v)} stroke={L} strokeWidth={1.6} />
          <text x={138} y={y(v) + 4} fontSize={10} fontWeight={700} fill="#6F5864">{v}</text>
        </g>
      ))}
      <text x={140} y={14} fontSize={9} fontWeight={800} fill="#6F5864" textAnchor="middle">ml</text>
    </svg>
  )
}

function Combien() {
  const [cuilleres, setCuilleres] = useState(8)
  const [vu, setVu] = useState(false)
  const ml = vu ? 55 : cuilleres * ML_CUILLERE
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <CarteR className="flex flex-col items-center gap-2">
        <Verre ml={ml} zone={vu} />
        <p className="regles-titre text-[18px]" style={{ color: C.texte }}>
          {vu ? 'Environ 30 à 80 ml en tout' : `${cuilleres} cuillère${cuilleres > 1 ? 's' : ''} à soupe (${ml} ml)`}
        </p>
        <p className="text-[12.5px]" style={{ color: C.doux }}>Ce petit verre contient 15 cl (150 ml) quand il est plein.</p>
      </CarteR>
      <div className="flex flex-col gap-3">
        <Consigne couleur="#2F8FA3">
          À ton avis, combien de sang les règles représentent-elles <b>en tout</b>, sur tous les jours d’un cycle ? Règle le curseur : 1 cuillère à soupe = 15 ml.
        </Consigne>
        <input type="range" min={1} max={10} value={cuilleres} disabled={vu} onChange={(e) => setCuilleres(+e.target.value)} aria-label="Nombre de cuillères à soupe" className="regles-curseur" />
        {!vu ? (
          <BoutonR couleur="#2F8FA3" onClick={() => setVu(true)}>Voir la réponse</BoutonR>
        ) : (
          <>
            <Retour ok titre={cuilleres >= 2 && cuilleres <= 5 ? 'Bien estimé !' : 'Plus petit qu’on ne le croit !'}>
              Tu avais estimé {cuilleres} cuillère{cuilleres > 1 ? 's' : ''}. En réalité, c’est environ <b>2 à 5 cuillères à soupe</b> (30 à 80 ml) en tout : bien moins qu’un petit verre. Ça paraît plus parce que c’est étalé sur plusieurs jours et mélangé à de petits morceaux d’endomètre.
            </Retour>
            <BoutonR variante="secondaire" onClick={() => setVu(false)}><RotateCcw size={18} /> Réessayer</BoutonR>
          </>
        )}
      </div>
    </div>
  )
}

// ---------------- Ça absorbe ----------------
const TYPES = {
  serviette: {
    nom: 'Serviette',
    couches: [
      ['Couche douce', 'Reste au contact de la peau, laisse passer le liquide.'],
      ['Cœur absorbant', 'Retient le liquide, comme une éponge.'],
      ['Couche imperméable', 'Empêche le liquide de traverser vers la culotte.'],
    ],
    plein: 'La serviette est pleine : on la change.',
  },
  tampon: {
    nom: 'Tampon',
    couches: [['Fibres absorbantes', 'Elles gonflent en absorbant le liquide à l’intérieur du vagin.']],
    plein: 'Le tampon est plein : on le change (au maximum au bout de 8 heures).',
  },
  cup: {
    nom: 'Cup',
    couches: [['Coupe en silicone', 'Elle n’absorbe rien : elle recueille le liquide, comme un petit verre.']],
    plein: 'La cup est pleine : on la vide, on la rince, on la remet.',
  },
  culotte: {
    nom: 'Culotte',
    couches: [
      ['Couche au contact', 'Garde la peau sèche.'],
      ['Couche absorbante', 'Retient le liquide.'],
      ['Couche imperméable', 'Bloque le liquide.'],
      ['Tissu extérieur', 'C’est une vraie culotte, confortable.'],
    ],
    plein: 'La culotte est pleine : on la change, puis on la rince et on la lave.',
  },
}

function Coupe({ type, niveau }) {
  const n = Math.min(1, Math.max(0, niveau))
  if (type === 'serviette' || type === 'culotte') {
    const bandes =
      type === 'serviette'
        ? [['#FFFFFF', 20], ['#FBEFE0', 44], ['#8DB9D9', 12]]
        : [['#FFFFFF', 16], ['#FBEFE0', 34], ['#8DB9D9', 10], ['#C9B8E8', 18]]
    let y = 18
    const hCoeur = type === 'serviette' ? 44 : 34
    const yCoeur = type === 'serviette' ? 38 : 34
    return (
      <svg viewBox="0 0 220 130" className="w-full" role="img" aria-label={`Coupe d’une ${type === 'serviette' ? 'serviette' : 'culotte'} : le liquide est absorbé`}>
        {bandes.map(([c, h], i) => {
          const el = <rect key={i} x={20} y={y} width={180} height={h} fill={c} stroke={L} strokeWidth={2} />
          y += h
          return el
        })}
        <rect x={110 - 90 * n} y={yCoeur} width={180 * n} height={hCoeur} fill={SANG} opacity={0.8} />
        {n > 0 && n < 1 && <path d={`M110 4 L110 ${yCoeur - 2}`} stroke={SANG} strokeWidth={4} strokeLinecap="round" strokeDasharray="2 7" />}
      </svg>
    )
  }
  if (type === 'tampon') {
    const w = 26 + 12 * n
    return (
      <svg viewBox="0 0 220 130" className="w-full" role="img" aria-label="Coupe d’un tampon qui gonfle en absorbant">
        <path d="M110 118 C110 124 120 124 118 112" fill="none" stroke={L} strokeWidth={2.4} />
        <rect x={110 - w / 2} y={22} width={w} height={86} rx={w / 2.3} fill="#FFFFFF" stroke={L} strokeWidth={2.4} />
        <clipPath id="tampon-c"><rect x={110 - w / 2} y={22} width={w} height={86} rx={w / 2.3} /></clipPath>
        <rect x={0} y={108 - 86 * n} width={220} height={86} fill={SANG} opacity={0.8} clipPath="url(#tampon-c)" />
        {[40, 55, 70, 85, 100].map((yy) => <path key={yy} d={`M${110 - w / 2 + 2} ${yy} Q110 ${yy + 4} ${110 + w / 2 - 2} ${yy}`} fill="none" stroke="#E3A9B1" strokeWidth={1.4} />)}
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 220 130" className="w-full" role="img" aria-label="Coupe d’une cup qui recueille le liquide">
      <clipPath id="cup-c"><path d="M70 30 C70 76 88 98 110 98 C132 98 150 76 150 30 Z" /></clipPath>
      <path d="M70 30 C70 76 88 98 110 98 C132 98 150 76 150 30 Z" transform="translate(0 0)" fill="#EEE8F8" />
      <rect x={60} y={98 - 68 * n} width={100} height={70} fill={SANG} opacity={0.85} clipPath="url(#cup-c)" />
      <path d="M70 30 C70 76 88 98 110 98 C132 98 150 76 150 30 Z" fill="none" stroke={L} strokeWidth={2.6} strokeLinejoin="round" />
      <ellipse cx={110} cy={30} rx={40} ry={7} fill="none" stroke={L} strokeWidth={2.6} />
      <path d="M110 98 L110 122" stroke={L} strokeWidth={6} strokeLinecap="round" />
    </svg>
  )
}

function Absorbe() {
  const [type, setType] = useState('serviette')
  const [gouttes, setGouttes] = useState(0)
  const t = TYPES[type]
  const MAX = 8
  const niveau = gouttes / MAX
  return (
    <>
      <Consigne couleur="#2F8FA3">Choisis une protection, puis verse du liquide (de l’eau colorée en rose, pas du vrai sang !) et regarde où il va.</Consigne>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Choisir une protection">
        {Object.entries(TYPES).map(([id, v]) => (
          <button
            key={id}
            type="button"
            onClick={() => { setType(id); setGouttes(0) }}
            aria-pressed={type === id}
            className="regles-titre min-h-[44px] rounded-full border-2 px-4 text-[15px] active:scale-95"
            style={type === id ? { background: '#2F8FA3', borderColor: '#2F8FA3', color: '#fff' } : { background: '#fff', borderColor: C.bord, color: C.texte }}
          >
            {v.nom}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <CarteR>
          <Coupe type={type} niveau={niveau} />
          <div className="mt-3 flex gap-2">
            <BoutonR className="flex-1" couleur="#2F8FA3" disabled={gouttes >= MAX} onClick={() => setGouttes((g) => g + 1)}><Droplet size={18} /> Verser</BoutonR>
            <BoutonR variante="secondaire" aria-label="Remettre à zéro" onClick={() => setGouttes(0)}><RotateCcw size={18} /></BoutonR>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full" style={{ background: C.bord }}>
            <div className="h-full rounded-full transition-[width]" style={{ width: `${niveau * 100}%`, background: SANG }} />
          </div>
        </CarteR>
        <div className="flex flex-col gap-3">
          <CarteR>
            <p className="regles-mono text-[11px] uppercase" style={{ color: C.doux }}>Ce que tu vois</p>
            <ul className="mt-2 space-y-2">
              {t.couches.map(([nom, texte]) => (
                <li key={nom} className="text-[14.5px] leading-snug" style={{ color: C.texte }}>
                  <b>{nom}</b> : {texte}
                </li>
              ))}
            </ul>
          </CarteR>
          {gouttes >= MAX && <Retour ok titre="Plein !">{t.plein} Il existe des tailles et des modèles pour chaque abondance : on choisit selon ses règles.</Retour>}
        </div>
      </div>
    </>
  )
}
