import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trouverProfil } from '../config/profils.js'

// =============================================================
//  Icône du site (onglet du navigateur + écran d'accueil de
//  l'iPhone) et nom affiché sous l'icône, selon l'espace :
//    /          → icône de l'accueil (les deux ronds)
//    /maxence   → « M. » vert
//    /julie     → « J. » rose
//  Les fichiers sont dans public/icons/<dossier>/.
//  Nouveau profil : ajouter « icone » dans src/config/profils.js.
// =============================================================
const VERSION = 'v=3'

// Pages publiques rattachées à un espace (galerie couture → Julie)
const PAGES_DE = { couture: 'julie' }

function choisir(pathname) {
  const premier = (pathname.split('/')[1] || '').toLowerCase()
  const profil = trouverProfil(PAGES_DE[premier] || premier)
  if (profil?.icone) return { dossier: profil.icone, nom: profil.nom }
  return { dossier: 'accueil', nom: 'Accueil' }
}

function changer(id, attribut, valeur) {
  const el = document.getElementById(id)
  if (el && el.getAttribute(attribut) !== valeur) el.setAttribute(attribut, valeur)
}

export default function IconeProfil() {
  const { pathname } = useLocation()
  const { dossier, nom } = choisir(pathname)

  useEffect(() => {
    const base = `/icons/${dossier}/`
    changer('icone-svg', 'href', `${base}favicon.svg?${VERSION}`)
    changer('icone-png', 'href', `${base}favicon-32.png?${VERSION}`)
    changer('icone-apple', 'href', `${base}apple-touch-icon.png?${VERSION}`)
    changer('icone-manifest', 'href', `${base}site.webmanifest?${VERSION}`)
    changer('nom-appli', 'content', nom)
    changer('nom-appli-apple', 'content', nom)
    document.title = nom
  }, [dossier, nom])

  return null
}
