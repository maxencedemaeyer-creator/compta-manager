import { useMemo, useState } from 'react'
import { Check, Copy, Search, Trash2 } from 'lucide-react'
import { champ, bouton, boutonDoux } from './ui.jsx'
import { APPELLATIONS, PAYS, chercherAppellations } from '../../lib/cave/appellations.js'
import { CEPAGES } from '../../data/cave/cepages.js'
import { LEXIQUE } from '../../lib/cave/plat.js'
import { STYLES, COULEURS } from '../../data/cave/styles.js'
import { texteEnrichissement } from '../../lib/cave/exportClaude.js'
import { effacerManques } from '../../hooks/useCave.js'

const GENRES = [
  ['appellation', '🍇 Appellations absentes'],
  ['plat', '🍽 Plats non reconnus'],
  ['cepage', '🌿 Cépages absents'],
]

async function copier(texte) {
  try {
    await navigator.clipboard.writeText(texte)
    return true
  } catch {
    const zone = document.createElement('textarea')
    zone.value = texte
    zone.style.position = 'fixed'
    zone.style.opacity = '0'
    document.body.appendChild(zone)
    zone.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(zone)
    return ok
  }
}

export default function DonneesTab({ manques }) {
  const [copie, setCopie] = useState(false)
  const [recherche, setRecherche] = useState('')
  const texte = useMemo(() => texteEnrichissement(manques), [manques])
  const trouves = useMemo(() => (recherche.trim().length >= 2 ? chercherAppellations(recherche, 6) : []), [recherche])
  const nbFR = APPELLATIONS.filter((a) => a.pays === 'FR').length
  const nbIT = APPELLATIONS.length - nbFR

  const copierPourClaude = async () => {
    if (await copier(texte)) {
      setCopie(true)
      setTimeout(() => setCopie(false), 2500)
    }
  }
  const toutEffacer = async () => {
    if (!window.confirm('Effacer toute la liste ? À faire une fois que Claude a ajouté ces éléments à la base.')) return
    await effacerManques(manques.map((m) => m.id)).catch(() => {})
  }

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3">
        {[
          [APPELLATIONS.length, `appellations (${PAYS.FR.drapeau} ${nbFR} · ${PAYS.IT.drapeau} ${nbIT})`],
          [CEPAGES.length, 'cépages'],
          [STYLES.length, 'styles de vin'],
          [LEXIQUE.reduce((n, e) => n + e.cles.length, 0), 'mots de cuisine'],
        ].map(([n, label]) => (
          <div key={label} className="rounded-3xl bg-white p-4 border border-rose-900/10">
            <p className="text-2xl font-extrabold text-rose-950">{n}</p>
            <p className="text-xs text-rose-900/60">{label}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-xl font-extrabold text-rose-950">Ce que la base ne connaît pas encore</h2>
        <p className="mt-1 text-sm text-rose-900/60">
          Les appellations, cépages et plats que tu as écrits librement arrivent ici. Copie la liste, donne-la à Claude (dans une session du dépôt compta-manager) : il complète la base.
        </p>

        {manques.length === 0 ? (
          <p className="mt-4 rounded-3xl border-2 border-dashed border-rose-200 bg-white/70 px-5 py-6 text-center text-rose-900/60">
            Rien pour l’instant : la base a tout reconnu. 🎉
          </p>
        ) : (
          <>
            <div className="mt-4 space-y-4">
              {GENRES.map(([genre, titre]) => {
                const liste = manques.filter((m) => m.genre === genre)
                if (!liste.length) return null
                return (
                  <div key={genre} className="rounded-3xl bg-white p-4 border border-rose-900/10">
                    <p className="font-bold text-rose-950">
                      {titre} ({liste.length})
                    </p>
                    <ul className="mt-2 divide-y divide-rose-900/5">
                      {liste.map((m) => (
                        <li key={m.id} className="flex items-center justify-between gap-2 py-2">
                          <span className="min-w-0 text-sm text-rose-950">
                            <span className="font-medium">{m.texte}</span>
                            {m.contexte && <span className="block text-xs text-rose-900/50">{m.contexte}</span>}
                          </span>
                          <span className="flex shrink-0 items-center gap-2 text-xs text-rose-900/50">
                            {m.nb > 1 && <span>×{m.nb}</span>}
                            <button onClick={() => effacerManques([m.id]).catch(() => {})} className="p-1.5 text-rose-700/60" aria-label="Retirer">
                              <Trash2 size={15} />
                            </button>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={copierPourClaude} className={`${bouton} flex-1`}>
                {copie ? <Check size={18} /> : <Copy size={18} />}
                {copie ? 'Copié !' : 'Copier pour Claude'}
              </button>
              <button onClick={toutEffacer} className={boutonDoux}>
                Tout effacer
              </button>
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-semibold text-rose-700">Voir le texte qui sera copié</summary>
              <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-2xl bg-white p-3 text-xs text-rose-950/80 border border-rose-900/10">{texte}</pre>
            </details>
          </>
        )}
      </section>

      <section>
        <h2 className="text-xl font-extrabold text-rose-950">Parcourir la base</h2>
        <div className="relative mt-3">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-rose-900/40" />
          <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Une appellation…" className={`${champ} pl-11`} />
        </div>
        {recherche.trim().length >= 2 && trouves.length === 0 && (
          <p className="mt-3 text-sm text-amber-700">Pas dans la base. Ajoute-la à une bouteille : elle sera signalée ici.</p>
        )}
        <ul className="mt-3 space-y-2">
          {trouves.map((a) => (
            <li key={a.id} className="rounded-2xl bg-white p-3 border border-rose-900/10">
              <p className="font-bold text-rose-950">
                {a.nom} <span className="text-sm font-normal text-rose-900/50">{PAYS[a.pays].drapeau} {a.region}</span>
              </p>
              {a.types.map((t) => (
                <p key={t.code} className="mt-1 text-sm text-rose-900/70">
                  {COULEURS[t.code].emoji} {COULEURS[t.code].nom} · {STYLES.find((s) => s.id === t.style).nom} · env. {t.prix} €
                  {t.cepages.length ? ` · ${t.cepages.join(', ')}` : ''}
                </p>
              ))}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
