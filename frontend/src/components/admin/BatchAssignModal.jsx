import { useState } from 'react';
import Modal from '../Modal.jsx';
import { api } from '../../api/client.js';
import { useToast } from '../Toast.jsx';
import { IconPlus, IconTrash } from '../../lib/icons.jsx';

const EMPTY_ROW = (writerId = '') => ({
  key: Math.random(),
  writerId: String(writerId),
  clientId: '',
  articleTypeId: '',
  title: '',
  deadline: '',
  briefNotes: '',
});

export default function BatchAssignModal({ clients, writers, types, defaultWriterId, onClose, onSaved }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState([EMPTY_ROW(defaultWriterId)]);

  function setRow(idx, patch) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }
  function addRow() { setRows((prev) => [...prev, EMPTY_ROW(defaultWriterId)]); }
  function removeRow(idx) { setRows((prev) => prev.filter((_, i) => i !== idx)); }

  async function submit(e) {
    e.preventDefault();
    const articles = rows.map((r) => ({
      title: r.title.trim() || `Untitled — ${new Date().toLocaleDateString()}`,
      assignedWriterId: Number(r.writerId),
      clientId: Number(r.clientId),
      articleTypeId: Number(r.articleTypeId),
      deadline: r.deadline || null,
      briefNotes: r.briefNotes.trim() || null,
    }));

    for (const [i, a] of articles.entries()) {
      if (!a.assignedWriterId || !a.clientId || !a.articleTypeId) {
        toast.error(`Row ${i + 1}: writer, client and content type are required`);
        return;
      }
    }

    setBusy(true);
    try {
      await api.batchCreateArticles(articles);
      toast.success(`${articles.length} assignment${articles.length === 1 ? '' : 's'} created`);
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
      title="Batch Assign"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" form="batch-form" className="btn btn--primary" disabled={busy}>
            {busy ? 'Creating…' : `Create ${rows.length} assignment${rows.length === 1 ? '' : 's'}`}
          </button>
        </>
      }
    >
      <p className="muted batch-hint">
        Create multiple assignments at once — useful when planning a writer's day or onboarding a new client with several pieces of work.
      </p>
      <form id="batch-form" onSubmit={submit}>
        <div className="batch-grid-head">
          <span>Writer *</span>
          <span>Client *</span>
          <span>Content type *</span>
          <span>Title</span>
          <span>Deadline</span>
          <span />
        </div>
        {rows.map((row, idx) => (
          <div key={row.key} className="batch-row">
            <select
              value={row.writerId}
              onChange={(e) => setRow(idx, { writerId: e.target.value })}
              required
            >
              <option value="">Writer…</option>
              {writers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}{w.role === 'TEAM_LEADER' ? ' (TL)' : ''}
                </option>
              ))}
            </select>

            <select
              value={row.clientId}
              onChange={(e) => setRow(idx, { clientId: e.target.value })}
              required
            >
              <option value="">Client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={row.articleTypeId}
              onChange={(e) => setRow(idx, { articleTypeId: e.target.value })}
              required
            >
              <option value="">Type…</option>
              {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>

            <input
              value={row.title}
              onChange={(e) => setRow(idx, { title: e.target.value })}
              placeholder="Title (optional)"
            />

            <input
              type="date"
              value={row.deadline}
              onChange={(e) => setRow(idx, { deadline: e.target.value })}
            />

            <button
              type="button"
              className="icon-btn icon-btn--danger"
              title="Remove row"
              disabled={rows.length === 1}
              onClick={() => removeRow(idx)}
            >
              <IconTrash />
            </button>
          </div>
        ))}

        <button type="button" className="btn btn--ghost btn--sm batch-add-btn" onClick={addRow}>
          <IconPlus /> Add another
        </button>
      </form>
    </Modal>
  );
}
