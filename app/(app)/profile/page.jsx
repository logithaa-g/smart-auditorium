'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import toast from 'react-hot-toast'
import { Loader2, User, Lock } from 'lucide-react'

export default function ProfilePage() {
  const { user, refetch } = useAuth()
  const [profile, setProfile] = useState(null)
  const [name, setName]       = useState('')
  const [phone, setPhone]     = useState('')
  const [saving, setSaving]   = useState(false)

  const [oldPwd, setOldPwd]   = useState('')
  const [newPwd, setNewPwd]   = useState('')
  const [confPwd, setConfPwd] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)

  useEffect(() => { if (user) loadProfile() }, [user])

  async function loadProfile() {
    const res = await fetch('/api/users')
    const data = await res.json()
    const u = data.user || data.users?.find(u => u._id === user?.id)
    if (u) { setProfile(u); setName(u.name); setPhone(u.phone || '') }
  }

  async function saveProfile(e) {
    e.preventDefault()
    if (!name.trim()) return toast.error('Name is required')
    setSaving(true)
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_profile', name, phone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Profile updated!')
      await refetch()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  async function changePassword(e) {
    e.preventDefault()
    if (newPwd !== confPwd) return toast.error('Passwords do not match')
    if (newPwd.length < 6)  return toast.error('Password must be at least 6 characters')
    setPwdSaving(true)
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change_password', oldPassword: oldPwd, newPassword: newPwd }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Password changed!')
      setOldPwd(''); setNewPwd(''); setConfPwd('')
    } catch (err) { toast.error(err.message) }
    finally { setPwdSaving(false) }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

      {/* Profile info */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2"><User size={18} /> Profile Information</h2>
        </div>
        <div className="card-body">
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name</label>
                <input className="input" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div>
                <label className="label">Email <span className="text-gray-400 text-xs">(read-only)</span></label>
                <input className="input" value={user?.email || ''} disabled />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div>
                <label className="label">Role</label>
                <input className="input" value={user?.role?.toUpperCase() || ''} disabled />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="btn btn-primary">
                {saving && <Loader2 size={14} className="animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Change password */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Lock size={18} /> Change Password</h2>
        </div>
        <div className="card-body">
          <form onSubmit={changePassword} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Current Password</label>
                <input type="password" className="input" value={oldPwd} onChange={e => setOldPwd(e.target.value)} required />
              </div>
              <div>
                <label className="label">New Password</label>
                <input type="password" className="input" value={newPwd} onChange={e => setNewPwd(e.target.value)} minLength={6} required />
              </div>
              <div>
                <label className="label">Confirm New</label>
                <input type="password" className="input" value={confPwd} onChange={e => setConfPwd(e.target.value)} minLength={6} required />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={pwdSaving} className="btn btn-warning">
                {pwdSaving && <Loader2 size={14} className="animate-spin" />}
                Change Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
