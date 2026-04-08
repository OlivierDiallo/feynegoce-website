import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Lock, Check } from 'lucide-react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'

const NOTIF_OPTIONS = [
  { key: 'new_shipment',    label: 'New shipment created',        desc: 'When a new shipment is added to the dashboard' },
  { key: 'milestone',       label: 'Shipment milestone reached',   desc: 'Departed, arrived, cleared customs, delivered, etc.' },
  { key: 'eta_update',      label: 'ETA updated',                  desc: 'When the estimated arrival date changes' },
  { key: 'new_sale',        label: 'New sale recorded',            desc: 'When revenue is logged for a shipment' },
  { key: 'financial_report', label: 'Financial report available',  desc: 'When new period reports are generated' },
]

export default function Settings() {
  const { user, setUser } = useAuth()
  const qc = useQueryClient()

  const [prefs, setPrefs] = useState(user?.notificationPrefs || {})
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState('')

  const savePrefs = useMutation({
    mutationFn: () => api.put(`/users/${user.id}/notifications`, prefs),
    onSuccess:  d => {
      qc.invalidateQueries({ queryKey: ['me'] })
      setUser(u => ({ ...u, notificationPrefs: prefs }))
    },
  })

  const changePw = useMutation({
    mutationFn: () => api.put('/auth/password', {
      currentPassword: pwForm.currentPassword,
      newPassword:     pwForm.newPassword,
    }),
    onSuccess: () => {
      setPwSuccess(true)
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' })
      setPwError('')
      setTimeout(() => setPwSuccess(false), 3000)
    },
    onError: err => setPwError(err.response?.data?.error || 'Failed to change password.'),
  })

  function togglePref(key) {
    setPrefs(p => ({ ...p, [key]: !p[key] }))
  }

  function handlePwSubmit(e) {
    e.preventDefault()
    setPwError('')
    if (pwForm.newPassword !== pwForm.confirm) {
      setPwError('New passwords do not match.')
      return
    }
    changePw.mutate()
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Notification preferences and account security</p>
      </div>

      {/* Profile */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-navy flex items-center justify-center text-white text-xl font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{user?.name}</h2>
            <p className="text-slate-500 text-sm">{user?.email}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 bg-accent/10 text-accent rounded-full text-xs font-semibold capitalize">{user?.role}</span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card overflow-hidden mb-6">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <Bell size={16} className="text-accent" />
          <h2 className="text-base font-semibold text-slate-900">Email Notifications</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {NOTIF_OPTIONS.map(opt => (
            <div key={opt.key} className="flex items-center gap-4 px-6 py-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">{opt.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
              </div>
              <button
                onClick={() => togglePref(opt.key)}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                  prefs[opt.key] !== false ? 'bg-accent' : 'bg-slate-200'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                  prefs[opt.key] !== false ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            className="btn-primary"
            onClick={() => savePrefs.mutate()}
            disabled={savePrefs.isPending}
          >
            {savePrefs.isSuccess ? <><Check size={14}/>Saved</> : 'Save Preferences'}
          </button>
        </div>
      </div>

      {/* Change password */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <Lock size={16} className="text-accent" />
          <h2 className="text-base font-semibold text-slate-900">Change Password</h2>
        </div>
        <form onSubmit={handlePwSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input type="password" className="input" value={pwForm.currentPassword}
              onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} required />
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" className="input" value={pwForm.newPassword} minLength={8}
              onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input type="password" className="input" value={pwForm.confirm}
              onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} required />
          </div>
          {pwError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-2">{pwError}</div>}
          {pwSuccess && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-2 flex items-center gap-2"><Check size={14}/>Password updated successfully.</div>}
          <button type="submit" className="btn-primary" disabled={changePw.isPending}>
            {changePw.isPending ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
