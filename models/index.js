import mongoose from 'mongoose'

// ── Department ──────────────────────────────────────────────
const DepartmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
})
export const Department = mongoose.models.Department || mongoose.model('Department', DepartmentSchema)

// ── User ────────────────────────────────────────────────────
const UserSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  email:        { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role:         { type: String, enum: ['admin', 'hod', 'faculty'], required: true },
  department:   { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  phone:        String,
  isActive:     { type: Boolean, default: true },
}, { timestamps: true })

export const User = mongoose.models.User || mongoose.model('User', UserSchema)

// ── Hall ────────────────────────────────────────────────────
const HallSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  location:  { type: String, required: true },
  capacity:  { type: Number, required: true },
  hallType:  { type: String, enum: ['auditorium', 'seminar_hall'], required: true },
  amenities: String,
  isActive:  { type: Boolean, default: true },
}, { timestamps: true })

export const Hall = mongoose.models.Hall || mongoose.model('Hall', HallSchema)

// ── TimeSlot ─────────────────────────────────────────────────
const TimeSlotSchema = new mongoose.Schema({
  label:     { type: String, required: true },
  startTime: { type: String, required: true }, // "08:00"
  endTime:   { type: String, required: true }, // "09:30"
  isActive:  { type: Boolean, default: true },
  order:     { type: Number, default: 0 },
})

export const TimeSlot = mongoose.models.TimeSlot || mongoose.model('TimeSlot', TimeSlotSchema)

// ── Booking ──────────────────────────────────────────────────
const BookingSchema = new mongoose.Schema({
  hall:           { type: mongoose.Schema.Types.ObjectId, ref: 'Hall',     required: true },
  requestedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
  approvedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  slot:           { type: mongoose.Schema.Types.ObjectId, ref: 'TimeSlot', required: true },
  bookingDate:    { type: String, required: true }, // "YYYY-MM-DD"
  purpose:        { type: String, required: true },
  eventType:      {
    type: String,
    enum: ['lecture', 'seminar', 'exam', 'college_event', 'meeting', 'other'],
    default: 'lecture',
  },
  priority:       { type: Number, default: 1 }, // 1=faculty, 2=dept, 3=admin
  status:         {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending',
  },
  remarks:        String,
  overrideReason: String,
}, { timestamps: true })

// Compound index to prevent double booking at DB level
BookingSchema.index(
  { hall: 1, bookingDate: 1, slot: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'approved' },
  }
)

export const Booking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema)

// ── Notification ─────────────────────────────────────────────
const NotificationSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  message: { type: String, required: true },
  type:    { type: String, enum: ['info', 'success', 'warning', 'danger'], default: 'info' },
  isRead:  { type: Boolean, default: false },
}, { timestamps: true })

export const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema)

// ── AuditLog ─────────────────────────────────────────────────
const AuditLogSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action:  { type: String, required: true },
  details: String,
  ip:      String,
}, { timestamps: true })

export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema)
