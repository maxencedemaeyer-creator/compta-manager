import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { APPS } from '../apps.js'
import { INSTALLABLES, installablePour } from '../installables.js'

const lire = (chemin) => readFileSync(new URL(`../../../${chemin}`, import.meta.url), 'utf8')

describe('applis installables seules', () => {
  it('ids et adresses uniques', () => {
    expect(new Set(INSTALLABLES.map((a) => a.id)).size).toBe(INSTALLABLES.length)
    expect(new Set(INSTALLABLES.map((a) => a.chemin)).size).toBe(INSTALLABLES.length)
  })

  it.each(INSTALLABLES)('$id : appli connue, même nom, adresse = celle du lanceur', (entree) => {
    const app = APPS.find((a) => a.id === entree.app)
    expect(app).toBeTruthy()
    expect(entree.nom).toBe(app.nom)
    // appli « pourTous » (Requêtes) : l'adresse est /<profil>/<id>
    const profil = entree.chemin.split('/')[1]
    expect(entree.chemin).toBe(app.pourTous ? `/${profil}/${app.id}` : app.to)
  })

  it.each(INSTALLABLES)('$id : manifeste et icônes présents, ouverture directe sur l\'appli', (entree) => {
    const dossier = `public/icons/${entree.id}`
    const manifeste = JSON.parse(lire(`${dossier}/site.webmanifest`))
    expect(manifeste.start_url).toBe(entree.chemin)
    expect(manifeste.scope).toBe(entree.chemin)
    expect(manifeste.id).toBe(entree.chemin)
    expect(manifeste.name).toBe(entree.nom)
    expect(manifeste.display).toBe('standalone')
    // aucun nom de domaine en dur : tout est relatif
    expect(JSON.stringify(manifeste)).not.toMatch(/https?:|vercel\.app/)
    for (const icone of manifeste.icons) expect(existsSync(new URL(`../../../public${icone.src}`, import.meta.url))).toBe(true)
    for (const f of ['favicon.svg', 'favicon-32.png', 'apple-touch-icon.png']) {
      expect(existsSync(new URL(`../../../${dossier}/${f}`, import.meta.url))).toBe(true)
    }
  })

  it('reconnaît l\'appli depuis n\'importe quelle page de l\'appli, pas les adresses voisines', () => {
    expect(installablePour('/maxence/compta').id).toBe('compta')
    expect(installablePour('/maxence/compta/velo').id).toBe('compta')
    expect(installablePour('/maxence/jeux/motus').id).toBe('jeux')
    expect(installablePour('/julie/requetes').id).toBe('requetes-julie')
    expect(installablePour('/maxence/requetes').id).toBe('requetes')
    expect(installablePour('/julie/couture/commandes').id).toBe('couture-atelier')
    expect(installablePour('/MAXENCE/Coach').id).toBe('coach')
    expect(installablePour('/maxence/comptabilite')).toBeUndefined()
    expect(installablePour('/maxence')).toBeUndefined()
    expect(installablePour('/maxence/settings')).toBeUndefined()
    // Lis-moi, Labo, Projection ont leur propre branche (index.html + IconeProfil)
    expect(installablePour('/lecture')).toBeUndefined()
    expect(installablePour('/maxence/lecture/entrainement')).toBeUndefined()
    expect(installablePour('/labo')).toBeUndefined()
    expect(installablePour('/maxence/projection')).toBeUndefined()
  })

  it('index.html contient l\'emplacement que vite.config.js remplit avec la liste', () => {
    const html = lire('index.html')
    expect(html.split('/*APPLIS_INSTALLABLES*/[]').length - 1).toBe(1)
  })

  it('aucun nom de domaine en dur dans le code du site (adresses relatives seulement)', () => {
    const fichiers = ['index.html', 'src/config/installables.js', 'src/components/IconeProfil.jsx', 'src/utils/espace.js']
    for (const f of fichiers) expect(lire(f)).not.toMatch(/compta-manager-peach|maxxence\.vercel\.app/)
  })
})
