import { useEffect, useRef, useState } from 'react'
import { KeyRound, X } from 'lucide-react'
import { usePin } from '../../../context/PinContext.jsx'
import { verifierCodeProf } from './useLaboConfig.js'

// =============================================================
//  Fenêtre « secrète » : on y arrive en touchant l'erlenmeyer du hall.
//  Demande le code d'accès de Maxence ; si c'est bon → page prof.
//  Après 5 erreurs, pause de 30 s (limite les essais au hasard).
// =============================================================

const LONGUEUR = 4
const ESSAIS_MAX = 5
const PAUSE_MS = 30000

export default function CodeProf({ onFermer, onOuvert }) {
  const { authReady } = usePin()
  const [chiffres, setChiffres] = useState('')
  const [erreur, setErreur] = useState('')
  const [verification, setVerification] = useState(false)
  const [essais, setEssais] = useState(0)
  const [bloqueJusqua, setBloqueJusqua] = useState(0)
  const [maintenant, setMaintenant] = useState(Date.now())
  const champ = useRef(null)

  useEffect(() => {
    champ.current?.focus()
  }, [])

  // Compte à rebours de la pause
  useEffect(() => {
    if (!bloqueJusqua) return
    const t = setInterval(() => {
      const n = Date.now()
      setMaintenant(n)
      if (n >= bloqueJusqua) {
        setBloqueJusqua(0)
        setEssais(0)
        setErreur('')
      }
    }, 500)
    return () => clearInterval(t)
  }, [bloqueJusqua])

  // Code tapé avant la fin de la connexion : on le vérifie dès qu'elle est prête
  useEffect(() => {
    if (authReady && chiffres.length === LONGUEUR) valider(chiffres)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady])

  // Échap ferme la fenêtre
  useEffect(() => {
    const surTouche = (e) => e.key === 'Escape' && onFermer()
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
  }, [onFermer])

  const bloque = bloqueJusqua > maintenant
  const secondes = Math.max(0, Math.ceil((bloqueJusqua - maintenant) / 1000))

  async function valider(code) {
    if (verification || bloque || !authReady) return
    setVerification(true)
    setErreur('')
    try {
      if (await verifierCodeProf(code)) {
        onOuvert()
        return
      }
      const n = essais + 1
      setEssais(n)
      setChiffres('')
      if (n >= ESSAIS_MAX) {
        setBloqueJusqua(Date.now() + PAUSE_MS)
        setMaintenant(Date.now())
        setErreur('Trop d’essais. Patiente un instant.')
      } else {
        setErreur('Code incorrect.')
      }
    } catch (err) {
      setErreur(err.message || 'Impossible de vérifier le code.')
      setChiffres('')
    } finally {
      setVerification(false)
      champ.current?.focus()
    }
  }

  function changer(valeur) {
    const propre = valeur.replace(/\D/g, '').slice(0, LONGUEUR)
    setChiffres(propre)
    if (propre.length === LONGUEUR) valider(propre)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#030610]/85 p-5 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Accès professeur"
      onClick={onFermer}
    >
      <div
        className="labo-apparait relative w-full max-w-xs rounded-3xl border-2 border-[#7CFF6B]/50 bg-[#0E1428] p-6 text-center shadow-[0_0_60px_rgba(124,255,107,.15)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onFermer}
          aria-label="Fermer"
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-[#8A93B8] active:scale-95"
        >
          <X size={20} />
        </button>

        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7CFF6B]/15 text-[#7CFF6B]">
          <KeyRound size={28} />
        </span>
        <h2 className="labo-titre mt-3 text-lg font-bold text-[#F4F6FF]">Espace prof</h2>

        <div className="mt-5 flex justify-center gap-3" onClick={() => champ.current?.focus()}>
          {Array.from({ length: LONGUEUR }).map((_, i) => (
            <span
              key={i}
              className={`h-4 w-4 rounded-full border-2 ${i < chiffres.length ? 'border-[#7CFF6B] bg-[#7CFF6B]' : 'border-[#8A93B8]'}`}
            />
          ))}
        </div>

        {/* Champ réel (fait apparaître le clavier numérique de la tablette) */}
        <input
          ref={champ}
          type="password"
          inputMode="numeric"
          autoComplete="off"
          maxLength={LONGUEUR}
          value={chiffres}
          onChange={(e) => changer(e.target.value)}
          disabled={verification || bloque}
          aria-label="Code d'accès"
          className="mx-auto mt-4 block h-12 w-40 rounded-xl border border-white/15 bg-[#070B16] text-center text-2xl tracking-[.5em] text-[#F4F6FF] outline-none focus:border-[#7CFF6B] disabled:opacity-50"
        />

        <p className="mt-3 min-h-[20px] text-sm text-[#FF8A95]" aria-live="polite">
          {bloque ? `Trop d’essais. Réessaie dans ${secondes} s.` : erreur}
        </p>
        {!authReady && <p className="text-xs text-[#8A93B8]">Connexion…</p>}
        {verification && <p className="text-xs text-[#8A93B8]">Vérification…</p>}
      </div>
    </div>
  )
}
