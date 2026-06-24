import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Loader from '../components/Loader.jsx';
import PasswordField from '../components/PasswordField.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { Button, Chip, Field, Input } from '../components/ui/index.js';

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
    <div className="auth-screen relative">
      <ThemeToggle className="absolute top-5 right-5 z-10" />
      <div className="auth-aside">
        <div className="brand brand--light">
          <span className="brand-mark">✦</span>
          <div className="brand-text">
            <strong>Content Pipeline Tracker</strong>
          </div>
        </div>
        <h2>Every brief, writer and deadline — in one calm place.</h2>
        <p>Assign work, watch it move from brief to done, and see exactly how long the writing really takes.</p>
      </div>

      <div className="flex items-center justify-center py-10 px-6">
        <div className="w-full max-w-[380px] bg-surface border border-border rounded-[var(--radius-lg)] shadow-[var(--shadow)] p-[34px]">
          <h1 className="text-2xl mb-1">Welcome back</h1>
          <p className="text-muted">Sign in to manage your content pipeline.</p>
          <form onSubmit={submit} className="flex flex-col gap-4 mt-[22px]">
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@lexiconn.in" autoFocus />
            </Field>
            <Field label="Password">
              <PasswordField
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </Field>
            {error && <p className="form-error">{error}</p>}
            <Button type="submit" block disabled={busy}>
              {busy ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-[22px] pt-[18px] border-t border-border flex flex-col gap-2.5">
            <span className="text-muted text-[.8rem]">Try a demo account</span>
            <div className="flex gap-2">
              <Chip onClick={() => fill('admin')}>Admin</Chip>
              <Chip onClick={() => fill('writer')}>Writer</Chip>
            </div>
            <p className="text-muted text-[.8rem]">Password for all demo accounts: <code>Lexiconn@2025</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}
