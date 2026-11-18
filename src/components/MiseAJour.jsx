import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Chargement from './Chargement.jsx'
import MiseAJourLabo from './labo/MiseAJourLabo.jsx'

// =============================================================
//  Mise à jour automatique du site
//
//  - En arrière-plan (toutes les minutes, et quand on revient sur
//    l'onglet / l'appli), le site regarde discrètement si une
//    nouvelle version a été déployée sur Vercel.
//  - Il NE recharge JAMAIS pendant que tu remplis un formulaire :
//    le rechargement se fait seulement quand tu changes de page
//    (clic sur un onglet, un bouton qui ouvre une autre page…).
//  - À ce moment-là : petit écran "Mise à jour du site…" puis la
//    nouvelle version s'affiche, sur la page où tu allais.
//  - Dans le LABO (/labo…) : écran spécial, un erlenmeyer qui se
//    remplit pendant le téléchargement, déborde et explose
//    (components/labo/MiseAJourLabo.jsx). Aperçu : /labo?apercu-maj
// =============================================================

const VERSION_ACTUELLE = __APP_VERSION__
const CLE_TENTATIVE = 'cm_maj_tentee'
const VERIF_ARRIERE_PLAN_MS = 60 * 1000 // toutes les minutes
const VERIF_MIN_ECART_MS = 5 * 1000 // pas plus d'une vérification toutes les 5 s

async function lireVersionEnLigne() {
  const reponse = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
  if (!reponse.ok) return null
  const donnees = await reponse.json()
  return donnees?.version || null
}

export default function MiseAJour() {
  const location = useLocation()
  const [enCours, setEnCours] = useState(false)
  const nouvelleVersion = useRef(false)
  const derniereVerif = useRef(0)
  const premierAffichage = useRef(true)

  // Regarde si une nouvelle version est en ligne (renvoie true/false)
  async function verifier() {
    if (import.meta.env.DEV) return false // pas de vérification en développement
    if (nouvelleVersion.current) return true
    const maintenant = Date.now()
    if (maintenant - derniereVerif.current < VERIF_MIN_ECART_MS) return false
    derniereVerif.current = maintenant
    try {
      const enLigne = await lireVersionEnLigne()
      if (!enLigne || enLigne === VERSION_ACTUELLE) return false
      // Sécurité anti-boucle : on ne recharge qu'une fois par nouvelle version
      if (sessionStorage.getItem(CLE_TENTATIVE) === enLigne) return false
      nouvelleVersion.current = enLigne
      return true
    } catch {
      return false // hors ligne, etc. : on réessaiera plus tard
    }
  }

  const dansLeLabo = /^\/labo(\/|$)/.test(location.pathname)

  function recharger() {
    if (typeof nouvelleVersion.current === 'string') {
      sessionStorage.setItem(CLE_TENTATIVE, nouvelleVersion.current)
    }
    setEnCours(true)
    // Dans le labo, c'est l'animation de l'erlenmeyer qui recharge la page à la fin
    if (/^\/labo(\/|$)/.test(window.location.pathname)) return
    // Laisse le temps à l'écran de chargement de s'afficher
    setTimeout(() => window.location.reload(), 400)
  }

  // Aperçu de l'animation du labo, sans mise à jour : /labo?apercu-maj
  const apercu = dansLeLabo && new URLSearchParams(location.search).has('apercu-maj')

  // Vérification en arrière-plan + au retour sur l'onglet / l'appli
  useEffect(() => {
    const intervalle = setInterval(verifier, VERIF_ARRIERE_PLAN_MS)
    const auRetour = () => {
      if (document.visibilityState === 'visible') verifier()
    }
    document.addEventListener('visibilitychange', auRetour)
    window.addEventListener('focus', auRetour)
    return () => {
      clearInterval(intervalle)
      document.removeEventListener('visibilitychange', auRetour)
      window.removeEventListener('focus', auRetour)
    }
  }, [])

  // À chaque changement de page : si une nouvelle version existe → on recharge
  useEffect(() => {
    if (premierAffichage.current) {
      premierAffichage.current = false
      verifier()
      return
    }
    // Le rechargement se fait sur la page actuelle (celle où tu viens d'arriver)
    verifier().then((nouvelle) => {
      if (nouvelle) recharger()
    })
  }, [location.pathname])

  if (apercu)
    return (
      <MiseAJourLabo
        onFini={() => {
          window.location.replace(location.pathname)
        }}
      />
    )
  if (!enCours) return null
  if (dansLeLabo) return <MiseAJourLabo onFini={() => window.location.reload()} />
  return <Chargement superpose message="Mise à jour du site…" />
}
