import { connectDB } from '@/lib/db.js'
import { Booking, User } from '@/models/index.js'
import { requireAuth, requireRole } from '@/lib/auth.js'
import { apiError, apiSuccess, notify, audit, priorityForRole, getIp } from '@/lib/utils.js'

export async function GET(request) {
  const session = await requireAuth(request)
  if (!session) return apiError('Unauthorized', 401)

  await connectDB()

  const { searchParams } = new URL(request.url)
  const status   = searchParams.get('status')
  const hallId   = searchParams.get('hall')
  const dateFrom = searchParams.get('dateFrom')
  const dateTo   = searchParams.get('dateTo')
  const scope    = searchParams.get('scope') // 'mine' | 'dept' | 'all'

  const query = {}

  // Scope filtering
  if (scope === 'mine' || session.role === 'faculty') {
    query.requestedBy = session.id
  } else if (scope === 'dept' || session.role === 'hod') {
    // Get all users in same department
    const deptUsers = await User.find({ department: session.department }, '_id')
    query.requestedBy = { $in: deptUsers.map(u => u._id) }
  }
  // admin sees all

  if (status)   query.status = status
  if (hallId)   query.hall   = hallId
  if (dateFrom || dateTo) {
    query.bookingDate = {}
    if (dateFrom) query.bookingDate.$gte = dateFrom
    if (dateTo)   query.bookingDate.$lte = dateTo
  }

  const bookings = await Booking.find(query)
    .populate('hall', 'name location')
    .populate('slot', 'label startTime endTime')
    .populate('requestedBy', 'name email department')
    .populate({ path: 'requestedBy', populate: { path: 'department', select: 'name' } })
    .populate('approvedBy', 'name')
    .sort({ createdAt: -1 })
    .limit(200)

  return apiSuccess({ bookings })
}

export async function POST(request) {
  const session = await requireAuth(request)
  if (!session) return apiError('Unauthorized', 401)

  await connectDB()

  const body = await request.json()
  const { hallId, slotId, bookingDate, purpose, eventType, remarks } = body

  if (!hallId || !slotId || !bookingDate || !purpose) {
    return apiError('Missing required fields')
  }

  if (bookingDate < new Date().toISOString().split('T')[0]) {
    return apiError('Booking date cannot be in the past')
  }

  // Check availability
  const existing = await Booking.findOne({
    hall: hallId,
    slot: slotId,
    bookingDate,
    status: { $in: ['approved', 'pending'] },
  })

  if (existing?.status === 'approved') return apiError('This slot is already booked')
  if (existing?.status === 'pending')  return apiError('This slot has a pending request')

  const priority = priorityForRole(session.role, eventType)

  const booking = await Booking.create({
    hall:        hallId,
    requestedBy: session.id,
    slot:        slotId,
    bookingDate,
    purpose,
    eventType:   eventType || 'lecture',
    priority,
    remarks,
  })

  // Notify admins and HODs
  const reviewers = await User.find({ role: { $in: ['admin', 'hod'] }, isActive: true }, '_id')
  await Promise.all(reviewers.map(r =>
    notify(r._id, `New booking request from ${session.name} for ${bookingDate}`, 'info', booking._id)
  ))

  await audit(session.id, 'BOOKING_REQUEST', `Booking ${booking._id} for ${bookingDate}`, getIp(request))

  return apiSuccess({ booking }, 201)
}
