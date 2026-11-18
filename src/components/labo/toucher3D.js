// =============================================================
//  Toucher un modèle 3D au doigt, avec TOLÉRANCE (tablettes) :
//  si le doigt tombe à côté d'un petit os ou d'un vaisseau fin,
//  on cherche autour du point touché, en cercles de plus en plus
//  larges, et on prend l'objet le plus proche du doigt.
//  Utilisé par Corps3D (A2, A4, A8, Défi…), Membres3D (A9) et
//  Circulation3D (C1, C2, C3…).
// =============================================================
import * as THREE from 'three'

// Un doigt bouge un peu en touchant : au-delà, c'est un glissé (rotation)
export const TOLERANCE_GLISSE = 14

const CERCLES = [9, 18, 28, 40] // pixels autour du doigt

export function toucherTolerant(e, renderer, camera, cibles, raycaster = new THREE.Raycaster()) {
  const r = renderer.domElement.getBoundingClientRect()
  const viser = (dx, dy) => {
    const ndc = new THREE.Vector2(((e.clientX + dx - r.left) / r.width) * 2 - 1, -((e.clientY + dy - r.top) / r.height) * 2 + 1)
    raycaster.setFromCamera(ndc, camera)
    return raycaster.intersectObjects(cibles, false)[0] ?? null
  }
  const direct = viser(0, 0)
  if (direct) return direct
  for (const rayon of CERCLES) {
    // sur chaque cercle, l'objet touché le plus souvent (le plus « sous » le doigt)
    const compte = new Map()
    for (let k = 0; k < 12; k++) {
      const a = (k * Math.PI) / 6
      const hit = viser(Math.cos(a) * rayon, Math.sin(a) * rayon)
      if (!hit) continue
      const c = compte.get(hit.object) ?? { hit, n: 0 }
      c.n++
      compte.set(hit.object, c)
    }
    if (compte.size) return [...compte.values()].sort((a, b) => b.n - a.n)[0].hit
  }
  return null
}
