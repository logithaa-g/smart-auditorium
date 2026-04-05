import { connectDB } from '@/lib/db.js'
import { Hall } from '@/models/index.js'
import { requireAuth, requireRole } from '@/lib/auth.js'
import { apiError, apiSuccess, audit, getIp } from '@/lib/utils.js'

export async function GET(request) {
  const session = await requireAuth(request)
  if (!session) return apiError('Unauthorized', 401)
  await connectDB()
  const halls = await Hall.find({ isActive: true }).sort({ hallType: 1, name: 1 })
  return apiSuccess({ halls })
}

export async function POST(request) {
  const session = await requireRole(request, 'admin')
  if (!session) return apiError('Forbidden', 403)
  await connectDB()
  const body = await request.json()
  const hall = await Hall.create(body)
  await audit(session.id, 'HALL_CREATED', `Hall: ${hall.name}`, getIp(request))
  return apiSuccess({ hall }, 201)
}

export async function PATCH(request) {
  const session = await requireRole(request, 'admin')
  if (!session) return apiError('Forbidden', 403)
  await connectDB()
  const { id, ...update } = await request.json()
  const hall = await Hall.findByIdAndUpdate(id, update, { new: true })
  await audit(session.id, 'HALL_UPDATED', `Hall: ${hall.name}`, getIp(request))
  return apiSuccess({ hall })
}
