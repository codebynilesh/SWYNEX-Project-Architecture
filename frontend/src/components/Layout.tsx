import { useAuth } from '../contexts/AuthContext'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getInitials } from '../lib/utils'
import { useState } from 'react'

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAuthenticated } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50">
        {children}
      </div>
    )
  }

  const nav = [
    { label: 'Dashboard', href: '/dashboard', icon: '▦', active: location.pathname === '/dashboard' },
    { label: 'Projects', href: '/dashboard', icon: '◧', active: location.pathname.startsWith('/projects') },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex w-64 flex-col border-r bg-white">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm">TF</div>
          <span className="font-semibold text-slate-900">TaskFlow Pro</span>
          <span className="ml-auto text-[10px] font-medium bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200">PRO</span>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {nav.map(item => (
            <Link key={item.label} to={item.href} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${item.active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
              <span>{item.icon}</span>{item.label}
            </Link>
          ))}
          <div className="pt-6">
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Workspace</p>
            <div className="rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 p-4 text-white">
              <p className="text-sm font-medium">Upgrade to Teams</p>
              <p className="text-xs opacity-80 mt-1">Get advanced analytics & SSO</p>
              <button className="mt-3 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-indigo-600">Learn more</button>
            </div>
          </div>
        </nav>

        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
              {getInitials(user?.name || 'User')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
            <button onClick={handleLogout} title="Logout" className="rounded-md p-2 hover:bg-slate-100 text-slate-400">↗</button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden rounded-md p-2 hover:bg-slate-100">☰</button>
            <div className="hidden sm:block">
              <h1 className="text-sm font-semibold text-slate-900">Good morning, {user?.name?.split(' ')[0] ?? 'there'} 👋</h1>
              <p className="text-xs text-slate-500">Here's what's happening with your projects today.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 rounded-full border bg-slate-50 px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-slate-600">API Online</span>
            </div>
            <button onClick={handleLogout} className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-slate-50">Logout</button>
          </div>
        </header>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div className="fixed inset-0 bg-slate-900/30" onClick={() => setMobileOpen(false)} />
            <div className="relative w-64 bg-white border-r p-4 space-y-3">
              <div className="flex items-center gap-2 font-semibold"><span className="h-8 w-8 rounded bg-indigo-600 text-white grid place-items-center text-sm">TF</span>TaskFlow Pro</div>
              {nav.map(i => <Link key={i.label} to={i.href} onClick={()=>setMobileOpen(false)} className={`flex gap-2 rounded px-3 py-2 text-sm ${i.active?'bg-indigo-50 text-indigo-700':'text-slate-600'}`}>{i.icon} {i.label}</Link>)}
            </div>
          </div>
        )}

        <main className="flex-1">{children}</main>

        <footer className="border-t bg-white px-6 py-3 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} TaskFlow Pro — Built with React + Express + Prisma.
        </footer>
      </div>
    </div>
  )
}
