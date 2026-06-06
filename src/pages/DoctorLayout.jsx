import { signOut } from 'firebase/auth'
import { auth } from '../firebase/config'
import { useAuth } from '../context/AuthContext'
import { Outlet, NavLink } from 'react-router-dom'
import {
  IconActivity, IconGrid, IconUsers, IconCalendar, IconLogOut,
} from '../components/Icons'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Inicio', Icon: IconGrid, end: true },
  { to: '/dashboard/pacientes', label: 'Pacientes', Icon: IconUsers },
  { to: '/dashboard/agenda', label: 'Agenda', Icon: IconCalendar },
]

export default function DoctorLayout() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-[#7B0000] hidden md:flex flex-col flex-shrink-0 min-h-screen">
        {/* Profile */}
        <div className="flex flex-col items-center py-8 px-5 border-b border-white/10">
          <div className="w-16 h-16 rounded-full border-2 border-white/30 overflow-hidden mb-3 bg-white/20 flex items-center justify-center">
            {user.photoURL
              ? <img src={user.photoURL} className="w-full h-full object-cover" alt="" />
              : <IconActivity className="w-7 h-7 text-white" />
            }
          </div>
          <p className="font-bold text-white text-sm text-center leading-tight">Dra. Adriana Noguera</p>
          {user.email && (
            <p className="text-white/50 text-[11px] text-center mt-1 px-2 break-all">{user.email}</p>
          )}
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 p-3 flex-1 pt-4">
          {NAV_ITEMS.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white text-[#B00000] shadow-sm'
                    : 'text-white/65 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Sign out */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => signOut(auth)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:bg-white/10 hover:text-white/80 transition-all"
          >
            <IconLogOut className="w-4 h-4" />
            Salir
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden bg-white border-b border-gray-100 px-5 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <IconActivity className="w-5 h-5 text-[#B00000]" />
            <span className="font-bold text-[#B00000] text-sm">Dra. Noguera</span>
          </div>
          <button
            onClick={() => signOut(auth)}
            className="text-xs text-gray-400 hover:text-red-600 transition flex items-center gap-1.5"
          >
            <IconLogOut className="w-3.5 h-3.5" />
            Salir
          </button>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
