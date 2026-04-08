import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Calculator, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react'
import api from '../utils/api'
import { fmtCurrency, fmtPct } from '../utils/formatters'

export default function Projections() {
  const [productId,   setProductId]   = useState('')
  const [investment,  setInvestment]  = useState('')
  const [currency,    setCurrency]    = useState('EUR')
  const [result,      setResult]      = useState(null)

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn:  () => api.get('/reports/by-product').then(r => r.data),
  })

  const calc = useMutation({
    mutationFn: () => api.post('/reports/projection', {
      product_id: productId,
      investment_amount: parseFloat(investment),
    }).then(r => r.data),
    onSuccess: d => setResult(d),
  })

  function handleSubmit(e) {
    e.preventDefault()
    if (!productId || !investment) return
    calc.mutate()
  }

  const CASES = [
    { key: 'bestCase',    label: 'Best Case',    icon: TrendingUp,   color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { key: 'averageCase', label: 'Average Case', icon: Minus,        color: 'text-accent',      bg: 'bg-blue-50',   border: 'border-blue-200' },
    { key: 'worstCase',   label: 'Worst Case',   icon: TrendingDown, color: 'text-amber-600',   bg: 'bg-amber-50',  border: 'border-amber-200' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Projection Calculator</h1>
        <p className="text-slate-500 text-sm mt-0.5">Estimate returns based on historical shipment margins</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Calculator form */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Calculator size={20} className="text-accent" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">Input Parameters</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Product Category</label>
              <select className="input" value={productId} onChange={e => setProductId(e.target.value)} required>
                <option value="">Select a product…</option>
                {(products?.products || []).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.completedCount} completed shipment{p.completedCount !== 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Investment Amount</label>
              <div className="flex gap-2">
                <select className="input w-24 flex-shrink-0" value={currency} onChange={e => setCurrency(e.target.value)}>
                  <option>EUR</option>
                  <option>USD</option>
                </select>
                <input
                  className="input"
                  type="number"
                  min="1"
                  step="100"
                  value={investment}
                  onChange={e => setInvestment(e.target.value)}
                  placeholder="e.g. 50000"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full justify-center py-3" disabled={calc.isPending || !productId || !investment}>
              {calc.isPending ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : <Calculator size={16} />}
              {calc.isPending ? 'Calculating…' : 'Calculate Projections'}
            </button>
          </form>

          {/* Disclaimer */}
          <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 flex gap-3">
            <AlertCircle size={15} className="text-slate-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 leading-relaxed">
              * Projections are estimates based on historical performance and do not guarantee future results. Requires a minimum of 3 completed shipments per product category.
            </p>
          </div>
        </div>

        {/* Results */}
        <div>
          {!result && !calc.isPending && (
            <div className="card p-8 flex items-center justify-center h-full">
              <div className="text-center">
                <Calculator size={32} className="text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Enter parameters and click Calculate to see projections.</p>
              </div>
            </div>
          )}

          {calc.isPending && (
            <div className="card p-8 flex items-center justify-center h-full animate-pulse">
              <p className="text-slate-400 text-sm">Analysing historical data…</p>
            </div>
          )}

          {result && result.insufficient && (
            <div className="card p-8 flex items-center justify-center h-full">
              <div className="text-center">
                <AlertCircle size={32} className="text-amber-400 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-900 mb-2">Insufficient Data</h3>
                <p className="text-slate-500 text-sm">
                  Only {result.count} completed shipment{result.count !== 1 ? 's' : ''} found for this product.
                  Projections require at least 3 completed shipments.
                </p>
              </div>
            </div>
          )}

          {result && !result.insufficient && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">Projected Returns</h2>
                <p className="text-xs text-slate-400">Based on {result.count} completed shipments</p>
              </div>

              {CASES.map(({ key, label, icon: Icon, color, bg, border }) => {
                const c = result.projections?.[key]
                if (!c) return null
                return (
                  <div key={key} className={`card p-5 border ${border} ${bg}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className={`flex items-center gap-2 mb-1 ${color}`}>
                          <Icon size={16} />
                          <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
                        </div>
                        <p className={`text-3xl font-bold ${color}`}>{fmtCurrency(c.return, currency)}</p>
                        <p className="text-sm text-slate-500 mt-1">Total return: <span className="font-semibold text-slate-700">{fmtCurrency(c.total, currency)}</span></p>
                      </div>
                      <div className={`text-right`}>
                        <p className={`text-lg font-bold ${color}`}>{fmtPct(c.pct)}</p>
                        <p className="text-xs text-slate-400">margin</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 h-1.5 bg-white/60 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${key === 'bestCase' ? 'bg-emerald-500' : key === 'averageCase' ? 'bg-accent' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min(Math.max(c.pct, 0), 60) / 60 * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}

              <p className="text-xs text-slate-400 text-center mt-2">
                * These projections are estimates only and do not constitute financial advice.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
