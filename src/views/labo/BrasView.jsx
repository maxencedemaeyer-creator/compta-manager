import { useEffect, useMemo, useState } from 'react'
import { Check, Eye, RotateCcw } from 'lucide-react'
import CadreJeu, { Bouton, Carte, Eclat } from '../../components/labo/CadreJeu.jsx'
import Corps3D from '../../components/labo/Corps3D.jsx'

// =============================================================
//  A3 · Le bras mécanique (vrais os 3D, BodyParts3D)
//  L'élève accroche lui-même les deux tendons d'un muscle sur les
//  os du bras droit (vu de profil), puis contracte le muscle.
//  L'angle du coude est calculé par la géométrie réelle du muscle,
//  la force nécessaire par les moments autour du coude.
//  Attendus 111, 117, 118, 120.
// =============================================================
const MASSE_KG = 1

const NOMS_POINTS = {
  'hum-haut-avant': 'Humérus, en haut, devant',
  'hum-bas-avant': 'Humérus, en bas, devant',
  'hum-haut-arriere': 'Humérus, en haut, derrière',
  'ab-pres': 'Radius, près du coude',
  'ab-milieu': 'Radius, au milieu',
  olecrane: 'Cubitus, pointe du coude',
}

const DEFIS = [
  { id: 'flexion', titre: 'Fais plier le coude (flexion)' },
  { id: 'levier', titre: 'Tiens la bouteille d’1 kg à l’horizontale avec moins de 40 N' },
  { id: 'extension', titre: 'Le bras est plié : fais-le se tendre (extension)' },
]

const v3 = (a) => ({ x: a[0], y: a[1], z: a[2] })

export default function BrasView() {
  const [outils, setOutils] = useState(null)
  const [tendons, setTendons] = useState([])
  const [contraction, setContraction] = useState(0)
  const [reussis, setReussis] = useState([])
  const [vraisMuscles, setVraisMuscles] = useState(false)
  const [eclat, setEclat] = useState({ message: '', sous: '', cle: 0 })

  // Points d'accroche, calculés sur les vrais os à partir des articulations
  const geo = useMemo(() => {
    if (!outils) return null
    const E = outils.pivots.coude_d
    const S = outils.pivots.epaule_d
    const P = outils.pivots.poignet_d
    const u = S.clone().sub(E).normalize()
    const f = P.clone().sub(E).normalize()
    const pt = (base, dir, d, z) => base.clone().addScaledVector(dir, d).add({ x: 0, y: 0, z }).toArray()
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

  // Position d'un point à un angle de flexion donné (rotation autour du coude, plan de profil)
  function position(id, phi) {
    const p = geo.points[id]
    if (p.noeud !== 'coude_d') return v3(p.point)
    const E = v3(geo.E)
    const q = { y: p.point[1] - E.y, z: p.point[2] - E.z }
    const r = (phi * Math.PI) / 180
    return { x: p.point[0], y: E.y + q.y * Math.cos(r) - q.z * Math.sin(r), z: E.z + q.y * Math.sin(r) + q.z * Math.cos(r) }
  }
  const longueur = (a, b, phi) => {
    const p1 = position(a, phi)
    const p2 = position(b, phi)
    return Math.hypot(p1.y - p2.y, p1.z - p2.z)
  }

  const complet = tendons.length === 2 && geo
  const [a, b] = tendons
  const os = (id) => geo?.points[id]?.os
  const coteDe = (id) => geo?.points[id]?.cote
  const memeOs = complet && os(a) === os(b)
  const traverse = complet && !memeOs
  const flechisseur = traverse && coteDe(a) === 1 && coteDe(b) === 1
  const extenseur = traverse && coteDe(a) === -1 && coteDe(b) === -1
  const depart = extenseur ? 115 : 0

  const phi = useMemo(() => {
    if (!complet || !(flechisseur || extenseur)) return depart
    const cible = longueur(a, b, depart) * (1 - 0.3 * contraction)
    let meilleur = depart
    let ecart = Infinity
    for (let p = 0; p <= 145; p += 0.5) {
      const e = Math.abs(longueur(a, b, p) - cible) + Math.abs(p - depart) * 0.00002
      if (e < ecart) {
        ecart = e
        meilleur = p
      }
    }
    return meilleur
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a, b, contraction, complet, flechisseur, extenseur, depart, geo])

  const force = useMemo(() => {
    if (!flechisseur || !geo) return null
    const E = v3(geo.E)
    const p1 = position(a, phi)
    const p2 = position(b, phi)
    const L = Math.hypot(p2.y - p1.y, p2.z - p1.z) || 1
    const levier = Math.abs((p2.z - p1.z) * (p1.y - E.y) - (p1.z - E.z) * (p2.y - p1.y)) / L
    const moment = MASSE_KG * 9.81 * geo.longueur * Math.sin((phi * Math.PI) / 180)
    return levier > 0.002 ? moment / levier : null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a, b, phi, flechisseur, geo])

  function valider(id, sous) {
    if (reussis.includes(id)) return
    setReussis((r) => [...r, id])
    setEclat((x) => ({ message: 'Défi réussi !', sous, cle: x.cle + 1 }))
  }

  useEffect(() => {
    if (contraction === 0) return
    if (flechisseur && phi > 40) valider('flexion', 'Le muscle s’est contracté et a tiré sur le radius : le coude se plie.')
    if (flechisseur && phi >= 85 && force !== null && force < 40)
      valider('levier', 'Tendon accroché plus loin du coude = bras de levier plus grand = moins de force nécessaire.')
    if (extenseur && phi < 25) valider('extension', 'Le muscle de derrière tire sur la pointe du coude : le bras se tend. C’est le rôle du triceps.')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phi, force, contraction])

  function toucher(id) {
    if (!geo?.points[id] || tendons.includes(id)) return
    setContraction(0)
    setTendons((t) => (t.length >= 2 ? [id] : [...t, id]))
  }

  let message = 'Touche un point rose sur un os pour accrocher le premier tendon du muscle.'
  if (tendons.length === 1) message = 'Accroche maintenant le second tendon.'
  if (memeOs) message = 'Le muscle se contracte… mais ses deux tendons sont sur le même os : rien ne bouge ! Il faut deux os différents, de part et d’autre de l’articulation.'
  else if (complet && !flechisseur && !extenseur) message = 'Un tendon devant, un derrière : dans le corps, un muscle reste d’un seul côté de l’articulation. Essaie autrement.'
  else if (flechisseur) message = 'Muscle accroché devant le bras, comme le biceps. Contracte-le !'
  else if (extenseur) message = 'Muscle accroché derrière le bras, comme le triceps. Contracte-le !'

  const marqueurs = geo
    ? [
        ...Object.entries(geo.points).map(([id, p]) => ({
          id,
          point: p.point,
          noeud: p.noeud,
          couleur: tendons.includes(id) ? '#FFFFFF' : '#FF8AD8',
          taille: 0.009,
          pulse: !tendons.includes(id),
        })),
        { id: 'balle', point: geo.balle.point, noeud: geo.balle.noeud, couleur: '#6FEFFF', taille: 0.03, pulse: false },
      ]
    : []

  const tubes = complet
    ? [
        {
          de: geo.points[a],
          a: geo.points[b],
          epaisseur: 0.008 + contraction * 0.012,
          bombe: coteDe(a),
          couleur: contraction > 0.05 ? '#E0313F' : '#B5333F',
        },
      ]
    : []

  return (
    <CadreJeu code="A3" titre="Le bras mécanique" attendus={[111, 117, 118, 120]} couleur="#C9A3FF">
      <Eclat message={eclat.message} sousTitre={eclat.sous} cle={eclat.cle} couleur="#C9A3FF" />

      <Carte couleur="rgba(201,163,255,.4)">
        <p className="labo-mono text-[11px] text-[#C9A3FF]">TES DÉFIS · {reussis.length} / {DEFIS.length}</p>
        <ul className="mt-1.5 space-y-1">
          {DEFIS.map((d) => (
            <li key={d.id} className={`flex items-center gap-2 text-sm ${reussis.includes(d.id) ? 'text-[#9DFF8A]' : 'text-[#DDE2F7]'}`}>
              <span className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border ${reussis.includes(d.id) ? 'border-[#9DFF8A] bg-[#9DFF8A]/20' : 'border-white/25'}`}>
                {reussis.includes(d.id) && <Check size={13} />}
              </span>
              {d.titre}
            </li>
          ))}
        </ul>
      </Carte>

      <div className="relative rounded-3xl border border-white/10 bg-[#070B16]/75">
        <Corps3D
          className="h-[50vh] max-h-[540px] w-full"
          vue="profil"
          cadrage="bras"
          marge={1.35}
          afficher={['omoplate', 'clavicule', 'humerus', 'radius', 'cubitus', 'main', ...(vraisMuscles ? ['biceps', 'triceps'] : [])]}
          etats={vraisMuscles ? { biceps: flechisseur ? 'contracte' : 'attenue', triceps: extenseur ? 'contracte' : 'attenue' } : {}}
          posesInstantanees
          poses={{ coude_d: phi }}
          contractions={vraisMuscles ? { biceps_d: flechisseur ? contraction : 0, triceps_d: extenseur ? contraction : 0 } : {}}
          marqueurs={marqueurs}
          tubes={vraisMuscles ? [] : tubes}
          onMarqueur={toucher}
          onPret={setOutils}
          etiquettes={geo ? [{ texte: '1 kg', ...geo.balle, couleur: '#6FEFFF' }] : []}
        />
        <span className="labo-mono absolute right-3 top-3 text-[11px] text-[#8A93B8]">vue de profil · devant →</span>
      </div>

      <Carte couleur="rgba(201,163,255,.4)">
        <p className="text-[15px] leading-relaxed text-[#E8ECFF]">{message}</p>
        {complet && (
          <p className="mt-2 text-xs text-[#B9C1E3]">
            Tendons : {NOMS_POINTS[a]} → {NOMS_POINTS[b]}
          </p>
        )}
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
        <div className="mt-2 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-2xl bg-[#070B16]/70 p-2">
            <p className="text-[11px] text-[#8A93B8]">Angle du coude</p>
            <p className="labo-mono text-lg text-[#FFD27A]">{Math.round(180 - phi)}°</p>
          </div>
          <div className="rounded-2xl bg-[#070B16]/70 p-2">
            <p className="text-[11px] text-[#8A93B8]">Force du muscle</p>
            <p className="labo-mono text-lg text-[#FF8A95]">{force !== null && phi > 2 ? `${Math.round(force)} N` : '—'}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-[#8A93B8]">10 N, c’est environ le poids d’un objet d’1 kg. Calcul réel : moments autour du coude, sur les vraies longueurs des os.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Bouton variante="secondaire" onClick={() => { setTendons([]); setContraction(0) }}>
            <RotateCcw size={16} /> Décrocher
          </Bouton>
          <Bouton variante="secondaire" onClick={() => setVraisMuscles((v) => !v)}>
            <Eye size={16} /> {vraisMuscles ? 'Mon muscle' : 'Vrais muscles'}
          </Bouton>
        </div>
      </Carte>
    </CadreJeu>
  )
}
