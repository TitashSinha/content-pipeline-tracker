import { useState } from 'react';
import Modal from '../Modal.jsx';
import LinkInputs from '../LinkInputs.jsx';
import { api } from '../../api/client.js';
import { useToast } from '../Toast.jsx';

const toDateInput = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : '');

export default function ClientForm({ client, types, onClose, onSaved }) {
  const editing = !!client;
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: client?.name || '',
    contentTypeId: client?.contentTypeId || '',
    industry: client?.industry || '',
    competitors: client?.competitors || '',
    website: client?.website || '',
    sampleLinks: client?.sampleLinks?.length ? client.sampleLinks : [''],
    onboardingDate: toDateInput(client?.onboardingDate),
    pilotDate: toDateInput(client?.pilotDate),
    pilotNotes: client?.pilotNotes || '',
    notes: client?.notes || '',
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.contentTypeId) {
      toast.error('Client name and content type are required');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        ...form,
        contentTypeId: Number(form.contentTypeId),
        sampleLinks: form.sampleLinks.map((s) => s.trim()).filter(Boolean),
        onboardingDate: form.onboardingDate ? new Date(form.onboardingDate).toISOString() : null,
        pilotDate: form.pilotDate ? new Date(form.pilotDate).toISOString() : null,
      };
      if (editing) await api.updateClient(client.id, payload);
      else await api.createClient(payload);
      toast.success(editing ? 'Client updated' : 'Client added');
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
      title={editing ? 'Edit client' : 'Add client'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" form="client-form" className="btn btn--primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <form id="client-form" className="form-grid" onSubmit={submit}>
        <label className="field">
          <span>Client name *</span>
          <input value={form.name} onChange={set('name')} placeholder="Acme Corp" />
        </label>
        <label className="field">
          <span>Content type *</span>
          <select value={form.contentTypeId} onChange={set('contentTypeId')}>
            <option value="">Select…</option>
            {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Industry</span>
          <input value={form.industry} onChange={set('industry')} placeholder="e.g. B2B SaaS" />
        </label>
        <label className="field">
          <span>Website</span>
          <input value={form.website} onChange={set('website')} placeholder="https://…" />
        </label>
        <label className="field field--full">
          <span>Competitors</span>
          <input value={form.competitors} onChange={set('competitors')} placeholder="Comma-separated, optional" />
        </label>
        <label className="field">
          <span>Onboarding date</span>
          <input type="date" value={form.onboardingDate} onChange={set('onboardingDate')} />
        </label>
        <label className="field">
          <span>Pilot date</span>
          <input type="date" value={form.pilotDate} onChange={set('pilotDate')} />
        </label>
        <label className="field field--full">
          <span>What the pilot was</span>
          <textarea rows="2" value={form.pilotNotes} onChange={set('pilotNotes')} placeholder="Short description of the pilot engagement" />
        </label>
        <div className="field field--full">
          <span>Sample work links</span>
          <LinkInputs
            value={form.sampleLinks}
            onChange={(v) => setForm((f) => ({ ...f, sampleLinks: v }))}
            placeholder="Link to similar work we've done before"
          />
        </div>
        <label className="field field--full">
          <span>Other notes</span>
          <textarea rows="3" value={form.notes} onChange={set('notes')} placeholder="Anything else worth recording" />
        </label>
      </form>
    </Modal>
  );
}
