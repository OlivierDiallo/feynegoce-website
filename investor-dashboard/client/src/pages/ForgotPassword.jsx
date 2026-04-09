import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft } from 'lucide-react'
import api from '../utils/api'

export default function ForgotPassword() {
  const [email, setEmail]     = useState('')
  const [submitted, setOk]    = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
    } catch (_err) { /* always show success — never leak which emails exist */ }
    setOk(true)
    setLoading(false)
  }

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
          {submitted ? (
            <>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Check your email</h2>
              <p className="text-slate-500 text-sm mb-6">
                If an account exists for <span className="font-semibold text-navy">{email}</span>, a password
                reset link has been sent. The link expires in 1 hour.
              </p>
              <Link to="/login" className="btn-primary w-full justify-center">
                <ArrowLeft size={16} /> Back to sign in
              </Link>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-slate-900 mb-1">Forgot password?</h2>
              <p className="text-slate-500 text-sm mb-6">
                Enter your email and we'll send you a secure link to reset it.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Email address</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="you@feynegoce.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary justify-center py-3 rounded-xl mt-2"
                >
                  <Mail size={16} />
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
              <p className="text-center mt-6">
                <Link to="/login" className="text-xs text-slate-500 hover:text-accent">
                  ← Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
