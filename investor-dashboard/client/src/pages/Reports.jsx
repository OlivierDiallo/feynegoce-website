import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Download } from 'lucide-react'
import api from '../utils/api'
import { fmtCurrency, fmtPct } from '../utils/formatters'
import { useAuth } from '../context/AuthContext'

const PERIODS = [
  { key: 'weekly',  label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly',  label: 'Yearly' },
]

export default function Reports() {
  const { user } = useAuth()
  const [period, setPeriod] = useState('monthly')

  const { data, isLoading } = useQuery({
    queryKey: ['period', period],
    queryFn:  () => api.get(`/reports/by-period?period=${period}`).then(r => r.data),
  })

  const { data: prodData } = useQuery({
    queryKey: ['products'],
    queryFn:  () => api.get('/reports/by-product').then(r => r.data),
  })

  const chartData = (data?.data || []).slice(-12).map(d => ({
    name:    d.period,
    Revenue: Math.round(d.totalRev),
    Cost:    Math.round(d.totalCost),
    Profit:  Math.round(d.profit),
    Margin:  parseFloat(d.margin.toFixed(1)),
  }))

  const prodChart = (prodData?.products || []).map(p => ({
    name:   p.name,
    Revenue: Math.round(p.totalRev),
    Profit:  Math.round(p.profit),
    Margin:  parseFloat(p.margin.toFixed(1)),
  }))

  function download(type) {
    window.open(`/api/v1/reports/export?format=csv&type=${type}`, '_blank')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financial Reports</h1>
          <p className="text-slate-500 text-sm mt-0.5">Revenue, costs and profit breakdowns</p>
        </div>
        {user?.role === 'admin' && (
          <div className="flex gap-2">
            <button className="btn-secondary text-xs" onClick={() => download('financials')}>
              <Download size={13}/> Financials CSV
            </button>
            <button className="btn-secondary text-xs" onClick={() => download('shipments')}>
              <Download size={13}/> Shipments CSV
            </button>
          </div>
        )}
      </div>

      {/* Period toggle */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit mb-6">
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              period === p.key ? 'bg-accent text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-64 bg-slate-200 rounded-2xl" />
          <div className="h-64 bg-slate-200 rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Revenue vs Cost */}
          <div className="card p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Revenue vs Cost vs Profit</h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={v => fmtCurrency(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} />
                  <Bar dataKey="Revenue" fill="#2E75B6" radius={[4,4,0,0]} />
                  <Bar dataKey="Cost"    fill="#f87171" radius={[4,4,0,0]} />
                  <Bar dataKey="Profit"  fill="#4ade80" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>

          {/* Margin trend */}
          <div className="card p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Profit Margin Trend</h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={v => `${v}%`} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Line type="monotone" dataKey="Margin" stroke="#2E75B6" strokeWidth={2.5} dot={{ fill: '#2E75B6', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>

          {/* Product table */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">Performance by Product</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {['Product','Shipments','Revenue','Expenses','Gross Profit','Margin'].map(h => <th key={h} className="table-th">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {(prodData?.products || []).map(p => (
                    <tr key={p.id}>
                      <td className="table-td font-semibold text-slate-900">{p.name}</td>
                      <td className="table-td text-slate-500">{p.shipmentCount}</td>
                      <td className="table-td font-medium text-emerald-600">{fmtCurrency(p.totalRev)}</td>
                      <td className="table-td text-red-500">{fmtCurrency(p.totalCost)}</td>
                      <td className="table-td font-semibold">{fmtCurrency(p.profit)}</td>
                      <td className="table-td">
                        <span className={`font-semibold ${p.margin > 15 ? 'text-emerald-600' : p.margin > 0 ? 'text-amber-600' : 'text-red-500'}`}>
                          {fmtPct(p.margin)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Period table */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">Detailed Breakdown ({period})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {['Period','Shipments','Revenue','Cost','Profit','Margin'].map(h => <th key={h} className="table-th">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[...(data?.data||[])].reverse().map(d => (
                    <tr key={d.period}>
                      <td className="table-td font-mono text-xs font-semibold text-slate-700">{d.period}</td>
                      <td className="table-td text-slate-500">{d.count}</td>
                      <td className="table-td text-emerald-600 font-medium">{fmtCurrency(d.totalRev)}</td>
                      <td className="table-td text-red-400">{fmtCurrency(d.totalCost)}</td>
                      <td className="table-td font-semibold">{fmtCurrency(d.profit)}</td>
                      <td className="table-td"><span className={`font-semibold ${d.margin > 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmtPct(d.margin)}</span></td>
                    </tr>
                  ))}
                  {!data?.data?.length && <tr><td colSpan={6} className="table-td text-center text-slate-400 py-10">No data yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyChart() {
  return <div className="h-[220px] flex items-center justify-center"><p className="text-slate-400 text-sm">No data to display yet.</p></div>
}
