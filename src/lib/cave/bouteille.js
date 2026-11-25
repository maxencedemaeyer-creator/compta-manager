import { STYLE_PAR_ID, STYLES, COULEURS } from '../../data/cave/styles.js'
import { ENTREES, normaliser, trouverAppellationParId } from './appellations.js'

// Une bouteille de la cave (document Firebase) → ce dont le moteur d'accords a besoin
export function decrireBouteille(b) {
  const appellation = trouverAppellationParId(b.appellationId)
  const entree = appellation ? ENTREES.find((e) => e.appellationId === appellation.id && e.code === b.code) : null
  const style = STYLE_PAR_ID[b.styleId] || entree?.style || STYLES.find((s) => s.couleur === b.code) || STYLES[0]
  const garde = entree && entree.style.id === style.id ? entree.garde : style.garde
  const nom = appellation?.nom || (b.appellationLibre || '').trim() || 'Vin'
  return {
    ...b,
    nom,
    appellation,
    garde,
    vin: {
      style,
      code: b.code || style.couleur,
      cleRegion: appellation?.cleRegion,
      pays: appellation?.pays,
      cle: appellation?.cle || normaliser(b.appellationLibre),
      cepages: b.cepages?.length ? b.cepages : entree?.cepages || [],
    },
  }
}

// « Chablis 2020 · Domaine X »
export function titreBouteille(b) {
  const parties = [b.nom, b.millesime ? String(b.millesime) : null].filter(Boolean).join(' ')
  const qui = [b.producteur, b.cuvee].map((s) => (s || '').trim()).filter(Boolean).join(' · ')
  return { titre: parties, sousTitre: qui }
}

export const couleurDe = (code) => COULEURS[code] || COULEURS.R

// Styles proposés pour une couleur (quand l'appellation est libre)
export const stylesDeCouleur = (code) => STYLES.filter((s) => s.couleur === code)

// Écriture lisible d'un prix
export const euros = (n) => (n || n === 0 ? `${Math.round(n)} €` : '')
