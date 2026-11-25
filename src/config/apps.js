import { Activity, Globe, BookAudio, FlaskConical, Gamepad2, GitBranch, MessageSquarePlus, PenLine, Projector, Scissors, Sprout, Wallet, Wine } from 'lucide-react'

// =============================================================
//  Liste des applications du site (adresses sous /maxence).
//  Quelles applis chaque profil voit : src/config/profils.js
//  Pour ajouter une application : ajouter un objet ici
//  (et sa route dans App.jsx). L'ordre et la visibilité se
//  règlent ensuite directement dans Paramètres.
//  pourTous: true = l'appli est dans chaque espace, à l'adresse
//  /<profil>/<id> (ex. /julie/requetes).
//  profils: ['julie'] = appli réservée à ces profils (même si
//  un profil a apps: 'toutes').
// =============================================================
export const APPS = [
  {
    id: 'compta',
    to: '/maxence/compta',
    nom: 'Compta',
    description: 'Cours, vélo, études, frais',
    icon: Wallet,
    couleur: 'from-emerald-400 to-teal-600',
  },
  {
    id: 'genealogie',
    to: '/maxence/genealogie',
    nom: 'Généalogie',
    description: 'Arbre familial, éventail et photos',
    icon: GitBranch,
    couleur: 'from-rose-400 to-orange-500',
  },
  {
    id: 'francais',
    to: '/maxence/francais',
    nom: 'Savoir écrire',
    description: 'Idées d’écriture selon le programme P5-P6',
    icon: PenLine,
    couleur: 'from-sky-400 to-indigo-600',
  },
  {
    id: 'projection',
    to: '/maxence/projection',
    nom: 'Projection',
    description: 'Photo prise en classe, projetée au tableau',
    icon: Projector,
    couleur: 'from-violet-500 to-amber-400',
  },
  {
    id: 'jeux',
    to: '/maxence/jeux',
    nom: 'Jeux',
    description: 'Game Center : tous les jeux',
    icon: Gamepad2,
    couleur: 'from-fuchsia-500 to-cyan-400',
  },
  {
    id: 'jardin',
    to: '/maxence/jardin',
    nom: 'Mon jardin',
    description: 'Mes plantes, tailles et récoltes',
    icon: Sprout,
    couleur: 'from-green-400 to-emerald-600',
    profils: ['maxence'],
  },
  {
    id: 'coach',
    to: '/maxence/coach',
    nom: 'Coach',
    description: 'Sport, plans et nutrition, avec sources',
    icon: Activity,
    couleur: 'from-sky-400 to-indigo-600',
    profils: ['maxence'],
  },
  {
    id: 'cave',
    to: '/maxence/cave',
    nom: 'Cave',
    description: 'Ma cave à vin et l’accord avec le plat du soir',
    icon: Wine,
    couleur: 'from-rose-500 to-red-800',
    profils: ['maxence'],
  },
  {
    id: 'labo',
    to: '/labo',
    nom: 'Labo de sciences',
    description: 'Les activités des élèves (sans code)',
    icon: FlaskConical,
    couleur: 'from-lime-400 via-emerald-500 to-violet-600',
    profils: ['maxence'],
  },
  {
    id: 'lecture',
    to: '/lecture',
    nom: 'Lis-moi',
    description: 'Photo d’un texte, lu à voix haute (élèves, sans code)',
    icon: BookAudio,
    couleur: 'from-indigo-500 to-violet-600',
    profils: ['maxence'],
  },
  {
    id: 'couture',
    to: '/julie/couture',
    nom: 'Couture',
    description: 'Ma galerie et mes commandes',
    icon: Scissors,
    couleur: 'from-pink-300 via-pink-400 to-rose-500',
    profils: ['julie'],
  },
  {
    id: 'requetes',
    to: '/maxence/requetes',
    nom: 'Requêtes',
    description: 'Demandes de nouvelles applis et idées',
    icon: MessageSquarePlus,
    couleur: 'from-fuchsia-500 to-indigo-500',
    pourTous: true,
  },
]

// Applications dans l'ordre choisi dans Paramètres
export function appsOrdonnees(ordre = [], supplementaires = []) {
  const liste = [...APPS, ...supplementaires]
  const position = (id) => {
    const i = ordre.indexOf(id)
    return i === -1 ? 1000 + liste.findIndex((a) => a.id === id) : i
  }
  return liste.sort((a, b) => position(a.id) - position(b.id))
}

// Applications d'un profil (voir src/config/profils.js), dans l'ordre choisi dans ses Paramètres
export function appsDuProfil(profil, ordre = [], appsPerso = []) {
  if (!profil) return []
  const toutes = appsOrdonnees(ordre, appsPersoEnApps(appsPerso))
  return toutes
    .filter((a) => a.externe || !a.profils || a.profils.includes(profil.id))
    .filter((a) => a.externe || profil.apps === 'toutes' || a.pourTous || profil.apps.includes(a.id))
    .map((a) => (a.pourTous ? { ...a, to: `/${profil.id}/${a.id}` } : a))
}

// ---------- Applications ajoutées à la main (simples liens vers un site) ----------
// Enregistrées dans les paramètres du profil (appsPerso : [{ id, nom, url }]).
export function normaliserUrl(saisie) {
  let texte = String(saisie || '').trim()
  if (!texte) return null
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(texte)) texte = `https://${texte}`
  try {
    const u = new URL(texte)
    if (!['http:', 'https:'].includes(u.protocol) || !u.hostname.includes('.')) return null
    return u.href
  } catch {
    return null
  }
}

export function hoteDe(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

// Favicon du site (service public de Google, mis à l'échelle)
export function faviconDe(url) {
  try {
    return `https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(new URL(url).origin)}`
  } catch {
    return null
  }
}

export function appsPersoEnApps(appsPerso = []) {
  return appsPerso.map((a) => ({
    id: a.id,
    to: a.url,
    url: a.url,
    externe: true,
    nom: a.nom,
    description: hoteDe(a.url),
    icon: Globe,
    couleur: 'from-slate-400 to-slate-600',
  }))
}
