import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Check, Eye, Lightbulb, RotateCcw, Wand2 } from 'lucide-react'
import CadreJeu, { Bouton, Carte, Eclat } from '../../components/labo/CadreJeu.jsx'
import Corps3D from '../../components/labo/Corps3D.jsx'

// =============================================================
//  A3 · Le bras mécanique (vrais os 3D, BodyParts3D)
//  3 défis, l'un après l'autre, avec 3 indices chacun (et la
//  solution en dernier recours). L'élève accroche les deux tendons
//  d'un muscle sur les os du bras droit (vu de profil), puis
//  contracte le muscle. La force nécessaire est calculée par les
//  moments autour du coude, sur les vraies longueurs des os.
//  Attendus 111, 117, 118, 120.
// =============================================================
const MASSE_KG = 1
const SEUIL_N = 50

const NOMS_POINTS = {
  'hum-haut-avant': 'humérus, en haut, devant',
  'hum-bas-avant': 'humérus, en bas, devant',
  'hum-haut-arriere': 'humérus, en haut, derrière',
  'ab-pres': 'radius, près du coude',
  'ab-milieu': 'radius, au milieu',
  olecrane: 'cubitus, pointe du coude',
}
const ETIQUETTES = {
  'hum-haut-avant': 'A',
  'hum-bas-avant': 'B',
  'hum-haut-arriere': 'C',
  'ab-pres': 'D',
  'ab-milieu': 'E',
  olecrane: 'F',
}

const DEFIS = [
  {
    id: 'flexion',
    titre: 'Fais plier le coude',
    consigne: 'Accroche les deux tendons du muscle, puis contracte-le pour que l’avant-bras monte.',
    indices: [
      'Un muscle doit être accroché à deux os différents : un au-dessus du coude, un en dessous.',
      'Pour faire monter l’avant-bras, le muscle doit passer devant le bras.',
      'Essaie le point A (humérus, en haut, devant) et le point D (radius, près du coude).',
    ],
    solution: ['hum-haut-avant', 'ab-pres'],
    bravo: 'Le muscle s’est contracté et a tiré sur le radius : le coude se plie. C’est le travail du biceps !',
  },
  {
    id: 'levier',
    titre: `Soulève la bouteille avec moins de ${SEUIL_N} N`,
    consigne: 'Monte la bouteille d’1 kg jusqu’à l’horizontale en forçant le moins possible. Regarde la force affichée.',
    indices: [
      'Essaie plusieurs points d’accroche sur le radius et compare la force affichée.',
      'Plus le tendon est accroché loin du coude, moins le muscle doit forcer : c’est l’effet de levier.',
      'Essaie le point A (humérus, en haut, devant) et le point E (radius, au milieu).',
    ],
    solution: ['hum-haut-avant', 'ab-milieu'],
    bravo: 'Tendon accroché plus loin du coude = bras de levier plus grand = moins de force nécessaire.',
  },
  {
    id: 'extension',
    titre: 'Le bras est plié : tends-le',
    consigne: 'Cette fois, le bras commence plié. Trouve comment le muscle peut le tendre.',
    indices: [
      'Un muscle ne peut que tirer. Pour tendre le bras, il faut tirer de l’autre côté.',
      'Le muscle doit passer derrière le bras, et tirer sur la pointe du coude.',
      'Essaie le point C (humérus, en haut, derrière) et le point F (pointe du coude).',
    ],
    solution: ['hum-haut-arriere', 'olecrane'],
    bravo: 'Le muscle de derrière tire sur la pointe du coude : le bras se tend. C’est le rôle du triceps.',
  },
]

export default function BrasView() {
  const [outils, setOutils] = useState(null)
  const [defi, setDefi] = useState(0)
  const [tendons, setTendons] = useState([])
  const [contraction, setContraction] = useState(0)
  const [indices, setIndices] = useState(0)
  const [reussi, setReussi] = useState(false)
  const [vraisMuscles, setVraisMuscles] = useState(false)
  const [eclat, setEclat] = useState({ message: '', sous: '', cle: 0 })

  const d = DEFIS[Math.min(defi, DEFIS.length - 1)]
  const fini = defi >= DEFIS.length

  // Points d'accroche, calculés sur les vrais os à partir des articulations
  const geo = useMemo(() => {
    if (!outils) return null
    const E = outils.pivots.coude_d
    const S = outils.pivots.epaule_d
    const P = outils.pivots.poignet_d
    const u = S.clone().sub(E).normalize()
    const f = P.clone().sub(E).normalize()
    const pt = (base, dir, dist, z) => base.clone().addScaledVector(dir, dist).add({ x: 0, y: 0, z }).toArray()
    return {
      E: E.toArray(),
      longueur: E.distanceTo(P) + 0.08,
      points: {
        'hum-haut-avant': { point: pt(S, u, -0.07, 0.024), noeud: 'epaule_d', os: 'humerus', cote: 1 },
        'hum-bas-avant': { point: pt(E, u, 0.1, 0.022), noeud: 'epaule_d', os: 'humerus', cote: 1 },
        'hum-haut-arriere': { point: pt(S, u, -0.07, -0.026), noeud: 'epaule_d', os: 'humerus', cote: -1 },
        'ab-pres': { point: pt(E, f, 0.045, 0.016), noeud: 'coude_d', os: 'avantbras', cote: 1 },
        'ab-milieu': { point: pt(E, f, 0.13, 0.016), noeud: 'coude_d', os: 'avantbras', cote: 1 },
        olecrane: { point: pt(E, f, -0.022, -0.024), noeud: 'coude_d', os: 'avantbras', cote: -1 },
      },
      balle: { point: pt(P, f, 0.08, 0.035), noeud: 'coude_d' },
    }
  }, [outils])

  const complet = tendons.length === 2 && !!geo
  const [a, b] = tendons
  const info = (id) => geo?.points[id]
  const memeOs = complet && info(a).os === info(b).os
  const traverse = complet && !memeOs
  const flechisseur = traverse && info(a).cote === 1 && info(b).cote === 1
  const extenseur = traverse && info(a).cote === -1 && info(b).cote === -1
  const depart = d.id === 'extension' ? 115 : 0

  // L'angle suit la contraction : un muscle de devant plie, un muscle de derrière tend
  let phi = depart
  if (flechisseur) phi = Math.min(130, depart + 130 * contraction)
  if (extenseur) phi = Math.max(0, depart - depart * contraction)

  // Force du muscle pour tenir la bouteille (moments autour du coude)
  function position(id, angle) {
    const p = geo.points[id]
    if (p.noeud !== 'coude_d') return p.point
    const r = (angle * Math.PI) / 180
    const qy = p.point[1] - geo.E[1]
    const qz = p.point[2] - geo.E[2]
    return [p.point[0], geo.E[1] + qy * Math.cos(r) - qz * Math.sin(r), geo.E[2] + qy * Math.sin(r) + qz * Math.cos(r)]
  }
  let force = null
  if (flechisseur && phi > 2) {
    const p1 = position(a, phi)
    const p2 = position(b, phi)
    const L = Math.hypot(p2[1] - p1[1], p2[2] - p1[2]) || 1
    const levier = Math.abs((p2[2] - p1[2]) * (p1[1] - geo.E[1]) - (p1[2] - geo.E[2]) * (p2[1] - p1[1])) / L
    const moment = MASSE_KG * 9.81 * geo.longueur * Math.sin((Math.min(phi, 90) * Math.PI) / 180)
    force = levier > 0.002 ? moment / levier : null
  }
  // Force à l'horizontale (pour comparer les accroches)
  let forceHorizontale = null
  if (flechisseur) {
    const p1 = position(a, 90)
    const p2 = position(b, 90)
    const L = Math.hypot(p2[1] - p1[1], p2[2] - p1[2]) || 1
    const levier = Math.abs((p2[2] - p1[2]) * (p1[1] - geo.E[1]) - (p1[2] - geo.E[2]) * (p2[1] - p1[1])) / L
    forceHorizontale = levier > 0.002 ? (MASSE_KG * 9.81 * geo.longueur) / levier : null
  }

  useEffect(() => {
    if (reussi || fini || contraction < 0.05) return
    let ok = false
    if (d.id === 'flexion') ok = flechisseur && phi > 60
    if (d.id === 'levier') ok = flechisseur && phi >= 85 && forceHorizontale !== null && forceHorizontale < SEUIL_N
    if (d.id === 'extension') ok = extenseur && phi < 20
    if (ok) {
      setReussi(true)
      setEclat((x) => ({ message: 'Défi réussi !', sous: d.bravo, cle: x.cle + 1 }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phi, contraction, forceHorizontale])

  function toucher(id) {
    if (!geo?.points[id] || tendons.includes(id) || reussi) return
    setContraction(0)
    setTendons((t) => (t.length >= 2 ? [id] : [...t, id]))
  }

  function suivant() {
    setDefi((n) => n + 1)
    setTendons([])
    setContraction(0)
    setIndices(0)
    setReussi(false)
  }

  function solution() {
    setTendons(d.solution)
    setContraction(0)
    setIndices(3)
  }

  // Message selon le montage
  let message = 'Touche un point lettré sur un os pour accrocher le premier tendon.'
  if (tendons.length === 1) message = `Premier tendon accroché sur le ${NOMS_POINTS[a]}. Accroche le second.`
  if (memeOs) message = 'Les deux tendons sont sur le même os : le muscle se contracte… mais rien ne bouge ! Il faut un os au-dessus du coude et un en dessous.'
  else if (complet && !flechisseur && !extenseur) message = 'Un tendon devant, un derrière : dans le corps, un muscle reste d’un seul côté de l’articulation. Change un des deux points.'
  else if (complet && flechisseur && d.id === 'extension') message = 'Ce muscle passe devant : il ne peut que plier le bras, et le bras est déjà plié. Il faut tirer de l’autre côté.'
  else if (complet && extenseur && d.id !== 'extension') message = 'Ce muscle passe derrière : il tend le bras, et le bras est déjà tendu. Il faut tirer de l’autre côté.'
  else if (complet && (flechisseur || extenseur)) message = 'Bon montage ! Fais glisser le curseur pour contracter le muscle.'
  if (d.id === 'levier' && flechisseur && forceHorizontale !== null && !reussi && contraction > 0.6 && forceHorizontale >= SEUIL_N)
    message = `Ce montage demande ${Math.round(forceHorizontale)} N à l’horizontale : trop ! Essaie d’accrocher le tendon ailleurs sur le radius.`

  const marqueurs = geo
    ? [
        ...Object.entries(geo.points).map(([id, p]) => ({
          id,
          point: p.point,
          noeud: p.noeud,
          couleur: tendons.includes(id) ? '#FFFFFF' : '#FF8AD8',
          taille: 0.01,
          pulse: !tendons.includes(id),
        })),
        { id: 'balle', point: geo.balle.point, noeud: geo.balle.noeud, couleur: '#6FEFFF', taille: 0.03, pulse: false },
      ]
    : []
  const etiquettes = geo
    ? [
        ...Object.entries(geo.points).map(([id, p]) => ({ texte: ETIQUETTES[id], point: p.point, noeud: p.noeud, couleur: tendons.includes(id) ? '#FFFFFF' : '#FF8AD8', decalage: true })),
        { texte: '1 kg', ...geo.balle, couleur: '#6FEFFF' },
      ]
    : []
  const tubes = complet ? [{ de: info(a), a: info(b), epaisseur: 0.008 + contraction * 0.012, bombe: info(a).cote, couleur: contraction > 0.05 ? '#E0313F' : '#B5333F' }] : []

  if (fini) {
    return (
      <CadreJeu code="A3" titre="Le bras mécanique" attendus={[111, 117, 118, 120]} couleur="#C9A3FF">
        <Carte couleur="rgba(201,163,255,.5)" className="text-center">
          <p className="labo-titre text-2xl font-black text-[#C9A3FF]">Les 3 défis réussis !</p>
          <p className="mt-2 text-[15px] leading-relaxed text-[#E8ECFF]">
            Un muscle est accroché par ses tendons à deux os différents, de part et d’autre d’une articulation. En se contractant, il tire :
            devant le bras, il plie le coude (biceps) ; derrière, il le tend (triceps).
          </p>
          <Bouton className="mx-auto mt-4" couleur="#C9A3FF" onClick={() => { setDefi(0); setTendons([]); setContraction(0); setIndices(0); setReussi(false) }}>
            <RotateCcw size={18} /> Recommencer
          </Bouton>
        </Carte>
      </CadreJeu>
    )
  }

  return (
    <CadreJeu code="A3" titre="Le bras mécanique" attendus={[111, 117, 118, 120]} couleur="#C9A3FF">
      <Eclat message={eclat.message} sousTitre={eclat.sous} cle={eclat.cle} couleur="#C9A3FF" />

      <div className="flex gap-1.5">
        {DEFIS.map((x, i) => (
          <div key={x.id} className="h-1.5 flex-1 rounded-full" style={{ background: i < defi || (i === defi && reussi) ? '#9DFF8A' : i === defi ? '#C9A3FF' : 'rgba(232,236,255,.15)' }} />
        ))}
      </div>
      <Carte couleur="rgba(201,163,255,.45)">
        <p className="labo-mono text-[11px] text-[#C9A3FF]">
          DÉFI {defi + 1} / {DEFIS.length}
        </p>
        <p className="labo-titre mt-1 text-xl font-bold text-white">{d.titre}</p>
        <p className="mt-1 text-sm text-[#B9C1E3]">{d.consigne}</p>
      </Carte>

      <div className="relative rounded-3xl border border-white/10 bg-[#070B16]/75">
        <Corps3D
          className="h-[46vh] max-h-[500px] w-full"
          vue="profil"
          cadrage="bras"
          marge={1.3}
          afficher={['omoplate', 'clavicule', 'humerus', 'radius', 'cubitus', 'main', ...(vraisMuscles ? ['biceps', 'triceps'] : [])]}
          etats={vraisMuscles ? { biceps: flechisseur ? 'contracte' : 'attenue', triceps: extenseur ? 'contracte' : 'attenue' } : {}}
          poses={{ coude_d: phi }}
          contractions={vraisMuscles ? { biceps_d: flechisseur ? contraction : 0, triceps_d: extenseur ? contraction : 0 } : {}}
          marqueurs={marqueurs}
          tubes={vraisMuscles ? [] : tubes}
          onMarqueur={toucher}
          onPret={setOutils}
          etiquettes={etiquettes}
        />
        <span className="labo-mono absolute right-3 top-3 text-[11px] text-[#8A93B8]">vue de profil · devant →</span>
      </div>

      <Carte couleur={reussi ? 'rgba(157,255,138,.5)' : 'rgba(201,163,255,.4)'}>
        {reussi ? (
          <>
            <p className="labo-titre text-lg font-bold text-[#9DFF8A]">Défi réussi !</p>
            <p className="mt-1 text-[15px] leading-relaxed text-[#E8ECFF]">{d.bravo}</p>
            <Bouton className="mt-3 w-full" couleur="#9DFF8A" onClick={suivant}>
              {defi + 1 < DEFIS.length ? 'Défi suivant' : 'Terminer'} <ArrowRight size={18} />
            </Bouton>
          </>
        ) : (
          <>
            <p className="text-[15px] leading-relaxed text-[#E8ECFF]">{message}</p>
            <label className="mt-3 block">
              <span className="labo-mono text-[11px] text-[#C9A3FF]">CONTRACTER LE MUSCLE · {Math.round(contraction * 100)} %</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={contraction}
                disabled={!complet}
                onChange={(e) => setContraction(Number(e.target.value))}
                className="mt-2 w-full accent-[#C9A3FF]"
              />
            </label>
          </>
        )}
        <div className="mt-2 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-2xl bg-[#070B16]/70 p-2">
            <p className="text-[11px] text-[#8A93B8]">Angle du coude</p>
            <p className="labo-mono text-lg text-[#FFD27A]">{Math.round(180 - phi)}°</p>
          </div>
          <div className="rounded-2xl bg-[#070B16]/70 p-2">
            <p className="text-[11px] text-[#8A93B8]">Force du muscle</p>
            <p className="labo-mono text-lg text-[#FF8A95]">{force !== null ? `${Math.round(force)} N` : '—'}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-[#8A93B8]">10 N, c’est environ le poids d’un objet d’1 kg.</p>
      </Carte>

      {!reussi && (
        <Carte couleur="rgba(255,210,122,.4)">
          <div className="flex items-center justify-between">
            <span className="labo-mono text-[11px] text-[#FFD27A]">INDICES</span>
            <span className="text-xs text-[#8A93B8]">{indices} / 3</span>
          </div>
          {d.indices.slice(0, indices).map((t) => (
            <p key={t} className="mt-1.5 flex gap-2 text-sm text-[#FFE6B0]">
              <Lightbulb size={16} className="mt-0.5 flex-none" /> {t}
            </p>
          ))}
          {indices < 3 ? (
            <button type="button" onClick={() => setIndices((i) => i + 1)} className="mt-2 h-11 w-full rounded-xl border border-dashed border-[#FFD27A]/60 text-sm text-[#FFD27A]">
              Indice {indices + 1}
            </button>
          ) : (
            <button type="button" onClick={solution} className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#FFD27A]/60 text-sm text-[#FFD27A]">
              <Wand2 size={16} /> Accrocher la solution pour moi
            </button>
          )}
        </Carte>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Bouton variante="secondaire" onClick={() => { setTendons([]); setContraction(0) }}>
          <RotateCcw size={16} /> Décrocher
        </Bouton>
        <Bouton variante="secondaire" onClick={() => setVraisMuscles((v) => !v)}>
          <Eye size={16} /> {vraisMuscles ? 'Mon muscle' : 'Vrais muscles'}
        </Bouton>
      </div>
      {reussi && defi === DEFIS.length - 1 && (
        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-[#9DFF8A]">
          <Check size={14} /> Dernier défi réussi
        </p>
      )}
    </CadreJeu>
  )
}
