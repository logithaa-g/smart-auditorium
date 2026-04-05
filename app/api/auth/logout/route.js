import { NextResponse } from 'next/server'
import { clearTokenCookie, getSession } from '@/lib/auth.js'

export async function POST() {
  const response = NextResponse.json({ success: true })
  clearTokenCookie(response)
  return response
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ user: null }, { status: 401 })
  return NextResponse.json({ user: session })
}
