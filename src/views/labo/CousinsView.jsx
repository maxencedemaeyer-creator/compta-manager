import { useMemo, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import CadreJeu, { Bouton, Carte, Eclat, melanger } from '../../components/labo/CadreJeu.jsx'

// =============================================================
//  A9 · Les cousins cachés
//  Le bras humain, l'aile de chauve-souris, la nageoire de baleine
//  et l'aile d'oiseau ont les mêmes os, dans le même ordre
//  (schémas simplifiés des membres antérieurs, vue de dessus).
//  Attendu 112.
// =============================================================
const GROUPES = {
  humerus: { nom: 'Humérus', couleur: '#FFD27A' },
  radius: { nom: 'Radius', couleur: '#9DFF8A' },
  cubitus: { nom: 'Cubitus', couleur: '#6FEFFF' },
  carpes: { nom: 'Os du poignet', couleur: '#FF8AD8' },
  doigts: { nom: 'Os des doigts', couleur: '#C9A3FF' },
}

const L = (x1, y1, x2, y2, w) => ({ x1, y1, x2, y2, w })

const ANIMAUX = {
  humain: {
    nom: 'Humain',
    usage: 'saisir, lancer',
    os: {
      humerus: [L(80, 12, 80, 82, 10)],
      radius: [L(73, 92, 68, 142, 5)],
      cubitus: [L(87, 90, 90, 144, 5)],
      carpes: [L(70, 152, 90, 152, 9)],
      doigts: [L(66, 158, 56, 178, 3), L(56, 178, 50, 192, 3), L(72, 160, 70, 182, 3), L(70, 182, 69, 198, 3), L(79, 160, 79, 184, 3), L(79, 184, 79, 200, 3), L(86, 160, 88, 182, 3), L(88, 182, 89, 197, 3), L(92, 158, 98, 176, 3), L(98, 176, 101, 188, 3)],
    },
  },
  chauvesouris: {
    nom: 'Chauve-souris',
    usage: 'voler',
    os: {
      humerus: [L(18, 70, 56, 84, 8)],
      radius: [L(62, 84, 122, 58, 5)],
      cubitus: [L(62, 92, 84, 84, 2.5)],
      carpes: [L(122, 56, 132, 56, 8)],
      doigts: [L(132, 52, 140, 40, 2.5), L(134, 56, 154, 8, 2.5), L(134, 58, 158, 70, 2.5), L(158, 70, 156, 118, 2), L(132, 60, 138, 110, 2.5), L(138, 110, 128, 160, 2), L(130, 62, 110, 112, 2.5), L(110, 112, 84, 150, 2)],
    },
  },
  baleine: {
    nom: 'Baleine',
    usage: 'nager',
    os: {
      humerus: [L(20, 60, 50, 66, 14)],
      radius: [L(58, 62, 86, 66, 10)],
      cubitus: [L(58, 76, 86, 80, 10)],
      carpes: [L(94, 66, 104, 82, 10)],
      doigts: [L(110, 62, 128, 60, 6), L(132, 60, 146, 60, 5), L(110, 70, 132, 72, 6), L(136, 72, 156, 74, 5), L(110, 80, 130, 84, 6), L(134, 85, 152, 90, 5), L(108, 88, 124, 96, 6), L(128, 98, 140, 104, 5)],
    },
  },
  oiseau: {
    nom: 'Oiseau',
    usage: 'voler',
    os: {
      humerus: [L(16, 84, 62, 72, 8)],
      radius: [L(68, 66, 120, 56, 3.5)],
      cubitus: [L(68, 76, 120, 66, 6)],
      carpes: [L(124, 60, 146, 58, 6)],
      doigts: [L(150, 58, 158, 56, 3), L(140, 54, 144, 46, 2.5)],
    },
  },
}

const DEFIS = melanger(
  Object.keys(ANIMAUX).flatMap((a) => ['humerus', 'radius', 'cubitus'].map((o) => ({ animal: a, os: o })))
).slice(0, 6)

export default function CousinsView() {
  const [actif, setActif] = useState(null)
  const [mode, setMode] = useState('explorer')
  const [etape, setEtape] = useState(0)
  const [score, setScore] = useState(0)
  const [retour, setRetour] = useState(null)
  const [eclat, setEclat] = useState({ message: '', cle: 0 })
  const defis = useMemo(() => DEFIS, [])
  const defi = defis[etape]

  function toucher(animal, os) {
    if (mode === 'explorer') {
      setActif(os)
      return
    }
    if (!defi) return
    const bon = animal === defi.animal && os === defi.os
    setRetour(bon ? 'ok' : 'non')
    setActif(os)
    if (bon) setScore((s) => s + 1)
    setTimeout(() => {
      setRetour(null)
      setActif(null)
      const suivant = etape + 1
      setEtape(suivant)
      if (suivant >= defis.length) setEclat((x) => ({ message: 'Tu vois les cousins !', cle: x.cle + 1 }))
    }, 1000)
  }

  return (
    <CadreJeu code="A9" titre="Les cousins cachés" attendus={[112]} couleur="#9DE7C2" large>
      <Eclat message={eclat.message} cle={eclat.cle} couleur="#9DE7C2" />
      <div className="grid grid-cols-2 gap-2">
        {['explorer', 'defi'].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setEtape(0); setScore(0); setActif(null) }}
            className={`h-11 rounded-2xl text-sm font-bold ${mode === m ? 'bg-[#9DE7C2] text-[#05261A]' : 'border border-white/15 bg-[#121A30]/85'}`}
          >
            {m === 'explorer' ? 'Explorer' : 'Défi'}
          </button>
        ))}
      </div>

      <Carte couleur="rgba(157,231,194,.45)">
        {mode === 'explorer' ? (
          <p className="text-[15px] text-[#E8ECFF]">
            {actif ? (
              <>
                <span className="font-bold" style={{ color: GROUPES[actif].couleur }}>
                  {GROUPES[actif].nom}
                </span>{' '}
                : il est là chez les quatre animaux ! Sa forme change selon l’usage du membre, mais il est toujours à la même place.
              </>
            ) : (
              'Touche un os : il s’allume chez les quatre animaux en même temps.'
            )}
          </p>
        ) : defi ? (
          <>
            <p className="labo-mono text-[11px] text-[#9DE7C2]">
              DÉFI {etape + 1} / {defis.length} · SCORE {score}
            </p>
            <p className="labo-titre mt-1 text-xl font-bold text-white">
              Touche le {GROUPES[defi.os].nom.toLowerCase()} de : {ANIMAUX[defi.animal].nom.toLowerCase()}
            </p>
            {retour && <p className={`mt-1 font-bold ${retour === 'ok' ? 'text-[#9DFF8A]' : 'text-[#FF8A95]'}`}>{retour === 'ok' ? 'Exact !' : 'Raté…'}</p>}
          </>
        ) : (
          <div className="flex items-center justify-between">
            <p className="labo-titre text-lg font-bold text-[#9DE7C2]">
              {score} / {defis.length}
            </p>
            <Bouton couleur="#9DE7C2" onClick={() => { setEtape(0); setScore(0) }}>
              <RotateCcw size={16} /> Rejouer
            </Bouton>
          </div>
        )}
      </Carte>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {Object.entries(ANIMAUX).map(([id, a]) => (
          <div key={id} className="rounded-3xl border border-white/10 bg-[#070B16]/75 p-2">
            <p className="labo-titre text-center text-sm font-bold text-white">{a.nom}</p>
            <p className="text-center text-[11px] text-[#8A93B8]">pour {a.usage}</p>
            <svg viewBox="0 0 170 210" className="w-full" role="img" aria-label={`Os du membre avant : ${a.nom}`}>
              {Object.entries(a.os).map(([groupe, lignes]) => {
                const allume = actif === groupe
                const c = GROUPES[groupe].couleur
                return (
                  <g key={groupe} onClick={() => toucher(id, groupe)} style={{ cursor: 'pointer', filter: allume ? `drop-shadow(0 0 5px ${c})` : 'none' }}>
                    {lignes.map((l, i) => (
                      <g key={i}>
                        <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="transparent" strokeWidth={Math.max(16, l.w + 10)} strokeLinecap="round" />
                        <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={allume || mode === 'explorer' ? c : '#EDE6D1'} strokeOpacity={actif && !allume ? 0.35 : 1} strokeWidth={l.w} strokeLinecap="round" />
                      </g>
                    ))}
                  </g>
                )
              })}
            </svg>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {Object.entries(GROUPES).map(([id, g]) => (
          <span key={id} className="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs text-[#DDE2F7]">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: g.couleur }} /> {g.nom}
          </span>
        ))}
      </div>
      <p className="text-center text-xs text-[#8A93B8]">Schémas simplifiés, pas à la même échelle. Le membre part de l’épaule (à gauche ou en haut).</p>
    </CadreJeu>
  )
}
