import { describe, it, expect } from 'vitest'
import { MOTS_CLES, SUGGESTIONS } from '../../../data/savoirEcrire/motsCles.js'
import { TAGS, TAGS_PAR_ATTENDU } from '../../../data/savoirEcrire/tags.js'
import { CONTRAINTES, FORMES, GABARITS, LONGUEURS, POOLS, THEMES } from '../../../data/savoirEcrire/banque.js'
import { TOUS_LES_ATTENDUS, attendu, chercher, normaliser, parcourir, racine, tagsPour } from '../recherche.js'
import { creerRemplisseur, genererIdee, nombreIdees, relancer, tropProche } from '../generateur.js'

// Hasard reproductible
function graine(n) {
  let a = n
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const ECRIRE = TOUS_LES_ATTENDUS.filter((a) => a.domaine_nom === 'Écrire')
const idsEcrire = new Set(ECRIRE.map((a) => a.id))

describe('données du dictionnaire', () => {
  it('le domaine Écrire compte 99 attendus', () => {
    expect(ECRIRE).toHaveLength(99)
    expect(TOUS_LES_ATTENDUS).toHaveLength(473)
  })

  it('chaque id du dictionnaire est un attendu d’Écrire', () => {
    for (const e of MOTS_CLES) {
      for (const id of [...e.ids, ...e.aussi]) {
        expect(idsEcrire.has(id), `${e.etiquette} : id ${id}`).toBe(true)
      }
      expect(e.mots.length, e.etiquette).toBeGreaterThan(0)
      for (const t of e.tags || []) expect(TAGS[t], `${e.etiquette} : tag ${t}`).toBeTruthy()
    }
  })

  it('chaque attendu d’Écrire est relié à au moins un tag existant', () => {
    for (const a of ECRIRE) {
      const tags = TAGS_PAR_ATTENDU[a.id]
      expect(tags?.length, `attendu ${a.id}`).toBeGreaterThan(0)
      for (const t of tags) expect(TAGS[t], `attendu ${a.id} : tag ${t}`).toBeTruthy()
    }
  })

  it('chaque attendu d’Écrire est trouvable par au moins un mot-clé du dictionnaire', () => {
    const couverts = new Set(MOTS_CLES.flatMap((e) => [...e.ids, ...e.aussi]))
    const orphelins = ECRIRE.filter((a) => !couverts.has(a.id)).map((a) => a.id)
    expect(orphelins).toEqual([])
  })

  it('les suggestions renvoient au moins un résultat', () => {
    for (const s of SUGGESTIONS) {
      expect(chercher(s).resultats.length, s).toBeGreaterThan(0)
    }
  })
})

describe('recherche', () => {
  it('normalise accents, majuscules et ponctuation', () => {
    expect(normaliser('  Phrases BIEN structurées !')).toBe('phrases bien structurees')
    expect(racine('structurees')).toBe(racine('structuree'))
    expect(racine('structure')).toBe(racine('structurees'))
  })

  it('« imparfait » trouve la conjugaison et la cohérence temporelle', () => {
    const { resultats, reconnus } = chercher('imparfait')
    const ids = resultats.map((r) => r.attendu.id)
    expect(reconnus).toContain('Imparfait')
    expect(ids.slice(0, 3)).toEqual(expect.arrayContaining([454, 455, 403]))
    expect(resultats[0].fort).toBe(true)
  })

  it('« imparfait et une phrase correctement écrite » combine les deux demandes', () => {
    const ids = chercher('imparfait et une phrase correctement écrite').resultats.map((r) => r.attendu.id)
    expect(ids).toContain(454)
    expect(ids).toContain(458)
    expect(ids).toContain(456)
  })

  it('« phrases bien claires et bien structurées » trouve la phrase et la structure', () => {
    const ids = chercher('phrases bien claires et bien structurées').resultats.map((r) => r.attendu.id)
    expect(ids).toContain(458)
    expect(ids).toContain(400)
  })

  it('ignore accents et pluriels', () => {
    const a = chercher('Imparfait').resultats.map((r) => r.attendu.id)
    const b = chercher('imparfaits').resultats.map((r) => r.attendu.id)
    expect(b).toEqual(a)
    expect(chercher('accord du participe passé').resultats.slice(0, 2).map((r) => r.attendu.id).sort()).toEqual([438, 447])
  })

  it('reste dans le domaine Écrire par défaut', () => {
    for (const mot of ['imparfait', 'vocabulaire', 'orthographe', 'texte', 'lire']) {
      for (const r of chercher(mot).resultats) expect(r.attendu.domaine_nom).toBe('Écrire')
    }
  })

  it('peut chercher dans tout le programme', () => {
    const domaines = new Set(chercher('vocabulaire', { domaine: 'Tous' }).resultats.map((r) => r.attendu.domaine_nom))
    expect(domaines.size).toBeGreaterThan(1)
  })

  it('respecte le niveau choisi', () => {
    const p5 = chercher('temps composés plus-que-parfait', { niveau: 'P5' }).resultats
    for (const r of p5) expect(['P5', 'P5-P6']).toContain(r.attendu.niveau)
    expect(p5.map((r) => r.attendu.id)).not.toContain(446) // plus-que-parfait : P6 seulement
    const p6 = chercher('temps composés plus-que-parfait', { niveau: 'P6' }).resultats
    expect(p6.map((r) => r.attendu.id)).toContain(446)
  })

  it('ne renvoie rien pour une requête vide ou absurde', () => {
    expect(chercher('').resultats).toEqual([])
    expect(chercher('zzzqqq').resultats).toEqual([])
  })

  it('parcourir regroupe les 99 attendus d’Écrire par sous-catégorie', () => {
    const groupes = parcourir()
    expect(groupes.reduce((s, [, liste]) => s + liste.length, 0)).toBe(99)
  })

  it('tagsPour donne plus de poids aux mots-clés qu’aux attendus cochés', () => {
    const tags = tagsPour({ requete: 'imparfait', attendusIds: [403] })
    expect(tags[0].tag).toBe('imparfait')
    expect(tags[0].poids).toBeGreaterThan(tags.find((t) => t.tag === 'concordance').poids)
  })
})

describe('banque d’idées', () => {
  it('les gabarits sont bien formés', () => {
    const ids = new Set()
    const GENRES = Object.keys(LONGUEURS)
    for (const g of GABARITS) {
      expect(ids.has(g.id), `id en double ${g.id}`).toBe(false)
      ids.add(g.id)
      expect(g.tags.length, g.id).toBeGreaterThan(0)
      for (const t of g.tags) expect(TAGS[t], `${g.id} : tag ${t}`).toBeTruthy()
      for (const genre of g.genre) expect(GENRES, `${g.id} : genre ${genre}`).toContain(genre)
      expect(g.texte.length, g.id).toBeGreaterThan(20)
    }
  })

  it('chaque compétence a de quoi tirer des idées', () => {
    for (const [tag, t] of Object.entries(TAGS)) {
      expect(GABARITS.filter((g) => g.tags.includes(tag)).length, tag).toBeGreaterThanOrEqual(3)
      expect(t.criteres.length, tag).toBeGreaterThanOrEqual(3)
      expect(t.aide.length, tag).toBeGreaterThanOrEqual(1)
      expect(t.contraintes.length, tag).toBeGreaterThanOrEqual(3)
    }
  })

  it('tous les {trous} existent dans les pools', () => {
    const textes = [...GABARITS.map((g) => g.texte), ...CONTRAINTES, ...Object.values(TAGS).flatMap((t) => t.contraintes)]
    for (const texte of textes) {
      for (const [, nom] of texte.matchAll(/\{([a-z_]+)\d?\}/g)) {
        expect(POOLS[nom], `pool inconnu {${nom}} dans « ${texte} »`).toBeTruthy()
      }
    }
  })

  it('grammaire : pas de « de {…} » ni de « à {lieu} » (contractions impossibles)', () => {
    for (const g of GABARITS) {
      expect(g.texte, g.id).not.toMatch(/\b(de|du|des|au|aux)\s*\{/)
      expect(g.texte, g.id).not.toMatch(/\bd’\{/)
      expect(g.texte, g.id).not.toMatch(/\bà \{(lieu|evenement|emotion|science|meteo|epoque)/)
    }
  })

  it('les éléments des pools sont uniques et non vides', () => {
    for (const [nom, liste] of Object.entries(POOLS)) {
      expect(new Set(liste).size, nom).toBe(liste.length)
      expect(liste.length, nom).toBeGreaterThanOrEqual(7)
    }
    expect(new Set(THEMES).size).toBe(THEMES.length)
    expect(new Set(FORMES.map((f) => f.id)).size).toBe(FORMES.length)
    expect(new Set(CONTRAINTES).size).toBe(CONTRAINTES.length)
  })

  it('chaque genre a au moins deux formes compatibles', () => {
    for (const genre of Object.keys(LONGUEURS)) {
      expect(FORMES.filter((f) => f.genres.includes(genre)).length, genre).toBeGreaterThanOrEqual(2)
    }
  })
})

describe('générateur', () => {
  it('le remplisseur ne laisse aucun trou et donne des éléments différents pour {lieu} et {lieu2}', () => {
    for (let i = 0; i < 50; i += 1) {
      const remplir = creerRemplisseur(graine(i))
      const texte = remplir('A {lieu}, B {lieu2}, encore {lieu}, et {trois_mots}')
      expect(texte).not.toMatch(/[{}]/)
      const [a, b, c] = texte.match(/A (.*?), B (.*?), encore (.*?), et/).slice(1)
      expect(a).toBe(c)
      expect(a).not.toBe(b)
    }
  })

  it('imparfait → une consigne sur l’imparfait, une forme, un défi et des critères', () => {
    const tags = tagsPour({ requete: 'imparfait', attendusIds: [454] })
    for (let i = 0; i < 40; i += 1) {
      const idee = genererIdee({ tags, rng: graine(i) })
      expect(idee.sujet.texte).not.toMatch(/[{}]/)
      expect(idee.defi.texte).not.toMatch(/[{}]/)
      expect(idee.forme.nom).toBeTruthy()
      expect(idee.forme.longueur).toMatch(/ligne|réplique/)
      expect(idee.competences[0].tag).toBe('imparfait')
      expect(idee.criteres.length).toBeGreaterThanOrEqual(3)
      expect(idee.aide.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('évite les consignes déjà tirées', () => {
    const tags = tagsPour({ requete: 'imparfait' })
    const vus = []
    for (let i = 0; i < 7; i += 1) {
      const idee = genererIdee({ tags, rng: graine(100 + i), exclure: vus })
      expect(vus).not.toContain(idee.sujet.id)
      vus.push(idee.sujet.id)
    }
  })

  it('P5 n’obtient jamais de consigne réservée au P6', () => {
    const tags = tagsPour({ requete: 'temps composés plus-que-parfait sources' })
    const reservees = new Set(GABARITS.filter((g) => g.niveau === 'P6').map((g) => g.id))
    for (let i = 0; i < 60; i += 1) {
      const idee = genererIdee({ tags, niveau: 'P5', rng: graine(i) })
      expect(reservees.has(idee.sujet.id)).toBe(false)
    }
  })

  it('sans compétence reconnue : un thème libre', () => {
    const idee = genererIdee({ tags: [], rng: graine(3) })
    expect(idee.sujet.source).toBe('theme')
    expect(idee.sujet.texte).toMatch(/^Écris /)
    expect(idee.forme.nom).toBeTruthy()
  })

  it('les idées personnelles du prof sont tirées', () => {
    const perso = [{ id: 'x1', texte: 'Écris sur le plus beau jour de ta vie.', tags: ['imparfait'] }]
    const tags = tagsPour({ requete: 'imparfait' })
    const sources = new Set()
    for (let i = 0; i < 200; i += 1) sources.add(genererIdee({ tags, perso, rng: graine(i) }).sujet.source)
    expect(sources.has('perso')).toBe(true)
  })

  it('relancer ne change que la partie demandée', () => {
    const contexte = { tags: tagsPour({ requete: 'phrase' }), rng: graine(9) }
    const idee = genererIdee(contexte)
    const f = relancer(idee, 'forme', { ...contexte, rng: graine(10) })
    expect(f.sujet).toEqual(idee.sujet)
    expect(f.defi).toEqual(idee.defi)
    const d = relancer(idee, 'defi', { ...contexte, rng: graine(11) })
    expect(d.sujet).toEqual(idee.sujet)
    expect(d.forme).toEqual(idee.forme)
    expect(d.defi.texte).not.toBe(idee.defi.texte)
    const s = relancer(idee, 'sujet', { ...contexte, rng: graine(12) })
    expect(s.defi).toEqual(idee.defi)
    expect(s.sujet.id).not.toBe(idee.sujet.id)
  })

  it('très varié : des milliers d’idées possibles et peu de doublons sur 200 tirages', () => {
    const tags = tagsPour({ requete: 'imparfait' })
    expect(nombreIdees({ tags })).toBeGreaterThan(1000)
    const vues = new Set()
    for (let i = 0; i < 200; i += 1) {
      const idee = genererIdee({ tags, rng: graine(1000 + i) })
      vues.add(`${idee.sujet.texte}|${idee.forme.nom}|${idee.defi.texte}`)
    }
    expect(vues.size).toBeGreaterThan(180)
  })

  it('attendu() retrouve un attendu par id', () => {
    expect(attendu(454).libelle).toBe('Conjuguer.')
    expect(attendu(99999)).toBeNull()
  })
})

describe('tags et temps précis', () => {
  it('« imparfait » + l’attendu général « Conjuguer » ne ramène pas les autres temps', () => {
    const tags = tagsPour({ requete: 'imparfait', attendusIds: [454, 455] })
    const noms = tags.map((t) => t.tag)
    expect(noms).toContain('imparfait')
    expect(noms).not.toContain('futur')
    expect(noms).not.toContain('conditionnel')
  })

  it('sans mot-clé, « Conjuguer » ouvre tous les temps', () => {
    const noms = tagsPour({ attendusIds: [454] }).map((t) => t.tag)
    expect(noms).toEqual(expect.arrayContaining(['imparfait', 'futur', 'passe_compose', 'conditionnel']))
  })
})

describe('expressions longues et défis', () => {
  it('« accord du participe » ne déclenche pas aussi l’entrée « accord » seule', () => {
    const reconnus = chercher('accord du participe passé').reconnus
    expect(reconnus).toContain('Accord du participe passé')
    expect(reconnus).not.toContain('Accords (groupe du nom)')
    expect(tagsPour({ requete: 'accord du participe passé' }).map((t) => t.tag)).not.toContain('accord_gn')
  })

  it('« accords » seul garde l’entrée générale', () => {
    expect(chercher('accords').reconnus).toContain('Accords (groupe du nom)')
  })

  it('« dialogue » reconnaît ponctuation et structure', () => {
    const reconnus = chercher('dialogue').reconnus
    expect(reconnus).toContain('Ponctuation')
    expect(reconnus.some((r) => r.startsWith('Structures de texte'))).toBe(true)
  })

  it('le défi ne répète pas la consigne', () => {
    expect(tropProche('Écris 8 phrases où le sujet est séparé de son verbe.', 'Écris 3 phrases où le sujet est éloigné du verbe.')).toBe(true)
    expect(tropProche('Décris une forêt enneigée.', 'Termine par une phrase surprenante.')).toBe(false)
    for (const requete of ['accord sujet verbe', 'phrase', 'connecteurs', 'imparfait']) {
      const tags = tagsPour({ requete })
      for (let i = 0; i < 80; i += 1) {
        const idee = genererIdee({ tags, rng: graine(500 + i) })
        expect(tropProche(idee.defi.texte, idee.sujet.texte), `${requete} : ${idee.sujet.texte} / ${idee.defi.texte}`).toBe(false)
      }
    }
  })

  it('la forme proposée est cohérente avec le genre de la consigne', () => {
    for (let i = 0; i < 100; i += 1) {
      const idee = genererIdee({ tags: tagsPour({ requete: 'imparfait connecteurs impératif' }), rng: graine(700 + i) })
      if (idee.sujet.source !== 'gabarit') continue
      const g = GABARITS.find((x) => x.id === idee.sujet.id)
      if (g.forme) {
        expect(idee.forme.nom).toBe(g.forme)
      } else {
        const f = FORMES.find((x) => x.nom === idee.forme.nom)
        expect(f.genres.some((genre) => g.genre.includes(genre))).toBe(true)
      }
    }
  })
})
