import * as THREE from 'three'
import { gunzipSync } from 'fflate'
import { chargerMedia } from '../../config/medias.js'

// =============================================================
//  Chargement du modèle anatomique réel BodyParts3D 4.0
//  (© Database Center for Life Science, CC BY 4.0) : vrais os et
//  vrais muscles d'un adulte, reconstruits à partir d'IRM.
//  Fichiers : manifeste dans public/labo/anatomie/, binaire sur la branche « medias » (voir src/config/medias.js ; créés par
//  scripts/labo/extraire_anatomie.py). Chargé une seule fois.
// =============================================================
export const CREDIT_ANATOMIE = 'Modèle 3D : BodyParts3D, © The Database Center for Life Science, licence CC BY 4.0'

let promesse = null

export function chargerAnatomie() {
  if (promesse) return promesse
  promesse = (async () => {
    const [manifeste, binaire] = await Promise.all([
      fetch('/labo/anatomie/anatomie.json').then((r) => r.json()),
      chargerMedia('anatomie-gz.bin'),
    ])
    // Le fichier est compressé (gzip) ; si le serveur l'a déjà décompressé, on le prend tel quel
    const octets = new Uint8Array(binaire)
    const brut = octets[0] === 0x1f && octets[1] === 0x8b ? gunzipSync(octets) : octets
    const buffer = brut.buffer.slice(brut.byteOffset, brut.byteOffset + brut.byteLength)
    const { min, max } = manifeste
    const pieces = manifeste.pieces.map((p) => {
      const q = new Int16Array(buffer, p.positions, p.sommets * 3)
      const pos = new Float32Array(p.sommets * 3)
      for (let i = 0; i < pos.length; i++) {
        const k = i % 3
        pos[i] = min[k] + ((q[i] + 32767) / 65534) * (max[k] - min[k])
      }
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      geo.setIndex(new THREE.BufferAttribute(new Uint32Array(buffer.slice(p.indices, p.indices + p.nIndices * 4)), 1))
      geo.computeVertexNormals()
      geo.computeBoundingBox()
      geo.computeBoundingSphere()
      return { groupe: p.groupe, cote: p.cote, geo }
    })
    return { pieces, pivots: calculerPivots(pieces) }
  })()
  promesse.catch(() => {
    promesse = null
  })
  return promesse
}

// Moyenne des sommets proches d'une extrémité d'un os
function bout(geo, haut, marge = 0.025) {
  const p = geo.attributes.position
  const bb = geo.boundingBox
  const seuil = haut ? bb.max.y - marge : bb.min.y + marge
  const s = new THREE.Vector3()
  let n = 0
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i)
    if (haut ? y >= seuil : y <= seuil) {
      s.x += p.getX(i)
      s.y += y
      s.z += p.getZ(i)
      n++
    }
  }
  return n ? s.divideScalar(n) : bb.getCenter(new THREE.Vector3())
}

function calculerPivots(pieces) {
  const trouve = (g, c) => pieces.find((p) => p.groupe === g && p.cote === c)?.geo
  const pivots = {}
  for (const c of ['d', 'g']) {
    const hum = trouve('humerus', c)
    const rad = trouve('radius', c)
    const cub = trouve('cubitus', c)
    const fem = trouve('femur', c)
    const tib = trouve('tibia', c)
    if (hum) {
      pivots[`epaule_${c}`] = bout(hum, true, 0.03)
      pivots[`coude_${c}`] = bout(hum, false, 0.02)
    }
    if (rad && cub) pivots[`poignet_${c}`] = bout(rad, false, 0.015).add(bout(cub, false, 0.015)).multiplyScalar(0.5)
    if (fem) {
      pivots[`hanche_${c}`] = bout(fem, true, 0.03)
      pivots[`genou_${c}`] = bout(fem, false, 0.025)
    }
    if (tib) pivots[`cheville_${c}`] = bout(tib, false, 0.02)
  }
  return pivots
}

// Chaînes articulaires : quel os bouge avec quelle articulation
export const CHAINE = {
  epaule: { parent: null, os: ['humerus'] },
  coude: { parent: 'epaule', os: ['radius', 'cubitus', 'muscles_avant_bras'] },
  poignet: { parent: 'coude', os: ['main'] },
  hanche: { parent: null, os: ['femur'] },
  genou: { parent: 'hanche', os: ['tibia', 'perone', 'rotule'] },
  cheville: { parent: 'genou', os: ['pied'] },
}

// Muscles qui passent par-dessus une articulation : ils se déforment
// entre l'os du dessus (proche) et l'os du dessous (distal)
export const MUSCLES_ARTICULES = {
  biceps: ['epaule', 'coude'],
  triceps: ['epaule', 'coude'],
  brachial: ['epaule', 'coude'],
  quadriceps: ['hanche', 'genou'],
  ischio_jambiers: ['hanche', 'genou'],
  mollet: ['genou', 'cheville'],
  jambier_anterieur: ['genou', 'cheville'],
  tendon_achille: ['genou', 'cheville'],
}

export const NOMS = {
  crane: 'Crâne',
  vertebres: 'Vertèbres',
  cotes: 'Côtes',
  cartilages: 'Cartilages des côtes',
  sternum: 'Sternum',
  clavicule: 'Clavicule',
  omoplate: 'Omoplate',
  humerus: 'Humérus',
  radius: 'Radius',
  cubitus: 'Cubitus',
  main: 'Os de la main',
  bassin: 'Bassin',
  femur: 'Fémur',
  rotule: 'Rotule',
  tibia: 'Tibia',
  perone: 'Péroné',
  pied: 'Os du pied',
  disques: 'Disques entre les vertèbres',
  biceps: 'Biceps',
  triceps: 'Triceps',
  brachial: 'Muscle brachial',
  deltoide: 'Deltoïde',
  muscles_avant_bras: 'Muscles de l’avant-bras',
  quadriceps: 'Quadriceps',
  ischio_jambiers: 'Ischio-jambiers',
  mollet: 'Mollet',
  tendon_achille: 'Tendon d’Achille',
  jambier_anterieur: 'Jambier antérieur',
  peau: 'Peau',
}

export const NOMS_ARTICULATIONS = { epaule: 'Épaule', coude: 'Coude', poignet: 'Poignet', hanche: 'Hanche', genou: 'Genou', cheville: 'Cheville' }

export const OS = ['crane', 'vertebres', 'cotes', 'cartilages', 'sternum', 'clavicule', 'omoplate', 'humerus', 'radius', 'cubitus', 'main', 'bassin', 'femur', 'rotule', 'tibia', 'perone', 'pied', 'disques']
export const MUSCLES = ['biceps', 'triceps', 'brachial', 'deltoide', 'muscles_avant_bras', 'quadriceps', 'ischio_jambiers', 'mollet', 'tendon_achille', 'jambier_anterieur']

// Les 10 os à connaître au minimum (référentiel, attendu 112)
export const OS_REFERENTIEL = ['crane', 'vertebres', 'cotes', 'humerus', 'radius', 'cubitus', 'femur', 'rotule', 'tibia', 'perone']
