import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Plus, Search, X } from 'lucide-react'
import CarteVin from './CarteVin.jsx'
import BoireForm from './BoireForm.jsx'
import { champ, boutonDoux, pastille } from './ui.jsx'
import { AFFINAGES, PLATS_RAPIDES, analyserPlat, decrirePlat } from '../../lib/cave/plat.js'
import { BUDGETS, budgetParId, preferences, suggererDansLaCave, suggererHorsCave } from '../../lib/cave/accord.js'
import { PAYS, normaliser } from '../../lib/cave/appellations.js'
import { titreBouteille } from '../../lib/cave/bouteille.js'
import { ajouterEnvie, signaler } from '../../hooks/useCave.js'

// Plat compris « en gros » quand on ne sait pas plus : un tap pour guider la recherche
const GENERIQUES = [
  { label: 'Poisson', texte: 'poisson' },
  { label: 'Fruits de mer', texte: 'fruits de mer' },
  { label: 'Volaille', texte: 'poulet' },
  { label: 'Viande rouge', texte: 'boeuf' },
  { label: 'Agneau', texte: 'agneau' },
  { label: 'Gibier', texte: 'gibier' },
  { label: 'Charcuterie', texte: 'charcuterie' },
  { label: 'Légumes', texte: 'légumes' },
  { label: 'Pâtes', texte: 'pâtes' },
  { label: 'Fromage', texte: 'fromage' },
  { label: 'Dessert', texte: 'dessert' },
]

export default function CeSoirTab({ bouteilles, historique, envies, texteInitial = '' }) {
  const [texte, setTexte] = useState(texteInitial)
  const [ignores, setIgnores] = useState(() => new Set())
  const [ajouts, setAjouts] = useState([])
  const [budgetId, setBudgetId] = useState('tous')
  const [pays, setPays] = useState('tous')
  const [tri, setTri] = useState('accord')
  const [plus, setPlus] = useState(false)
  const [aBoire, setABoire] = useState(null)
  const [ajoutees, setAjoutees] = useState(() => new Set())
  const dejaSignale = useRef(new Set())

  const complet = `${texte} ${ajouts.join(' ')}`.trim()
  const plat = useMemo(() => (complet.length >= 2 ? analyserPlat(complet, ignores) : null), [complet, ignores])
  const prefs = useMemo(() => preferences(historique), [historique])
  const budget = budgetParId(budgetId)

  // Un plat que la base ne connaît pas : on le garde de côté pour l'enrichir (une seule fois par texte)
  useEffect(() => {
    const t = texte.trim()
    if (!plat || plat.reconnu || t.length < 3) return
    const cle = normaliser(t)
    if (dejaSignale.current.has(cle)) return
    const minuteur = setTimeout(() => {
      dejaSignale.current.add(cle)
      signaler('plat', t).catch(() => {})
    }, 1800)
    return () => clearTimeout(minuteur)
  }, [plat, texte])

  const enCave = useMemo(() => {
    if (!plat?.reconnu) return []
    return suggererDansLaCave(plat, bouteilles, { n: 3, prefs })
  }, [plat, bouteilles, prefs])

  const horsCave = useMemo(() => {
    if (!plat?.reconnu) return []
    const exclus = new Set(bouteilles.filter((b) => (b.quantite || 0) > 0 && b.appellationId).map((b) => `${b.appellationId}|${b.code}`))
    const liste = suggererHorsCave(plat, { budget, pays, exclus, prefs, n: 12 })
    if (tri === 'prix') return [...liste].sort((a, b) => a.entree.prix - b.entree.prix)
    if (tri === 'prixdesc') return [...liste].sort((a, b) => b.entree.prix - a.entree.prix)
    return liste
  }, [plat, bouteilles, budget, pays, prefs, tri])

  const choisirPlat = (t) => {
    setTexte(t)
    setIgnores(new Set())
    setAjouts([])
    setPlus(false)
  }
  const basculerAffinage = (t) => setAjouts((a) => (a.includes(t) ? a.filter((x) => x !== t) : [...a, t]))
  const basculerIgnore = (id) =>
    setIgnores((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const envieExiste = (e) => envies.some((v) => v.appellationId === e.appellationId && v.code === e.code)
  const ajouterALaListe = async (e) => {
    const cle = `${e.appellationId}|${e.code}`
    setAjoutees((s) => new Set(s).add(cle))
    try {
      await ajouterEnvie({ appellationId: e.appellationId, nom: e.nom, code: e.code, styleId: e.style.id, prixCible: e.prix, plat: texte })
    } catch {
      setAjoutees((s) => {
        const n = new Set(s)
        n.delete(cle)
        return n
      })
    }
  }

  const visibles = plus ? horsCave : horsCave.slice(0, 3)

  return (
    <div className="space-y-6">
      {/* Saisie du plat */}
      <section>
        <h2 className="text-2xl font-extrabold tracking-tight text-rose-950">Qu’est-ce qu’on mange ce soir ?</h2>
        <div className="relative mt-3">
          <Search size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-rose-900/40" />
          <input
            value={texte}
            onChange={(e) => {
              setTexte(e.target.value)
              setIgnores(new Set())
            }}
            placeholder="risotto aux champignons, côte de bœuf, sushi…"
            className={`${champ} pl-12 pr-11 text-base`}
            autoFocus
          />
          {texte && (
            <button onClick={() => choisirPlat('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-rose-900/40" aria-label="Effacer">
              <X size={18} />
            </button>
          )}
        </div>

        {!texte && (
          <div className="mt-4 flex flex-wrap gap-2">
            {PLATS_RAPIDES.map((p) => (
              <button key={p.texte} onClick={() => choisirPlat(p.texte)} className={pastille(false)}>
                {p.label}
              </button>
            ))}
          </div>
        )}
      </section>

      {plat && (
        <>
          {/* Ce que l'app a compris */}
          <section className="rounded-3xl bg-white/80 p-4 border border-rose-900/10">
            {plat.reconnu ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-900/50">J’ai compris</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {plat.parties.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => basculerIgnore(p.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                        p.actif ? 'bg-rose-100 text-rose-900' : 'bg-stone-100 text-stone-400 line-through'
                      }`}
                    >
                      {p.texte}
                      {p.actif ? <X size={13} /> : <Plus size={13} />}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-sm text-rose-900/70">Plat {decrirePlat(plat.profil)}</p>
              </>
            ) : (
              <>
                <p className="font-semibold text-rose-950">Je ne connais pas encore ce plat 🤔</p>
                <p className="mt-1 text-sm text-rose-900/60">
                  Dis-moi de quoi il s’agit en gros. Je note ton plat pour l’ajouter à ma base (onglet Données).
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {GENERIQUES.map((g) => (
                    <button key={g.texte} onClick={() => basculerAffinage(g.texte)} className={pastille(ajouts.includes(g.texte))}>
                      {g.label}
                    </button>
                  ))}
                </div>
              </>
            )}
            <details className="mt-3 group">
              <summary className="flex cursor-pointer list-none items-center gap-1 text-sm font-semibold text-rose-700">
                Préciser le plat <ChevronDown size={16} className="transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-2 flex flex-wrap gap-2">
                {AFFINAGES.map((a) => (
                  <button key={a.texte} onClick={() => basculerAffinage(a.texte)} className={pastille(ajouts.includes(a.texte))}>
                    {a.label}
                  </button>
                ))}
              </div>
            </details>
          </section>

          {plat.reconnu && (
            <>
              {/* Dans ma cave */}
              <section>
                <h3 className="mb-3 text-xl font-extrabold text-rose-950">🏠 Dans ma cave</h3>
                {bouteilles.filter((b) => b.quantite > 0).length === 0 ? (
                  <p className="rounded-3xl border-2 border-dashed border-rose-200 bg-white/70 px-5 py-6 text-center text-rose-900/60">
                    Ta cave est vide pour l’instant. Ajoute tes bouteilles dans l’onglet « Ma cave » : je te proposerai les meilleures pour ce plat.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {enCave.map((b, i) => {
                      const { titre, sousTitre } = titreBouteille(b)
                      return (
                        <CarteVin
                          key={b.id}
                          rang={i + 1}
                          titre={titre}
                          sousTitre={sousTitre}
                          code={b.vin.code}
                          styleNom={b.vin.style.nom}
                          accord={b.accord}
                          garde={b.garde}
                          quantite={b.quantite}
                          miniature={b.miniature}
                          actions={
                            <button onClick={() => setABoire(b)} className={boutonDoux}>
                              🍷 Je l’ouvre
                            </button>
                          }
                        />
                      )
                    })}
                  </ul>
                )}
              </section>

              {/* Hors cave */}
              <section>
                <h3 className="mb-1 text-xl font-extrabold text-rose-950">🛒 À acheter</h3>
                <p className="mb-3 text-sm text-rose-900/60">Les meilleurs accords parmi les appellations françaises et italiennes (prix moyens indicatifs).</p>

                <div className="-mx-5 mb-3 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
                  {BUDGETS.map((b) => (
                    <button key={b.id} onClick={() => setBudgetId(b.id)} className={pastille(budgetId === b.id)}>
                      {b.label}
                    </button>
                  ))}
                </div>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {[
                    ['tous', 'FR + IT'],
                    ['FR', `${PAYS.FR.drapeau} France`],
                    ['IT', `${PAYS.IT.drapeau} Italie`],
                  ].map(([id, label]) => (
                    <button key={id} onClick={() => setPays(id)} className={pastille(pays === id)}>
                      {label}
                    </button>
                  ))}
                  <select value={tri} onChange={(e) => setTri(e.target.value)} className="ml-auto rounded-full border border-rose-900/10 bg-white px-3 py-1.5 text-sm text-rose-900" aria-label="Trier">
                    <option value="accord">Meilleur accord</option>
                    <option value="prix">Prix croissant</option>
                    <option value="prixdesc">Prix décroissant</option>
                  </select>
                </div>

                {horsCave.length === 0 ? (
                  <p className="rounded-3xl border-2 border-dashed border-rose-200 bg-white/70 px-5 py-6 text-center text-rose-900/60">
                    Aucun vin de ma base dans cette fourchette de prix. Essaie un autre palier.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {visibles.map((c, i) => {
                      const e = c.entree
                      const cle = `${e.appellationId}|${e.code}`
                      const dejaListe = ajoutees.has(cle) || envieExiste(e)
                      return (
                        <CarteVin
                          key={cle}
                          rang={i + 1}
                          titre={e.nom}
                          sousTitre={`${PAYS[e.pays].drapeau} ${e.region}${e.cepages.length ? ` · ${e.cepages.slice(0, 3).join(', ')}` : ''}`}
                          code={e.code}
                          styleNom={e.style.nom}
                          accord={c.accord}
                          prix={e.prix}
                          actions={
                            <button onClick={() => !dejaListe && ajouterALaListe(e)} disabled={dejaListe} className={boutonDoux}>
                              {dejaListe ? <Check size={16} /> : <Plus size={16} />}
                              {dejaListe ? 'Dans ma liste' : 'Liste d’achats'}
                            </button>
                          }
                        />
                      )
                    })}
                  </ul>
                )}
                {horsCave.length > 3 && (
                  <button onClick={() => setPlus((p) => !p)} className="mx-auto mt-4 block text-sm font-semibold text-rose-700 underline-offset-2 hover:underline">
                    {plus ? 'Voir moins' : `Voir ${horsCave.length - 3} autres idées`}
                  </button>
                )}
              </section>
            </>
          )}
        </>
      )}

      {aBoire && <BoireForm bouteille={aBoire} plat={texte} onClose={() => setABoire(null)} />}
    </div>
  )
}
