import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Package, ChevronRight, Plus } from 'lucide-react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import Modal, { FormRow } from '../components/Modal'
import { fmtCurrency, fmtPct } from '../utils/formatters'

export default function Products() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc       = useQueryClient()
  const [newOpen, setNewOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn:  () => api.get('/reports/by-product').then(r => r.data),
  })
  const products = data?.products || []

  const create = useMutation({
    mutationFn: body => api.post('/products', body).then(r => r.data),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      setNewOpen(false)
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-slate-500 text-sm mt-0.5">Performance metrics by product category</p>
        </div>
        {user?.role === 'admin' && (
          <button className="btn-primary" onClick={() => setNewOpen(true)}>
            <Plus size={16} /> New Product
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-slate-200 rounded-2xl animate-pulse" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-accent/10 flex items-center justify-center mb-3">
            <Package size={22} className="text-accent" />
          </div>
          <p className="text-slate-700 font-semibold">No products yet</p>
          <p className="text-slate-400 text-sm mt-1">
            {user?.role === 'admin'
              ? 'Create your first product category to start tracking shipments.'
              : 'An admin needs to create product categories first.'}
          </p>
          {user?.role === 'admin' && (
            <button className="btn-primary mt-5 mx-auto" onClick={() => setNewOpen(true)}>
              <Plus size={16} /> New Product
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {products.map(p => (
            <button
              key={p.id}
              onClick={() => navigate(`/shipments?product=${p.id}`)}
              className="card p-6 text-left hover:shadow-card-hover transition-shadow group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Package size={20} className="text-accent" />
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-accent transition-colors" />
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-0.5">{p.name}</h3>
              <p className="text-xs text-slate-500 mb-5 line-clamp-2">{p.description || 'No description.'}</p>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5 uppercase tracking-wide font-medium">Shipments</p>
                  <p className="text-xl font-bold text-slate-900">{p.shipmentCount}</p>
                  <p className="text-xs text-slate-400">{p.completedCount} completed</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5 uppercase tracking-wide font-medium">Revenue</p>
                  <p className="text-sm font-bold text-emerald-600">{fmtCurrency(p.totalRev)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5 uppercase tracking-wide font-medium">Avg Margin</p>
                  <p className={`text-sm font-bold ${p.margin > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {p.shipmentCount > 0 ? fmtPct(p.margin) : '—'}
                  </p>
                </div>
              </div>

              {/* Margin bar */}
              {p.shipmentCount > 0 && (
                <div className="mt-4">
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${p.margin > 20 ? 'bg-emerald-400' : p.margin > 10 ? 'bg-amber-400' : 'bg-slate-300'}`}
                      style={{ width: `${Math.min(Math.max(p.margin, 0), 50) * 2}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Gross profit: {fmtCurrency(p.profit)}</p>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      <NewProductModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreate={create.mutateAsync}
        error={create.error?.response?.data?.error}
        loading={create.isPending}
      />
    </div>
  )
}

function NewProductModal({ open, onClose, onCreate, error, loading }) {
  const [form, setForm] = useState({ name: '', description: '' })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      await onCreate(form)
      setForm({ name: '', description: '' })
    } catch { /* error surfaced via prop */ }
  }

  return (
    <Modal open={open} onClose={onClose} title="New Product">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormRow label="Name" required>
          <input className="input" value={form.name} onChange={set('name')} placeholder="Tires" required />
        </FormRow>
        <FormRow label="Description">
          <textarea className="input" rows={3} value={form.description} onChange={set('description')} placeholder="Short description of the product category…" />
        </FormRow>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-2">{error}</div>}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating…' : 'Create Product'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
