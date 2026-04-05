'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ArrowLeft, CheckCircle, XCircle, Clock, Building2, Calendar, AlarmClock, User, Loader2 } from 'lucide-react'

const PRIORITY_LABELS = { 1: 'Low (Faculty)', 2: 'Department (HOD)', 3: 'High (Admin/College)' }
const PRIORITY_COLORS = { 1: 'bg-gray-100 text-gray-600', 2: 'bg-blue-100 text-blue-700', 3: 'bg-red-100 text-red-700' }

function StatusIcon({ status }) {
  if (status === 'approved')  return <CheckCircle size={20} className="text-green-500" />
  if (status === 'rejected')  return <XCircle     size={20} className="text-red-500" />
  if (status === 'cancelled') return <XCircle     size={20} className="text-gray-400" />
  return <Clock size={20} className="text-amber-500" />
}

export default function BookingDetailPage() {
  const { id }    = useParams()
  const { user }  = useAuth()
  const router    = useRouter()
  const [booking, setBooking]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => { if (id) load() }, [id])

  async function load() {
    setLoading(true)
    try {
      const res  = await fetch(`/api/bookings/${id}`)
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); router.push('/faculty/bookings'); return }
      setBooking(data.booking)
    } catch { toast.error('Failed to load booking') }
    finally { setLoading(false) }
  }

  async function cancel() {
    if (!confirm('Cancel this booking?')) return
    setCancelling(true)
    try {
      const res  = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Booking cancelled')
      load()
    } catch (err) { toast.error(err.message) }
    finally { setCancelling(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="animate-spin text-blue-500" />
    </div>
  )

  if (!booking) return null

  const today    = new Date().toISOString().split('T')[0]
  const isOwner  = booking.requestedBy?._id === user?.id
  const canCancel = isOwner && ['pending','approved'].includes(booking.status) && booking.bookingDate >= today

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="btn btn-outline btn-sm">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-2">
          <StatusIcon status={booking.status} />
          <span className={`badge text-sm px-3 py-1 ${
            booking.status === 'approved'  ? 'badge-approved' :
            booking.status === 'rejected'  ? 'badge-rejected' :
            booking.status === 'cancelled' ? 'badge-cancelled' : 'badge-pending'
          }`}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </span>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">Booking #{id.slice(-6)}</h1>

      {/* Venue details */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Building2 size={18} className="text-blue-500" /> Venue Details
          </h2>
        </div>
        <div className="card-body grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400 text-xs mb-0.5">Hall</div>
            <div className="font-semibold">{booking.hall?.name}</div>
            <div className="text-gray-500">{booking.hall?.location}</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-0.5">Date</div>
            <div className="font-semibold">
              {new Date(booking.bookingDate).toLocaleDateString('en-IN', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })}
            </div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-0.5">Time Slot</div>
            <div className="font-semibold">{booking.slot?.label}</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-0.5">Amenities</div>
            <div className="text-gray-600">{booking.hall?.amenities || '—'}</div>
          </div>
        </div>
      </div>

      {/* Event details */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Calendar size={18} className="text-blue-500" /> Event Details
          </h2>
        </div>
        <div className="card-body grid grid-cols-2 gap-4 text-sm">
          <div className="col-span-2">
            <div className="text-gray-400 text-xs mb-0.5">Purpose</div>
            <div className="font-semibold text-base">{booking.purpose}</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-0.5">Event Type</div>
            <div>{booking.eventType?.replace('_',' ').replace(/\b\w/g, c => c.toUpperCase())}</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-0.5">Priority</div>
            <span className={`badge ${PRIORITY_COLORS[booking.priority]}`}>
              {PRIORITY_LABELS[booking.priority]}
            </span>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-0.5">Requested By</div>
            <div className="font-medium">{booking.requestedBy?.name}</div>
            <div className="text-gray-500 text-xs">{booking.requestedBy?.email}</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-0.5">Submitted</div>
            <div>{new Date(booking.createdAt).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</div>
          </div>
          {booking.remarks && (
            <div className="col-span-2">
              <div className="text-gray-400 text-xs mb-0.5">Remarks</div>
              <div className="text-gray-600 italic">{booking.remarks}</div>
            </div>
          )}
        </div>
      </div>

      {/* Approval details */}
      {booking.approvedBy && (
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <User size={18} className="text-blue-500" /> Review Details
            </h2>
          </div>
          <div className="card-body grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-400 text-xs mb-0.5">Reviewed By</div>
              <div className="font-medium">{booking.approvedBy?.name}</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-0.5">Reviewed On</div>
              <div>{new Date(booking.updatedAt).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</div>
            </div>
            {(booking.remarks || booking.overrideReason) && booking.status !== 'approved' && (
              <div className="col-span-2">
                <div className="text-gray-400 text-xs mb-0.5">Reason</div>
                <div className="text-red-600">{booking.overrideReason || booking.remarks}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <AlarmClock size={18} className="text-blue-500" /> Status Timeline
          </h2>
        </div>
        <div className="card-body">
          <div className="relative pl-6">
            <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-200" />
            <div className="relative mb-4">
              <div className="absolute -left-4 top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
              <div className="font-medium text-sm">Submitted</div>
              <div className="text-xs text-gray-400">{new Date(booking.createdAt).toLocaleString('en-IN')}</div>
            </div>
            {booking.status === 'approved' && (
              <div className="relative mb-4">
                <div className="absolute -left-4 top-1 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                <div className="font-medium text-sm text-green-700">Approved</div>
                <div className="text-xs text-gray-400">by {booking.approvedBy?.name}</div>
              </div>
            )}
            {booking.status === 'rejected' && (
              <div className="relative mb-4">
                <div className="absolute -left-4 top-1 w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
                <div className="font-medium text-sm text-red-700">Rejected</div>
                <div className="text-xs text-gray-400">by {booking.approvedBy?.name}</div>
              </div>
            )}
            {booking.status === 'cancelled' && (
              <div className="relative">
                <div className="absolute -left-4 top-1 w-3 h-3 rounded-full bg-gray-400 border-2 border-white" />
                <div className="font-medium text-sm text-gray-500">Cancelled</div>
              </div>
            )}
            {booking.status === 'pending' && (
              <div className="relative">
                <div className="absolute -left-4 top-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-white" />
                <div className="font-medium text-sm text-amber-600">Awaiting Approval</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {canCancel && (
          <button onClick={cancel} disabled={cancelling}
            className="btn btn-danger">
            {cancelling ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={16} />}
            Cancel Booking
          </button>
        )}
        {['admin','hod'].includes(user?.role) && booking.status === 'pending' && (
          <Link href="/admin/pending" className="btn btn-primary">
            Go to Approval Queue
          </Link>
        )}
      </div>
    </div>
  )
}
