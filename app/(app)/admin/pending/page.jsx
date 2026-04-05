'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, Eye, Loader2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

const PRIORITY_LABELS = { 1: 'Low', 2: 'Department', 3: 'High / Admin' }
const PRIORITY_COLORS = {
  1: 'border-l-gray-300',
  2: 'border-l-blue-400',
  3: 'border-l-red-400',
}

export default function PendingPage() {
  const { user }   = useAuth()
  const [bookings, setBookings]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [processing, setProc]     = useState(null)
  const [rejectModal, setRejectModal] = useState(null) // booking object
  const [reason, setReason]       = useState('')

  useEffect(() => { if (user) load() }, [user])

  async function load() {
    setLoading(true)
    try {
      const scope = user.role === 'hod' ? '&scope=dept' : ''
      const res  = await fetch(`/api/bookings?status=pending${scope}`)
      const data = await res.json()
      // Sort by priority desc, then date asc
      const sorted = (data.bookings || []).sort((a,b) =>
        b.priority - a.priority || a.bookingDate.localeCompare(b.bookingDate)
      )
      setBookings(sorted)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  async function approve(id) {
    if (!confirm('Approve this booking?')) return
    setProc(id)
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.overrode) toast.success('Approved with priority override!')
      else toast.success('Booking approved!')
      load()
    } catch (err) { toast.error(err.message) }
    finally { setProc(null) }
  }

  async function reject() {
    if (!rejectModal) return
    setProc(rejectModal._id)
    try {
      const res = await fetch(`/api/bookings/${rejectModal._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Booking rejected')
      setRejectModal(null)
      setReason('')
      load()
    } catch (err) { toast.error(err.message) }
    finally { setProc(null) }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="animate-spin text-blue-500" />
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
          <p className="text-gray-500 text-sm mt-0.5">{bookings.length} request{bookings.length !== 1 ? 's' : ''} awaiting review</p>
        </div>
      </div>

      {bookings.length === 0 && (
        <div className="card card-body text-center py-16">
          <CheckCircle size={40} className="mx-auto text-green-400 mb-3" />
          <p className="text-gray-500 font-medium">All caught up! No pending requests.</p>
        </div>
      )}

      <div className="space-y-3">
        {bookings.map(b => (
          <div key={b._id}
            className={`card border-l-4 ${PRIORITY_COLORS[b.priority]}`}>
            <div className="p-5">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`badge ${b.priority === 3 ? 'bg-red-100 text-red-700' : b.priority === 2 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      Priority: {PRIORITY_LABELS[b.priority]}
                    </span>
                    <span className="text-xs text-gray-400">#{b._id.slice(-6)}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 truncate">{b.purpose}</h3>
                  <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                    <span>🏛 {b.hall?.name}</span>
                    <span>📅 {new Date(b.bookingDate).toLocaleDateString('en-IN', { weekday:'short', day:'2-digit', month:'short', year:'numeric' })}</span>
                    <span>🕐 {b.slot?.label}</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    Requested by: <strong>{b.requestedBy?.name}</strong>
                    {b.requestedBy?.department?.name && ` · ${b.requestedBy.department.name}`}
                  </div>
                  {b.remarks && (
                    <p className="text-xs text-gray-400 italic mt-1 truncate">{b.remarks}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link href={`/faculty/bookings/${b._id}`}
                    className="btn btn-sm btn-outline" title="View details">
                    <Eye size={14} /> View
                  </Link>
                  <button
                    onClick={() => approve(b._id)}
                    disabled={processing === b._id}
                    className="btn btn-sm btn-success">
                    {processing === b._id
                      ? <Loader2 size={14} className="animate-spin" />
                      : <CheckCircle size={14} />}
                    Approve
                  </button>
                  <button
                    onClick={() => { setRejectModal(b); setReason('') }}
                    className="btn btn-sm btn-danger">
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <XCircle size={22} className="text-red-500" />
              <h3 className="font-semibold text-gray-900">Reject Booking</h3>
            </div>
            <p className="text-sm text-gray-600">
              Rejecting: <strong>{rejectModal.purpose}</strong>
            </p>
            <div>
              <label className="label">Reason for rejection (shown to requester)</label>
              <textarea
                className="input resize-none"
                rows={3}
                placeholder="e.g. Hall reserved for college event on that date."
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setRejectModal(null)} className="btn btn-outline">Cancel</button>
              <button
                onClick={reject}
                disabled={processing === rejectModal._id}
                className="btn btn-danger">
                {processing === rejectModal._id && <Loader2 size={14} className="animate-spin" />}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
