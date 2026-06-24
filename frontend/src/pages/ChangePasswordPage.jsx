import { useState } from 'react';
import { api } from '../api/client.js';
import { useToast } from '../components/Toast.jsx';
import PasswordField from '../components/PasswordField.jsx';
import { Button, Card } from '../components/ui/index.js';

export default function ChangePasswordPage() {
  const toast = useToast();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (form.next !== form.confirm) return toast.error('New passwords do not match');
    if (form.next.length < 6) return toast.error('New password must be at least 6 characters');
    setBusy(true);
    try {
      await api.changePassword(form.current, form.next);
      toast.success('Password changed');
      setForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <div className="page-head"><h1>Change Password</h1></div>
      <Card narrow>
        <form onSubmit={submit} className="stack">
          <label className="field">
            <span>Current password</span>
            <PasswordField value={form.current} onChange={set('current')} autoComplete="current-password" />
          </label>
          <label className="field">
            <span>New password</span>
            <PasswordField value={form.next} onChange={set('next')} autoComplete="new-password" />
          </label>
          <label className="field">
            <span>Confirm new password</span>
            <PasswordField value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
          </label>
          <Button disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
