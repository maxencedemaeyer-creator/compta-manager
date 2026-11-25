import { useMemo, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import Feuille, { champ, bouton, boutonDoux, Etiquette, Etoiles, COULEUR_PUCE } from './ui.jsx'
import { COULEURS } from '../../data/cave/styles.js'
import { modifierDegustation, supprimerDegustation } from '../../hooks/useCave.js'

const dateFr = (iso) => {
  if (!iso) return ''
  const [a, m, j] = iso.split('-')
  return `${j}/${m}/${a}`
}

export default function HistoriqueTab({ historique }) {
  const [edition, setEdition] = useState(null)

  const meilleurs = useMemo(() => {
    const parNom = {}
    for (const h of historique) {
      if (!h.note) continue
      const k = h.nom
      parNom[k] = parNom[k] || { nom: k, somme: 0, nb: 0 }
      parNom[k].somme += h.note
      parNom[k].nb += 1
    }
    return Object.values(parNom)
      .map((x) => ({ ...x, moyenne: x.somme / x.nb }))
      .sort((a, b) => b.moyenne - a.moyenne || b.nb - a.nb)
      .slice(0, 3)
  }, [historique])

  if (historique.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-rose-200 bg-white/70 px-6 py-12 text-center">
        <p className="text-5xl">📖</p>
        <p className="mt-3 text-lg font-semibold text-rose-950">Pas encore de dégustation</p>
        <p className="mt-1 text-sm text-rose-900/60">Quand tu ouvres une bouteille (« Je l’ouvre »), elle arrive ici avec ta note. Tes goûts guideront ensuite les suggestions.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {meilleurs.length > 0 && (
        <section className="rounded-3xl bg-white p-4 border border-rose-900/10">
          <p className="font-bold text-rose-950">⭐ Tes préférés</p>
          <ul className="mt-2 space-y-1.5">
            {meilleurs.map((m) => (
              <li key={m.nom} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate text-rose-950">{m.nom}</span>
                <Etoiles valeur={Math.round(m.moyenne)} taille={15} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <ul className="space-y-3">
        {historique.map((h) => (
          <li key={h.id} className="rounded-3xl border border-rose-900/10 bg-white p-4 shadow-sm shadow-rose-900/5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-lg font-bold leading-tight text-rose-950">
                  {h.nom} {h.millesime || ''}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-rose-900/60">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${COULEUR_PUCE[h.code] || ''}`}>{COULEURS[h.code]?.nom}</span>
                  <span>{dateFr(h.bueLe)}</span>
                  {[h.producteur, h.cuvee].filter(Boolean).length > 0 && <span>· {[h.producteur, h.cuvee].filter(Boolean).join(' · ')}</span>}
                </p>
              </div>
              <button onClick={() => setEdition(h)} className="p-2 text-rose-700/70" aria-label="Modifier">
                <Pencil size={17} />
              </button>
            </div>
            {h.plat && <p className="mt-2 text-sm text-rose-950/80">🍽 {h.plat}</p>}
            <div className="mt-2">
              <Etoiles valeur={h.note || 0} taille={18} />
            </div>
            {h.commentaire && <p className="mt-2 text-sm italic text-rose-950/70">« {h.commentaire} »</p>}
          </li>
        ))}
      </ul>

      {edition && <EditionDegustation h={edition} onClose={() => setEdition(null)} />}
    </div>
  )
}

function EditionDegustation({ h, onClose }) {
  const [plat, setPlat] = useState(h.plat || '')
  const [note, setNote] = useState(h.note || 0)
  const [commentaire, setCommentaire] = useState(h.commentaire || '')
  const [occupe, setOccupe] = useState(false)

  const enregistrer = async () => {
    setOccupe(true)
    try {
      await modifierDegustation(h.id, { plat, note, commentaire })
      onClose()
    } catch {
      setOccupe(false)
    }
  }
  const supprimer = async () => {
    if (!window.confirm('Supprimer ce souvenir ? (La bouteille ne revient pas dans la cave.)')) return
    setOccupe(true)
    try {
      await supprimerDegustation(h.id)
      onClose()
    } catch {
      setOccupe(false)
    }
  }

  return (
    <Feuille open onClose={onClose} titre={`${h.nom} ${h.millesime || ''}`}>
      <div className="space-y-4">
        <div>
          <Etiquette>Plat</Etiquette>
          <input value={plat} onChange={(e) => setPlat(e.target.value)} className={champ} />
        </div>
        <div>
          <Etiquette>Note</Etiquette>
          <Etoiles valeur={note} onChange={setNote} taille={30} />
        </div>
        <div>
          <Etiquette>Avis</Etiquette>
          <textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} rows={3} className={champ} />
        </div>
        <div className="flex gap-3">
          <button onClick={supprimer} disabled={occupe} className={`${boutonDoux} text-rose-700`} aria-label="Supprimer">
            <Trash2 size={18} />
          </button>
          <button onClick={enregistrer} disabled={occupe} className={`${bouton} flex-1`}>
            Enregistrer
          </button>
        </div>
      </div>
    </Feuille>
  )
}
