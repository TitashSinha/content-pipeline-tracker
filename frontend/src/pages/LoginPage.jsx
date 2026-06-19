import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Loader from '../components/Loader.jsx';
import PasswordField from '../components/PasswordField.jsx';

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) return <Loader full />;
  if (user) {
    const dest = user.role === 'ADMIN' ? '/admin' : user.role === 'TEAM_LEADER' ? '/tl' : '/writer';
    return <Navigate to={dest} replace />;
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  function fill(role) {
    setEmail(role === 'admin' ? 'admin@lexiconn.in' : 'titash@lexiconn.in');
    setPassword('Lexiconn@2025');
  }

  return (
    <div className="auth-screen">
      <div className="auth-aside">
        <div className="brand brand--light">
          <span className="brand-mark">✦</span>
          <div className="brand-text">
            <strong>Content Pipeline</strong>
            <span className="brand-sub">Lexiconn</span>
          </div>
        </div>
        <h2>Every brief, writer and deadline — in one calm place.</h2>
        <p>Assign work, watch it move from brief to done, and see exactly how long the writing really takes.</p>
      </div>

      <div className="auth-main">
        <div className="auth-card">
          <h1>Welcome back</h1>
          <p className="muted">Sign in to manage your content pipeline.</p>
          <form onSubmit={submit} className="auth-form">
            <label className="field">
              <span>Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@lexiconn.in" autoFocus />
            </label>
            <label className="field">
              <span>Password</span>
              <PasswordField
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </label>
            {error && <p className="form-error">{error}</p>}
            <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="auth-hint">
            <span className="muted tiny">Try a demo account</span>
            <div className="auth-hint-btns">
              <button type="button" className="chip" onClick={() => fill('admin')}>Admin</button>
              <button type="button" className="chip" onClick={() => fill('writer')}>Writer</button>
            </div>
            <p className="muted tiny">Password for all demo accounts: <code>Lexiconn@2025</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}
