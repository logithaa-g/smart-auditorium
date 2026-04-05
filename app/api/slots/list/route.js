import { connectDB } from '@/lib/db.js'
import { TimeSlot } from '@/models/index.js'
import { requireAuth } from '@/lib/auth.js'
import { apiError, apiSuccess } from '@/lib/utils.js'

export async function GET(request) {
  const session = await requireAuth(request)
  if (!session) return apiError('Unauthorized', 401)
  await connectDB()
  const slots = await TimeSlot.find({ isActive: true }).sort({ order: 1 })
  return apiSuccess({ slots })
}
