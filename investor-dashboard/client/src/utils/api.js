import axios from 'axios'

const api = axios.create({
  baseURL:         '/api/v1',
  withCredentials: true,
  headers:         { 'Content-Type': 'application/json' },
})

// Redirect to login on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && !window.location.pathname.endsWith('/login')) {
      window.location.href = '/dashboard/login'
    }
    return Promise.reject(err)
  }
)

export default api
