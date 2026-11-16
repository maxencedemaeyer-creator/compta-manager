import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { usePin } from './context/PinContext.jsx'
import PinLock from './components/PinLock.jsx'
import Chargement from './components/Chargement.jsx'
import MiseAJour from './components/MiseAJour.jsx'
import CouleurBarre from './components/CouleurBarre.jsx'
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
import LabView from './views/LabView.jsx'
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

// Anciennes adresses (avant les profils) : /compta/velo → /maxence/compta/velo, etc.
function VersMaxence() {
  const { pathname, search, hash } = useLocation()
  return <Navigate to={`/maxence${pathname}${search}${hash}`} replace />
}

// Anciennes adresses de la compta (favoris, raccourcis sur l'écran d'accueil du téléphone)
const ANCIENNES_PAGES_COMPTA = ['cours', 'velo', 'etudes', 'medecin', 'perso']

export default function App() {
  return (
    <>
      {/* Recharge le site tout seul quand une nouvelle version est déployée */}
      <MiseAJour />
      {/* Barre d'état de l'iPhone assortie à la page */}
      <CouleurBarre />
      <Routes>
        {/* Écran d'entrée : choix du profil */}
        <Route path="/" element={<ChoixProfilView />} />

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

        {/* Application Programme Français P5-P6 */}
        <Route path="/maxence/francais" element={<Protege><LabView /></Protege>} />

        {/* Application Projection (photo du téléphone → écran de la classe) */}
        <Route path="/maxence/projection" element={<Protege><ProjectionView /></Protege>} />
        <Route path="/maxence/projection/photo" element={<Protege><ProjectionPhotoView /></Protege>} />
        <Route path="/maxence/projection/ecran" element={<Protege><ProjectionEcranView /></Protege>} />
        <Route path="/maxence/projection/galerie" element={<Protege><ProjectionGalerieView /></Protege>} />

        {/* Application Jeux (Game Center) */}
        <Route path="/maxence/jeux" element={<Protege><JeuxView /></Protege>} />
        <Route path="/maxence/jeux/communos" element={<Protege><CommunosView /></Protege>} />
        <Route path="/maxence/jeux/communos/libre" element={<Protege><CommunosLibreView /></Protege>} />
        <Route path="/maxence/jeux/communos/provinces" element={<Protege><CommunosProvincesView /></Protege>} />
        <Route path="/maxence/jeux/communos/provinces/:province" element={<Protege><CommunosLibreView /></Protege>} />

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
