import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  ClipboardCopy,
  MessageSquarePlus,
  Mic,
  MicOff,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import Modal from '../components/ui/Modal.jsx'
import { usePin } from '../context/PinContext.jsx'
import { PROFIL_PRINCIPAL, trouverProfil } from '../config/profils.js'
import { STATUTS, trouverStatut, useRequetes } from '../hooks/useRequetes.js'

// =============================================================
//  Application Requêtes (/maxence/requetes, /julie/requetes…)
//  - Chaque profil peut faire une demande (écrite ou dictée).
//  - Maxence voit toutes les demandes, change leur statut,
//    répond, et copie la demande pour la coller dans Claude.
//  - L'auteur voit le statut et la réponse de Maxence.
// =============================================================

const champClass =
  'w-full rounded-2xl border border-emerald-900/10 bg-white px-4 py-3 text-[15px] text-emerald-950 placeholder:text-emerald-900/30 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent'

function dateCourte(t) {
  if (!t?.toDate) return "à l'instant"
  const d = t.toDate()
  const memeAnnee = d.getFullYear() === new Date().getFullYear()
  return d.toLocaleDateString('fr-BE', { day: 'numeric', month: 'short', ...(memeAnnee ? {} : { year: 'numeric' }) })
}

function dateLongue(t) {
  if (!t?.toDate) return "aujourd'hui"
  return t.toDate().toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ---------- Dictée vocale (reconnaissance vocale du navigateur) ----------
const Reconnaissance =
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null

function useDictee(ajouterTexte) {
  const [actif, setActif] = useState(false)
  const [provisoire, setProvisoire] = useState('')
  const [erreur, setErreur] = useState('')
  const reco = useRef(null)
  const voulu = useRef(false)
  const ajouter = useRef(ajouterTexte)
  ajouter.current = ajouterTexte

  function arreter() {
    voulu.current = false
    setActif(false)
    setProvisoire('')
    try {
      reco.current?.stop()
    } catch {
      /* déjà arrêtée */
    }
  }

  function demarrer() {
    if (!Reconnaissance) return
    setErreur('')
    const r = new Reconnaissance()
    r.lang = 'fr-BE'
    r.interimResults = true
    // Sur Android, le mode continu répète les mots : on relance plutôt la dictée après chaque phrase
    r.continuous = !/Android/i.test(navigator.userAgent)
    r.onresult = (e) => {
      let enCours = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const texte = e.results[i][0].transcript
        if (e.results[i].isFinal) ajouter.current(texte)
        else enCours += texte
      }
      setProvisoire(enCours)
    }
    r.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return
      voulu.current = false
      setErreur(
        e.error === 'not-allowed' || e.error === 'service-not-allowed'
          ? "Le micro n'est pas autorisé. Autorise-le dans les réglages du navigateur."
          : 'La dictée s’est interrompue. Réessaie.'
      )
    }
    r.onend = () => {
      setProvisoire('')
      if (voulu.current) {
        try {
          r.start()
          return
        } catch {
          /* on arrête proprement ci-dessous */
        }
      }
      voulu.current = false
      setActif(false)
    }
    reco.current = r
    voulu.current = true
    try {
      r.start()
      setActif(true)
    } catch {
      voulu.current = false
      setErreur('Impossible de lancer la dictée.')
    }
  }

  useEffect(() => () => {
    voulu.current = false
    try {
      reco.current?.abort()
    } catch {
      /* rien */
    }
  }, [])

  return { disponible: !!Reconnaissance, actif, provisoire, erreur, demarrer, arreter }
}

// ---------- Pastilles ----------
function PastilleStatut({ statut, pourAuteur }) {
  const s = trouverStatut(statut)
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${s.pastille}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.point}`} />
      {pourAuteur ? s.nomAuteur : s.nom}
    </span>
  )
}

function PastilleAuteur({ auteurId, auteurNom }) {
  const profil = trouverProfil(auteurId)
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-900/60">
      <span
        className={`w-5 h-5 rounded-full bg-gradient-to-br ${profil?.couleur || 'from-slate-300 to-slate-500'} text-white text-[10px] font-bold flex items-center justify-center`}
      >
        {(auteurNom || '?').charAt(0).toUpperCase()}
      </span>
      {auteurNom}
    </span>
  )
}

// ---------- Formulaire (nouvelle demande / modification) ----------
function FormulaireRequete({ initial, onEnregistrer, onAnnuler }) {
  const [titre, setTitre] = useState(initial?.titre || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')

  const dictee = useDictee((texte) => {
    const propre = texte.trim()
    if (!propre) return
    setDescription((d) => {
      const base = d.replace(/\s+$/, '')
      const phrase = !base || /[.!?]$/.test(base) ? propre.charAt(0).toUpperCase() + propre.slice(1) : propre
      return base ? `${base} ${phrase}` : phrase
    })
  })

  async function envoyer(e) {
    e.preventDefault()
    if (dictee.actif) dictee.arreter()
    if (!description.trim() && !titre.trim()) {
      setErreur('Explique en quelques mots ce que tu aimerais.')
      return
    }
    setEnvoi(true)
    setErreur('')
    try {
      await onEnregistrer({
        titre: titre.trim() || description.trim().split(/[.!?\n]/)[0].slice(0, 60),
        description,
      })
    } catch (err) {
      setErreur(err.message || "La demande n'a pas pu être enregistrée.")
      setEnvoi(false)
    }
  }

  return (
    <form onSubmit={envoyer} className="space-y-4">
      <label className="block">
        <span className="block text-sm font-medium text-slate-700 mb-1.5">Titre</span>
        <input
          className={champClass}
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          placeholder="Ex. Une appli pour mes recettes"
          maxLength={80}
        />
      </label>

      <div>
        <span className="block text-sm font-medium text-slate-700 mb-1.5">Ton idée, en détail</span>
        <textarea
          className={`${champClass} min-h-[11rem] resize-y leading-relaxed`}
          value={dictee.provisoire ? `${description}${description ? ' ' : ''}${dictee.provisoire}` : description}
          onChange={(e) => !dictee.actif && setDescription(e.target.value)}
          readOnly={dictee.actif}
          placeholder="Ce que tu aimerais pouvoir faire, sur quel appareil, ce qui t'agace aujourd'hui…"
        />

        {dictee.disponible ? (
          <button
            type="button"
            onClick={dictee.actif ? dictee.arreter : dictee.demarrer}
            className={`mt-2 w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold transition-colors ${
              dictee.actif
                ? 'bg-red-500 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            {dictee.actif ? (
              <>
                <span className="relative flex w-2.5 h-2.5">
                  <span className="absolute inset-0 rounded-full bg-white/80 animate-ping" />
                  <span className="relative w-2.5 h-2.5 rounded-full bg-white" />
                </span>
                J’écoute… touche pour arrêter
                <MicOff size={16} />
              </>
            ) : (
              <>
                <Mic size={17} />
                Dicter à voix haute
              </>
            )}
          </button>
        ) : (
          <p className="mt-2 text-xs text-slate-500">
            Astuce : pour dicter, utilise le micro du clavier de ton téléphone.
          </p>
        )}
        {dictee.erreur && <p className="mt-2 text-xs text-red-600">{dictee.erreur}</p>}
      </div>

      {erreur && <p className="text-sm text-red-600">{erreur}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onAnnuler}
          className="flex-1 rounded-2xl py-3 text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={envoi}
          className="flex-[2] rounded-2xl py-3 text-sm font-semibold bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {envoi ? 'Envoi…' : initial ? 'Enregistrer' : 'Envoyer la demande'}
        </button>
      </div>
    </form>
  )
}

// ---------- Texte prêt à coller dans Claude ----------
function textePourClaude(r) {
  return [
    `Nouvelle requête pour mon site (espace ${r.auteurNom}) :`,
    '',
    `Demandée par : ${r.auteurNom}, le ${dateLongue(r.creeLe)}`,
    `Titre : ${r.titre}`,
    '',
    'Description :',
    r.description || '(pas de description)',
    '',
    "Dis-moi ce qu'il est possible de faire et propose-moi une solution.",
  ].join('\n')
}

async function copier(texte) {
  try {
    await navigator.clipboard.writeText(texte)
  } catch {
    const zone = document.createElement('textarea')
    zone.value = texte
    document.body.appendChild(zone)
    zone.select()
    document.execCommand('copy')
    zone.remove()
  }
}

// ---------- Détail d'une requête ----------
function DetailRequete({ requete, estAdmin, estAuteur, onModifier, onSupprimer, onEditer }) {
  const [reponse, setReponse] = useState(requete.reponse || '')
  const [copie, setCopie] = useState(false)
  const [sauve, setSauve] = useState(false)
  const [erreur, setErreur] = useState('')

  useEffect(() => setReponse(requete.reponse || ''), [requete.id, requete.reponse])

  async function action(fn) {
    setErreur('')
    try {
      await fn()
    } catch (err) {
      setErreur(err.message || 'Une erreur est survenue.')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <PastilleStatut statut={requete.statut} pourAuteur={!estAdmin} />
        {estAdmin && <PastilleAuteur auteurId={requete.auteurId} auteurNom={requete.auteurNom} />}
        <span className="text-xs text-slate-400">· {dateLongue(requete.creeLe)}</span>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-slate-900 leading-snug">{requete.titre}</h3>
        {requete.description && (
          <p className="mt-2 text-[15px] text-slate-600 leading-relaxed whitespace-pre-wrap">{requete.description}</p>
        )}
      </div>

      {estAdmin ? (
        <>
          {/* Statut */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Statut</p>
            <div className="grid grid-cols-2 gap-2">
              {STATUTS.map((s) => {
                const actif = requete.statut === s.id
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => !actif && action(() => onModifier({ statut: s.id }))}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium ring-1 transition-colors ${
                      actif ? `${s.pastille} ring-2` : 'ring-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${s.point}`} />
                    {s.nom}
                    {actif && <Check size={15} className="ml-auto" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Réponse visible par l'auteur */}
          {requete.auteurId !== PROFIL_PRINCIPAL && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Mot pour {requete.auteurNom}
              </p>
              <textarea
                className={`${champClass} min-h-[5rem] text-sm`}
                value={reponse}
                onChange={(e) => {
                  setReponse(e.target.value)
                  setSauve(false)
                }}
                placeholder="Ex. Super idée, je m'y mets ce week-end !"
              />
              {reponse !== (requete.reponse || '') && (
                <button
                  type="button"
                  onClick={() => action(async () => {
                    await onModifier({ reponse: reponse.trim() })
                    setSauve(true)
                  })}
                  className="mt-2 rounded-xl px-4 py-2 text-sm font-semibold bg-emerald-700 text-white hover:bg-emerald-800"
                >
                  Enregistrer le mot
                </button>
              )}
              {sauve && <p className="mt-2 text-xs text-green-600">Enregistré — {requete.auteurNom} le verra.</p>}
            </div>
          )}

          <button
            type="button"
            onClick={async () => {
              await copier(textePourClaude(requete))
              setCopie(true)
              setTimeout(() => setCopie(false), 2500)
            }}
            className="w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800"
          >
            {copie ? <Check size={17} /> : <ClipboardCopy size={17} />}
            {copie ? 'Copié ! Colle-le dans Claude' : 'Copier pour Claude'}
          </button>
        </>
      ) : (
        requete.reponse && (
          <div className="rounded-2xl bg-emerald-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700/70 mb-1">Mot de Maxence</p>
            <p className="text-[15px] text-emerald-950 leading-relaxed whitespace-pre-wrap">{requete.reponse}</p>
          </div>
        )
      )}

      {erreur && <p className="text-sm text-red-600">{erreur}</p>}

      {(estAdmin || (estAuteur && requete.statut === 'nouvelle')) && (
        <div className="flex gap-2 pt-2 border-t border-slate-100">
          {estAuteur && (
            <button
              type="button"
              onClick={onEditer}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              <Pencil size={15} />
              Modifier
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Supprimer définitivement cette requête ?')) action(onSupprimer)
            }}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <Trash2 size={15} />
            Supprimer
          </button>
        </div>
      )}
    </div>
  )
}

// ---------- Carte de la liste ----------
function CarteRequete({ requete, estAdmin, onOuvrir }) {
  return (
    <button
      type="button"
      onClick={onOuvrir}
      className="tuile w-full text-left rounded-3xl bg-white/80 backdrop-blur border border-emerald-900/5 p-4 sm:p-5 shadow-[0_1px_2px_rgba(6,78,59,0.04),0_8px_24px_-12px_rgba(6,78,59,0.18)] hover:bg-white hover:-translate-y-0.5 transition-all"
    >
      <div className="flex items-center justify-between gap-2">
        <PastilleStatut statut={requete.statut} pourAuteur={!estAdmin} />
        <span className="text-xs text-emerald-900/40">{dateCourte(requete.creeLe)}</span>
      </div>
      <p className="mt-3 text-[17px] font-semibold text-emerald-950 leading-snug">{requete.titre}</p>
      {requete.description && (
        <p className="mt-1 text-sm text-emerald-900/60 line-clamp-2 whitespace-pre-line">{requete.description}</p>
      )}
      {(estAdmin || requete.reponse) && (
        <div className="mt-3 flex items-center justify-between gap-2">
          {estAdmin ? <PastilleAuteur auteurId={requete.auteurId} auteurNom={requete.auteurNom} /> : <span />}
          {requete.reponse && (
            <span className="text-xs font-medium text-emerald-700">
              {estAdmin ? 'Mot envoyé' : '💬 Maxence a répondu'}
            </span>
          )}
        </div>
      )}
    </button>
  )
}

// ---------- Page ----------
const FILTRES = [
  { id: 'a_traiter', nom: 'À traiter', statuts: ['nouvelle', 'en_cours'] },
  { id: 'deployee', nom: 'Déployées', statuts: ['deployee'] },
  { id: 'cloturee', nom: 'Clôturées', statuts: ['cloturee'] },
  { id: 'toutes', nom: 'Toutes', statuts: null },
]

export default function RequetesView() {
  const { profilId } = usePin()
  const profil = trouverProfil(profilId)
  const { requetes, chargement, erreur, estAdmin, creer, modifier, supprimer } = useRequetes()

  const [formulaire, setFormulaire] = useState(null) // null | 'nouvelle' | requête à modifier
  const [ouverteId, setOuverteId] = useState(null)
  const [filtre, setFiltre] = useState('a_traiter')
  const [personne, setPersonne] = useState('tous')

  const ouverte = requetes.find((r) => r.id === ouverteId) || null
  const auteurs = [...new Map(requetes.map((r) => [r.auteurId, r.auteurNom])).entries()]

  const statutsFiltre = FILTRES.find((f) => f.id === filtre)?.statuts
  const visibles = estAdmin
    ? requetes.filter(
        (r) => (!statutsFiltre || statutsFiltre.includes(r.statut)) && (personne === 'tous' || r.auteurId === personne)
      )
    : requetes
  const nbNouvelles = requetes.filter((r) => r.statut === 'nouvelle' && r.auteurId !== profilId).length

  return (
    <div className="min-h-screen bg-creme text-emerald-950 relative overflow-hidden">
      <div className="blob pointer-events-none absolute -top-32 -right-24 w-80 h-80 sm:w-[28rem] sm:h-[28rem] rounded-full bg-emerald-300/35 blur-3xl" />
      <div className="blob pointer-events-none absolute bottom-0 -left-32 w-80 h-80 rounded-full bg-douceur/50 blur-3xl" />

      <div className="relative max-w-3xl mx-auto px-5 sm:px-8 pt-6 sm:pt-10 pb-28">
        <Link
          to={`/${profilId}`}
          className="inline-flex items-center gap-1.5 text-sm text-emerald-900/60 hover:text-emerald-900 transition-colors"
        >
          <ArrowLeft size={16} />
          {profil?.nom}
        </Link>

        <header className="mt-8 mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-5xl sm:text-6xl font-semibold tracking-tight text-emerald-900">
              Requêtes<span className={profil?.accent || 'text-emerald-500'}>.</span>
            </h1>
            <p className="mt-2 text-emerald-900/60">
              {estAdmin
                ? nbNouvelles > 0
                  ? `${nbNouvelles} nouvelle${nbNouvelles > 1 ? 's' : ''} demande${nbNouvelles > 1 ? 's' : ''} à regarder`
                  : 'Toutes les demandes et tes idées à venir'
                : 'Une idée d’appli ? Raconte-la, Maxence s’en occupe.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormulaire('nouvelle')}
            className="hidden sm:inline-flex items-center gap-2 rounded-full bg-emerald-800 text-white px-5 py-3 text-sm font-semibold shadow-lg hover:bg-emerald-900 transition-colors shrink-0"
          >
            <Plus size={18} />
            {estAdmin ? 'Nouvelle requête' : 'Faire une demande'}
          </button>
        </header>

        {estAdmin && requetes.length > 0 && (
          <div className="mb-5 space-y-2">
            <div className="flex gap-2 overflow-x-auto -mx-5 px-5 pb-1">
              {FILTRES.map((f) => {
                const nb = f.statuts ? requetes.filter((r) => f.statuts.includes(r.statut)).length : requetes.length
                const actif = filtre === f.id
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFiltre(f.id)}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      actif ? 'bg-emerald-900 text-white' : 'bg-white/70 text-emerald-900/70 hover:bg-white'
                    }`}
                  >
                    {f.nom}
                    <span className={`ml-1.5 ${actif ? 'text-white/60' : 'text-emerald-900/35'}`}>{nb}</span>
                  </button>
                )
              })}
            </div>
            {auteurs.length > 1 && (
              <div className="flex gap-2 overflow-x-auto -mx-5 px-5 pb-1">
                {[['tous', 'Tout le monde'], ...auteurs].map(([id, nom]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPersonne(id)}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ring-1 ${
                      personne === id
                        ? 'ring-emerald-700 text-emerald-800 bg-emerald-50'
                        : 'ring-emerald-900/10 text-emerald-900/50 hover:bg-white'
                    }`}
                  >
                    {nom}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {erreur && <p className="mb-4 text-sm text-red-600">{erreur}</p>}

        {chargement ? (
          <p className="py-16 text-center text-emerald-900/40">Chargement…</p>
        ) : visibles.length === 0 ? (
          <div className="tuile tuile-vide rounded-3xl border-2 border-dashed border-emerald-900/10 px-6 py-14 text-center">
            <span className="mx-auto w-14 h-14 rounded-2xl bg-emerald-900/5 flex items-center justify-center text-emerald-900/40">
              <MessageSquarePlus size={26} />
            </span>
            <p className="mt-4 text-lg font-semibold text-emerald-900/60">
              {requetes.length === 0 ? 'Aucune demande pour l’instant' : 'Rien dans cette liste'}
            </p>
            <p className="mt-1 text-sm text-emerald-900/40">
              {requetes.length === 0
                ? estAdmin
                  ? 'Note ici tes idées de mises à jour, et retrouve celles des autres.'
                  : 'Touche « Faire une demande » et raconte ton idée, à l’écrit ou à voix haute.'
                : 'Change de filtre pour voir les autres requêtes.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {visibles.map((r) => (
              <CarteRequete key={r.id} requete={r} estAdmin={estAdmin} onOuvrir={() => setOuverteId(r.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Bouton flottant sur mobile */}
      <button
        type="button"
        onClick={() => setFormulaire('nouvelle')}
        className="sm:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 inline-flex items-center gap-2 rounded-full bg-emerald-800 text-white px-6 py-4 text-[15px] font-semibold shadow-xl"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        <Plus size={19} />
        {estAdmin ? 'Nouvelle requête' : 'Faire une demande'}
      </button>

      <Modal
        open={!!formulaire}
        onClose={() => setFormulaire(null)}
        title={formulaire && formulaire !== 'nouvelle' ? 'Modifier la demande' : estAdmin ? 'Nouvelle requête' : 'Nouvelle demande'}
      >
        {formulaire && (
          <FormulaireRequete
            key={formulaire === 'nouvelle' ? 'nouvelle' : formulaire.id}
            initial={formulaire === 'nouvelle' ? null : formulaire}
            onAnnuler={() => setFormulaire(null)}
            onEnregistrer={async (champs) => {
              if (formulaire === 'nouvelle') await creer(champs)
              else await modifier(formulaire.id, champs)
              setFormulaire(null)
            }}
          />
        )}
      </Modal>

      <Modal open={!!ouverte} onClose={() => setOuverteId(null)} title={estAdmin ? 'Requête' : 'Ma demande'}>
        {ouverte && (
          <DetailRequete
            requete={ouverte}
            estAdmin={estAdmin}
            estAuteur={ouverte.auteurId === profilId}
            onModifier={(champs) => modifier(ouverte.id, champs)}
            onSupprimer={async () => {
              await supprimer(ouverte.id)
              setOuverteId(null)
            }}
            onEditer={() => {
              setOuverteId(null)
              setFormulaire(ouverte)
            }}
          />
        )}
      </Modal>
    </div>
  )
}
