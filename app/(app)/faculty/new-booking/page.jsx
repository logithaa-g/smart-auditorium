'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import toast from 'react-hot-toast'
import { Loader2, CheckCircle2, Lightbulb } from 'lucide-react'

const EVENT_TYPES = ['lecture','seminar','exam','college_event','meeting','other']

export default function NewBookingPage() {
  const { user } = useAuth()
  const router   = useRouter()
  const params   = useSearchParams()

  const [halls, setHalls]               = useState([])
  const [slots, setSlots]               = useState([])
  const [slotStatuses, setSlotStatuses] = useState({})
  const [recommendations, setRecs]      = useState([])
  const [checkingSlots, setCheckingSlots] = useState(false)

  const [hallId, setHallId]         = useState(params.get('hallId') || '')
  const [date, setDate]             = useState(params.get('date')   || '')
  const [selectedSlot, setSelected] = useState(params.get('slotId')|| '')
  const [purpose, setPurpose]       = useState('')
  const [eventType, setEventType]   = useState('lecture')
  const [remarks, setRemarks]       = useState('')
  const [submitting, setSubmitting] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => { loadHallsAndSlots() }, [])
  useEffect(() => { if (hallId && date) checkAvailability() }, [hallId, date])

  async function loadHallsAndSlots() {
    const [hRes, sRes] = await Promise.all([fetch('/api/halls'), fetch('/api/slots/list')])
    if (hRes.ok) setHalls((await hRes.json()).halls || [])
    if (sRes.ok) setSlots((await sRes.json()).slots || [])
  }

  async function checkAvailability() {
    setCheckingSlots(true)
    setRecs([])
    try {
      const res = await fetch('/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hallId, date }),
      })
      if (res.ok) {
        const data = await res.json()
        const map = {}
        ;(data.slots || []).forEach(s => { map[s.id] = s.status })
        setSlotStatuses(map)

        // If selected slot became unavailable
        if (selectedSlot && map[selectedSlot] !== 'available') {
          toast.error('Your selected slot is no longer available')
          setSelected('')
          fetchRecommendations()
        }
      }
    } catch { toast.error('Could not check availability') }
    finally { setCheckingSlots(false) }
  }

  async function fetchRecommendations() {
    if (!hallId || !date || !selectedSlot) return
    const res = await fetch('/api/slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hallId, date, slotId: selectedSlot, mode: 'recommend' }),
    })
    if (res.ok) {
      const data = await res.json()
      setRecs(data.recommendations || [])
    }
  }

  function selectSlot(slotId) {
    const status = slotStatuses[slotId]
    if (status === 'booked' || status === 'pending') return
    setSelected(slotId)
    setRecs([])
  }

  function applyRecommendation(rec) {
    if (rec.hallId !== hallId) setHallId(rec.hallId.toString())
    if (rec.slotId) setSelected(rec.slotId.toString())
    setRecs([])
    toast.success('Alternative applied!')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!hallId)       return toast.error('Please select a hall')
    if (!date)         return toast.error('Please select a date')
    if (!selectedSlot) return toast.error('Please select a time slot')
    if (purpose.trim().length < 5) return toast.error('Purpose too short (min 5 chars)')

    setSubmitting(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hallId, slotId: selectedSlot, bookingDate: date, purpose, eventType, remarks }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit')
      toast.success('Booking request submitted! Awaiting approval.')
      router.push('/faculty/bookings')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const selectedHall = halls.find(h => h._id === hallId)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Booking Request</h1>
        <p className="text-gray-500 text-sm mt-1">Fill in the details below to request a hall booking</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card card-body space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Hall */}
            <div>
              <label className="label">Hall / Venue <span className="text-red-500">*</span></label>
              <select className="select" value={hallId} onChange={e => { setHallId(e.target.value); setSelected('') }} required>
                <option value="">— Select a hall —</option>
                {halls.map(h => (
                  <option key={h._id} value={h._id}>
                    {h.name} ({h.location}, cap. {h.capacity})
                  </option>
                ))}
              </select>
              {selectedHall?.amenities && (
                <p className="mt-1.5 text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                  ℹ {selectedHall.amenities}
                </p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="label">Booking Date <span className="text-red-500">*</span></label>
              <input type="date" className="input" min={today}
                value={date} onChange={e => { setDate(e.target.value); setSelected('') }} required />
            </div>
          </div>

          {/* Slot grid */}
          <div>
            <label className="label flex items-center gap-2">
              Time Slot <span className="text-red-500">*</span>
              {checkingSlots && <Loader2 size={14} className="animate-spin text-blue-500" />}
            </label>
            <p className="text-xs text-gray-400 mb-3">
              {hallId && date ? 'Click an available (green) slot to select it.' : 'Select a hall and date first to see live availability.'}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {slots.map(slot => {
                const status = hallId && date ? (slotStatuses[slot._id] || 'available') : 'available'
                const isSelected = selectedSlot === slot._id
                return (
                  <button
                    key={slot._id}
                    type="button"
                    onClick={() => selectSlot(slot._id)}
                    className={`slot-btn ${isSelected ? 'slot-selected' : `slot-${status}`}`}>
                    {slot.label}
                  </button>
                )
              })}
            </div>

            {selectedSlot && (
              <div className="mt-3 flex items-center gap-2 text-sm text-green-700 font-medium">
                <CheckCircle2 size={16} />
                Selected: {slots.find(s => s._id === selectedSlot)?.label}
              </div>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm font-medium text-amber-800 flex items-center gap-1 mb-2">
                  <Lightbulb size={14} /> Suggested alternatives:
                </p>
                <div className="flex flex-wrap gap-2">
                  {recommendations.map((r, i) => (
                    <button key={i} type="button"
                      onClick={() => applyRecommendation(r)}
                      className="btn btn-sm bg-white border border-green-300 text-green-700 hover:bg-green-50">
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Event details */}
        <div className="card card-body space-y-5">
          <h2 className="font-semibold text-gray-900">Event Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2">
              <label className="label">Purpose / Event Title <span className="text-red-500">*</span></label>
              <input type="text" className="input" maxLength={255}
                placeholder="e.g. Guest Lecture on Cloud Computing"
                value={purpose} onChange={e => setPurpose(e.target.value)} required />
            </div>
            <div>
              <label className="label">Event Type</label>
              <select className="select" value={eventType} onChange={e => setEventType(e.target.value)}>
                {EVENT_TYPES.map(t => (
                  <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Remarks / Special Requirements</label>
            <textarea className="input resize-none" rows={3}
              placeholder="Any special setup, AV requirements, etc."
              value={remarks} onChange={e => setRemarks(e.target.value)} />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => router.back()} className="btn btn-outline">Cancel</button>
          <button type="submit" disabled={submitting} className="btn btn-primary px-6">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
            {submitting ? 'Submitting…' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  )
}
