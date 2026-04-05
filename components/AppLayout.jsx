'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from './AuthProvider'
import {
  LayoutDashboard, CalendarDays, PlusCircle, ListChecks,
  ClockIcon, BarChart3, Users, Building2, Bell, User,
  LogOut, Menu, X, ChevronDown
} from 'lucide-react'

function NavLink({ href, icon: Icon, label, badge }) {
  const pathname = usePathname()
  const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
  return (
    <Link href={href}
      className={`nav-link ${active ? 'nav-link-active' : ''}`}>
      <Icon size={16} />
      <span>{label}</span>
      {badge > 0 && (
        <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {badge}
        </span>
      )}
    </Link>
  )
}

export default function AppLayout({ children }) {
  const { user, logout, loading } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen]     = useState(false)
  const [unread, setUnread]               = useState(0)
  const [pendingCount, setPendingCount]   = useState(0)
  const [profileOpen, setProfileOpen]     = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading])

  useEffect(() => {
    if (!user) return
    fetchUnread()
    if (['admin', 'hod'].includes(user.role)) fetchPending()
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [user])

  async function fetchUnread() {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setUnread(data.unreadCount || 0)
      }
    } catch {}
  }

  async function fetchPending() {
    try {
      const res = await fetch('/api/bookings?status=pending')
      if (res.ok) {
        const data = await res.json()
        setPendingCount(data.bookings?.length || 0)
      }
    } catch {}
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    )
  }

  const roleColor = user.role === 'admin' ? 'bg-red-100 text-red-700'
                  : user.role === 'hod'   ? 'bg-amber-100 text-amber-700'
                  :                         'bg-gray-100 text-gray-600'

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Building2 size={18} className="text-white" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold text-gray-900">Smart Booking</div>
          <div className="text-xs text-gray-500">Hall Management</div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavLink href="/dashboard"            icon={LayoutDashboard} label="Dashboard" />
        <NavLink href="/faculty/new-booking"  icon={PlusCircle}      label="New Booking" />
        <NavLink href="/faculty/bookings"     icon={ListChecks}      label="My Bookings" />
        <NavLink href="/calendar"             icon={CalendarDays}    label="Calendar" />

        {['admin', 'hod'].includes(user.role) && (
          <>
            <div className="pt-3 pb-1 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Management
            </div>
            <NavLink href="/admin/pending"   icon={ClockIcon}   label="Approvals" badge={pendingCount} />
          </>
        )}

        {user.role === 'admin' && (
          <>
            <NavLink href="/admin/analytics" icon={BarChart3}   label="Analytics" />
            <NavLink href="/admin/users"     icon={Users}       label="Users" />
            <NavLink href="/admin/halls"     icon={Building2}   label="Halls" />
          </>
        )}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm">
            {user.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">{user.name}</div>
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${roleColor}`}>
              {user.role?.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="mt-2 space-y-1">
          <NavLink href="/profile"  icon={User}    label="Profile" />
          <NavLink href="/notifications" icon={Bell} label="Notifications" badge={unread} />
          <button
            onClick={logout}
            className="nav-link w-full text-red-600 hover:bg-red-50 hover:text-red-700">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-gray-200 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-gray-600/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl flex flex-col">
            <div className="flex justify-end p-3">
              <button onClick={() => setSidebarOpen(false)}><X size={20} /></button>
            </div>
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu size={22} className="text-gray-600" />
          </button>
          <span className="font-semibold text-gray-900">Smart Booking</span>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/notifications" className="relative">
              <Bell size={20} className="text-gray-600" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {unread}
                </span>
              )}
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
