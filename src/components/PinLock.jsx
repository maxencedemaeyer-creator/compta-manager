import { useState, useRef, useEffect } from 'react'
import { Lock, Delete } from 'lucide-react'
import { usePin } from '../context/PinContext.jsx'

const PIN_LENGTH = 4

export default function PinLock() {
  const { unlock, error } = usePin()
  const [digits, setDigits] = useState([])
  const [shake, setShake] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (digits.length === PIN_LENGTH) {
      const pin = digits.join('')
      setSubmitting(true)
      unlock(pin).then((ok) => {
        setSubmitting(false)
        if (!ok) {
          setShake(true)
          setTimeout(() => {
            setShake(false)
            setDigits([])
          }, 400)
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits])

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-brand-600 to-brand-800 px-6 text-white safe-bottom">
      <div className="w-full max-w-xs flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center mb-6">
          <Lock size={28} />
        </div>
        <h1 className="text-xl font-semibold mb-1">Compta Manager</h1>
        <p className="text-white/70 text-sm mb-8">Entre ton code PIN</p>

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

        {error && <p className="text-red-200 text-sm mb-4 -mt-6">{error}</p>}

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
                className="h-16 rounded-2xl bg-white/10 text-xl font-medium active:bg-white/20 transition-colors"
              >
                {key}
              </button>
            )
          )}
        </div>
      </div>
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
