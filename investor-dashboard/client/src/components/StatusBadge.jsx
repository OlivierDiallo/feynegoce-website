import { statusLabel } from '../utils/formatters'

const DOTS = {
  pending:    'bg-amber-400',
  in_transit: 'bg-blue-400',
  arrived:    'bg-emerald-400',
  completed:  'bg-slate-400',
}

export default function StatusBadge({ status, size = 'sm' }) {
  const cls = `badge-${status}`
  const dot = DOTS[status] || 'bg-slate-400'
  return (
    <span className={cls}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot} ${status === 'in_transit' ? 'animate-pulse' : ''}`} />
      {statusLabel(status)}
    </span>
  )
}
