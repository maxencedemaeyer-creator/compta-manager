import { Outlet } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { BottomNav, Sidebar } from './NavBar.jsx'
import { usePin } from '../../context/PinContext.jsx'

export default function AppShell() {
  const { lock } = usePin()

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="hidden sm:flex items-center justify-end px-6 py-3 border-b border-slate-200 bg-white">
          <button
            onClick={lock}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
          >
            <LogOut size={16} />
            Verrouiller
          </button>
        </header>
        <main className="flex-1 px-4 sm:px-8 py-5 sm:py-8 pb-24 sm:pb-8 max-w-4xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
