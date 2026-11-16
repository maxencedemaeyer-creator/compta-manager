import { useState } from 'react'
import { KeyRound, Scissors } from 'lucide-react'
import { BandeauVichy, StylesCouture, boutonRose, champCouture } from './Vichy.jsx'
import { CODE_GALERIE } from '../../hooks/useCouture.js'

// =============================================================
//  Petite porte d'entrée de la galerie publique : on tape le code
//  (« julie ») une fois, puis on navigue librement pendant la visite.
// =============================================================
const CLE = 'couture_acces'

function dejaEntre() {
  try {
    return sessionStorage.getItem(CLE) === 'oui'
  } catch {
    return false
  }
}

export default function CodeAcces({ children }) {
  const [ouvert, setOuvert] = useState(dejaEntre)
  const [code, setCode] = useState('')
  const [erreur, setErreur] = useState(false)

  if (ouvert) return children

  function valider(e) {
    e.preventDefault()
    if (code.trim().toLowerCase() === CODE_GALERIE) {
      try {
        sessionStorage.setItem(CLE, 'oui')
      } catch {
        /* navigation privée : on entre quand même */
      }
      setOuvert(true)
    } else {
      setErreur(true)
    }
  }

  return (
    <div className="min-h-dvh vichy-doux text-pink-950 flex flex-col">
      <StylesCouture />
      <BandeauVichy>
        <div className="h-[28dvh] min-h-[150px]" />
      </BandeauVichy>

      <div className="flex-1 px-5 -mt-24 pb-10">
        <form
          onSubmit={valider}
          className="couture-apparait mx-auto max-w-sm rounded-[2rem] bg-white p-1.5 shadow-xl shadow-pink-900/10"
        >
          <div className="couture-piqure rounded-[1.6rem] px-6 pt-7 pb-6 text-center">
            <span className="mx-auto w-14 h-14 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-md shadow-pink-500/30">
              <Scissors size={24} />
            </span>
            <h1 className="couture-titre mt-4 text-4xl leading-tight text-pink-950">L’atelier de Julie</h1>
            <p className="mt-1 text-sm text-pink-900/55">Insère le code de connexion pour découvrir les créations.</p>

            <div className="relative mt-6">
              <KeyRound size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-300" />
              <input
                className={`${champCouture} pl-11 text-center tracking-[0.2em] ${erreur ? 'ring-2 ring-red-300' : ''}`}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value)
                  setErreur(false)
                }}
                placeholder="Code"
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
                autoFocus
              />
            </div>
            {erreur && <p className="mt-2 text-sm text-red-500">Ce n’est pas le bon code 🙈</p>}

            <button type="submit" className={`${boutonRose} w-full mt-4`}>
              Entrer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
