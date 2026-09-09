import { NavLink } from 'react-router-dom'
import { Home, GraduationCap, Bike, BookOpen } from 'lucide-react'

const LINKS = [
  { to: '/', label: 'Accueil', icon: Home, end: true },
  { to: '/cours', label: 'Cours', icon: GraduationCap },
  { to: '/velo', label: 'Vélo', icon: Bike },
  { to: '/etudes', label: 'Études', icon: BookOpen },
]

function linkClasses(isActive, direction) {
  const base =
    direction === 'row'
      ? 'flex flex-col items-center justify-center gap-1 flex-1 py-2 text-xs font-medium'
      : 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium'
  const active =
    direction === 'row' ? 'text-brand-600' : 'bg-brand-50 text-brand-700'
  const inactive = direction === 'row' ? 'text-slate-400' : 'text-slate-600 hover:bg-slate-100'
  return `${base} ${isActive ? active : inactive}`
}

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 flex sm:hidden safe-bottom">
      {LINKS.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => linkClasses(isActive, 'row')}>
          <Icon size={20} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden sm:flex sm:flex-col w-60 shrink-0 border-r border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 px-2 mb-6 mt-1">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm">
          €
        </div>
        <span className="font-semibold text-slate-900">Compta Manager</span>
      </div>
      <nav className="flex flex-col gap-1">
        {LINKS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => linkClasses(isActive, 'col')}>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
