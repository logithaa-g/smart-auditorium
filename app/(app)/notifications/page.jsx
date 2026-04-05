'use client'
import { useEffect, useState } from 'react'
import { Bell, CheckCheck, Loader2, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

const TYPE_ICON = {
  info:    <Info size={18} className="text-blue-500" />,
  success: <CheckCircle size={18} className="text-green-500" />,
  warning: <AlertTriangle size={18} className="text-amber-500" />,
  danger:  <XCircle size={18} className="text-red-500" />,
}

export default function NotificationsPage() {
  const [notifications, setNotifs] = useState([])
  const [loading, setLoading]      = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      const data = await res.json()
      setNotifs(data.notifications || [])
    } catch { toast.error('Failed to load notifications') }
    finally { setLoading(false) }
  }

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    })
    toast.success('All marked as read')
    load()
  }

  async function markRead(id) {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotifs(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n))
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bell size={22} /> Notifications
        </h1>
        {notifications.some(n => !n.isRead) && (
          <button onClick={markAllRead} className="btn btn-sm btn-outline flex items-center gap-1">
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center h-40">
          <Loader2 size={28} className="animate-spin text-blue-500" />
        </div>
      )}

      {!loading && notifications.length === 0 && (
        <div className="card card-body text-center py-16">
          <Bell size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">No notifications yet.</p>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map(n => (
          <div
            key={n._id}
            className={`card p-4 flex items-start gap-4 transition-colors ${!n.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''}`}
            onClick={() => !n.isRead && markRead(n._id)}>
            <div className="flex-shrink-0 mt-0.5">
              {TYPE_ICON[n.type] || TYPE_ICON.info}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${!n.isRead ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                {n.message}
              </p>
              <div className="text-xs text-gray-400 mt-1 flex gap-3">
                <span>{new Date(n.createdAt).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
                {n.booking?.hall?.name && <span>· {n.booking.hall.name}</span>}
              </div>
            </div>
            {n.booking && (
              <Link
                href={`/faculty/bookings/${n.booking._id}`}
                className="btn btn-sm btn-outline flex-shrink-0"
                onClick={e => e.stopPropagation()}>
                View
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
