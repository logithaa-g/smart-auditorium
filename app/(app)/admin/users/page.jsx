'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { UserPlus, KeyRound, Power, Loader2 } from 'lucide-react'

export default function ManageUsersPage() {
  const { user }  = useAuth()
  const router    = useRouter()
  const [users, setUsers]   = useState([])
  const [depts, setDepts]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]   = useState(null) // 'add' | 'reset'
  const [target, setTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({ name:'', email:'', password:'', role:'faculty', departmentId:'', phone:'' })
  const [newPwd, setNewPwd] = useState('')

  useEffect(() => {
    if (user && user.role !== 'admin') router.push('/dashboard')
    if (user) load()
  }, [user])

  async function load() {
    setLoading(true)
    const res  = await fetch('/api/users')
    const data = await res.json()
    setUsers(data.users || [])
    setDepts(data.departments || [])
    setLoading(false)
  }

  async function addUser(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('User created!')
      setModal(null)
      setForm({ name:'', email:'', password:'', role:'faculty', departmentId:'', phone:'' })
      load()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  async function toggleUser(id) {
    const res  = await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'toggle' }),
    })
    const data = await res.json()
    if (!res.ok) return toast.error(data.error)
    toast.success('Status updated')
    load()
  }

  async function resetPassword(e) {
    e.preventDefault()
    if (!newPwd || newPwd.length < 6) return toast.error('Min 6 characters')
    setSaving(true)
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: target._id, action: 'reset_password', newPassword: newPwd }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Password reset!')
      setModal(null); setNewPwd('')
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const roleColor = { admin: 'bg-red-100 text-red-700', hod: 'bg-amber-100 text-amber-700', faculty: 'bg-gray-100 text-gray-600' }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
        <button onClick={() => setModal('add')} className="btn btn-primary">
          <UserPlus size={16} /> Add User
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={28} className="animate-spin text-blue-500" /></div>
        ) : (
          <div className="table-wrapper rounded-xl border-0">
            <table>
              <thead><tr>
                <th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td className="font-medium">{u.name}</td>
                    <td className="text-gray-500 text-xs">{u.email}</td>
                    <td><span className={`badge ${roleColor[u.role]}`}>{u.role?.toUpperCase()}</span></td>
                    <td className="text-gray-500 text-xs">{u.department?.name || '—'}</td>
                    <td>
                      <span className={`badge ${u.isActive ? 'badge-approved' : 'badge-cancelled'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => toggleUser(u._id)}
                          className={`btn btn-sm ${u.isActive ? 'btn-outline text-amber-600' : 'btn-outline text-green-600'}`}
                          title={u.isActive ? 'Deactivate' : 'Activate'}>
                          <Power size={14} />
                        </button>
                        <button onClick={() => { setTarget(u); setModal('reset') }}
                          className="btn btn-sm btn-outline" title="Reset Password">
                          <KeyRound size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add user modal */}
      {modal === 'add' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><UserPlus size={18} /> Add New User</h3>
            <form onSubmit={addUser} className="space-y-3">
              <input className="input" placeholder="Full Name *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              <input type="email" className="input" placeholder="Email *" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
              <div className="grid grid-cols-2 gap-3">
                <select className="select" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                  <option value="faculty">Faculty</option>
                  <option value="hod">HOD</option>
                  <option value="admin">Admin</option>
                </select>
                <select className="select" value={form.departmentId} onChange={e => setForm({...form, departmentId: e.target.value})}>
                  <option value="">— Department —</option>
                  {depts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
              <input className="input" placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              <input type="password" className="input" placeholder="Password * (min 6 chars)" value={form.password} onChange={e => setForm({...form, password: e.target.value})} minLength={6} required />
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setModal(null)} className="btn btn-outline">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving && <Loader2 size={14} className="animate-spin" />} Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset password modal */}
      {modal === 'reset' && target && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2"><KeyRound size={18} /> Reset Password</h3>
            <p className="text-sm text-gray-500 mb-4">For: <strong>{target.name}</strong></p>
            <form onSubmit={resetPassword} className="space-y-3">
              <input type="password" className="input" placeholder="New Password (min 6 chars)"
                value={newPwd} onChange={e => setNewPwd(e.target.value)} minLength={6} required />
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setModal(null)} className="btn btn-outline">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-warning">
                  {saving && <Loader2 size={14} className="animate-spin" />} Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
