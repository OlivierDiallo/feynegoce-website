import { Check, Circle } from 'lucide-react'
import { fmtDateTime, milestoneLabel } from '../utils/formatters'

const ORDER = ['departed', 'port_arrival', 'customs_cleared', 'loaded_truck', 'delivered']

export default function MilestoneTimeline({ milestones = [] }) {
  const reached = new Set(milestones.map(m => m.milestoneType))
  const byType  = Object.fromEntries(milestones.map(m => [m.milestoneType, m]))

  return (
    <ol className="relative">
      {ORDER.map((type, i) => {
        const done = reached.has(type)
        const m    = byType[type]
        const last = i === ORDER.length - 1
        return (
          <li key={type} className="flex gap-4">
            {/* Line + dot */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 z-10 ${
                done ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-400'
              }`}>
                {done ? <Check size={14} /> : <Circle size={12} />}
              </div>
              {!last && <div className={`w-0.5 flex-1 my-1 ${done ? 'bg-emerald-300' : 'bg-slate-200'}`} />}
            </div>

            {/* Content */}
            <div className={`pb-6 ${last ? 'pb-0' : ''} flex-1 min-w-0`}>
              <p className={`text-sm font-semibold ${done ? 'text-slate-900' : 'text-slate-400'}`}>
                {milestoneLabel(type)}
              </p>
              {done ? (
                <div className="mt-0.5">
                  <p className="text-xs text-slate-500">{fmtDateTime(m.occurredAt)}</p>
                  {m.notes && <p className="text-xs text-slate-600 mt-0.5 italic">"{m.notes}"</p>}
                  {m.source === 'api' && (
                    <span className="inline-block text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full mt-1">Via API</span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 mt-0.5">Pending</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
