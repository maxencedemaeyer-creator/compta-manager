import { useMemo, useState } from 'react'
import { Minus, Plus, Search } from 'lucide-react'
import BouteilleForm from './BouteilleForm.jsx'
import BoireForm from './BoireForm.jsx'
import { champ, bouton, pastille, COULEUR_PUCE, STATUT_GARDE } from './ui.jsx'
import { COULEURS } from '../../data/cave/styles.js'
import { statutGarde } from '../../lib/cave/accord.js'
import { normaliser } from '../../lib/cave/appellations.js'
import { titreBouteille } from '../../lib/cave/bouteille.js'
import { changerQuantite, supprimerEnvie } from '../../hooks/useCave.js'

const FILTRES_STATUT = [
  ['tous', 'Toutes'],
  ['boire', 'À boire'],
  ['vite', 'À boire bientôt'],
  ['jeune', 'Trop jeunes'],
  ['passe', 'Passées'],
  ['vide', 'Épuisées'],
]

export default function MaCaveTab({ bouteilles, formulaire, setFormulaire }) {
  const [couleur, setCouleur] = useState('tous')
  const [statut, setStatut] = useState('tous')
  const [recherche, setRecherche] = useState('')
  const [aBoire, setABoire] = useState(null)

  const enrichies = useMemo(() => bouteilles.map((b) => ({ ...b, etat: statutGarde({ millesime: b.millesime, garde: b.garde, apogeeDe: b.apogeeDe, apogeeA: b.apogeeA }) })), [bouteilles])
  const enStock = enrichies.filter((b) => (b.quantite || 0) > 0)
  const total = enStock.reduce((s, b) => s + (b.quantite || 0), 0)
  const valeur = enStock.reduce((s, b) => s + (b.quantite || 0) * (b.prixAchat || 0), 0)
  const urgentes = enStock.filter((b) => b.etat.statut === 'vite' || b.etat.statut === 'passe')

  const liste = useMemo(() => {
    const mots = normaliser(recherche).split(' ').filter(Boolean)
    return enrichies
      .filter((b) => (statut === 'vide' ? (b.quantite || 0) === 0 : (b.quantite || 0) > 0))
      .filter((b) => couleur === 'tous' || b.code === couleur)
      .filter((b) => statut === 'tous' || statut === 'vide' || b.etat.statut === statut)
      .filter((b) => {
        if (!mots.length) return true
        const cible = normaliser(`${b.nom} ${b.producteur} ${b.cuvee} ${b.millesime || ''} ${b.emplacement} ${b.vin.cepages.join(' ')} ${b.appellation?.region || ''}`)
        return mots.every((m) => cible.includes(m))
      })
  }, [enrichies, couleur, statut, recherche])

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-3 gap-3">
        {[
          [total, 'bouteilles'],
          [enStock.length, 'références'],
          [valeur ? `${Math.round(valeur)} €` : '—', 'valeur'],
        ].map(([n, label]) => (
          <div key={label} className="rounded-3xl bg-white p-4 text-center border border-rose-900/10">
            <p className="text-2xl font-extrabold text-rose-950">{n}</p>
            <p className="text-xs text-rose-900/60">{label}</p>
          </div>
        ))}
      </section>

      {urgentes.length > 0 && (
        <section className="rounded-3xl bg-amber-50 border border-amber-200 p-4">
          <p className="font-bold text-amber-900">⏳ À ne pas laisser passer</p>
          <ul className="mt-2 space-y-1.5">
            {urgentes.map((b) => (
              <li key={b.id}>
                <button onClick={() => setFormulaire(b)} className="flex w-full items-center justify-between gap-2 text-left text-sm text-amber-950">
                  <span className="truncate font-medium">{titreBouteille(b).titre}</span>
                  <span className="shrink-0 text-xs text-amber-800">{b.etat.texte}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-rose-900/40" />
          <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Chercher dans ma cave…" className={`${champ} pl-11`} />
        </div>
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          <button onClick={() => setCouleur('tous')} className={pastille(couleur === 'tous')}>
            Toutes couleurs
          </button>
          {Object.entries(COULEURS).map(([code, c]) => (
            <button key={code} onClick={() => setCouleur(code)} className={pastille(couleur === code)}>
              {c.emoji} {c.nom}
            </button>
          ))}
        </div>
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {FILTRES_STATUT.map(([id, label]) => (
            <button key={id} onClick={() => setStatut(id)} className={pastille(statut === id)}>
              {label}
            </button>
          ))}
        </div>
      </section>

      {liste.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-rose-200 bg-white/70 px-6 py-12 text-center">
          <p className="text-5xl">🍾</p>
          <p className="mt-3 text-lg font-semibold text-rose-950">{bouteilles.length === 0 ? 'Ta cave est vide' : 'Aucune bouteille ici'}</p>
          <p className="mt-1 text-sm text-rose-900/60">
            {bouteilles.length === 0 ? 'Ajoute ta première bouteille : une photo de l’étiquette, puis tu complètes les infos.' : 'Change les filtres pour en voir d’autres.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {liste.map((b) => {
            const { titre, sousTitre } = titreBouteille(b)
            const st = STATUT_GARDE[b.etat.statut]
            return (
              <li key={b.id} className="overflow-hidden rounded-3xl border border-rose-900/10 bg-white shadow-sm shadow-rose-900/5">
                <button onClick={() => setFormulaire(b)} className="flex w-full items-start gap-3 p-4 text-left active:opacity-70">
                  {b.miniature ? (
                    <img src={b.miniature} alt="" className="h-20 w-14 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <span className={`flex h-20 w-14 shrink-0 items-center justify-center rounded-xl text-2xl ${COULEUR_PUCE[b.code]}`}>{COULEURS[b.code].emoji}</span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-bold leading-tight text-rose-950">{titre}</span>
                    {sousTitre && <span className="block text-sm text-rose-900/60">{sousTitre}</span>}
                    <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-rose-900/60">
                      <span className={`rounded-full px-2 py-0.5 font-semibold ${COULEUR_PUCE[b.code]}`}>{COULEURS[b.code].nom}</span>
                      {b.appellation && <span>{b.appellation.region}</span>}
                      {b.emplacement && <span>📍 {b.emplacement}</span>}
                      {b.prixAchat != null && <span>{Math.round(b.prixAchat)} €</span>}
                    </span>
                    {st?.label && <span className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.classe}`}>{b.etat.texte}</span>}
                  </span>
                </button>
                <div className="flex items-center justify-between border-t border-rose-900/5 bg-rose-50/50 px-4 py-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => changerQuantite(b.id, (b.quantite || 0) - 1)}
                      disabled={(b.quantite || 0) <= 0}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-rose-800 border border-rose-900/10 disabled:opacity-30"
                      aria-label="Une de moins"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-8 text-center text-lg font-bold text-rose-950">{b.quantite || 0}</span>
                    <button
                      onClick={() => changerQuantite(b.id, (b.quantite || 0) + 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-rose-800 border border-rose-900/10"
                      aria-label="Une de plus"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  {(b.quantite || 0) > 0 && (
                    <button onClick={() => setABoire(b)} className="rounded-full bg-rose-700 px-4 py-2 text-sm font-semibold text-white active:bg-rose-900">
                      🍷 Je l’ouvre
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <button onClick={() => setFormulaire('nouveau')} className={`${bouton} w-full text-base`}>
        <Plus size={20} />
        Ajouter une bouteille
      </button>

      {formulaire && (
        <BouteilleForm
          bouteille={formulaire === 'nouveau' || formulaire.prefill ? null : formulaire}
          prefill={formulaire.prefill}
          onSaved={() => formulaire.prefill?.envieId && supprimerEnvie(formulaire.prefill.envieId).catch(() => {})}
          onClose={() => setFormulaire(null)}
        />
      )}
      {aBoire && <BoireForm bouteille={aBoire} onClose={() => setABoire(null)} />}
    </div>
  )
}
