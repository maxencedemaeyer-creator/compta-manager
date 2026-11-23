import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trouverProfil } from '../config/profils.js'
import { estSiteGalerie } from '../hooks/useCouture.js'

// =============================================================
//  Icône du site (onglet du navigateur + écran d'accueil de
//  l'iPhone) et nom affiché sous l'icône, selon l'espace :
//    /          → icône de l'accueil (les deux ronds)
//    /maxence   → « M. » vert
//    /julie     → « J. » rose
//    /maxence/projection → photo projetée violet-ambre (appli Projection)
//    /labo      → fiole d'Erlenmeyer fluo (labo de sciences)
//    /lecture   → livre audio blanc sur dégradé indigo-violet (Lis-moi, même dessin que son bouton)
//    /couture et couture-julie.vercel.app (galerie) → « J. » rose aussi,
//    mais l'icône posée sur l'écran d'accueil ouvre la galerie, pas l'atelier
//  Les fichiers sont dans public/icons/<dossier>/.
//  Nouveau profil : ajouter « icone » dans src/config/profils.js.
// =============================================================
const VERSION = 'v=4'

// Pages publiques rattachées à un espace (galerie couture → Julie)
const PAGES_DE = { couture: 'julie' }

function choisir(pathname) {
  // Galerie couture sur son adresse à part (couture-julie.vercel.app) → icône de Julie
  const premier = estSiteGalerie() ? 'couture' : (pathname.split('/')[1] || '').toLowerCase()
  // Application Projection : icône et manifeste à part (installable comme appli)
  if (/^\/maxence\/projection(\/|$)/i.test(pathname)) {
    return { dossier: 'projection', manifeste: 'projection', nom: 'Projection', theme: '#0f0a1f', version: 'v=1' }
  }
  // Lis-moi (/lecture, public) : icône et manifeste à part (installable sur la tablette de l'élève).
  // L'Entraînement (/maxence/lecture/…) garde l'icône de Maxence.
  if (premier === 'lecture') return { dossier: 'lecture', manifeste: 'lecture', nom: 'Lis-moi', theme: '#fbf7f0', version: 'v=1' }
  if (premier === 'labo') return { dossier: 'labo', manifeste: 'labo', nom: 'Le labo', theme: '#070b16', version: 'v=5' }
  const profil = trouverProfil(PAGES_DE[premier] || premier)
  if (profil?.icone) {
    return { dossier: profil.icone, manifeste: premier === 'couture' ? 'couture' : profil.icone, nom: profil.nom }
  }
  return { dossier: 'accueil', manifeste: 'accueil', nom: 'Accueil' }
}

function changer(id, attribut, valeur) {
  const el = document.getElementById(id)
  if (el && el.getAttribute(attribut) !== valeur) el.setAttribute(attribut, valeur)
}

export default function IconeProfil() {
  const { pathname } = useLocation()
  const { dossier, manifeste, nom, theme = '#f4f1ea', version = VERSION } = choisir(pathname)

  useEffect(() => {
    const base = `/icons/${dossier}/`
    changer('icone-svg', 'href', `${base}favicon.svg?${version}`)
    changer('icone-png', 'href', `${base}favicon-32.png?${version}`)
    changer('icone-192', 'href', `${base}icon-192.png?${version}`)
    changer('icone-apple', 'href', `${base}apple-touch-icon.png?${version}`)
    changer('couleur-theme', 'content', theme)
    changer('nom-appli', 'content', nom)
    changer('nom-appli-apple', 'content', nom)
    document.title = nom
    // Android/Chrome relit mieux un nouveau lien « manifest » qu'un lien modifié : on le remplace
    const href = `/icons/${manifeste}/site.webmanifest?${version}`
    const ancien = document.getElementById('icone-manifest')
    if (ancien && ancien.getAttribute('href') !== href) {
      const neuf = document.createElement('link')
      neuf.id = 'icone-manifest'
      neuf.rel = 'manifest'
      neuf.href = href
      ancien.replaceWith(neuf)
    }
  }, [dossier, manifeste, nom, theme, version])

  return null
}
