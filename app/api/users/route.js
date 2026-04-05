import { connectDB } from '@/lib/db.js'
import { User, Department } from '@/models/index.js'
import { requireAuth, requireRole } from '@/lib/auth.js'
import { apiError, apiSuccess, audit, getIp } from '@/lib/utils.js'
import bcrypt from 'bcryptjs'

export async function GET(request) {
  const session = await requireAuth(request)
  if (!session) return apiError('Unauthorized', 401)
  await connectDB()

  if (session.role === 'admin') {
    const users = await User.find().populate('department', 'name').sort({ role: 1, name: 1 })
    const departments = await Department.find().sort({ name: 1 })
    return apiSuccess({ users, departments })
  }

  // Faculty/HOD can only get their own profile
  const user = await User.findById(session.id).populate('department', 'name')
  return apiSuccess({ user })
}

export async function POST(request) {
  const session = await requireRole(request, 'admin')
  if (!session) return apiError('Forbidden', 403)
  await connectDB()

  const { name, email, password, role, departmentId, phone } = await request.json()
  if (!name || !email || !password || !role) return apiError('Missing required fields')
  if (password.length < 6) return apiError('Password must be at least 6 characters')

  const existing = await User.findOne({ email: email.toLowerCase() })
  if (existing) return apiError('Email already exists')

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await User.create({
    name, email: email.toLowerCase(), passwordHash, role,
    department: departmentId || undefined, phone,
  })

  await audit(session.id, 'USER_CREATED', `Created: ${email} (${role})`, getIp(request))
  return apiSuccess({ user }, 201)
}

export async function PATCH(request) {
  const session = await requireAuth(request)
  if (!session) return apiError('Unauthorized', 401)
  await connectDB()

  const { id, action, ...data } = await request.json()
  const targetId = id || session.id

  // Only admin can modify other users
  if (targetId !== session.id && session.role !== 'admin') {
    return apiError('Forbidden', 403)
  }

  if (action === 'toggle' && session.role === 'admin') {
    const user = await User.findById(targetId)
    user.isActive = !user.isActive
    await user.save()
    await audit(session.id, 'USER_TOGGLE', `Toggled user ${targetId}`, getIp(request))
    return apiSuccess({ user })
  }

  if (action === 'reset_password' && session.role === 'admin') {
    const { newPassword } = data
    if (!newPassword || newPassword.length < 6) return apiError('Password too short')
    const passwordHash = await bcrypt.hash(newPassword, 12)
    await User.findByIdAndUpdate(targetId, { passwordHash })
    await audit(session.id, 'PASSWORD_RESET', `Reset password for ${targetId}`, getIp(request))
    return apiSuccess({ success: true })
  }

  if (action === 'change_password') {
    const { oldPassword, newPassword } = data
    const user = await User.findById(session.id)
    if (!(await bcrypt.compare(oldPassword, user.passwordHash))) {
      return apiError('Current password is incorrect')
    }
    if (!newPassword || newPassword.length < 6) return apiError('New password too short')
    user.passwordHash = await bcrypt.hash(newPassword, 12)
    await user.save()
    await audit(session.id, 'PASSWORD_CHANGED', 'User changed own password', getIp(request))
    return apiSuccess({ success: true })
  }

  if (action === 'update_profile') {
    const { name, phone } = data
    if (!name) return apiError('Name is required')
    const user = await User.findByIdAndUpdate(targetId, { name, phone }, { new: true })
      .populate('department', 'name')
    return apiSuccess({ user })
  }

  return apiError('Invalid action')
}
