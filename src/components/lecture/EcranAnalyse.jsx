import { useEffect, useState } from 'react'
import { Camera, FileText, ScanText, X } from 'lucide-react'
import { PAS_DE_TEXTE } from '../../hooks/useLecture.js'
import { typeFichier } from '../../utils/document.js'

// =============================================================
//  Appli « Lis-moi » : écran pendant la reconnaissance du texte
//  (la photo avec un trait lumineux qui la parcourt + progression)
// =============================================================
export default function EcranAnalyse({ file, progression, erreur, onReprendre, onFermer }) {
  const [url, setUrl] = useState(null)

  const estImage = file && typeFichier(file) === 'image'

  useEffect(() => {
    if (!file || !estImage) return
    const u = URL.createObjectURL(file)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file, estImage])

  const pourcent = Math.round((progression || 0) * 100)
  const pasDeTexte = erreur?.code === PAS_DE_TEXTE

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#fbf7f0]/95 px-6 backdrop-blur-sm">
      <style>{`@keyframes balayage{0%{top:0%}50%{top:calc(100% - 4px)}100%{top:0%}}`}</style>

      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl shadow-indigo-950/20">
        {estImage ? (
          url && <img src={url} alt="" className="max-h-[50dvh] w-full object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-3 px-6 py-12">
            <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-400 to-indigo-600 text-white shadow-lg shadow-indigo-600/30">
              <FileText size={40} />
            </span>
            <p className="max-w-full truncate text-center font-semibold text-indigo-950">{file?.name}</p>
          </div>
        )}
        {!erreur && (
          <>
            <div className="absolute inset-0 bg-indigo-950/10" />
            <div
              className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-violet-500 to-transparent shadow-[0_0_24px_6px_rgba(139,92,246,0.55)]"
              style={{ animation: 'balayage 2.4s ease-in-out infinite' }}
            />
          </>
        )}
      </div>

      {!erreur ? (
        <div className="mt-8 w-full max-w-sm text-center">
          <p className="flex items-center justify-center gap-2 text-xl font-bold text-indigo-950">
            <ScanText size={24} className="text-violet-600" />
            {pourcent < 1 ? 'Je me prépare…' : progression >= 0.9 && !estImage ? 'J’enregistre…' : progression >= 1 ? 'J’enregistre…' : 'Je lis le texte…'}
          </p>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-indigo-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-[width] duration-300"
              style={{ width: `${Math.max(4, pourcent)}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-indigo-950/50">
            {pourcent < 1 ? 'La première fois, ça prend quelques secondes de plus.' : `${pourcent} %`}
          </p>
        </div>
      ) : (
        <div className="mt-8 w-full max-w-sm text-center">
          <p className="text-xl font-bold text-indigo-950">{pasDeTexte ? 'Je n’ai pas trouvé de texte' : 'Oups, ça n’a pas marché'}</p>
          <p className="mt-2 text-indigo-950/60">
            {pasDeTexte
              ? estImage
                ? 'Reprends la photo bien à plat, de près, avec de la lumière et sans reflet.'
                : 'Ce document ne contient pas de texte lisible.'
              : erreur.message}
          </p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={onFermer}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3.5 font-semibold text-indigo-900 shadow"
            >
              <X size={18} /> Fermer
            </button>
            <button
              onClick={onReprendre}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-indigo-600/30"
            >
              {estImage ? <Camera size={18} /> : <FileText size={18} />} {estImage ? 'Reprendre' : 'Autre fichier'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
