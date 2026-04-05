import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-change-me')
const COOKIE_NAME = 'sabs_token'  // Smart Auditorium Booking System

export async function signToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET)
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload
  } catch {
    return null
  }
}

export async function getSession() {
  const cookieStore = cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return await verifyToken(token)
}

export function setTokenCookie(res, token) {
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

export function clearTokenCookie(res) {
  res.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' })
}

// Middleware helper — used in API routes
export async function requireAuth(request) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return await verifyToken(token)
}

export async function requireRole(request, ...roles) {
  const session = await requireAuth(request)
  if (!session) return null
  if (!roles.includes(session.role)) return null
  return session
}
