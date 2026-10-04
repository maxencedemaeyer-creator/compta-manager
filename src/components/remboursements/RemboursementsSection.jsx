import { useMemo, useState } from 'react'
import { Plus, Check, Trash2, ChevronDown } from 'lucide-react'
import Card from '../ui/Card.jsx'
import Button from '../ui/Button.jsx'
import { formatDate, formatEuros } from '../../utils/format.js'

function millis(ts) {
  if (!ts) return 0
  return ts.toMillis ? ts.toMillis() : new Date(ts).getTime()
}

// Une section = "Je dois" ou "On me doit". Liste les remboursements en cours regroupés par personne
// (avec le total par personne), puis un historique repliable des remboursements déjà payés.
export default function RemboursementsSection({
  titre,
  couleur, // 'red' | 'emerald' : couleur du montant par personne
  libellePayer, // texte du bouton, ex. "J'ai payé" / "A payé"
  messageVide,
  entries,
  onAjouter,
  onPayerUn,
  onPayerPlusieurs,
  onDelete,
}) {
  const [historiqueOuvert, setHistoriqueOuvert] = useState(false)

  const { groupes, archives } = useMemo(() => {
    const enCours = entries.filter((e) => !e.paye)
    const payes = entries.filter((e) => e.paye)

    // Regroupement par personne, insensible à la casse ("ludovic" = "Ludovic").
    const map = new Map()
    for (const e of enCours) {
      const key = e.personne.trim().toLowerCase()
      if (!map.has(key)) map.set(key, { nom: e.personne.trim(), lignes: [] })
      map.get(key).lignes.push(e)
    }
    const groupes = Array.from(map.values())
      .map((g) => ({
        ...g,
        lignes: g.lignes.sort((a, b) => millis(a.createdAt) - millis(b.createdAt)),
        total: g.lignes.reduce((sum, l) => sum + l.montant, 0),
      }))
      .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))

    const archives = payes.sort((a, b) => millis(b.datePaye) - millis(a.datePaye))
    return { groupes, archives }
  }, [entries])

  const couleurMontant = couleur === 'emerald' ? 'text-emerald-600' : 'text-red-600'

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-slate-900">{titre}</h2>
        <Button variant="secondary" onClick={onAjouter}>
          <Plus size={16} />
          Ajouter
        </Button>
      </div>

      {groupes.length === 0 && (
        <Card>
          <p className="text-sm text-slate-500 text-center py-4">{messageVide}</p>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {groupes.map((g) => (
          <Card key={g.nom}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-slate-900">{g.nom}</h3>
              <p className={`font-bold tabular-nums ${couleurMontant}`}>{formatEuros(g.total)}</p>
            </div>
            <div>
              {g.lignes.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center gap-2 py-2 border-b border-slate-100 last:border-0"
                >
                  <p className="flex-1 min-w-0 text-sm text-slate-600 truncate">
                    {l.motif || 'Sans libellé'}
                  </p>
                  <p className="text-sm text-slate-800 tabular-nums">{formatEuros(l.montant)}</p>
                  {g.lignes.length > 1 && (
                    <button
                      onClick={() => onPayerUn(l.id)}
                      className="p-1.5 text-slate-300 hover:text-emerald-600"
                      aria-label="Marquer cette ligne comme payée"
                      title="Marquer cette ligne seule comme payée"
                    >
                      <Check size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(l.id)}
                    className="p-1.5 text-slate-300 hover:text-red-500"
                    aria-label="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <Button
              variant="success"
              className="w-full mt-3"
              onClick={() => onPayerPlusieurs(g.lignes.map((l) => l.id))}
            >
              <Check size={16} />
              {libellePayer}
            </Button>
          </Card>
        ))}
      </div>

      {archives.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setHistoriqueOuvert((o) => !o)}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            <ChevronDown
              size={16}
              className={`transition-transform ${historiqueOuvert ? 'rotate-180' : ''}`}
            />
            Historique ({archives.length})
          </button>
          {historiqueOuvert && (
            <Card className="mt-2">
              {archives.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {a.personne}
                      {a.motif ? ` · ${a.motif}` : ''}
                    </p>
                    <p className="text-xs text-slate-500">Payé le {formatDate(a.datePaye)}</p>
                  </div>
                  <p className="text-sm text-slate-700 tabular-nums">{formatEuros(a.montant)}</p>
                  <button
                    onClick={() => onDelete(a.id)}
                    className="p-1.5 text-slate-300 hover:text-red-500"
                    aria-label="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}
    </section>
  )
}
