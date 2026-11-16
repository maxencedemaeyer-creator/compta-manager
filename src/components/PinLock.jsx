import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Delete, KeyRound, Lock } from 'lucide-react'
import { usePin } from '../context/PinContext.jsx'
import { trouverProfil } from '../config/profils.js'
import Chargement from './Chargement.jsx'
import PinOublie from './PinOublie.jsx'

const PIN_LENGTH = 4

export default function PinLock() {
  const { profilId, unlock, creerPin, etatPin, error } = usePin()
  const profil = trouverProfil(profilId)
  const creation = etatPin === 'absent'

  const [digits, setDigits] = useState([])
  const [premierPin, setPremierPin] = useState(null) // création : PIN tapé une 1re fois
  const [messageLocal, setMessageLocal] = useState('')
  const [shake, setShake] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [oubli, setOubli] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [etatPin])

  function echec(message = '') {
    setMessageLocal(message)
    setShake(true)
    setTimeout(() => {
      setShake(false)
      setDigits([])
    }, 400)
  }

  useEffect(() => {
    if (digits.length !== PIN_LENGTH) return
    const pin = digits.join('')

    if (creation) {
      if (!premierPin) {
        setPremierPin(pin)
        setMessageLocal('')
        setDigits([])
        return
      }
      if (pin !== premierPin) {
        setPremierPin(null)
        echec('Les deux codes ne correspondent pas. Recommence.')
        return
      }
      setSubmitting(true)
      creerPin(pin).then((ok) => {
        setSubmitting(false)
        if (!ok) {
          setPremierPin(null)
          echec()
        }
      })
      return
    }

    setSubmitting(true)
    unlock(pin).then((ok) => {
      setSubmitting(false)
      if (!ok) echec()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits])

  if (etatPin === 'inconnu' && !error) {
    return <Chargement message="Ouverture de l'espace…" />
  }

  function pushDigit(d) {
    if (submitting) return
    setDigits((prev) => (prev.length < PIN_LENGTH ? [...prev, d] : prev))
  }

  function popDigit() {
    setDigits((prev) => prev.slice(0, -1))
  }

  function handleHiddenInput(e) {
    const val = e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH)
    setDigits(val.split(''))
  }

  const keypad = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del']
  const consigne = !creation
    ? 'Entre ton code PIN'
    : premierPin
      ? 'Confirme ton nouveau code'
      : 'Bienvenue ! Choisis ton code PIN à 4 chiffres'
  const messageAffiche = messageLocal || error

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center ${
        profil?.fondPin || 'bg-gradient-to-b from-emerald-700 to-emerald-950'
      } px-6 text-white safe-bottom relative overflow-hidden`}
    >
      {/* Halos lumineux */}
      <div className="blob pointer-events-none absolute -top-24 -right-20 w-72 h-72 rounded-full bg-white/15 blur-3xl" />
      <div className="blob pointer-events-none absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-douceur/30 blur-3xl" />
      <Link
        to="/"
        className="absolute z-10 top-5 left-4 inline-flex items-center gap-1 text-sm text-white/60 hover:text-white"
      >
        <ChevronLeft size={18} />
        Profils
      </Link>

      {oubli ? (
        <PinOublie onRetour={() => setOubli(false)} />
      ) : (
      <div className="relative w-full max-w-xs flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center mb-6">
          {creation ? <KeyRound size={28} /> : <Lock size={28} />}
        </div>
        <h1 className="font-display text-4xl font-semibold mb-1">{profil?.nom}</h1>
        <p className="text-white/70 text-sm mb-8 text-center">{consigne}</p>

        <div
          className={`flex gap-4 mb-10 ${shake ? 'animate-pulse' : ''}`}
          style={shake ? { animation: 'shake 0.4s' } : undefined}
        >
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 border-white/70 ${
                i < digits.length ? 'bg-white' : 'bg-transparent'
              }`}
            />
          ))}
        </div>

        {messageAffiche && <p className="text-red-200 text-sm mb-4 -mt-6 text-center">{messageAffiche}</p>}

        {/* Champ invisible pour capter la saisie clavier physique / autofill mobile */}
        <input
          ref={inputRef}
          value={digits.join('')}
          onChange={handleHiddenInput}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={PIN_LENGTH}
          className="sr-only"
          autoFocus
        />

        <div className="grid grid-cols-3 gap-4 w-full">
          {keypad.map((key, i) =>
            key === '' ? (
              <div key={i} />
            ) : key === 'del' ? (
              <button
                key={i}
                onClick={popDigit}
                className="h-16 rounded-2xl flex items-center justify-center text-white/80 active:bg-white/10"
                aria-label="Effacer"
              >
                <Delete size={22} />
              </button>
            ) : (
              <button
                key={i}
                onClick={() => pushDigit(key)}
                className="h-16 rounded-2xl bg-white/10 backdrop-blur text-xl font-medium active:bg-white/20 transition-colors"
              >
                {key}
              </button>
            )
          )}
        </div>

        {!creation && (
          <button
            type="button"
            onClick={() => setOubli(true)}
            className="mt-8 text-sm text-white/60 hover:text-white underline-offset-4 hover:underline"
          >
            PIN oublié ?
          </button>
        )}
      </div>
      )}
      <style>{`
        @keyframes shake {
          10%, 90% { transform: translateX(-2px); }
          20%, 80% { transform: translateX(4px); }
          30%, 50%, 70% { transform: translateX(-8px); }
          40%, 60% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  )
}
