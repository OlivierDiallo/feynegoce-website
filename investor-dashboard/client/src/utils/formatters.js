export function fmtCurrency(amount, currency = 'EUR') {
  if (amount == null || isNaN(amount)) return '—'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency,
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(Number(amount))
}

export function fmtNumber(n) {
  if (n == null) return '—'
  return new Intl.NumberFormat('fr-FR').format(Number(n))
}

export function fmtPct(n, decimals = 1) {
  if (n == null || isNaN(n)) return '—'
  return `${Number(n).toFixed(decimals)}%`
}

export function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function fmtDateShort(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function fmtDateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function marginColor(delta) {
  // delta = target - actual (positive = below target)
  if (delta <= 0)   return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'On target' }
  if (delta <= 3)   return { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   label: 'Slightly compressed' }
  return               { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     label: 'Compressed' }
}

export function statusLabel(s) {
  return { pending: 'Pending', in_transit: 'In Transit', arrived: 'Arrived', completed: 'Completed' }[s] || s
}

export function milestoneLabel(t) {
  return { departed: 'Departed', port_arrival: 'Port Arrival', customs_cleared: 'Customs Cleared', loaded_truck: 'Loaded on Truck', delivered: 'Delivered' }[t] || t
}
