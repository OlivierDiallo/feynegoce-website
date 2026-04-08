import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Plus, Trash2, Edit2, Save, X } from 'lucide-react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import MilestoneTimeline from '../components/MilestoneTimeline'
import MarginIndicator from '../components/MarginIndicator'
import Modal, { FormRow } from '../components/Modal'
import { fmtCurrency, fmtDate, fmtPct } from '../utils/formatters'

const EXPENSE_CATS = ['shipping','customs','insurance','handling','trucking','other']
const MILESTONE_TYPES = ['departed','port_arrival','customs_cleared','loaded_truck','delivered']

export default function ShipmentDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const qc       = useQueryClient()
  const isAdmin  = user?.role === 'admin'
  const inv      = key => ({ queryKey: ['shipment', id], queryFn: () => api.get(`/shipments/${id}`).then(r => r.data) })

  const [expenseModal,  setExpenseModal]  = useState(false)
  const [saleModal,     setSaleModal]     = useState(false)
  const [splitModal,    setSplitModal]    = useState(false)
  const [milestoneModal,setMilestoneModal]= useState(false)

  const { data, isLoading } = useQuery(inv())
  const refetch = () => qc.invalidateQueries({ queryKey: ['shipment', id] })

  const addExpense = useMutation({
    mutationFn: b => api.post(`/shipments/${id}/expenses`, b),
    onSuccess: () => { refetch(); setExpenseModal(false) },
  })
  const delExpense = useMutation({
    mutationFn: eid => api.delete(`/shipments/${id}/expenses/${eid}`),
    onSuccess:  refetch,
  })
  const addSale = useMutation({
    mutationFn: b => api.post(`/shipments/${id}/sales`, b),
    onSuccess: () => { refetch(); setSaleModal(false) },
  })
  const delSale = useMutation({
    mutationFn: sid => api.delete(`/shipments/${id}/sales/${sid}`),
    onSuccess:  refetch,
  })
  const setSplits = useMutation({
    mutationFn: b => api.put(`/shipments/${id}/splits`, b),
    onSuccess: () => { refetch(); setSplitModal(false) },
  })
  const addMilestone = useMutation({
    mutationFn: b => api.post(`/shipments/${id}/milestones`, b),
    onSuccess: () => { refetch(); setMilestoneModal(false) },
  })
  const updateStatus = useMutation({
    mutationFn: status => api.put(`/shipments/${id}`, { status }),
    onSuccess:  refetch,
  })

  if (isLoading) return <div className="p-8 text-slate-400 animate-pulse">Loading…</div>

  const s = data?.shipment
  if (!s) return <div className="p-8 text-slate-500">Shipment not found.</div>

  const totalExpenses = (s.expenses||[]).reduce((a,e)=>a+parseFloat(e.amount),0)
  const totalCost     = parseFloat(s.costOfGoods) + totalExpenses
  const totalRev      = (s.sales||[]).reduce((a,sl)=>a+parseFloat(sl.sellingPrice),0)
  const grossProfit   = totalRev - totalCost
  const margin        = totalCost > 0 ? (grossProfit/totalCost)*100 : 0

  return (
    <div>
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <button onClick={() => navigate('/shipments')} className="mt-1 p-1.5 rounded-lg hover:bg-slate-200 text-slate-500">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 font-mono">{s.reference}</h1>
            <span className="px-2.5 py-0.5 bg-slate-100 rounded-full text-xs font-semibold text-slate-600">{s.product?.name}</span>
            <StatusBadge status={s.status} />
          </div>
          <p className="text-slate-500 text-sm mt-1">{s.origin} → {s.destination} · ETA {fmtDate(s.eta)}</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2 flex-shrink-0">
            {['pending','in_transit','arrived','completed']
              .filter(st => st !== s.status)
              .slice(0,1)
              .map(st => (
                <button key={st} className="btn-secondary text-xs" onClick={() => updateStatus.mutate(st)}>
                  → Mark as {st.replace('_',' ')}
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="card p-4">
          <p className="label">Total Cost</p>
          <p className="text-xl font-bold text-slate-900">{fmtCurrency(totalCost, s.currency)}</p>
        </div>
        <div className="card p-4">
          <p className="label">Total Revenue</p>
          <p className={`text-xl font-bold ${totalRev > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>{fmtCurrency(totalRev, s.currency)}</p>
        </div>
        <div className="card p-4">
          <p className="label">Gross Profit</p>
          <p className={`text-xl font-bold ${grossProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmtCurrency(grossProfit, s.currency)}</p>
        </div>
        <div className="card p-4">
          <p className="label">Actual Margin</p>
          <p className={`text-xl font-bold ${margin >= parseFloat(s.targetMarginPct) ? 'text-emerald-600' : margin >= 0 ? 'text-amber-600' : 'text-red-500'}`}>{fmtPct(margin)} <span className="text-sm text-slate-400 font-normal">target {fmtPct(s.targetMarginPct)}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="xl:col-span-2 space-y-6">
          {/* Costs */}
          <Section title="Cost Breakdown" action={isAdmin && <button className="btn-secondary text-xs" onClick={() => setExpenseModal(true)}><Plus size={12}/>Add Expense</button>}>
            <table className="w-full">
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-2.5 text-sm font-medium text-slate-700">Cost of goods</td>
                  <td className="py-2.5 text-sm text-slate-500 capitalize">goods</td>
                  <td className="py-2.5 text-sm font-semibold text-right text-slate-900">{fmtCurrency(s.costOfGoods, s.currency)}</td>
                  <td className="w-8" />
                </tr>
                {(s.expenses||[]).map(e => (
                  <tr key={e.id} className="border-b border-slate-50 group">
                    <td className="py-2.5 text-sm text-slate-700">{e.description || e.category}</td>
                    <td className="py-2.5 text-xs text-slate-400 capitalize">{e.category}</td>
                    <td className="py-2.5 text-sm font-medium text-right text-slate-700">{fmtCurrency(e.amount, s.currency)}</td>
                    <td className="py-2.5 w-8 text-right">
                      {isAdmin && <button onClick={() => delExpense.mutate(e.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={13}/></button>}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50">
                  <td className="py-3 text-sm font-bold text-slate-900">Total Cost</td>
                  <td />
                  <td className="py-3 text-sm font-bold text-right text-slate-900">{fmtCurrency(totalCost, s.currency)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </Section>

          {/* Sales */}
          <Section title="Sales" action={isAdmin && <button className="btn-secondary text-xs" onClick={() => setSaleModal(true)}><Plus size={12}/>Record Sale</button>}>
            {!(s.sales||[]).length ? (
              <p className="text-slate-400 text-sm py-4 text-center">No sales recorded yet.</p>
            ) : (
              <>
                {/* Margin compression summary */}
                {s.sales.length > 0 && (
                  <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-xl text-sm">
                    <span className="text-slate-600">Average margin compression:</span>
                    <span className={`font-semibold ${parseFloat(s.sales.reduce((a,sl)=>a+parseFloat(sl.marginDelta),0)/s.sales.length) > 3 ? 'text-red-600' : parseFloat(s.sales.reduce((a,sl)=>a+parseFloat(sl.marginDelta),0)/s.sales.length) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {(s.sales.reduce((a,sl)=>a+parseFloat(sl.marginDelta),0)/s.sales.length).toFixed(1)}pp vs target
                    </span>
                  </div>
                )}
                <table className="w-full">
                  <thead>
                    <tr>
                      {['Customer','Qty','Revenue','Margin','Delta',''].map(h => (
                        <th key={h} className="table-th text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(s.sales||[]).map(sl => (
                      <tr key={sl.id} className="group border-t border-slate-50">
                        <td className="table-td font-medium">{sl.customerName}</td>
                        <td className="table-td text-slate-500">{sl.quantitySold.toLocaleString()}</td>
                        <td className="table-td font-semibold text-emerald-600">{fmtCurrency(sl.sellingPrice, s.currency)}</td>
                        <td className="table-td"><MarginIndicator actual={sl.actualMarginPct} delta={sl.marginDelta} /></td>
                        <td className="table-td text-xs text-slate-500">target {fmtPct(s.targetMarginPct)}</td>
                        <td className="table-td w-8 text-right">
                          {isAdmin && <button onClick={() => delSale.mutate(sl.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={13}/></button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="border-t border-slate-100 pt-3 flex justify-end">
                  <div className="text-right">
                    <p className="text-xs text-slate-500 mb-0.5">Total Revenue</p>
                    <p className="text-lg font-bold text-emerald-600">{fmtCurrency(totalRev, s.currency)}</p>
                  </div>
                </div>
              </>
            )}
          </Section>

          {/* Profit distribution */}
          <Section title="Profit Distribution" action={isAdmin && <button className="btn-secondary text-xs" onClick={() => setSplitModal(true)}><Edit2 size={12}/>Edit Splits</button>}>
            {!(s.splits||[]).length ? (
              <p className="text-slate-400 text-sm py-4 text-center">No investor splits configured.</p>
            ) : (
              <div className="space-y-3">
                {(s.splits||[]).map(sp => {
                  const payout = grossProfit * (parseFloat(sp.splitPct)/100)
                  return (
                    <div key={sp.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {sp.user?.name?.[0]}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900">{sp.user?.name}</p>
                        <p className="text-xs text-slate-500">{sp.user?.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">{parseFloat(sp.splitPct).toFixed(0)}%</p>
                        <p className={`text-xs font-semibold ${payout >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmtCurrency(payout, s.currency)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Section>
        </div>

        {/* Right column — Timeline */}
        <div className="space-y-6">
          <Section title="Logistics Timeline" action={isAdmin && <button className="btn-secondary text-xs" onClick={() => setMilestoneModal(true)}><Plus size={12}/>Add Milestone</button>}>
            <MilestoneTimeline milestones={s.milestones || []} />
          </Section>

          {s.notes && (
            <Section title="Notes">
              <p className="text-sm text-slate-600 leading-relaxed">{s.notes}</p>
            </Section>
          )}

          {s.trackingNumber && (
            <Section title="Tracking">
              <p className="text-sm font-mono text-slate-700 bg-slate-50 px-3 py-2 rounded-lg">{s.trackingNumber}</p>
            </Section>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddExpenseModal open={expenseModal} onClose={() => setExpenseModal(false)} onSave={addExpense.mutateAsync} loading={addExpense.isPending} />
      <AddSaleModal open={saleModal} onClose={() => setSaleModal(false)} onSave={addSale.mutateAsync} loading={addSale.isPending} />
      <EditSplitsModal open={splitModal} onClose={() => setSplitModal(false)} onSave={setSplits.mutateAsync} splits={s.splits||[]} loading={setSplits.isPending} />
      <AddMilestoneModal open={milestoneModal} onClose={() => setMilestoneModal(false)} onSave={addMilestone.mutateAsync} loading={addMilestone.isPending} />
    </div>
  )
}

function Section({ title, action, children }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {action}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

function AddExpenseModal({ open, onClose, onSave, loading }) {
  const [form, setForm] = useState({ category: 'shipping', description: '', amount: '' })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  async function handle(e) { e.preventDefault(); await onSave(form) }
  return (
    <Modal open={open} onClose={onClose} title="Add Expense">
      <form onSubmit={handle} className="space-y-4">
        <FormRow label="Category" required>
          <select className="input" value={form.category} onChange={set('category')}>
            {EXPENSE_CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </FormRow>
        <FormRow label="Description"><input className="input" value={form.description} onChange={set('description')} placeholder="e.g. Ocean freight MSC" /></FormRow>
        <FormRow label="Amount (EUR)" required><input className="input" type="number" step="0.01" value={form.amount} onChange={set('amount')} placeholder="3800" required /></FormRow>
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Add Expense'}</button>
        </div>
      </form>
    </Modal>
  )
}

function AddSaleModal({ open, onClose, onSave, loading }) {
  const [form, setForm] = useState({ customerName: '', quantitySold: '', sellingPrice: '' })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  async function handle(e) { e.preventDefault(); await onSave(form) }
  return (
    <Modal open={open} onClose={onClose} title="Record Sale">
      <form onSubmit={handle} className="space-y-4">
        <FormRow label="Customer Name" required><input className="input" value={form.customerName} onChange={set('customerName')} placeholder="e.g. Dakar Auto Parts" required /></FormRow>
        <FormRow label="Quantity Sold" required><input className="input" type="number" value={form.quantitySold} onChange={set('quantitySold')} placeholder="500" required /></FormRow>
        <FormRow label="Selling Price (EUR)" required><input className="input" type="number" step="0.01" value={form.sellingPrice} onChange={set('sellingPrice')} placeholder="28500" required /></FormRow>
        <p className="text-xs text-slate-500">Actual margin % and delta will be calculated automatically.</p>
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Record Sale'}</button>
        </div>
      </form>
    </Modal>
  )
}

function EditSplitsModal({ open, onClose, onSave, splits, loading }) {
  const [rows, setRows] = useState(splits.map(s => ({ userId: s.userId, name: s.user?.name, splitPct: String(parseFloat(s.splitPct)) })))
  const total = rows.reduce((a,r) => a + (parseFloat(r.splitPct)||0), 0)
  const update = (i, val) => setRows(rs => rs.map((r,j) => j === i ? { ...r, splitPct: val } : r))
  async function handle(e) {
    e.preventDefault()
    await onSave({ splits: rows.map(r => ({ userId: r.userId, splitPct: parseFloat(r.splitPct) })) })
  }
  return (
    <Modal open={open} onClose={onClose} title="Edit Investor Splits">
      <form onSubmit={handle} className="space-y-4">
        {rows.map((r, i) => (
          <div key={r.userId} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{r.name?.[0]}</div>
            <p className="flex-1 text-sm font-medium text-slate-800">{r.name}</p>
            <div className="flex items-center gap-1">
              <input className="input w-20 text-right" type="number" step="0.1" min="0" max="100" value={r.splitPct} onChange={e => update(i, e.target.value)} required />
              <span className="text-slate-500 text-sm">%</span>
            </div>
          </div>
        ))}
        <div className={`text-sm font-semibold text-right ${Math.abs(total-100) < 0.01 ? 'text-emerald-600' : 'text-red-500'}`}>
          Total: {total.toFixed(1)}% {Math.abs(total-100) < 0.01 ? '✓' : '(must equal 100%)'}
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading || Math.abs(total-100) > 0.01}>{loading ? 'Saving…' : 'Save Splits'}</button>
        </div>
      </form>
    </Modal>
  )
}

function AddMilestoneModal({ open, onClose, onSave, loading }) {
  const [form, setForm] = useState({ milestoneType: 'departed', occurredAt: '', notes: '' })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  async function handle(e) { e.preventDefault(); await onSave(form) }
  return (
    <Modal open={open} onClose={onClose} title="Add Milestone">
      <form onSubmit={handle} className="space-y-4">
        <FormRow label="Milestone" required>
          <select className="input" value={form.milestoneType} onChange={set('milestoneType')}>
            {MILESTONE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
          </select>
        </FormRow>
        <FormRow label="Date & Time" required><input className="input" type="datetime-local" value={form.occurredAt} onChange={set('occurredAt')} required /></FormRow>
        <FormRow label="Notes"><input className="input" value={form.notes} onChange={set('notes')} placeholder="Optional details…" /></FormRow>
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Add Milestone'}</button>
        </div>
      </form>
    </Modal>
  )
}
