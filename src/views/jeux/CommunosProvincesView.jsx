import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HelpCircle, ChevronRight, Shuffle } from 'lucide-react'
import Chargement from '../../components/Chargement.jsx'
import { AnneauConnaissance, BarreDetail, couleurConnaissance } from '../../components/jeux/communos/Connaissance.jsx'
import { BoutonIcone, EnTete, FondPage, OngletsModes, Regles, Silhouette, useCarte } from '../../components/jeux/communos/Communs.jsx'
import { useCommunos, useCommunosLibres } from '../../hooks/useCommunos.js'
import { connaissanceProvince, listeProvinces, niveauConnaissance } from '../../utils/communos.js'

// =============================================================
//  COMMUNOS · mode Provinces : choix de la province
//  Chaque province affiche ton pourcentage de connaissance :
//  communes connues (40 %), rapidité (40 %), parties jouées (20 %).
// =============================================================
export default function CommunosProvincesView() {
  const navigate = useNavigate()
  const { carte, erreur } = useCarte()
  const { parties, loading } = useCommunos()
  const { libres, loading: chargeLibres } = useCommunosLibres()
  const [regles, setRegles] = useState(false)
  const [ouverte, setOuverte] = useState(null)

  const provinces = useMemo(() => {
    if (!carte) return []
    return listeProvinces(carte).map((p) => ({ ...p, k: connaissanceProvince(p, parties, libres) }))
  }, [carte, parties, libres])
  const moyenne = provinces.length ? Math.round(provinces.reduce((s, p) => s + p.k.score, 0) / provinces.length) : 0
  const niveauBelgique = niveauConnaissance(moyenne)

  if (erreur) {
    return <FondPage><p className="text-center py-20">Impossible de charger la carte. Vérifie ta connexion et recharge la page.</p></FondPage>
  }
  if (!carte || loading || chargeLibres) return <Chargement message="Chargement des provinces…" />

  return (
    <FondPage>
      <EnTete retour="/maxence/jeux" sousTitre="ENTRAÎNEMENT PAR PROVINCE">
        <BoutonIcone label="Règles" onClick={() => setRegles(true)}><HelpCircle size={18} /></BoutonIcone>
      </EnTete>
      <OngletsModes actif="provinces" />

      {/* Connaissance globale + carte des provinces colorées */}
      <div className="mt-4 rounded-3xl p-[1.5px] bg-gradient-to-br from-fuchsia-500/60 via-indigo-500/30 to-cyan-400/60">
        <div className="rounded-[22px] bg-[#0d0a24] p-4">
          <div className="flex items-center gap-4">
            <AnneauConnaissance score={moyenne} taille={72} epaisseur={6} />
            <div className="min-w-0">
              <p className="font-mono text-[11px] tracking-[0.25em] text-white/50">CONNAISSANCE DE LA BELGIQUE</p>
              <p className="text-lg font-black">{niveauBelgique.emoji} {niveauBelgique.nom}</p>
              <p className="text-xs text-white/50">Moyenne de tes 11 provinces (Bruxelles-Capitale comprise)</p>
            </div>
          </div>
          <svg viewBox={`0 0 ${carte.largeur} ${carte.hauteur}`} className="mt-3 w-full h-auto">
            {provinces.map((p) => (
                <path
                  key={p.slug}
                  onClick={() => navigate(`/maxence/jeux/communos/provinces/${p.slug}`)}
                  d={p.chemin}
                  fill={couleurConnaissance(p.k.score)}
                  fillOpacity={0.25 + (p.k.score / 100) * 0.65}
                  stroke="#0d0a24"
                  strokeWidth="0.4"
                  vectorEffect="non-scaling-stroke"
                  className="cursor-pointer hover:brightness-125 transition"
                />
            ))}
            <path d={carte.provinces} fill="none" stroke="#0d0a24" strokeWidth="2" vectorEffect="non-scaling-stroke" pointerEvents="none" />
            <path d={carte.pays} fill="none" stroke="#c4b5fd" strokeWidth="1.4" vectorEffect="non-scaling-stroke" pointerEvents="none" />
          </svg>
          <p className="text-[11px] text-white/40 text-center mt-1">Touche une province pour t’y entraîner</p>
        </div>
      </div>

      <Link
        to="/maxence/jeux/communos/libre"
        className="mt-3 flex items-center gap-3 rounded-2xl bg-white/[0.05] border border-white/10 p-3 hover:bg-white/[0.08]"
      >
        <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center shrink-0">
          <Shuffle size={20} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-bold">Toute la Belgique</span>
          <span className="block text-xs text-white/50">Partie libre sur les 565 communes, sans attendre demain</span>
        </span>
        <ChevronRight className="text-white/30" />
      </Link>

      <h2 className="mt-6 mb-3 font-mono text-xs tracking-[0.25em] text-white/60">CHOISIS UNE PROVINCE</h2>
      <div className="grid gap-2.5">
        {provinces.map((p) => {
          const k = p.k
          const detail = ouverte === p.slug
          return (
            <div key={p.slug} className="rounded-2xl bg-white/[0.05] border border-white/10 overflow-hidden">
              <div className="flex items-center gap-3 p-3">
                <Link to={`/maxence/jeux/communos/provinces/${p.slug}`} className="flex items-center gap-3 flex-1 min-w-0 group">
                  <Silhouette chemin={p.chemin} boite={p.boite} couleur={couleurConnaissance(k.score)} className="w-14 h-12 opacity-90 group-hover:opacity-100" contour="none" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold truncate">{p.court}</span>
                    <span className="block text-xs text-white/50 truncate">
                      {k.niveau.emoji} {k.niveau.nom} · {k.connues}/{k.total} communes
                    </span>
                    <span className="block text-[11px] text-white/35">
                      {k.jouees ? `${k.jouees} partie${k.jouees > 1 ? 's' : ''}${k.moyenne ? ` · ${k.moyenne.toFixed(1).replace('.', ',')} essais en moyenne` : ''}` : 'Jamais jouée'}
                    </span>
                  </span>
                </Link>
                <button type="button" onClick={() => setOuverte(detail ? null : p.slug)} aria-label="Détail" className="rounded-full">
                  <AnneauConnaissance score={k.score} taille={50} />
                </button>
              </div>
              {detail && (
                <div className="cm-apparait px-3 pb-3 grid gap-2">
                  <BarreDetail label="Communes connues (40 %)" valeur={k.couverture} texte={`${k.connues}/${k.total}`} />
                  <BarreDetail label="Rapidité (40 %)" valeur={k.rapidite} texte={`${Math.round(k.rapidite * 100)} %`} />
                  <BarreDetail label="Expérience (20 %)" valeur={k.experience} texte={`${k.jouees}/15 parties`} />
                  {k.record && <p className="text-[11px] text-white/45">Record : trouvée en {k.record} essai{k.record > 1 ? 's' : ''}</p>}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {regles && <Regles carte={carte} onFermer={() => setRegles(false)} />}
    </FondPage>
  )
}
