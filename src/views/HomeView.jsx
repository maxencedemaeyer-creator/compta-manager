import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Lock, Plus, Settings, Users, X } from 'lucide-react'
import { usePin } from '../context/PinContext.jsx'
import { appsDuProfil, faviconDe, hoteDe, normaliserUrl } from '../config/apps.js'
import AppIcone from '../components/accueil/AppIcone.jsx'
import Signature from '../components/Signature.jsx'
import { trouverProfil } from '../config/profils.js'

// =============================================================
//  Page d'accueil d'un profil (/maxence, /julie…) : chaque tuile
//  ouvre une application. La liste est dans src/config/apps.js ;
//  l'ordre et la visibilité se règlent dans Paramètres.
// =============================================================

function salutation() {
  const h = new Date().getHours()
  if (h < 5) return 'Bonne nuit'
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

// Niveaux de densité des tuiles : hauteur, largeur mini, tailles.
const NIVEAUX = [
  { id: 'normal', h: 84, minW: 240, icone: 'w-14 h-14', ico: 24, pad: 'p-3.5', titre: 'text-lg', desc: true },
  { id: 'compact', h: 64, minW: 210, icone: 'w-10 h-10', ico: 20, pad: 'p-3', titre: 'text-base', desc: true },
  { id: 'dense', h: 50, minW: 175, icone: 'w-8 h-8', ico: 16, pad: 'p-2.5', titre: 'text-sm', desc: false },
]
const GAP = 12
const HAUTEUR_FIXE = 300 // date + nom + libellé + signature + marges

function useViewport() {
  const lire = () => ({ w: window.innerWidth, h: window.innerHeight })
  const [vp, setVp] = useState(lire)
  useEffect(() => {
    const maj = () => setVp(lire())
    window.addEventListener('resize', maj)
    return () => window.removeEventListener('resize', maj)
  }, [])
  return vp
}

// Choisit le niveau de densité et le nombre de colonnes pour que
// n tuiles tiennent dans l'écran (sinon, le moins mauvais compromis).
function calculerGrille(n, { w, h }) {
  if (w < 640) return { cols: 2, niveau: null }
  const dispo = h - HAUTEUR_FIXE
  const largeur = w - 64
  let dernier = null
  for (const niveau of NIVEAUX) {
    const maxCols = Math.max(2, Math.floor((largeur + GAP) / (niveau.minW + GAP)))
    dernier = { cols: maxCols, niveau }
    for (let cols = Math.min(2, maxCols); cols <= maxCols; cols++) {
      const rows = Math.ceil(n / cols)
      if (rows * niveau.h + (rows - 1) * GAP <= dispo) return { cols, niveau }
    }
  }
  return dernier
}

// Fenêtre « Nouvelle application » : un nom + l'adresse d'un site existant
function NouvelleApp({ onFermer, onAjouter }) {
  const [url, setUrl] = useState('')
  const [nom, setNom] = useState('')
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const adresse = normaliserUrl(url)
  const apercu = adresse ? faviconDe(adresse) : null

  async function valider(e) {
    e.preventDefault()
    if (!adresse) return setErreur("Cette adresse n'a pas l'air valide (ex. facebook.com).")
    setEnvoi(true)
    setErreur('')
    try {
      await onAjouter({ nom: nom.trim() || hoteDe(adresse), url: adresse })
      onFermer()
    } catch (err) {
      setErreur(err.message || "Impossible d'ajouter l'application.")
      setEnvoi(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-emerald-950/40 backdrop-blur-sm p-4" onClick={onFermer}>
      <form
        onSubmit={valider}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-emerald-900/10"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold text-emerald-950">Nouvelle application</h2>
          <button type="button" onClick={onFermer} className="w-9 h-9 rounded-full flex items-center justify-center text-emerald-900/50 hover:bg-emerald-50" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
        <label className="block text-sm font-medium text-emerald-900/70 mb-1">Adresse du site</label>
        <input
          autoFocus
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.facebook.com"
          className="w-full rounded-xl border border-emerald-900/15 px-3 py-2.5 text-base text-emerald-950 outline-none focus:border-emerald-500 mb-3"
        />
        <label className="block text-sm font-medium text-emerald-900/70 mb-1">Nom de l'application</label>
        <div className="flex items-center gap-3 mb-1">
          <span className="w-11 h-11 rounded-xl bg-emerald-900/5 border border-emerald-900/10 flex items-center justify-center shrink-0 overflow-hidden">
            {apercu ? <img src={apercu} alt="" className="w-7 h-7 object-contain" /> : <Plus size={18} className="text-emerald-900/30" />}
          </span>
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder={adresse ? hoteDe(adresse) : 'Facebook'}
            maxLength={30}
            className="w-full rounded-xl border border-emerald-900/15 px-3 py-2.5 text-base text-emerald-950 outline-none focus:border-emerald-500"
          />
        </div>
        <p className="text-xs text-emerald-900/45 mb-4">L'icône est celle du site (favicon).</p>
        {erreur && <p className="text-sm text-red-600 mb-3">{erreur}</p>}
        <button
          type="submit"
          disabled={envoi || !url.trim()}
          className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-semibold py-3 inline-flex items-center justify-center gap-2"
        >
          {envoi && <Loader2 size={16} className="animate-spin" />}
          Ajouter
        </button>
      </form>
    </div>
  )
}

export default function HomeView() {
  const vp = useViewport()
  const { lock, parametres, majParametres, profilId } = usePin()
  const [ajout, setAjout] = useState(false)
  const profil = trouverProfil(profilId)
  const masquees = parametres.appsMasquees || []
  const apps = appsDuProfil(profil, parametres.appsOrdre, parametres.appsPerso).filter((a) => !masquees.includes(a.id))
  const date = new Date().toLocaleDateString('fr-BE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const { cols, niveau } = calculerGrille(apps.length + 1, vp)

  async function ajouterApp({ nom, url }) {
    const id = `perso-${Date.now().toString(36)}`
    await majParametres({ appsPerso: [...(parametres.appsPerso || []), { id, nom, url }] })
  }

  return (
    <div className="min-h-dvh bg-creme text-emerald-950 relative overflow-hidden">
      {/* Formes douces en arrière-plan */}
      <div className="blob pointer-events-none absolute -top-32 -right-24 w-80 h-80 sm:w-[30rem] sm:h-[30rem] rounded-full bg-emerald-300/40 blur-3xl" />
      <div className="blob pointer-events-none absolute bottom-0 -left-32 w-80 h-80 rounded-full bg-douceur/50 blur-3xl" />

      <div style={{ maxWidth: niveau ? Math.max(768, cols * (niveau.minW + 40)) : 768 }} className="relative mx-auto w-full px-5 sm:px-8 pt-5 sm:pt-6 pb-4 sm:pb-6 min-h-dvh flex flex-col">
        <div className="flex items-center justify-between">
          <p className="text-sm text-emerald-900/60 first-letter:uppercase">{date}</p>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="w-10 h-10 rounded-full bg-white/70 border border-emerald-900/10 flex items-center justify-center text-emerald-900/60 hover:text-emerald-900 hover:bg-white transition-colors"
              aria-label="Changer de profil"
              title="Changer de profil"
            >
              <Users size={16} />
            </Link>
            <button
              onClick={lock}
              className="w-10 h-10 rounded-full bg-white/70 border border-emerald-900/10 flex items-center justify-center text-emerald-900/60 hover:text-emerald-900 hover:bg-white transition-colors"
              aria-label="Verrouiller"
              title="Verrouiller"
            >
              <Lock size={16} />
            </button>
            <Link
              to={`/${profilId}/settings`}
              className="w-10 h-10 rounded-full bg-white/70 border border-emerald-900/10 flex items-center justify-center text-emerald-900/60 hover:text-emerald-900 hover:bg-white transition-colors"
              aria-label="Paramètres"
              title="Paramètres"
            >
              <Settings size={17} />
            </Link>
          </div>
        </div>

        {/* Nom */}
        <header className="mt-8 sm:mt-6 lg:mt-4 mb-7 sm:mb-6 lg:mb-5">
          <p className="text-base sm:text-lg text-emerald-900/60">{salutation()},</p>
          <h1 className="nom-profil font-display text-[3.5rem] leading-[1] sm:text-7xl lg:text-6xl font-semibold tracking-tight text-emerald-900">
            {profil?.nom}
            <span className={profil?.accent || 'text-emerald-500'}>.</span>
          </h1>
        </header>

        {/* Applications */}
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-900/40 mb-3 sm:mb-3">
          Applications
        </p>
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {apps.map((app) => {
            const { to, nom, description } = app
            const Tuile = app.externe ? 'a' : Link
            const lien = app.externe ? { href: to, target: '_blank', rel: 'noopener noreferrer' } : { to }
            return niveau ? (
              <Tuile
                key={app.id}
                {...lien}
                className={`tuile group flex items-center gap-3 rounded-2xl bg-white/80 backdrop-blur border border-emerald-900/5 ${niveau.pad} shadow-[0_1px_2px_rgba(6,78,59,0.04),0_8px_24px_-12px_rgba(6,78,59,0.18)] hover:bg-white hover:-translate-y-0.5 transition-all`}
              >
                <AppIcone app={app} classe={`${niveau.icone} rounded-xl`} taille={niveau.ico} extra="group-hover:scale-105 transition-transform" />
                <span className="min-w-0 w-full">
                  <span className={`block ${niveau.titre} font-semibold text-emerald-950 truncate`}>{nom}</span>
                  {niveau.desc && (
                    <span className="block text-xs text-emerald-900/55 truncate">{description}</span>
                  )}
                </span>
              </Tuile>
            ) : (
              <Tuile
                key={app.id}
                {...lien}
                className="tuile group flex flex-col items-start gap-3 rounded-3xl bg-white/80 backdrop-blur border border-emerald-900/5 p-4 shadow-[0_1px_2px_rgba(6,78,59,0.04),0_8px_24px_-12px_rgba(6,78,59,0.18)] hover:bg-white hover:-translate-y-0.5 transition-all"
              >
                <AppIcone app={app} classe="w-12 h-12 rounded-2xl" taille={24} extra="group-hover:scale-105 transition-transform" />
                <span className="min-w-0 w-full">
                  <span className="block text-base font-semibold text-emerald-950">{nom}</span>
                  <span className="block text-xs text-emerald-900/55 line-clamp-2">{description}</span>
                </span>
              </Tuile>
            )
          })}

          <button
            type="button"
            onClick={() => setAjout(true)}
            className={`tuile tuile-vide group flex items-center gap-3 rounded-2xl border-2 border-dashed border-emerald-900/15 hover:border-emerald-500/50 hover:bg-white/50 text-left transition-colors ${
              niveau ? niveau.pad : 'p-4'
            } ${!niveau && apps.length % 2 === 0 ? 'col-span-2' : ''}`}
          >
            <span
              className={`${niveau ? niveau.icone : 'w-12 h-12'} rounded-xl bg-emerald-900/5 group-hover:bg-emerald-500/10 flex items-center justify-center text-emerald-900/40 group-hover:text-emerald-600 shrink-0 transition-colors`}
            >
              <Plus size={niveau ? niveau.ico : 24} />
            </span>
            <span className="min-w-0">
              <span className={`block ${niveau ? niveau.titre : 'text-base'} font-semibold text-emerald-900/55 truncate`}>
                Nouvelle application
              </span>
              {(!niveau || niveau.desc) && (
                <span className="block text-xs text-emerald-900/40 truncate">Ajouter un lien vers un site</span>
              )}
            </span>
          </button>
        </div>

        <Signature className="mt-auto pt-6 sm:pt-6" />
        {ajout && <NouvelleApp onFermer={() => setAjout(false)} onAjouter={ajouterApp} />}
      </div>
    </div>
  )
}
