import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login        from './pages/Login'
import Overview     from './pages/Overview'
import ShipmentsList  from './pages/ShipmentsList'
import ShipmentDetail from './pages/ShipmentDetail'
import Products     from './pages/Products'
import Reports      from './pages/Reports'
import Projections  from './pages/Projections'
import Finance      from './pages/Finance'
import Settings     from './pages/Settings'
import AuditLog        from './pages/AuditLog'
import UserManagement  from './pages/UserManagement'

function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>
  if (!user)   return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

function Spinner() {
  return (
    <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
  )
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#EDF2F7]"><Spinner /></div>

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Overview />} />
        <Route path="shipments"    element={<ShipmentsList />} />
        <Route path="shipments/:id" element={<ShipmentDetail />} />
        <Route path="finance"      element={<Finance />} />
        <Route path="products"     element={<Products />} />
        <Route path="reports"      element={<Reports />} />
        <Route path="projections"  element={<Projections />} />
        <Route path="settings"     element={<Settings />} />
        <Route path="users"        element={<PrivateRoute adminOnly><UserManagement /></PrivateRoute>} />
        <Route path="audit"        element={<PrivateRoute adminOnly><AuditLog /></PrivateRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
