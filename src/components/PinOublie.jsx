import { useState } from 'react'
import { ChevronLeft, Loader2, Mail } from 'lucide-react'
import { usePin } from '../context/PinContext.jsx'
import { masquerEmail } from '../config/email.js'

// =============================================================
//  « PIN oublié ? » (affiché depuis l'écran du code PIN)
//  1. On envoie un code à 6 chiffres à l'adresse mail du profil
//  2. On tape ce code + le nouveau PIN → l'espace s'ouvre
// =============================================================
const champ =
  'w-full rounded-2xl bg-white/10 border border-white/15 px-4 py-3 text-center text-xl tracking-[0.4em] text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/40'
const bouton =
  'w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-white text-emerald-900 py-3.5 font-semibold disabled:opacity-50 active:scale-[0.99] transition'

const chiffres = (v, n) => v.replace(/\D/g, '').slice(0, n)

export default function PinOublie({ onRetour }) {
  const { parametres, envoyerCodeReinitialisation, reinitialiserPin } = usePin()
  const email = (parametres.email || '').trim()

  const [etape, setEtape] = useState('envoi') // 'envoi' puis 'code'
  const [code, setCode] = useState('')
  const [pin, setPin] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState('')
  const [info, setInfo] = useState('')

  async function envoyer() {
    setEnCours(true)
    setErreur('')
    setInfo('')
    try {
      await envoyerCodeReinitialisation()
      setEtape('code')
      setInfo(`Code envoyé à ${masquerEmail(email)}. Regarde aussi dans les spams.`)
    } catch (err) {
      setErreur(err.message || "L'envoi a échoué.")
    } finally {
      setEnCours(false)
    }
  }

  async function valider(e) {
    e.preventDefault()
    setErreur('')
    if (code.length !== 6) return setErreur('Le code reçu fait 6 chiffres.')
    if (pin.length !== 4) return setErreur('Le nouveau PIN doit faire 4 chiffres.')
    if (pin !== confirmation) return setErreur('La confirmation ne correspond pas au nouveau PIN.')
    setEnCours(true)
    try {
      await reinitialiserPin(code, pin)
    } catch (err) {
      setErreur(err.message || 'La réinitialisation a échoué.')
      setEnCours(false)
    }
  }

  return (
    <div className="w-full max-w-xs flex flex-col items-center">
      <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center mb-6">
        <Mail size={28} />
      </div>
      <h1 className="font-display text-3xl font-semibold mb-2">PIN oublié</h1>

      {!email ? (
        <p className="text-white/75 text-sm text-center mb-8">
          Aucune adresse mail n'est enregistrée pour ce profil. Une fois connecté, ajoute-la dans
          Paramètres pour pouvoir réinitialiser ton PIN par mail.
        </p>
      ) : etape === 'envoi' ? (
        <>
          <p className="text-white/75 text-sm text-center mb-8">
            On va t'envoyer un code à 6 chiffres à l'adresse
            <span className="block font-medium text-white mt-1">{masquerEmail(email)}</span>
          </p>
          <button type="button" onClick={envoyer} disabled={enCours} className={bouton}>
            {enCours ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
            Envoyer le code
          </button>
        </>
      ) : (
        <form onSubmit={valider} className="w-full space-y-3">
          <p className="text-white/75 text-sm text-center mb-3">{info}</p>
          <label className="block">
            <span className="block text-xs text-white/60 mb-1.5">Code reçu par mail</span>
            <input
              value={code}
              onChange={(e) => setCode(chiffres(e.target.value, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="••••••"
              className={champ}
              autoFocus
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs text-white/60 mb-1.5">Nouveau PIN</span>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(chiffres(e.target.value, 4))}
                inputMode="numeric"
                autoComplete="off"
                placeholder="••••"
                className={champ}
              />
            </label>
            <label className="block">
              <span className="block text-xs text-white/60 mb-1.5">Confirmer</span>
              <input
                type="password"
                value={confirmation}
                onChange={(e) => setConfirmation(chiffres(e.target.value, 4))}
                inputMode="numeric"
                autoComplete="off"
                placeholder="••••"
                className={champ}
              />
            </label>
          </div>
          <button type="submit" disabled={enCours} className={`${bouton} mt-2`}>
            {enCours && <Loader2 size={18} className="animate-spin" />}
            Changer mon PIN
          </button>
          <button
            type="button"
            onClick={envoyer}
            disabled={enCours}
            className="w-full text-sm text-white/60 hover:text-white py-2"
          >
            Renvoyer un code
          </button>
        </form>
      )}

      {erreur && <p className="text-red-200 text-sm mt-4 text-center">{erreur}</p>}

      <button
        type="button"
        onClick={onRetour}
        className="mt-8 inline-flex items-center gap-1 text-sm text-white/60 hover:text-white"
      >
        <ChevronLeft size={16} />
        Retour au code PIN
      </button>
    </div>
  )
}
