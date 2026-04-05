// lib/seed.js
// Run once to populate the database with initial data
// Called automatically on first visit via /api/seed

import { connectDB } from './db.js'
import { Department, User, Hall, TimeSlot } from '@/models/index.js'
import bcrypt from 'bcryptjs'

export async function seedDatabase() {
  await connectDB()

  // Check if already seeded
  const existingUser = await User.findOne({ email: 'admin@college.edu' })
  if (existingUser) return { alreadySeeded: true }

  // Departments
  const depts = await Department.insertMany([
    { name: 'Computer Science Engineering' },
    { name: 'Electronics & Communication Engineering' },
    { name: 'Information Science and Engineering' },
    { name: 'Artificial Intelligence & Machine Learning' },
    { name: 'Artificial Intelligence and Data Science ' },
    { name: 'Electrical and Electronics Engineering ' },
    { name: 'MBA' },
    
    
  ])

  const cse  = depts[0]._id
  const ece  = depts[1]._id
  const admin_dept = depts[6]._id

  // Users
  const hash = await bcrypt.hash('password123', 12)
  await User.insertMany([
    { name: 'System Admin',   email: 'admin@college.edu',   passwordHash: hash, role: 'admin',   department: admin_dept },
    { name: 'Dr. Ramesh HOD', email: 'hod.cse@college.edu', passwordHash: hash, role: 'hod',     department: cse },
    { name: 'Prof. Meena',    email: 'meena@college.edu',   passwordHash: hash, role: 'faculty', department: cse },
    { name: 'Prof. Suresh',   email: 'suresh@college.edu',  passwordHash: hash, role: 'faculty', department: ece },
  ])

  // Halls
  await Hall.insertMany([
    { name: 'Auditorium',       location: 'A Block, 1st Floor',        capacity: 500, hallType: 'auditorium',   amenities: 'Projector, Mic system, AC, Stage lighting, Green room' },
    { name: 'Seminar Hall A',   location: 'A Block, 2nd Floor',        capacity: 80,  hallType: 'seminar_hall', amenities: 'Projector, Whiteboard, AC, Podium' },
    { name: 'Seminar Hall MBA', location: 'D Block, MBA Ground Floor', capacity: 60,  hallType: 'seminar_hall', amenities: 'Projector, Whiteboard, AC, Podium' },
    { name: 'Seminar Hall AIDS',location: 'D Block, AIDS Ground Floor',capacity: 60,  hallType: 'seminar_hall', amenities: 'Projector, Whiteboard, AC, Podium' },
  ])

  // Time Slots
  await TimeSlot.insertMany([
  { label: 'Slot 1 (09:00 – 11:00)', startTime: '09:00', endTime: '11:00', order: 1 },
  { label: 'Slot 2 (11:00 – 13:00)', startTime: '11:00', endTime: '13:00', order: 2 },
  { label: 'Slot 3 (14:00 – 16:00)', startTime: '14:00', endTime: '16:00', order: 3 },
])

  return { seeded: true }
}
