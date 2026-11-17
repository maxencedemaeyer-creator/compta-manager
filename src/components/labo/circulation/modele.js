import * as THREE from 'three'
import { gunzipSync } from 'fflate'

// =============================================================
//  Le système circulatoire en 3D : vrai cœur, vraies artères et
//  vraies veines d'un adulte (BodyParts3D 4.0, © Database Center
//  for Life Science, CC BY 4.0), + organes repères et squelette léger.
//  Fichiers : public/labo/circulation/ (créés par
//  scripts/labo/extraire_circulation.py). Chargé une seule fois.
//  Repère : mètres, Y vers le haut, Z vers l'avant,
//  X négatif = côté DROIT de la personne.
// =============================================================
export const CREDIT_CIRCULATION = 'Modèle 3D : BodyParts3D, © The Database Center for Life Science, licence CC BY 4.0'

let promesse = null

export function chargerCirculation() {
  if (promesse) return promesse
  promesse = (async () => {
    const [manifeste, binaire] = await Promise.all([
      fetch('/labo/circulation/circulation.json').then((r) => r.json()),
      fetch('/labo/circulation/circulation-gz.bin').then((r) => r.arrayBuffer()),
    ])
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
      const idx = p.i32 ? new Uint32Array(buffer.slice(p.indices, p.indices + p.nIndices * 4)) : new Uint16Array(buffer.slice(p.indices, p.indices + p.nIndices * 2))
      geo.setIndex(new THREE.BufferAttribute(idx, 1))
      geo.computeVertexNormals()
      geo.computeBoundingBox()
      geo.computeBoundingSphere()
      return { groupe: p.groupe, cote: p.cote, nature: p.nature, geo }
    })
    return { pieces, lignes: manifeste.lignes, points: manifeste.points }
  })()
  promesse.catch(() => {
    promesse = null
  })
  return promesse
}

// Noms en français (vocabulaire du référentiel en premier)
export const NOMS = {
  paroi_ventricules: 'Ventricules (muscle du cœur)',
  paroi_oreillette_d: 'Oreillette droite',
  paroi_oreillette_g: 'Oreillette gauche',
  cavite_ventricule_d: 'Ventricule droit',
  cavite_ventricule_g: 'Ventricule gauche',
  cavite_oreillette_d: 'Oreillette droite',
  cavite_oreillette_g: 'Oreillette gauche',
  valvule_tricuspide: 'Valvule (entre oreillette et ventricule droits)',
  valvule_mitrale: 'Valvule (entre oreillette et ventricule gauches)',
  valvule_pulmonaire: 'Valvule de l’artère pulmonaire',
  valvule_aortique: 'Valvule de l’aorte',
  piliers: 'Piliers qui retiennent les valvules',
  arteres_coeur: 'Artères coronaires (elles nourrissent le cœur)',
  veines_coeur: 'Veines du cœur',
  aorte: 'Aorte',
  tronc_pulmonaire: 'Artère pulmonaire (tronc)',
  arteres_pulmonaires: 'Artère pulmonaire',
  veines_pulmonaires: 'Veine pulmonaire',
  veine_cave_sup: 'Veine cave supérieure',
  veine_cave_inf: 'Veine cave inférieure',
  carotide: 'Artère carotide',
  jugulaire: 'Veine jugulaire',
  tronc_brachiocephalique: 'Artère du bras et du cou (tronc brachiocéphalique)',
  veines_brachiocephaliques: 'Veines brachiocéphaliques',
  sous_claviere_a: 'Artère sous-clavière',
  sous_claviere_v: 'Veine sous-clavière',
  axillaire_a: 'Artère de l’aisselle (axillaire)',
  axillaire_v: 'Veine de l’aisselle (axillaire)',
  artere_humerale: 'Artère humérale',
  artere_radiale: 'Artère radiale (celle du pouls au poignet)',
  artere_cubitale: 'Artère cubitale',
  veine_cephalique: 'Veine céphalique',
  veine_basilique: 'Veine basilique',
  arteres_bras: 'Petites artères du bras et de la main',
  veines_bras: 'Petites veines du bras et de la main',
  arteres_iliaques: 'Artères iliaques',
  veines_iliaques: 'Veines iliaques',
  artere_femorale: 'Artère fémorale',
  veine_femorale: 'Veine fémorale',
  artere_poplitee: 'Artère du genou (poplitée)',
  veine_poplitee: 'Veine du genou (poplitée)',
  veine_saphene: 'Veine saphène',
  arteres_jambe: 'Petites artères de la jambe et du pied',
  veines_jambe: 'Petites veines de la jambe et du pied',
  arteres_reins: 'Artères des reins',
  veines_reins: 'Veines des reins',
  arteres_digestives: 'Artères de l’estomac et de l’intestin',
  veines_digestives: 'Veines de l’intestin et du foie',
  arteres_tete: 'Artères de la tête et du cerveau',
  arteres_tronc: 'Artères du tronc',
  veines_tronc: 'Veines du tronc',
  trachee_bronches: 'Trachée et bronches',
  cerveau: 'Cerveau',
  oesophage: 'Œsophage',
  estomac: 'Estomac',
  intestin_grele: 'Intestin grêle',
  gros_intestin: 'Gros intestin',
  reins: 'Reins',
  muscles_jambe: 'Muscles de la jambe',
  crane: 'Crâne',
  colonne_bassin: 'Colonne vertébrale et bassin',
  cage_thoracique: 'Côtes et sternum',
  os_membres: 'Os des bras et des jambes',
}

// Sang riche en dioxygène (rouge) ou pauvre en dioxygène (bleu) dans chaque vaisseau
export function sangRiche(groupe, nature) {
  if (groupe === 'tronc_pulmonaire' || groupe === 'arteres_pulmonaires') return false
  if (groupe === 'veines_pulmonaires') return true
  if (groupe === 'cavite_ventricule_g' || groupe === 'cavite_oreillette_g') return true
  if (groupe === 'cavite_ventricule_d' || groupe === 'cavite_oreillette_d') return false
  if (nature === 'artere') return true
  if (nature === 'veine') return false
  return null
}

export const ROUGE = '#E8394A'
export const BLEU = '#3D6FF0'

// Grandes « autoroutes » du sang : lignes centrales calculées dans les vrais vaisseaux.
// Chaque trajet est une suite de lignes (inversées si besoin) et de points (cavités, organes).
export const TRAJETS = {
  // Petite circulation : cœur droit → poumons → cœur gauche
  poumons: ['P:oreillette_d', 'P:ventricule_d', 'L:tronc_pulmonaire', 'L:artere_pulmonaire_g', 'P:poumon_g', 'L:veine_pulmonaire_g', 'P:oreillette_g', 'P:ventricule_g'],
  // Départ de la grande circulation : ventricule gauche → aorte
  aorte: ['P:ventricule_g', 'L:aorte_ascendante', 'L:crosse_aorte'],
  cerveau: ['L:carotide_commune', 'L:carotide_interne', 'P:cerveau', 'L:jugulaire_interne', 'L:brachiocephalique_v', 'L:veine_cave_sup', 'P:oreillette_d'],
  bras: ['L:sous_claviere_a', 'L:axillaire_a', 'L:humerale_a', 'L:radiale_a', 'P:main', 'L:radiale_v', 'L:humerale_v', 'L:axillaire_v', 'L:sous_claviere_v', 'L:brachiocephalique_v', 'L:veine_cave_sup', 'P:oreillette_d'],
  jambe: ['L:aorte_descendante', 'L:iliaque_commune_a', 'L:iliaque_externe_a', 'L:femorale_a', 'L:poplitee_a', 'L:tibiale_a', 'P:pied', 'L:tibiale_v', 'L:poplitee_v', 'L:femorale_v', 'L:iliaque_externe_v', 'L:iliaque_commune_v', 'L:veine_cave_inf_bas', 'L:veine_cave_inf_haut', 'P:oreillette_d'],
  intestin: ['L:aorte_descendante@0.62', 'L:mesenterique_a', 'P:intestin', 'L:mesenterique_v', 'L:porte', 'P:foie', 'L:hepatique_v', 'L:veine_cave_inf_haut', 'P:oreillette_d'],
  rein: ['L:aorte_descendante@0.74', 'L:renale_a', 'P:rein_g', 'L:renale_v', 'L:veine_cave_inf_haut', 'P:oreillette_d'],
}

// Index (dans le chemin construit) des points où le sang change : capillaires des organes ou des poumons
export const ORGANES_TRAJET = ['poumon_g', 'cerveau', 'main', 'pied', 'intestin', 'rein_g']

// Construit un chemin continu (liste de points) à partir d'un trajet.
// Chaque ligne est orientée pour partir du point le plus proche de la fin précédente.
// « L:nom@0.6 » : on ne garde que le début de la ligne (jusqu'à 60 % de sa longueur).
export function construireChemin(modele, etapes, depart = null) {
  const pts = []
  const reperes = []
  let dernier = depart ? new THREE.Vector3(...depart) : null
  for (const e of etapes) {
    const [type, reste] = e.split(':')
    const [nom, coupe] = reste.split('@')
    if (type === 'P') {
      const p = modele.points[nom]
      if (!p) continue
      const v = new THREE.Vector3(...p)
      reperes.push({ nom, index: pts.length })
      pts.push(v)
      dernier = v
      continue
    }
    let ligne = (modele.lignes[nom] || []).map((p) => new THREE.Vector3(...p))
    if (!ligne.length) continue
    if (dernier && ligne[0].distanceTo(dernier) > ligne[ligne.length - 1].distanceTo(dernier)) ligne.reverse()
    if (coupe) ligne = ligne.slice(0, Math.max(2, Math.round(ligne.length * Number(coupe))))
    reperes.push({ nom, index: pts.length })
    pts.push(...ligne)
    dernier = ligne[ligne.length - 1]
  }
  return { points: pts, reperes }
}

// Position le long d'un chemin (u de 0 à 1, proportionnel à la distance)
export function longueurs(points) {
  const cumul = [0]
  for (let i = 1; i < points.length; i++) cumul.push(cumul[i - 1] + points[i].distanceTo(points[i - 1]))
  return cumul
}

export function pointSur(points, cumul, u, cible = new THREE.Vector3()) {
  const total = cumul[cumul.length - 1]
  const d = Math.min(total, Math.max(0, u * total))
  let i = 1
  while (i < cumul.length - 1 && cumul[i] < d) i++
  const a = cumul[i - 1]
  const b = cumul[i]
  const k = b > a ? (d - a) / (b - a) : 0
  return cible.copy(points[i - 1]).lerp(points[i], k)
}
