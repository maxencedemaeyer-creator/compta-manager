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
  if (premier === 'labo') return { dossier: 'accueil', manifeste: 'accueil', nom: 'Labo de sciences' }
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
  const { dossier, manifeste, nom } = choisir(pathname)

  useEffect(() => {
    const base = `/icons/${dossier}/`
    changer('icone-svg', 'href', `${base}favicon.svg?${VERSION}`)
    changer('icone-png', 'href', `${base}favicon-32.png?${VERSION}`)
    changer('icone-apple', 'href', `${base}apple-touch-icon.png?${VERSION}`)
    changer('icone-manifest', 'href', `/icons/${manifeste}/site.webmanifest?${VERSION}`)
    changer('nom-appli', 'content', nom)
    changer('nom-appli-apple', 'content', nom)
    document.title = nom
  }, [dossier, manifeste, nom])

  return null
}
