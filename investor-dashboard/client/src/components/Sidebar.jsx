import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Package, BarChart3, Calculator,
  Settings, ClipboardList, LogOut, X, Ship, TrendingUp, DollarSign, Users
} from 'lucide-react'

const NAV = [
  { to: '/',            label: 'Overview',    icon: LayoutDashboard },
  { to: '/shipments',   label: 'Shipments',   icon: Ship },
  { to: '/finance',     label: 'Finance',     icon: DollarSign },
  { to: '/products',    label: 'Products',    icon: Package },
  { to: '/reports',     label: 'Reports',     icon: TrendingUp },
  { to: '/projections', label: 'Projections', icon: Calculator },
]

const ADMIN_NAV = [
  { to: '/users', label: 'Users', icon: Users },
  { to: '/audit', label: 'Audit Log', icon: ClipboardList },
]

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
      isActive
        ? 'bg-accent text-white shadow-sm'
        : 'text-slate-300 hover:bg-white/10 hover:text-white'
    }`

  return (
    <div className="h-full bg-navy flex flex-col shadow-xl">
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
        <div>
          <div className="text-xl font-bold text-white tracking-tight">
            Feynegoce<span className="text-accent">.</span>
          </div>
          <div className="text-xs text-slate-400 font-medium mt-0.5 uppercase tracking-widest">
            {user?.role === 'admin' ? 'Admin Panel' : 'Investor Portal'}
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={linkClass}
            onClick={onClose}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <>
            <div className="pt-4 pb-2 px-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Admin</p>
            </div>
            {ADMIN_NAV.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={linkClass} onClick={onClose}>
                <Icon size={17} />
                {label}
              </NavLink>
            ))}
          </>
        )}

        <div className="pt-4 pb-2 px-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Account</p>
        </div>
        <NavLink to="/settings" className={linkClass} onClick={onClose}>
          <Settings size={17} />
          Settings
        </NavLink>
      </nav>

      {/* User chip */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/10 flex-shrink-0"
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
