// =============================================================
//  Applications qu'on peut poser SEULES sur l'écran d'accueil
//  d'une tablette ou d'un téléphone (une icône par appli, qui
//  rouvre directement cette appli).
//
//  Données simples, sans import : lues par
//   - src/components/IconeProfil.jsx (icône et nom quand on navigue),
//   - vite.config.js → recopiées dans le script de index.html
//     (icône et nom dès l'ouverture, avant que le site se charge),
//   - scripts/icones/generer-icones-applis.mjs (fabrique les icônes
//     et le manifeste de chaque appli dans public/icons/<id>/).
//
//  Pas dans cette liste (déjà installables à part, code dans
//  index.html et IconeProfil.jsx) : Lis-moi (/lecture), le Labo
//  (/labo) et Projection (/maxence/projection).
//
//  Nouvelle appli à installer : une ligne ici (app = id dans
//  src/config/apps.js), puis `npx vite-node scripts/icones/generer-icones-applis.mjs`.
//  Le nom de domaine n'apparaît nulle part : tout est relatif, donc rien
//  à changer quand le site change d'adresse.
// =============================================================
export const INSTALLABLES = [
  { id: 'compta', app: 'compta', chemin: '/maxence/compta', nom: 'Compta', theme: '#ffffff' },
  { id: 'genealogie', app: 'genealogie', chemin: '/maxence/genealogie', nom: 'Généalogie', theme: '#020617' },
  { id: 'francais', app: 'francais', chemin: '/maxence/francais', nom: 'Savoir écrire', theme: '#f8fafc' },
  { id: 'atlas', app: 'atlas', chemin: '/maxence/atlas', nom: 'Atlas', theme: '#f4f6f8' },
  { id: 'jeux', app: 'jeux', chemin: '/maxence/jeux', nom: 'Jeux', theme: '#07031a' },
  { id: 'jardin', app: 'jardin', chemin: '/maxence/jardin', nom: 'Mon jardin', theme: '#ecfdf5' },
  { id: 'coach', app: 'coach', chemin: '/maxence/coach', nom: 'Coach', theme: '#f0f9ff' },
  { id: 'requetes', app: 'requetes', chemin: '/maxence/requetes', nom: 'Requêtes', theme: '#f4f1ea' },
  // Espace de Julie (écran de chargement rose)
  { id: 'couture-atelier', app: 'couture', chemin: '/julie/couture', nom: 'Couture', theme: '#fffafc', julie: true },
  { id: 'requetes-julie', app: 'requetes', chemin: '/julie/requetes', nom: 'Requêtes', theme: '#fcf5f7', julie: true },
]

// Version des icônes : à augmenter si on change une icône (force les appareils à la relire)
export const VERSION_ICONES_APPLIS = 'v=1'

// L'application installable qui correspond à une adresse (ou undefined).
// /maxence/compta et /maxence/compta/velo → compta ; /maxence/comptabilite → rien.
export function installablePour(pathname) {
  const chemin = String(pathname || '').toLowerCase()
  return INSTALLABLES.find((a) => chemin === a.chemin || chemin.startsWith(`${a.chemin}/`))
}
