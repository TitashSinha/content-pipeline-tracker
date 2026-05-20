import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Wraps a page that requires authentication.
 * - No session → /login
 * - Wrong role → their correct area (not a blank 403, just a redirect)
 */
export default function ProtectedRoute({ children, role }) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/writer'} replace />
  }

  return children
}
