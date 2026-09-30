import { useMemo, useState } from 'react'
import attendusP5P6 from '../data/labo/programme_francais_P5-P6_attendus.json'

const DOMAINE_COLORS = {
  Lire: 'bg-sky-100 text-sky-700 border-sky-200',
  Parler: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Écouter: 'bg-violet-100 text-violet-700 border-violet-200',
  Écrire: 'bg-amber-100 text-amber-700 border-amber-200',
}

const MENTION_COLORS = {
  Compétence: 'bg-slate-800 text-white',
  Savoir: 'bg-slate-200 text-slate-700',
  'Savoir-faire': 'bg-slate-100 text-slate-600 border border-slate-300',
}

function normalize(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export default function LabView() {
  const [search, setSearch] = useState('')
  const [domaine, setDomaine] = useState('Tous')
  const [niveau, setNiveau] = useState('Tous')
  const [mention, setMention] = useState('Tous')

  const domaines = useMemo(
    () => ['Tous', ...Array.from(new Set(attendusP5P6.map((a) => a.domaine_nom)))],
    []
  )
  const niveaux = useMemo(
    () => ['Tous', ...Array.from(new Set(attendusP5P6.map((a) => a.niveau))).sort()],
    []
  )
  const mentions = useMemo(
    () => ['Tous', ...Array.from(new Set(attendusP5P6.map((a) => a.mention)))],
    []
  )

  const filtered = useMemo(() => {
    const q = normalize(search)
    return attendusP5P6.filter((a) => {
      if (domaine !== 'Tous' && a.domaine_nom !== domaine) return false
      if (niveau !== 'Tous' && a.niveau !== niveau) return false
      if (mention !== 'Tous' && a.mention !== mention) return false
      if (
        q &&
        !normalize(`${a.libelle} ${a.attendu} ${a.categorie_nom} ${a.sous_categorie_nom}`).includes(q)
      ) {
        return false
      }
      return true
    })
  }, [search, domaine, niveau, mention])

  const groups = useMemo(() => {
    const byDomaine = new Map()
    for (const item of filtered) {
      if (!byDomaine.has(item.domaine_nom)) {
        byDomaine.set(item.domaine_nom, { numero: item.domaine_numero, categories: new Map() })
      }
      const domaineGroup = byDomaine.get(item.domaine_nom)
      const catKey = `${item.categorie_numero} ${item.categorie_nom}`
      if (!domaineGroup.categories.has(catKey)) {
        domaineGroup.categories.set(catKey, new Map())
      }
      const catGroup = domaineGroup.categories.get(catKey)
      const sousKey = `${item.sous_categorie_numero} ${item.sous_categorie_nom}`
      if (!catGroup.has(sousKey)) {
        catGroup.set(sousKey, [])
      }
      catGroup.get(sousKey).push(item)
    }
    return Array.from(byDomaine.entries()).sort((a, b) => a[1].numero - b[1].numero)
  }, [filtered])

  return (
    <div className="min-h-screen bg-slate-50 px-4 sm:px-8 py-6 sm:py-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Labo — brouillon, hors Compta Manager
            </p>
            <h1 className="text-2xl font-semibold text-slate-800 mt-1">
              Programme Français — P5-P6
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {filtered.length} attendu{filtered.length > 1 ? 's' : ''} sur {attendusP5P6.length}
            </p>
          </div>
          <a href="/" className="text-xs text-slate-400 hover:text-slate-600 shrink-0 mt-1">
            ← Compta Manager
          </a>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (ex: accorder, lecture, ponctuation…)"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
          <select
            value={domaine}
            onChange={(e) => setDomaine(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
          >
            {domaines.map((d) => (
              <option key={d} value={d}>
                {d === 'Tous' ? 'Tous les domaines' : d}
              </option>
            ))}
          </select>
          <select
            value={niveau}
            onChange={(e) => setNiveau(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
          >
            {niveaux.map((n) => (
              <option key={n} value={n}>
                {n === 'Tous' ? 'Tous les niveaux' : n}
              </option>
            ))}
          </select>
          <select
            value={mention}
            onChange={(e) => setMention(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
          >
            {mentions.map((m) => (
              <option key={m} value={m}>
                {m === 'Tous' ? 'Toutes les mentions' : m}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-8">
          {groups.map(([domaineNom, domaineGroup]) => (
            <div key={domaineNom}>
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border mb-3 ${
                  DOMAINE_COLORS[domaineNom] || 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {domaineGroup.numero}. {domaineNom}
              </div>

              <div className="space-y-5">
                {Array.from(domaineGroup.categories.entries()).map(([catKey, sousMap]) => (
                  <div key={catKey}>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">{catKey}</h3>
                    <div className="space-y-4">
                      {Array.from(sousMap.entries()).map(([sousKey, items]) => (
                        <div
                          key={sousKey}
                          className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                        >
                          <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-sm text-slate-600 italic">
                            {sousKey}
                          </div>
                          <ul className="divide-y divide-slate-100">
                            {items.map((item) => (
                              <li
                                key={item.id}
                                className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2"
                              >
                                <div className="flex-1">
                                  <p className="text-sm text-slate-800">{item.attendu}</p>
                                  <p className="text-xs text-slate-400 mt-0.5">{item.libelle}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full ${
                                      MENTION_COLORS[item.mention] || 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    {item.mention}
                                  </span>
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                                    {item.niveau}
                                  </span>
                                  <span className="text-xs text-slate-300">p.{item.page}</span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {groups.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-12">
              Aucun attendu ne correspond à ces filtres.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
