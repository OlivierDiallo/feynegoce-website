import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts'
import { DollarSign, TrendingUp, PieChart as PieIcon, ArrowUpRight, ArrowDownRight, Download } from 'lucide-react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { fmtCurrency, fmtPct, fmtDate } from '../utils/formatters'
import StatusBadge from '../components/StatusBadge'

const COLORS = ['#2E75B6', '#1B2A4A', '#4ade80', '#fb923c', '#a78bfa']

export default function Finance() {
  const { user }   = useAuth()
  const isAdmin    = user?.role === 'admin'
  const [period, setPeriod] = useState('monthly')

  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['overview'],
    queryFn:  () => api.get('/reports/overview').then(r => r.data),
  })

  const { data: shipData, isLoading: loadingShips } = useQuery({
    queryKey: ['shipments-finance'],
    queryFn:  () => api.get('/shipments').then(r => r.data),
  })

  const { data: periodData } = useQuery({
    queryKey: ['period', period],
    queryFn:  () => api.get(`/reports/by-period?period=${period}`).then(r => r.data),
  })

  if (loadingOverview || loadingShips) return <LoadingSkeleton />

  const s           = overview?.summary || {}
  const shipments   = shipData?.shipments || []
  const stakeholders= overview?.stakeholders || []

  // Per-shipment returns for current user
  const myShipmentRows = shipments.map(sh => {
    const costOfGoods  = parseFloat(sh.costOfGoods) || 0
    const expenses     = (sh.expenses || []).reduce((a, e) => a + parseFloat(e.amount), 0)
    const totalCost    = costOfGoods + expenses
    const totalRev     = (sh.sales || []).reduce((a, s) => a + parseFloat(s.sellingPrice), 0)
    const grossProfit  = totalRev - totalCost
    const mySplit      = (sh.splits || []).find(sp => sp.userId === user?.id)
    const myPct        = mySplit ? parseFloat(mySplit.splitPct) : null
    const myPayout     = myPct !== null ? grossProfit * (myPct / 100) : null
    return { ...sh, totalCost, totalRev, grossProfit, myPct, myPayout }
  }).filter(sh => sh.myPct !== null)

  const myTotalReturn = myShipmentRows.reduce((a, r) => a + (r.myPayout || 0), 0)
  const myTotalInvested = myShipmentRows.reduce((a, r) => a + r.totalCost * ((r.myPct || 0) / 100), 0)
  const myOverallMargin = myTotalInvested > 0 ? (myTotalReturn / myTotalInvested) * 100 : 0

  // Chart data — monthly returns
  const chartData = (periodData?.data || []).slice(-10).map(d => ({
    name:    d.period.slice(5) || d.period,
    Revenue: Math.round(d.totalRev),
    Cost:    Math.round(d.totalCost),
    Profit:  Math.round(d.profit),
  }))

  // Pie chart — stakeholder breakdown (admin view)
  const pieData = stakeholders.map((sk, i) => ({
    name:  sk.name,
    value: sk.share,
    color: COLORS[i % COLORS.length],
  }))

  // Expense categories breakdown
  const categories = {}
  shipments.forEach(sh => {
    ;(sh.expenses || []).forEach(e => {
      const cat = e.category || 'other'
      categories[cat] = (categories[cat] || 0) + parseFloat(e.amount)
    })
  })
  const categoryData = Object.entries(categories).map(([name, value]) => ({ name, value: Math.round(value) }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{isAdmin ? 'Finance Overview' : 'My Returns'}</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {isAdmin ? 'Full financial view across all stakeholders' : `Your personal profit share — ${user?.name}`}
          </p>
        </div>
        {isAdmin && (
          <button className="btn-secondary text-xs" onClick={() => window.open('/api/v1/reports/export?format=csv&type=financials','_blank')}>
            <Download size={13}/> Export CSV
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {isAdmin ? (
          <>
            <SumCard label="Total Invested"  value={fmtCurrency(s.totalInvested)} icon={DollarSign} />
            <SumCard label="Total Revenue"   value={fmtCurrency(s.totalRevenue)}  icon={TrendingUp} positive />
            <SumCard label="Gross Profit"    value={fmtCurrency(s.overallProfit)} icon={TrendingUp} positive={s.overallProfit >= 0} negative={s.overallProfit < 0} />
            <SumCard label="Overall Margin"  value={fmtPct(s.overallMargin)}      icon={PieIcon} positive={s.overallMargin > 0} negative={s.overallMargin < 0} />
          </>
        ) : (
          <>
            <SumCard label="My Total Return"   value={fmtCurrency(myTotalReturn)}    icon={DollarSign} positive={myTotalReturn > 0} negative={myTotalReturn < 0} />
            <SumCard label="Capital at Work"   value={fmtCurrency(myTotalInvested)}  icon={TrendingUp} />
            <SumCard label="My Overall Margin" value={fmtPct(myOverallMargin)}        icon={PieIcon} positive={myOverallMargin > 0} negative={myOverallMargin < 0} />
            <SumCard label="Shipments Joined"  value={myShipmentRows.length}          icon={DollarSign} />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* Revenue & cost trend */}
        <div className="card p-6 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">
              {isAdmin ? 'Revenue vs Cost vs Profit' : 'My Earnings Over Time'}
            </h2>
            <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
              {['monthly','yearly'].map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${period === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2E75B6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#2E75B6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="profG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ade80" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `€${(v/1000).toFixed(0)}k`}/>
                <Tooltip formatter={v => fmtCurrency(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}/>
                <Legend iconType="circle" iconSize={8}/>
                <Area type="monotone" dataKey="Revenue" stroke="#2E75B6" fill="url(#revG)" strokeWidth={2}/>
                {isAdmin && <Area type="monotone" dataKey="Cost" stroke="#f87171" fill="none" strokeWidth={1.5} strokeDasharray="4 4"/>}
                <Area type="monotone" dataKey="Profit" stroke="#4ade80" fill="url(#profG)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>

        {/* Stakeholder pie / expense breakdown */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">
            {isAdmin ? 'Profit Distribution' : 'Expense Categories'}
          </h2>
          {isAdmin && pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color}/>)}
                  </Pie>
                  <Tooltip formatter={v => `${v}%`} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }}/>
                      <span className="text-slate-700 font-medium">{p.name}</span>
                    </div>
                    <span className="font-bold text-slate-900">{p.value}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `€${(v/1000).toFixed(0)}k`}/>
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={68} />
                <Tooltip formatter={v => fmtCurrency(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}/>
                <Bar dataKey="value" fill="#2E75B6" radius={[0, 6, 6, 0]} barSize={18}/>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>
      </div>

      {/* Admin: stakeholder table */}
      {isAdmin && stakeholders.length > 0 && (
        <div className="card overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">Stakeholder Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>{['Stakeholder','Role','Share','Revenue Share','Expense Share','Net Profit'].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
              </thead>
              <tbody>
                {stakeholders.map(sk => (
                  <tr key={sk.id} className={sk.id === user?.id ? 'bg-accent/5' : ''}>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-navy flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{sk.name[0]}</div>
                        <span className="font-semibold text-slate-900">{sk.name}</span>
                        {sk.id === user?.id && <span className="text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded-full font-semibold">You</span>}
                      </div>
                    </td>
                    <td className="table-td capitalize text-slate-500">{sk.role}</td>
                    <td className="table-td font-bold text-accent">{sk.share}%</td>
                    <td className="table-td font-medium text-emerald-600">{fmtCurrency(sk.revenue)}</td>
                    <td className="table-td text-red-400">{fmtCurrency(sk.expenses)}</td>
                    <td className="table-td font-bold">
                      <span className={sk.profit >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                        {fmtCurrency(sk.profit)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Per-shipment returns table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">
            {isAdmin ? 'All Shipments — Financial Summary' : 'My Returns per Shipment'}
          </h2>
        </div>
        {!myShipmentRows.length ? (
          <div className="p-12 text-center">
            <p className="text-slate-400 text-sm">No shipments assigned to you yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {['Reference','Product','Status','Total Cost','Revenue','Gross Profit',
                    isAdmin ? 'Margin' : 'Your Share',
                    isAdmin ? 'Margin %' : 'Your Return',
                    'ETA'].map(h => <th key={h} className="table-th whitespace-nowrap">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {myShipmentRows.map(sh => {
                  const margin = sh.totalCost > 0 ? (sh.grossProfit / sh.totalCost) * 100 : 0
                  return (
                    <tr key={sh.id} className="hover:bg-slate-50">
                      <td className="table-td font-mono text-xs font-semibold text-navy">{sh.reference}</td>
                      <td className="table-td">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-full text-xs font-medium text-slate-600">{sh.product?.name}</span>
                      </td>
                      <td className="table-td"><StatusBadge status={sh.status}/></td>
                      <td className="table-td">{fmtCurrency(sh.totalCost, sh.currency)}</td>
                      <td className="table-td text-emerald-600 font-medium">{sh.totalRev > 0 ? fmtCurrency(sh.totalRev, sh.currency) : <span className="text-slate-400">—</span>}</td>
                      <td className="table-td">
                        <div className="flex items-center gap-1">
                          {sh.grossProfit > 0
                            ? <ArrowUpRight size={13} className="text-emerald-500"/>
                            : sh.grossProfit < 0
                            ? <ArrowDownRight size={13} className="text-red-400"/>
                            : null}
                          <span className={`font-semibold ${sh.grossProfit > 0 ? 'text-emerald-600' : sh.grossProfit < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                            {sh.totalRev > 0 ? fmtCurrency(sh.grossProfit, sh.currency) : '—'}
                          </span>
                        </div>
                      </td>
                      {isAdmin ? (
                        <>
                          <td className="table-td text-sm">
                            {sh.myPct !== null ? `${sh.myPct}%` : <span className="text-slate-400">—</span>}
                          </td>
                          <td className="table-td">
                            {sh.totalRev > 0 ? (
                              <span className={`font-semibold text-sm ${margin >= parseFloat(sh.targetMarginPct) ? 'text-emerald-600' : margin >= 0 ? 'text-amber-600' : 'text-red-500'}`}>
                                {fmtPct(margin)}
                              </span>
                            ) : <span className="text-slate-400">—</span>}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="table-td font-semibold text-accent">{sh.myPct}%</td>
                          <td className="table-td font-bold">
                            {sh.myPayout !== null && sh.totalRev > 0 ? (
                              <span className={sh.myPayout >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                                {fmtCurrency(sh.myPayout, sh.currency)}
                              </span>
                            ) : <span className="text-slate-400">Pending</span>}
                          </td>
                        </>
                      )}
                      <td className="table-td text-slate-500 whitespace-nowrap">{fmtDate(sh.eta)}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50">
                  <td className="table-td font-bold text-slate-900" colSpan={3}>Total</td>
                  <td className="table-td font-bold">{fmtCurrency(myShipmentRows.reduce((a,r)=>a+r.totalCost,0))}</td>
                  <td className="table-td font-bold text-emerald-600">{fmtCurrency(myShipmentRows.reduce((a,r)=>a+r.totalRev,0))}</td>
                  <td className="table-td font-bold">
                    <span className={myShipmentRows.reduce((a,r)=>a+r.grossProfit,0) >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                      {fmtCurrency(myShipmentRows.reduce((a,r)=>a+r.grossProfit,0))}
                    </span>
                  </td>
                  <td className="table-td" colSpan={2} />
                  {!isAdmin && (
                    <td className="table-td font-bold text-emerald-600">
                      {fmtCurrency(myTotalReturn)}
                    </td>
                  )}
                  <td className="table-td" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function SumCard({ label, value, icon: Icon, positive, negative }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
          <p className={`text-2xl font-bold tracking-tight ${positive ? 'text-emerald-600' : negative ? 'text-red-500' : 'text-slate-900'}`}>{value}</p>
        </div>
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
            <Icon size={18} className="text-accent"/>
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyChart() {
  return <div className="h-[220px] flex items-center justify-center"><p className="text-slate-400 text-sm">No data yet.</p></div>
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_,i)=><div key={i} className="h-24 bg-slate-200 rounded-2xl"/>)}</div>
      <div className="grid grid-cols-3 gap-6"><div className="h-64 bg-slate-200 rounded-2xl col-span-2"/><div className="h-64 bg-slate-200 rounded-2xl"/></div>
      <div className="h-64 bg-slate-200 rounded-2xl"/>
    </div>
  )
}
