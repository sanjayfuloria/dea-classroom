import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const navItems = [
  { to: '/dashboard', label: 'Dashboard',    icon: '⊞',  roles: ['faculty','student'] },
  { to: '/analysis',  label: 'New Analysis', icon: '◎',  roles: ['faculty','student'] },
  { to: '/python',    label: 'Python Console',icon: '{}', roles: ['faculty','student'] },
  { to: '/sessions',  label: 'My Sessions',  icon: '⊟',  roles: ['faculty','student'] },
  { to: '/faculty',   label: 'Faculty Panel', icon: '◆',  roles: ['faculty'] },
]

export default function Layout() {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const visible = navItems.filter(n => n.roles.includes(profile?.role || ''))

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans">
      {/* ── Sidebar ── */}
      <aside className="w-64 bg-navy flex flex-col shadow-xl">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-navy-light">
          <div className="text-2xl font-serif font-bold text-white tracking-tight">DEA<span className="text-teal">·</span>Lab</div>
          <div className="text-xs text-blue-300 mt-0.5">IFHE Hyderabad</div>
        </div>

        {/* User badge */}
        <div className="px-6 py-4 border-b border-navy-light">
          <div className="text-sm font-semibold text-white truncate">{profile?.name || 'User'}</div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${
            profile?.role === 'faculty'
              ? 'bg-gold/20 text-yellow-300'
              : 'bg-teal/20 text-teal-300'
          }`}>
            {profile?.role === 'faculty' ? '🎓 Faculty' : '📚 Student'}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          {visible.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-teal text-white shadow-sm'
                    : 'text-blue-200 hover:bg-navy-light hover:text-white'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-4 py-4 border-t border-navy-light">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-300 hover:bg-red-900/30 hover:text-red-200 transition-all"
          >
            <span>↩</span> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
