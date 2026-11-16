import { useState } from 'react'
import { ArrowRight, Contrast, Crosshair, HeartPulse, Lightbulb, RotateCcw, Search } from 'lucide-react'
import CadreJeu, { Bouton, Carte, Eclat } from '../../components/labo/CadreJeu.jsx'

// =============================================================
//  A10 · Service des urgences
//  De VRAIES radiographies, intégrées au site : base FracAtlas
//  (Abedeen et al., 2023, Scientific Data, licence CC BY 4.0),
//  avec l'emplacement de chaque fracture annoté par des radiologues.
//  Parcours : dossier → zone à radiographier → négatoscope
//  (trouver la fracture du doigt, avec indices) → quel os → soins.
//  Fichiers : public/labo/radios/ (redimensionnés, noir et blanc).
//  Attendus 112, 115.
// =============================================================
const CREDIT = 'Radiographies : FracAtlas, Abedeen et al. (2023), Scientific Data · licence CC BY 4.0'
const ZONES = ['Épaule et bras', 'Coude', 'Avant-bras et poignet', 'Hanche et cuisse', 'Genou', 'Jambe et cheville']
const OS_CHOIX = ['Humérus', 'Radius', 'Cubitus', 'Os du poignet', 'Fémur', 'Tibia', 'Péroné']

const PATIENTS = [
  {
    radio: 'IMG0002885', boite: [0.471, 0.241, 0.0971, 0.1192],
    nom: 'Léo', motif: 'Chute de trottinette', douleur: 6, pouls: 96,
    recit: '« J’ai voulu me rattraper avec la main tendue. Mon poignet est gonflé et j’ai mal quand je le tourne. »',
    zone: 'Avant-bras et poignet', os: 'Radius',
    indices: ['Regarde les deux os de l’avant-bras, juste au-dessus du poignet.', 'Le plus gros des deux, du côté du pouce, a une petite cassure.', 'La fracture est en bas du radius, à 3 cm du poignet.'],
    soins: { bon: 'Plâtre', choix: ['Plâtre', 'Béquilles', 'Rien du tout'] },
    apres: 'La fracture du bas du radius est la plus fréquente : on se rattrape avec la main tendue. Un plâtre maintient les morceaux le temps que l’os se répare.',
  },
  {
    radio: 'IMG0003991', boite: null,
    nom: 'Inès', motif: 'Chute à la récréation', douleur: 4, pouls: 90,
    recit: '« Je suis tombée sur la main. J’ai un peu mal au poignet, mais je peux le bouger. »',
    zone: 'Avant-bras et poignet', os: null,
    indices: ['Suis le contour de chaque os : est-il bien continu ?', 'Les bandes plus claires près du poignet sont normales chez les enfants : ce sont les cartilages de croissance.', 'Aucun os n’est cassé : c’est sûrement une entorse.'],
    soins: { bon: 'Bandage et repos', choix: ['Bandage et repos', 'Opération', 'Plâtre du bras entier'] },
    apres: 'Pas de fracture ! Une entorse, c’est un ligament (qui relie deux os) un peu étiré. Les bandes claires près du poignet sont les cartilages de croissance : c’est là que les os des enfants grandissent.',
  },
  {
    radio: 'IMG0003523', boite: [0.5541, 0.278, 0.052, 0.0757],
    nom: 'Tom', motif: 'Tacle au football', douleur: 7, pouls: 102,
    recit: '« J’ai reçu un coup de pied sur le côté de la jambe. Ça a fait crac et j’ai mal en marchant. »',
    zone: 'Jambe et cheville', os: 'Péroné',
    indices: ['Deux os dans la jambe : un gros et un fin.', 'Regarde l’os fin, sur le côté de la jambe.', 'Le péroné est cassé dans sa partie haute.'],
    soins: { bon: 'Botte ou attelle', choix: ['Botte ou attelle', 'Écharpe', 'Rien du tout'] },
    apres: 'Le péroné porte peu de poids : le tibia, à côté, sert de tuteur. Une botte ou une attelle suffit souvent.',
  },
  {
    radio: 'IMG0002430', boite: [0.558, 0.4758, 0.073, 0.0362],
    nom: 'Yanis', motif: 'Chute de vélo', douleur: 8, pouls: 110,
    recit: '« Ma jambe s’est coincée sous le vélo. J’ai très mal au milieu du tibia, je ne peux pas me mettre debout. »',
    zone: 'Jambe et cheville', os: 'Tibia',
    indices: ['Regarde le plus gros os de la jambe.', 'Suis-le de haut en bas : une ligne sombre le traverse.', 'Le tibia est cassé de part en part, dans le bas de la jambe.'],
    soins: { bon: 'Plâtre', choix: ['Plâtre', 'Écharpe', 'Pansement'] },
    apres: 'Le tibia porte le poids du corps : il faut l’immobiliser longtemps, parfois l’opérer, avant de remarcher.',
  },
  {
    radio: 'IMG0002737', boite: [0.463, 0.366, 0.0631, 0.0518],
    nom: 'Maxime', motif: 'Chute en skate', douleur: 5, pouls: 94,
    recit: '« Je suis tombé sur la paume de la main. J’ai mal au poignet, surtout du côté du pouce. »',
    zone: 'Avant-bras et poignet', os: 'Os du poignet',
    indices: ['La douleur est du côté du pouce : regarde les petits os du poignet.', 'Le poignet compte 8 petits os. L’un d’eux, près du pouce, a une fine ligne sombre.', 'C’est le scaphoïde, un os du poignet, qui est cassé.'],
    soins: { bon: 'Plâtre', choix: ['Plâtre', 'Rien du tout', 'Béquilles'] },
    apres: 'Le scaphoïde est un petit os du poignet. Sa fracture se voit mal sur la radio : les médecins la cherchent toujours quand on a mal du côté du pouce.',
  },
  {
    radio: 'IMG0002622', boite: [0.4359, 0.2928, 0.1481, 0.0781],
    nom: 'Nora', motif: 'Chute de cheval', douleur: 8, pouls: 108,
    recit: '« Je suis tombée sur l’épaule. Je ne peux plus lever le bras du tout. »',
    zone: 'Épaule et bras', os: 'Humérus',
    indices: ['Regarde l’os du bras, tout en haut, près de l’épaule.', 'La tête arrondie de cet os s’emboîte dans l’épaule : juste en dessous, une cassure.', 'Le haut de l’humérus est cassé.'],
    soins: { bon: 'Écharpe', choix: ['Écharpe', 'Béquilles', 'Botte'] },
    apres: 'Le bras est maintenu contre le corps avec une écharpe : le haut de l’humérus se répare souvent sans opération.',
  },
  {
    radio: 'IMG0002390', boite: [0.501, 0.3517, 0.219, 0.1775],
    nom: 'Samuel', motif: 'Grosse chute à ski', douleur: 9, pouls: 118,
    recit: '« Je suis tombé à pleine vitesse. J’ai horriblement mal au-dessus du genou, je ne peux plus bouger la jambe. »',
    zone: 'Genou', os: 'Fémur',
    indices: ['Regarde au-dessus du genou.', 'C’est l’os de la cuisse, le plus long du corps.', 'Le bas du fémur est cassé, juste au-dessus du genou.'],
    soins: { bon: 'Opération', choix: ['Opération', 'Écharpe', 'Pansement'] },
    apres: 'Le fémur est très solide : il faut un choc énorme pour le casser. Le chirurgien le répare souvent avec du métal.',
  },
  {
    radio: 'IMG0002180', boite: [0.0611, 0.4183, 0.1828, 0.1733],
    nom: 'Lucienne', motif: 'Chute dans sa cuisine', douleur: 8, pouls: 92,
    recit: '« J’ai glissé et je suis tombée sur le côté. J’ai mal à la hanche et ma jambe est tournée vers l’extérieur. »',
    zone: 'Hanche et cuisse', os: 'Fémur',
    indices: ['Regarde où la cuisse rejoint le bassin, du côté de la douleur (à gauche de l’image).', 'La tête ronde du fémur s’emboîte dans le bassin : c’est le « col » juste en dessous qu’il faut observer.', 'Le haut du fémur, près de la hanche, est cassé.'],
    soins: { bon: 'Opération', choix: ['Opération', 'Écharpe', 'Rien du tout'] },
    apres: 'Avec l’âge, les os deviennent plus fragiles. La fracture du haut du fémur est fréquente chez les personnes âgées : on opère pour qu’elles remarchent vite.',
  },
]

// La touche est-elle sur la fracture ? (zone annotée, un peu agrandie pour le doigt)
function dansBoite(boite, x, y) {
  const [bx, by, bw, bh] = boite
  const mx = Math.max(bw * 0.5, 0.04)
  const my = Math.max(bh * 0.5, 0.04)
  return x >= bx - mx && x <= bx + bw + mx && y >= by - my && y <= by + bh + my
}

export default function UrgencesView() {
  const [index, setIndex] = useState(0)
  const [etape, setEtape] = useState('dossier') // dossier | radio | os | soins
  const [points, setPoints] = useState(100)
  const [total, setTotal] = useState(0)
  const [indices, setIndices] = useState(0)
  const [message, setMessage] = useState('')
  const [essais, setEssais] = useState([])
  const [trouve, setTrouve] = useState(false)
  const [osChoisi, setOsChoisi] = useState(null)
  const [soin, setSoin] = useState(null)
  const [inverse, setInverse] = useState(false)
  const [contraste, setContraste] = useState(1)
  const [zoom, setZoom] = useState(false)
  const [eclat, setEclat] = useState({ message: '', sous: '', cle: 0 })

  const patient = PATIENTS[index]
  const grade = total >= 650 ? 'Chef de clinique' : total >= 450 ? 'Médecin urgentiste' : total >= 250 ? 'Interne' : 'Stagiaire'

  function reinit() {
    setEtape('dossier')
    setPoints(100)
    setIndices(0)
    setMessage('')
    setEssais([])
    setTrouve(false)
    setOsChoisi(null)
    setSoin(null)
    setInverse(false)
    setContraste(1)
    setZoom(false)
  }

  function choisirZone(z) {
    if (z === patient.zone) {
      setMessage('')
      setEtape('radio')
    } else {
      setPoints((p) => Math.max(0, p - 10))
      setMessage('Le chef de service : « Relis le dossier, la douleur n’est pas là. » (−10)')
    }
  }

  function toucherRadio(e) {
    if (etape !== 'radio' || trouve) return
    const r = e.currentTarget.getBoundingClientRect()
    let x = (e.clientX - r.left) / r.width
    let y = (e.clientY - r.top) / r.height
    if (zoom) {
      // l'image est agrandie 2x autour de son centre
      x = 0.5 + (x - 0.5) / 2
      y = 0.5 + (y - 0.5) / 2
    }
    if (!patient.boite) {
      setEssais((t) => [...t, { x, y }])
      setPoints((p) => Math.max(0, p - 10))
      setMessage('Tu es sûr ? Observe bien le contour de chaque os… (−10)')
      return
    }
    if (dansBoite(patient.boite, x, y)) {
      setTrouve(true)
      setMessage('')
      setEclat((k) => ({ message: 'Fracture trouvée !', sous: 'Bien vu, docteur.', cle: k.cle + 1 }))
    } else {
      setEssais((t) => [...t, { x, y }])
      setPoints((p) => Math.max(0, p - 10))
      setMessage('Pas ici… cherche une ligne sombre qui coupe un os, ou un os qui n’est plus bien aligné. (−10)')
    }
  }

  function pasDeFracture() {
    if (!patient.boite) {
      setTrouve(true)
      setMessage('')
      setEclat((k) => ({ message: 'Bien vu !', sous: 'Aucun os n’est cassé sur cette radio.', cle: k.cle + 1 }))
    } else {
      setPoints((p) => Math.max(0, p - 20))
      setMessage('Si, il y a bien une fracture : regarde encore, ou demande un indice. (−20)')
    }
  }

  function demanderIndice() {
    if (indices >= 3) return
    setPoints((p) => Math.max(0, p - [10, 15, 25][indices]))
    setIndices((i) => i + 1)
  }

  function validerOs(o) {
    if (osChoisi) return
    setOsChoisi(o)
    if (o !== patient.os) setPoints((p) => Math.max(0, p - 25))
    else setEclat((k) => ({ message: 'Diagnostic exact !', sous: `Fracture du ${o.toLowerCase()}`, cle: k.cle + 1 }))
  }

  function choisirSoin(s) {
    if (soin) return
    setSoin(s)
    const final = Math.max(0, points - (s === patient.soins.bon ? 0 : 20))
    setPoints(final)
    setTotal((t) => t + final)
  }

  if (!patient) {
    return (
      <CadreJeu code="A10" titre="Service des urgences" attendus={[112, 115]} couleur="#FF6B7A">
        <Carte couleur="rgba(255,107,122,.45)" className="text-center">
          <p className="labo-mono text-[11px] text-[#FF6B7A]">FIN DE LA GARDE</p>
          <p className="labo-titre mt-1 text-3xl font-black text-white">{total} points</p>
          <p className="mt-1 text-lg font-bold text-[#FFD27A]">Grade : {grade}</p>
          <p className="mt-2 text-sm text-[#B9C1E3]">{PATIENTS.length} patients soignés. Un os cassé sait se réparer tout seul : il fabrique du nouvel os autour de la cassure. Le plâtre garde juste les morceaux bien en place.</p>
          <Bouton className="mx-auto mt-4" couleur="#FF6B7A" onClick={() => { setIndex(0); setTotal(0); reinit() }}>
            <RotateCcw size={18} /> Nouvelle garde
          </Bouton>
        </Carte>
      </CadreJeu>
    )
  }

  const etapes = ['dossier', 'radio', 'os', 'soins']
  const [bx, by, bw, bh] = patient.boite || [0, 0, 0, 0]

  return (
    <CadreJeu
      code="A10"
      titre="Service des urgences"
      attendus={[112, 115]}
      couleur="#FF6B7A"
      droite={
        <div className="text-right">
          <p className="labo-mono text-lg text-[#9DFF8A]">{points}</p>
          <p className="text-[10px] text-[#8A93B8]">points</p>
        </div>
      }
    >
      <Eclat message={eclat.message} sousTitre={eclat.sous} cle={eclat.cle} couleur="#FF6B7A" />
      <div className="flex gap-1.5">
        {etapes.map((e, i) => (
          <div key={e} className="h-1.5 flex-1 rounded-full" style={{ background: i <= etapes.indexOf(etape) ? '#6FEFFF' : 'rgba(232,236,255,.15)' }} />
        ))}
      </div>

      <Carte couleur="rgba(111,239,255,.35)">
        <div className="flex items-center justify-between">
          <span className="labo-mono text-[11px] text-[#6FEFFF]">
            PATIENT {index + 1} / {PATIENTS.length}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-[#FF9AA5]">
            <HeartPulse size={14} /> {patient.pouls} · douleur {patient.douleur}/10
          </span>
        </div>
        <p className="labo-titre mt-1 text-xl font-bold text-white">{patient.nom}</p>
        <p className="text-sm text-[#B9C1E3]">{patient.motif}</p>
        {etape === 'dossier' && <p className="mt-2 text-[15px] leading-relaxed text-[#DDE2F7]">{patient.recit}</p>}
      </Carte>

      {etape === 'dossier' && (
        <>
          <p className="labo-titre text-[15px] font-medium text-white">Quelle zone faut-il radiographier ?</p>
          <div className="grid grid-cols-2 gap-2">
            {ZONES.map((z) => (
              <Bouton key={z} variante="secondaire" className="text-sm" onClick={() => choisirZone(z)}>
                {z}
              </Bouton>
            ))}
          </div>
          {message && <p className="rounded-2xl bg-[#FF6B7A]/15 p-3 text-sm text-[#FFD0D5]">{message}</p>}
        </>
      )}

      {etape !== 'dossier' && (
        <div className="rounded-3xl bg-[#DDF6FF] p-2">
          <div className="relative overflow-hidden rounded-2xl bg-black">
            <div className="relative" onClick={toucherRadio} style={{ cursor: etape === 'radio' && !trouve ? 'crosshair' : 'default' }}>
              <div className="transition-transform duration-300" style={{ transform: zoom ? 'scale(2)' : 'none' }}>
                <img
                  src={`/labo/radios/${patient.radio}.jpg`}
                  alt={`Vraie radiographie : ${patient.motif}`}
                  className="block w-full select-none"
                  draggable={false}
                  style={{ filter: `${inverse ? 'invert(1) ' : ''}contrast(${contraste})` }}
                />
                {trouve && patient.boite && (
                  <div
                    className="labo-pulse absolute rounded-full border-[3px] border-[#FFD27A]"
                    style={{ left: `${(bx - bw * 0.3) * 100}%`, top: `${(by - bh * 0.3) * 100}%`, width: `${bw * 160}%`, height: `${bh * 160}%`, boxShadow: '0 0 18px #FFD27A' }}
                  />
                )}
                {essais.map((p, i) => (
                  <div key={i} className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#FF6B7A]" style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }} />
                ))}
              </div>
            </div>
            {!trouve && <span className="labo-scan pointer-events-none opacity-50" style={{ background: '#B8F7FF' }} />}
          </div>
          <p className="px-1 pt-1.5 text-[10px] leading-snug text-[#20313B]">Vraie radiographie · {CREDIT}</p>
        </div>
      )}

      {etape === 'radio' && (
        <>
          {!trouve ? (
            <>
              <Carte couleur="rgba(111,239,255,.35)">
                <p className="flex items-center gap-2 text-[15px] text-white">
                  <Crosshair size={18} className="text-[#6FEFFF]" /> Touche la fracture sur la radio.
                </p>
                {message && <p className="mt-2 text-sm text-[#FFD0D5]">{message}</p>}
              </Carte>
              <div className="grid grid-cols-3 gap-2">
                <Bouton variante="secondaire" className="px-2 text-sm" onClick={() => setInverse((v) => !v)}>
                  <Contrast size={16} /> Inverser
                </Bouton>
                <Bouton variante="secondaire" className="px-2 text-sm" onClick={() => setZoom((z) => !z)}>
                  <Search size={16} /> {zoom ? 'Normal' : 'Zoom'}
                </Bouton>
                <Bouton variante="secondaire" className="px-2 text-sm" onClick={pasDeFracture}>
                  Rien de cassé
                </Bouton>
              </div>
              <label className="block text-xs text-[#8A93B8]">
                Contraste
                <input type="range" min="0.6" max="2.2" step="0.05" value={contraste} onChange={(e) => setContraste(Number(e.target.value))} className="mt-1 w-full accent-[#6FEFFF]" />
              </label>
              <Carte couleur="rgba(255,210,122,.4)">
                <div className="flex items-center justify-between">
                  <span className="labo-mono text-[11px] text-[#FFD27A]">INDICES DU CHEF DE SERVICE</span>
                  <span className="text-xs text-[#8A93B8]">{indices} / 3</span>
                </div>
                {patient.indices.slice(0, indices).map((t) => (
                  <p key={t} className="mt-1.5 flex gap-2 text-sm text-[#FFE6B0]">
                    <Lightbulb size={16} className="mt-0.5 flex-none" /> {t}
                  </p>
                ))}
                {indices < 3 && (
                  <button type="button" onClick={demanderIndice} className="mt-2 h-11 w-full rounded-xl border border-dashed border-[#FFD27A]/60 text-sm text-[#FFD27A]">
                    Indice {indices + 1} · −{[10, 15, 25][indices]} points
                  </button>
                )}
              </Carte>
            </>
          ) : (
            <Bouton couleur="#6FEFFF" onClick={() => setEtape(patient.os ? 'os' : 'soins')}>
              {patient.os ? 'Quel os est cassé ?' : 'Choisir le soin'} <ArrowRight size={18} />
            </Bouton>
          )}
        </>
      )}

      {etape === 'os' && (
        <>
          <p className="labo-titre text-[15px] font-medium text-white">Quel os est cassé ?</p>
          <div className="flex flex-wrap gap-2">
            {OS_CHOIX.map((o) => (
              <button
                key={o}
                type="button"
                disabled={!!osChoisi}
                onClick={() => validerOs(o)}
                className="h-11 rounded-xl border-2 px-3 text-sm font-bold"
                style={{
                  borderColor: !osChoisi ? 'rgba(232,236,255,.18)' : o === patient.os ? '#9DFF8A' : osChoisi === o ? '#FF8A95' : 'rgba(232,236,255,.1)',
                  background: 'rgba(18,26,48,.85)',
                }}
              >
                {o}
              </button>
            ))}
          </div>
          {osChoisi && (
            <>
              <p className={`text-[15px] ${osChoisi === patient.os ? 'text-[#9DFF8A]' : 'text-[#FF8A95]'}`}>
                {osChoisi === patient.os ? 'Exact !' : `Non : c’est le ${patient.os.toLowerCase()}. (−25)`}
              </p>
              <Bouton couleur="#6FEFFF" onClick={() => setEtape('soins')}>
                Choisir le soin <ArrowRight size={18} />
              </Bouton>
            </>
          )}
        </>
      )}

      {etape === 'soins' && (
        <>
          <p className="labo-titre text-[15px] font-medium text-white">Quel soin pour {patient.nom} ?</p>
          <div className="grid gap-2">
            {patient.soins.choix.map((s) => (
              <button
                key={s}
                type="button"
                disabled={!!soin}
                onClick={() => choisirSoin(s)}
                className="h-12 rounded-xl border-2 px-3 text-left text-[15px] font-bold"
                style={{
                  borderColor: !soin ? 'rgba(232,236,255,.18)' : s === patient.soins.bon ? '#9DFF8A' : soin === s ? '#FF8A95' : 'rgba(232,236,255,.1)',
                  background: 'rgba(18,26,48,.85)',
                }}
              >
                {s}
              </button>
            ))}
          </div>
          {soin && (
            <Carte couleur="rgba(157,255,138,.4)">
              <p className="text-[15px] leading-relaxed text-[#E8ECFF]">{patient.apres}</p>
              <Bouton className="mt-3 w-full" couleur="#FF6B7A" onClick={() => { reinit(); setIndex((i) => i + 1) }}>
                {index + 1 < PATIENTS.length ? 'Patient suivant' : 'Fin de la garde'} <ArrowRight size={18} />
              </Bouton>
            </Carte>
          )}
        </>
      )}
    </CadreJeu>
  )
}
