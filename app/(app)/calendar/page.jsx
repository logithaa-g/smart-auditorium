'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { addWeeks, subWeeks, startOfWeek, addDays, format, isToday } from 'date-fns'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_CLASSES = {
  available: 'bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer',
  pending:   'bg-amber-50 text-amber-700 cursor-not-allowed opacity-70',
  booked:    'bg-red-50 text-red-700 cursor-not-allowed opacity-70',
}

export default function CalendarPage() {
  const [weekBase, setWeekBase] = useState(new Date())
  const [halls, setHalls]       = useState([])
  const [slots, setSlots]       = useState([])
  const [grid, setGrid]         = useState({})   // grid[hallId][date][slotId] = status
  const [loading, setLoading]   = useState(true)
  const [filterHall, setFilter] = useState('')

  const weekStart = startOfWeek(weekBase, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  useEffect(() => { loadMeta() }, [])
  useEffect(() => { if (halls.length && slots.length) loadGrid() }, [halls, slots, weekBase])

  async function loadMeta() {
    const [hRes, sRes] = await Promise.all([fetch('/api/halls'), fetch('/api/slots')])
    const hData = await hRes.json()
    const sData = await sRes.json()
    setHalls(hData.halls || [])
    setSlots((sData.slots || []).filter(s => s.label && !s.label.includes('Full')))
  }

  async function loadGrid() {
    setLoading(true)
    const newGrid = {}
    const dateFrom = format(days[0], 'yyyy-MM-dd')
    const dateTo   = format(days[6], 'yyyy-MM-dd')

    try {
      const res  = await fetch(`/api/bookings?dateFrom=${dateFrom}&dateTo=${dateTo}`)
      const data = await res.json()
      const bookings = data.bookings || []

      // Build index
      for (const b of bookings) {
        if (!['approved','pending'].includes(b.status)) continue
        const hallId = b.hall?._id || b.hall
        const slotId = b.slot?._id || b.slot
        if (!newGrid[hallId]) newGrid[hallId] = {}
        if (!newGrid[hallId][b.bookingDate]) newGrid[hallId][b.bookingDate] = {}
        newGrid[hallId][b.bookingDate][slotId] = b.status === 'approved' ? 'booked' : 'pending'
      }
    } catch { toast.error('Failed to load calendar') }

    setGrid(newGrid)
    setLoading(false)
  }

  const displayHalls = filterHall ? halls.filter(h => h._id === filterHall) : halls

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Availability Calendar</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <select className="select w-52" value={filterHall} onChange={e => setFilter(e.target.value)}>
            <option value="">All Halls</option>
            {halls.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
          </select>
          <button onClick={() => setWeekBase(w => subWeeks(w, 1))} className="btn btn-outline p-2">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
            {format(days[0], 'dd MMM')} – {format(days[6], 'dd MMM yyyy')}
          </span>
          <button onClick={() => setWeekBase(w => addWeeks(w, 1))} className="btn btn-outline p-2">
            <ChevronRight size={18} />
          </button>
          <button onClick={() => setWeekBase(new Date())} className="btn btn-primary btn-sm">Today</button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-100 border border-green-300" /> Available</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" /> Pending</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100 border border-red-300" /> Booked</span>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-40">
          <Loader2 size={28} className="animate-spin text-blue-500" />
        </div>
      )}

      {!loading && displayHalls.map(hall => (
        <div key={hall._id} className="card overflow-hidden">
          <div className="card-header bg-gray-50">
            <div>
              <span className="font-semibold text-gray-900">{hall.name}</span>
              <span className="text-xs text-gray-400 ml-2">{hall.location} · cap. {hall.capacity}</span>
            </div>
            <Link
              href={`/faculty/new-booking?hallId=${hall._id}`}
              className="btn btn-primary btn-sm">
              + Book
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[700px]">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-3 py-2 text-left font-medium text-gray-500 w-40">Time Slot</th>
                  {days.map(d => (
                    <th key={d} className={`px-2 py-2 text-center font-medium ${isToday(d) ? 'text-blue-600 bg-blue-50' : 'text-gray-500'}`}>
                      {format(d, 'EEE')}<br />
                      <span className="text-gray-400 font-normal">{format(d, 'dd MMM')}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slots.map(slot => (
                  <tr key={slot._id} className="border-t border-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-600 whitespace-nowrap">{slot.label}</td>
                    {days.map(d => {
                      const dateStr = format(d, 'yyyy-MM-dd')
                      const past    = dateStr < format(new Date(), 'yyyy-MM-dd')
                      const status  = grid[hall._id]?.[dateStr]?.[slot._id] || 'available'
                      const cls     = past ? 'bg-gray-50 text-gray-300 cursor-not-allowed' : STATUS_CLASSES[status]

                      if (!past && status === 'available') {
                        return (
                          <td key={d} className="px-1 py-1">
                            <Link
                              href={`/faculty/new-booking?hallId=${hall._id}&date=${dateStr}&slotId=${slot._id}`}
                              className={`block text-center rounded py-2 px-1 transition-colors ${cls}`}>
                              Free
                            </Link>
                          </td>
                        )
                      }
                      return (
                        <td key={d} className="px-1 py-1">
                          <div className={`text-center rounded py-2 px-1 ${cls} capitalize`}>
                            {past ? '—' : status}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
