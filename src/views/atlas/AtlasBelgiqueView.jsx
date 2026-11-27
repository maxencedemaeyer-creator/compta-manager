import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, Maximize, Minimize } from 'lucide-react'
import Chargement from '../../components/Chargement.jsx'
import CarteAtlas from '../../components/atlas/CarteAtlas.jsx'
import { useAtlasBelgique } from '../../hooks/useAtlasBelgique.js'
import { COUCHES, EAUX, TYPES_VILLES } from '../../utils/atlas.js'

// =============================================================
//  ATLAS · Belgique
//  Une carte et, à gauche, une colonne mince avec tous les choix :
//  Couches, Noms, Villes, Hydrographie. Rien ne se déroule par-dessus
//  la carte : elle reste toujours entièrement visible.
//  Fond clair, traits nets : pensé pour la projection.
// =============================================================

function Titre({ children }) {
  return <h2 className="px-2 pt-4 pb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{children}</h2>
}

// Une ligne de choix : rond (un seul choix possible) ou carré (plusieurs possibles)
function Ligne({ actif, onClick, titre, aide, carre = false }) {
  return (
    <button
      type="button"
      role={carre ? 'checkbox' : 'radio'}
      aria-checked={actif}
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition ${actif ? 'bg-sky-50' : 'hover:bg-slate-50'}`}
    >
      <span
        className={`w-[18px] h-[18px] shrink-0 flex items-center justify-center border-2 ${carre ? 'rounded' : 'rounded-full'} ${
          actif ? 'bg-sky-600 border-sky-600 text-white' : 'border-slate-300 bg-white'
        }`}
      >
        {actif && <Check size={12} strokeWidth={4} />}
      </span>
      <span className="leading-tight min-w-0">
        <span className={`block text-[15px] ${actif ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>{titre}</span>
        {aide && <span className="block text-[11px] text-slate-500 truncate">{aide}</span>}
      </span>
    </button>
  )
}

export default function AtlasBelgiqueView() {
  const { carte, atlas, erreur } = useAtlasBelgique()
  const racine = useRef(null)
  const [couche, setCouche] = useState('vierge')
  const [noms, setNoms] = useState(true)
  const [villes, setVilles] = useState({ bruxelles: false, chefsLieux: false, importantes: false })
  const [nomsVilles, setNomsVilles] = useState(true)
  const [eau, setEau] = useState('aucune')
  const [mer, setMer] = useState(false)
  const [selection, setSelection] = useState(null)
  const [pleinEcran, setPleinEcran] = useState(false)

  useEffect(() => {
    const maj = () => setPleinEcran(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', maj)
    return () => document.removeEventListener('fullscreenchange', maj)
  }, [])
  function basculerPleinEcran() {
    if (document.fullscreenElement) document.exitFullscreen?.()
    else racine.current?.requestFullscreen?.().catch(() => {})
  }

  if (erreur) {
    return <div className="min-h-dvh flex items-center justify-center bg-[#f4f6f8] text-slate-700">La carte n’a pas pu être chargée. Recharge la page.</div>
  }
  if (!carte || !atlas) return <Chargement message="Chargement de la carte…" />

  return (
    <div ref={racine} className="h-dvh flex bg-[#f4f6f8] text-slate-900 overflow-hidden">
      {/* Colonne des choix */}
      <aside className="shrink-0 w-60 flex flex-col bg-white border-r border-slate-200">
        <div className="shrink-0 flex items-center gap-2 px-3 py-3 border-b border-slate-200">
          <Link to="/maxence/atlas" aria-label="Retour à l’Atlas" className="w-10 h-10 shrink-0 rounded-xl border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-50 active:scale-95">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="flex-1 text-xl font-black tracking-tight">Belgique</h1>
          <button
            type="button"
            onClick={basculerPleinEcran}
            aria-label={pleinEcran ? 'Quitter le plein écran' : 'Plein écran'}
            className="w-10 h-10 shrink-0 rounded-xl border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-50 active:scale-95"
          >
            {pleinEcran ? <Minimize size={19} /> : <Maximize size={19} />}
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-4">
          <Titre>Couches</Titre>
          {COUCHES.map((c) => (
            <Ligne
              key={c.id}
              actif={couche === c.id}
              titre={c.nom}
              onClick={() => {
                setCouche(c.id)
                setSelection(null)
              }}
            />
          ))}

          <Titre>Noms</Titre>
          <button
            type="button"
            role="switch"
            aria-checked={noms}
            onClick={() => setNoms((n) => !n)}
            className="w-full flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50"
          >
            <span className="text-[15px] font-semibold text-slate-800">{noms ? 'Affichés' : 'Masqués'}</span>
            <span className={`relative w-11 h-6 rounded-full transition ${noms ? 'bg-sky-600' : 'bg-slate-300'}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${noms ? 'left-[22px]' : 'left-0.5'}`} />
            </span>
          </button>

          <Titre>Villes</Titre>
          {TYPES_VILLES.map((t) => (
            <Ligne key={t.id} carre actif={villes[t.id]} titre={t.nom} aide={t.aide} onClick={() => setVilles((v) => ({ ...v, [t.id]: !v[t.id] }))} />
          ))}
          <Ligne carre actif={!nomsVilles} titre="Masquer les noms" aide="Garder seulement les points" onClick={() => setNomsVilles((n) => !n)} />

          <Titre>Hydrographie</Titre>
          {EAUX.map((e) => (
            <Ligne key={e.id} actif={eau === e.id} titre={e.nom} aide={e.aide} onClick={() => setEau(e.id)} />
          ))}
          <Ligne carre actif={mer} titre="Mer du Nord" onClick={() => setMer((m) => !m)} />
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-2">
        <CarteAtlas
          carte={carte}
          atlas={atlas}
          couche={couche}
          noms={noms}
          villes={villes}
          nomsVilles={nomsVilles}
          eau={eau}
          mer={mer}
          selection={selection}
          onSelection={setSelection}
        />
      </main>
    </div>
  )
}
