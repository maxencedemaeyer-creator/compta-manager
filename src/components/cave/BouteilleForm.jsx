import { useEffect, useMemo, useRef, useState } from 'react'
import { Camera, Plus, Trash2, X } from 'lucide-react'
import Feuille, { champ, bouton, boutonDoux, Etiquette, pastille } from './ui.jsx'
import { COULEURS, STYLE_PAR_ID } from '../../data/cave/styles.js'
import { CEPAGES } from '../../data/cave/cepages.js'
import { ENTREES, PAYS, chercherAppellations, normaliser, trouverAppellationParId } from '../../lib/cave/appellations.js'
import { stylesDeCouleur } from '../../lib/cave/bouteille.js'
import { statutGarde } from '../../lib/cave/accord.js'
import { enregistrerBouteille, lirePhotoBouteille, signaler, supprimerBouteille } from '../../hooks/useCave.js'

// =============================================================
//  Fiche d'une bouteille : photo de l'étiquette + infos encodées à la main
//  L'appellation se choisit dans la base, ou s'écrit librement si elle n'y est pas
//  (elle est alors signalée dans l'onglet Données, pour enrichir la base).
// =============================================================
const CODES = ['R', 'B', 'P', 'E', 'D', 'F']
const CEPAGES_NOMS = CEPAGES.map((c) => c.nom)

function etatInitial(b, prefill) {
  const base = b || prefill || {}
  return {
    appellationId: base.appellationId || null,
    appellationLibre: base.appellationLibre || '',
    code: base.code || 'R',
    styleId: base.styleId || '',
    cepages: base.cepages || [],
    millesime: base.millesime ?? '',
    quantite: base.quantite ?? 1,
    prixAchat: base.prixAchat ?? '',
    producteur: base.producteur || '',
    cuvee: base.cuvee || '',
    emplacement: base.emplacement || '',
    notes: base.notes || '',
    apogeeDe: base.apogeeDe ?? '',
    apogeeA: base.apogeeA ?? '',
  }
}

export default function BouteilleForm({ bouteille, prefill, onClose, onSaved }) {
  const [f, setF] = useState(() => etatInitial(bouteille, prefill))
  const [recherche, setRecherche] = useState(() => (bouteille ? bouteille.nom : prefill?.nom || ''))
  const [liste, setListe] = useState(false)
  const [photo, setPhoto] = useState(undefined) // File | null | undefined
  const [apercu, setApercu] = useState(bouteille?.miniature || '')
  const [cepageSaisi, setCepageSaisi] = useState('')
  const [occupe, setOccupe] = useState(false)
  const [erreur, setErreur] = useState('')
  const inputPhoto = useRef(null)

  const maj = (champs) => setF((x) => ({ ...x, ...champs }))
  const appellation = trouverAppellationParId(f.appellationId)
  const libre = !appellation && recherche.trim().length > 0

  // Entrée de la base pour (appellation, couleur) : donne style, garde et cépages par défaut
  const entree = useMemo(
    () => (appellation ? ENTREES.find((e) => e.appellationId === appellation.id && e.code === f.code) : null),
    [appellation, f.code]
  )
  const stylesPossibles = stylesDeCouleur(f.code)
  const styleId = f.styleId && STYLE_PAR_ID[f.styleId]?.couleur === f.code ? f.styleId : entree?.style.id || stylesPossibles[0]?.id
  const style = STYLE_PAR_ID[styleId]

  // Quand un vin de la base est choisi, on met la couleur la plus courante et on retire le style imposé
  const choisir = (a) => {
    const code = a.types.some((t) => t.code === f.code) ? f.code : a.types[0].code
    maj({ appellationId: a.id, appellationLibre: '', code, styleId: '', cepages: f.cepages.length ? f.cepages : [] })
    setRecherche(a.nom)
    setListe(false)
  }
  const suggestions = useMemo(() => (liste && recherche.trim().length >= 2 ? chercherAppellations(recherche, 8) : []), [liste, recherche])

  useEffect(() => {
    let vivant = true
    if (bouteille?.miniature) lirePhotoBouteille(bouteille.id).then((src) => vivant && src && setApercu(src)).catch(() => {})
    return () => {
      vivant = false
    }
  }, [bouteille])

  const surPhoto = (e) => {
    const fichier = e.target.files?.[0]
    if (!fichier) return
    setPhoto(fichier)
    setApercu(URL.createObjectURL(fichier))
  }

  const ajouterCepage = (nom) => {
    const propre = nom.trim()
    if (!propre) return
    if (!f.cepages.some((c) => normaliser(c) === normaliser(propre))) maj({ cepages: [...f.cepages, propre] })
    setCepageSaisi('')
  }

  const garde = useMemo(() => {
    const g = entree && entree.style.id === styleId ? entree.garde : style?.garde
    return statutGarde({ millesime: f.millesime, garde: g, apogeeDe: f.apogeeDe, apogeeA: f.apogeeA })
  }, [entree, style, styleId, f.millesime, f.apogeeDe, f.apogeeA])

  const enregistrer = async (e) => {
    e.preventDefault()
    if (!appellation && !recherche.trim()) return setErreur('Choisis ou écris une appellation.')
    setOccupe(true)
    setErreur('')
    try {
      const champs = {
        ...f,
        appellationId: appellation?.id || null,
        appellationLibre: appellation ? '' : recherche,
        styleId,
        cepages: f.cepages.length || !entree ? f.cepages : [],
      }
      await enregistrerBouteille({ id: bouteille?.id, champs, photo, avant: bouteille })
      // Ce que la base ne connaît pas : on le garde pour l'enrichir plus tard (sans bloquer)
      if (!appellation) signaler('appellation', recherche, `${COULEURS[f.code].nom}, style ${styleId}`).catch(() => {})
      for (const c of f.cepages) if (!CEPAGES_NOMS.some((n) => normaliser(n) === normaliser(c))) signaler('cepage', c).catch(() => {})
      onSaved?.()
      onClose()
    } catch (err) {
      setErreur(err.message || 'Enregistrement impossible.')
      setOccupe(false)
    }
  }

  const supprimer = async () => {
    if (!window.confirm('Supprimer cette bouteille de la cave ?')) return
    setOccupe(true)
    try {
      await supprimerBouteille(bouteille.id)
      onClose()
    } catch (err) {
      setErreur(err.message)
      setOccupe(false)
    }
  }

  return (
    <Feuille open onClose={onClose} titre={bouteille ? 'Modifier la bouteille' : 'Nouvelle bouteille'} large>
      <form onSubmit={enregistrer} className="space-y-5">
        {/* Photo */}
        <div className="flex items-center gap-4">
          <div className="h-24 w-20 shrink-0 overflow-hidden rounded-2xl bg-rose-50 flex items-center justify-center text-rose-300">
            {apercu ? <img src={apercu} alt="Étiquette" className="h-full w-full object-cover" /> : <Camera size={28} />}
          </div>
          <div className="flex flex-col gap-2">
            <button type="button" onClick={() => inputPhoto.current?.click()} className={boutonDoux}>
              <Camera size={18} />
              {apercu ? 'Changer la photo' : 'Photo de l’étiquette'}
            </button>
            {apercu && (
              <button
                type="button"
                onClick={() => {
                  setPhoto(null)
                  setApercu('')
                }}
                className="text-sm text-rose-700/70 underline"
              >
                Retirer la photo
              </button>
            )}
            <input ref={inputPhoto} type="file" accept="image/*" capture="environment" onChange={surPhoto} className="hidden" />
          </div>
        </div>

        {/* Appellation */}
        <div className="relative">
          <Etiquette>Appellation (AOC / AOP)</Etiquette>
          <input
            value={recherche}
            onChange={(e) => {
              setRecherche(e.target.value)
              setListe(true)
              if (appellation && e.target.value !== appellation.nom) maj({ appellationId: null })
            }}
            onFocus={() => setListe(true)}
            placeholder="Chablis, Barolo, Côtes du Rhône…"
            className={champ}
            autoComplete="off"
          />
          {appellation && (
            <p className="mt-1.5 text-sm text-rose-900/60">
              {PAYS[appellation.pays].drapeau} {appellation.region}
              {entree?.cepages.length ? ` · ${entree.cepages.slice(0, 4).join(', ')}` : ''}
            </p>
          )}
          {libre && !liste && <p className="mt-1.5 text-sm text-amber-700">Pas dans la base : elle sera ajoutée telle quelle et signalée pour être complétée.</p>}
          {liste && recherche.trim().length >= 2 && (
            <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-2xl border border-rose-900/10 bg-white shadow-xl">
              {suggestions.map((a) => (
                <li key={a.id}>
                  <button type="button" onClick={() => choisir(a)} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-rose-50">
                    <span className="min-w-0 truncate font-medium text-rose-950">{a.nom}</span>
                    <span className="shrink-0 text-xs text-rose-900/50">
                      {PAYS[a.pays].drapeau} {a.region}
                    </span>
                  </button>
                </li>
              ))}
              <li>
                <button type="button" onClick={() => setListe(false)} className="w-full px-4 py-2.5 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50">
                  ＋ Utiliser « {recherche.trim()} » tel quel
                </button>
              </li>
            </ul>
          )}
        </div>

        {/* Couleur et style */}
        <div>
          <Etiquette>Couleur</Etiquette>
          <div className="flex flex-wrap gap-2">
            {CODES.map((c) => {
              const dispo = !appellation || appellation.types.some((t) => t.code === c)
              return (
                <button key={c} type="button" onClick={() => maj({ code: c, styleId: '' })} className={`${pastille(f.code === c)} ${dispo ? '' : 'opacity-50'}`}>
                  {COULEURS[c].emoji} {COULEURS[c].nom}
                </button>
              )
            })}
          </div>
        </div>
        <div>
          <Etiquette>Style du vin</Etiquette>
          <select value={styleId || ''} onChange={(e) => maj({ styleId: e.target.value })} className={champ}>
            {stylesPossibles.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nom}
              </option>
            ))}
          </select>
          {style && <p className="mt-1.5 text-sm text-rose-900/60">Par exemple : {style.exemple}. C’est ce style qui sert aux accords avec les plats.</p>}
        </div>

        {/* Cépages */}
        <div>
          <Etiquette>Cépages (facultatif)</Etiquette>
          {(f.cepages.length > 0 || entree?.cepages.length > 0) && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {(f.cepages.length ? f.cepages : entree.cepages).map((c) => (
                <span key={c} className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-sm text-rose-900">
                  {c}
                  {f.cepages.length > 0 && (
                    <button type="button" onClick={() => maj({ cepages: f.cepages.filter((x) => x !== c) })} aria-label={`Retirer ${c}`}>
                      <X size={14} />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={cepageSaisi}
              onChange={(e) => setCepageSaisi(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault()
                  ajouterCepage(cepageSaisi)
                }
              }}
              list="cepages-cave"
              placeholder={entree?.cepages.length ? 'Autre cépage…' : 'Pinot noir, Syrah…'}
              className={champ}
            />
            <button type="button" onClick={() => ajouterCepage(cepageSaisi)} className={boutonDoux} aria-label="Ajouter le cépage">
              <Plus size={18} />
            </button>
          </div>
          <datalist id="cepages-cave">
            {CEPAGES_NOMS.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </div>

        {/* Détails */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Etiquette>Millésime</Etiquette>
            <input value={f.millesime} onChange={(e) => maj({ millesime: e.target.value })} inputMode="numeric" placeholder="2020" className={champ} />
          </div>
          <div>
            <Etiquette>Quantité</Etiquette>
            <input value={f.quantite} onChange={(e) => maj({ quantite: e.target.value })} inputMode="numeric" className={champ} />
          </div>
          <div>
            <Etiquette>Prix (€)</Etiquette>
            <input value={f.prixAchat} onChange={(e) => maj({ prixAchat: e.target.value })} inputMode="decimal" placeholder={entree ? String(entree.prix) : ''} className={champ} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Etiquette>Producteur</Etiquette>
            <input value={f.producteur} onChange={(e) => maj({ producteur: e.target.value })} placeholder="Domaine, château…" className={champ} />
          </div>
          <div>
            <Etiquette>Cuvée</Etiquette>
            <input value={f.cuvee} onChange={(e) => maj({ cuvee: e.target.value })} className={champ} />
          </div>
        </div>
        <div>
          <Etiquette>Emplacement</Etiquette>
          <input value={f.emplacement} onChange={(e) => maj({ emplacement: e.target.value })} placeholder="Casier 2, étagère du bas…" className={champ} />
        </div>

        {/* Garde */}
        <div className="rounded-2xl bg-rose-50 px-4 py-3">
          <p className="text-sm font-semibold text-rose-950/80">Fenêtre de garde</p>
          <p className="mt-0.5 text-sm text-rose-900/70">{f.millesime ? garde.texte : 'Ajoute un millésime pour calculer quand la boire.'}</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <input value={f.apogeeDe} onChange={(e) => maj({ apogeeDe: e.target.value })} inputMode="numeric" placeholder={garde.de ? `À boire dès ${garde.de}` : 'À boire dès (année)'} className={champ} />
            <input value={f.apogeeA} onChange={(e) => maj({ apogeeA: e.target.value })} inputMode="numeric" placeholder={garde.a ? `Jusqu’en ${garde.a}` : 'Jusqu’en (année)'} className={champ} />
          </div>
          <p className="mt-2 text-xs text-rose-900/50">Estimation d’après l’appellation. Remplace-la si tu connais l’avis du producteur.</p>
        </div>

        <div>
          <Etiquette>Notes</Etiquette>
          <textarea value={f.notes} onChange={(e) => maj({ notes: e.target.value })} rows={2} className={champ} placeholder="Cadeau de…, acheté à…" />
        </div>

        {erreur && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{erreur}</p>}

        <div className="flex gap-3">
          {bouteille && (
            <button type="button" onClick={supprimer} disabled={occupe} className={`${boutonDoux} text-rose-700`} aria-label="Supprimer">
              <Trash2 size={18} />
            </button>
          )}
          <button type="submit" disabled={occupe} className={`${bouton} flex-1`}>
            {occupe ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </Feuille>
  )
}
