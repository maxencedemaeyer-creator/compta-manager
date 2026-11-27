import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, ChevronDown, Droplets, Layers, MapPinned, Maximize, Minimize, Type } from 'lucide-react'
import Chargement from '../../components/Chargement.jsx'
import CarteAtlas from '../../components/atlas/CarteAtlas.jsx'
import { useAtlasBelgique } from '../../hooks/useAtlasBelgique.js'
import { COUCHES, EAUX, TYPES_VILLES } from '../../utils/atlas.js'

// =============================================================
//  ATLAS · Belgique
//  Une carte, quatre boutons : Couches, Noms, Villes, Hydrographie.
//  Fond clair, traits nets, gros boutons : pensé pour la projection.
// =============================================================

// Bouton de la barre, avec (ou sans) menu déroulant qui se ferme en cliquant ailleurs
function BoutonMenu({ icone: Icone, titre, resume, ouvert, onBascule, onFermer, children }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ouvert) return
    const dehors = (e) => ref.current && !ref.current.contains(e.target) && onFermer()
    const echap = (e) => e.key === 'Escape' && onFermer()
    document.addEventListener('pointerdown', dehors)
    document.addEventListener('keydown', echap)
    return () => {
      document.removeEventListener('pointerdown', dehors)
      document.removeEventListener('keydown', echap)
    }
  }, [ouvert, onFermer])
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={ouvert}
        onClick={onBascule}
        className={`h-14 w-60 pl-4 pr-3 rounded-2xl border text-left flex items-center gap-3 transition active:scale-[0.98] ${
          ouvert ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-200' : 'bg-white border-slate-300 hover:bg-slate-50'
        }`}
      >
        <Icone size={22} className="text-sky-600 shrink-0" />
        <span className="leading-tight min-w-0 flex-1">
          <span className="block text-base font-bold text-slate-900">{titre}</span>
          {resume && <span className="block text-xs text-slate-500 truncate">{resume}</span>}
        </span>
        <ChevronDown size={18} className={`shrink-0 text-slate-400 transition ${ouvert ? 'rotate-180' : ''}`} />
      </button>
      {ouvert && <div className="absolute z-30 top-[calc(100%+8px)] left-0 w-80 rounded-2xl bg-white border border-slate-300 shadow-xl p-2">{children}</div>}
    </div>
  )
}

function Ligne({ actif, onClick, titre, aide, carre = false }) {
  return (
    <button
      type="button"
      role={carre ? 'checkbox' : 'radio'}
      aria-checked={actif}
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left transition ${actif ? 'bg-sky-50' : 'hover:bg-slate-50'}`}
    >
      <span
        className={`w-6 h-6 shrink-0 flex items-center justify-center border-2 ${carre ? 'rounded-md' : 'rounded-full'} ${
          actif ? 'bg-sky-600 border-sky-600 text-white' : 'border-slate-300 bg-white'
        }`}
      >
        {actif && <Check size={15} strokeWidth={3.5} />}
      </span>
      <span className="leading-tight">
        <span className="block text-base font-semibold text-slate-900">{titre}</span>
        {aide && <span className="block text-sm text-slate-500">{aide}</span>}
      </span>
    </button>
  )
}

export default function AtlasBelgiqueView() {
  const { carte, atlas, erreur } = useAtlasBelgique()
  const racine = useRef(null)
  const [menu, setMenu] = useState(null) // 'couches' | 'villes' | 'eau'
  const [couche, setCouche] = useState('vierge')
  const [noms, setNoms] = useState(true)
  const [villes, setVilles] = useState({ bruxelles: false, chefsLieux: false, importantes: false })
  const [nomsVilles, setNomsVilles] = useState(true)
  const [eau, setEau] = useState('aucune')
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

  const nbVilles = Object.values(villes).filter(Boolean).length
  const resumeVilles = nbVilles === 0 ? 'Aucune' : TYPES_VILLES.filter((t) => villes[t.id]).map((t) => t.resume).join(', ')
  const coucheActive = COUCHES.find((c) => c.id === couche)
  const eauActive = EAUX.find((e) => e.id === eau)
  const fermer = () => setMenu(null)
  const basculer = (id) => setMenu((m) => (m === id ? null : id))

  return (
    <div ref={racine} className="h-dvh flex flex-col bg-[#f4f6f8] text-slate-900 overflow-hidden">
      <header className="shrink-0 flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3 bg-white border-b border-slate-200">
        <Link to="/maxence/atlas" aria-label="Retour à l’Atlas" className="w-12 h-12 rounded-xl border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-50 active:scale-95">
          <ArrowLeft size={22} />
        </Link>
        <h1 className="text-2xl font-black tracking-tight mr-2">Belgique</h1>

        <div className="flex flex-wrap items-center gap-3">
          {/* 1. Couches */}
          <BoutonMenu icone={Layers} titre="Couches" resume={coucheActive.nom} ouvert={menu === 'couches'} onBascule={() => basculer('couches')} onFermer={fermer}>
            {COUCHES.map((c) => (
              <Ligne
                key={c.id}
                actif={couche === c.id}
                titre={c.nom}
                aide={c.aide}
                onClick={() => {
                  setCouche(c.id)
                  setSelection(null)
                  fermer()
                }}
              />
            ))}
          </BoutonMenu>

          {/* 2. Noms : afficher / masquer */}
          <button
            type="button"
            aria-pressed={noms}
            onClick={() => setNoms((n) => !n)}
            className={`h-14 px-4 rounded-2xl border flex items-center gap-3 transition active:scale-[0.98] ${
              noms ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-200' : 'bg-white border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Type size={22} className="text-sky-600" />
            <span className="leading-tight text-left">
              <span className="block text-base font-bold text-slate-900">Noms</span>
              <span className="block text-xs text-slate-500">{noms ? 'Affichés' : 'Masqués'}</span>
            </span>
          </button>

          {/* 3. Villes */}
          <BoutonMenu icone={MapPinned} titre="Villes" resume={resumeVilles} ouvert={menu === 'villes'} onBascule={() => basculer('villes')} onFermer={fermer}>
            {TYPES_VILLES.map((t) => (
              <Ligne key={t.id} carre actif={villes[t.id]} titre={t.nom} aide={t.aide} onClick={() => setVilles((v) => ({ ...v, [t.id]: !v[t.id] }))} />
            ))}
            <div className="my-2 border-t border-slate-200" />
            <Ligne carre actif={!nomsVilles} titre="Masquer les noms" aide="Garder seulement les points" onClick={() => setNomsVilles((n) => !n)} />
          </BoutonMenu>

          {/* 4. Hydrographie */}
          <BoutonMenu icone={Droplets} titre="Hydrographie" resume={eauActive.resume || eauActive.nom} ouvert={menu === 'eau'} onBascule={() => basculer('eau')} onFermer={fermer}>
            {EAUX.map((e) => (
              <Ligne
                key={e.id}
                actif={eau === e.id}
                titre={e.nom}
                aide={e.aide}
                onClick={() => {
                  setEau(e.id)
                  fermer()
                }}
              />
            ))}
          </BoutonMenu>
        </div>

        <button
          type="button"
          onClick={basculerPleinEcran}
          aria-label={pleinEcran ? 'Quitter le plein écran' : 'Plein écran'}
          className="ml-auto w-12 h-12 rounded-xl border border-slate-300 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 active:scale-95"
        >
          {pleinEcran ? <Minimize size={22} /> : <Maximize size={22} />}
        </button>
      </header>

      <main className="flex-1 min-h-0 p-2">
        <CarteAtlas
          carte={carte}
          atlas={atlas}
          couche={couche}
          noms={noms}
          villes={villes}
          nomsVilles={nomsVilles}
          eau={eau}
          selection={selection}
          onSelection={setSelection}
        />
      </main>
    </div>
  )
}
