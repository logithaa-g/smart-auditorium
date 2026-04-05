'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Building2, Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login, user } = useAuth()
  const router = useRouter()
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPwd, setShowPwd]     = useState(false)
  const [loading, setLoading]     = useState(false)
  const [seeding, setSeeding]     = useState(false)

  useEffect(() => {
    if (user) router.push('/dashboard')
    // Auto-seed DB on first visit
    fetch('/api/seed').catch(() => {})
  }, [user])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) return toast.error('Please fill in all fields')
    setLoading(true)
    try {
      await login(email.trim(), password)
      toast.success('Welcome back!')
      router.push('/dashboard')
    } catch (err) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  function fillDemo(role) {
    const creds = {
      admin:   { email: 'admin@college.edu',   password: 'password123' },
      hod:     { email: 'hod.cse@college.edu', password: 'password123' },
      faculty: { email: 'meena@college.edu',   password: 'password123' },
    }
    setEmail(creds[role].email)
    setPassword(creds[role].password)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-xl mb-4">
              <Building2 size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Smart Booking System</h1>
            <p className="text-blue-100 text-sm mt-1">Auditorium & Seminar Hall Management</p>
          </div>

          <div className="px-8 py-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Email address</label>
                <input
                  type="email"
                  className="input"
                  placeholder="you@college.edu"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    className="input pr-10"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full justify-center py-3 text-base">
                {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            {/* Demo credentials */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs text-center text-gray-500 font-medium mb-3">
                Demo credentials — click to fill
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { role: 'admin',   label: 'Admin',   color: 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200' },
                  { role: 'hod',     label: 'HOD',     color: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200' },
                  { role: 'faculty', label: 'Faculty', color: 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200' },
                ].map(d => (
                  <button key={d.role}
                    type="button"
                    onClick={() => fillDemo(d.role)}
                    className={`py-2 rounded-lg text-xs font-medium transition-colors ${d.color}`}>
                    {d.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-center text-gray-400 mt-2">Password: <code className="bg-gray-100 px-1 rounded">password123</code></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
