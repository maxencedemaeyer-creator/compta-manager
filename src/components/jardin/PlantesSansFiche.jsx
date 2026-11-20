import { useState } from 'react'
import { Check, ClipboardCopy } from 'lucide-react'
import Feuille, { boutonPrincipal } from './Feuille.jsx'

// Texte prêt à coller dans la conversation avec Claude
function texteACopier(plantes) {
  const lignes = plantes.map(
    (p) => `- ${p.nom} (×${p.quantite}, ${p.details.join(' / ')}, jardin : ${p.jardins.join(', ')})`
  )
  return (
    "Ajoute ces plantes à la base de plantes de « Mon jardin » (présentation, conseils, mois de taille et de récolte) :\n" +
    lignes.join('\n')
  )
}

async function copier(texte) {
  try {
    await navigator.clipboard.writeText(texte)
    return true
  } catch {
    // Anciens navigateurs : copie via un champ caché
    const zone = document.createElement('textarea')
    zone.value = texte
    zone.style.position = 'fixed'
    zone.style.opacity = '0'
    document.body.appendChild(zone)
    zone.select()
    let ok = false
    try {
      ok = document.execCommand('copy')
    } catch {
      ok = false
    }
    zone.remove()
    return ok
  }
}

// Liste discrète des plantes ajoutées librement, qui attendent leur fiche dans la base
export default function PlantesSansFiche({ plantes, onClose }) {
  const [copie, setCopie] = useState(false)
  const [echec, setEchec] = useState(false)

  async function copierLaListe() {
    const ok = await copier(texteACopier(plantes))
    setCopie(ok)
    setEchec(!ok)
    if (ok) setTimeout(() => setCopie(false), 2500)
  }

  return (
    <Feuille open onClose={onClose} titre="Plantes sans fiche">
      <p className="mb-4 text-sm text-emerald-900/70">
        Ces plantes ont été ajoutées librement. Copie la liste et colle-la à Claude pour qu'il crée leurs fiches : elles
        disparaîtront d'ici toutes seules.
      </p>

      <ul className="mb-5 divide-y divide-emerald-50 overflow-hidden rounded-2xl border border-emerald-100">
        {plantes.map((p) => (
          <li key={p.nom} className="flex items-center gap-3 px-4 py-3">
            <span className="text-xl">🌱</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-emerald-950">{p.nom}</p>
              <p className="truncate text-xs text-emerald-900/55">{p.jardins.join(', ')}</p>
            </div>
            <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">×{p.quantite}</span>
          </li>
        ))}
      </ul>

      <button onClick={copierLaListe} className={`${boutonPrincipal} w-full`}>
        {copie ? <Check size={18} /> : <ClipboardCopy size={18} />}
        {copie ? 'Liste copiée !' : 'Copier la liste'}
      </button>
      {echec && (
        <p className="mt-3 text-sm text-rose-600">La copie automatique n'a pas marché : sélectionne la liste ci-dessus et copie-la à la main.</p>
      )}
    </Feuille>
  )
}
