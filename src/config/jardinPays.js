// =============================================================
//  Mon jardin : pays et climat d'un jardin
//  Le pays donne un climat par défaut (modifiable jardin par jardin) ;
//  le climat décale les dates du calendrier (src/utils/jardinCalendrier.js).
//  Les dates de la base de plantes sont celles de la Belgique (climat océanique).
//  Décalages en mois :
//   - debut   : tailles et récoltes dont la période commence de janvier à juin
//   - fin     : tailles et récoltes dont la période commence de juillet à décembre
//   - sortie  : sortie des plantes en pot (après le dernier gel)
//   - rentree : rentrée des plantes en pot (avant le premier gel)
//   - sansRentree : pas de rentrée/sortie (hivers sans gel marqué)
//  Hémisphère nord uniquement.
// =============================================================
export const CLIMATS = {
  oceanique: {
    nom: 'Tempéré océanique',
    detail: 'Belgique, Pays-Bas, nord de la France, Royaume-Uni…',
    debut: 0,
    fin: 0,
    sortie: 0,
    rentree: 0,
  },
  mediterraneen: {
    nom: 'Doux et sec (méditerranéen)',
    detail: 'Sud de la France, Espagne, Italie, Portugal, Grèce…',
    debut: -1,
    fin: -1,
    sortie: -1,
    rentree: 0,
    sansRentree: true,
  },
  continental: {
    nom: 'Continental (hivers froids)',
    detail: 'Europe centrale et de l’Est, Alpes (plaine)…',
    debut: 1,
    fin: 0,
    sortie: 1,
    rentree: -1,
  },
  froid: {
    nom: 'Froid (Nord, montagne)',
    detail: 'Scandinavie, haute montagne…',
    debut: 2,
    fin: 1,
    sortie: 2,
    rentree: -1,
  },
}

export const CLIMAT_PAR_DEFAUT = 'oceanique'

// code ISO → nom + climat par défaut (à ajuster dans le jardin si besoin : le sud de la France, par ex.)
const LISTE = [
  ['DE', 'Allemagne', 'continental'],
  ['AT', 'Autriche', 'continental'],
  ['BE', 'Belgique', 'oceanique'],
  ['BG', 'Bulgarie', 'continental'],
  ['HR', 'Croatie', 'continental'],
  ['DK', 'Danemark', 'oceanique'],
  ['ES', 'Espagne', 'mediterraneen'],
  ['EE', 'Estonie', 'continental'],
  ['FI', 'Finlande', 'froid'],
  ['FR', 'France', 'oceanique'],
  ['GR', 'Grèce', 'mediterraneen'],
  ['HU', 'Hongrie', 'continental'],
  ['IE', 'Irlande', 'oceanique'],
  ['IS', 'Islande', 'froid'],
  ['IT', 'Italie', 'mediterraneen'],
  ['LV', 'Lettonie', 'continental'],
  ['LT', 'Lituanie', 'continental'],
  ['LU', 'Luxembourg', 'oceanique'],
  ['MA', 'Maroc', 'mediterraneen'],
  ['NO', 'Norvège', 'froid'],
  ['NL', 'Pays-Bas', 'oceanique'],
  ['PL', 'Pologne', 'continental'],
  ['PT', 'Portugal', 'mediterraneen'],
  ['CZ', 'Tchéquie', 'continental'],
  ['RO', 'Roumanie', 'continental'],
  ['GB', 'Royaume-Uni', 'oceanique'],
  ['SK', 'Slovaquie', 'continental'],
  ['SI', 'Slovénie', 'continental'],
  ['SE', 'Suède', 'froid'],
  ['CH', 'Suisse', 'continental'],
  ['TN', 'Tunisie', 'mediterraneen'],
  ['TR', 'Turquie', 'mediterraneen'],
]

export const PAYS = LISTE.map(([code, nom, climat]) => ({ code, nom, climat })).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
export const PAYS_PAR_DEFAUT = 'BE'

const PAR_CODE = Object.fromEntries(PAYS.map((p) => [p.code, p]))
export const trouverPays = (code) => PAR_CODE[code] || null

// Drapeau en emoji à partir du code pays (BE → 🇧🇪)
export const drapeau = (code) =>
  code && /^[A-Z]{2}$/.test(code) ? String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)) : '🌍'

// Pays et climat d'un jardin (jardins créés avant cette option : Belgique, océanique)
export const paysDe = (jardin) => (jardin?.pays === '' || jardin?.pays === 'AUTRE' ? null : trouverPays(jardin?.pays) || PAR_CODE[PAYS_PAR_DEFAUT])
export const climatDe = (jardin) => (CLIMATS[jardin?.climat] ? jardin.climat : paysDe(jardin)?.climat || CLIMAT_PAR_DEFAUT)
