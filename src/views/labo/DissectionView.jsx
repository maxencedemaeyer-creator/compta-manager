import { useEffect, useState } from 'react'
import { Check, RotateCcw, Scissors } from 'lucide-react'
import CadreJeu, { Bouton, Carte, Eclat } from '../../components/labo/CadreJeu.jsx'
import Corps3D from '../../components/labo/Corps3D.jsx'
import { NOMS, OS } from '../../components/labo/anatomie.js'

// =============================================================
//  A8 · Le scalpel (vrais tissus 3D, BodyParts3D)
//  Dissection du bras droit : inciser la peau, retirer les muscles
//  un à un (leurs tendons s'accrochent aux os), découvrir les os.
//  Puis : l'aile de poulet, pour préparer la vraie dissection.
//  Attendus 119, 120.
// =============================================================
const MUSCLES_BRAS = ['deltoide', 'biceps', 'brachial', 'triceps', 'muscles_avant_bras']
const INFOS = {
  deltoide: 'Le deltoïde arrondit l’épaule : il lève le bras sur le côté.',
  biceps: 'Le biceps, devant le bras : ses tendons partent de l’omoplate et s’accrochent au radius. Il plie le coude.',
  brachial: 'Le brachial, caché sous le biceps, aide aussi à plier le coude.',
  triceps: 'Le triceps, derrière le bras : il s’accroche à la pointe du coude (le cubitus) et tend le bras.',
  muscles_avant_bras: 'Les muscles de l’avant-bras font bouger le poignet et les doigts. Leurs longs tendons glissent jusqu’à la main.',
}
const DIRECTION = { deltoide: [0, 0.12, 0.2], biceps: [0, 0, 0.32], brachial: [0, 0, 0.26], triceps: [0, 0, -0.32], muscles_avant_bras: [0, -0.1, 0.28] }

const QUESTIONS = [
  { q: 'Qu’est-ce qui attache un muscle à un os ?', r: ['un tendon', 'un nerf', 'la peau'], bon: 0 },
  { q: 'Le biceps est accroché…', r: ['à un seul os', 'à deux os différents, de part et d’autre du coude', 'à la peau'], bon: 1 },
  { q: 'Entre l’humérus et les os de l’avant-bras, il y a…', r: ['un muscle', 'une articulation : le coude', 'un tendon'], bon: 1 },
]

export default function DissectionView() {
  const [etape, setEtape] = useState('peau') // peau | muscles | os
  const [opacite, setOpacite] = useState(1)
  const [retires, setRetires] = useState([])
  const [info, setInfo] = useState(null)
  const [question, setQuestion] = useState(0)
  const [reponse, setReponse] = useState(null)
  const [partie, setPartie] = useState(0)
  const [eclat, setEclat] = useState({ message: '', sous: '', cle: 0 })

  useEffect(() => {
    if (etape === 'peau' || opacite <= 0) return
    const id = setInterval(() => setOpacite((o) => Math.max(0, o - 0.06)), 30)
    return () => clearInterval(id)
  }, [etape, opacite])

  function toucher(groupe) {
    if (etape === 'peau' && groupe === 'peau') {
      setEtape('muscles')
      setEclat((x) => ({ message: 'Incision !', sous: 'Sous la peau : les muscles, rouges, faits de longues fibres.', cle: x.cle + 1 }))
      return
    }
    if (etape === 'muscles' && MUSCLES_BRAS.includes(groupe) && !retires.includes(groupe)) {
      const n = [...retires, groupe]
      setRetires(n)
      setInfo(groupe)
      if (n.length === MUSCLES_BRAS.length) {
        setTimeout(() => {
          setEtape('os')
          setEclat((x) => ({ message: 'Voici les os !', sous: 'Humérus, radius, cubitus : les muscles étaient accrochés dessus par leurs tendons.', cle: x.cle + 1 }))
        }, 900)
      }
    }
  }

  function recommencer() {
    setEtape('peau')
    setOpacite(1)
    setRetires([])
    setInfo(null)
    setQuestion(0)
    setReponse(null)
    setPartie((p) => p + 1)
  }

  const decalages = Object.fromEntries(retires.map((m) => [`${m}_d`, DIRECTION[m]]))
  const etats = {}
  for (const m of retires) etats[`${m}_d`] = 'cache'
  if (info && etape === 'muscles') etats[`${info}_d`] = undefined
  const q = QUESTIONS[question]

  return (
    <CadreJeu code="A8" titre="Le scalpel" attendus={[119, 120]} couleur="#FF8A95">
      <Eclat message={eclat.message} sousTitre={eclat.sous} cle={eclat.cle} couleur="#FF8A95" />
      <Carte couleur="rgba(255,138,149,.45)">
        <p className="labo-mono text-[11px] text-[#FF8A95]">
          {etape === 'peau' ? 'ÉTAPE 1 / 3 · LA PEAU' : etape === 'muscles' ? `ÉTAPE 2 / 3 · LES MUSCLES · ${retires.length} / ${MUSCLES_BRAS.length}` : 'ÉTAPE 3 / 3 · LES OS'}
        </p>
        <p className="mt-1 text-[15px] text-[#E8ECFF]">
          <Scissors size={16} className="mr-1 inline text-[#FF8A95]" />
          {etape === 'peau' && 'Touche la peau du bras avec ton scalpel pour l’inciser.'}
          {etape === 'muscles' && (info ? INFOS[info] : 'Retire les muscles un par un : touche chaque muscle rouge.')}
          {etape === 'os' && 'Os, articulation, muscles, tendons : tu as vu tout ce qui permet au bras de bouger.'}
        </p>
      </Carte>

      <div className="relative rounded-3xl border border-white/10 bg-[#070B16]/75">
        <Corps3D
          key={partie}
          className="h-[54vh] max-h-[580px] w-full"
          vue="profil"
          cadrage="bras"
          marge={1.2}
          rotation={etape === 'os'}
          afficher={[...OS, ...MUSCLES_BRAS, ...(etape === 'peau' || opacite > 0 ? ['peau'] : [])]}
          opacitePeau={opacite}
          etats={etats}
          decalages={decalages}
          onChoisir={toucher}
          etiquettes={
            etape === 'os'
              ? [
                  { texte: 'humérus', pivot: 'coude_d', couleur: '#E9DFC6' },
                  { texte: 'épaule', pivot: 'epaule_d', couleur: '#FFD27A' },
                  { texte: 'avant-bras : radius et cubitus', pivot: 'poignet_d', couleur: '#E9DFC6' },
                ]
              : info && etape === 'muscles'
                ? [{ texte: NOMS[info], pivot: 'coude_d', couleur: '#FF8A95' }]
                : []
          }
        />
        <span className="labo-mono absolute right-3 top-3 text-[11px] text-[#8A93B8]">bras droit · devant →</span>
      </div>

      {etape === 'os' && question < QUESTIONS.length && (
        <Carte couleur="rgba(255,138,149,.45)">
          <p className="labo-mono text-[11px] text-[#FF8A95]">
            OBSERVATION {question + 1} / {QUESTIONS.length}
          </p>
          <p className="labo-titre mt-1 text-lg font-bold text-white">{q.q}</p>
          <div className="mt-2 grid gap-2">
            {q.r.map((r, i) => (
              <button
                key={r}
                type="button"
                disabled={reponse !== null}
                onClick={() => {
                  setReponse(i)
                  setTimeout(() => {
                    setReponse(null)
                    setQuestion((n) => n + 1)
                  }, 1300)
                }}
                className="min-h-[48px] rounded-2xl border-2 px-3 text-left text-[15px] font-bold"
                style={{
                  borderColor: reponse === null ? 'rgba(232,236,255,.18)' : i === q.bon ? '#9DFF8A' : reponse === i ? '#FF8A95' : 'rgba(232,236,255,.1)',
                  background: 'rgba(18,26,48,.85)',
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </Carte>
      )}

      {etape === 'os' && question >= QUESTIONS.length && (
        <Carte couleur="rgba(255,138,149,.45)">
          <p className="labo-mono text-[11px] text-[#FF8A95]">ET DANS UNE AILE DE POULET ?</p>
          <p className="mt-1 text-[15px] leading-relaxed text-[#E8ECFF]">
            L’aile d’un oiseau est construite comme ton bras : on y retrouve un humérus, puis un radius et un cubitus, des muscles, et des tendons blancs et brillants qui les accrochent aux os.
          </p>
          <p className="labo-mono mt-3 text-[11px] text-[#FF8A95]">LA VRAIE DISSECTION EN CLASSE</p>
          <ul className="mt-1 space-y-1.5 text-sm text-[#E8ECFF]">
            {[
              'Une aile de poulet crue du commerce, des gants, des ciseaux à bouts ronds, un plateau.',
              'Retirer la peau : observer les muscles (la viande) et leurs fibres.',
              'Tirer doucement sur un muscle : l’aile bouge ! Repérer ses tendons, blancs et brillants.',
              'Repérer l’articulation du « coude » : les os y sont recouverts de cartilage lisse.',
              'Se laver les mains au savon et nettoyer le matériel : la viande crue peut contenir des microbes.',
            ].map((t) => (
              <li key={t} className="flex gap-2">
                <Check size={16} className="mt-0.5 flex-none text-[#9DFF8A]" />
                {t}
              </li>
            ))}
          </ul>
          <Bouton variante="secondaire" className="mt-3 w-full" onClick={recommencer}>
            <RotateCcw size={16} /> Recommencer la dissection
          </Bouton>
        </Carte>
      )}
    </CadreJeu>
  )
}
