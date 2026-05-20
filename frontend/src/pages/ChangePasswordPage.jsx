import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import { apiFetch } from '../api/client'

export default function ChangePasswordPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [current,     setCurrent]     = useState('')
  const [next,        setNext]        = useState('')
  const [confirm,     setConfirm]     = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext,    setShowNext]    = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState(false)

  const backPath = user?.role === 'ADMIN' ? '/admin' : '/writer'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (next !== confirm) {
      setError('New passwords do not match')
      return
    }

    if (next.length < 8) {
      setError('New password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      await apiFetch('/api/auth/password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      })
      setSuccess(true)
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <button className="back-link" onClick={() => navigate(backPath)}>
        ← Back
      </button>

      <div className="change-password-wrap">
        <h2 className="page-title">Change Password</h2>
        <p className="page-subtitle">Update your account password</p>

        <form className="change-password-form" onSubmit={handleSubmit} noValidate>
          {error   && <p className="login-error" role="alert">{error}</p>}
          {success && <p className="doc-saved-msg">✓ Password updated successfully</p>}

          <div className="field">
            <label className="field-label" htmlFor="current-password">Current Password</label>
            <div className="input-with-icon">
              <input
                id="current-password"
                className="field-input"
                type={showCurrent ? 'text' : 'password'}
                value={current}
                onChange={(e) => { setCurrent(e.target.value); setSuccess(false) }}
                required
                disabled={loading}
              />
              <button type="button" className="input-icon-btn" onClick={() => setShowCurrent(v => !v)} tabIndex={-1} aria-label={showCurrent ? 'Hide' : 'Show'}>
                {showCurrent ? <EyeOff /> : <EyeOn />}
              </button>
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="new-password">New Password</label>
            <div className="input-with-icon">
              <input
                id="new-password"
                className="field-input"
                type={showNext ? 'text' : 'password'}
                value={next}
                onChange={(e) => { setNext(e.target.value); setSuccess(false) }}
                required
                disabled={loading}
              />
              <button type="button" className="input-icon-btn" onClick={() => setShowNext(v => !v)} tabIndex={-1} aria-label={showNext ? 'Hide' : 'Show'}>
                {showNext ? <EyeOff /> : <EyeOn />}
              </button>
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="confirm-password">Confirm New Password</label>
            <div className="input-with-icon">
              <input
                id="confirm-password"
                className="field-input"
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setSuccess(false) }}
                required
                disabled={loading}
              />
              <button type="button" className="input-icon-btn" onClick={() => setShowConfirm(v => !v)} tabIndex={-1} aria-label={showConfirm ? 'Hide' : 'Show'}>
                {showConfirm ? <EyeOff /> : <EyeOn />}
              </button>
            </div>
          </div>

          <button className="btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </Layout>
  )
}

function EyeOn() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

function EyeOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}
