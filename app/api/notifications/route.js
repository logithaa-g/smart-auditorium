import { connectDB } from '@/lib/db.js'
import { Notification } from '@/models/index.js'
import { requireAuth } from '@/lib/auth.js'
import { apiError, apiSuccess } from '@/lib/utils.js'

export async function GET(request) {
  const session = await requireAuth(request)
  if (!session) return apiError('Unauthorized', 401)
  await connectDB()

  const notifications = await Notification.find({ user: session.id })
    .populate('booking', 'bookingDate purpose')
    .populate({ path: 'booking', populate: { path: 'hall', select: 'name' } })
    .sort({ createdAt: -1 })
    .limit(50)

  const unreadCount = await Notification.countDocuments({ user: session.id, isRead: false })

  return apiSuccess({ notifications, unreadCount })
}

export async function PATCH(request) {
  const session = await requireAuth(request)
  if (!session) return apiError('Unauthorized', 401)
  await connectDB()

  const { id, markAll } = await request.json()

  if (markAll) {
    await Notification.updateMany({ user: session.id }, { isRead: true })
  } else if (id) {
    await Notification.findOneAndUpdate({ _id: id, user: session.id }, { isRead: true })
  }

  return apiSuccess({ success: true })
}
