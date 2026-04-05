import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db.js'
import { User } from '@/models/index.js'
import { signToken, setTokenCookie } from '@/lib/auth.js'
import { audit, apiError } from '@/lib/utils.js'

export async function POST(request) {
  try {
    await connectDB()
    const { email, password } = await request.json()

    if (!email || !password) return apiError('Email and password required')

    const user = await User.findOne({ email: email.toLowerCase(), isActive: true })
      .populate('department', 'name')

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return apiError('Invalid email or password', 401)
    }

    const token = await signToken({
      id:         user._id.toString(),
      name:       user.name,
      email:      user.email,
      role:       user.role,
      department: user.department?._id?.toString(),
      deptName:   user.department?.name,
    })

    const response = NextResponse.json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    })

    setTokenCookie(response, token)
    await audit(user._id, 'LOGIN', 'Successful login')
    return response

  } catch (err) {
    console.error(err)
    return apiError('Server error', 500)
  }
}
