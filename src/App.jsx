import { Routes, Route, Navigate } from 'react-router-dom'
import { usePin } from './context/PinContext.jsx'
import PinLock from './components/PinLock.jsx'
import Chargement from './components/Chargement.jsx'
import MiseAJour from './components/MiseAJour.jsx'
import AppShell from './components/layout/AppShell.jsx'
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

// Tout le site est protégé par le code PIN (une seule saisie par session),
// puis attend la connexion anonyme à Firebase.
function Protege({ children }) {
  const { unlocked, authReady } = usePin()

  if (!unlocked) return <PinLock />
  if (!authReady) {
    return <Chargement message="Connexion à la base de données…" />
  }
  return children
}

// Anciennes adresses de la compta (favoris, raccourcis sur l'écran d'accueil du téléphone)
const ANCIENNES_PAGES_COMPTA = ['cours', 'velo', 'etudes', 'medecin', 'perso']

export default function App() {
  return (
    <>
      {/* Recharge le site tout seul quand une nouvelle version est déployée */}
      <MiseAJour />
      <Routes>
        {/* Page d'accueil : le lanceur d'applications "Maxence" */}
        <Route path="/" element={<Protege><HomeView /></Protege>} />

        {/* Application Compta */}
        <Route path="/compta" element={<Protege><AppShell /></Protege>}>
          <Route index element={<AccueilView />} />
          <Route path="cours" element={<CoursParticuliersView />} />
          <Route path="velo" element={<VeloView />} />
          <Route path="etudes" element={<EtudesView />} />
          <Route path="medecin" element={<MedecinView />} />
          <Route path="perso" element={<RemboursementsView />} />
        </Route>

        {/* Application Généalogie */}
        <Route path="/genealogie" element={<Protege><GenealogieListeView /></Protege>} />
        <Route path="/genealogie/:arbreId" element={<Protege><GenealogieArbreView /></Protege>} />

        {/* Application Programme Français P5-P6 */}
        <Route path="/francais" element={<Protege><LabView /></Protege>} />

        {/* Application Projection (photo du téléphone → écran de la classe) */}
        <Route path="/projection" element={<Protege><ProjectionView /></Protege>} />
        <Route path="/projection/photo" element={<Protege><ProjectionPhotoView /></Protege>} />
        <Route path="/projection/ecran" element={<Protege><ProjectionEcranView /></Protege>} />
        <Route path="/projection/galerie" element={<Protege><ProjectionGalerieView /></Protege>} />

        {/* Paramètres du site */}
        <Route path="/settings" element={<Protege><SettingsView /></Protege>} />
        <Route path="/setting" element={<Navigate to="/settings" replace />} />
        <Route path="/parametres" element={<Navigate to="/settings" replace />} />

        {/* Redirections des anciennes adresses */}
        {ANCIENNES_PAGES_COMPTA.map((page) => (
          <Route key={page} path={`/${page}`} element={<Navigate to={`/compta/${page}`} replace />} />
        ))}
        <Route path="/test/*" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
