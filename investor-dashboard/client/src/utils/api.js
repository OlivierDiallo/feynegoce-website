import axios from 'axios'

const api = axios.create({
  baseURL:         '/api/v1',
  withCredentials: true,
  headers:         { 'Content-Type': 'application/json' },
})

// Public dashboard routes that must NEVER trigger an auto-redirect to login.
// AuthProvider eagerly calls /auth/me on every page, including the
// invite/reset pages — without this whitelist a 401 from that probe would
// bounce the user away from /dashboard/setup-password/<token> before the
// SetPassword component can even verify the token.
const PUBLIC_PATH_RE = /^\/dashboard\/(login|forgot-password|reset-password\/|setup-password\/)/

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && !PUBLIC_PATH_RE.test(window.location.pathname)) {
      window.location.href = '/dashboard/login'
    }
    return Promise.reject(err)
  }
)

export default api
