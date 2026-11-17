// =============================================================
//  Moteur de circuit électrique du labo (vraie physique, loi d'Ohm).
//  Chaque composant a 2 bornes (0 et 1). Chaque borne est un nœud ;
//  fils, interrupteur fermé et métaux sont de très petites
//  résistances. On résout les tensions de tous les nœuds (analyse
//  nodale), puis on en déduit le courant dans chaque élément.
//
//  Ce que le moteur reproduit fidèlement :
//  - court-circuit : la pile débite un courant énorme ;
//  - ampoules en série (plus faibles) / en dérivation (fortes) ;
//  - deux piles en série : 9 V, une ampoule de 4,5 V grille ;
//  - la DEL ne s'allume que dans un sens (borne + à l'anode) ;
//  - le moteur change de sens si on inverse la pile ;
//  - pile usée, ampoule grillée, matériaux conducteurs/isolants.
// =============================================================

// Les bornes : 0 = gauche, 1 = droite (pile : 0 = +, 1 = − ; DEL : 0 = anode +, 1 = cathode −)
export const COMPOSANTS = {
  pile: { nom: 'Pile', nomComplet: 'Pile plate 4,5 V', role: 'générateur', tension: 4.5, resistanceInterne: 0.8 },
  ampoule: { nom: 'Ampoule', nomComplet: 'Ampoule 4,5 V', role: 'récepteur', resistance: 15 },
  del: { nom: 'DEL', nomComplet: 'DEL rouge (avec sa résistance)', role: 'récepteur', seuil: 1.9, resistance: 150 },
  moteur: { nom: 'Moteur', nomComplet: 'Moteur avec hélice', role: 'récepteur', resistance: 9 },
  sonnette: { nom: 'Sonnette', nomComplet: 'Sonnette', role: 'récepteur', resistance: 30 },
  interrupteur: { nom: 'Interrupteur', nomComplet: 'Interrupteur à levier', role: 'interrupteur' },
  poussoir: { nom: 'Bouton-poussoir', nomComplet: 'Bouton-poussoir', role: 'interrupteur' },
  objet: { nom: 'Objet testé', nomComplet: 'Objet testé', role: 'objet' },
}

// Matériaux (testeur) : résistance en ohms, ou null pour un isolant
export const MATERIAUX = {
  metal: 0.05,
  graphite: 8,
  isolant: null,
}

const R_FIL = 0.02
const R_CONTACT = 0.02
const FUITE = 1e-9
export const SEUIL_COURT_CIRCUIT = 1.5 // ampères débités par une pile
export const SEUIL_GRILLE = 2.2 // puissance d'une ampoule / puissance normale

const P_NOMINALE = (4.5 / (15 + 0.8)) ** 2 * 15 // ampoule seule sur une pile neuve

// composants : [{ id, type, ferme?, presse?, vide?, grillee?, materiau? }]
// fils : [{ id, a: 'idComposant:borne', b }]
export function resoudre(composants, fils) {
  const index = new Map()
  for (const c of composants) {
    for (const b of [0, 1]) index.set(`${c.id}:${b}`, index.size)
  }
  const N = index.size
  const res = { composants: {}, fils: {}, courtCircuit: false, lumiere: 0, actif: false }
  if (!N) return res
  const k = (cle) => index.get(cle)

  // DEL : on cherche l'état (allumée / éteinte) cohérent
  const dels = composants.filter((c) => c.type === 'del')
  const etatDel = Object.fromEntries(dels.map((d) => [d.id, false]))
  let v = null
  for (let essai = 0; essai < 8; essai++) {
    v = resoudreTensions(composants, fils, N, k, etatDel)
    let change = false
    for (const d of dels) {
      const u = v[k(`${d.id}:0`)] - v[k(`${d.id}:1`)]
      const i = (u - COMPOSANTS.del.seuil) / COMPOSANTS.del.resistance
      const allume = etatDel[d.id] ? i > 0 : u > COMPOSANTS.del.seuil
      if (allume !== etatDel[d.id]) {
        etatDel[d.id] = allume
        change = true
      }
    }
    if (!change) break
  }
  const V = (cle) => v[k(cle)] ?? 0

  for (const c of composants) {
    const def = COMPOSANTS[c.type]
    const u = V(`${c.id}:0`) - V(`${c.id}:1`)
    const r = { tension: u, courant: 0 }
    if (c.type === 'pile') {
      const e = c.vide ? 0 : def.tension
      r.courant = (e - u) / def.resistanceInterne // sortant par la borne +
      if (r.courant > SEUIL_COURT_CIRCUIT) {
        r.courtCircuit = true
        res.courtCircuit = true
      }
    } else if (c.type === 'ampoule') {
      if (!c.grillee) {
        r.courant = u / def.resistance
        const p = (r.courant * r.courant * def.resistance) / P_NOMINALE
        r.eclat = p < 0.03 ? 0 : Math.min(1.6, p)
        r.surcharge = p > SEUIL_GRILLE
      } else r.eclat = 0
    } else if (c.type === 'del') {
      r.courant = etatDel[c.id] ? Math.max(0, (u - def.seuil) / def.resistance) : 0
      r.allumee = r.courant > 0.002
      r.eclat = r.allumee ? Math.min(1.2, r.courant / 0.012) : 0
    } else if (c.type === 'moteur') {
      r.courant = u / def.resistance
      r.vitesse = Math.abs(r.courant) > 0.06 ? Math.sign(r.courant) * Math.min(1.6, Math.abs(r.courant) / 0.4) : 0
    } else if (c.type === 'sonnette') {
      r.courant = u / def.resistance
      r.sonne = Math.abs(r.courant) > 0.05
    } else if (estFerme(c)) {
      r.courant = u / resistanceContact(c)
    }
    res.composants[c.id] = r
  }

  for (const f of fils) {
    if (!index.has(f.a) || !index.has(f.b) || f.a === f.b) continue
    const i = (V(f.a) - V(f.b)) / R_FIL // positif : de a vers b (sens conventionnel)
    res.fils[f.id] = { courant: Math.abs(i) < 0.01 ? 0 : i, chauffe: Math.abs(i) > SEUIL_COURT_CIRCUIT }
  }

  // En court-circuit, les récepteurs court-circuités ne reçoivent plus rien
  for (const c of composants) {
    const r = res.composants[c.id]
    if (r.eclat) res.lumiere += c.type === 'del' ? r.eclat * 0.35 : Math.min(1, r.eclat)
    if (r.eclat || r.vitesse || r.sonne) res.actif = true
  }
  res.lumiere = Math.min(1.3, res.lumiere)
  return res
}

const estFerme = (c) =>
  (c.type === 'interrupteur' && c.ferme) || (c.type === 'poussoir' && c.presse) || (c.type === 'objet' && MATERIAUX[c.materiau] != null)

const resistanceContact = (c) => (c.type === 'objet' ? MATERIAUX[c.materiau] : R_CONTACT)

function resoudreTensions(composants, fils, N, k, etatDel) {
  const G = Array.from({ length: N }, () => new Float64Array(N))
  const I = new Float64Array(N)
  const g = (a, b, x) => {
    G[a][a] += x
    G[b][b] += x
    G[a][b] -= x
    G[b][a] -= x
  }
  for (let i = 0; i < N; i++) G[i][i] += FUITE
  for (const c of composants) {
    const a = k(`${c.id}:0`)
    const b = k(`${c.id}:1`)
    const def = COMPOSANTS[c.type]
    if (c.type === 'pile') {
      const gi = 1 / def.resistanceInterne
      const e = c.vide ? 0 : def.tension
      g(a, b, gi)
      I[a] += e * gi
      I[b] -= e * gi
    } else if (c.type === 'ampoule') {
      if (!c.grillee) g(a, b, 1 / def.resistance)
    } else if (c.type === 'del') {
      if (etatDel[c.id]) {
        const gi = 1 / def.resistance
        g(a, b, gi)
        I[a] += def.seuil * gi
        I[b] -= def.seuil * gi
      }
    } else if (c.type === 'moteur' || c.type === 'sonnette') {
      g(a, b, 1 / def.resistance)
    } else if (estFerme(c)) {
      g(a, b, 1 / resistanceContact(c))
    }
  }
  for (const f of fils) {
    const a = k(f.a)
    const b = k(f.b)
    if (a !== undefined && b !== undefined && a !== b) g(a, b, 1 / R_FIL)
  }
  return gauss(G, I)
}

function gauss(A0, b0) {
  const N = b0.length
  const A = A0.map((l) => Float64Array.from(l))
  const b = Float64Array.from(b0)
  for (let c = 0; c < N; c++) {
    let p = c
    for (let i = c + 1; i < N; i++) if (Math.abs(A[i][c]) > Math.abs(A[p][c])) p = i
    ;[A[c], A[p]] = [A[p], A[c]]
    ;[b[c], b[p]] = [b[p], b[c]]
    const piv = A[c][c] || 1e-18
    for (let i = c + 1; i < N; i++) {
      const f = A[i][c] / piv
      if (!f) continue
      for (let j = c; j < N; j++) A[i][j] -= f * A[c][j]
      b[i] -= f * b[c]
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

// ---------- Outils d'analyse ----------
export function fonctionne(res, id) {
  const r = res.composants[id]
  if (!r || res.courtCircuit) return false
  return (r.eclat ?? 0) > 0.08 || Math.abs(r.vitesse ?? 0) > 0.3 || !!r.sonne || !!r.allumee
}

// Le récepteur marche quand on ferme l'interrupteur (ou presse le bouton) et s'arrête quand on l'ouvre
export function commandePar(composants, fils, idCommande, idRecepteur) {
  const avec = (on) => composants.map((c) => (c.id === idCommande ? { ...c, ferme: on, presse: on } : c))
  return fonctionne(resoudre(avec(true), fils), idRecepteur) && !fonctionne(resoudre(avec(false), fils), idRecepteur)
}

// Deux récepteurs qui marchent : sont-ils en série (si l'un est retiré, l'autre s'arrête) ?
export function enSerie(composants, fils, idA, idB) {
  const sans = composants.filter((c) => c.id !== idA)
  const fils2 = fils.filter((f) => !f.a.startsWith(`${idA}:`) && !f.b.startsWith(`${idA}:`))
  return !fonctionne(resoudre(sans, fils2), idB)
}

// Copie du circuit avec un interrupteur / bouton mis dans l'état voulu
export const avecCommande = (composants, id, on) => composants.map((c) => (c.id === id ? { ...c, ferme: on, presse: on } : c))

// Chaque récepteur marche si et seulement si SON interrupteur est fermé,
// quel que soit l'état des autres (paires : [[idInterrupteur, idRecepteur], ...])
export function independants(composants, fils, paires) {
  const n = paires.length
  for (let m = 0; m < 1 << n; m++) {
    let etat = composants
    paires.forEach(([s], k) => (etat = avecCommande(etat, s, !!((m >> k) & 1))))
    const r = resoudre(etat, fils)
    for (let k = 0; k < n; k++) if (fonctionne(r, paires[k][1]) !== !!((m >> k) & 1)) return false
  }
  return true
}

// Les nœuds du circuit : groupes de bornes reliées entre elles par des fils
export function noeuds(composants, fils) {
  const parent = {}
  const trouver = (x) => (parent[x] === x ? x : (parent[x] = trouver(parent[x])))
  for (const c of composants) for (const b of [0, 1]) parent[`${c.id}:${b}`] = `${c.id}:${b}`
  for (const f of fils) if (parent[f.a] !== undefined && parent[f.b] !== undefined) parent[trouver(f.a)] = trouver(f.b)
  const groupes = {}
  for (const k of Object.keys(parent)) (groupes[trouver(k)] ||= []).push(k)
  return new Set(Object.values(groupes).map((g) => g.sort().join('|')))
}

// Deux câblages des mêmes composants sont-ils le même schéma ?
// Les composants non polarisés (ampoule, moteur, sonnette, interrupteurs) peuvent être retournés.
export function memesBranchements(composants, filsEleve, filsModele) {
  const modele = noeuds(composants, filsModele)
  const retournables = composants.filter((c) => !['pile', 'del'].includes(c.type)).map((c) => c.id)
  for (let m = 0; m < 1 << retournables.length; m++) {
    const flip = (cle) => {
      const [id, b] = cle.split(':')
      const k = retournables.indexOf(id)
      return k >= 0 && (m >> k) & 1 ? `${id}:${1 - Number(b)}` : cle
    }
    const eleve = noeuds(
      composants,
      filsEleve.map((f) => ({ ...f, a: flip(f.a), b: flip(f.b) })),
    )
    if (eleve.size === modele.size && [...eleve].every((x) => modele.has(x))) return true
  }
  return false
}
