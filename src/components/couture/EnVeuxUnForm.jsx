import { useRef, useState } from 'react'
import { Heart, Loader2, Send } from 'lucide-react'
import Feuille from './Feuille.jsx'
import { boutonRose, champCouture } from './Vichy.jsx'
import { envoyerDemande } from '../../hooks/useCouture.js'

// Raccourcis pour compléter les précisions en un geste
const RACCOURCIS = ['Taille : ', 'Couleur : ', 'Tissu / motif : ', 'Pour qui : ', 'Pour quand : ']

// =============================================================
//  « J'en veux un ! » : la copine laisse son nom et ses précisions.
//  La demande arrive dans la centrale des commandes de Julie.
// =============================================================
export default function EnVeuxUnForm({ article, open, onClose }) {
  const [nom, setNom] = useState('')
  const [details, setDetails] = useState('')
  const [etat, setEtat] = useState('saisie') // saisie | envoi | envoye
  const [erreur, setErreur] = useState('')
  const zone = useRef(null)

  function fermer() {
    onClose()
    // On remet à zéro après la fermeture (sauf le nom, pratique pour une 2e demande)
    setTimeout(() => {
      setEtat('saisie')
      setDetails('')
      setErreur('')
    }, 250)
  }

  function ajouterRaccourci(texte) {
    const avant = details && !details.endsWith('\n') ? `${details}\n` : details
    setDetails(avant + texte)
    requestAnimationFrame(() => {
      zone.current?.focus()
      const fin = (avant + texte).length
      zone.current?.setSelectionRange(fin, fin)
    })
  }

  async function envoyer(e) {
    e.preventDefault()
    if (!nom.trim()) {
      setErreur('Indique ton nom pour que Julie sache qui tu es 😊')
      return
    }
    setEtat('envoi')
    setErreur('')
    try {
      await envoyerDemande({ article, nom, details })
      setEtat('envoye')
      if (navigator.vibrate) navigator.vibrate(40)
    } catch (err) {
      console.error(err)
      setErreur(err.message || "L'envoi a échoué, réessaie.")
      setEtat('saisie')
    }
  }

  return (
    <Feuille open={open} onClose={fermer} titre={etat === 'envoye' ? 'C’est noté !' : 'J’en veux un !'}>
      {etat === 'envoye' ? (
        <div className="text-center py-4">
          <div className="couture-coeur mx-auto w-20 h-20 rounded-full vichy flex items-center justify-center ring-4 ring-white shadow-lg">
            <Heart size={34} className="text-pink-500 fill-pink-500" />
          </div>
          <p className="mt-5 text-lg font-semibold text-pink-950">Merci {nom.trim().split(' ')[0]} !</p>
          <p className="mt-1 text-sm text-pink-900/60">
            Julie a bien reçu ta demande pour <strong className="text-pink-900">{article?.nom}</strong>. Elle revient vers
            toi très vite.
          </p>
          <button onClick={fermer} className={`${boutonRose} w-full mt-6`}>
            Continuer à regarder
          </button>
        </div>
      ) : (
        <form onSubmit={envoyer}>
          {article && (
            <div className="flex items-center gap-3 rounded-2xl bg-white p-2.5 ring-1 ring-pink-100 mb-4">
              {article.couverture ? (
                <img src={article.couverture} alt="" className="w-14 h-14 rounded-xl object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-xl vichy-fin" />
              )}
              <div className="min-w-0">
                <p className="text-xs text-pink-900/50">Ta demande pour</p>
                <p className="font-semibold text-pink-950 truncate">{article.nom}</p>
              </div>
            </div>
          )}

          <label className="block mb-4">
            <span className="block text-sm font-semibold text-pink-950 mb-1.5">Ton nom</span>
            <input
              className={champCouture}
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex. Sophie D."
              autoComplete="name"
              autoCapitalize="words"
              enterKeyHint="next"
              maxLength={80}
            />
          </label>

          <label className="block">
            <span className="block text-sm font-semibold text-pink-950 mb-1.5">
              Tes envies <span className="font-normal text-pink-900/45">(facultatif)</span>
            </span>
            <textarea
              ref={zone}
              className={`${champCouture} min-h-[96px] resize-none`}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Taille, couleur, tissu, pour quand…"
              maxLength={1500}
            />
          </label>
          <div className="flex flex-wrap gap-1.5 mt-2 mb-5">
            {RACCOURCIS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => ajouterRaccourci(r)}
                className="rounded-full bg-pink-50 px-3 py-2 text-xs font-medium text-pink-700 ring-1 ring-pink-100 active:bg-pink-100"
              >
                + {r.replace(' : ', '')}
              </button>
            ))}
          </div>

          {erreur && <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{erreur}</p>}

          <div className="flex">
            <button type="submit" disabled={etat === 'envoi'} className={`${boutonRose} flex-1 py-4 text-base`}>
              {etat === 'envoi' ? <Loader2 size={18} className="animate-spin" /> : <Send size={17} />}
              {etat === 'envoi' ? 'Envoi…' : 'Envoyer à Julie'}
            </button>
          </div>
        </form>
      )}
    </Feuille>
  )
}
