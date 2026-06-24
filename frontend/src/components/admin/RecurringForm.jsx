import { useRef, useState } from 'react';
import Modal from '../Modal.jsx';
import LinkInputs from '../LinkInputs.jsx';
import { api } from '../../api/client.js';
import { useToast } from '../Toast.jsx';
import { Button } from '../ui/index.js';

// FEATURE: Recurring Content (Phase 6) — create/edit a recurrence rule. Mirrors
// ArticleForm/TemplateForm (Modal + dirty guard + LinkInputs). Stores the article
// fields directly; the backend sweep spawns a Brief Pending piece each cadence.
const toDateInput = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : '');
const CADENCE_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
];

export default function RecurringForm({ recurrence, clients, writers, types, onClose, onSaved }) {
  const editing = !!recurrence?.id;
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const initial = {
    title: recurrence?.title || '',
    clientId: recurrence?.clientId || '',
    articleTypeId: recurrence?.articleTypeId || '',
    assignedWriterId: recurrence?.assignedWriterId || '',
    cadence: recurrence?.cadence || 'weekly',
    nextRunAt: toDateInput(recurrence?.nextRunAt) || new Date().toISOString().slice(0, 10),
    leadTimeDays: recurrence?.leadTimeDays ?? 5,
    wordCountTarget: recurrence?.wordCountTarget ?? '',
    ttwTargetMinutes: recurrence?.ttwTargetMinutes ?? '',
    briefNotes: recurrence?.briefNotes || '',
    referenceLinks: recurrence?.referenceLinks?.length ? recurrence.referenceLinks : [''],
    active: recurrence?.active ?? true,
  };
  const [form, setForm] = useState(initial);
  const initialJson = useRef(JSON.stringify(initial));
  const dirty = JSON.stringify(form) !== initialJson.current;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (!form.title || !form.clientId || !form.articleTypeId || !form.assignedWriterId) {
      toast.error('Title, client, type and writer are required');
      return;
    }
    setBusy(true);
    try {
      const payload = { ...form, nextRunAt: new Date(form.nextRunAt).toISOString() };
      if (editing) await api.updateRecurrence(recurrence.id, payload);
      else await api.createRecurrence(payload);
      toast.success(editing ? 'Recurrence updated' : 'Recurrence created');
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
      title={editing ? 'Edit recurring content' : 'New recurring content'}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" form="recurring-form" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <form id="recurring-form" className="form-grid" onSubmit={submit}>
        <label className="field field--full">
          <span>Title *</span>
          <input value={form.title} onChange={set('title')} placeholder="e.g. Horizon Tech — Monthly Newsletter" />
          <span className="field-hint">Each generated piece is stamped with its date, e.g. "… · 5 Jul".</span>
        </label>

        <label className="field">
          <span>Client *</span>
          <select value={form.clientId} onChange={set('clientId')}>
            <option value="">Select…</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>

        <label className="field">
          <span>Content type *</span>
          <select value={form.articleTypeId} onChange={set('articleTypeId')}>
            <option value="">Select…</option>
            {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>

        <label className="field">
          <span>Assign to *</span>
          <select value={form.assignedWriterId} onChange={set('assignedWriterId')}>
            <option value="">Select…</option>
            <optgroup label="Team Leaders">
              {writers.filter((w) => w.role === 'TEAM_LEADER').map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </optgroup>
            <optgroup label="Writers">
              {writers.filter((w) => w.role === 'WRITER').map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </optgroup>
          </select>
        </label>

        <label className="field">
          <span>Cadence *</span>
          <select value={form.cadence} onChange={set('cadence')}>
            {CADENCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>

        <label className="field">
          <span>First / next run</span>
          <input type="date" value={form.nextRunAt} onChange={set('nextRunAt')} />
        </label>

        <label className="field">
          <span>Deadline lead time (days)</span>
          <input type="number" min="0" value={form.leadTimeDays} onChange={set('leadTimeDays')} placeholder="e.g. 5" />
          <span className="field-hint">Each piece is due this many days after it's generated.</span>
        </label>

        <label className="field">
          <span>Word count target</span>
          <input type="number" min="0" value={form.wordCountTarget} onChange={set('wordCountTarget')} placeholder="e.g. 600" />
        </label>

        <label className="field">
          <span>TTW target (minutes)</span>
          <input type="number" min="0" value={form.ttwTargetMinutes} onChange={set('ttwTargetMinutes')} placeholder="e.g. 50" />
        </label>

        <label className="field field--full">
          <span>Brief notes</span>
          <textarea rows="3" value={form.briefNotes} onChange={set('briefNotes')} placeholder="Reusable instructions for every issue…" />
        </label>

        <div className="field field--full">
          <span>Reference links</span>
          <LinkInputs
            value={form.referenceLinks}
            onChange={(v) => setForm((f) => ({ ...f, referenceLinks: v }))}
            placeholder="Style guide, examples, brand docs…"
          />
        </div>

        <label className="field field--full checkbox-field">
          <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
          <span>Active — generate pieces automatically on this cadence</span>
        </label>
      </form>
    </Modal>
  );
}
