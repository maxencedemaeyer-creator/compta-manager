import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { usePin } from '../context/PinContext.jsx'
import { estSiteGalerie } from '../hooks/useCouture.js'

// =============================================================
//  Couleur de la barre d'état de l'iPhone (heure, batterie…)
//  et de la barre de Safari : elle prend la couleur du haut de
//  la page affichée, pour que le site paraisse plein écran.
// =============================================================
const CREME = { maxence: '#f4f1ea', julie: '#fcf5f7' }
const FOND_PIN = { maxence: '#047857', julie: '#f6aad2' }

function couleurPour(pathname, profilId, unlocked) {
  // Application Couture (galerie publique et atelier de Julie) : fond Vichy pastel
  if (estSiteGalerie() || pathname.startsWith('/couture') || (unlocked && pathname.startsWith('/julie/couture'))) return '#fffafc'
  if (!profilId) return CREME.maxence
  if (!unlocked) return FOND_PIN[profilId] || FOND_PIN.maxence
  if (pathname.includes('/jeux')) return '#07031a'
  if (/\/(genealogie|projection)/.test(pathname)) return '#020617'
  if (pathname.includes('/compta')) return '#ffffff'
  if (pathname.includes('/francais')) return '#f8fafc'
  return CREME[profilId] || CREME.maxence
}

export default function CouleurBarre() {
  const { pathname } = useLocation()
  const { profilId, unlocked } = usePin()

  useEffect(() => {
    const couleur = couleurPour(pathname, profilId, unlocked)
    let meta = document.querySelector('meta[name="theme-color"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'theme-color'
      document.head.appendChild(meta)
    }
    meta.content = couleur
    // Même couleur quand on « tire » la page au-delà de ses bords
    document.documentElement.style.backgroundColor = couleur
  }, [pathname, profilId, unlocked])

  return null
}
