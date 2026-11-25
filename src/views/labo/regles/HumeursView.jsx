import { useState } from 'react'
import { LineChart, MessageCircleHeart } from 'lucide-react'
import Visage from '../../../components/labo/regles/Visage.jsx'
import { C, CarteR, Consigne, Onglets, PageRegles } from '../../../components/labo/regles/ui.jsx'
import { oestrogenes, phaseDuJour, progesterone } from '../../../components/labo/regles/cycle.js'
import { ETAPES } from '../../../components/labo/regles/fiches.js'

// =============================================================
//  R8 · Humeurs — pourquoi les humeurs peuvent changer.
//  Deux modes :
//   - Hormones : les courbes SCHÉMATIQUES de deux hormones au fil
//     d'un cycle de 28 jours, avec un curseur de jour.
//   - Ressentis : ce que certain·es ressentent (fatigue, boutons,
//     émotions…), en insistant sur « pas tout le monde, pas pareil ».
//  Les émotions sont réelles : on n'explique pas tout par « les hormones ».
// =============================================================
const L28 = 28
const ROSE = '#C24C68'
const BLEU = '#3C6E96'

export default function HumeursView() {
  const [mode, setMode] = useState('hormones')
  return (
    <PageRegles large>
      <Onglets
        valeur={mode}
        onChange={setMode}
        couleur="#B8861C"
        options={[
          ['hormones', LineChart, 'Hormones'],
          ['ressentis', MessageCircleHeart, 'Ressentis'],
        ]}
      />
      {mode === 'hormones' ? <Hormones /> : <Ressentis />}
    </PageRegles>
  )
}

function Courbes({ jour }) {
  const W = 320
  const H = 160
  const x = (j) => 14 + ((j - 1) / (L28 - 1)) * (W - 28)
  const y = (v) => H - 14 - v * (H - 36)
  const trace = (f) => Array.from({ length: L28 }, (_, i) => `${i ? 'L' : 'M'}${x(i + 1).toFixed(1)} ${y(f(i + 1, L28)).toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Courbes schématiques des hormones, jour ${jour}`}>
      <rect x={0} y={0} width={W} height={H} rx={14} fill="#fff" />
      {[[1, 5, 'regles'], [6, 13, 'avant'], [14, 14, 'ovulation'], [15, 28, 'apres']].map(([a, b, id]) => (
        <rect key={id} x={x(a) - (a === 1 ? 14 : 3)} y={6} width={x(b) - x(a) + (id === 'ovulation' ? 8 : 6) + (a === 1 ? 14 : 0)} height={H - 28} fill={ETAPES[id].fond} opacity={0.9} />
      ))}
      <path d={trace(oestrogenes)} fill="none" stroke={ROSE} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d={trace(progesterone)} fill="none" stroke={BLEU} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
      <line x1={x(jour)} y1={8} x2={x(jour)} y2={H - 22} stroke="#3E2A35" strokeWidth={2.4} strokeDasharray="4 4" />
      <circle cx={x(jour)} cy={y(oestrogenes(jour, L28))} r={6} fill={ROSE} stroke="#fff" strokeWidth={2.5} />
      <circle cx={x(jour)} cy={y(progesterone(jour, L28))} r={6} fill={BLEU} stroke="#fff" strokeWidth={2.5} />
      <text x={14} y={H - 4} fontSize={10} fontWeight={800} fill="#6F5864">jour 1</text>
      <text x={W - 14} y={H - 4} fontSize={10} fontWeight={800} fill="#6F5864" textAnchor="end">jour 28</text>
    </svg>
  )
}

const TEXTES = {
  regles: 'Les deux hormones sont au plus bas. Certaines personnes se sentent fatiguées ou ont des crampes ; d’autres se sentent très bien.',
  avant: 'Les œstrogènes montent : beaucoup de personnes se sentent plus d’énergie, mais pas toutes.',
  ovulation: 'Les œstrogènes sont au plus haut juste avant l’ovulation.',
  apres: 'La progestérone monte, puis les deux hormones baissent avant les règles. C’est à ce moment que certain·es se sentent plus fatigué·es, sensibles ou irritables.',
}
const HUMEUR = { regles: 'neutre', avant: 'content', ovulation: 'fier', apres: 'inquiet' }

function Hormones() {
  const [jour, setJour] = useState(1)
  const phase = phaseDuJour(jour, L28)
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <CarteR>
        <Courbes jour={jour} />
        <div className="mt-2 flex flex-wrap gap-3 text-[13px] font-bold">
          <span className="flex items-center gap-1.5" style={{ color: ROSE }}><span className="h-3 w-3 rounded-full" style={{ background: ROSE }} /> Œstrogènes</span>
          <span className="flex items-center gap-1.5" style={{ color: BLEU }}><span className="h-3 w-3 rounded-full" style={{ background: BLEU }} /> Progestérone</span>
        </div>
        <input type="range" min={1} max={L28} value={jour} onChange={(e) => setJour(+e.target.value)} aria-label={`Jour du cycle de 1 à ${L28}`} className="regles-curseur mt-4" />
        <p className="mt-2 text-center text-[13px]" style={{ color: C.doux }}>Jour {jour} · cycle de 28 jours · schéma simplifié</p>
      </CarteR>
      <div className="flex flex-col gap-3">
        <Consigne couleur="#B8861C">
          Les <b>hormones</b> sont des messagers chimiques fabriqués par le corps. Pendant le cycle, deux d’entre elles montent et descendent. Déplace le curseur pour voir.
        </Consigne>
        <CarteR key={phase} className="regles-apparait" couleur={ETAPES[phase].couleur} fond={ETAPES[phase].fond}>
          <div className="flex items-center gap-3">
            <Visage id="noa" humeur={HUMEUR[phase]} className="h-16 w-16 flex-none rounded-full" titre="" />
            <h2 className="regles-titre text-[22px] leading-tight" style={{ color: C.texte }}>{ETAPES[phase].nom}</h2>
          </div>
          <p className="mt-2 text-[15px] leading-relaxed" style={{ color: C.texte }}>{TEXTES[phase]}</p>
        </CarteR>
        <p className="rounded-2xl px-3.5 py-3 text-[14px] leading-snug" style={{ background: '#FDEBD3', color: C.texte }}>
          <b>Attention :</b> les hormones peuvent influencer ce qu’on ressent, mais nos émotions sont bien réelles et elles comptent. Ce n’est pas « dans la tête » et il ne faut pas se moquer.
        </p>
      </div>
    </div>
  )
}

const RESSENTIS = [
  { id: 'fatigue', nom: 'Fatigue', quand: 'Surtout les premiers jours de règles, ou juste avant.', aide: 'Dormir assez, bouger doucement, boire de l’eau.' },
  { id: 'irrit', nom: 'Irritabilité', quand: 'Plutôt dans les jours qui précèdent les règles.', aide: 'Faire une pause, respirer, bouger, dire « j’ai besoin d’un moment ».' },
  { id: 'tristesse', nom: 'Tristesse, envie de pleurer', quand: 'Parfois juste avant les règles.', aide: 'Parler à quelqu’un de confiance, se reposer. Si c’est très fort ou long, on le dit à un adulte.' },
  { id: 'energie', nom: 'Beaucoup d’énergie', quand: 'Souvent avant l’ovulation.', aide: 'On en profite : sport, jeux, projets !' },
  { id: 'boutons', nom: 'Boutons', quand: 'Souvent avant les règles, et à la puberté en général.', aide: 'Se laver doucement le visage ; demander conseil à un adulte ou un médecin si ça gêne.' },
  { id: 'faim', nom: 'Faim, envie de sucré', quand: 'Parfois avant les règles.', aide: 'Manger à sa faim, avec des aliments variés.' },
  { id: 'seins', nom: 'Seins sensibles', quand: 'Avant les règles, parfois.', aide: 'Porter des vêtements confortables.' },
  { id: 'rien', nom: 'Rien de particulier', quand: 'C’est le cas de beaucoup de personnes !', aide: 'C’est tout aussi normal.' },
]
function Ressentis() {
  const [choix, setChoix] = useState(null)
  const r = RESSENTIS.find((x) => x.id === choix)
  return (
    <div className="flex flex-col gap-3">
      <Consigne couleur="#B8861C">Touche un ressenti : <b>certain·es</b> le vivent, d’autres pas du tout. Chaque personne est différente, et chaque cycle aussi.</Consigne>
      <div className="flex flex-wrap gap-2">
        {RESSENTIS.map((x) => (
          <button
            key={x.id}
            type="button"
            aria-pressed={choix === x.id}
            onClick={() => setChoix(x.id)}
            className="regles-titre min-h-[48px] rounded-full border-2 px-4 text-[15px] active:scale-95"
            style={choix === x.id ? { background: '#F6D58E', borderColor: '#B8861C', color: C.texte } : { background: '#fff', borderColor: C.bord, color: C.texte }}
          >
            {x.nom}
          </button>
        ))}
      </div>
      {r ? (
        <CarteR key={r.id} className="regles-apparait" couleur="#E5C18A" fond="#FFFDF8">
          <h2 className="regles-titre text-[22px]" style={{ color: C.texte }}>{r.nom}</h2>
          <p className="mt-1 text-[15px]" style={{ color: C.texte }}><b>Quand ?</b> {r.quand}</p>
          <p className="mt-1 text-[15px]" style={{ color: C.texte }}><b>Ce qui peut aider :</b> {r.aide}</p>
          <p className="mt-2 text-[13.5px]" style={{ color: C.doux }}>Certaines personnes ressentent ça, d’autres jamais, et ça peut changer d’un cycle à l’autre.</p>
        </CarteR>
      ) : (
        <CarteR className="text-center"><p style={{ color: C.doux }}>Choisis un ressenti pour en savoir plus.</p></CarteR>
      )}
      <CarteR couleur={C.sauge}>
        <h3 className="regles-titre text-[18px]" style={{ color: C.texte }}>Pour mieux se comprendre</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px]" style={{ color: C.texte }}>
          <li>On peut noter ce qu’on ressent dans un carnet : on repère vite ce qui revient.</li>
          <li>Bouger, bien dormir et parler de ce qu’on ressent aident souvent.</li>
          <li>Si on se sent mal pendant longtemps, on en parle à un adulte de confiance.</li>
        </ul>
      </CarteR>
    </div>
  )
}
