import { marginColor } from '../utils/formatters'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function MarginIndicator({ delta, actual, target, size = 'sm' }) {
  const c    = marginColor(Number(delta))
  const Icon = delta <= 0 ? TrendingUp : delta <= 3 ? Minus : TrendingDown
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${c.bg} ${c.text} ${c.border} text-xs font-semibold`}>
      <Icon size={12} />
      {Number(actual).toFixed(1)}%
      {delta !== undefined && (
        <span className="opacity-70">
          ({delta <= 0 ? '+' : '-'}{Math.abs(Number(delta)).toFixed(1)}pp)
        </span>
      )}
    </div>
  )
}
