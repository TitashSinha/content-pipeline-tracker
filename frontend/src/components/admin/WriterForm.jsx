import { useState } from 'react';
import Modal from '../Modal.jsx';
import LinkInputs from '../LinkInputs.jsx';
import PasswordField from '../PasswordField.jsx';
import { api } from '../../api/client.js';
import { useToast } from '../Toast.jsx';

const toDateInput = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : '');

export default function WriterForm({ writer, onClose, onSaved }) {
  const editing = !!writer;
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: writer?.name || '',
    email: writer?.email || '',
    password: '',
    specialties: writer?.specialties || '',
    bio: writer?.bio || '',
    joinedDate: toDateInput(writer?.joinedDate),
    portfolioLinks: writer?.portfolioLinks?.length ? writer.portfolioLinks : [''],
    notes: writer?.notes || '',
    isTeamLeader: writer?.isTeamLeader || false,
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim() || (!editing && (!form.email.trim() || !form.password))) {
      toast.error('Name, email and password are required');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        name: form.name,
        specialties: form.specialties,
        bio: form.bio,
        joinedDate: form.joinedDate ? new Date(form.joinedDate).toISOString() : null,
        portfolioLinks: form.portfolioLinks.map((s) => s.trim()).filter(Boolean),
        notes: form.notes,
        isTeamLeader: form.isTeamLeader,
      };
      if (form.password) payload.password = form.password;
      if (editing) {
        await api.updateWriter(writer.id, payload);
      } else {
        await api.createWriter({ ...payload, email: form.email, password: form.password });
      }
      toast.success(editing ? 'Writer updated' : 'Writer added — they can now sign in');
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      wide
      title={editing ? 'Edit writer' : 'Add writer'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" form="writer-form" className="btn btn--primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <form id="writer-form" className="form-grid" onSubmit={submit}>
        <label className="field">
          <span>Full name *</span>
          <input value={form.name} onChange={set('name')} placeholder="e.g. Priya Nair" />
        </label>
        <label className="field">
          <span>Email{editing ? '' : ' *'}</span>
          <input type="email" value={form.email} onChange={set('email')} disabled={editing} placeholder="priya@lexiconn.in" />
        </label>
        <label className="field field--full">
          <span>{editing ? 'Reset password (leave blank to keep)' : 'Password *'}</span>
          <PasswordField
            value={form.password}
            onChange={set('password')}
            autoComplete="new-password"
            placeholder={editing ? 'New password (optional)' : 'At least 6 characters'}
          />
        </label>
        <label className="field">
          <span>Specialties</span>
          <input value={form.specialties} onChange={set('specialties')} placeholder="e.g. Long-form, SaaS" />
        </label>
        <label className="field">
          <span>Joined date</span>
          <input type="date" value={form.joinedDate} onChange={set('joinedDate')} />
        </label>
        <label className="field field--full">
          <span>Bio</span>
          <textarea rows="2" value={form.bio} onChange={set('bio')} placeholder="Short bio" />
        </label>
        <div className="field field--full">
          <span>Portfolio links</span>
          <LinkInputs
            value={form.portfolioLinks}
            onChange={(v) => setForm((f) => ({ ...f, portfolioLinks: v }))}
            placeholder="Link to published work"
          />
        </div>
        <label className="field field--full">
          <span>Internal notes</span>
          <textarea rows="2" value={form.notes} onChange={set('notes')} placeholder="Anything else worth recording" />
        </label>

        <label className="field field--full tl-toggle">
          <input
            type="checkbox"
            checked={form.isTeamLeader}
            onChange={(e) => setForm((f) => ({ ...f, isTeamLeader: e.target.checked }))}
          />
          <span className="tl-toggle-label">
            Team Leader (TL)
            <span className="tl-toggle-hint">Grants elevated access — can assign tasks, view all content and clients.</span>
          </span>
        </label>
      </form>
    </Modal>
  );
}
