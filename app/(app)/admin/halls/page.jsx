'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Plus, Pencil, Power, Building2, Loader2 } from 'lucide-react'

const EMPTY = { name:'', location:'', capacity:'', hallType:'seminar_hall', amenities:'' }

export default function ManageHallsPage() {
  const { user } = useAuth()
  const router   = useRouter()
  const [halls, setHalls]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]   = useState(null) // 'add' | 'edit'
  const [form, setForm]     = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user && user.role !== 'admin') router.push('/dashboard')
    if (user) load()
  }, [user])

  async function load() {
    setLoading(true)
    const res  = await fetch('/api/halls')
    const data = await res.json()
    setHalls(data.halls || [])
    setLoading(false)
  }

  async function save(e) {
    e.preventDefault()
    if (!form.name || !form.location || !form.capacity) return toast.error('Fill all required fields')
    setSaving(true)
    try {
      const isEdit = modal === 'edit'
      const res = await fetch('/api/halls', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, capacity: Number(form.capacity) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(isEdit ? 'Hall updated!' : 'Hall added!')
      setModal(null); setForm(EMPTY); load()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  async function toggle(hall) {
    const res = await fetch('/api/halls', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: hall._id, isActive: !hall.isActive }),
    })
    if (res.ok) { toast.success('Status updated'); load() }
    else toast.error('Failed to update')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Manage Halls</h1>
        <button onClick={() => { setForm(EMPTY); setModal('add') }} className="btn btn-primary">
          <Plus size={16} /> Add Hall
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 size={28} className="animate-spin text-blue-500" /></div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {halls.map(hall => (
            <div key={hall._id} className={`card ${!hall.isActive ? 'opacity-60' : ''}`}>
              <div className="card-header">
                <div className="flex items-center gap-2">
                  <Building2 size={18} className="text-blue-500" />
                  <span className="font-semibold">{hall.name}</span>
                  <span className={`badge ${hall.hallType === 'auditorium' ? 'badge-info' : 'badge-cancelled'}`}>
                    {hall.hallType === 'auditorium' ? 'Auditorium' : 'Seminar Hall'}
                  </span>
                </div>
                <span className={`badge ${hall.isActive ? 'badge-approved' : 'badge-cancelled'}`}>
                  {hall.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="card-body pt-3 space-y-2 text-sm">
                <div className="text-gray-500">📍 {hall.location}</div>
                <div className="text-gray-500">👥 Capacity: <strong>{hall.capacity}</strong></div>
                {hall.amenities && <div className="text-gray-400 text-xs">{hall.amenities}</div>}
                <div className="flex gap-2 pt-2">
                  <button onClick={() => { setForm({ ...hall, id: hall._id }); setModal('edit') }}
                    className="btn btn-sm btn-outline flex-1 justify-center">
                    <Pencil size={14} /> Edit
                  </button>
                  <button onClick={() => toggle(hall)}
                    className={`btn btn-sm flex-1 justify-center ${hall.isActive ? 'btn-outline text-amber-600' : 'btn-outline text-green-600'}`}>
                    <Power size={14} /> {hall.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              {modal === 'add' ? 'Add New Hall' : 'Edit Hall'}
            </h3>
            <form onSubmit={save} className="space-y-3">
              <input className="input" placeholder="Hall Name *" value={form.name} onChange={e => setForm({...form, name:e.target.value})} required />
              <input className="input" placeholder="Location *" value={form.location} onChange={e => setForm({...form, location:e.target.value})} required />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" className="input" placeholder="Capacity *" value={form.capacity} onChange={e => setForm({...form, capacity:e.target.value})} required min={1} />
                <select className="select" value={form.hallType} onChange={e => setForm({...form, hallType:e.target.value})}>
                  <option value="seminar_hall">Seminar Hall</option>
                  <option value="auditorium">Auditorium</option>
                </select>
              </div>
              <textarea className="input resize-none" rows={2} placeholder="Amenities (comma separated)"
                value={form.amenities} onChange={e => setForm({...form, amenities:e.target.value})} />
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setModal(null)} className="btn btn-outline">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {modal === 'add' ? 'Add Hall' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
