import { useState } from 'react'
import { faviconDe } from '../../config/apps.js'

// Pastille d'icône d'une application de l'accueil.
// Appli interne : icône Lucide sur dégradé. Lien externe : favicon du site
// sur fond blanc (repli sur l'icône globe si le favicon ne charge pas).
export default function AppIcone({ app, classe, taille, strokeWidth = 2, extra = '' }) {
  const [echec, setEchec] = useState(false)
  const Icon = app.icon
  const favicon = app.externe && !echec ? faviconDe(app.url) : null
  if (favicon) {
    return (
      <span className={`${classe} bg-white border border-emerald-900/10 flex items-center justify-center shadow-md shrink-0 ${extra}`}>
        <img
          src={favicon}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setEchec(true)}
          style={{ width: '62%', height: '62%' }}
          className="object-contain"
        />
      </span>
    )
  }
  return (
    <span className={`${classe} bg-gradient-to-br ${app.couleur} flex items-center justify-center text-white shadow-md shrink-0 ${extra}`}>
      <Icon size={taille} strokeWidth={strokeWidth} />
    </span>
  )
}
