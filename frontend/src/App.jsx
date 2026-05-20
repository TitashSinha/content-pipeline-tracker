import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import ChangePasswordPage from './pages/ChangePasswordPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminArticlePage from './pages/admin/AdminArticlePage'
import WriterDashboard from './pages/writer/WriterDashboard'
import WriterArticlePage from './pages/writer/WriterArticlePage'

function RootRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/writer'} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/admin"
            element={<ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>}
          />

          <Route
            path="/admin/articles/:id"
            element={<ProtectedRoute role="ADMIN"><AdminArticlePage /></ProtectedRoute>}
          />

          <Route
            path="/writer"
            element={<ProtectedRoute role="WRITER"><WriterDashboard /></ProtectedRoute>}
          />

          <Route
            path="/writer/articles/:id"
            element={<ProtectedRoute role="WRITER"><WriterArticlePage /></ProtectedRoute>}
          />

          <Route
            path="/change-password"
            element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
