import { connectDB } from '@/lib/db.js'
import { Booking, User } from '@/models/index.js'
import { requireAuth } from '@/lib/auth.js'
import { apiError, apiSuccess, notify, audit, getIp } from '@/lib/utils.js'

export async function GET(request, { params }) {
  const session = await requireAuth(request)
  if (!session) return apiError('Unauthorized', 401)

  await connectDB()

  const booking = await Booking.findById(params.id)
    .populate('hall', 'name location amenities capacity')
    .populate('slot', 'label startTime endTime')
    .populate('requestedBy', 'name email')
    .populate({ path: 'requestedBy', populate: { path: 'department', select: 'name' } })
    .populate('approvedBy', 'name')

  if (!booking) return apiError('Booking not found', 404)

  // Access: owner, admin, hod
  const isOwner = booking.requestedBy._id.toString() === session.id
  if (!isOwner && !['admin', 'hod'].includes(session.role)) {
    return apiError('Forbidden', 403)
  }

  return apiSuccess({ booking })
}

export async function PATCH(request, { params }) {
  const session = await requireAuth(request)
  if (!session) return apiError('Unauthorized', 401)

  await connectDB()

  const { action, reason } = await request.json()
  const booking = await Booking.findById(params.id)
  if (!booking) return apiError('Booking not found', 404)

  if (action === 'cancel') {
    // Owner can cancel their own pending/approved booking
    if (booking.requestedBy.toString() !== session.id) return apiError('Forbidden', 403)
    if (!['pending', 'approved'].includes(booking.status)) return apiError('Cannot cancel this booking')
    booking.status = 'cancelled'
    await booking.save()
    await audit(session.id, 'BOOKING_CANCEL', `Booking ${booking._id} cancelled`, getIp(request))
    return apiSuccess({ booking })
  }

  if (action === 'approve') {
    if (!['admin', 'hod'].includes(session.role)) return apiError('Forbidden', 403)
    if (booking.status !== 'pending') return apiError('Only pending bookings can be approved')

    // Final conflict check
    const conflict = await Booking.findOne({
      hall:        booking.hall,
      bookingDate: booking.bookingDate,
      slot:        booking.slot,
      status:      'approved',
      _id:         { $ne: booking._id },
    })

    if (conflict) {
      // Priority override
      if (booking.priority > conflict.priority) {
        const overrideMsg = `Your booking was overridden by a higher-priority event. ${reason || ''}`
        conflict.status = 'rejected'
        conflict.overrideReason = overrideMsg
        await conflict.save()
        await notify(conflict.requestedBy, overrideMsg, 'warning', conflict._id)

        booking.status     = 'approved'
        booking.approvedBy = session.id
        await booking.save()
        await notify(booking.requestedBy, `Your booking request has been approved.`, 'success', booking._id)
        await audit(session.id, 'BOOKING_APPROVED_OVERRIDE', `Approved ${booking._id}, overrode ${conflict._id}`, getIp(request))
        return apiSuccess({ booking, overrode: conflict._id })
      }
      return apiError('A higher or equal-priority booking already exists for this slot')
    }

    booking.status     = 'approved'
    booking.approvedBy = session.id
    await booking.save()
    await notify(booking.requestedBy, `Your booking request has been approved.`, 'success', booking._id)
    await audit(session.id, 'BOOKING_APPROVED', `Approved ${booking._id}`, getIp(request))
    return apiSuccess({ booking })
  }

  if (action === 'reject') {
    if (!['admin', 'hod'].includes(session.role)) return apiError('Forbidden', 403)
    if (booking.status !== 'pending') return apiError('Only pending bookings can be rejected')

    booking.status     = 'rejected'
    booking.approvedBy = session.id
    booking.remarks    = reason || 'Rejected by reviewer'
    await booking.save()
    await notify(booking.requestedBy, `Your booking was rejected. Reason: ${reason || 'N/A'}`, 'danger', booking._id)
    await audit(session.id, 'BOOKING_REJECTED', `Rejected ${booking._id}. Reason: ${reason}`, getIp(request))
    return apiSuccess({ booking })
  }

  return apiError('Invalid action')
}
