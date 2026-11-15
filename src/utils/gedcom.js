// =============================================================
//  Lecture des fichiers GEDCOM (.ged) — format standard des
//  logiciels de généalogie (Geneanet, Heredis, MyHeritage…)
// =============================================================

// Lit un fichier .ged en texte, en gérant l'UTF-8 et l'ancien encodage Windows.
export async function lireFichierTexte(file) {
  const buffer = await file.arrayBuffer()
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer).replace(/^﻿/, '')
  } catch {
    return new TextDecoder('windows-1252').decode(buffer)
  }
}

// "@I12@" -> "I12" (identifiant utilisable comme id de document Firebase)
export function nettoyerId(xref) {
  return String(xref || '')
    .replace(/@/g, '')
    .replace(/[^A-Za-z0-9_-]/g, '_')
}

// Transforme le texte GEDCOM en arbre de lignes { tag, value, xref, children }
function lignesEnNoeuds(texte) {
  const racines = []
  const pile = []
  const lignes = texte.split(/\r\n|\r|\n/)

  for (const brute of lignes) {
    const m = brute.match(/^\s*(\d+)\s+(?:(@[^@]+@)\s+)?(\S+)(?:\s(.*))?$/)
    if (!m) continue
    const niveau = Number(m[1])
    const noeud = { tag: m[3].toUpperCase(), xref: m[2] || null, value: m[4] ?? '', children: [] }

    // Lignes de continuation de texte
    if ((noeud.tag === 'CONC' || noeud.tag === 'CONT') && pile[niveau - 1]) {
      const parent = pile[niveau - 1]
      parent.value += (noeud.tag === 'CONT' ? '\n' : '') + noeud.value
      continue
    }

    pile.length = niveau
    if (niveau === 0) racines.push(noeud)
    else if (pile[niveau - 1]) pile[niveau - 1].children.push(noeud)
    pile[niveau] = noeud
  }
  return racines
}

const enfant = (noeud, tag) => noeud?.children.find((c) => c.tag === tag)
const enfants = (noeud, tag) => noeud?.children.filter((c) => c.tag === tag) || []
const valeur = (noeud, tag) => enfant(noeud, tag)?.value?.trim() || ''

// ---------- Dates ----------
const MOIS = {
  JAN: 'janvier', FEB: 'février', MAR: 'mars', APR: 'avril', MAY: 'mai', JUN: 'juin',
  JUL: 'juillet', AUG: 'août', SEP: 'septembre', OCT: 'octobre', NOV: 'novembre', DEC: 'décembre',
  // calendrier républicain (rare)
  VEND: 'vendémiaire', BRUM: 'brumaire', FRIM: 'frimaire', NIVO: 'nivôse', PLUV: 'pluviôse',
  VENT: 'ventôse', GERM: 'germinal', FLOR: 'floréal', PRAI: 'prairial', MESS: 'messidor',
  THER: 'thermidor', FRUC: 'fructidor', COMP: 'complémentaire',
}
const PREFIXES = {
  ABT: 'vers', EST: 'vers', CAL: 'vers', BEF: 'avant', AFT: 'après',
  BET: 'entre', AND: 'et', FROM: 'de', TO: 'à', INT: '',
}

export function dateEnFrancais(gedDate) {
  if (!gedDate) return ''
  return gedDate
    .replace(/@#D[^@]*@\s*/g, '')
    .split(/\s+/)
    .map((mot) => {
      const up = mot.toUpperCase()
      if (MOIS[up]) return MOIS[up]
      if (up in PREFIXES) return PREFIXES[up]
      if (mot === '1') return '1er'
      return mot
    })
    .filter(Boolean)
    .join(' ')
}

function anneeDe(gedDate) {
  const m = (gedDate || '').match(/\b(\d{3,4})\b/)
  if (!m) return ''
  const approx = /^(ABT|EST|CAL|BEF|AFT|BET)/i.test(gedDate.trim())
  return (approx ? '~' : '') + m[1]
}

function lireEvenement(noeud) {
  if (!noeud) return null
  const date = valeur(noeud, 'DATE')
  const lieu = valeur(noeud, 'PLAC')
  if (!date && !lieu && noeud.value !== 'Y') return null
  return { date: dateEnFrancais(date), annee: anneeDe(date), lieu }
}

// ---------- Lecture principale ----------
export function parserGedcom(texte) {
  const racines = lignesEnNoeuds(texte)
  const personnes = {}
  const familles = {}

  // Médias déclarés à part (@O1@ OBJE)
  const medias = {}
  for (const r of racines) {
    if (r.tag === 'OBJE' && r.xref) {
      medias[r.xref] = enfants(r, 'FILE').map((f) => f.value.trim()).filter(Boolean)
    }
  }

  function fichiersPhotos(noeud) {
    const fichiers = []
    for (const o of enfants(noeud, 'OBJE')) {
      if (o.value && medias[o.value.trim()]) fichiers.push(...medias[o.value.trim()])
      for (const f of enfants(o, 'FILE')) if (f.value.trim()) fichiers.push(f.value.trim())
    }
    return fichiers
  }

  for (const r of racines) {
    if (r.tag === 'INDI' && r.xref) {
      const id = nettoyerId(r.xref)
      const nameNode = enfant(r, 'NAME')
      const brut = nameNode?.value || ''
      const nomBrut = (brut.match(/\/([^/]*)\//) || [])[1] || ''
      const prenomBrut = brut.replace(/\/[^/]*\//, ' ').replace(/\s+/g, ' ').trim()
      const prenom = valeur(nameNode, 'GIVN') || prenomBrut
      const nom = (valeur(nameNode, 'SURN') || nomBrut).trim()
      const sexe = (valeur(r, 'SEX') || 'U').toUpperCase().charAt(0)

      personnes[id] = {
        id,
        prenom: prenom || '?',
        nom,
        sexe: sexe === 'M' || sexe === 'F' ? sexe : 'U',
        naissance: lireEvenement(enfant(r, 'BIRT')),
        bapteme: lireEvenement(enfant(r, 'BAPM') || enfant(r, 'CHR')),
        deces: lireEvenement(enfant(r, 'DEAT')),
        inhumation: lireEvenement(enfant(r, 'BURI')),
        profession: enfants(r, 'OCCU').map((o) => o.value.trim()).filter(Boolean).join(', '),
        notes: enfants(r, 'NOTE')
          .map((n) => n.value.trim())
          .filter((v) => v && !/^@.*@$/.test(v))
          .join('\n\n'),
        fichiersPhotos: fichiersPhotos(r),
        famillesConjoint: enfants(r, 'FAMS').map((f) => nettoyerId(f.value)),
        famillesEnfant: enfants(r, 'FAMC').map((f) => nettoyerId(f.value)),
      }
    }
    if (r.tag === 'FAM' && r.xref) {
      const id = nettoyerId(r.xref)
      familles[id] = {
        id,
        pere: valeur(r, 'HUSB') ? nettoyerId(valeur(r, 'HUSB')) : null,
        mere: valeur(r, 'WIFE') ? nettoyerId(valeur(r, 'WIFE')) : null,
        enfants: enfants(r, 'CHIL').map((c) => nettoyerId(c.value)),
        mariage: lireEvenement(enfant(r, 'MARR')),
        divorce: lireEvenement(enfant(r, 'DIV')),
      }
    }
  }

  // Nettoyage des références vers des personnes / familles absentes
  for (const f of Object.values(familles)) {
    if (f.pere && !personnes[f.pere]) f.pere = null
    if (f.mere && !personnes[f.mere]) f.mere = null
    f.enfants = f.enfants.filter((e) => personnes[e])
  }
  for (const p of Object.values(personnes)) {
    p.famillesConjoint = p.famillesConjoint.filter((f) => familles[f])
    p.famillesEnfant = p.famillesEnfant.filter((f) => familles[f])
  }

  return { personnes, familles }
}

// ---------- Aides de navigation dans l'arbre ----------
export function nomComplet(p) {
  if (!p) return ''
  return [p.prenom, p.nom].filter(Boolean).join(' ')
}

export function dates(p) {
  if (!p) return ''
  const n = p.naissance?.annee || ''
  const d = p.deces?.annee || ''
  if (!n && !d) return ''
  return d ? `${n || '?'} – ${d}` : `° ${n}`
}

export function parents(arbre, id) {
  const p = arbre.personnes[id]
  const fam = p && arbre.familles[p.famillesEnfant[0]]
  return {
    pere: fam?.pere ? arbre.personnes[fam.pere] : null,
    mere: fam?.mere ? arbre.personnes[fam.mere] : null,
  }
}

// Unions d'une personne : [{ famille, conjoint, enfants: [personnes] }]
export function unions(arbre, id) {
  const p = arbre.personnes[id]
  if (!p) return []
  return p.famillesConjoint.map((fid) => {
    const f = arbre.familles[fid]
    const conjointId = f.pere === id ? f.mere : f.pere
    return {
      famille: f,
      conjoint: conjointId ? arbre.personnes[conjointId] : null,
      enfants: f.enfants.map((e) => arbre.personnes[e]).filter(Boolean),
    }
  })
}

export function freresEtSoeurs(arbre, id) {
  const p = arbre.personnes[id]
  const fam = p && arbre.familles[p.famillesEnfant[0]]
  if (!fam) return []
  return fam.enfants.filter((e) => e !== id).map((e) => arbre.personnes[e]).filter(Boolean)
}

// Cherche la personne la plus "centrale" pour démarrer : celle qui a le plus d'ancêtres
export function racineParDefaut(arbre) {
  const ids = Object.keys(arbre.personnes)
  if (ids.length === 0) return null
  let meilleur = ids[0]
  let meilleurScore = -1
  const limite = Math.min(ids.length, 400)
  for (let i = 0; i < limite; i++) {
    const score = compterAncetres(arbre, ids[i], 8)
    if (score > meilleurScore) {
      meilleurScore = score
      meilleur = ids[i]
    }
  }
  return meilleur
}

function compterAncetres(arbre, id, profondeur) {
  if (!id || profondeur === 0) return 0
  const { pere, mere } = parents(arbre, id)
  let n = 0
  if (pere) n += 1 + compterAncetres(arbre, pere.id, profondeur - 1)
  if (mere) n += 1 + compterAncetres(arbre, mere.id, profondeur - 1)
  return n
}

// Pour associer une photo importée à une personne
export function normaliserNomFichier(nom) {
  return String(nom || '')
    .split(/[\\/]/)
    .pop()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\.[a-z0-9]+$/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}
