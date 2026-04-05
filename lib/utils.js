import { Notification, AuditLog } from '@/models/index.js'
import { NextResponse } from 'next/server'

export function apiError(message, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function apiSuccess(data, status = 200) {
  return NextResponse.json(data, { status })
}

export async function notify(userId, message, type = 'info', bookingId = null) {
  await Notification.create({
    user: userId,
    booking: bookingId || undefined,
    message,
    type,
  })
}

export async function audit(userId, action, details = '', ip = '') {
  await AuditLog.create({ user: userId, action, details, ip })
}

export function priorityForRole(role, eventType) {
  if (role === 'admin' || eventType === 'college_event') return 3
  if (role === 'hod') return 2
  return 1
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

export function getIp(request) {
  return request.headers.get('x-forwarded-for') || 'unknown'
}