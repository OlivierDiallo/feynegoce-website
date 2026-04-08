import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, Filter } from 'lucide-react'
import api from '../utils/api'
import { fmtDateTime } from '../utils/formatters'

const ENTITY_TYPES = ['','shipment','expense','sale','splits','milestone']
const ACTION_COLORS = {
  create: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  update: 'bg-blue-50 text-blue-700 border-blue-200',
  delete: 'bg-red-50 text-red-700 border-red-200',
}

export default function AuditLog() {
  const [entityType, setEntityType] = useState('')
  const [from, setFrom] = useState('')
  const [to,   setTo]   = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['audit', entityType, from, to],
    queryFn:  () => {
      const params = new URLSearchParams()
      if (entityType) params.set('entity_type', entityType)
      if (from) params.set('from', from)
      if (to)   params.set('to', to)
      return api.get(`/audit-log?${params}`).then(r => r.data)
    },
  })

  const logs = data?.logs || []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
          <p className="text-slate-500 text-sm mt-0.5">{logs.length} entries — all admin actions</p>
        </div>
        <button className="btn-secondary text-xs" onClick={() => window.open('/api/v1/reports/export?format=csv&type=audit','_blank')}>
          <Download size={13}/> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-5 flex gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <select className="input w-auto" value={entityType} onChange={e => setEntityType(e.target.value)}>
            <option value="">All entity types</option>
            {ENTITY_TYPES.filter(Boolean).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-medium">From</label>
          <input type="date" className="input w-auto" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-medium">To</label>
          <input type="date" className="input w-auto" value={to} onChange={e => setTo(e.target.value)} />
        </div>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 animate-pulse">Loading audit log…</div>
        ) : !logs.length ? (
          <div className="p-12 text-center"><p className="text-slate-400 text-sm">No audit records found.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {['Timestamp','User','Action','Entity','Entity ID','Changes'].map(h => <th key={h} className="table-th">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="table-td text-xs text-slate-500 whitespace-nowrap">{fmtDateTime(l.timestamp)}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-navy flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {l.user?.name?.[0]}
                        </div>
                        <span className="text-sm font-medium text-slate-700">{l.user?.name}</span>
                      </div>
                    </td>
                    <td className="table-td">
                      <span className={`badge border text-xs ${ACTION_COLORS[l.action] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                        {l.action}
                      </span>
                    </td>
                    <td className="table-td text-xs text-slate-500 capitalize">{l.entityType}</td>
                    <td className="table-td font-mono text-xs text-slate-400 truncate max-w-[100px]">{l.entityId}</td>
                    <td className="table-td">
                      {l.newValues && (
                        <details className="cursor-pointer">
                          <summary className="text-xs text-accent font-medium">View changes</summary>
                          <div className="mt-2 space-y-1">
                            {l.oldValues && (
                              <pre className="text-xs bg-red-50 text-red-700 p-2 rounded-lg overflow-auto max-w-xs">
                                {JSON.stringify(l.oldValues, null, 2)}
                              </pre>
                            )}
                            <pre className="text-xs bg-emerald-50 text-emerald-700 p-2 rounded-lg overflow-auto max-w-xs">
                              {JSON.stringify(l.newValues, null, 2)}
                            </pre>
                          </div>
                        </details>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
