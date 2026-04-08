import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { DollarSign, TrendingUp, Package, User2 } from 'lucide-react'
import api from '../utils/api'
import SummaryCard from '../components/SummaryCard'
import StatusBadge from '../components/StatusBadge'
import { fmtCurrency, fmtPct, fmtDate } from '../utils/formatters'
import { useAuth } from '../context/AuthContext'

function PageHeader({ title, sub }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      {sub && <p className="text-slate-500 text-sm mt-0.5">{sub}</p>}
    </div>
  )
}

export default function Overview() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: overview, isLoading } = useQuery({
    queryKey: ['overview'],
    queryFn:  () => api.get('/reports/overview').then(r => r.data),
  })

  const { data: period } = useQuery({
    queryKey: ['period', 'monthly'],
    queryFn:  () => api.get('/reports/by-period?period=monthly').then(r => r.data),
  })

  if (isLoading) return <LoadingSkeleton />

  const s = overview?.summary || {}
  const chartData = (period?.data || []).slice(-8).map(d => ({
    name:    d.period.slice(5),
    Revenue: Math.round(d.totalRev),
    Cost:    Math.round(d.totalCost),
    Profit:  Math.round(d.profit),
  }))

  const prodData = (overview?.productPerformance || []).map(p => ({
    name:   p.name,
    Margin: parseFloat(p.margin.toFixed(1)),
    Revenue: Math.round(p.totalRev),
  }))

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0]} 👋`}
        sub="Here's your portfolio at a glance."
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <SummaryCard
          label="Capital Invested"
          value={fmtCurrency(s.totalInvested)}
          sub="All shipments, all costs"
          icon={DollarSign}
        />
        <SummaryCard
          label="Total Revenue"
          value={fmtCurrency(s.totalRevenue)}
          sub="From all sales"
          icon={TrendingUp}
          positive={s.totalRevenue > s.totalInvested}
        />
        <SummaryCard
          label="Overall Margin"
          value={fmtPct(s.overallMargin)}
          sub="Across completed shipments"
          icon={Package}
          positive={s.overallMargin > 0}
          negative={s.overallMargin < 0}
        />
        <SummaryCard
          label="My Returns"
          value={fmtCurrency(s.myReturns)}
          sub="Your profit share"
          icon={User2}
          accent
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* Revenue trend */}
        <div className="card p-6 xl:col-span-2">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Revenue vs Cost (Monthly)</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2E75B6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#2E75B6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.12}/>
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => fmtCurrency(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} />
                <Area type="monotone" dataKey="Revenue" stroke="#2E75B6" fill="url(#revGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="Cost"    stroke="#f87171" fill="url(#costGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No data yet — add shipments to see trends." />
          )}
        </div>

        {/* Product performance */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Margin by Product</h2>
          {prodData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={prodData} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={72} />
                <Tooltip formatter={v => `${v}%`} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="Margin" fill="#2E75B6" radius={[0, 6, 6, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No completed shipments yet." />
          )}
        </div>
      </div>

      {/* Recent shipments */}
      <div className="card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Recent Shipments</h2>
          <button onClick={() => navigate('/shipments')} className="text-sm text-accent font-medium hover:underline">View all</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {['Reference','Product','Route','Status','ETA','Value'].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(overview?.recent || []).map(s => (
                <tr
                  key={s.id}
                  className="hover:bg-slate-50 cursor-pointer"
                  onClick={() => navigate(`/shipments/${s.id}`)}
                >
                  <td className="table-td font-mono text-xs font-semibold text-slate-900">{s.reference}</td>
                  <td className="table-td">{s.product}</td>
                  <td className="table-td text-slate-500 text-xs">
                    <span>{s.origin?.split(',')[0]}</span>
                    <span className="text-slate-300 mx-1">→</span>
                    <span>{s.destination?.split(',')[0]}</span>
                  </td>
                  <td className="table-td"><StatusBadge status={s.status} /></td>
                  <td className="table-td text-slate-500">{fmtDate(s.eta)}</td>
                  <td className="table-td font-semibold text-slate-900">{fmtCurrency(s.totalCost)}</td>
                </tr>
              ))}
              {!overview?.recent?.length && (
                <tr><td colSpan={6} className="table-td text-center text-slate-400 py-10">No shipments yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function EmptyChart({ label }) {
  return (
    <div className="h-[220px] flex items-center justify-center">
      <p className="text-slate-400 text-sm text-center">{label}</p>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-200 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="h-64 bg-slate-200 rounded-2xl col-span-2" />
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </div>
      <div className="h-64 bg-slate-200 rounded-2xl" />
    </div>
  )
}
