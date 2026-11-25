import { Trash2 } from 'lucide-react'
import { boutonDoux, COULEUR_PUCE } from './ui.jsx'
import { COULEURS, STYLE_PAR_ID } from '../../data/cave/styles.js'
import { PAYS, trouverAppellationParId } from '../../lib/cave/appellations.js'
import { supprimerEnvie } from '../../hooks/useCave.js'

// Liste d'achats : les vins repérés dans les suggestions « À acheter »
export default function EnviesTab({ envies, onAcheter }) {
  if (envies.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-rose-200 bg-white/70 px-6 py-12 text-center">
        <p className="text-5xl">🛒</p>
        <p className="mt-3 text-lg font-semibold text-rose-950">Liste d’achats vide</p>
        <p className="mt-1 text-sm text-rose-900/60">Dans « Ce soir », touche « Liste d’achats » sous un vin à acheter : il apparaît ici.</p>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {envies.map((e) => {
        const a = trouverAppellationParId(e.appellationId)
        return (
          <li key={e.id} className="rounded-3xl border border-rose-900/10 bg-white p-4 shadow-sm shadow-rose-900/5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-lg font-bold leading-tight text-rose-950">{e.nom}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-rose-900/60">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${COULEUR_PUCE[e.code]}`}>{COULEURS[e.code]?.nom}</span>
                  {a && (
                    <span>
                      {PAYS[a.pays].drapeau} {a.region}
                    </span>
                  )}
                  {e.prixCible != null && <span>· env. {Math.round(e.prixCible)} €</span>}
                </p>
                {STYLE_PAR_ID[e.styleId] && <p className="mt-1 text-xs text-rose-900/50">{STYLE_PAR_ID[e.styleId].nom}</p>}
                {e.plat && <p className="mt-1.5 text-sm text-rose-950/70">Repéré pour : {e.plat}</p>}
              </div>
              <button
                onClick={() => window.confirm('Retirer de la liste ?') && supprimerEnvie(e.id)}
                className="p-2 text-rose-700/60"
                aria-label="Retirer"
              >
                <Trash2 size={17} />
              </button>
            </div>
            <div className="mt-3">
              <button
                onClick={() =>
                  onAcheter({
                    prefill: { envieId: e.id, appellationId: e.appellationId, appellationLibre: e.appellationLibre, nom: e.nom, code: e.code, styleId: e.styleId, prixAchat: e.prixCible },
                  })
                }
                className={boutonDoux}
              >
                ✅ Je l’ai acheté
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
