import { useMemo, useState } from 'react'
import { ArrowRight, Check, ChevronDown, Inbox, Loader2, Plus, StickyNote, Trash2 } from 'lucide-react'
import Feuille from './Feuille.jsx'
import { boutonBlanc, boutonRose, champCouture } from './Vichy.jsx'
import {
  PARCOURS,
  enMs,
  envoyerDemande,
  modifierCommande,
  supprimerCommande,
  trouverStatutCommande,
} from '../../hooks/useCouture.js'

// =============================================================
//  Centrale des commandes de Julie : les demandes « J'en veux un ! »
//  (et celles ajoutées à la main), avec leur avancement.
// =============================================================
const FILTRES = [
  { id: 'a_traiter', nom: 'À traiter', statuts: ['nouvelle'] },
  { id: 'en_cours', nom: 'En cours', statuts: ['acceptee', 'en_couture', 'prete'] },
  { id: 'terminees', nom: 'Terminées', statuts: ['remise', 'annulee'] },
  { id: 'toutes', nom: 'Toutes', statuts: null },
]

function quand(t) {
  const ms = enMs(t)
  if (!ms) return "à l'instant"
  const jours = Math.floor((Date.now() - ms) / 86400000)
  if (jours === 0) {
    const h = Math.floor((Date.now() - ms) / 3600000)
    return h <= 0 ? "il y a quelques minutes" : `il y a ${h} h`
  }
  if (jours === 1) return 'hier'
  if (jours < 7) return `il y a ${jours} jours`
  return new Date(ms).toLocaleDateString('fr-BE', { day: 'numeric', month: 'short' })
}

function CarteCommande({ commande, article }) {
  const [ouverte, setOuverte] = useState(commande.statut === 'nouvelle')
  const [note, setNote] = useState(commande.note || '')
  const [prix, setPrix] = useState(commande.prix ?? '')
  const [confirmeSuppr, setConfirmeSuppr] = useState(false)
  const statut = trouverStatutCommande(commande.statut)
  const position = PARCOURS.indexOf(commande.statut)
  const suivant = position >= 0 && position < PARCOURS.length - 1 ? trouverStatutCommande(PARCOURS[position + 1]) : null
  const terminee = ['remise', 'annulee'].includes(commande.statut)

  const changer = (champs) => modifierCommande(commande.id, champs).catch((e) => alert(e.message))

  function enregistrerPrix() {
    const valeur = String(prix).replace(',', '.').trim()
    const nombre = valeur === '' ? null : Number(valeur)
    if (nombre !== null && Number.isNaN(nombre)) return
    if (nombre !== (commande.prix ?? null)) changer({ prix: nombre })
  }

  return (
    <div className={`couture-apparait rounded-[1.6rem] bg-white ring-1 ${commande.statut === 'nouvelle' ? 'ring-pink-300' : 'ring-pink-100'} shadow-[0_10px_30px_-22px_rgba(131,24,67,0.5)] ${terminee ? 'opacity-75' : ''}`}>
      <button onClick={() => setOuverte((o) => !o)} className="w-full flex items-center gap-3 p-3 text-left">
        {article?.couverture ? (
          <img src={article.couverture} alt="" className="w-14 h-14 rounded-2xl object-cover shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-2xl vichy-fin shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-pink-950 truncate">{commande.nom}</p>
          <p className="text-sm text-pink-900/60 truncate">{commande.articleNom}</p>
          <p className="text-[11px] text-pink-900/40 mt-0.5">
            {quand(commande.creeLe)}
            {commande.source === 'manuel' && ' · ajoutée par toi'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${statut.pastille}`}>
            {statut.emoji} {statut.nom}
          </span>
          <ChevronDown size={16} className={`text-pink-300 transition-transform ${ouverte ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {ouverte && (
        <div className="px-3 pb-3 space-y-3">
          <div className="rounded-2xl bg-pink-50/70 px-3.5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-pink-400 mb-1">Ses envies</p>
            <p className="text-sm text-pink-950 whitespace-pre-line">{commande.details || 'Pas de précision.'}</p>
          </div>

          {/* Avancement */}
          <div className="flex items-center gap-1">
            {PARCOURS.map((id, i) => {
              const s = trouverStatutCommande(id)
              const fait = commande.statut !== 'annulee' && i <= position
              return (
                <button
                  key={id}
                  onClick={() => changer({ statut: id })}
                  title={s.nom}
                  className={`flex-1 h-8 rounded-full text-sm flex items-center justify-center transition ${
                    fait ? 'bg-pink-500 text-white shadow-sm' : 'bg-pink-50 text-pink-300 hover:bg-pink-100'
                  }`}
                >
                  {s.emoji}
                </button>
              )
            })}
          </div>

          <div className="flex gap-2">
            {suivant && (
              <button onClick={() => changer({ statut: suivant.id })} className={`${boutonRose} flex-1 py-2.5`}>
                {suivant.emoji} {suivant.nom} <ArrowRight size={15} />
              </button>
            )}
            {commande.statut === 'annulee' ? (
              <button onClick={() => changer({ statut: 'nouvelle' })} className={`${boutonBlanc} flex-1 py-2.5`}>
                Réactiver
              </button>
            ) : (
              commande.statut !== 'remise' && (
                <button onClick={() => changer({ statut: 'annulee' })} className={`${boutonBlanc} py-2.5`}>
                  Annuler
                </button>
              )
            )}
          </div>

          {/* Note privée */}
          <label className="block">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-pink-900/60 mb-1">
              <StickyNote size={13} /> Ma note (visible seulement par toi)
            </span>
            <textarea
              className={`${champCouture} min-h-[64px] py-2.5`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={() => note !== (commande.note || '') && changer({ note })}
              placeholder="Tissu choisi, mesures, date de remise…"
            />
          </label>

          {/* Prix discret + payé */}
          <div className="flex items-center gap-2 text-xs text-pink-900/50">
            <span>Prix</span>
            <input
              inputMode="decimal"
              className="w-20 rounded-xl border border-pink-100 bg-white px-2.5 py-1.5 text-sm text-pink-950 focus:outline-none focus:ring-2 focus:ring-pink-300"
              value={prix}
              onChange={(e) => setPrix(e.target.value)}
              onBlur={enregistrerPrix}
              placeholder="—"
            />
            <span>€</span>
            <button
              onClick={() => changer({ paye: !commande.paye })}
              className={`ml-auto inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-semibold ring-1 ${
                commande.paye ? 'bg-green-50 text-green-700 ring-green-200' : 'bg-white text-pink-900/50 ring-pink-100'
              }`}
            >
              {commande.paye && <Check size={13} />} {commande.paye ? 'Payé' : 'Pas encore payé'}
            </button>
          </div>

          {confirmeSuppr ? (
            <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-2 text-sm text-red-700">
              <span className="flex-1 pl-1">Supprimer cette commande ?</span>
              <button onClick={() => setConfirmeSuppr(false)} className="px-3 py-1.5 rounded-xl bg-white">
                Non
              </button>
              <button
                onClick={() => supprimerCommande(commande.id).catch((e) => alert(e.message))}
                className="px-3 py-1.5 rounded-xl bg-red-500 text-white font-semibold"
              >
                Oui
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmeSuppr(true)}
              className="inline-flex items-center gap-1.5 text-xs text-pink-900/35 hover:text-red-500"
            >
              <Trash2 size={13} /> Supprimer
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Commande reçue de vive voix : Julie l'ajoute elle-même
function NouvelleCommande({ open, onClose, articles }) {
  const [articleId, setArticleId] = useState('')
  const [nom, setNom] = useState('')
  const [details, setDetails] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')

  async function valider(e) {
    e.preventDefault()
    if (!nom.trim()) return setErreur('Indique le nom de la personne.')
    setEnvoi(true)
    try {
      await envoyerDemande({ article: articles.find((a) => a.id === articleId) || null, nom, details, source: 'manuel' })
      setNom('')
      setDetails('')
      setArticleId('')
      setErreur('')
      onClose()
    } catch (err) {
      setErreur(err.message || "L'enregistrement a échoué.")
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <Feuille open={open} onClose={onClose} titre="Ajouter une commande">
      <form onSubmit={valider}>
        <label className="block mb-4">
          <span className="block text-sm font-semibold text-pink-950 mb-1.5">Création</span>
          <select className={champCouture} value={articleId} onChange={(e) => setArticleId(e.target.value)}>
            <option value="">Création sur mesure</option>
            {articles.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nom}
              </option>
            ))}
          </select>
        </label>
        <label className="block mb-4">
          <span className="block text-sm font-semibold text-pink-950 mb-1.5">Pour qui ?</span>
          <input className={champCouture} value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom" />
        </label>
        <label className="block mb-5">
          <span className="block text-sm font-semibold text-pink-950 mb-1.5">Précisions</span>
          <textarea
            className={`${champCouture} min-h-[90px]`}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Taille, couleur, pour quand…"
          />
        </label>
        {erreur && <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{erreur}</p>}
        <button type="submit" disabled={envoi} className={`${boutonRose} w-full`}>
          {envoi && <Loader2 size={17} className="animate-spin" />} Ajouter
        </button>
      </form>
    </Feuille>
  )
}

export default function CommandesCentrale({ commandes, articles, chargement }) {
  const [filtre, setFiltre] = useState('a_traiter')
  const [ajout, setAjout] = useState(false)
  const parArticle = useMemo(() => Object.fromEntries(articles.map((a) => [a.id, a])), [articles])

  const compte = (f) => (f.statuts ? commandes.filter((c) => f.statuts.includes(c.statut)).length : commandes.length)
  const actif = FILTRES.find((f) => f.id === filtre)
  const liste = actif.statuts ? commandes.filter((c) => actif.statuts.includes(c.statut)) : commandes

  // Petit résumé en haut
  const enCouture = commandes.filter((c) => c.statut === 'en_couture').length
  const pretes = commandes.filter((c) => c.statut === 'prete').length
  const remisesAnnee = commandes.filter(
    (c) => c.statut === 'remise' && new Date(enMs(c.majLe) || Date.now()).getFullYear() === new Date().getFullYear()
  ).length

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { n: compte(FILTRES[0]), t: 'nouvelles', e: '💌' },
          { n: enCouture, t: 'en couture', e: '🧵' },
          { n: pretes, t: 'à remettre', e: '🎀' },
        ].map((x) => (
          <div key={x.t} className="rounded-2xl bg-white ring-1 ring-pink-100 px-3 py-2.5">
            <p className="text-xl font-semibold text-pink-950">
              {x.n} <span className="text-base">{x.e}</span>
            </p>
            <p className="text-[11px] text-pink-900/50">{x.t}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar flex-1">
          {FILTRES.map((f) => {
            const n = compte(f)
            return (
              <button
                key={f.id}
                onClick={() => setFiltre(f.id)}
                className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition ${
                  filtre === f.id ? 'bg-pink-500 text-white shadow-sm' : 'bg-white text-pink-900/60 ring-1 ring-pink-100'
                }`}
              >
                {f.nom}
                {n > 0 && <span className={`ml-1.5 text-xs ${filtre === f.id ? 'text-white/80' : 'text-pink-400'}`}>{n}</span>}
              </button>
            )
          })}
        </div>
        <button
          onClick={() => setAjout(true)}
          className="w-10 h-10 shrink-0 rounded-full bg-white ring-1 ring-pink-100 text-pink-600 flex items-center justify-center"
          aria-label="Ajouter une commande"
          title="Ajouter une commande"
        >
          <Plus size={18} />
        </button>
      </div>

      {chargement ? (
        <div className="py-16 flex justify-center text-pink-300">
          <Loader2 className="animate-spin" />
        </div>
      ) : liste.length === 0 ? (
        <div className="py-14 text-center">
          <span className="mx-auto w-14 h-14 rounded-full bg-white ring-1 ring-pink-100 flex items-center justify-center text-pink-300">
            <Inbox size={24} />
          </span>
          <p className="mt-3 couture-titre text-2xl text-pink-900">
            {filtre === 'a_traiter' ? 'Aucune nouvelle demande' : 'Rien ici pour le moment'}
          </p>
          <p className="mt-1 text-sm text-pink-900/50">Partage ta galerie pour recevoir des « J’en veux un ! »</p>
        </div>
      ) : (
        <div className="space-y-3">
          {liste.map((c) => (
            <CarteCommande key={c.id} commande={c} article={parArticle[c.articleId]} />
          ))}
        </div>
      )}

      {remisesAnnee > 0 && (
        <p className="mt-6 text-center text-xs text-pink-900/40">
          {remisesAnnee} création{remisesAnnee > 1 ? 's' : ''} remise{remisesAnnee > 1 ? 's' : ''} cette année 💝
        </p>
      )}

      <NouvelleCommande open={ajout} onClose={() => setAjout(false)} articles={articles} />
    </div>
  )
}

