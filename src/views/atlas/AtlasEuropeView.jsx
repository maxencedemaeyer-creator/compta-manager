import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Maximize, Minimize } from 'lucide-react'
import Chargement from '../../components/Chargement.jsx'
import CarteEurope from '../../components/atlas/CarteEurope.jsx'
import { Explication, Legende, Liste, Ligne, Titre } from '../../components/atlas/Commandes.jsx'
import { useAtlasEurope } from '../../hooks/useAtlasEurope.js'
import {
  CATEGORIES_LIMITES,
  CANDIDATS_UE,
  DATE_STATUTS,
  ESPACE_SCHENGEN,
  LEGENDE_EURO,
  LEGENDE_SCHENGEN,
  LEGENDE_UE,
  LISTES,
  MEMBRES_UE,
  MONTAGNES,
  SOMMETS,
  ZONE_EURO,
  construireVueEurope,
  fichePays,
  formaterAlt,
  remplissage,
} from '../../utils/atlasEurope.js'

// =============================================================
//  ATLAS · Europe
//  Huit volets : carte vierge · pays · capitales · Union européenne ·
//  zone euro · espace Schengen · montagnes · limites de l'Europe.
//  Même disposition que le monde et la Belgique : une carte et, à gauche,
//  une colonne mince avec tous les choix. Sur chaque carte, un bouton
//  « Belgique » (propre à cette carte) met la Belgique en couleur.
// =============================================================
const VOLETS = [
  { id: 'vierge', nom: 'Carte vierge', aide: 'Rien d’écrit : toucher un pays pour son nom' },
  { id: 'pays', nom: 'Pays', aide: 'Couleurs et noms des pays' },
  { id: 'capitales', nom: 'Capitales', aide: 'Un point et un nom par capitale' },
  { id: 'ue', nom: 'Union européenne', aide: 'Membre · en attente · non membre' },
  { id: 'euro', nom: 'Zone euro', aide: 'Euro ou pas euro' },
  { id: 'schengen', nom: 'Espace Schengen', aide: 'Circuler sans contrôle aux frontières' },
  { id: 'montagnes', nom: 'Montagnes', aide: 'Pyrénées, Alpes, Caucase, Oural' },
  { id: 'limites', nom: 'Limites de l’Europe', aide: 'Géographique et politique' },
]

export default function AtlasEuropeView() {
  const { donnees, erreur } = useAtlasEurope()
  const racine = useRef(null)
  const [volet, setVolet] = useState('pays')
  const [pleinEcran, setPleinEcran] = useState(false)
  const [selection, setSelection] = useState(null)
  // Un bouton « Belgique » par carte : chaque volet garde le sien
  const [belgiques, setBelgiques] = useState({})

  // Pays
  const [paysCouleurs, setPaysCouleurs] = useState(true)
  const [paysNoms, setPaysNoms] = useState(true)
  const [paysMers, setPaysMers] = useState(false)
  // Capitales
  const [capNoms, setCapNoms] = useState(true)
  const [capPays, setCapPays] = useState(false)
  // UE, euro, Schengen : noms des pays
  const [nomsUe, setNomsUe] = useState(true)
  const [nomsEuro, setNomsEuro] = useState(true)
  const [nomsSchengen, setNomsSchengen] = useState(true)
  // Montagnes
  const [montagnes, setMontagnes] = useState(['pyrenees', 'alpes', 'caucase'])
  const [sommets, setSommets] = useState(true)
  const [nomsMontagnes, setNomsMontagnes] = useState(true)
  // Limites
  const [vueLimites, setVueLimites] = useState('geo')
  const [traceLimite, setTraceLimite] = useState(true)
  const [nomsLimite, setNomsLimite] = useState(true)
  const [paysLimites, setPaysLimites] = useState(true)

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

  const vue = useMemo(() => construireVueEurope(), [])

  // Couleur de chaque pays, selon le volet
  const remplir = useMemo(() => {
    if (!donnees) return {}
    const opts = { limites: vueLimites }
    const v = volet === 'pays' && !paysCouleurs ? 'vierge' : volet
    return Object.fromEntries(donnees.pays.map((c) => [c.id, remplissage(v, c.id, opts)]))
  }, [donnees, volet, paysCouleurs, vueLimites])

  // Ce que la carte affiche, selon le volet
  const affichage = useMemo(() => {
    switch (volet) {
      case 'pays':
        return { noms: paysNoms, mers: paysMers }
      case 'capitales':
        return { noms: capPays, capitales: capNoms, capitalesAvant: true }
      case 'ue':
        return { noms: nomsUe }
      case 'euro':
        return { noms: nomsEuro }
      case 'schengen':
        return { noms: nomsSchengen }
      case 'montagnes':
        return { noms: nomsMontagnes, nomsHors: false, montagnes, sommets }
      case 'limites':
        return { noms: paysLimites, limiteTrace: traceLimite, limiteNoms: nomsLimite }
      default:
        return {}
    }
  }, [volet, paysNoms, paysMers, capPays, capNoms, nomsUe, nomsEuro, nomsSchengen, nomsMontagnes, montagnes, sommets, traceLimite, nomsLimite, paysLimites])

  const fiche = useMemo(() => (selection ? fichePays(volet, selection) : null), [selection, volet])

  if (erreur) {
    return <div className="min-h-dvh flex items-center justify-center bg-[#f4f6f8] text-slate-700">La carte n’a pas pu être chargée. Recharge la page.</div>
  }
  if (!donnees) return <Chargement message="Chargement de la carte de l’Europe…" />

  return (
    <div ref={racine} className="h-dvh flex bg-[#f4f6f8] text-slate-900 overflow-hidden">
      <aside className="shrink-0 w-72 flex flex-col bg-white border-r border-slate-200">
        <div className="shrink-0 flex items-center gap-2 px-3 py-3 border-b border-slate-200">
          <Link to="/maxence/atlas" aria-label="Retour à l’Atlas" className="w-10 h-10 shrink-0 rounded-xl border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-50 active:scale-95">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="flex-1 text-xl font-black tracking-tight">Europe</h1>
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

          {volet === 'vierge' && (
            <Explication titre="Carte vierge" texte="Les pays sans aucun nom. Toucher un pays pour voir son nom ; pincer ou tourner la molette pour zoomer. Le bouton « Belgique », sur la carte, colorie la Belgique." />
          )}

          {volet === 'pays' && (
            <>
              <Titre>Affichage</Titre>
              <Ligne carre actif={paysCouleurs} titre="Pays en couleur" onClick={() => setPaysCouleurs((x) => !x)} />
              <Ligne carre actif={paysNoms} titre="Noms des pays" aide="Les petits pays apparaissent en zoomant" onClick={() => setPaysNoms((x) => !x)} />
              <Ligne carre actif={paysMers} titre="Noms des mers et océans" onClick={() => setPaysMers((x) => !x)} />
            </>
          )}

          {volet === 'capitales' && (
            <>
              <Titre>Affichage</Titre>
              <Ligne carre actif={capNoms} titre="Noms des capitales" onClick={() => setCapNoms((x) => !x)} />
              <Ligne carre actif={capPays} titre="Noms des pays" onClick={() => setCapPays((x) => !x)} />
              <Explication texte="Chaque capitale est un point. Toucher un pays pour voir sa capitale. Les noms qui se gênent apparaissent en zoomant." />
            </>
          )}

          {volet === 'ue' && (
            <>
              <Titre>Statut</Titre>
              <Legende couleur={LEGENDE_UE[0].couleur} titre="Membres" aide={LEGENDE_UE[0].aide} nombre={MEMBRES_UE.length} />
              <Liste titre="Voir la liste" texte={LISTES.membre()} />
              <Legende couleur={LEGENDE_UE[1].couleur} titre="En attente" aide="Candidats (9) et Kosovo (demande déposée)" nombre={CANDIDATS_UE.length} />
              <Liste titre="Voir la liste" texte={LISTES.attente()} />
              <Legende couleur={LEGENDE_UE[2].couleur} titre="Non membres" aide="Dont le Royaume-Uni (parti en 2020)" />
              <Titre>Affichage</Titre>
              <Ligne carre actif={nomsUe} titre="Noms des pays" onClick={() => setNomsUe((x) => !x)} />
              <Explication texte="Toucher un pays pour son statut, son année d’adhésion ou l’état de sa candidature." />
              <p className="px-3 pt-2 text-[11px] text-slate-400">Situation au {DATE_STATUTS}.</p>
            </>
          )}

          {volet === 'euro' && (
            <>
              <Titre>Monnaie</Titre>
              <Legende couleur={LEGENDE_EURO[0].couleur} titre="Euro" aide="Zone euro : 21 pays dans l’UE" nombre={ZONE_EURO.length} />
              <Liste titre="Voir la liste" texte={LISTES.euro()} />
              <Legende couleur={LEGENDE_EURO[1].couleur} titre="Pas l’euro" aide="Membres de l’UE qui gardent leur monnaie" />
              <Legende couleur={LEGENDE_EURO[2].couleur} titre="Euro hors zone euro" aide="Utilisé par accord ou de leur propre chef" />
              <Liste titre="Voir la liste" texte={LISTES.usage()} />
              <Legende couleur={LEGENDE_EURO[3].couleur} titre="Pas l’euro" aide="Pays hors de l’UE" />
              <Titre>Affichage</Titre>
              <Ligne carre actif={nomsEuro} titre="Noms des pays" onClick={() => setNomsEuro((x) => !x)} />
              <Explication texte="Le bleu foncé est la zone euro, posée sur les pays de l’UE (bleu clair). La Bulgarie l’a rejointe le 1er janvier 2026." />
              <p className="px-3 pt-2 text-[11px] text-slate-400">Situation au {DATE_STATUTS}.</p>
            </>
          )}

          {volet === 'schengen' && (
            <>
              <Titre>Espace Schengen</Titre>
              <Legende couleur={LEGENDE_SCHENGEN[0].couleur} titre="Schengen, dans l’UE" nombre={ESPACE_SCHENGEN.filter((p) => p.ue === 'membre').length} />
              <Legende couleur={LEGENDE_SCHENGEN[1].couleur} titre="Schengen, hors UE" aide={LEGENDE_SCHENGEN[1].aide} nombre={ESPACE_SCHENGEN.filter((p) => p.ue !== 'membre').length} />
              <Liste titre="Voir les 29 pays" texte={LISTES.schengen()} />
              <Legende couleur={LEGENDE_SCHENGEN[2].couleur} titre="UE, en attente" aide={LEGENDE_SCHENGEN[2].aide} />
              <Legende couleur={LEGENDE_SCHENGEN[3].couleur} titre="UE, a choisi de rester dehors" aide={LEGENDE_SCHENGEN[3].aide} />
              <Legende couleur={LEGENDE_SCHENGEN[4].couleur} titre="Hors Schengen" />
              <Titre>Affichage</Titre>
              <Ligne carre actif={nomsSchengen} titre="Noms des pays" onClick={() => setNomsSchengen((x) => !x)} />
              <Explication texte="Dans l’espace Schengen, on passe d’un pays à l’autre sans contrôle aux frontières. Il compte 29 pays : 25 de l’UE et 4 qui n’en font pas partie. La Bulgarie et la Roumanie l’ont rejoint en entier le 1er janvier 2025." />
              <p className="px-3 pt-2 text-[11px] text-slate-400">Situation au {DATE_STATUTS}.</p>
            </>
          )}

          {volet === 'montagnes' && (
            <>
              <Titre>Chaînes</Titre>
              {MONTAGNES.map((m) => (
                <Ligne
                  key={m.id}
                  carre
                  actif={montagnes.includes(m.id)}
                  titre={m.nom}
                  aide={`${m.longueur} · ${m.point}`}
                  pastille="rgba(120,72,30,0.55)"
                  onClick={() => basculer(montagnes, setMontagnes, m.id)}
                />
              ))}
              <Titre>Sommets</Titre>
              <Ligne carre actif={sommets} titre="Mont Blanc et Elbrouz" aide={SOMMETS.map((s) => `${s.nom} ${formaterAlt(s.alt)}`).join(' · ')} onClick={() => setSommets((x) => !x)} />
              <Titre>Affichage</Titre>
              <Ligne carre actif={nomsMontagnes} titre="Noms des pays" onClick={() => setNomsMontagnes((x) => !x)} />
              <Explication titre="À retenir" texte="Les Pyrénées séparent la France de l’Espagne. Les Alpes ont le Mont Blanc (4 807 m, mesure de 2026). L’Elbrouz (5 642 m), dans le Caucase, est le plus haut sommet d’Europe si l’on place la limite sur la crête du Caucase. L’Oural marque la limite avec l’Asie." />
            </>
          )}

          {volet === 'limites' && (
            <>
              <Titre>Vue</Titre>
              <Ligne actif={vueLimites === 'geo'} titre="Géographique" aide="Le continent : ce qui est de ce côté de la limite" onClick={() => setVueLimites('geo')} />
              <Ligne actif={vueLimites === 'pol'} titre="Politique" aide="Pays entiers, selon leur rattachement" onClick={() => setVueLimites('pol')} />
              <Titre>Légende</Titre>
              {vueLimites === 'geo' ? (
                <>
                  <Legende couleur={CATEGORIES_LIMITES.europe.couleur} titre="Europe" aide="Y compris la partie européenne de la Russie, du Kazakhstan, de la Turquie…" />
                  <Legende couleur={CATEGORIES_LIMITES.hors.couleur} titre="Hors Europe" />
                </>
              ) : (
                Object.entries(CATEGORIES_LIMITES).map(([cle, c]) => <Legende key={cle} couleur={c.couleur} titre={c.nom} aide={c.aide} />)
              )}
              <Titre>Affichage</Titre>
              <Ligne carre actif={traceLimite} titre="Limite géographique" pastille="#dc2626" onClick={() => setTraceLimite((x) => !x)} />
              <Ligne carre actif={nomsLimite} titre="Noms de la limite" onClick={() => setNomsLimite((x) => !x)} />
              <Ligne carre actif={paysLimites} titre="Noms des pays" onClick={() => setPaysLimites((x) => !x)} />
              <Explication
                titre="La limite de l’Europe"
                texte="Ce n’est pas une mer : l’Europe et l’Asie forment un seul bloc. La limite habituelle suit les monts Oural, le fleuve Oural, la mer Caspienne, la crête du Caucase, la mer Noire, le Bosphore et les Dardanelles. Politiquement, la Russie, la Turquie, la Géorgie, l’Azerbaïdjan et le Kazakhstan sont à cheval ; Chypre et l’Arménie sont en Asie mais liées à l’Europe."
              />
            </>
          )}
        </div>

        <p className="shrink-0 border-t border-slate-200 px-3 py-2 text-[10px] leading-snug text-slate-400">Contours : Natural Earth (domaine public) · Projection : Lambert azimutale équivalente (d3-geo)</p>
      </aside>

      <main className="flex-1 min-w-0 p-2">
        <CarteEurope
          key="europe"
          vue={vue}
          pays={donnees.pays}
          limite={donnees.limite}
          remplir={remplir}
          noms={!!affichage.noms}
          nomsHors={affichage.nomsHors !== false}
          capitales={!!affichage.capitales}
          capitalesAvant={!!affichage.capitalesAvant}
          mers={!!affichage.mers}
          montagnes={affichage.montagnes || []}
          sommets={!!affichage.sommets}
          limiteTrace={!!affichage.limiteTrace}
          limiteNoms={!!affichage.limiteNoms}
          belgique={!!belgiques[volet]}
          onBelgique={() => setBelgiques((b) => ({ ...b, [volet]: !b[volet] }))}
          selection={selection}
          onSelection={setSelection}
          fiche={fiche}
        />
      </main>
    </div>
  )
}
