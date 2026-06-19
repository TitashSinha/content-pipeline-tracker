import { useState } from 'react';
import Modal from '../Modal.jsx';
import LinkInputs from '../LinkInputs.jsx';
import { api } from '../../api/client.js';
import { useToast } from '../Toast.jsx';

const toDateInput = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : '');

export default function ArticleForm({ article, clients, writers, types, onClose, onSaved }) {
  const editing = !!article;
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: article?.title || '',
    clientId: article?.clientId || '',
    articleTypeId: article?.articleTypeId || '',
    assignedWriterId: article?.assignedWriterId || '',
    deadline: toDateInput(article?.deadline),
    wordCountTarget: article?.wordCountTarget ?? '',
    ttwTargetMinutes: article?.ttwTargetMinutes ?? '',
    briefNotes: article?.briefNotes || '',
    referenceLinks: article?.referenceLinks?.length ? article.referenceLinks : [''],
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (!form.title || !form.clientId || !form.articleTypeId || !form.assignedWriterId) {
      toast.error('Title, client, type and writer are required');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        ...form,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      };
      if (editing) await api.updateArticle(article.id, payload);
      else await api.createArticle(payload);
      toast.success(editing ? 'Content updated' : 'Content created');
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
      title={editing ? 'Edit content' : 'New content'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" form="article-form" className="btn btn--primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <form id="article-form" className="form-grid" onSubmit={submit}>
        <label className="field field--full">
          <span>Title *</span>
          <input value={form.title} onChange={set('title')} placeholder="e.g. How to Scale Your Content Strategy" />
        </label>

        <label className="field">
          <span>Client *</span>
          <select value={form.clientId} onChange={set('clientId')}>
            <option value="">Select…</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}{c.contentTypeName ? ` · ${c.contentTypeName}` : ''}</option>)}
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
          <span>Assigned writer *</span>
          <select value={form.assignedWriterId} onChange={set('assignedWriterId')}>
            <option value="">Select…</option>
            {writers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </label>

        <label className="field">
          <span>Deadline</span>
          <input type="date" value={form.deadline} onChange={set('deadline')} />
        </label>

        <label className="field">
          <span>Word count target</span>
          <input type="number" min="0" value={form.wordCountTarget} onChange={set('wordCountTarget')} placeholder="e.g. 1000" />
        </label>

        <label className="field">
          <span>TTW target (minutes)</span>
          <input type="number" min="0" value={form.ttwTargetMinutes} onChange={set('ttwTargetMinutes')} placeholder="e.g. 90" />
        </label>

        <label className="field field--full">
          <span>Brief notes</span>
          <textarea rows="4" value={form.briefNotes} onChange={set('briefNotes')} placeholder="Instructions, keywords, tone of voice, word-count goals, reference links…" />
        </label>

        <div className="field field--full">
          <span>Reference links</span>
          <LinkInputs
            value={form.referenceLinks}
            onChange={(v) => setForm((f) => ({ ...f, referenceLinks: v }))}
            placeholder="Include reference links provided by the client — any URL works"
          />
        </div>
      </form>
    </Modal>
  );
}
