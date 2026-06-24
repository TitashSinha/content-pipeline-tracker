import { useRef, useState } from 'react';
import Modal from '../Modal.jsx';
import LinkInputs from '../LinkInputs.jsx';
import { api } from '../../api/client.js';
import { useToast } from '../Toast.jsx';
import { findSimilarArticles } from '../../lib/utils.js';
import { isActive, STATUS_LABELS } from '../../lib/workflow.js';
import { isOverloaded, suggestWriters, recommendDeadline, activeCountByWriter } from '../../lib/risk.js';
import { IconWarning } from '../../lib/icons.jsx';
import { Button } from '../ui/index.js';

const toDateInput = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : '');
const isEmptyVal = (v) => v === '' || v == null || (Array.isArray(v) && v.filter(Boolean).length === 0);

// Merge a template into a (copied) form object. `force` overwrites; otherwise it
// only fills blanks. Shared by the manual picker and the client-default path.
function applyTemplateTo(form, tpl, force) {
  if (!tpl) return form;
  const put = (k, v) => { if (v != null && v !== '' && (force || isEmptyVal(form[k]))) form[k] = v; };
  put('articleTypeId', tpl.articleTypeId || '');
  put('wordCountTarget', tpl.wordCountTarget ?? '');
  put('ttwTargetMinutes', tpl.ttwTargetMinutes ?? '');
  put('briefNotes', tpl.briefNotes || '');
  if (tpl.referenceLinks?.length && (force || isEmptyVal(form.referenceLinks))) form.referenceLinks = [...tpl.referenceLinks];
  return form;
}

// Fill a (copied) form's blanks from a client's defaults + its default template.
function fillFromClient(form, client, templates) {
  if (!client) return form;
  const fill = (k, v) => { if (v != null && v !== '' && isEmptyVal(form[k])) form[k] = v; };
  fill('articleTypeId', client.contentTypeId || '');
  fill('assignedWriterId', client.defaultWriterId || '');
  fill('wordCountTarget', client.defaultWordCount ?? '');
  fill('ttwTargetMinutes', client.defaultTtwMinutes ?? '');
  if (client.defaultTemplateId) applyTemplateTo(form, templates.find((t) => t.id === client.defaultTemplateId), false);
  return form;
}

// FEATURE: Assignment form — also the home of Templates (apply), Client Defaults
// (auto-fill on client select / preset), Duplicate Detection, and Smart Deadline
// Warnings. Auto-fill is non-destructive; an explicit template pick overwrites.
// Warnings are advisory and never block submission.
export default function ArticleForm({ article, clients, writers, types, articles = [], templates = [], onClose, onSaved }) {
  const editing = !!article?.id;
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [templateId, setTemplateId] = useState('');

  const initial = (() => {
    const base = {
      title: article?.title || '',
      clientId: article?.clientId || '',
      articleTypeId: article?.articleTypeId || '',
      assignedWriterId: article?.assignedWriterId || '',
      deadline: toDateInput(article?.deadline),
      wordCountTarget: article?.wordCountTarget ?? '',
      ttwTargetMinutes: article?.ttwTargetMinutes ?? '',
      briefNotes: article?.briefNotes || '',
      referenceLinks: article?.referenceLinks?.length ? article.referenceLinks : [''],
    };
    // New piece opened with a preset client (e.g. from the client page) → seed
    // its defaults so the experience matches selecting the client manually.
    if (!editing && base.clientId) {
      fillFromClient(base, clients.find((c) => String(c.id) === String(base.clientId)), templates);
    }
    return base;
  })();

  const [form, setForm] = useState(initial);
  const initialJson = useRef(JSON.stringify(initial));
  const dirty = JSON.stringify(form) !== initialJson.current;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function onPickTemplate(e) {
    const id = e.target.value;
    setTemplateId(id);
    const tpl = templates.find((t) => String(t.id) === String(id));
    setForm((f) => applyTemplateTo({ ...f }, tpl, true));
  }

  // FEATURE: Deadline recommendation — fill a realistic deadline from the TTW
  // target + the assignee's current load. Advisory; the user can still edit it.
  function suggestDeadline() {
    const writerActive = activeCountByWriter(articles)[Number(form.assignedWriterId)] || 0;
    const d = recommendDeadline({
      ttwTargetMinutes: form.ttwTargetMinutes ? Number(form.ttwTargetMinutes) : null,
      writerActive,
    });
    setForm((f) => ({ ...f, deadline: d.toISOString().slice(0, 10) }));
  }

  function onClientChange(e) {
    const clientId = e.target.value;
    const client = clients.find((c) => String(c.id) === String(clientId));
    setForm((f) => (editing ? { ...f, clientId } : fillFromClient({ ...f, clientId }, client, templates)));
  }

  async function submit(e, asDraft = false) {
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
      if (editing) {
        await api.updateArticle(article.id, payload);
      } else {
        await api.createArticle(asDraft ? { ...payload, status: 'DRAFT' } : payload);
      }
      toast.success(editing ? 'Content updated' : asDraft ? 'Draft saved' : 'Content created');
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  // --- advisory: duplicates + smart deadline / workload warnings -----------
  const dupes = editing ? [] : findSimilarArticles(form.title, articles, { clientId: form.clientId, excludeId: article?.id });
  const warnings = [];
  if (form.deadline) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const dDay = new Date(form.deadline); dDay.setHours(0, 0, 0, 0);
    const days = Math.round((dDay - today) / 86400000);
    if (days < 0) warnings.push('The deadline is in the past.');
    else if (days === 0) warnings.push('The deadline is today.');
    else if (days === 1) warnings.push('The deadline is tomorrow.');
  }
  if (form.assignedWriterId) {
    const load = articles.filter((a) => String(a.assignedWriterId) === String(form.assignedWriterId) && isActive(a.status) && a.id !== article?.id).length;
    if (isOverloaded(load)) {
      const w = writers.find((x) => String(x.id) === String(form.assignedWriterId));
      warnings.push(`${w ? w.name : 'This writer'} already has ${load} active pieces.`);
    }
  }
  if (form.deadline && form.ttwTargetMinutes) {
    const dEnd = new Date(form.deadline); dEnd.setHours(18, 0, 0, 0);
    const minsLeft = Math.round((dEnd - Date.now()) / 60000);
    if (minsLeft > 0 && Number(form.ttwTargetMinutes) > minsLeft) {
      warnings.push('Target writing time is longer than the time left before the deadline.');
    }
  }
  const showAdvisory = dupes.length > 0 || warnings.length > 0;

  // FEATURE: Smart assignment — rank writers by client preference / specialty /
  // lightest load. Only when creating; picking a chip fills the "Assign to" field.
  const suggestions = !editing
    ? suggestWriters(writers, {
        typeName: types.find((t) => String(t.id) === String(form.articleTypeId))?.name,
        articles,
        defaultWriterId: clients.find((c) => String(c.id) === String(form.clientId))?.defaultWriterId,
      })
    : [];

  return (
    <Modal
      wide
      dirty={dirty}
      title={editing ? 'Edit content' : 'New content'}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          {!editing && (
            <Button variant="ghost" disabled={busy} onClick={(e) => submit(e, true)}>
              Save as draft
            </Button>
          )}
          <Button type="submit" form="article-form" disabled={busy}>
            {busy ? 'Saving…' : editing ? 'Save' : 'Create'}
          </Button>
        </>
      }
    >
      {!editing && templates.length > 0 && (
        <label className="field template-picker">
          <span>Start from a template</span>
          <select value={templateId} onChange={onPickTemplate}>
            <option value="">None</option>
            {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
      )}

      {showAdvisory && (
        <div className="form-advisory">
          {dupes.length > 0 && (
            <div className="form-advisory-item">
              <IconWarning />
              <div>
                <strong>Possible duplicate{dupes.length > 1 ? 's' : ''}</strong>
                <ul className="form-advisory-list">
                  {dupes.map((d) => (
                    <li key={d.id}>{d.title} <span className="text-muted">· {STATUS_LABELS[d.status]}{d.clientName ? ` · ${d.clientName}` : ''}</span></li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {warnings.map((w) => (
            <div key={w} className="form-advisory-item">
              <IconWarning /> <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      <form id="article-form" className="form-grid" onSubmit={submit}>
        <label className="field field--full">
          <span>Title *</span>
          <input value={form.title} onChange={set('title')} placeholder="e.g. How to Scale Your Content Strategy" />
        </label>

        <label className="field">
          <span>Client *</span>
          <select value={form.clientId} onChange={onClientChange}>
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
          {suggestions.length > 0 && (
            <div className="suggest-row">
              <span className="suggest-label">Suggested</span>
              {suggestions.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  className={`suggest-chip ${String(form.assignedWriterId) === String(s.id) ? 'suggest-chip--active' : ''}`}
                  onClick={() => setForm((f) => ({ ...f, assignedWriterId: String(s.id) }))}
                  title={`${s.reason} · ${s.active} active`}
                >
                  {s.name}
                  <span className="suggest-meta">{s.active}</span>
                </button>
              ))}
            </div>
          )}
        </label>

        <label className="field">
          <span className="field-label-row">
            Deadline
            <button type="button" className="field-suggest" onClick={suggestDeadline}>Suggest</button>
          </span>
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
