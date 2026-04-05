import { connectDB } from '@/lib/db.js'
import { Booking, Hall, TimeSlot } from '@/models/index.js'
import { requireAuth } from '@/lib/auth.js'
import { apiError, apiSuccess } from '@/lib/utils.js'

export async function POST(request) {
  const session = await requireAuth(request)
  if (!session) return apiError('Unauthorized', 401)

  await connectDB()

  const { hallId, date, slotId, mode } = await request.json()
  if (!hallId || !date) return apiError('Missing hallId or date')

  const slots = await TimeSlot.find({ isActive: true }).sort({ order: 1 })

  // Get all bookings for this hall+date that are active
  const activeBookings = await Booking.find({
    hall:        hallId,
    bookingDate: date,
    status:      { $in: ['approved', 'pending'] },
  }).select('slot status')

  const bookedMap = {}
  for (const b of activeBookings) {
    bookedMap[b.slot.toString()] = b.status
  }

  const slotStatuses = slots.map(s => ({
    id:     s._id,
    label:  s.label,
    status: bookedMap[s._id.toString()]
      ? (bookedMap[s._id.toString()] === 'approved' ? 'booked' : 'pending')
      : 'available',
  }))

  // If a specific slotId is provided and unavailable, return recommendations
  let recommendations = []
  if (slotId && mode === 'recommend') {
    // Alt slots — same hall, same date, free
    const altSlots = slotStatuses
      .filter(s => s.id.toString() !== slotId && s.status === 'available')
      .slice(0, 3)
      .map(s => ({ type: 'alt_slot', hallId, slotId: s.id, date, label: `Same hall · ${s.label}` }))

    // Alt halls — same slot, same date, free
    const allHalls = await Hall.find({ isActive: true, _id: { $ne: hallId } })
    const altHalls = []
    for (const hall of allHalls) {
      const conflict = await Booking.findOne({
        hall: hall._id, bookingDate: date, slot: slotId,
        status: { $in: ['approved', 'pending'] }
      })
      if (!conflict) {
        altHalls.push({ type: 'alt_hall', hallId: hall._id, slotId, date, label: `${hall.name} · Same slot` })
      }
      if (altHalls.length >= 3) break
    }

    recommendations = [...altSlots, ...altHalls]
  }

  return apiSuccess({ slots: slotStatuses, recommendations })
}
