import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, ChevronRight } from 'lucide-react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import Modal, { FormRow } from '../components/Modal'
import { fmtCurrency, fmtDate } from '../utils/formatters'

const STATUSES = ['', 'pending', 'in_transit', 'arrived', 'completed']

export default function ShipmentsList() {
  const { user }    = useAuth()
  const navigate    = useNavigate()
  const qc          = useQueryClient()
  const [search,    setSearch]    = useState('')
  const [status,    setStatus]    = useState('')
  const [newModal,  setNewModal]  = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['shipments', { status, search }],
    queryFn:  () => {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      if (search) params.set('search', search)
      return api.get(`/shipments?${params}`).then(r => r.data)
    },
  })

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn:  () => api.get('/reports/by-product').then(r => r.data),
  })

  const create = useMutation({
    mutationFn: body => api.post('/shipments', body),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['shipments'] }); setNewModal(false) },
  })

  const shipments = data?.shipments || []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Shipments</h1>
          <p className="text-slate-500 text-sm mt-0.5">{shipments.length} shipment{shipments.length !== 1 ? 's' : ''}</p>
        </div>
        {user?.role === 'admin' && (
          <button className="btn-primary" onClick={() => setNewModal(true)}>
            <Plus size={16} /> New Shipment
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4 mb-5 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search reference, route…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <select className="input w-auto" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.filter(Boolean).map(s => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 animate-pulse">Loading shipments…</div>
        ) : !shipments.length ? (
          <div className="p-12 text-center">
            <p className="text-slate-400 text-sm">No shipments match your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {['Reference','Product','Route','Quantity','Value','Margin','Status','ETA',''].map(h => (
                    <th key={h} className="table-th whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shipments.map(s => {
                  const totalCost = parseFloat(s.costOfGoods) + (s.expenses||[]).reduce((a,e)=>a+parseFloat(e.amount),0)
                  const totalRev  = (s.sales||[]).reduce((a,sl)=>a+parseFloat(sl.sellingPrice),0)
                  const margin    = totalCost > 0 ? ((totalRev-totalCost)/totalCost*100) : null
                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50 cursor-pointer group"
                      onClick={() => navigate(`/shipments/${s.id}`)}
                    >
                      <td className="table-td font-mono text-xs font-semibold text-navy">{s.reference}</td>
                      <td className="table-td">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-full text-xs font-medium text-slate-600">{s.product?.name}</span>
                      </td>
                      <td className="table-td text-xs text-slate-500 whitespace-nowrap">
                        <span className="font-medium text-slate-700">{s.origin?.split(',')[0]}</span>
                        <span className="text-slate-300 mx-1.5">→</span>
                        <span className="font-medium text-slate-700">{s.destination?.split(',')[0]}</span>
                      </td>
                      <td className="table-td text-sm">{s.quantity?.toLocaleString()} {s.quantityUnit}</td>
                      <td className="table-td font-semibold">{fmtCurrency(totalCost, s.currency)}</td>
                      <td className="table-td">
                        {margin !== null ? (
                          <span className={`text-xs font-semibold ${margin >= parseFloat(s.targetMarginPct) ? 'text-emerald-600' : margin >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                            {margin.toFixed(1)}%
                          </span>
                        ) : <span className="text-slate-400 text-xs">—</span>}
                      </td>
                      <td className="table-td"><StatusBadge status={s.status} /></td>
                      <td className="table-td text-slate-500 whitespace-nowrap">{fmtDate(s.eta)}</td>
                      <td className="table-td">
                        <ChevronRight size={15} className="text-slate-300 group-hover:text-accent transition-colors" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New shipment modal */}
      <NewShipmentModal
        open={newModal}
        onClose={() => setNewModal(false)}
        products={products?.products || []}
        onCreate={create.mutateAsync}
        error={create.error?.response?.data?.error}
        loading={create.isPending}
      />
    </div>
  )
}

function NewShipmentModal({ open, onClose, products, onCreate, error, loading }) {
  const [form, setForm] = useState({
    reference: '', productId: '', origin: '', destination: '',
    quantity: '', quantityUnit: 'units', costOfGoods: '', currency: 'EUR',
    targetMarginPct: '', eta: '', trackingNumber: '', notes: '',
  })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    await onCreate(form)
    setForm({ reference: '', productId: '', origin: '', destination: '',
      quantity: '', quantityUnit: 'units', costOfGoods: '', currency: 'EUR',
      targetMarginPct: '', eta: '', trackingNumber: '', notes: '' })
  }

  return (
    <Modal open={open} onClose={onClose} title="New Shipment" maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <FormRow label="Reference" required><input className="input" value={form.reference} onChange={set('reference')} placeholder="FYN-2025-001" required /></FormRow>
        <FormRow label="Product" required>
          <select className="input" value={form.productId} onChange={set('productId')} required>
            <option value="">Select product</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </FormRow>
        <FormRow label="Origin" required><input className="input" value={form.origin} onChange={set('origin')} placeholder="Prague, Czech Republic" required /></FormRow>
        <FormRow label="Destination" required><input className="input" value={form.destination} onChange={set('destination')} placeholder="Dakar, Senegal" required /></FormRow>
        <FormRow label="Quantity" required>
          <div className="flex gap-2">
            <input className="input" type="number" value={form.quantity} onChange={set('quantity')} placeholder="1200" required />
            <select className="input w-28 flex-shrink-0" value={form.quantityUnit} onChange={set('quantityUnit')}>
              {['units','kg','tonnes','litres','m²'].map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
        </FormRow>
        <FormRow label="Currency"><select className="input" value={form.currency} onChange={set('currency')}><option>EUR</option><option>USD</option></select></FormRow>
        <FormRow label="Cost of Goods" required><input className="input" type="number" step="0.01" value={form.costOfGoods} onChange={set('costOfGoods')} placeholder="62400" required /></FormRow>
        <FormRow label="Target Margin %" required><input className="input" type="number" step="0.1" value={form.targetMarginPct} onChange={set('targetMarginPct')} placeholder="22" required /></FormRow>
        <FormRow label="ETA"><input className="input" type="date" value={form.eta} onChange={set('eta')} /></FormRow>
        <FormRow label="Tracking Number"><input className="input" value={form.trackingNumber} onChange={set('trackingNumber')} placeholder="MSC-TK-29847" /></FormRow>
        <div className="col-span-2">
          <FormRow label="Notes"><textarea className="input" rows={2} value={form.notes} onChange={set('notes')} placeholder="Any additional context…" /></FormRow>
        </div>
        {error && <div className="col-span-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-2">{error}</div>}
        <div className="col-span-2 flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating…' : 'Create Shipment'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
