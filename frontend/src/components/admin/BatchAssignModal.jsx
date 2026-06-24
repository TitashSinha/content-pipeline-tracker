import { useState } from 'react';
import Modal from '../Modal.jsx';
import { Button, IconButton, LinkButton } from '../ui/index.js';
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
  notesOpen: false,
});

export default function BatchAssignModal({ clients, writers, types, defaultWriterId, onClose, onSaved }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState([EMPTY_ROW(defaultWriterId)]);
  // Dirty once anything beyond the initial single (optionally pre-filled) row exists.
  const dirty = rows.length > 1 || rows.some((r) => r.title || r.clientId || r.articleTypeId || r.deadline || r.briefNotes);

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
      dirty={dirty}
      title="Batch Assign"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" form="batch-form" disabled={busy}>
            {busy ? 'Creating…' : `Create ${rows.length} assignment${rows.length === 1 ? '' : 's'}`}
          </Button>
        </>
      }
    >
      <p className="text-muted batch-hint">
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
          <div key={row.key} className="batch-row-wrap">
            <div className="batch-row">
              <select value={row.writerId} onChange={(e) => setRow(idx, { writerId: e.target.value })} required>
                <option value="">Writer…</option>
                <optgroup label="Team Leaders">
                  {writers.filter((w) => w.role === 'TEAM_LEADER').map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Writers">
                  {writers.filter((w) => w.role === 'WRITER').map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </optgroup>
              </select>

              <select value={row.clientId} onChange={(e) => setRow(idx, { clientId: e.target.value })} required>
                <option value="">Client…</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              <select value={row.articleTypeId} onChange={(e) => setRow(idx, { articleTypeId: e.target.value })} required>
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

              <IconButton
                tone="danger"
                title="Remove row"
                disabled={rows.length === 1}
                onClick={() => removeRow(idx)}
              >
                <IconTrash />
              </IconButton>
            </div>

            <div className="batch-notes-bar">
              <LinkButton onClick={() => setRow(idx, { notesOpen: !row.notesOpen })}>
                {row.notesOpen ? '− hide notes' : '＋ add brief notes'}
              </LinkButton>
            </div>

            {row.notesOpen && (
              <textarea
                className="batch-notes-input"
                rows="2"
                value={row.briefNotes}
                onChange={(e) => setRow(idx, { briefNotes: e.target.value })}
                placeholder="Context, keywords, tone, instructions for the writer…"
              />
            )}
          </div>
        ))}

        <Button variant="ghost" size="sm" className="batch-add-btn" onClick={addRow}>
          <IconPlus /> Add another
        </Button>
      </form>
    </Modal>
  );
}
