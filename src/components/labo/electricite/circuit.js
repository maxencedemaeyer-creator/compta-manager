// =============================================================
//  Moteur de circuit électrique du labo (vraie physique, loi d'Ohm).
//  Chaque composant a 2 bornes. Chaque borne est un nœud ; les fils
//  et l'interrupteur fermé sont de très petites résistances. On
//  résout les tensions de tous les nœuds (analyse nodale), puis on
//  en déduit le courant dans chaque fil et chaque récepteur.
//  - Court-circuit : la pile débite un courant énorme (fils qui
//    relient ses bornes sans passer par un récepteur).
//  - Ampoules en série : elles brillent moins (comme en vrai).
// =============================================================

export const COMPOSANTS = {
  pile: { nom: 'Pile 4,5 V', type: 'generateur', tension: 4.5, resistanceInterne: 0.8 },
  ampoule: { nom: 'Ampoule', type: 'recepteur', resistance: 15, puissanceNominale: 4.5 * 4.5 / 15.8 },
  moteur: { nom: 'Moteur', type: 'recepteur', resistance: 9 },
  sonnette: { nom: 'Sonnette', type: 'recepteur', resistance: 30 },
  interrupteur: { nom: 'Interrupteur', type: 'interrupteur' },
}

const R_FIL = 0.02
const R_FERME = 0.02
const FUITE = 1e-9
export const SEUIL_COURT_CIRCUIT = 1.5 // ampères débités par la pile

// composants : [{ id, type, ferme? }], fils : [{ id, a: 'idComposant:borne', b }]
export function resoudre(composants, fils) {
  const noeuds = []
  const index = new Map()
  const n = (cle) => {
    if (!index.has(cle)) {
      index.set(cle, noeuds.length)
      noeuds.push(cle)
    }
    return index.get(cle)
  }
  for (const c of composants) {
    n(`${c.id}:0`)
    n(`${c.id}:1`)
  }
  const N = noeuds.length
  if (N === 0) return vide()
  const G = Array.from({ length: N }, () => new Float64Array(N))
  const I = new Float64Array(N)
  const conductance = (a, b, g) => {
    G[a][a] += g
    G[b][b] += g
    G[a][b] -= g
    G[b][a] -= g
  }
  for (let i = 0; i < N; i++) G[i][i] += FUITE

  for (const c of composants) {
    const a = n(`${c.id}:0`)
    const b = n(`${c.id}:1`)
    const def = COMPOSANTS[c.type]
    if (def.type === 'generateur') {
      // modèle de Norton : borne 0 = +, borne 1 = −
      const g = 1 / def.resistanceInterne
      conductance(a, b, g)
      I[a] += def.tension * g
      I[b] -= def.tension * g
    } else if (def.type === 'recepteur') {
      conductance(a, b, 1 / def.resistance)
    } else if (def.type === 'interrupteur' && c.ferme) {
      conductance(a, b, 1 / R_FERME)
    }
  }
  for (const f of fils) {
    if (index.has(f.a) && index.has(f.b) && f.a !== f.b) conductance(index.get(f.a), index.get(f.b), 1 / R_FIL)
  }

  const v = gauss(G, I)
  const V = (cle) => v[index.get(cle)] ?? 0

  const resultat = { composants: {}, fils: {}, courtCircuit: false, lumiere: 0, actif: false }
  for (const c of composants) {
    const def = COMPOSANTS[c.type]
    const u = V(`${c.id}:0`) - V(`${c.id}:1`)
    let courant = 0
    if (def.type === 'generateur') courant = (def.tension - u) / def.resistanceInterne // sort par la borne +
    else if (def.type === 'recepteur') courant = u / def.resistance
    else if (def.type === 'interrupteur' && c.ferme) courant = u / R_FERME
    const r = { tension: u, courant }
    if (c.type === 'pile' && courant > SEUIL_COURT_CIRCUIT) {
      r.courtCircuit = true
      resultat.courtCircuit = true
    }
    if (c.type === 'ampoule') {
      r.eclat = Math.min(1.3, (courant * courant * def.resistance) / COMPOSANTS.ampoule.puissanceNominale)
      if (r.eclat < 0.04) r.eclat = 0
    }
    if (c.type === 'moteur') r.vitesse = Math.abs(courant) > 0.05 ? Math.sign(courant) * Math.min(1.4, Math.abs(courant) / 0.45) : 0
    if (c.type === 'sonnette') r.sonne = Math.abs(courant) > 0.04
    resultat.composants[c.id] = r
  }
  if (resultat.courtCircuit) {
    // en court-circuit, les récepteurs court-circuités ne fonctionnent plus
    for (const c of composants) {
      const r = resultat.composants[c.id]
      if (Math.abs(r.tension) < 0.5) {
        if ('eclat' in r) r.eclat = 0
        if ('vitesse' in r) r.vitesse = 0
        if ('sonne' in r) r.sonne = false
      }
    }
  }
  for (const f of fils) {
    if (!index.has(f.a) || !index.has(f.b)) continue
    const courant = (V(f.a) - V(f.b)) / R_FIL // positif : de a vers b (sens conventionnel)
    resultat.fils[f.id] = { courant: Math.abs(courant) < 0.005 ? 0 : courant, chauffe: Math.abs(courant) > SEUIL_COURT_CIRCUIT }
  }
  for (const c of composants) {
    const r = resultat.composants[c.id]
    if (r.eclat) resultat.lumiere += r.eclat
    if (r.eclat || r.vitesse || r.sonne) resultat.actif = true
  }
  resultat.lumiere = Math.min(1.4, resultat.lumiere)
  return resultat
}

function vide() {
  return { composants: {}, fils: {}, courtCircuit: false, lumiere: 0, actif: false }
}

function gauss(A0, b0) {
  const N = b0.length
  const A = A0.map((l) => Float64Array.from(l))
  const b = Float64Array.from(b0)
  for (let k = 0; k < N; k++) {
    let p = k
    for (let i = k + 1; i < N; i++) if (Math.abs(A[i][k]) > Math.abs(A[p][k])) p = i
    ;[A[k], A[p]] = [A[p], A[k]]
    ;[b[k], b[p]] = [b[p], b[k]]
    const piv = A[k][k] || 1e-18
    for (let i = k + 1; i < N; i++) {
      const f = A[i][k] / piv
      if (!f) continue
      for (let j = k; j < N; j++) A[i][j] -= f * A[k][j]
      b[i] -= f * b[k]
    }
  }
  const x = new Float64Array(N)
  for (let i = N - 1; i >= 0; i--) {
    let s = b[i]
    for (let j = i + 1; j < N; j++) s -= A[i][j] * x[j]
    x[i] = s / (A[i][i] || 1e-18)
  }
  return x
}

// Le récepteur fonctionne-t-il quand l'interrupteur est fermé, et s'arrête-t-il quand il est ouvert ?
export function commandeParInterrupteur(composants, fils, idInterrupteur, idRecepteur) {
  const avec = (ferme) => composants.map((c) => (c.id === idInterrupteur ? { ...c, ferme } : c))
  const marche = (r) => {
    const x = r.composants[idRecepteur]
    return !r.courtCircuit && !!x && ((x.eclat ?? 0) > 0.3 || Math.abs(x.vitesse ?? 0) > 0.3 || !!x.sonne)
  }
  return marche(resoudre(avec(true), fils)) && !marche(resoudre(avec(false), fils))
}
