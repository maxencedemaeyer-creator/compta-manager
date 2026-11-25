import { COULEURS } from '../../data/cave/styles.js'
import { niveauAccord } from '../../lib/cave/accord.js'
import { COULEUR_PUCE, STATUT_GARDE } from './ui.jsx'

// Un vin proposé pour le plat : nom, score d'accord, explications, actions
export default function CarteVin({ rang, titre, sousTitre, code, styleNom, accord, garde, prix, miniature, quantite, actions }) {
  const score = accord.score
  const teinte = score >= 68 ? 'bg-emerald-500' : score >= 54 ? 'bg-amber-500' : 'bg-rose-400'
  const statut = garde && STATUT_GARDE[garde.statut]
  return (
    <li className="rounded-3xl border border-rose-900/10 bg-white p-4 shadow-sm shadow-rose-900/5">
      <div className="flex items-start gap-3">
        {rang && <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-700 text-sm font-bold text-white">{rang}</span>}
        {miniature && <img src={miniature} alt="" className="h-14 w-11 shrink-0 rounded-lg object-cover" />}
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold leading-tight text-rose-950">{titre}</h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-rose-900/60">
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${COULEUR_PUCE[code]}`}>
              {COULEURS[code].emoji} {COULEURS[code].nom}
            </span>
            {sousTitre && <span>{sousTitre}</span>}
            {quantite != null && <span>· {quantite} en cave</span>}
            {prix != null && <span>· env. {Math.round(prix)} €</span>}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-2xl font-extrabold leading-none text-rose-950">{score}</p>
          <p className="text-[11px] text-rose-900/50">/ 100</p>
        </div>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-rose-50">
        <div className={`h-full rounded-full ${teinte}`} style={{ width: `${score}%` }} />
      </div>
      <p className="mt-2 text-sm font-semibold text-rose-900">{niveauAccord(score)}</p>

      {styleNom && <p className="mt-0.5 text-xs text-rose-900/50">{styleNom}</p>}
      <ul className="mt-2 space-y-1">
        {accord.pourquoi.map((p) => (
          <li key={p} className="text-sm text-rose-950/80">
            ✓ {p}
          </li>
        ))}
        {accord.reserve && <li className="text-sm text-amber-700">⚠ {accord.reserve}</li>}
      </ul>

      {statut?.label && (
        <p className="mt-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statut.classe}`}>{garde.texte}</span>
        </p>
      )}
      {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
    </li>
  )
}
