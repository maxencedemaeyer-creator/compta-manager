// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'

// Pas de Firebase dans les tests : on remplace les fonctions de la base
vi.mock('../../../hooks/useCave.js', () => {
  const rien = async () => {}
  return {
    useCave: () => ({ bouteilles: [], historique: [], envies: [], manques: [], chargement: false, erreur: '' }),
    enregistrerBouteille: rien, supprimerBouteille: rien, changerQuantite: rien, lirePhotoBouteille: async () => null,
    boireBouteille: rien, modifierDegustation: rien, supprimerDegustation: rien, ajouterEnvie: rien, supprimerEnvie: rien,
    signaler: rien, effacerManques: rien,
  }
})

const { default: CeSoirTab } = await import('../CeSoirTab.jsx')
const { default: MaCaveTab } = await import('../MaCaveTab.jsx')
const { default: HistoriqueTab } = await import('../HistoriqueTab.jsx')
const { default: EnviesTab } = await import('../EnviesTab.jsx')
const { default: DonneesTab } = await import('../DonneesTab.jsx')
const { default: BouteilleForm } = await import('../BouteilleForm.jsx')
const { default: CaveView } = await import('../../../views/cave/CaveView.jsx')
const { decrireBouteille } = await import('../../../lib/cave/bouteille.js')

const rendre = (el) => renderToString(<MemoryRouter>{el}</MemoryRouter>).replace(/<!-- -->/g, '')
const bouteilles = [
  { id: 'b1', appellationId: 'fr:chablis', code: 'B', styleId: 'b-mineral', millesime: 2021, quantite: 3, prixAchat: 22, producteur: 'Domaine X', cuvee: '', emplacement: 'Casier 1', cepages: [] },
  { id: 'b2', appellationId: 'it:barolo', code: 'R', styleId: 'r-nebb', millesime: 2016, quantite: 2, prixAchat: 55, cepages: [] },
  { id: 'b3', appellationId: null, appellationLibre: 'Vin du voisin', code: 'R', styleId: 'r-souple', millesime: null, quantite: 1, cepages: ['Merlot'] },
].map(decrireBouteille)

describe('écrans de la Cave', () => {
  it('Ce soir : accueil, plat reconnu, plat inconnu', () => {
    const props = { bouteilles, historique: [], envies: [] }
    expect(rendre(<CeSoirTab {...props} />)).toContain('Qu’est-ce qu’on mange ce soir')
    const html = rendre(<CeSoirTab {...props} texteInitial="huîtres" />)
    expect(html).toContain('Dans ma cave')
    expect(html).toContain('Chablis')
    expect(html).toContain('À acheter')
    expect(html).toContain('40 € et plus')
    expect(rendre(<CeSoirTab {...props} texteInitial="zzzz qqqq" />)).toContain('Je ne connais pas encore ce plat')
    expect(rendre(<CeSoirTab bouteilles={[]} historique={[]} envies={[]} texteInitial="côte de boeuf" />)).toContain('Ta cave est vide')
  })
  it('Ma cave, Historique, Achats, Données', () => {
    expect(rendre(<MaCaveTab bouteilles={bouteilles} formulaire={null} setFormulaire={() => {}} />)).toContain('Domaine X')
    expect(rendre(<MaCaveTab bouteilles={[]} formulaire={null} setFormulaire={() => {}} />)).toContain('Ta cave est vide')
    const h = [{ id: 'h1', nom: 'Chablis', millesime: 2020, code: 'B', bueLe: '2026-11-20', plat: 'huîtres', note: 5, commentaire: 'top' }]
    expect(rendre(<HistoriqueTab historique={h} />)).toContain('Tes préférés')
    expect(rendre(<EnviesTab envies={[{ id: 'e1', appellationId: 'fr:sancerre', nom: 'Sancerre', code: 'B', styleId: 'b-sauv', prixCible: 22 }]} onAcheter={() => {}} />)).toContain('Sancerre')
    const manques = [{ id: 'm1', genre: 'plat', texte: 'tajine de poisson', nb: 2 }, { id: 'm2', genre: 'appellation', texte: 'Bandol rouge', contexte: 'Rouge', nb: 1 }]
    const html = rendre(<DonneesTab manques={manques} />)
    expect(html).toContain('Copier pour Claude')
    expect(html).toContain('tajine de poisson')
  })
  it('Formulaire bouteille et page complète', () => {
    expect(rendre(<BouteilleForm bouteille={null} onClose={() => {}} />)).toContain('Nouvelle bouteille')
    expect(rendre(<BouteilleForm bouteille={bouteilles[0]} onClose={() => {}} />)).toContain('Chablis')
    expect(rendre(<CaveView />)).toContain('Cave')
  })
})
