import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, Maximize, Minimize } from 'lucide-react'
import Chargement from '../../components/Chargement.jsx'
import CarteMonde from '../../components/atlas/CarteMonde.jsx'
import { useAtlasMonde } from '../../hooks/useAtlasMonde.js'
import { LIGNES, PLANISPHERES, PROJECTIONS, PROJECTION_BASE, PROPRIETES, ZONES_CLIMAT, construireVue, continentsAffiches } from '../../utils/atlasMonde.js'

// =============================================================
//  ATLAS · Monde
//  Six volets : carte vierge · continents, océans et lignes imaginaires ·
//  fuseaux horaires · zones climatiques · projections · planisphères
//  selon les régions. Même disposition que la Belgique : une carte et,
//  à gauche, une colonne mince avec tous les choix.
// =============================================================
const VOLETS = [
  { id: 'vierge', nom: 'Carte vierge', aide: 'Rien d’écrit : toucher un continent pour son nom' },
  { id: 'affichage', nom: 'Continents, océans et repères', aide: 'Noms, pays, parallèles, hémisphères, pôles' },
  { id: 'fuseaux', nom: 'Fuseaux horaires', aide: '24 tranches de 15° de longitude' },
  { id: 'climats', nom: 'Zones climatiques', aide: 'Chaude, tempérée, froide' },
  { id: 'projections', nom: 'Projections', aide: 'Comment aplatir la Terre' },
  { id: 'planispheres', nom: 'Planisphères du monde', aide: 'Selon le pays : centre et sens' },
]

const CENTRES = [
  { id: 0, nom: 'Greenwich (0°)' },
  { id: -95, nom: 'Amériques (95° O)' },
  { id: 105, nom: 'Asie (105° E)' },
  { id: 160, nom: 'Pacifique (160° E)' },
]

function Titre({ children }) {
  return <h2 className="px-2 pt-3 pb-0.5 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{children}</h2>
}

// Une ligne de choix : rond (un seul choix possible) ou carré (plusieurs possibles)
function Ligne({ actif, onClick, titre, aide, carre = false, pastille }) {
  return (
    <button
      type="button"
      role={carre ? 'checkbox' : 'radio'}
      aria-checked={actif}
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 rounded-lg px-2 py-1 text-left transition ${actif ? 'bg-sky-50' : 'hover:bg-slate-50'}`}
    >
      <span
        className={`w-[18px] h-[18px] shrink-0 flex items-center justify-center border-2 ${carre ? 'rounded' : 'rounded-full'} ${
          actif ? 'bg-sky-600 border-sky-600 text-white' : 'border-slate-300 bg-white'
        }`}
      >
        {actif && <Check size={12} strokeWidth={4} />}
      </span>
      <span className="leading-tight min-w-0 flex-1">
        <span className={`block text-[15px] ${actif ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>{titre}</span>
        {aide && <span className="block text-[11px] text-slate-500">{aide}</span>}
      </span>
      {pastille && <span className="w-4 h-4 shrink-0 rounded-sm border border-black/10" style={{ background: pastille }} />}
    </button>
  )
}

function Interrupteur({ actif, onClick, titre }) {
  return (
    <button type="button" role="switch" aria-checked={actif} onClick={onClick} className="w-full flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50">
      <span className="text-[15px] font-semibold text-slate-800">{titre}</span>
      <span className={`relative w-11 h-6 shrink-0 rounded-full transition ${actif ? 'bg-sky-600' : 'bg-slate-300'}`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${actif ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
    </button>
  )
}

function Explication({ titre, badge, texte }) {
  return (
    <div className="mx-1 mt-3 rounded-xl bg-slate-50 border border-slate-200 p-3">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-[15px] font-black text-slate-900">{titre}</p>
        {badge && <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${badge.couleur}`}>{badge.court}</span>}
      </div>
      {badge && <p className="mt-0.5 text-[11px] font-semibold text-slate-500">{badge.nom}</p>}
      <p className="mt-1.5 text-[13px] leading-snug text-slate-700">{texte}</p>
    </div>
  )
}

// Réglages communs : limites des pays, Amérique en un ou deux continents
function ReglagesCommuns({ pays, setPays, scinde, setScinde }) {
  return (
    <>
      <Titre>Pays et continents</Titre>
      <Ligne carre actif={pays} titre="Limites des pays" aide="Pointillés : tracé contesté" onClick={() => setPays((x) => !x)} />
      <Ligne carre actif={scinde} titre="Séparer l’Amérique" aide="Amérique du Nord et du Sud" onClick={() => setScinde((x) => !x)} />
    </>
  )
}

export default function AtlasMondeView() {
  const { continents, frontieres, erreur } = useAtlasMonde()
  const racine = useRef(null)
  const [volet, setVolet] = useState('affichage')
  const [pleinEcran, setPleinEcran] = useState(false)
  const [selection, setSelection] = useState(null)

  // Volet « Continents et océans »
  const [couleurs, setCouleurs] = useState(true)
  const [nomsContinents, setNomsContinents] = useState(true)
  const [nomsOceans, setNomsOceans] = useState(true)
  const [lignes, setLignes] = useState([])
  const [hemisNS, setHemisNS] = useState(false)
  const [hemisEO, setHemisEO] = useState(false)
  const [poles, setPoles] = useState(false)
  // Réglages communs à plusieurs volets
  const [pays, setPays] = useState(false)
  const [scinde, setScinde] = useState(false)
  const [nomsLignes, setNomsLignes] = useState(true)
  // Fuseaux
  const [heure, setHeure] = useState(12)
  // Zones climatiques
  const [nomsClimat, setNomsClimat] = useState(true)
  // Projections
  const [projection, setProjection] = useState('mercator')
  const [centre, setCentre] = useState(0)
  const [grille, setGrille] = useState(true)
  const [tissot, setTissot] = useState(false)
  const [nomsProj, setNomsProj] = useState(false)
  // Planisphères
  const [planisphere, setPlanisphere] = useState('europe')
  const [nomsPlani, setNomsPlani] = useState(true)
  const [lignesPlani, setLignesPlani] = useState(['equateur', 'greenwich'])

  useEffect(() => {
    const maj = () => setPleinEcran(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', maj)
    return () => document.removeEventListener('fullscreenchange', maj)
  }, [])
  function basculerPleinEcran() {
    if (document.fullscreenElement) document.exitFullscreen?.()
    else racine.current?.requestFullscreen?.().catch(() => {})
  }
  const basculer = (liste, setListe, id) => setListe(liste.includes(id) ? liste.filter((x) => x !== id) : [...liste, id])

  const listeContinents = useMemo(() => continentsAffiches(scinde), [scinde])
  const defProjection = PROJECTIONS.find((p) => p.id === projection)
  const defPlani = PLANISPHERES.find((p) => p.id === planisphere)

  // La projection de la carte selon le volet (les 4 premiers volets : la projection de base, Robinson)
  const reglage = useMemo(() => {
    if (volet === 'projections') return { projectionId: projection, centre, pole: 'nord' }
    if (volet === 'planispheres') return { projectionId: defPlani.projection, centre: defPlani.centre, inverse: !!defPlani.inverse, pole: defPlani.pole || 'nord' }
    return { projectionId: PROJECTION_BASE, centre: 0 }
  }, [volet, projection, centre, defPlani])
  const vue = useMemo(() => construireVue(reglage), [reglage])

  // Ce que la carte affiche, selon le volet
  const affichage = useMemo(() => {
    switch (volet) {
      case 'vierge':
        return { couleurs: false, nomsContinents: false, nomsOceans: false, lignes: [], nomsLignes: false, pays }
      case 'affichage': {
        // Les hémisphères tracent aussi leurs limites : équateur (nord / sud), Greenwich et 180° (est / ouest)
        const limites = [...lignes, ...(hemisNS ? ['equateur'] : []), ...(hemisEO ? ['greenwich', 'antimeridien'] : [])]
        return { couleurs, nomsContinents, nomsOceans, lignes: [...new Set(limites)], nomsLignes, pays, hemispheres: { ns: hemisNS, eo: hemisEO }, poles }
      }
      case 'fuseaux':
        return { couleurs: false, nomsContinents: false, nomsOceans: false, lignes: [], nomsLignes: false, fuseaux: true }
      case 'climats':
        return { couleurs: false, nomsContinents: false, nomsOceans: false, lignes: ['equateur', 'cancer', 'capricorne', 'arctique', 'antarctique'], nomsLignes: nomsClimat, climat: true }
      case 'projections':
        return { couleurs: true, nomsContinents: nomsProj, nomsOceans: false, lignes: [], nomsLignes: false, avecGrille: grille, tissot, pays }
      default:
        return { couleurs: true, nomsContinents: nomsPlani, nomsOceans: nomsPlani, lignes: lignesPlani, nomsLignes: false, pays }
    }
  }, [volet, couleurs, nomsContinents, nomsOceans, lignes, hemisNS, hemisEO, poles, pays, nomsLignes, nomsClimat, nomsProj, grille, tissot, nomsPlani, lignesPlani])

  if (erreur) {
    return <div className="min-h-dvh flex items-center justify-center bg-[#f4f6f8] text-slate-700">La carte n’a pas pu être chargée. Recharge la page.</div>
  }
  if (!continents || !frontieres) return <Chargement message="Chargement de la carte du monde…" />

  return (
    <div ref={racine} className="h-dvh flex bg-[#f4f6f8] text-slate-900 overflow-hidden">
      <aside className="shrink-0 w-72 flex flex-col bg-white border-r border-slate-200">
        <div className="shrink-0 flex items-center gap-2 px-3 py-3 border-b border-slate-200">
          <Link to="/maxence/atlas" aria-label="Retour à l’Atlas" className="w-10 h-10 shrink-0 rounded-xl border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-50 active:scale-95">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="flex-1 text-xl font-black tracking-tight">Le monde</h1>
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
          <Titre>Volets</Titre>
          {VOLETS.map((v) => (
            <Ligne
              key={v.id}
              actif={volet === v.id}
              titre={v.nom}
              aide={v.aide}
              onClick={() => {
                setVolet(v.id)
                setSelection(null)
              }}
            />
          ))}

          {volet === 'vierge' && <ReglagesCommuns pays={pays} setPays={setPays} scinde={scinde} setScinde={setScinde} />}

          {volet === 'affichage' && (
            <>
              <Titre>Continents et océans</Titre>
              <Ligne carre actif={couleurs} titre="Continents en couleur" onClick={() => setCouleurs((x) => !x)} />
              <Ligne carre actif={nomsContinents} titre="Noms des continents" onClick={() => setNomsContinents((x) => !x)} />
              <Ligne carre actif={nomsOceans} titre="Noms des océans" onClick={() => setNomsOceans((x) => !x)} />
              <ReglagesCommuns pays={pays} setPays={setPays} scinde={scinde} setScinde={setScinde} />
              <Titre>Parallèles et méridiens</Titre>
              {LIGNES.filter((l) => !l.auxiliaire).map((l) => (
                <Ligne key={l.id} carre actif={lignes.includes(l.id)} titre={l.nom} pastille={l.couleur} onClick={() => basculer(lignes, setLignes, l.id)} />
              ))}
              <Titre>Hémisphères et pôles</Titre>
              <Ligne carre actif={hemisNS} titre="Hémisphères nord et sud" aide="Séparés par l’équateur" onClick={() => setHemisNS((x) => !x)} />
              <Ligne carre actif={hemisEO} titre="Hémisphères est et ouest" aide="Séparés par Greenwich et le méridien 180°" onClick={() => setHemisEO((x) => !x)} />
              <Ligne carre actif={poles} titre="Pôles Nord et Sud" onClick={() => setPoles((x) => !x)} />
              <Ligne carre actif={nomsLignes} titre="Noms des lignes et hémisphères" onClick={() => setNomsLignes((x) => !x)} />
            </>
          )}

          {volet === 'fuseaux' && (
            <>
              <Titre>Heure</Titre>
              <div className="px-2 py-1">
                <label className="block text-[15px] font-semibold text-slate-800" htmlFor="heure-greenwich">
                  À Greenwich : <span className="font-black text-sky-700">{heure} h</span>
                </label>
                <input
                  id="heure-greenwich"
                  type="range"
                  min="0"
                  max="23"
                  step="1"
                  value={heure}
                  onChange={(e) => setHeure(Number(e.target.value))}
                  className="mt-1 w-full accent-sky-600"
                />
              </div>
              <Explication
                titre="Comment lire la carte ?"
                texte="Rangée du haut : le décalage de chaque fuseau avec Greenwich (+1 = une heure de plus). Rangée du dessous : l’heure qu’il y est quand il est l’heure choisie à Greenwich. « +1j » : déjà le lendemain ; « −1j » : encore la veille. La Belgique est dans le fuseau +1 (+2 en été, à l’heure d’été)."
              />
            </>
          )}

          {volet === 'climats' && (
            <>
              <Titre>Zones</Titre>
              {[ZONES_CLIMAT[0], ZONES_CLIMAT[1], ZONES_CLIMAT[3]].map((z) => (
                <div key={z.id} className="flex items-center gap-2.5 px-2 py-1">
                  <span className="w-[18px] h-[18px] shrink-0 rounded border border-black/10" style={{ background: z.terre }} />
                  <span className="leading-tight">
                    <span className="block text-[15px] font-bold text-slate-900">{z.nom}</span>
                    <span className="block text-[11px] text-slate-500">{z.aide}</span>
                  </span>
                </div>
              ))}
              <Titre>Affichage</Titre>
              <Ligne carre actif={nomsClimat} titre="Noms des zones et des lignes" onClick={() => setNomsClimat((x) => !x)} />
              <Explication
                titre="Pourquoi ces zones ?"
                texte="Le Soleil chauffe surtout là où il passe haut dans le ciel. Les tropiques (23° 26′) sont les limites où il peut être à la verticale ; les cercles polaires (66° 34′), celles où le jour ou la nuit peuvent durer 24 h. Cela donne 3 zones, 5 avec le Nord et le Sud."
              />
            </>
          )}

          {volet === 'projections' && (
            <>
              <Titre>Projection</Titre>
              {PROJECTIONS.map((p) => (
                <Ligne key={p.id} actif={projection === p.id} titre={p.nom} aide={PROPRIETES[p.propriete].court} onClick={() => setProjection(p.id)} />
              ))}
              <Explication titre={defProjection.nom} badge={PROPRIETES[defProjection.propriete]} texte={defProjection.texte} />
              <Titre>Centre de la carte</Titre>
              {CENTRES.map((c) => (
                <Ligne key={c.id} actif={centre === c.id} titre={c.nom} onClick={() => setCentre(c.id)} />
              ))}
              <Titre>Affichage</Titre>
              <Ligne carre actif={grille} titre="Grille (tous les 30°)" onClick={() => setGrille((x) => !x)} />
              <Ligne carre actif={tissot} titre="Cercles de déformation" aide="Des cercles identiques sur le globe" onClick={() => setTissot((x) => !x)} />
              <Ligne carre actif={nomsProj} titre="Noms des continents" onClick={() => setNomsProj((x) => !x)} />
              <ReglagesCommuns pays={pays} setPays={setPays} scinde={scinde} setScinde={setScinde} />
            </>
          )}

          {volet === 'planispheres' && (
            <>
              <Titre>Planisphère</Titre>
              {PLANISPHERES.map((p) => (
                <Ligne key={p.id} actif={planisphere === p.id} titre={p.nom} onClick={() => setPlanisphere(p.id)} />
              ))}
              <Explication titre={defPlani.nom} texte={defPlani.texte} />
              <Titre>Affichage</Titre>
              <Ligne carre actif={nomsPlani} titre="Noms des continents et océans" onClick={() => setNomsPlani((x) => !x)} />
              {LIGNES.filter((l) => l.id === 'equateur' || l.id === 'greenwich').map((l) => (
                <Ligne key={l.id} carre actif={lignesPlani.includes(l.id)} titre={l.nom} pastille={l.couleur} onClick={() => basculer(lignesPlani, setLignesPlani, l.id)} />
              ))}
              <ReglagesCommuns pays={pays} setPays={setPays} scinde={scinde} setScinde={setScinde} />
            </>
          )}
        </div>

        <p className="shrink-0 border-t border-slate-200 px-3 py-2 text-[10px] leading-snug text-slate-400">Contours : Natural Earth (domaine public) · Projections : d3-geo</p>
      </aside>

      <main className="flex-1 min-w-0 p-2">
        <CarteMonde
          vue={vue}
          donneesContinents={continents}
          listeContinents={listeContinents}
          frontieres={frontieres}
          avecPays={!!affichage.pays}
          hemispheres={affichage.hemispheres || { ns: false, eo: false }}
          poles={!!affichage.poles}
          couleurs={affichage.couleurs}
          nomsContinents={affichage.nomsContinents}
          nomsOceans={affichage.nomsOceans}
          lignes={affichage.lignes}
          nomsLignes={affichage.nomsLignes}
          fuseaux={!!affichage.fuseaux}
          heure={heure}
          climat={!!affichage.climat}
          avecGrille={!!affichage.avecGrille}
          tissot={!!affichage.tissot}
          centre={reglage.centre}
          selection={selection}
          onSelection={setSelection}
        />
      </main>
    </div>
  )
}
