import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge.jsx';
import Stepper from './Stepper.jsx';
import Timeline from './Timeline.jsx';
import LinkInputs from './LinkInputs.jsx';
import { api } from '../api/client.js';
import { useToast } from './Toast.jsx';
import { formatDate, formatTTW, ttwDisplay, isOverdue } from '../lib/utils.js';
import { IconArrowLeft, IconArrowRight, IconExternal, IconCheck } from '../lib/icons.jsx';

// Which buttons appear, given the current status and the viewer's role.
function getActions(status, role) {
  const action = (label, to, variant = 'primary') => ({ label, to, variant });
  if (status === 'BRIEF_PENDING') return [action('Start Writing', 'WRITING')];
  if (status === 'WRITING') return [action('Submit for Review', 'REVIEW')];
  if (status === 'REVIEW') {
    if (role === 'ADMIN' || role === 'TEAM_LEADER') {
      return [
        action('Send Back to Writing', 'WRITING', 'ghost'),
        action('Mark as Complete', 'COMPLETED', 'success'),
      ];
    }
    return [action('Back to Writing', 'WRITING', 'ghost')];
  }
  return [];
}

function Meta({ label, value, danger }) {
  return (
    <div className="meta-item">
      <span className="meta-label">{label}</span>
      <span className={`meta-value ${danger ? 'meta-value--danger' : ''}`}>{value ?? '—'}</span>
    </div>
  );
}

export default function ArticleDetail({ article, role, onChange, backTo, backLabel = 'Content' }) {
  const toast = useToast();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [writers, setWriters] = useState([]);
  const [reassignTo, setReassignTo] = useState('');
  const [linkDraft, setLinkDraft] = useState(article.referenceLinks?.length ? article.referenceLinks : ['']);
  const [ttwInput, setTtwInput] = useState(article.ttwManual ? String(article.ttwActualMinutes) : '');

  useEffect(() => {
    if (role === 'ADMIN' || role === 'TEAM_LEADER') api.listWriters().then(setWriters).catch(() => {});
  }, [role]);

  const overdue = isOverdue(article);
  const actions = getActions(article.status, role);
  const reviewByAdmin = article.status === 'REVIEW' && (role === 'ADMIN' || role === 'TEAM_LEADER');

  async function changeStatus(to) {
    setBusy(true);
    try {
      const updated = await api.setStatus(article.id, to, note);
      setNote('');
      onChange(updated);
      toast.success('Status updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function reassign() {
    if (!reassignTo) return;
    setBusy(true);
    try {
      const updated = await api.updateArticle(article.id, { assignedWriterId: Number(reassignTo) });
      onChange(updated);
      setReassignTo('');
      toast.success('Writer reassigned');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveLinks() {
    setBusy(true);
    try {
      const updated = await api.setLinks(article.id, linkDraft.map((s) => s.trim()).filter(Boolean));
      onChange(updated);
      toast.success('Reference links saved');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveTimeTaken(useAuto) {
    setBusy(true);
    try {
      const updated = await api.setTimeTaken(article.id, useAuto ? null : ttwInput);
      onChange(updated);
      if (useAuto) setTtwInput('');
      toast.success(useAuto ? 'Reverted to auto-tracked time' : 'Time taken updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="detail">
      <Link to={backTo} className="back-link"><IconArrowLeft /> {backLabel}</Link>

      <div className="detail-head">
        <div className="detail-title-row">
          <h1>{article.title}</h1>
          {overdue && <span className="overdue-tag">Overdue</span>}
        </div>
        <StatusBadge status={article.status} size="lg" />
      </div>

      <div className="card">
        <h2 className="card-title">Update Status</h2>
        {article.status === 'COMPLETED' ? (
          <p className="done-banner"><IconCheck /> This article is marked complete.</p>
        ) : (
          <>
            <div className="action-row">
              {actions.map((a) => (
                <button
                  key={a.to + a.label}
                  type="button"
                  className={`btn btn--${a.variant}`}
                  disabled={busy}
                  onClick={() => changeStatus(a.to)}
                >
                  {a.variant === 'ghost' && <IconArrowLeft />}
                  {a.label}
                  {a.variant !== 'ghost' && <IconArrowRight />}
                </button>
              ))}
            </div>
            <label className="field">
              <span>
                Add a note — optional
                {reviewByAdmin && ' · this is where feedback goes when you send it back'}
              </span>
              <textarea
                rows="3"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Leave a note for the activity history…"
              />
            </label>
          </>
        )}
      </div>

      <div className="card detail-meta">
        <Meta label="Client" value={article.clientName} />
        <Meta label="Type" value={article.typeName} />
        <Meta label="Deadline" value={formatDate(article.deadline)} danger={overdue} />
        {article.wordCountTarget != null && <Meta label="Word count" value={`${article.wordCountTarget} words`} />}
        {article.ttwTargetMinutes != null && <Meta label="TTW target" value={formatTTW(article.ttwTargetMinutes)} />}
        {article.status === 'COMPLETED' && <Meta label="Time taken" value={ttwDisplay(article)} />}
        <Meta label="Assigned to" value={`${article.writerName || '—'}${article.writerRole === 'TEAM_LEADER' ? ' (TL)' : article.writerRole === 'ADMIN' ? ' (Admin)' : ''}`} />
        <Meta label="Created by" value={article.createdByName} />
      </div>

      {article.briefNotes && (
        <div className="card">
          <h2 className="card-title">Brief Notes</h2>
          <p className="brief-notes">{article.briefNotes}</p>
        </div>
      )}

      <div className="card">
        <h2 className="card-title">Progress</h2>
        <Stepper status={article.status} />
      </div>

      {(role === 'ADMIN' || role === 'TEAM_LEADER') && (
        <div className="card">
          <h2 className="card-title">Assignee</h2>
          <p className="reassign-current">
            Currently: <strong>{article.writerName}</strong>
            {article.writerRole === 'TEAM_LEADER' && <span className="role-chip role-chip--tl">TL</span>}
            {article.writerRole === 'ADMIN' && <span className="role-chip role-chip--admin">Admin</span>}
          </p>
          <div className="reassign-row">
            <select value={reassignTo} onChange={(e) => setReassignTo(e.target.value)}>
              <option value="">Reassign to…</option>
              <optgroup label="Team Leaders">
                {writers.filter((w) => w.role === 'TEAM_LEADER' && w.id !== article.assignedWriterId)
                  .map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </optgroup>
              <optgroup label="Writers">
                {writers.filter((w) => w.role === 'WRITER' && w.id !== article.assignedWriterId)
                  .map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </optgroup>
            </select>
            <button type="button" className="btn btn--ghost" disabled={busy || !reassignTo} onClick={reassign}>
              Reassign
            </button>
          </div>
        </div>
      )}

      {article.status !== 'BRIEF_PENDING' && (
        <div className="card">
          <h2 className="card-title">Time taken</h2>
          <p className="muted ttw-note">
            {article.ttwManual ? 'Entered manually.' : 'Auto-tracked from time spent in Writing.'}{' '}
            Current: <strong>{formatTTW(article.ttwActualMinutes)}</strong>
            {article.ttwTargetMinutes != null && <> · target {formatTTW(article.ttwTargetMinutes)}</>}
          </p>
          <div className="ttw-row">
            <input
              type="number"
              min="0"
              value={ttwInput}
              onChange={(e) => setTtwInput(e.target.value)}
              placeholder="Enter minutes, e.g. 95"
            />
            <button type="button" className="btn btn--primary" disabled={busy || ttwInput === ''} onClick={() => saveTimeTaken(false)}>
              Save
            </button>
            {article.ttwManual && (
              <button type="button" className="btn btn--ghost" disabled={busy} onClick={() => saveTimeTaken(true)}>
                Use automatic
              </button>
            )}
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="card-title">Reference links</h2>
        {article.referenceLinks?.length > 0 ? (
          <ul className="ref-link-list">
            {article.referenceLinks.map((link, i) => (
              <li key={i}>
                <a href={link} target="_blank" rel="noreferrer" className="doc-link">
                  <IconExternal /> <span className="ref-link-text">{link}</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No links yet — add the brief, a client reference, or the working doc.</p>
        )}
        <LinkInputs value={linkDraft} onChange={setLinkDraft} placeholder="Paste any link — brief, client reference, working doc…" />
        <button type="button" className="btn btn--primary btn--sm" disabled={busy} onClick={saveLinks}>Save links</button>
      </div>

      <div className="card">
        <h2 className="card-title">Activity History</h2>
        <Timeline entries={article.activity} />
      </div>
    </div>
  );
}
