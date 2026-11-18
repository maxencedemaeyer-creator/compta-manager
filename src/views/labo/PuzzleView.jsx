import { useMemo, useState } from 'react'
import { Move3d, RotateCcw } from 'lucide-react'
import CadreJeu, { Bouton, Carte, Duo, Eclat, melanger } from '../../components/labo/CadreJeu.jsx'
import Corps3D from '../../components/labo/Corps3D.jsx'
import { NOMS, NOMS_ARTICULATIONS } from '../../components/labo/anatomie.js'

// =============================================================
//  A2 · Squelette explosé (vrai squelette 3D, BodyParts3D)
//  Niveau 1 : le squelette a explosé ; touche l'os demandé, il
//  revole à sa place. Niveau 2 : les 6 articulations.
//  Attendus 112, 113.
// =============================================================
const OS_JEU = ['crane', 'clavicule', 'omoplate', 'cotes', 'sternum', 'vertebres', 'humerus', 'radius', 'cubitus', 'main', 'bassin', 'femur', 'rotule', 'tibia', 'perone', 'pied']
const AFFICHES = [...OS_JEU, 'cartilages', 'disques']

const INDICES = {
  crane: 'La boîte d’os qui protège le cerveau.',
  clavicule: 'L’os horizontal entre le sternum et l’épaule.',
  omoplate: 'L’os plat et triangulaire, derrière l’épaule.',
  cotes: 'Elles forment une cage autour du cœur et des poumons.',
  sternum: 'L’os plat au milieu de la poitrine, où s’attachent les côtes.',
  vertebres: 'Empilées les unes sur les autres : la colonne vertébrale.',
  humerus: 'Le seul os du bras, entre l’épaule et le coude.',
  radius: 'Os de l’avant-bras, du côté du pouce.',
  cubitus: 'Os de l’avant-bras, du côté du petit doigt.',
  main: 'Plus de vingt petits os : le poignet, la paume et les doigts.',
  bassin: 'Les fémurs s’y emboîtent.',
  femur: 'L’os le plus long du corps humain.',
  rotule: 'Le petit os rond devant le genou.',
  tibia: 'Le gros os de la jambe, que tu sens sous la peau.',
  perone: 'L’os fin de la jambe, à l’extérieur.',
  pied: 'Le talon, la voûte et les orteils.',
}

function explosion() {
  const d = {}
  for (const id of AFFICHES) {
    const a = Math.random() * Math.PI * 2
    const f = 0.12 + Math.random() * 0.22
    d[id] = [Math.cos(a) * f, Math.sin(a) * f * 0.9, (Math.random() - 0.5) * 0.3]
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
  const [tourner, setTourner] = useState(false)
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
    if (fini || trouves.includes(id)) return
    if (id === cible) {
      setTrouves((t) => [...t, id])
      if (niveau === 1) setDecalages((d) => ({ ...d, [id]: null, ...(id === 'cotes' ? { cartilages: null } : {}), ...(id === 'vertebres' ? { disques: null } : {}) }))
      setEtape((e) => e + 1)
      if (etape + 1 >= ordre.length) {
        setDecalages({})
        setEclat((x) => ({ message: niveau === 1 ? 'Squelette remonté !' : 'Articulations trouvées !', cle: x.cle + 1 }))
      }
    } else {
      setErreurs((e) => e + 1)
      setErreurId(id)
      setTimeout(() => setErreurId(null), 700)
    }
  }

  const etats = {}
  if (niveau === 1) {
    for (const id of trouves) etats[id] = 'ok'
    if (erreurId) etats[erreurId] = 'erreur'
  }
  const marqueurs =
    niveau === 2
      ? Object.keys(NOMS_ARTICULATIONS).flatMap((j) =>
          ['d', 'g'].map((c) => ({
            id: `${j}_${c}`,
            pivot: `${j}_${c}`,
            couleur: trouves.includes(j) ? '#9DFF8A' : erreurId === j ? '#FF6B7A' : '#FFD27A',
            taille: 0.022,
          }))
        )
      : []

  return (
    <CadreJeu code="A2" titre="Squelette explosé" attendus={[112, 113]} couleur="#9DFF8A" ecran large>
      <Eclat message={eclat.message} sousTitre={erreurs === 0 ? 'Sans aucune erreur, bravo !' : `${erreurs} erreur(s)`} cle={eclat.cle} />
      <Duo
        commandes={
          <>
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
              {niveau === 1 ? 'OS' : 'ARTICULATION'} {etape + 1} / {ordre.length} · touche-le sur le squelette
            </p>
            <p className="labo-titre mt-1 text-2xl font-black text-white">{niveau === 1 ? NOMS[cible] : NOMS_ARTICULATIONS[cible]}</p>
            {niveau === 1 && <p className="mt-1 text-sm text-[#B9C1E3]">Indice : {INDICES[cible]}</p>}
          </>
        )}
      </Carte>

          </>
        }
      >
      <div className="relative rounded-3xl border border-white/10 bg-[#070B16]/70 tab:min-h-0 tab:flex-1">
        <Corps3D
          className="h-[64vh] max-h-[680px] w-full tab:h-full tab:max-h-none"
          afficher={AFFICHES}
          etats={etats}
          decalages={decalages}
          marge={niveau === 1 && !fini ? 1.55 : 1.08}
          rotation={tourner}
          marqueurs={marqueurs}
          onChoisir={niveau === 1 ? (g) => choisir(g === 'cartilages' ? 'cotes' : g === 'disques' ? 'vertebres' : g) : undefined}
          onMarqueur={niveau === 2 ? (id) => choisir(id.split('_')[0]) : undefined}
        />
        <button
          type="button"
          onClick={() => setTourner((t) => !t)}
          className={`absolute left-3 top-3 flex h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-bold ${tourner ? 'bg-[#9DFF8A] text-[#06210A]' : 'border border-white/20 bg-black/50 text-white'}`}
        >
          <Move3d size={16} /> {tourner ? 'Rotation activée' : 'Faire tourner'}
        </button>
      </div>
      <p className="text-center text-xs text-[#8A93B8] tab:hidden">Vrai squelette humain en 3D, vu de face : la droite de la personne est à gauche de l’écran.</p>
      </Duo>
    </CadreJeu>
  )
}
