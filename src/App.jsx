import { Routes, Route } from 'react-router-dom'
import { usePin } from './context/PinContext.jsx'
import PinLock from './components/PinLock.jsx'
import AppShell from './components/layout/AppShell.jsx'
import AccueilView from './views/AccueilView.jsx'
import CoursParticuliersView from './views/CoursParticuliersView.jsx'
import VeloView from './views/VeloView.jsx'
import EtudesView from './views/EtudesView.jsx'

export default function App() {
  const { unlocked, authReady, error } = usePin()

  if (!unlocked) {
    return <PinLock />
  }

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          {error ? (
            <>
              <p className="text-red-500 text-sm font-semibold mb-2">Problème de connexion</p>
              <p className="text-slate-500 text-sm">{error}</p>
            </>
          ) : (
            <p className="text-slate-400 text-sm">Connexion à la base de données…</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<AccueilView />} />
        <Route path="/cours" element={<CoursParticuliersView />} />
        <Route path="/velo" element={<VeloView />} />
        <Route path="/etudes" element={<EtudesView />} />
      </Route>
    </Routes>
  )
}import { Routes, Route } from 'react-router-dom'
import { usePin } from './context/PinContext.jsx'
import PinLock from './components/PinLock.jsx'
import AppShell from './components/layout/AppShell.jsx'
import AccueilView from './views/AccueilView.jsx'
import CoursParticuliersView from './views/CoursParticuliersView.jsx'
import VeloView from './views/VeloView.jsx'
import EtudesView from './views/EtudesView.jsx'

export default function App() {
  const { unlocked, authReady } = usePin()

  if (!unlocked) {
    return <PinLock />
  }

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">
        Connexion à la base de données…
      </div>
    )
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<AccueilView />} />
        <Route path="/cours" element={<CoursParticuliersView />} />
        <Route path="/velo" element={<VeloView />} />
        <Route path="/etudes" element={<EtudesView />} />
      </Route>
    </Routes>
  )
}
