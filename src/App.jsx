import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { usePin } from './context/PinContext.jsx'
import PinLock from './components/PinLock.jsx'
import Chargement from './components/Chargement.jsx'
import MiseAJour from './components/MiseAJour.jsx'
import CouleurBarre from './components/CouleurBarre.jsx'
import IconeProfil from './components/IconeProfil.jsx'
import AppShell from './components/layout/AppShell.jsx'
import ChoixProfilView from './views/ChoixProfilView.jsx'
import HomeView from './views/HomeView.jsx'
import SettingsView from './views/SettingsView.jsx'
import AccueilView from './views/AccueilView.jsx'
import CoursParticuliersView from './views/CoursParticuliersView.jsx'
import VeloView from './views/VeloView.jsx'
import EtudesView from './views/EtudesView.jsx'
import MedecinView from './views/MedecinView.jsx'
import RemboursementsView from './views/RemboursementsView.jsx'
import GenealogieListeView from './views/genealogie/GenealogieListeView.jsx'
import GenealogieArbreView from './views/genealogie/GenealogieArbreView.jsx'
import ProjectionView from './views/projection/ProjectionView.jsx'
import ProjectionPhotoView from './views/projection/ProjectionPhotoView.jsx'
import ProjectionEcranView from './views/projection/ProjectionEcranView.jsx'
import ProjectionGalerieView from './views/projection/ProjectionGalerieView.jsx'
import RequetesView from './views/RequetesView.jsx'
import JeuxView from './views/JeuxView.jsx'
import CommunosView from './views/jeux/CommunosView.jsx'
import CommunosProvincesView from './views/jeux/CommunosProvincesView.jsx'
import CommunosLibreView from './views/jeux/CommunosLibreView.jsx'
import MotusView from './views/jeux/MotusView.jsx'
import JardinListeView from './views/jardin/JardinListeView.jsx'
import JardinView from './views/jardin/JardinView.jsx'
import CoachView from './views/coach/CoachView.jsx'
import CoutureGalerieView from './views/couture/CoutureGalerieView.jsx'
import CoutureArticleView from './views/couture/CoutureArticleView.jsx'
import CoutureAtelierView from './views/couture/CoutureAtelierView.jsx'
import CodeAcces from './components/couture/CodeAcces.jsx'
import { estSiteGalerie } from './hooks/useCouture.js'
import { ANCIENNES_ADRESSES, EXPERIENCE as EXPERIENCES_LABO } from './config/laboAteliers.js'
import { estVisible, useLaboConfig } from './components/labo/prof/useLaboConfig.js'

// Le labo de sciences (public, sans PIN) : chargé seulement quand on l'ouvre
// Cave : chargée seulement quand on l'ouvre (grosse base d'appellations et de plats)
const CaveView = lazy(() => import('./views/cave/CaveView.jsx'))
const LaboView = lazy(() => import('./views/labo/LaboView.jsx'))
const SalleView = lazy(() => import('./views/labo/SalleView.jsx'))
// Lis-moi (aide à la lecture, public, pour les tablettes de la classe)
// Savoir écrire (ancienne appli Français) : chargé seulement quand on l'ouvre
const SavoirEcrireView = lazy(() => import('./views/SavoirEcrireView.jsx'))
const LectureView = lazy(() => import('./views/lecture/LectureView.jsx'))
const LectureDetailView = lazy(() => import('./views/lecture/LectureDetailView.jsx'))
const EntrainementSonsView = lazy(() => import('./views/lecture/EntrainementSonsView.jsx'))
const fondLecture = <div style={{ minHeight: '100dvh', background: '#fbf7f0' }} />
// Les jeux de chaque expérience : clé « expérience/paillasse »
const LABO_JEUX = {
  'locomoteur/miroir': lazy(() => import('./views/labo/MiroirView.jsx')),
  'locomoteur/puzzle': lazy(() => import('./views/labo/PuzzleView.jsx')),
  'locomoteur/bras': lazy(() => import('./views/labo/BrasView.jsx')),
  'locomoteur/qui-tire': lazy(() => import('./views/labo/QuiTireView.jsx')),
  'locomoteur/pantin': lazy(() => import('./views/labo/PantinView.jsx')),
  'locomoteur/protection': lazy(() => import('./views/labo/ProtectionView.jsx')),
  'locomoteur/reflexes': lazy(() => import('./views/labo/ReflexesView.jsx')),
  'locomoteur/dissection': lazy(() => import('./views/labo/DissectionView.jsx')),
  'locomoteur/explorateur': lazy(() => import('./views/labo/ExplorateurView.jsx')),
  'locomoteur/cousins': lazy(() => import('./views/labo/CousinsView.jsx')),
  'locomoteur/urgences': lazy(() => import('./views/labo/UrgencesView.jsx')),
  'locomoteur/defi': lazy(() => import('./views/labo/DefiView.jsx')),
  'locomoteur/jacques': lazy(() => import('./views/labo/JacquesView.jsx')),
  'locomoteur/etiqueteuse': lazy(() => import('./views/labo/EtiqueteuseView.jsx')),
  'electricite/banc': lazy(() => import('./views/labo/electricite/BancView.jsx')),
  'electricite/testeur': lazy(() => import('./views/labo/electricite/TesteurView.jsx')),
  'electricite/interrupteur': lazy(() => import('./views/labo/electricite/InterrupteurView.jsx')),
  'electricite/schemas': lazy(() => import('./views/labo/electricite/SchemasView.jsx')),
  'electricite/depanneur': lazy(() => import('./views/labo/electricite/DepanneurView.jsx')),
  'electricite/maison': lazy(() => import('./views/labo/electricite/MaisonView.jsx')),
  'electricite/danger': lazy(() => import('./views/labo/electricite/DangerView.jsx')),
  'electricite/defi': lazy(() => import('./views/labo/electricite/DefiElecView.jsx')),
  'electricite/ampoule': lazy(() => import('./views/labo/electricite/AmpouleView.jsx')),
  'circulation/explorateur': lazy(() => import('./views/labo/circulation/ExplorateurCircView.jsx')),
  'circulation/coeur': lazy(() => import('./views/labo/circulation/CoeurView.jsx')),
  'circulation/voyage': lazy(() => import('./views/labo/circulation/VoyageView.jsx')),
  'circulation/artere-veine': lazy(() => import('./views/labo/circulation/ArtereVeineView.jsx')),
  'circulation/pouls': lazy(() => import('./views/labo/circulation/PoulsView.jsx')),
  'circulation/livreur': lazy(() => import('./views/labo/circulation/LivreurView.jsx')),
  'circulation/pompe': lazy(() => import('./views/labo/circulation/PompeView.jsx')),
  'circulation/animaux': lazy(() => import('./views/labo/circulation/AnimauxView.jsx')),
  'circulation/defi': lazy(() => import('./views/labo/circulation/DefiCircView.jsx')),
  'espace/systeme': lazy(() => import('./views/labo/espace/SystemeView.jsx')),
  'espace/rotation': lazy(() => import('./views/labo/espace/RotationView.jsx')),
  'espace/revolution': lazy(() => import('./views/labo/espace/RevolutionView.jsx')),
  'espace/phases': lazy(() => import('./views/labo/espace/PhasesView.jsx')),
  'espace/eclipses': lazy(() => import('./views/labo/espace/EclipsesView.jsx')),
  'espace/saisons': lazy(() => import('./views/labo/espace/SaisonsView.jsx')),
  'espace/planetes': lazy(() => import('./views/labo/espace/PlanetesView.jsx')),
  'espace/echelle': lazy(() => import('./views/labo/espace/EchelleView.jsx')),
  'espace/cometes': lazy(() => import('./views/labo/espace/CometesView.jsx')),
  'espace/galaxie': lazy(() => import('./views/labo/espace/GalaxieView.jsx')),
  'espace/modeles': lazy(() => import('./views/labo/espace/ModelesView.jsx')),
  'espace/mots': lazy(() => import('./views/labo/espace/MotsView.jsx')),
  'regles/dedans': lazy(() => import('./views/labo/regles/DedansView.jsx')),
  'regles/cycle': lazy(() => import('./views/labo/regles/CycleView.jsx')),
  'regles/ovule': lazy(() => import('./views/labo/regles/OvuleView.jsx')),
  'regles/protections': lazy(() => import('./views/labo/regles/ProtectionsView.jsx')),
  'regles/premieres': lazy(() => import('./views/labo/regles/PremieresView.jsx')),
  'regles/vrai-faux': lazy(() => import('./views/labo/regles/VraiFauxView.jsx')),
  'regles/defi': lazy(() => import('./views/labo/regles/DefiReglesView.jsx')),
  'regles/calendrier': lazy(() => import('./views/labo/regles/CalendrierView.jsx')),
  'regles/absorbe': lazy(() => import('./views/labo/regles/AbsorbeView.jsx')),
  'regles/humeurs': lazy(() => import('./views/labo/regles/HumeursView.jsx')),
  'regles/douleurs': lazy(() => import('./views/labo/regles/DouleursView.jsx')),
  'regles/toute-la-vie': lazy(() => import('./views/labo/regles/TouteLaVieView.jsx')),
  'regles/ensemble': lazy(() => import('./views/labo/regles/EnsembleView.jsx')),
  'espace/defi': lazy(() => import('./views/labo/espace/DefiEspaceView.jsx')),
}

// Une expérience masquée par le prof (Espace prof du labo) n'est plus accessible,
// même en tapant son adresse : retour au hall.
function Labo({ children }) {
  const { pathname } = useLocation()
  const config = useLaboConfig()
  const { pret } = config
  const experience = pathname.split('/')[2]
  const fond = <div style={{ minHeight: '100dvh', background: EXPERIENCES_LABO[experience]?.clair ? '#FFF8EC' : '#070b16' }} />
  if (experience && EXPERIENCES_LABO[experience]) {
    if (!pret) return fond
    if (!estVisible(config, EXPERIENCES_LABO[experience])) return <Navigate to="/labo" replace />
  }
  return <Suspense fallback={fond}>{children}</Suspense>
}

// Chaque espace (/maxence, /julie…) est protégé par le code PIN de son profil
// (une seule saisie par session), puis attend la connexion anonyme à Firebase.
function Protege({ children }) {
  const { profilId, unlocked, authReady } = usePin()

  if (!profilId) return <Navigate to="/" replace />
  if (!unlocked) return <PinLock />
  if (!authReady) {
    return <Chargement message="Connexion à la base de données…" />
  }
  return children
}

// Pages ouvertes sans code PIN (ex. écran et galerie de projection sur
// l'ordinateur de la classe) : on attend seulement la connexion à Firebase.
function SansPin({ children }) {
  const { authReady, error } = usePin()
  if (!authReady) return <Chargement message={error || 'Connexion à la base de données…'} />
  return children
}

// Anciennes adresses (avant les profils) : /compta/velo → /maxence/compta/velo, etc.
function VersMaxence() {
  const { pathname, search, hash } = useLocation()
  return <Navigate to={`/maxence${pathname}${search}${hash}`} replace />
}

// Anciennes adresses de la compta (favoris, raccourcis sur l'écran d'accueil du téléphone)
const ANCIENNES_PAGES_COMPTA = ['cours', 'velo', 'etudes', 'medecin', 'perso']

export default function App() {
  // Adresse neutre de la galerie couture (couture-julie.vercel.app) :
  // seule la galerie existe, le reste du site est invisible.
  if (estSiteGalerie()) {
    return (
      <>
        <MiseAJour />
        <CouleurBarre />
        <Routes>
          <Route path="/" element={<CodeAcces><CoutureGalerieView /></CodeAcces>} />
          <Route path="/couture" element={<Navigate to="/" replace />} />
          <Route path="/couture/:articleId" element={<CodeAcces><CoutureArticleView /></CodeAcces>} />
          <Route path="/:articleId" element={<CodeAcces><CoutureArticleView /></CodeAcces>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </>
    )
  }

  return (
    <>
      {/* Recharge le site tout seul quand une nouvelle version est déployée */}
      <MiseAJour />
      {/* Barre d'état de l'iPhone assortie à la page */}
      <CouleurBarre />
      {/* Icône et nom du site selon l'espace (accueil, Maxence, Julie…) */}
      <IconeProfil />
      <Routes>
        {/* Écran d'entrée : choix du profil */}
        <Route path="/" element={<ChoixProfilView />} />

        {/* ================= Le labo de sciences (public, pour les élèves) ================= */}
        <Route path="/labo" element={<Labo><LaboView /></Labo>} />
        {Object.entries(LABO_JEUX).map(([cle, Jeu]) => (
          <Route key={cle} path={`/labo/${cle}`} element={<Labo><Jeu /></Labo>} />
        ))}
        {/* anciennes adresses (QR codes déjà imprimés) → système locomoteur */}
        {ANCIENNES_ADRESSES.map((id) => (
          <Route key={id} path={`/labo/${id}`} element={<Navigate to={`/labo/locomoteur/${id}`} replace />} />
        ))}
        <Route path="/labo/:experience" element={<Labo><SalleView /></Labo>} />
        <Route path="/labo/*" element={<Navigate to="/labo" replace />} />

        {/* ================= Lis-moi (public, pour les élèves) ================= */}
        <Route path="/lecture" element={<SansPin><Suspense fallback={fondLecture}><LectureView /></Suspense></SansPin>} />
        <Route path="/lecture/:lectureId" element={<SansPin><Suspense fallback={fondLecture}><LectureDetailView /></Suspense></SansPin>} />

        {/* Lis-moi : entraînement des sons en couleur (Max seulement, avec son code PIN) */}
        <Route path="/maxence/lecture/entrainement" element={<Protege><Suspense fallback={fondLecture}><EntrainementSonsView /></Suspense></Protege>} />

        {/* ================= Espace Maxence ================= */}
        {/* Application Compta */}
        <Route path="/maxence/compta" element={<Protege><AppShell /></Protege>}>
          <Route index element={<AccueilView />} />
          <Route path="cours" element={<CoursParticuliersView />} />
          <Route path="velo" element={<VeloView />} />
          <Route path="etudes" element={<EtudesView />} />
          <Route path="medecin" element={<MedecinView />} />
          <Route path="perso" element={<RemboursementsView />} />
        </Route>

        {/* Application Généalogie */}
        <Route path="/maxence/genealogie" element={<Protege><GenealogieListeView /></Protege>} />
        <Route path="/maxence/genealogie/:arbreId" element={<Protege><GenealogieArbreView /></Protege>} />

        {/* Application Mon jardin (jardins, plantes, calendrier des tailles) */}
        <Route path="/maxence/jardin" element={<Protege><JardinListeView /></Protege>} />
        <Route path="/maxence/jardin/:jardinId" element={<Protege><JardinView /></Protege>} />
        <Route path="/maxence/jardin/:jardinId/:onglet" element={<Protege><JardinView /></Protege>} />

        {/* Coach : sport, plans et nutrition sourcés */}
        <Route path="/maxence/coach" element={<Protege><CoachView /></Protege>} />
        <Route path="/maxence/coach/:onglet" element={<Protege><CoachView /></Protege>} />

        {/* Cave : gestionnaire de cave et accords mets-vins */}
        <Route path="/maxence/cave" element={<Protege><Suspense fallback={<Chargement />}><CaveView /></Suspense></Protege>} />
        <Route path="/maxence/cave/:onglet" element={<Protege><Suspense fallback={<Chargement />}><CaveView /></Suspense></Protege>} />

        {/* Savoir écrire : générateur d'idées d'écriture (programme Français P5-P6) */}
        <Route path="/maxence/francais" element={<Protege><Suspense fallback={<Chargement />}><SavoirEcrireView /></Suspense></Protege>} />

        {/* Application Projection (photo du téléphone → écran de la classe) */}
        <Route path="/maxence/projection" element={<SansPin><ProjectionView /></SansPin>} />
        <Route path="/maxence/projection/photo" element={<Protege><ProjectionPhotoView /></Protege>} />
        <Route path="/maxence/projection/ecran" element={<SansPin><ProjectionEcranView /></SansPin>} />
        <Route path="/maxence/projection/galerie" element={<SansPin><ProjectionGalerieView /></SansPin>} />

        {/* Application Jeux (Game Center) */}
        <Route path="/maxence/jeux" element={<Protege><JeuxView /></Protege>} />
        <Route path="/maxence/jeux/communos" element={<Protege><CommunosView /></Protege>} />
        <Route path="/maxence/jeux/communos/libre" element={<Protege><CommunosLibreView /></Protege>} />
        <Route path="/maxence/jeux/communos/provinces" element={<Protege><CommunosProvincesView /></Protege>} />
        <Route path="/maxence/jeux/communos/provinces/:province" element={<Protege><CommunosLibreView /></Protege>} />
        <Route path="/maxence/jeux/motus" element={<Protege><MotusView /></Protege>} />

        {/* ================= Espace Julie ================= */}
        {/* Application Couture : l'atelier (créations + centrale des commandes) */}
        <Route path="/julie/couture" element={<Protege><CoutureAtelierView /></Protege>} />
        <Route path="/julie/couture/:onglet" element={<Protege><CoutureAtelierView /></Protege>} />

        {/* Galerie couture publique, à partager (pas de PIN, juste le code « julie ») */}
        <Route path="/couture" element={<CodeAcces><CoutureGalerieView /></CodeAcces>} />
        <Route path="/couture/:articleId" element={<CodeAcces><CoutureArticleView /></CodeAcces>} />

        {/* ================= Tous les profils ================= */}
        {/* Accueil et paramètres de chaque profil (/maxence, /julie, /julie/settings…) */}
        <Route path="/:profil" element={<Protege><HomeView /></Protege>} />
        <Route path="/:profil/settings" element={<Protege><SettingsView /></Protege>} />
        {/* Requêtes : Maxence voit toutes les demandes, les autres profils les leurs */}
        <Route path="/:profil/requetes" element={<Protege><RequetesView /></Protege>} />
        <Route path="/:profil/setting" element={<Navigate to="../settings" relative="path" replace />} />
        <Route path="/:profil/parametres" element={<Navigate to="../settings" relative="path" replace />} />

        {/* ================= Anciennes adresses ================= */}
        <Route path="/compta/*" element={<VersMaxence />} />
        <Route path="/genealogie/*" element={<VersMaxence />} />
        <Route path="/francais" element={<VersMaxence />} />
        <Route path="/projection/*" element={<VersMaxence />} />
        <Route path="/jeux" element={<VersMaxence />} />
        {/* adresses courtes faciles à retenir : maxxence.vercel.app/coach, /jardin */}
        <Route path="/coach/*" element={<VersMaxence />} />
        <Route path="/jardin/*" element={<VersMaxence />} />
        <Route path="/cave/*" element={<VersMaxence />} />
        <Route path="/settings" element={<VersMaxence />} />
        <Route path="/setting" element={<Navigate to="/maxence/settings" replace />} />
        <Route path="/parametres" element={<Navigate to="/maxence/settings" replace />} />
        {ANCIENNES_PAGES_COMPTA.map((page) => (
          <Route key={page} path={`/${page}`} element={<Navigate to={`/maxence/compta/${page}`} replace />} />
        ))}
        <Route path="/test/*" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
