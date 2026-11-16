import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { HelpCircle, Flag, Trophy, RotateCcw, LayoutGrid } from 'lucide-react'
import Chargement from '../../components/Chargement.jsx'
import PartieCommunos from '../../components/jeux/communos/PartieCommunos.jsx'
import { AnneauConnaissance } from '../../components/jeux/communos/Connaissance.jsx'
import { BoutonIcone, EnTete, FondPage, OngletsModes, Regles, useCarte } from '../../components/jeux/communos/Communs.jsx'
import { useCommunos, useCommunosLibres } from '../../hooks/useCommunos.js'
import { connaissanceProvince, listeProvinces, nomComplet, tirerCible } from '../../utils/communos.js'

// =============================================================
//  COMMUNOS · parties libres (entraînement)
//  - /maxence/jeux/communos/libre               → toute la Belgique
//  - /maxence/jeux/communos/provinces/:province → une seule province
//  Autant de parties qu'on veut ; chaque partie est un document
//  de la collection Firebase « communosLibres ».
//  Une partie commencée et pas finie reprend là où on l'a laissée.
// =============================================================
export default function CommunosLibreView() {
  const { province: slug } = useParams()
  const { carte, erreur } = useCarte()
  const { parties: partiesJour, loading: chargeJour } = useCommunos()
  const { libres, loading, nouvelId, enregistrerLibre } = useCommunosLibres()
  const [partie, setPartie] = useState(null) // { id, cible }
  const [regles, setRegles] = useState(false)

  // Zone de jeu : une province, ou toute la Belgique
  const provinces = useMemo(() => (carte ? listeProvinces(carte) : []), [carte])
  const province = slug ? provinces.find((p) => p.slug === slug) : null
  const zoneTirage = useMemo(() => {
    if (!carte) return null
    if (province) return province
    return { nom: 'Belgique', court: 'Belgique', communes: carte.communes }
  }, [carte, province])

  const partiesZone = useMemo(
    () => (zoneTirage ? libres.filter((p) => p.province === zoneTirage.nom) : []),
    [libres, zoneTirage]
  )

  function nouvellePartie() {
    setPartie({ id: nouvelId(), cible: tirerCible(zoneTirage, partiesZone).id })
  }

  // Nouvelle zone → on reprend la partie en cours, sinon on en commence une
  useEffect(() => setPartie(null), [slug])
  useEffect(() => {
    if (partie || loading || !zoneTirage) return
    const enCours = partiesZone
      .filter((p) => !p.trouve && !p.abandon && p.cible)
      .sort((a, b) => (b.debut || 0) - (a.debut || 0))[0]
    if (enCours) setPartie({ id: enCours.id, cible: enCours.cible })
    else nouvellePartie()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partie, loading, zoneTirage, partiesZone])

  const connaissance = useMemo(
    () => (province ? connaissanceProvince(province, partiesJour, libres) : null),
    [province, partiesJour, libres]
  )

  if (erreur) {
    return <FondPage><p className="text-center py-20">Impossible de charger la carte. Vérifie ta connexion et recharge la page.</p></FondPage>
  }
  if (!carte || loading || chargeJour) return <Chargement message="Chargement de la carte de Belgique…" />
  if (slug && !province) return <Navigate to="/maxence/jeux/communos/provinces" replace />
  if (!partie) return <Chargement message="Choix de la commune mystère…" />

  const doc = libres.find((p) => p.id === partie.id)
  const cible = carte.parId.get(partie.cible)
  const debut = doc?.debut || Date.now()
  const champsCommuns = { province: zoneTirage.nom, cible: cible.id, debut }

  return (
    <FondPage>
      <EnTete
        retour={province ? '/maxence/jeux/communos/provinces' : '/maxence/jeux/communos'}
        sousTitre={province ? 'ENTRAÎNEMENT · PROVINCE' : 'PARTIE LIBRE · BELGIQUE'}
      >
        <BoutonIcone label="Règles" onClick={() => setRegles(true)}><HelpCircle size={18} /></BoutonIcone>
      </EnTete>
      <OngletsModes actif={province ? 'provinces' : 'belgique'} />

      <PartieCommunos
        carte={carte}
        cle={partie.id}
        cible={cible}
        zone={province}
        idsEssaisFirebase={doc?.essais || []}
        abandonFirebase={!!doc?.abandon}
        onEnregistrer={(essais, trouve) => enregistrerLibre(partie.id, { ...champsCommuns, essais, trouve, abandon: false })}
        onAbandonner={(essais) => enregistrerLibre(partie.id, { ...champsCommuns, essais, trouve: false, abandon: true })}
        infoZone={
          province ? (
            <Link
              to="/maxence/jeux/communos/provinces"
              title="Changer de province"
              className="max-w-full min-w-0 flex items-center gap-2 rounded-xl pl-1.5 pr-2 py-1 bg-white/[0.06] border border-white/10 hover:bg-white/10"
            >
              <AnneauConnaissance score={connaissance.score} taille={32} epaisseur={3.5} />
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block font-bold text-[13px] truncate">{province.court}</span>
                <span className="block text-[10px] text-white/50 truncate">{connaissance.niveau.emoji} {connaissance.niveau.nom} · {connaissance.connues}/{connaissance.total}</span>
              </span>
              <LayoutGrid size={14} className="shrink-0 text-white/40" />
            </Link>
          ) : (
            <Link
              to="/maxence/jeux/communos/provinces"
              title="Choisir une province"
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] bg-white/[0.06] border border-white/10 hover:bg-white/10"
            >
              🇧🇪 <span className="font-bold">Belgique</span>
              <LayoutGrid size={14} className="text-white/40" />
            </Link>
          )
        }
        finPartie={({ statut, nbEssais }) => (
          <div className={`cm-apparait mb-4 rounded-3xl p-[2px] bg-gradient-to-r ${statut === 'trouve' ? 'from-emerald-400 via-cyan-400 to-fuchsia-500' : 'from-violet-500 to-fuchsia-500'}`}>
            <div className="rounded-[22px] bg-[#0d0a24] p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${statut === 'trouve' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-violet-500/20 text-violet-300'}`}>
                  {statut === 'trouve' ? <Trophy size={24} /> : <Flag size={22} />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-widest text-white/50">
                    {statut === 'trouve' ? `Trouvée en ${nbEssais} essai${nbEssais > 1 ? 's' : ''}` : 'Commune révélée'}
                  </p>
                  <p className="text-xl font-black truncate">{nomComplet(cible)}</p>
                  <p className="text-sm text-white/55 truncate">{cible.prov}</p>
                </div>
              </div>
              {connaissance && (
                <p className="mt-3 rounded-2xl bg-white/[0.05] px-4 py-2.5 text-sm text-white/70">
                  Connaissance de la province : <b className="text-cyan-300">{connaissance.score} %</b> · {connaissance.niveau.emoji} {connaissance.niveau.nom}
                </p>
              )}
              <button
                type="button"
                onClick={nouvellePartie}
                className="mt-3 w-full rounded-2xl py-3 font-bold bg-gradient-to-r from-fuchsia-500 to-indigo-500 shadow-lg shadow-fuchsia-500/30 active:scale-[0.98] transition inline-flex items-center justify-center gap-2"
              >
                <RotateCcw size={18} />
                Rejouer
              </button>
            </div>
          </div>
        )}
      />

      {regles && <Regles carte={carte} onFermer={() => setRegles(false)} />}
    </FondPage>
  )
}
