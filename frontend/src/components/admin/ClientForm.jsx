import { useRef, useState } from 'react';
import Modal from '../Modal.jsx';
import LinkInputs from '../LinkInputs.jsx';
import { api } from '../../api/client.js';
import { useToast } from '../Toast.jsx';
import { Button } from '../ui/index.js';

const toDateInput = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : '');

export default function ClientForm({ client, types, writers = [], templates = [], onClose, onSaved }) {
  const editing = !!client;
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const initial = {
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
    defaultWriterId: client?.defaultWriterId || '',
    defaultWordCount: client?.defaultWordCount ?? '',
    defaultTtwMinutes: client?.defaultTtwMinutes ?? '',
    defaultTemplateId: client?.defaultTemplateId || '',
  };
  const [form, setForm] = useState(initial);
  const initialJson = useRef(JSON.stringify(initial));
  const dirty = JSON.stringify(form) !== initialJson.current;
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
      dirty={dirty}
      title={editing ? 'Edit client' : 'Add client'}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" form="client-form" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
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

        <p className="field--full form-subhead">Defaults for new content — pre-fill the assignment form for this client.</p>
        <label className="field">
          <span>Preferred writer</span>
          <select value={form.defaultWriterId} onChange={set('defaultWriterId')}>
            <option value="">No default</option>
            <optgroup label="Team Leaders">
              {writers.filter((w) => w.role === 'TEAM_LEADER').map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </optgroup>
            <optgroup label="Writers">
              {writers.filter((w) => w.role === 'WRITER').map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </optgroup>
          </select>
        </label>
        <label className="field">
          <span>Default template</span>
          <select value={form.defaultTemplateId} onChange={set('defaultTemplateId')}>
            <option value="">No default</option>
            {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Default word count</span>
          <input type="number" min="0" value={form.defaultWordCount} onChange={set('defaultWordCount')} placeholder="e.g. 1000" />
        </label>
        <label className="field">
          <span>Default TTW (minutes)</span>
          <input type="number" min="0" value={form.defaultTtwMinutes} onChange={set('defaultTtwMinutes')} placeholder="e.g. 90" />
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
