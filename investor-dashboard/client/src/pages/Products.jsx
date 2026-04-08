import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Package, TrendingUp, Ship, ChevronRight } from 'lucide-react'
import api from '../utils/api'
import { fmtCurrency, fmtPct } from '../utils/formatters'

export default function Products() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn:  () => api.get('/reports/by-product').then(r => r.data),
  })
  const products = data?.products || []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Products</h1>
        <p className="text-slate-500 text-sm mt-0.5">Performance metrics by product category</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-slate-200 rounded-2xl animate-pulse" />)}
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
    </div>
  )
}
