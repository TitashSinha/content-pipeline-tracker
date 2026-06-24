import { useRef, useState } from 'react';
import Modal from '../Modal.jsx';
import LinkInputs from '../LinkInputs.jsx';
import { api } from '../../api/client.js';
import { useToast } from '../Toast.jsx';
import { Button } from '../ui/index.js';

// FEATURE: Article Templates — create/edit a reusable brief.
// Mirrors ClientForm/ArticleForm (Modal + dirty guard + LinkInputs).
export default function TemplateForm({ template, types, onClose, onSaved }) {
  const editing = !!template;
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const initial = {
    name: template?.name || '',
    articleTypeId: template?.articleTypeId || '',
    wordCountTarget: template?.wordCountTarget ?? '',
    ttwTargetMinutes: template?.ttwTargetMinutes ?? '',
    briefNotes: template?.briefNotes || '',
    referenceLinks: template?.referenceLinks?.length ? template.referenceLinks : [''],
  };
  const [form, setForm] = useState(initial);
  const initialJson = useRef(JSON.stringify(initial));
  const dirty = JSON.stringify(form) !== initialJson.current;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Template name is required'); return; }
    setBusy(true);
    try {
      if (editing) await api.updateTemplate(template.id, form);
      else await api.createTemplate(form);
      toast.success(editing ? 'Template updated' : 'Template created');
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
      title={editing ? 'Edit template' : 'New template'}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" form="template-form" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <form id="template-form" className="form-grid" onSubmit={submit}>
        <label className="field field--full">
          <span>Template name *</span>
          <input value={form.name} onChange={set('name')} placeholder="e.g. SEO Blog Post" />
        </label>
        <label className="field">
          <span>Content type</span>
          <select value={form.articleTypeId} onChange={set('articleTypeId')}>
            <option value="">No default</option>
            {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
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
          <textarea rows="4" value={form.briefNotes} onChange={set('briefNotes')} placeholder="Reusable instructions, structure, tone of voice…" />
        </label>
        <div className="field field--full">
          <span>Reference links</span>
          <LinkInputs
            value={form.referenceLinks}
            onChange={(v) => setForm((f) => ({ ...f, referenceLinks: v }))}
            placeholder="Style guide, examples, brand docs…"
          />
        </div>
      </form>
    </Modal>
  );
}
