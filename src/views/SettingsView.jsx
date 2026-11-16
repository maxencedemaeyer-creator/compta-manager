import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronLeft,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  LayoutGrid,
  Loader2,
  Lock,
  Mail,
  Timer,
} from 'lucide-react'
import { usePin } from '../context/PinContext.jsx'
import { appsDuProfil } from '../config/apps.js'
import { PROFIL_PRINCIPAL, trouverProfil } from '../config/profils.js'
import { creerSauvegarde } from '../utils/sauvegarde.js'

// ---------- Petits éléments réutilisés ----------
function Section({ icon: Icon, titre, description, children }) {
  return (
    <section className="rounded-3xl bg-white/85 border border-emerald-900/5 p-5 sm:p-6 shadow-[0_1px_2px_rgba(6,78,59,0.04),0_8px_24px_-14px_rgba(6,78,59,0.2)]">
      <div className="flex items-start gap-3 mb-4">
        <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
          <Icon size={19} />
        </span>
        <div>
          <h2 className="font-semibold text-emerald-950">{titre}</h2>
          {description && <p className="text-sm text-emerald-900/55 mt-0.5">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

function Message({ type, texte }) {
  if (!texte) return null
  return (
    <p className={`text-sm mt-3 ${type === 'ok' ? 'text-emerald-700' : 'text-rose-600'}`}>{texte}</p>
  )
}

const champ =
  'w-full rounded-xl border border-emerald-900/15 bg-white px-3 py-2.5 text-center text-lg tracking-[0.5em] text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/40'
const boutonPrincipal =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 text-white px-4 py-2.5 text-sm font-medium hover:bg-emerald-800 disabled:opacity-50 transition-colors'

// ---------- 1. Code PIN ----------
function ChangerPin() {
  const { changerPin } = usePin()
  const [ancien, setAncien] = useState('')
  const [nouveau, setNouveau] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [msg, setMsg] = useState({ type: '', texte: '' })

  const chiffres = (v) => v.replace(/\D/g, '').slice(0, 4)

  async function valider(e) {
    e.preventDefault()
    setMsg({ type: '', texte: '' })
    if (nouveau.length !== 4) return setMsg({ type: 'erreur', texte: 'Le nouveau code doit faire 4 chiffres.' })
    if (nouveau !== confirmation)
      return setMsg({ type: 'erreur', texte: 'La confirmation ne correspond pas au nouveau code.' })
    if (nouveau === ancien) return setMsg({ type: 'erreur', texte: "Le nouveau code est identique à l'actuel." })
    setEnCours(true)
    try {
      await changerPin(ancien, nouveau)
      setAncien('')
      setNouveau('')
      setConfirmation('')
      setMsg({ type: 'ok', texte: 'Code PIN modifié. Il sera demandé à la prochaine connexion.' })
    } catch (err) {
      setMsg({ type: 'erreur', texte: err.message || 'Le changement a échoué.' })
    } finally {
      setEnCours(false)
    }
  }

  return (
    <Section icon={KeyRound} titre="Code PIN" description="Le code à 4 chiffres demandé à l'ouverture du site.">
      <form onSubmit={valider}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            ['Code actuel', ancien, setAncien],
            ['Nouveau code', nouveau, setNouveau],
            ['Confirmer', confirmation, setConfirmation],
          ].map(([label, valeur, setter]) => (
            <label key={label} className="block">
              <span className="block text-xs font-medium text-emerald-900/60 mb-1.5">{label}</span>
              <input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={valeur}
                onChange={(e) => setter(chiffres(e.target.value))}
                className={champ}
                placeholder="••••"
              />
            </label>
          ))}
        </div>
        <button
          type="submit"
          className={`${boutonPrincipal} mt-4 w-full sm:w-auto`}
          disabled={enCours || !ancien || !nouveau || !confirmation}
        >
          {enCours ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          Changer le code
        </button>
        <Message {...msg} />
      </form>
    </Section>
  )
}

// ---------- Adresse mail (pour « PIN oublié ») ----------
function AdresseMail() {
  const { parametres, majParametres } = usePin()
  const [valeur, setValeur] = useState(null) // null = pas encore modifiée
  const [enCours, setEnCours] = useState(false)
  const [msg, setMsg] = useState({ type: '', texte: '' })
  const actuelle = parametres.email || ''
  const affichee = valeur ?? actuelle

  async function enregistrer(e) {
    e.preventDefault()
    const email = affichee.trim()
    setMsg({ type: '', texte: '' })
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return setMsg({ type: 'erreur', texte: "Cette adresse mail n'a pas l'air valide." })
    }
    setEnCours(true)
    try {
      await majParametres({ email })
      setValeur(null)
      setMsg({ type: 'ok', texte: email ? 'Adresse enregistrée.' : 'Adresse supprimée.' })
    } catch (err) {
      setMsg({ type: 'erreur', texte: err.message || "L'enregistrement a échoué." })
    } finally {
      setEnCours(false)
    }
  }

  return (
    <Section
      icon={Mail}
      titre="Adresse mail"
      description="Utilisée seulement pour recevoir un code si tu oublies ton PIN."
    >
      <form onSubmit={enregistrer} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={affichee}
          onChange={(e) => setValeur(e.target.value)}
          placeholder="prenom@exemple.com"
          className="flex-1 rounded-xl border border-emerald-900/15 bg-white px-3 py-2.5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        />
        <button type="submit" className={boutonPrincipal} disabled={enCours || affichee.trim() === actuelle}>
          {enCours ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          Enregistrer
        </button>
      </form>
      <Message {...msg} />
    </Section>
  )
}

// ---------- 2. Applications de l'accueil ----------
function GererApps() {
  const { parametres, majParametres, profilId } = usePin()
  const apps = appsDuProfil(trouverProfil(profilId), parametres.appsOrdre)
  if (apps.length === 0) return null
  const masquees = parametres.appsMasquees || []

  function deplacer(index, sens) {
    const ids = apps.map((a) => a.id)
    const cible = index + sens
    if (cible < 0 || cible >= ids.length) return
    ;[ids[index], ids[cible]] = [ids[cible], ids[index]]
    majParametres({ appsOrdre: ids })
  }

  function basculer(id) {
    majParametres({
      appsMasquees: masquees.includes(id) ? masquees.filter((m) => m !== id) : [...masquees, id],
    })
  }

  return (
    <Section
      icon={LayoutGrid}
      titre="Applications de l'accueil"
      description="Choisis l'ordre des tuiles et celles qui sont affichées."
    >
      <ul className="divide-y divide-emerald-900/5">
        {apps.map((app, i) => {
          const visible = !masquees.includes(app.id)
          const Icon = app.icon
          return (
            <li key={app.id} className="flex items-center gap-3 py-2.5">
              <span
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${app.couleur} text-white flex items-center justify-center shrink-0 ${
                  visible ? '' : 'opacity-30 grayscale'
                }`}
              >
                <Icon size={19} />
              </span>
              <span className={`flex-1 min-w-0 font-medium ${visible ? 'text-emerald-950' : 'text-emerald-900/35'}`}>
                {app.nom}
                <span className="block text-xs font-normal text-emerald-900/40">{app.to}</span>
              </span>
              <button
                type="button"
                onClick={() => deplacer(i, -1)}
                disabled={i === 0}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-emerald-900/50 hover:bg-emerald-50 disabled:opacity-20"
                aria-label="Monter"
              >
                <ArrowUp size={17} />
              </button>
              <button
                type="button"
                onClick={() => deplacer(i, 1)}
                disabled={i === apps.length - 1}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-emerald-900/50 hover:bg-emerald-50 disabled:opacity-20"
                aria-label="Descendre"
              >
                <ArrowDown size={17} />
              </button>
              <button
                type="button"
                onClick={() => basculer(app.id)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center hover:bg-emerald-50 ${
                  visible ? 'text-emerald-700' : 'text-emerald-900/30'
                }`}
                aria-label={visible ? 'Masquer' : 'Afficher'}
              >
                {visible ? <Eye size={17} /> : <EyeOff size={17} />}
              </button>
            </li>
          )
        })}
      </ul>
      <p className="text-xs text-emerald-900/40 mt-3">
        Une application masquée reste accessible par son adresse.
      </p>
    </Section>
  )
}

// ---------- 3. Verrouillage automatique ----------
const DELAIS = [
  [0, 'Jamais'],
  [5, '5 min'],
  [15, '15 min'],
  [30, '30 min'],
  [60, '1 h'],
]

function Verrouillage() {
  const { parametres, majParametres } = usePin()
  const actuel = Number(parametres.verrouillageMinutes) || 0

  return (
    <Section
      icon={Timer}
      titre="Verrouillage automatique"
      description="Redemander le code PIN après une période sans activité."
    >
      <div className="grid grid-cols-5 gap-1.5 rounded-2xl bg-emerald-900/5 p-1.5">
        {DELAIS.map(([minutes, label]) => (
          <button
            key={minutes}
            type="button"
            onClick={() => majParametres({ verrouillageMinutes: minutes })}
            className={`rounded-xl py-2 text-sm font-medium transition-colors ${
              actuel === minutes ? 'bg-white text-emerald-900 shadow-sm' : 'text-emerald-900/55 hover:text-emerald-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </Section>
  )
}

// ---------- 4. Sauvegarde ----------
function Sauvegarde() {
  const { parametres, majParametres } = usePin()
  const [enCours, setEnCours] = useState(false)
  const [msg, setMsg] = useState({ type: '', texte: '' })

  async function telecharger() {
    setEnCours(true)
    setMsg({ type: '', texte: '' })
    try {
      const { total, taille } = await creerSauvegarde()
      await majParametres({ derniereSauvegarde: new Date().toISOString() })
      setMsg({
        type: 'ok',
        texte: `Sauvegarde téléchargée : ${total} éléments (${(taille / 1024).toFixed(0)} Ko).`,
      })
    } catch (err) {
      console.error(err)
      setMsg({ type: 'erreur', texte: err.message || 'La sauvegarde a échoué.' })
    } finally {
      setEnCours(false)
    }
  }

  const derniere = parametres.derniereSauvegarde
    ? new Date(parametres.derniereSauvegarde).toLocaleDateString('fr-BE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  return (
    <Section
      icon={Download}
      titre="Sauvegarde de mes données"
      description="Télécharge une copie complète (compta, généalogie avec photos, programme) dans un fichier."
    >
      <button type="button" onClick={telecharger} disabled={enCours} className={`${boutonPrincipal} w-full sm:w-auto`}>
        {enCours ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
        {enCours ? 'Préparation…' : 'Télécharger une sauvegarde'}
      </button>
      <p className="text-xs text-emerald-900/45 mt-3">
        {derniere ? `Dernière sauvegarde : ${derniere}.` : 'Aucune sauvegarde téléchargée pour le moment.'}
      </p>
      <Message {...msg} />
    </Section>
  )
}

// ---------- Page ----------
export default function SettingsView() {
  const { lock, profilId } = usePin()
  const profil = trouverProfil(profilId)

  return (
    <div className="min-h-screen bg-creme text-emerald-950">
      <div className="max-w-2xl mx-auto px-4 sm:px-8 pt-5 sm:pt-10 pb-16">
        <Link
          to={`/${profilId}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-emerald-900/60 hover:text-emerald-900"
        >
          <ChevronLeft size={18} />
          {profil?.nom}
        </Link>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-emerald-900 mt-6 mb-8">
          Paramètres
        </h1>

        <div className="space-y-4">
          <ChangerPin />
          <AdresseMail />
          <GererApps />
          <Verrouillage />
          {/* La sauvegarde concerne les données de Maxence (compta, généalogie, programme) */}
          {profilId === PROFIL_PRINCIPAL && <Sauvegarde />}

          <button
            type="button"
            onClick={lock}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-emerald-900/10 bg-white/50 py-3.5 text-sm font-medium text-emerald-900/70 hover:bg-white hover:text-emerald-900"
          >
            <Lock size={16} />
            Verrouiller maintenant
          </button>
        </div>
      </div>
    </div>
  )
}
