import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus, KeyRound, Trash2, Shield, User, X } from 'lucide-react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'

function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-navy">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function UserManagement() {
  const { user: me } = useAuth()
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [resetTarget, setResetTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data),
  })

  const users = data?.users || []

  // Create user
  const [form, setForm] = useState({ email: '', name: '', password: '', role: 'investor' })
  const [createErr, setCreateErr] = useState('')
  const createMut = useMutation({
    mutationFn: (data) => api.post('/users', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setShowCreate(false); setForm({ email: '', name: '', password: '', role: 'investor' }); setCreateErr('') },
    onError: (err) => setCreateErr(err.response?.data?.error || 'Failed to create user'),
  })

  // Reset password
  const [newPass, setNewPass] = useState('')
  const [resetErr, setResetErr] = useState('')
  const [resetOk, setResetOk] = useState(false)
  const resetMut = useMutation({
    mutationFn: ({ id, newPassword }) => api.put(`/users/${id}/reset-password`, { newPassword }),
    onSuccess: () => { setResetOk(true); setResetErr('') },
    onError: (err) => setResetErr(err.response?.data?.error || 'Failed to reset password'),
  })

  // Delete user
  const [deleteErr, setDeleteErr] = useState('')
  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`/users/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setDeleteTarget(null); setDeleteErr('') },
    onError: (err) => setDeleteErr(err.response?.data?.error || 'Failed to delete user'),
  })

  // Update role
  const roleMut = useMutation({
    mutationFn: ({ id, role }) => api.put(`/users/${id}`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  if (isLoading) return <div className="p-8 text-slate-500">Loading users...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">User Management</h1>
          <p className="text-slate-500 text-sm mt-1">{users.length} registered users</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <UserPlus size={16} /> New User
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase text-slate-400 tracking-wider">
              <th className="text-left p-4 font-medium">Name</th>
              <th className="text-left p-4 font-medium">Email</th>
              <th className="text-left p-4 font-medium">Role</th>
              <th className="text-left p-4 font-medium">Created</th>
              <th className="text-right p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-25">
                <td className="p-4 font-medium text-navy">
                  {u.name}
                  {u.id === me?.id && <span className="ml-2 text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-semibold">You</span>}
                </td>
                <td className="p-4 text-slate-500">{u.email}</td>
                <td className="p-4">
                  <select
                    value={u.role}
                    disabled={u.id === me?.id}
                    onChange={e => roleMut.mutate({ id: u.id, role: e.target.value })}
                    className="text-xs font-semibold rounded-lg border border-slate-200 px-2 py-1 bg-white disabled:opacity-50"
                  >
                    <option value="admin">Admin</option>
                    <option value="investor">Investor</option>
                  </select>
                </td>
                <td className="p-4 text-slate-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => { setResetTarget(u); setNewPass(''); setResetOk(false); setResetErr('') }}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-accent"
                      title="Reset password"
                    >
                      <KeyRound size={15} />
                    </button>
                    {u.id !== me?.id && (
                      <button
                        onClick={() => { setDeleteTarget(u); setDeleteErr('') }}
                        className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500"
                        title="Delete user"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New User">
        <form onSubmit={e => { e.preventDefault(); createMut.mutate(form) }} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Full Name</label>
            <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
            <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Password (min 8 chars)</label>
            <input type="password" required minLength={8} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Role</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none">
              <option value="investor">Investor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {createErr && <p className="text-red-500 text-xs">{createErr}</p>}
          <button type="submit" disabled={createMut.isPending} className="btn-primary w-full justify-center">
            {createMut.isPending ? 'Creating...' : 'Create User'}
          </button>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal open={!!resetTarget} onClose={() => setResetTarget(null)} title={`Reset password — ${resetTarget?.name}`}>
        {resetOk ? (
          <div className="text-center py-4">
            <div className="text-green-600 font-medium mb-2">Password reset successfully.</div>
            <p className="text-slate-500 text-sm">Share the new password with {resetTarget?.name} securely.</p>
            <button onClick={() => setResetTarget(null)} className="btn-primary mt-4">Done</button>
          </div>
        ) : (
          <form onSubmit={e => { e.preventDefault(); resetMut.mutate({ id: resetTarget?.id, newPassword: newPass }) }} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">New Password (min 8 chars)</label>
              <input type="password" required minLength={8} value={newPass} onChange={e => setNewPass(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none" />
            </div>
            {resetErr && <p className="text-red-500 text-xs">{resetErr}</p>}
            <button type="submit" disabled={resetMut.isPending} className="btn-primary w-full justify-center">
              {resetMut.isPending ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete User">
        <p className="text-slate-600 text-sm mb-1">Are you sure you want to delete:</p>
        <p className="font-semibold text-navy mb-4">{deleteTarget?.name} ({deleteTarget?.email})</p>
        <p className="text-xs text-red-500 mb-4">This will remove all their investor splits and audit records. This cannot be undone.</p>
        {deleteErr && <p className="text-red-500 text-xs mb-2">{deleteErr}</p>}
        <div className="flex gap-3">
          <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
          <button onClick={() => deleteMut.mutate(deleteTarget.id)} disabled={deleteMut.isPending}
            className="flex-1 px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50">
            {deleteMut.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
