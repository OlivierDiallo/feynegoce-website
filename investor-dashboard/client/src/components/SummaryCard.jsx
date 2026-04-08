import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function SummaryCard({ label, value, sub, trend, icon: Icon, accent = false, positive = false, negative = false }) {
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
  const trendColor = trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-red-500' : 'text-slate-400'

  return (
    <div className={`card p-6 ${accent ? 'bg-navy text-white' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${accent ? 'text-slate-400' : 'text-slate-500'}`}>
            {label}
          </p>
          <p className={`text-2xl font-bold tracking-tight mt-1 ${
            accent    ? 'text-white'
            : positive ? 'text-emerald-600'
            : negative ? 'text-red-500'
            : 'text-slate-900'
          }`}>
            {value}
          </p>
          {sub && (
            <p className={`text-xs mt-1 ${accent ? 'text-slate-400' : 'text-slate-500'}`}>{sub}</p>
          )}
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            accent ? 'bg-white/10' : 'bg-accent/10'
          }`}>
            <Icon size={20} className={accent ? 'text-slate-300' : 'text-accent'} />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1.5 mt-3 text-xs font-medium ${accent ? 'text-slate-400' : trendColor}`}>
          <TrendIcon size={13} />
          {Math.abs(trend).toFixed(1)}% vs last period
        </div>
      )}
    </div>
  )
}
