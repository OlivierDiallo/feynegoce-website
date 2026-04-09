import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Lock, CheckCircle2, AlertTriangle } from 'lucide-react'
import api from '../utils/api'

/**
 * Single page that handles BOTH:
 *   - Password reset (purpose === 'reset')
 *   - First-time invite setup (purpose === 'invite')
 *
 * Mounted at /reset-password/:token AND /setup-password/:token.
 */
export default function SetPassword({ defaultPurpose = 'reset' }) {
  const { token } = useParams()
  const navigate  = useNavigate()
  const [status, setStatus] = useState('verifying') // verifying | ready | invalid | done
  const [info, setInfo]     = useState(null)        // { email, name, purpose }
  const [pw, setPw]         = useState('')
  const [pw2, setPw2]       = useState('')
  const [err, setErr]       = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let alive = true
    api.get(`/auth/verify-token/${token}`)
      .then(r => { if (alive) { setInfo(r.data); setStatus('ready') } })
      .catch(_e => { if (alive) setStatus('invalid') })
    return () => { alive = false }
  }, [token])

  async function handleSubmit(e) {
    e.preventDefault()
    setErr('')
    if (pw.length < 8)   return setErr('Password must be at least 8 characters.')
    if (pw !== pw2)      return setErr('Passwords do not match.')
    setSubmitting(true)
    try {
      await api.post('/auth/reset-password', { token, password: pw })
      setStatus('done')
      setTimeout(() => navigate('/login'), 2500)
    } catch (e2) {
      setErr(e2.response?.data?.error || 'Failed to set password.')
    }
    setSubmitting(false)
  }

  const purpose   = info?.purpose || defaultPurpose
  const isInvite  = purpose === 'invite'
  const titleSet  = isInvite ? 'Activate your account' : 'Reset your password'
  const subSet    = isInvite
    ? 'Welcome to Feynegoce. Choose a password to finish setting up your investor dashboard access.'
    : 'Choose a new password for your investor dashboard account.'

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Feynegoce<span className="text-accent">.</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2">Investor Dashboard</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {status === 'verifying' && (
            <div className="py-8 text-center text-slate-500 text-sm">Verifying link…</div>
          )}

          {status === 'invalid' && (
            <div className="text-center py-4">
              <AlertTriangle size={40} className="text-amber-500 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-navy mb-2">Link is invalid or expired</h2>
              <p className="text-slate-500 text-sm mb-6">
                This link is no longer valid. Ask an administrator to send you a new one,
                or use the forgot-password page.
              </p>
              <Link to="/forgot-password" className="btn-primary w-full justify-center">
                Request a new link
              </Link>
            </div>
          )}

          {status === 'done' && (
            <div className="text-center py-6">
              <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-navy mb-1">All set</h2>
              <p className="text-slate-500 text-sm">Redirecting you to sign in…</p>
            </div>
          )}

          {status === 'ready' && (
            <>
              <h2 className="text-xl font-semibold text-slate-900 mb-1">{titleSet}</h2>
              <p className="text-slate-500 text-sm mb-2">{subSet}</p>
              {info?.email && (
                <p className="text-xs text-slate-400 mb-6">
                  Account: <span className="font-medium text-slate-600">{info.email}</span>
                </p>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">New password</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="At least 8 characters"
                    value={pw}
                    onChange={e => setPw(e.target.value)}
                    minLength={8}
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="label">Confirm password</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="Repeat password"
                    value={pw2}
                    onChange={e => setPw2(e.target.value)}
                    minLength={8}
                    required
                  />
                </div>
                {err && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                    {err}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full btn-primary justify-center py-3 rounded-xl mt-2"
                >
                  <Lock size={16} />
                  {submitting ? 'Saving…' : (isInvite ? 'Activate account' : 'Reset password')}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
