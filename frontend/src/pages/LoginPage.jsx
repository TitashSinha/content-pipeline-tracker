import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../api/client'

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()

  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [showPass,    setShowPass]    = useState(false)
  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState(false)

  // Already authenticated — send them to their area
  if (user) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/writer'} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { token, user: userData } = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      login(token, userData)
      navigate(userData.role === 'ADMIN' ? '/admin' : '/writer', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">Content Pipeline Tracker</h1>
          <p className="login-subtitle">Sign in to your account</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {error && <p className="login-error" role="alert">{error}</p>}

          <div className="field">
            <label className="field-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="field-input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="password">Password</label>
            <div className="input-with-icon">
              <input
                id="password"
                className="field-input"
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="input-icon-btn"
                onClick={() => setShowPass(v => !v)}
                tabIndex={-1}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button className="btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
