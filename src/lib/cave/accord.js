import { normaliser, ENTREES, CELEBRES } from './appellations.js'
import { TAGS_STYLES, STYLES } from '../../data/cave/styles.js'

const IDS_STYLES = new Set(STYLES.map((s) => normaliser(s.id)))

// =============================================================
//  Moteur d'accords mets-vins (aucune IA : des règles de dégustation)
//
//  Un « vin » = { style, code, cleRegion, pays, cle (appellation normalisée), cepages }
//  Un plat    = résultat de analyserPlat() : { profil, cats, fav, reg }
//
//  Le score va de 0 à 100. Chaque règle ajoute ou retire des points et laisse une
//  phrase d'explication : on affiche les deux meilleures sous le vin.
// =============================================================

const NIVEAUX = [
  [82, 'Accord excellent'],
  [68, 'Très bon accord'],
  [54, 'Bon accord'],
  [40, 'Accord correct'],
  [0, 'Accord risqué'],
]
export const niveauAccord = (score) => NIVEAUX.find(([seuil]) => score >= seuil)[1]

const LIBELLES_COULEUR = { R: 'rouge', B: 'blanc', P: 'rosé', E: 'effervescent', D: 'doux', F: 'fortifié' }

// Un « favori » du plat (style, couleur, appellation, région ou cépage) correspond-il à ce vin ?
function correspondance(fav, vin) {
  if (fav.startsWith('@')) return vin.code === fav.slice(1) ? 'couleur' : null
  if (TAGS_STYLES.has(fav)) return vin.style.tags.includes(fav) ? 'style' : null
  if (IDS_STYLES.has(fav)) return normaliser(vin.style.id) === fav ? 'idstyle' : null
  if (vin.cle && (vin.cle === fav || vin.cle.startsWith(`${fav} `) || vin.cle.includes(fav))) return 'appellation'
  if (vin.cleRegion && vin.cleRegion.includes(fav)) return 'appellation'
  if (vin.cepages?.some((c) => normaliser(c).includes(fav))) return 'cepage'
  return null
}

export function noterAccord(plat, vin) {
  const P = plat.profil
  const cats = new Set(plat.cats)
  const W = {
    corps: vin.style.corps,
    acid: vin.style.acidite,
    tan: vin.style.tanins,
    sucre: vin.style.sucre,
    boise: vin.style.boise,
    arome: vin.style.arome,
    bulles: vin.style.bulles,
  }
  const couleur = vin.code
  const raisons = []
  const ajouter = (pts, texte) => {
    if (pts) raisons.push({ pts, texte })
  }

  const dessert = cats.has('dessert')
  const rouge = cats.has('vrouge') || cats.has('agneau') || cats.has('gibier')
  const mer = cats.has('poisson') || cats.has('mer')

  // ----- Affinités classiques de la base (le plus fort indice)
  let favPts = 0
  let favTexte = ''
  let favCouleur = false
  const dejaVus = new Set()
  for (const f of plat.fav) {
    const type = correspondance(f, vin)
    if (!type || dejaVus.has(type + f)) continue
    dejaVus.add(type + f)
    if (type === 'appellation') {
      favPts += 18
      favTexte = favTexte || 'Un grand classique avec ce plat'
    } else if (type === 'cepage') {
      favPts += 10
      favTexte = favTexte || 'Un cépage qui s’accorde très bien avec ce plat'
    } else if (type === 'idstyle') {
      favPts += 9
      favTexte = favTexte || 'Le style de vin qu’on sert traditionnellement avec ce plat'
    } else if (type === 'style') {
      favPts += 6
      favTexte = favTexte || 'Le style de vin traditionnellement servi avec ce type de plat'
    } else {
      favPts += 7
      favCouleur = true
      favTexte = favTexte || `Un ${LIBELLES_COULEUR[couleur]} qui va bien avec ce plat`
    }
  }
  favPts = Math.min(26, favPts)
  ajouter(favPts, favTexte)
  const favSucre = plat.fav.includes('@D') || plat.fav.includes('@F')

  // ----- Poids : le vin ne doit ni écraser le plat ni disparaître
  if (!dessert) {
    const ecart = W.corps - P.p
    const d = Math.abs(ecart)
    const pts = d <= 0.5 ? 14 : d <= 1.5 ? 6 : d <= 2.5 ? -5 : d <= 3.5 ? -16 : -26
    if (pts >= 14) ajouter(pts, 'Même poids que le plat : aucun des deux n’écrase l’autre')
    else if (pts >= 6) ajouter(pts, 'Un poids bien assorti au plat')
    else ajouter(pts, ecart > 0 ? 'Un vin trop puissant pour ce plat' : 'Un vin trop léger face à ce plat')
  }

  // ----- Sucre
  if (dessert) {
    const diff = W.sucre - P.s
    if (diff >= 0 && W.sucre >= 3) ajouter(18, 'Plus sucré que le dessert : il en prolonge les saveurs')
    else if (diff >= -1 && W.sucre >= 2) ajouter(4, 'Assez doux pour accompagner le dessert')
    else ajouter(-20, 'Trop sec pour un dessert : il paraîtrait aigre')
    if (W.sucre >= 3 && W.acid >= 4) ajouter(4, 'Son acidité évite que l’ensemble soit écœurant')
    if (P.g >= 3 && W.corps >= 4 && W.sucre >= 3) ajouter(4, 'Assez de corps pour un dessert riche')
  } else if (!favSucre) {
    if (W.sucre >= 3) ajouter(-16, 'Trop sucré pour un plat salé')
    else if (W.sucre === 2) ajouter(-6, 'Un peu sucré pour ce plat')
  }
  if (!dessert && P.s >= 2 && W.sucre >= 1 && W.sucre <= 2) ajouter(7, 'Une pointe de douceur répond au sucré du plat')
  if (!dessert && P.s >= 2 && W.sucre === 0) ajouter(-4, 'Sec face à un plat sucré')

  // ----- Tanins
  const tan = W.tan
  if (tan > 0) {
    if (rouge || (P.g >= 3 && P.p >= 4)) {
      ajouter(tan >= 4 ? 10 : tan === 3 ? 6 : tan === 2 ? 2 : 0, 'Les tanins s’adoucissent avec les protéines et le gras de la viande')
    }
    if (mer) ajouter(-tan * 4.5, 'Les tanins donnent un goût métallique avec le poisson et les fruits de mer')
    if (P.e >= 2) ajouter(-tan * 2.2 * (P.e / 3), 'Les tanins accentuent le piquant')
    if (!rouge && P.u >= 4 && !favSucre) ajouter(-tan * 1.5, 'Les tanins durcissent avec un plat très savoureux')
    if (cats.has('lave') || cats.has('fleuri')) ajouter(-tan * 2.5, 'Les tanins s’entendent mal avec les fromages crémeux')
    if ((cats.has('legume') || cats.has('salade') || cats.has('veggie')) && !rouge && P.g < 3) ajouter(-tan * 2.5, 'Trop tannique pour des légumes')
    if (dessert && W.sucre < 2) ajouter(-6, 'Les tanins durcissent avec le sucre')
    if (cats.has('oeuf') && P.g < 4) ajouter(-tan * 2, 'Les tanins s’associent mal aux œufs')
  }

  // ----- Acidité
  if (P.g >= 3) {
    if (W.acid >= 4) ajouter(8, 'L’acidité coupe le gras et relance l’appétit')
    else if (W.acid <= 2 && !W.bulles) ajouter(-6, 'Pas assez d’acidité pour compenser le gras')
    if (W.bulles) ajouter(6, 'Les bulles dégraissent et rafraîchissent le palais')
  }
  if (P.a >= 2) {
    const diff = W.acid - P.a
    if (diff >= 1) ajouter(6, 'Assez vif pour tenir face à l’acidité du plat')
    else if (diff >= 0) ajouter(3, 'Aussi acide que le plat')
    else ajouter(diff * 4, 'Le plat est plus acide que le vin, qui paraîtrait plat')
  }

  // ----- Épices et piquant
  if (P.e >= 2) {
    if (W.sucre >= 1 && W.sucre <= 2) ajouter(8, 'Le sucre résiduel apaise le piquant')
    else if (W.arome >= 4 && W.sucre === 0) ajouter(5, 'Un vin très aromatique qui résiste aux épices')
    if (W.corps >= 5) ajouter(-8, 'Un vin très alcoolisé attise le piquant')
    if (W.boise >= 3) ajouter(-5, 'Le bois s’entend mal avec les épices')
    if (W.bulles) ajouter(4, 'Les bulles rafraîchissent le piquant')
  }

  // ----- Fumé, grillé
  if (P.f >= 2) {
    if (W.boise >= 2 && W.boise <= 4) ajouter(6, 'Le boisé fait écho aux notes grillées')
    else if (W.corps >= 4) ajouter(3, 'Assez de caractère pour les saveurs grillées')
  }

  // ----- Salé, umami
  if (P.l >= 3 || P.u >= 4) {
    if (W.bulles && P.l >= 3) ajouter(5, 'Les bulles aiment les plats salés')
    if (W.sucre >= 1 && W.sucre <= 3 && P.l >= 3 && !dessert) ajouter(4, 'Le salé et le sucré se répondent')
    if (W.acid >= 4) ajouter(3, 'Une belle fraîcheur face au salé')
  }

  // ----- Amertume
  if (P.m >= 2) {
    if (tan >= 3) ajouter(-tan * 1.5, 'Tanins et amertume s’additionnent')
    if (W.arome >= 3 && W.acid >= 3) ajouter(4, 'Un vin aromatique et vif accompagne bien les saveurs amères')
  }

  // ----- Bulles et couleurs : bon sens de table
  if (W.bulles && P.p >= 4 && rouge) ajouter(-10, 'Pas assez de poids pour une viande rouge')
  if ((couleur === 'B' || couleur === 'P' || couleur === 'E') && rouge && !favCouleur) ajouter(-5, 'Un blanc ou un rosé a du mal avec une viande rouge')
  if (couleur === 'P') ajouter(2, 'Le rosé s’accorde avec presque tout')

  // ----- Région d'origine du plat
  const paysPlat = plat.reg.filter((r) => r === 'fr' || r === 'it')
  const regionsPlat = plat.reg.filter((r) => r !== 'fr' && r !== 'it')
  const regionOk = regionsPlat.some((r) => vin.cleRegion?.includes(r))
  if (regionOk) ajouter(7, 'Un vin de la même région que le plat : ce qui pousse ensemble va ensemble')
  else if (paysPlat.includes((vin.pays || '').toLowerCase())) ajouter(3, 'Un vin du même pays que le plat')

  const brut = 42 + raisons.reduce((s, r) => s + r.pts, 0)
  const score = Math.max(0, Math.min(100, Math.round(brut)))
  const positives = raisons.filter((r) => r.pts >= 4).sort((a, b) => b.pts - a.pts)
  const negatives = raisons.filter((r) => r.pts <= -8).sort((a, b) => a.pts - b.pts)
  return {
    score,
    pourquoi: positives.slice(0, 2).map((r) => r.texte),
    reserve: negatives[0]?.texte || '',
  }
}

// ---------- Budget : paliers qui se chevauchent
export const BUDGETS = [
  { id: 'tous', label: 'Tous', min: 0, max: Infinity },
  { id: '0-10', label: '0–10 €', min: 0, max: 10 },
  { id: '5-15', label: '5–15 €', min: 5, max: 15 },
  { id: '10-20', label: '10–20 €', min: 10, max: 20 },
  { id: '15-25', label: '15–25 €', min: 15, max: 25 },
  { id: '20-30', label: '20–30 €', min: 20, max: 30 },
  { id: '25-35', label: '25–35 €', min: 25, max: 35 },
  { id: '30-40', label: '30–40 €', min: 30, max: 40 },
  { id: '40+', label: '40 € et plus', min: 40, max: Infinity },
]
export const budgetParId = (id) => BUDGETS.find((b) => b.id === id) || BUDGETS[0]

// ---------- Fenêtre de garde
// Renvoie { statut: 'nv' | 'jeune' | 'boire' | 'vite' | 'passe', de, a, texte }
export function statutGarde({ millesime, garde, apogeeDe, apogeeA }, annee = new Date().getFullYear()) {
  const m = Number(millesime)
  if (!m || !garde) return { statut: 'nv', texte: 'Sans millésime' }
  const de = Number(apogeeDe) || m + garde[0]
  const a = Number(apogeeA) || m + garde[1]
  const courte = a - de <= 1
  if (annee < de) return { statut: 'jeune', de, a, texte: `Trop jeune : à partir de ${de}` }
  if (annee > a) return { statut: 'passe', de, a, texte: `Passé son apogée (${a})` }
  if (annee === a || (!courte && annee >= a - 1)) return { statut: 'vite', de, a, texte: `À boire bientôt (avant fin ${a})` }
  return { statut: 'boire', de, a, texte: `À boire (jusqu’en ${a})` }
}

const BONUS_GARDE = { vite: 8, boire: 3, jeune: -14, passe: -6, nv: 0 }
export const bonusGarde = (statut) => BONUS_GARDE[statut] || 0

// ---------- Sélection avec un peu de variété (pas trois fois le même style)
function varier(candidats, n) {
  const restants = [...candidats].sort((a, b) => b.total - a.total)
  const choisis = []
  while (choisis.length < n && restants.length) {
    let meilleur = 0
    let meilleurScore = -Infinity
    restants.forEach((c, i) => {
      let s = c.total
      for (const x of choisis) {
        if (x.vin.style.id === c.vin.style.id) s -= 6
        if (x.vin.cleRegion && x.vin.cleRegion === c.vin.cleRegion) s -= 3
        if (x.cleAppellation && x.cleAppellation === c.cleAppellation) s -= 15
      }
      if (s > meilleurScore) {
        meilleurScore = s
        meilleur = i
      }
    })
    choisis.push(restants.splice(meilleur, 1)[0])
  }
  return choisis
}

// Préférence personnelle d'après les notes données (1 à 5) aux vins déjà bus
export function preferences(historique) {
  const parStyle = {}
  const parAppellation = {}
  const ajouter = (table, cle, note) => {
    if (!cle) return
    table[cle] = table[cle] || { somme: 0, nb: 0 }
    table[cle].somme += note
    table[cle].nb += 1
  }
  for (const h of historique) {
    if (!h.note) continue
    ajouter(parStyle, h.styleId, h.note)
    ajouter(parAppellation, h.appellationId, h.note)
  }
  const bonus = (table, cle, poids) => {
    const t = table[cle]
    if (!t) return 0
    return Math.max(-8, Math.min(8, (t.somme / t.nb - 3) * poids))
  }
  return (styleId, appellationId) => bonus(parStyle, styleId, 2) + bonus(parAppellation, appellationId, 3)
}

// Les meilleurs vins DE LA CAVE pour ce plat
// bouteilles : [{ id, vin, … }] déjà décrites par decrireBouteille() ; renvoie le top n
export function suggererDansLaCave(plat, bouteilles, { n = 3, prefs = () => 0, annee } = {}) {
  const candidats = bouteilles
    .filter((b) => (b.quantite || 0) > 0)
    .map((b) => {
      const accord = noterAccord(plat, b.vin)
      const garde = statutGarde({ millesime: b.millesime, garde: b.garde, apogeeDe: b.apogeeDe, apogeeA: b.apogeeA }, annee)
      const perso = prefs(b.vin.style.id, b.appellationId)
      const total = accord.score + bonusGarde(garde.statut) + perso
      return { ...b, accord, garde, total, cleAppellation: b.appellationId || normaliser(b.appellationLibre) }
    })
  return varier(candidats, n)
}

// Les meilleurs vins À ACHETER (hors cave) dans un budget donné
export function suggererHorsCave(plat, { budget = BUDGETS[0], pays = 'tous', exclus = new Set(), prefs = () => 0, n = 12 } = {}) {
  const candidats = []
  for (const e of ENTREES) {
    if (pays !== 'tous' && e.pays !== pays) continue
    if (e.prix < budget.min || e.prix > budget.max) continue
    if (exclus.has(`${e.appellationId}|${e.code}`)) continue
    const vin = { style: e.style, code: e.code, cleRegion: e.cleRegion, pays: e.pays, cle: normaliser(e.nom), cepages: e.cepages }
    const accord = noterAccord(plat, vin)
    const total = accord.score + prefs(e.style.id, e.appellationId) + (CELEBRES.has(normaliser(e.nom)) ? 3 : 0)
    candidats.push({ entree: e, vin, accord, total, cleAppellation: e.appellationId })
  }
  return varier(candidats, n)
}
