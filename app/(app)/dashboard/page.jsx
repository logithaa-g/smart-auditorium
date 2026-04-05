'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import {
  CalendarCheck, Clock, CheckCircle, Building2,
  PlusCircle, CalendarDays, ChevronRight, ArrowRight
} from 'lucide-react'

function StatCard({ label, value, color, icon: Icon }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-3xl font-bold">{value ?? '—'}</div>
          <div className="text-sm opacity-85 mt-1">{label}</div>
        </div>
        <Icon size={32} className="opacity-30" />
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const cls = {
    pending:   'badge-pending',
    approved:  'badge-approved',
    rejected:  'badge-rejected',
    cancelled: 'badge-cancelled',
  }
  return <span className={`badge ${cls[status] || 'badge-info'}`}>{status}</span>
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [bookings, setBookings]   = useState([])
  const [stats, setStats]         = useState({})
  const [upcoming, setUpcoming]   = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    if (user) loadData()
  }, [user])

  async function loadData() {
    setLoading(true)
    try {
      const scope = user.role === 'faculty' ? '&scope=mine' : ''
      const [bRes, upRes] = await Promise.all([
        fetch(`/api/bookings?${scope}`),
        fetch(`/api/bookings?scope=mine&status=approved`),
      ])
      const bData  = await bRes.json()
      const upData = await upRes.json()

      const allBookings = bData.bookings || []
      setBookings(allBookings.slice(0, 8))

      // Compute stats
      const today = new Date().toISOString().split('T')[0]
      const upcomingList = (upData.bookings || [])
        .filter(b => b.bookingDate >= today)
        .sort((a, b) => a.bookingDate.localeCompare(b.bookingDate))
        .slice(0, 5)
      setUpcoming(upcomingList)

      setStats({
        total:    allBookings.length,
        pending:  allBookings.filter(b => b.status === 'pending').length,
        approved: allBookings.filter(b => b.status === 'approved').length,
        halls:    4,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Welcome back, {user?.name}</p>
        </div>
        <Link href="/faculty/new-booking" className="btn btn-primary">
          <PlusCircle size={16} /> New Booking
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Bookings"  value={stats.total}    color="bg-blue-600"   icon={CalendarCheck} />
        <StatCard label="Pending"         value={stats.pending}  color="bg-amber-500"  icon={Clock} />
        <StatCard label="Approved"        value={stats.approved} color="bg-green-600"  icon={CheckCircle} />
        <StatCard label="Active Halls"    value={stats.halls}    color="bg-purple-600" icon={Building2} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent bookings */}
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">Recent Bookings</h2>
            <Link href="/faculty/bookings" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="table-wrapper rounded-none border-0">
            <table>
              <thead>
                <tr>
                  <th>Hall</th><th>Date</th><th>Purpose</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 && (
                  <tr><td colSpan={4} className="text-center text-gray-400 py-8">No bookings yet.</td></tr>
                )}
                {bookings.map(b => (
                  <tr key={b._id}>
                    <td className="font-medium">{b.hall?.name}</td>
                    <td className="text-gray-500 text-xs">
                      {new Date(b.bookingDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                    </td>
                    <td className="max-w-[180px] truncate text-gray-600">{b.purpose}</td>
                    <td><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Quick actions */}
          <div className="card">
            <div className="card-header"><h2 className="font-semibold text-gray-900">Quick Actions</h2></div>
            <div className="card-body space-y-2 pt-3">
              <Link href="/faculty/new-booking" className="btn btn-primary w-full justify-center">
                <PlusCircle size={16} /> New Booking Request
              </Link>
              <Link href="/calendar" className="btn btn-outline w-full justify-center">
                <CalendarDays size={16} /> View Calendar
              </Link>
              {['admin', 'hod'].includes(user?.role) && (
                <Link href="/admin/pending" className="btn btn-warning w-full justify-center">
                  <Clock size={16} /> Review Pending
                  {stats.pending > 0 && (
                    <span className="ml-auto bg-white/30 rounded-full text-xs px-1.5">{stats.pending}</span>
                  )}
                </Link>
              )}
            </div>
          </div>

          {/* Upcoming */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-gray-900">My Upcoming</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {upcoming.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-6">No upcoming bookings.</p>
              )}
              {upcoming.map(b => (
                <div key={b._id} className="px-4 py-3">
                  <div className="font-medium text-sm">{b.hall?.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {new Date(b.bookingDate).toLocaleDateString('en-IN', { weekday:'short', day:'2-digit', month:'short' })}
                    {' · '}{b.slot?.label}
                  </div>
                  <div className="text-xs text-gray-400 truncate mt-0.5">{b.purpose}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
