import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge.jsx';
import Stepper from './Stepper.jsx';
import Timeline from './Timeline.jsx';
import Comments from './Comments.jsx';
import LinkInputs from './LinkInputs.jsx';
import { api } from '../api/client.js';
import { useToast } from './Toast.jsx';
import { Button, Card, CardTitle } from './ui/index.js';
import { formatDate, formatTTW, formatDateTime, ttwDisplay, isOverdue } from '../lib/utils.js';
import { getStatusActions } from '../lib/workflow.js';
import { IconArrowLeft, IconArrowRight, IconExternal, IconCheck, IconPause, IconPlay, IconNote, IconEye, IconEyeOff } from '../lib/icons.jsx';

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
  // FEATURE: Private writer notes + Submission checklist (Phase 3)
  const [notesDraft, setNotesDraft] = useState(article.writerNotes ?? '');
  const [savedNotes, setSavedNotes] = useState(article.writerNotes ?? '');
  const [checks, setChecks] = useState({ brief: false, wordCount: false });

  useEffect(() => {
    if (role === 'ADMIN' || role === 'TEAM_LEADER') api.listWriters().then(setWriters).catch(() => {});
  }, [role]);

  const overdue = isOverdue(article);
  const actions = getStatusActions(article.status, role);
  const reviewByAdmin = article.status === 'REVIEW' && (role === 'ADMIN' || role === 'TEAM_LEADER');
  const isWriting = article.status === 'WRITING';
  const paused = isWriting && !!article.pausedAt;

  // FEATURE: Submission checklist — advisory pre-Review reminders. Auto items
  // reflect the article's state; manual items are self-certified ticks. Never
  // blocks submit; it's a nudge, not a gate.
  const checklist = isWriting
    ? [
        { key: 'links', label: 'Reference link or working doc added', done: (article.referenceLinks?.length || 0) > 0, auto: true },
        article.briefNotes && { key: 'brief', label: 'Brief reviewed', done: checks.brief, auto: false },
        article.wordCountTarget != null && { key: 'wordCount', label: `Meets word-count target (${article.wordCountTarget} words)`, done: checks.wordCount, auto: false },
        { key: 'time', label: 'Time logged in Writing', done: (article.ttwActualMinutes ?? 0) > 0, auto: true },
      ].filter(Boolean)
    : [];
  const checklistDone = checklist.filter((c) => c.done).length;

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

  async function toggleFollow() {
    setBusy(true);
    try {
      const res = article.isFollowing ? await api.unfollowArticle(article.id) : await api.followArticle(article.id);
      onChange({ ...article, isFollowing: res.isFollowing, followerCount: res.followerCount });
      toast.success(res.isFollowing ? 'Watching this piece' : 'Stopped watching');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function togglePause() {
    setBusy(true);
    try {
      const updated = article.pausedAt
        ? await api.resumeWriting(article.id)
        : await api.pauseWriting(article.id);
      onChange(updated);
      toast.success(updated.pausedAt ? 'Writing paused — the clock is stopped' : 'Back to writing');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveNotes() {
    setBusy(true);
    try {
      const updated = await api.setWriterNotes(article.id, notesDraft);
      onChange(updated);
      setSavedNotes(notesDraft);
      toast.success('Notes saved');
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
        <div className="detail-head-right">
          {'isFollowing' in article && (
            <Button
              variant="ghost"
              size="sm"
              className={article.isFollowing ? 'watch-btn--on' : ''}
              disabled={busy}
              onClick={toggleFollow}
              title={article.isFollowing ? 'Stop watching' : 'Watch for updates'}
            >
              {article.isFollowing ? <IconEye /> : <IconEyeOff />}
              {article.isFollowing ? 'Watching' : 'Watch'}
              {article.followerCount > 0 && <span className="watch-count">{article.followerCount}</span>}
            </Button>
          )}
          <StatusBadge status={article.status} size="lg" />
        </div>
      </div>

      {isWriting && (
        <Card className={`writing-session ${paused ? 'writing-session--paused' : ''}`}>
          <div className="writing-session-info">
            <span className={`session-dot ${paused ? 'session-dot--paused' : 'session-dot--live'}`} />
            <div>
              <CardTitle as="h2">{paused ? 'Writing paused' : 'Writing in progress'}</CardTitle>
              <p className="text-muted text-[.8rem]">
                {paused
                  ? <>Paused {formatDateTime(article.pausedAt)} — your time-to-write clock is stopped.</>
                  : <>The clock is running. Pause it when you step away so your TTW stays accurate.</>}
              </p>
            </div>
          </div>
          <Button variant={paused ? 'primary' : 'ghost'} disabled={busy} onClick={togglePause}>
            {paused ? <><IconPlay /> Resume writing</> : <><IconPause /> Pause writing</>}
          </Button>
        </Card>
      )}

      {checklist.length > 0 && (
        <Card className="submission-checklist">
          <div className="checklist-head">
            <CardTitle as="h2">Before you submit</CardTitle>
            <span className="checklist-progress">{checklistDone}/{checklist.length} ready</span>
          </div>
          <ul className="checklist">
            {checklist.map((item) => (
              <li key={item.key} className={`checklist-item ${item.done ? 'checklist-item--done' : ''}`}>
                {item.auto ? (
                  <span className={`check-box check-box--auto ${item.done ? 'check-box--on' : ''}`} aria-hidden="true">
                    {item.done && <IconCheck />}
                  </span>
                ) : (
                  <button
                    type="button"
                    className={`check-box ${item.done ? 'check-box--on' : ''}`}
                    onClick={() => setChecks((c) => ({ ...c, [item.key]: !c[item.key] }))}
                    aria-pressed={item.done}
                    aria-label={item.label}
                  >
                    {item.done && <IconCheck />}
                  </button>
                )}
                <span className="checklist-label">{item.label}</span>
                {!item.auto && <span className="checklist-tag">self-check</span>}
              </li>
            ))}
          </ul>
          <p className="text-muted text-[.8rem] checklist-foot">A reminder, not a gate — you can submit whenever you're ready.</p>
        </Card>
      )}

      <Card>
        <CardTitle as="h2">Update Status</CardTitle>
        {article.status === 'COMPLETED' && (
          <p className="done-banner"><IconCheck /> This article is marked complete.</p>
        )}
        {actions.length > 0 && (
          <>
            <div className="action-row">
              {actions.map((a) => (
                <Button
                  key={a.to + a.label}
                  variant={a.variant}
                  disabled={busy}
                  onClick={() => changeStatus(a.to)}
                >
                  {a.variant === 'ghost' && <IconArrowLeft />}
                  {a.label}
                  {a.variant !== 'ghost' && <IconArrowRight />}
                </Button>
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
      </Card>

      <Card className="detail-meta">
        <Meta label="Client" value={article.clientName} />
        <Meta label="Type" value={article.typeName} />
        <Meta label="Deadline" value={formatDate(article.deadline)} danger={overdue} />
        {article.wordCountTarget != null && <Meta label="Word count" value={`${article.wordCountTarget} words`} />}
        {article.ttwTargetMinutes != null && <Meta label="TTW target" value={formatTTW(article.ttwTargetMinutes)} />}
        {article.status === 'COMPLETED' && <Meta label="Time taken" value={ttwDisplay(article)} />}
        <Meta label="Assigned to" value={`${article.writerName || '—'}${article.writerRole === 'TEAM_LEADER' ? ' (TL)' : article.writerRole === 'ADMIN' ? ' (Admin)' : ''}`} />
        <Meta label="Created by" value={article.createdByName} />
      </Card>

      {article.briefNotes && (
        <Card>
          <CardTitle as="h2">Brief Notes</CardTitle>
          <p className="brief-notes">{article.briefNotes}</p>
        </Card>
      )}

      {/* FEATURE: Private writer notes — only present in the payload for the assignee. */}
      {article.isMine && (
        <Card className="private-notes">
          <CardTitle as="h2"><IconNote /> Private notes</CardTitle>
          <p className="text-muted text-[.8rem]">A personal scratchpad for this piece. Only you can see this — not admins or team leaders.</p>
          <textarea
            rows="4"
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            placeholder="Outline, research links, things to fix before submitting…"
          />
          <div className="private-notes-foot">
            <Button size="sm" disabled={busy || notesDraft === savedNotes} onClick={saveNotes}>Save notes</Button>
            {notesDraft !== savedNotes && <span className="text-muted text-[.8rem]">Unsaved changes</span>}
          </div>
        </Card>
      )}

      <Card>
        <CardTitle as="h2">Progress</CardTitle>
        <Stepper status={article.status} />
      </Card>

      {(role === 'ADMIN' || role === 'TEAM_LEADER') && (
        <Card>
          <CardTitle as="h2">Assignee</CardTitle>
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
            <Button variant="ghost" disabled={busy || !reassignTo} onClick={reassign}>Reassign</Button>
          </div>
        </Card>
      )}

      {article.status !== 'BRIEF_PENDING' && (
        <Card>
          <CardTitle as="h2">Time taken</CardTitle>
          <p className="text-muted ttw-note">
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
            <Button disabled={busy || ttwInput === ''} onClick={() => saveTimeTaken(false)}>Save</Button>
            {article.ttwManual && (
              <Button variant="ghost" disabled={busy} onClick={() => saveTimeTaken(true)}>Use automatic</Button>
            )}
          </div>
        </Card>
      )}

      <Card>
        <CardTitle as="h2">Reference links</CardTitle>
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
          <p className="text-muted">No links yet — add the brief, a client reference, or the working doc.</p>
        )}
        <LinkInputs value={linkDraft} onChange={setLinkDraft} placeholder="Paste any link — brief, client reference, working doc…" />
        <Button size="sm" disabled={busy} onClick={saveLinks}>Save links</Button>
      </Card>

      <Comments articleId={article.id} />

      <Card>
        <CardTitle as="h2">Activity History</CardTitle>
        <Timeline entries={article.activity} />
      </Card>
    </div>
  );
}
