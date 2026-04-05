'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Loader2 } from 'lucide-react'

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#7c3aed']

function KpiCard({ label, value, color }) {
  return (
    <div className={`rounded-xl p-5 text-white ${color}`}>
      <div className="text-3xl font-bold">{value ?? 0}</div>
      <div className="text-sm opacity-85 mt-1">{label}</div>
    </div>
  )
}

export default function AnalyticsPage() {
  const { user }    = useAuth()
  const router      = useRouter()
  const [data, setData]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && user.role !== 'admin') router.push('/dashboard')
    if (user) load()
  }, [user])

  async function load() {
    try {
      const res = await fetch('/api/analytics')
      if (res.ok) setData(await res.json())
    } catch {}
    finally { setLoading(false) }
  }

  if (loading || !data) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="animate-spin text-blue-500" />
    </div>
  )

  const { kpis, hallUsage, monthly, deptUsage, auditLog } = data

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard label="Total Requests" value={kpis.total}     color="bg-blue-600" />
        <KpiCard label="Approved"       value={kpis.approved}  color="bg-green-600" />
        <KpiCard label="Pending"        value={kpis.pending}   color="bg-amber-500" />
        <KpiCard label="Rejected"       value={kpis.rejected}  color="bg-red-500" />
        <KpiCard label="Cancelled"      value={kpis.cancelled} color="bg-gray-500" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Monthly trend */}
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">Monthly Booking Trend</h2>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total"    name="Total"    fill="#93c5fd" radius={[4,4,0,0]} />
                <Bar dataKey="approved" name="Approved" fill="#2563eb" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hall usage pie */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">Hall Utilisation</h2>
          </div>
          <div className="card-body flex flex-col items-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={hallUsage} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name.split(' ')[0]} ${(percent*100).toFixed(0)}%`}>
                  {hallUsage.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Department usage */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">Department Activity</h2>
          </div>
          <div className="card-body p-0">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Department</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Bookings</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Share</th>
              </tr></thead>
              <tbody>
                {deptUsage.map((d, i) => (
                  <tr key={i} className="border-t border-gray-50">
                    <td className="px-4 py-2.5">{d.name}</td>
                    <td className="px-4 py-2.5 text-right font-semibold">{d.total}</td>
                    <td className="px-4 py-2.5 w-32">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${kpis.total ? Math.round((d.total/kpis.total)*100) : 0}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit log */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">Recent Activity Log</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {auditLog.map((log, i) => (
              <div key={i} className="px-5 py-3 flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 text-xs font-semibold flex-shrink-0">
                  {log.user?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <div className="text-sm">
                    <span className="font-medium">{log.user?.name || 'System'}</span>
                    {' '}<code className="text-xs bg-gray-100 px-1 rounded">{log.action}</code>
                  </div>
                  {log.details && <p className="text-xs text-gray-400 truncate">{log.details}</p>}
                  <p className="text-xs text-gray-400">
                    {new Date(log.createdAt).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
