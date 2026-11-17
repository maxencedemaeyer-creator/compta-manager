// =============================================================
//  Vocabulaire de base du corps (élèves allophones) :
//  les mots, leur article, la consigne, les traductions, et la
//  position de chaque partie à partir des 33 points MediaPipe Pose.
// =============================================================

// Langues d'aide (traduction affichée à la demande)
export const LANGUES = [
  { id: '', nom: 'Sans aide' },
  { id: 'en', nom: 'English', dir: 'ltr' },
  { id: 'ar', nom: 'العربية', dir: 'rtl' },
  { id: 'uk', nom: 'Українська', dir: 'ltr' },
  { id: 'tr', nom: 'Türkçe', dir: 'ltr' },
  { id: 'es', nom: 'Español', dir: 'ltr' },
  { id: 'pt', nom: 'Português', dir: 'ltr' },
]

// genre : m / f / pl  — article affiché ; consigne « Touche ta tête »
export const MOTS = [
  { id: 'tete', mot: 'tête', article: 'la', genre: 'f', consigne: 'Touche ta tête', tr: { en: 'head', ar: 'رَأْس', uk: 'голова', tr: 'baş', es: 'cabeza', pt: 'cabeça' } },
  { id: 'yeux', mot: 'yeux', article: 'les', genre: 'pl', consigne: 'Montre tes yeux', tr: { en: 'eyes', ar: 'عُيُون', uk: 'очі', tr: 'gözler', es: 'ojos', pt: 'olhos' } },
  { id: 'nez', mot: 'nez', article: 'le', genre: 'm', consigne: 'Touche ton nez', tr: { en: 'nose', ar: 'أَنْف', uk: 'ніс', tr: 'burun', es: 'nariz', pt: 'nariz' } },
  { id: 'bouche', mot: 'bouche', article: 'la', genre: 'f', consigne: 'Touche ta bouche', tr: { en: 'mouth', ar: 'فَم', uk: 'рот', tr: 'ağız', es: 'boca', pt: 'boca' } },
  { id: 'oreille', mot: 'oreille', article: 'l’', genre: 'f', consigne: 'Touche ton oreille', tr: { en: 'ear', ar: 'أُذُن', uk: 'вухо', tr: 'kulak', es: 'oreja', pt: 'orelha' } },
  { id: 'cou', mot: 'cou', article: 'le', genre: 'm', consigne: 'Touche ton cou', tr: { en: 'neck', ar: 'رَقَبَة', uk: 'шия', tr: 'boyun', es: 'cuello', pt: 'pescoço' } },
  { id: 'epaule', mot: 'épaule', article: 'l’', genre: 'f', consigne: 'Touche ton épaule', tr: { en: 'shoulder', ar: 'كَتِف', uk: 'плече', tr: 'omuz', es: 'hombro', pt: 'ombro' } },
  { id: 'bras', mot: 'bras', article: 'le', genre: 'm', consigne: 'Touche ton bras', tr: { en: 'arm', ar: 'ذِرَاع', uk: 'рука', tr: 'kol', es: 'brazo', pt: 'braço' } },
  { id: 'coude', mot: 'coude', article: 'le', genre: 'm', consigne: 'Touche ton coude', tr: { en: 'elbow', ar: 'مِرْفَق', uk: 'лікоть', tr: 'dirsek', es: 'codo', pt: 'cotovelo' } },
  { id: 'main', mot: 'main', article: 'la', genre: 'f', consigne: 'Touche ta main', tr: { en: 'hand', ar: 'يَد', uk: 'кисть руки', tr: 'el', es: 'mano', pt: 'mão' } },
  { id: 'doigt', mot: 'doigt', article: 'le', genre: 'm', consigne: 'Touche un doigt', tr: { en: 'finger', ar: 'إِصْبَع', uk: 'палець', tr: 'parmak', es: 'dedo', pt: 'dedo' } },
  { id: 'ventre', mot: 'ventre', article: 'le', genre: 'm', consigne: 'Touche ton ventre', tr: { en: 'belly', ar: 'بَطْن', uk: 'живіт', tr: 'karın', es: 'barriga', pt: 'barriga' } },
  { id: 'jambe', mot: 'jambe', article: 'la', genre: 'f', consigne: 'Touche ta jambe', tr: { en: 'leg', ar: 'سَاق', uk: 'нога', tr: 'bacak', es: 'pierna', pt: 'perna' } },
  { id: 'genou', mot: 'genou', article: 'le', genre: 'm', consigne: 'Touche ton genou', tr: { en: 'knee', ar: 'رُكْبَة', uk: 'коліно', tr: 'diz', es: 'rodilla', pt: 'joelho' } },
  { id: 'pied', mot: 'pied', article: 'le', genre: 'm', consigne: 'Touche ton pied', tr: { en: 'foot', ar: 'قَدَم', uk: 'стопа', tr: 'ayak', es: 'pie', pt: 'pé' } },
]
export const MOT = Object.fromEntries(MOTS.map((m) => [m.id, m]))

// Couleur de l'article (repère visuel du genre, classique en FLE)
export const COULEUR_GENRE = { m: '#6FB8FF', f: '#FF8AD8', pl: '#9DFF8A' }
export const NOM_GENRE = { m: 'masculin', f: 'féminin', pl: 'pluriel' }
export const avecArticle = (m) => (m.article.endsWith('’') ? `${m.article}${m.mot}` : `${m.article} ${m.mot}`)

// Parties qui demandent de voir tout le corps (reculer)
export const BAS_DU_CORPS = ['jambe', 'genou', 'pied']

// ---------- Voix française (synthèse vocale du navigateur) ----------
let voixFr = null
function chercherVoix() {
  const v = window.speechSynthesis?.getVoices?.() || []
  voixFr = v.find((x) => x.lang === 'fr-FR' && /google|amélie|thomas|audrey/i.test(x.name)) || v.find((x) => x.lang?.startsWith('fr')) || null
}
if (typeof window !== 'undefined' && window.speechSynthesis) {
  chercherVoix()
  window.speechSynthesis.onvoiceschanged = chercherVoix
}
export function parler(texte, vitesse = 0.85) {
  try {
    const s = window.speechSynthesis
    if (!s) return
    s.cancel()
    const u = new SpeechSynthesisUtterance(texte)
    u.lang = 'fr-FR'
    if (voixFr) u.voice = voixFr
    u.rate = vitesse
    s.speak(u)
  } catch {
    /* pas de voix sur cet appareil */
  }
}

// ---------- Position des parties du corps ----------
// L : 33 points déjà en coordonnées écran {x, y, visibility}
// Renvoie { id: [{ x, y, r, cote }] } ; cote = 'g' | 'd' pour les membres
// (une main ne peut pas toucher son propre bras), r = rayon de la zone.
const mil = (a, b, t = 0.5) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, visibility: Math.min(a.visibility ?? 1, b.visibility ?? 1) })
const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
const vu = (p, seuil = 0.5) => (p?.visibility ?? 1) > seuil

export function echelle(L) {
  return Math.max(d(L[7], L[8]), d(L[11], L[12]) * 0.5, 20)
}

export function zones(L) {
  const s = echelle(L)
  const yeux = mil(L[2], L[5])
  const bouche = mil(L[9], L[10])
  const epaules = mil(L[11], L[12])
  const hanches = mil(L[23], L[24])
  const z = {
    tete: [{ ...yeux, y: yeux.y - 0.85 * s, r: 0.55 * s }],
    yeux: [
      { ...L[2], r: 0.3 * s },
      { ...L[5], r: 0.3 * s },
    ],
    nez: [{ ...L[0], r: 0.24 * s }],
    bouche: [{ ...bouche, r: 0.26 * s }],
    oreille: [
      { ...L[7], r: 0.32 * s },
      { ...L[8], r: 0.32 * s },
    ],
    cou: [{ ...mil(epaules, bouche, 0.38), r: 0.36 * s }],
    epaule: [
      { ...L[11], r: 0.42 * s, cote: 'g' },
      { ...L[12], r: 0.42 * s, cote: 'd' },
    ],
    bras: [
      { ...mil(L[11], L[13]), r: 0.42 * s, cote: 'g' },
      { ...mil(L[12], L[14]), r: 0.42 * s, cote: 'd' },
      { ...mil(L[13], L[15]), r: 0.38 * s, cote: 'g' },
      { ...mil(L[14], L[16]), r: 0.38 * s, cote: 'd' },
    ],
    coude: [
      { ...L[13], r: 0.34 * s, cote: 'g' },
      { ...L[14], r: 0.34 * s, cote: 'd' },
    ],
    ventre: [{ ...mil(hanches, epaules, 0.4), r: 0.7 * s }],
    jambe: [
      { ...mil(L[23], L[25]), r: 0.55 * s, cote: 'g' },
      { ...mil(L[24], L[26]), r: 0.55 * s, cote: 'd' },
      { ...mil(L[25], L[27]), r: 0.5 * s, cote: 'g' },
      { ...mil(L[26], L[28]), r: 0.5 * s, cote: 'd' },
    ],
    genou: [
      { ...L[25], r: 0.42 * s, cote: 'g' },
      { ...L[26], r: 0.42 * s, cote: 'd' },
    ],
    pied: [
      { ...mil(L[29], L[31]), r: 0.5 * s, cote: 'g' },
      { ...mil(L[30], L[32]), r: 0.5 * s, cote: 'd' },
    ],
    // pour l'étiquette seulement (A13)
    main: [
      { ...mil(L[15], L[19]), r: 0.4 * s, cote: 'g' },
      { ...mil(L[16], L[20]), r: 0.4 * s, cote: 'd' },
    ],
    doigt: [
      { ...L[19], r: 0.25 * s, cote: 'g' },
      { ...L[20], r: 0.25 * s, cote: 'd' },
    ],
  }
  for (const k of Object.keys(z)) z[k] = z[k].filter((p) => vu(p, 0.35))
  return z
}

// Les points de chaque main (poignet, auriculaire, index, pouce)
const MAINS = { g: [15, 17, 19, 21], d: [16, 18, 20, 22] }

// Quelle partie la main est-elle en train de toucher ? (la plus proche, à l'intérieur de sa zone)
export function partieTouchee(L, z, ids) {
  let meilleur = null
  for (const [cote, idx] of Object.entries(MAINS)) {
    const pts = idx.map((i) => L[i]).filter((p) => vu(p, 0.3))
    if (!pts.length) continue
    for (const id of ids) {
      if (id === 'main' || id === 'doigt') continue
      for (const zone of z[id] || []) {
        if (zone.cote && zone.cote === cote) continue // une main ne touche pas son propre bras
        for (const p of pts) {
          const n = d(p, zone) / zone.r
          if (n <= 1 && (!meilleur || n < meilleur.n)) meilleur = { id, n, zone, main: p }
        }
      }
    }
  }
  return meilleur
}

// « Tape dans tes mains » : les deux poignets se rejoignent devant le corps
export function mainsJointes(L) {
  if (!vu(L[15], 0.3) || !vu(L[16], 0.3)) return null
  const s = echelle(L)
  const ecart = Math.min(d(L[19], L[20]), d(L[15], L[16]))
  return ecart < 0.75 * s ? mil(L[19], L[20]) : null
}
