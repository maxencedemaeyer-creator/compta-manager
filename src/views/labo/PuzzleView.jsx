import { useMemo, useState } from 'react'
import { Bone, RotateCcw } from 'lucide-react'
import CadreJeu, { Bouton, Carte, Eclat, melanger } from '../../components/labo/CadreJeu.jsx'
import Squelette, { NOMS_ARTICULATIONS, NOMS_OS } from '../../components/labo/Squelette.jsx'

// =============================================================
//  A2 · Squelette explosé
//  Niveau 1 : le squelette a explosé, chaque os nommé doit être
//  retrouvé ; touché, il revole à sa place.
//  Niveau 2 : les 6 articulations du référentiel.
//  Attendus 112, 113.
// =============================================================
const OS_JEU = ['crane', 'clavicule', 'cotes', 'sternum', 'vertebres', 'humerus', 'radius', 'cubitus', 'bassin', 'femur', 'rotule', 'tibia', 'perone']

const INDICES = {
  crane: 'Il protège le cerveau.',
  clavicule: 'Elle relie le sternum à l’épaule.',
  cotes: 'Elles forment une cage autour du cœur et des poumons.',
  sternum: 'Les côtes s’y attachent, au milieu de la poitrine.',
  vertebres: 'Empilées, elles forment la colonne vertébrale.',
  humerus: 'Le seul os du bras, entre l’épaule et le coude.',
  radius: 'Os de l’avant-bras, du côté du pouce.',
  cubitus: 'Os de l’avant-bras, du côté du petit doigt.',
  bassin: 'Les fémurs s’y emboîtent.',
  femur: 'L’os le plus long du corps humain.',
  rotule: 'Le petit os rond devant le genou.',
  tibia: 'Le gros os de la jambe, que tu sens sous la peau.',
  perone: 'L’os fin de la jambe, à l’extérieur.',
}

function explosion() {
  const d = {}
  for (const id of [...OS_JEU, 'main', 'pied']) {
    const angle = Math.random() * Math.PI * 2
    const force = 35 + Math.random() * 60
    d[id] = { dx: Math.round(Math.cos(angle) * force), dy: Math.round(Math.sin(angle) * force * 1.3), rot: Math.round(Math.random() * 120 - 60) }
  }
  return d
}

export default function PuzzleView() {
  const [niveau, setNiveau] = useState(1)
  const [partie, setPartie] = useState(0)
  const ordre = useMemo(() => (niveau === 1 ? melanger(OS_JEU) : melanger(Object.keys(NOMS_ARTICULATIONS))), [niveau, partie])
  const [etape, setEtape] = useState(0)
  const [trouves, setTrouves] = useState([])
  const [erreurId, setErreurId] = useState(null)
  const [erreurs, setErreurs] = useState(0)
  const [decalages, setDecalages] = useState(explosion)
  const [eclat, setEclat] = useState({ message: '', cle: 0 })

  const cible = ordre[etape]
  const fini = etape >= ordre.length

  function recommencer(n = niveau) {
    setNiveau(n)
    setPartie((p) => p + 1)
    setEtape(0)
    setTrouves([])
    setErreurs(0)
    setDecalages(n === 1 ? explosion() : {})
  }

  function choisir(id) {
    if (fini) return
    if (id === cible) {
      setTrouves((t) => [...t, id])
      if (niveau === 1) setDecalages((d) => ({ ...d, [id]: undefined }))
      setEtape((e) => e + 1)
      if (etape + 1 >= ordre.length) {
        setDecalages({})
        setEclat((x) => ({ message: niveau === 1 ? 'Squelette remonté !' : 'Articulations validées !', cle: x.cle + 1 }))
      }
    } else if (!trouves.includes(id)) {
      setErreurs((e) => e + 1)
      setErreurId(id)
      setTimeout(() => setErreurId(null), 600)
    }
  }

  const etatsOs = {}
  const etatsArt = {}
  if (niveau === 1) {
    for (const id of trouves) etatsOs[id] = 'ok'
    if (erreurId) etatsOs[erreurId] = 'erreur'
  } else {
    for (const id of trouves) etatsArt[id] = 'ok'
    if (erreurId) etatsArt[erreurId] = 'erreur'
  }

  const noms = niveau === 1 ? NOMS_OS : NOMS_ARTICULATIONS

  return (
    <CadreJeu code="A2" titre="Squelette explosé" attendus={[112, 113]} couleur="#9DFF8A">
      <Eclat message={eclat.message} sousTitre={erreurs === 0 ? 'Sans aucune erreur, bravo !' : `${erreurs} erreur(s)`} cle={eclat.cle} />
      <div className="grid grid-cols-2 gap-2">
        {[1, 2].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => recommencer(n)}
            className={`h-11 rounded-2xl text-sm font-bold ${niveau === n ? 'bg-[#9DFF8A] text-[#06210A]' : 'border border-white/15 bg-[#121A30]/85'}`}
          >
            {n === 1 ? 'Niveau 1 · Les os' : 'Niveau 2 · Articulations'}
          </button>
        ))}
      </div>

      <Carte>
        {fini ? (
          <div className="flex items-center justify-between gap-3">
            <p className="labo-titre text-lg font-bold text-[#9DFF8A]">Terminé · {erreurs} erreur(s)</p>
            <Bouton onClick={() => recommencer()} couleur="#9DFF8A">
              <RotateCcw size={18} /> Rejouer
            </Bouton>
          </div>
        ) : (
          <>
            <p className="labo-mono text-[11px] text-[#9DFF8A]">
              {niveau === 1 ? 'OS' : 'ARTICULATION'} {etape + 1} / {ordre.length} · touche sur le squelette
            </p>
            <p className="labo-titre mt-1 text-2xl font-black text-white">{noms[cible]}</p>
            {niveau === 1 && <p className="mt-1 text-sm text-[#B9C1E3]">Indice : {INDICES[cible]}</p>}
          </>
        )}
      </Carte>

      <div className="relative mx-auto w-full max-w-sm rounded-3xl border border-white/10 bg-[#070B16]/70 p-3">
        <Squelette
          className="mx-auto h-[62vh] max-h-[620px] w-full"
          etats={etatsOs}
          decalages={niveau === 1 ? decalages : {}}
          onOs={niveau === 1 ? choisir : undefined}
          articulations={niveau === 2 ? etatsArt : null}
          onArticulation={niveau === 2 ? choisir : undefined}
        />
        <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-[#8A93B8]">
          <Bone size={13} /> Schéma, vue de face : la droite de la personne est à gauche de l’écran.
        </p>
      </div>
    </CadreJeu>
  )
}
