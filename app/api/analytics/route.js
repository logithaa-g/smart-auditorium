import { connectDB } from '@/lib/db.js'
import { Booking, Hall, User, AuditLog } from '@/models/index.js'
import { requireRole } from '@/lib/auth.js'
import { apiError, apiSuccess } from '@/lib/utils.js'
import { subMonths, format, startOfMonth } from 'date-fns'

export async function GET(request) {
  const session = await requireRole(request, 'admin')
  if (!session) return apiError('Forbidden', 403)

  await connectDB()

  const [total, approved, pending, rejected, cancelled] = await Promise.all([
    Booking.countDocuments(),
    Booking.countDocuments({ status: 'approved' }),
    Booking.countDocuments({ status: 'pending' }),
    Booking.countDocuments({ status: 'rejected' }),
    Booking.countDocuments({ status: 'cancelled' }),
  ])

  // Hall utilisation
  const halls = await Hall.find({ isActive: true })
  const hallUsage = await Promise.all(halls.map(async h => ({
    name:     h.name,
    total:    await Booking.countDocuments({ hall: h._id }),
    approved: await Booking.countDocuments({ hall: h._id, status: 'approved' }),
  })))

  // Monthly trend — last 6 months
  const monthly = []
  for (let i = 5; i >= 0; i--) {
    const date  = subMonths(new Date(), i)
    const month = format(date, 'MMM yyyy')
    const year  = date.getFullYear()
    const mo    = date.getMonth() + 1
    const prefix = `${year}-${String(mo).padStart(2, '0')}`

    const [tot, app] = await Promise.all([
      Booking.countDocuments({ bookingDate: { $regex: `^${prefix}` } }),
      Booking.countDocuments({ bookingDate: { $regex: `^${prefix}` }, status: 'approved' }),
    ])
    monthly.push({ month, total: tot, approved: app })
  }

  // Department usage
  const users = await User.find().populate('department', 'name')
  const deptMap = {}
  for (const u of users) {
    const dname = u.department?.name || 'Unknown'
    if (!deptMap[dname]) deptMap[dname] = []
    deptMap[dname].push(u._id)
  }
  const deptUsage = await Promise.all(
    Object.entries(deptMap).map(async ([name, userIds]) => ({
      name,
      total: await Booking.countDocuments({ requestedBy: { $in: userIds } }),
    }))
  )
  deptUsage.sort((a, b) => b.total - a.total)

  // Recent audit log
  const auditLog = await AuditLog.find()
    .populate('user', 'name')
    .sort({ createdAt: -1 })
    .limit(15)

  return apiSuccess({
    kpis: { total, approved, pending, rejected, cancelled },
    hallUsage,
    monthly,
    deptUsage,
    auditLog,
  })
}
