// =============================================================
//  COMMUNOS — logique du jeu (sans affichage)
//  Carte : src/data/communos-communes.json (Statbel, 565 communes
//  au 01/01/2025). Coordonnées en entiers, 1 unité = data.unite km,
//  anneaux encodés en différences (x0, y0, dx1, dy1, …).
// =============================================================

// Date du jour à Bruxelles, au format AAAA-MM-JJ
export function dateDuJour(maintenant = new Date()) {
  return new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'Europe/Brussels',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(maintenant)
}

// Temps restant avant minuit (heure de Bruxelles), en millisecondes
export function avantMinuit(maintenant = new Date()) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Brussels',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(maintenant)
      .map((x) => [x.type, Number(x.value)])
  )
  return ((23 - p.hour) * 3600 + (59 - p.minute) * 60 + (60 - p.second)) * 1000
}

// Nom sans accents, sans majuscules ni ponctuation, « Saint/Sint » → « st »
export function normaliser(texte) {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’'`´]/g, ' ')
    .replace(/[-–_.,/()]/g, ' ')
    .replace(/\b(sainte|saint|sint|st)\b/g, 'st')
    .replace(/\s+/g, '')
    .trim()
}

// Nom affiché dans la langue de la communauté : néerlandais en Flandre,
// français en Wallonie et à Bruxelles (en cas de doute, le français prime)
export function nom(c) {
  return c.reg === 'Région flamande' && c.nl ? c.nl : c.fr
}

// L'autre nom (s'il est différent), pour l'afficher en petit
export function autreNom(c) {
  const principal = nom(c)
  const autre = principal === c.fr ? c.nl : c.fr
  return autre && autre !== principal ? autre : null
}

// Nom affiché + l'autre langue entre parenthèses
export function nomComplet(c) {
  const autre = autreNom(c)
  return autre ? `${nom(c)} (${autre})` : nom(c)
}

function decoderAnneau(r) {
  const pts = new Array(r.length)
  let x = 0
  let y = 0
  for (let i = 0; i < r.length; i += 2) {
    x += r[i]
    y += r[i + 1]
    pts[i] = x
    pts[i + 1] = y
  }
  return pts
}

function vers_chemin(anneaux, ferme = true) {
  return anneaux
    .map((pts) => {
      let d = `M${pts[0]} ${pts[1]}`
      for (let i = 2; i < pts.length; i += 2) d += ` ${pts[i]} ${pts[i + 1]}`
      return ferme ? d + 'Z' : d
    })
    .join('')
}

// Prépare les données brutes : chemins SVG, boîtes, centres, index de recherche
export function preparerCarte(data) {
  const communes = data.communes.map((c) => {
    const anneaux = c.r.map(decoderAnneau)
    let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity
    let sx = 0, sy = 0, n = 0, aireMax = -1, cx = 0, cy = 0
    for (const pts of anneaux) {
      let aire = 0, ax = 0, ay = 0
      for (let i = 0; i < pts.length; i += 2) {
        const x = pts[i], y = pts[i + 1]
        if (x < minx) minx = x
        if (y < miny) miny = y
        if (x > maxx) maxx = x
        if (y > maxy) maxy = y
        sx += x; sy += y; n++
        const j = (i + 2) % pts.length
        const f = x * pts[j + 1] - pts[j] * y
        aire += f
        ax += (x + pts[j]) * f
        ay += (y + pts[j + 1]) * f
      }
      if (Math.abs(aire) > aireMax && aire !== 0) {
        aireMax = Math.abs(aire)
        cx = ax / (3 * aire)
        cy = ay / (3 * aire)
      }
    }
    if (aireMax <= 0) { cx = sx / n; cy = sy / n }
    return {
      id: c.id,
      fr: c.fr,
      nl: c.nl,
      prov: c.prov,
      reg: c.reg,
      pop: c.pop,
      voisins: new Set(c.v),
      anneaux,
      chemin: vers_chemin(anneaux),
      boite: [minx, miny, maxx, maxy],
      centre: [cx, cy],
      cles: [...new Set([normaliser(c.fr), normaliser(c.nl)])],
    }
  })
  const parId = new Map(communes.map((c) => [c.id, c]))
  return {
    unite: data.unite,
    largeur: data.largeur,
    hauteur: data.hauteur,
    communes,
    parId,
    provinces: vers_chemin(data.provinces.map(decoderAnneau), false),
    pays: vers_chemin(data.pays.map(decoderAnneau), false),
  }
}

// Recherche exacte d'une commune à partir de ce qui est tapé
export function trouverCommune(carte, texte) {
  const k = normaliser(texte)
  if (!k) return null
  return carte.communes.find((c) => c.cles.includes(k)) || null
}

// Suggestions pendant la frappe (commence par > contient)
export function suggestions(carte, texte, exclus = new Set(), max = 6) {
  const k = normaliser(texte)
  if (k.length < 2) return []
  const debut = []
  const dedans = []
  for (const c of carte.communes) {
    if (exclus.has(c.id)) continue
    if (c.cles.some((cle) => cle.startsWith(k))) debut.push(c)
    else if (c.cles.some((cle) => cle.includes(k))) dedans.push(c)
  }
  const tri = (a, b) => nom(a).localeCompare(nom(b), 'fr')
  return [...debut.sort(tri), ...dedans.sort(tri)].slice(0, max)
}

// Distance (au carré) d'un point à un segment
function dist2PointSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax
  const dy = by - ay
  const l2 = dx * dx + dy * dy
  let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0
  t = t < 0 ? 0 : t > 1 ? 1 : t
  const ex = ax + t * dx - px
  const ey = ay + t * dy - py
  return ex * ex + ey * ey
}

function minPointsVersBords(A, B) {
  let best = Infinity
  for (const pa of A) {
    for (let i = 0; i < pa.length; i += 2) {
      const px = pa[i], py = pa[i + 1]
      for (const pb of B) {
        const n = pb.length
        for (let j = 0; j < n; j += 2) {
          const k = (j + 2) % n
          const d = dist2PointSegment(px, py, pb[j], pb[j + 1], pb[k], pb[k + 1])
          if (d < best) best = d
        }
      }
    }
  }
  return best
}

// Distance la plus courte entre les frontières de deux communes, en km
// (0 si elles se touchent)
const cacheDistances = new Map()
export function distanceKm(carte, a, b) {
  if (a.id === b.id || a.voisins.has(b.id)) return 0
  const cle = a.id < b.id ? a.id + b.id : b.id + a.id
  if (cacheDistances.has(cle)) return cacheDistances.get(cle)
  const d2 = Math.min(minPointsVersBords(a.anneaux, b.anneaux), minPointsVersBords(b.anneaux, a.anneaux))
  const km = Math.sqrt(d2) * carte.unite
  cacheDistances.set(cle, km)
  return km
}

// Commune mystère du jour : un ordre mélangé (toujours le même) de toutes
// les communes, parcouru un jour après l'autre depuis le lancement du jeu.
const LANCEMENT = Date.UTC(2026, 10, 16) // 16 novembre 2026

function generateur(graine) {
  let a = graine >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

let ordreMelange = null
export function communeDuJour(carte, date) {
  if (!ordreMelange) {
    const ids = carte.communes.map((c) => c.id).sort()
    const alea = generateur(20260116)
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(alea() * (i + 1))
      ;[ids[i], ids[j]] = [ids[j], ids[i]]
    }
    ordreMelange = ids
  }
  const [a, m, j] = date.split('-').map(Number)
  const jour = Math.round((Date.UTC(a, m - 1, j) - LANCEMENT) / 86400000)
  const n = ordreMelange.length
  return carte.parId.get(ordreMelange[((jour % n) + n) % n])
}

// Couleur « chaleur » : plus c'est proche, plus c'est chaud
const PALETTE = ['#7a0a12', '#b3121f', '#e03c31', '#f26b3a', '#f89a4d', '#fbc777', '#fde4b0', '#fff4de']
function melange(c1, c2, t) {
  const a = parseInt(c1.slice(1), 16)
  const b = parseInt(c2.slice(1), 16)
  const r = Math.round(((a >> 16) & 255) + (((b >> 16) & 255) - ((a >> 16) & 255)) * t)
  const g = Math.round(((a >> 8) & 255) + (((b >> 8) & 255) - ((a >> 8) & 255)) * t)
  const bl = Math.round((a & 255) + ((b & 255) - (a & 255)) * t)
  return `rgb(${r}, ${g}, ${bl})`
}
// echelle = distance (km) considérée comme « très loin » : 200 pour la Belgique,
// plus petite pour une province
export function couleurChaleur(km, echelle = 200) {
  const t = Math.min(1, Math.sqrt(Math.max(0, km) / echelle)) * (PALETTE.length - 1)
  const i = Math.min(PALETTE.length - 2, Math.floor(t))
  return melange(PALETTE[i], PALETTE[i + 1], t - i)
}

export const COULEUR_TROUVEE = '#22c55e'
export const COULEUR_REVELEE = '#a855f7'

export function formatKm(km) {
  if (km === 0) return '0 km'
  if (km < 10) return `${km.toFixed(1).replace('.', ',')} km`
  return `${Math.round(km)} km`
}

// Statistiques à partir des parties enregistrées
export function statistiques(parties, aujourdhui) {
  const finies = parties.filter((p) => p.trouve || p.abandon)
  const gagnees = finies.filter((p) => p.trouve)
  const datesGagnees = new Set(gagnees.map((p) => p.id))

  const jourAvant = (d) => {
    const [a, m, j] = d.split('-').map(Number)
    return new Date(Date.UTC(a, m - 1, j - 1)).toISOString().slice(0, 10)
  }
  let serie = 0
  let d = datesGagnees.has(aujourdhui) ? aujourdhui : jourAvant(aujourdhui)
  while (datesGagnees.has(d)) {
    serie++
    d = jourAvant(d)
  }
  let meilleureSerie = 0
  let courant = 0
  let precedent = null
  for (const date of [...datesGagnees].sort()) {
    courant = precedent && jourAvant(date) === precedent ? courant + 1 : 1
    meilleureSerie = Math.max(meilleureSerie, courant)
    precedent = date
  }
  const essais = gagnees.map((p) => (p.essais || []).length)
  const moyenne = essais.length ? essais.reduce((s, n) => s + n, 0) / essais.length : null
  const record = essais.length ? Math.min(...essais) : null
  const tranches = [
    { label: '1–3', min: 1, max: 3 },
    { label: '4–6', min: 4, max: 6 },
    { label: '7–10', min: 7, max: 10 },
    { label: '11–15', min: 11, max: 15 },
    { label: '16–25', min: 16, max: 25 },
    { label: '26+', min: 26, max: Infinity },
  ].map((t) => ({ ...t, n: essais.filter((e) => e >= t.min && e <= t.max).length }))

  return {
    jouees: finies.length,
    gagnees: gagnees.length,
    pourcentage: finies.length ? Math.round((gagnees.length / finies.length) * 100) : 0,
    serie,
    meilleureSerie,
    moyenne,
    record,
    tranches,
  }
}

// =============================================================
//  Mode « Provinces » (entraînement)
// =============================================================

// « Province de Namur » → « Namur », « Région de Bruxelles-Capitale » → « Bruxelles-Capitale »
export function nomCourtProvince(p) {
  return p.replace(/^Province (de |du |d['’])/, '').replace(/^Région de /, '')
}

export function slugProvince(p) {
  return normaliser(nomCourtProvince(p))
}

// Les 10 provinces + la Région de Bruxelles-Capitale
export function listeProvinces(carte) {
  const parNom = new Map()
  for (const c of carte.communes) {
    if (!parNom.has(c.prov)) parNom.set(c.prov, [])
    parNom.get(c.prov).push(c)
  }
  return [...parNom.entries()]
    .map(([nomProv, communes]) => {
      let a = Infinity, b = Infinity, cc = -Infinity, d = -Infinity
      for (const c of communes) {
        a = Math.min(a, c.boite[0]); b = Math.min(b, c.boite[1])
        cc = Math.max(cc, c.boite[2]); d = Math.max(d, c.boite[3])
      }
      const diagonaleKm = Math.hypot(cc - a, d - b) * carte.unite
      return {
        nom: nomProv,
        court: nomCourtProvince(nomProv),
        slug: slugProvince(nomProv),
        communes,
        ids: new Set(communes.map((c) => c.id)),
        boite: [a, b, cc, d],
        echelle: Math.max(15, diagonaleKm * 0.75),
        chemin: communes.map((c) => c.chemin).join(''),
      }
    })
    .sort((x, y) => x.court.localeCompare(y.court, 'fr'))
}

// Choix d'une commune à trouver : on évite les dernières cibles et on
// favorise les communes jamais trouvées (pour apprendre toute la province)
export function tirerCible(province, partiesProvince) {
  const finies = [...partiesProvince].sort((a, b) => (b.debut || 0) - (a.debut || 0))
  const recentes = new Set(finies.slice(0, Math.min(6, province.communes.length - 1)).map((p) => p.cible))
  const trouvees = new Set(finies.filter((p) => p.trouve).map((p) => p.cible))
  const candidats = province.communes.filter((c) => !recentes.has(c.id))
  const poids = candidats.map((c) => (trouvees.has(c.id) ? 1 : 3))
  let r = Math.random() * poids.reduce((s, x) => s + x, 0)
  for (let i = 0; i < candidats.length; i++) {
    r -= poids[i]
    if (r <= 0) return candidats[i]
  }
  return candidats[candidats.length - 1] || province.communes[0]
}

const NIVEAUX = [
  { min: 95, nom: 'Légende locale', emoji: '👑' },
  { min: 80, nom: 'Expert', emoji: '🏆' },
  { min: 60, nom: 'Connaisseur', emoji: '🎓' },
  { min: 40, nom: 'Habitué', emoji: '🧭' },
  { min: 20, nom: 'Explorateur', emoji: '🥾' },
  { min: 0, nom: 'Touriste', emoji: '📸' },
]
export function niveauConnaissance(score) {
  return NIVEAUX.find((n) => score >= n.min)
}

// Pourcentage de connaissance d'une province (0 à 100) :
//  40 % « communes connues » : communes différentes déjà proposées (tous modes confondus)
//  40 % « rapidité »        : à quel point tu trouves vite (10 dernières parties)
//  20 % « expérience »      : nombre de parties jouées dans la province (max à 15)
export function connaissanceProvince(province, partiesJour, partiesLibres) {
  const N = province.communes.length
  const connues = new Set()
  for (const p of [...partiesJour, ...partiesLibres]) {
    for (const id of p.essais || []) if (province.ids.has(id)) connues.add(id)
  }
  const jouees = partiesLibres
    .filter((p) => p.province === province.nom && (p.trouve || p.abandon))
    .sort((a, b) => (b.debut || 0) - (a.debut || 0))
  const gagnees = jouees.filter((p) => p.trouve)
  const attendu = Math.max(4, N * 0.35)
  const recentes = jouees.slice(0, 10)
  const rapidite = recentes.length
    ? recentes.reduce((s, p) => s + (p.trouve ? Math.min(1, Math.max(0, 1 - ((p.essais || []).length - 1) / attendu)) : 0), 0) /
      recentes.length
    : 0
  const couverture = connues.size / N
  const experience = Math.min(1, jouees.length / 15)
  const score = Math.round(100 * (0.4 * couverture + 0.4 * rapidite + 0.2 * experience))
  const essais = gagnees.map((p) => (p.essais || []).length)
  return {
    score,
    niveau: niveauConnaissance(score),
    couverture,
    rapidite,
    experience,
    connues: connues.size,
    total: N,
    jouees: jouees.length,
    gagnees: gagnees.length,
    moyenne: essais.length ? essais.reduce((s, n) => s + n, 0) / essais.length : null,
    record: essais.length ? Math.min(...essais) : null,
  }
}
