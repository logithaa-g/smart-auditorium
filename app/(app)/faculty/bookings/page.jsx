'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import toast from 'react-hot-toast'
import { PlusCircle, Eye, XCircle, Pencil, Loader2 } from 'lucide-react'

function Badge({ status }) {
  const cls = { pending:'badge-pending', approved:'badge-approved', rejected:'badge-rejected', cancelled:'badge-cancelled' }
  return <span className={`badge ${cls[status] || 'badge-info'}`}>{status}</span>
}

const PRIORITY_LABELS = { 1: 'Low', 2: 'Dept', 3: 'High' }
const PRIORITY_COLORS = { 1: 'bg-gray-100 text-gray-600', 2: 'bg-blue-100 text-blue-700', 3: 'bg-red-100 text-red-700' }

export default function MyBookingsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('')
  const [cancelling, setCancelling] = useState(null)

  useEffect(() => { if (user) load() }, [user, filter])

  async function load() {
    setLoading(true)
    try {
      const q = filter ? `&status=${filter}` : ''
      const res = await fetch(`/api/bookings?scope=mine${q}`)
      const data = await res.json()
      setBookings(data.bookings || [])
    } catch { toast.error('Failed to load bookings') }
    finally { setLoading(false) }
  }

  async function cancel(id) {
    if (!confirm('Cancel this booking?')) return
    setCancelling(id)
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Booking cancelled')
      load()
    } catch (err) { toast.error(err.message) }
    finally { setCancelling(null) }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <Link href="/faculty/new-booking" className="btn btn-primary">
          <PlusCircle size={16} /> New Request
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['', 'pending', 'approved', 'rejected', 'cancelled'].map(s => (
          <button key={s}
            onClick={() => setFilter(s)}
            className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-outline'}`}>
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="table-wrapper rounded-xl border-0">
            <table>
              <thead>
                <tr>
                  <th>Hall</th><th>Date</th><th>Slot</th>
                  <th>Purpose</th><th>Priority</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-gray-400 py-10">No bookings found.</td></tr>
                )}
                {bookings.map(b => (
                  <tr key={b._id}>
                    <td className="font-medium">{b.hall?.name}</td>
                    <td className="text-gray-500 text-xs whitespace-nowrap">
                      {new Date(b.bookingDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                    </td>
                    <td className="text-xs text-gray-500">{b.slot?.label}</td>
                    <td className="max-w-[180px] truncate">{b.purpose}</td>
                    <td>
                      <span className={`badge ${PRIORITY_COLORS[b.priority]}`}>
                        {PRIORITY_LABELS[b.priority]}
                      </span>
                    </td>
                    <td><Badge status={b.status} /></td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Link href={`/faculty/bookings/${b._id}`}
                          className="btn btn-sm btn-outline" title="View">
                          <Eye size={14} />
                        </Link>
                        {b.status === 'pending' && (
                          <Link href={`/faculty/new-booking?edit=${b._id}`}
                            className="btn btn-sm btn-outline" title="Edit">
                            <Pencil size={14} />
                          </Link>
                        )}
                        {['pending','approved'].includes(b.status) && b.bookingDate >= today && (
                          <button
                            onClick={() => cancel(b._id)}
                            disabled={cancelling === b._id}
                            className="btn btn-sm btn-outline text-red-600 hover:bg-red-50" title="Cancel">
                            {cancelling === b._id
                              ? <Loader2 size={14} className="animate-spin" />
                              : <XCircle size={14} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
