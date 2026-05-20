import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import StatusBadge from '../../components/StatusBadge'
import { apiFetch } from '../../api/client'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUSES = ['BRIEF_PENDING', 'WRITING', 'REVIEW', 'REVISION', 'COMPLETED']

const STATUS_LABELS = {
  BRIEF_PENDING: 'Brief Pending',
  WRITING:       'Writing',
  REVIEW:        'Review',
  REVISION:      'Revision',
  COMPLETED:     'Completed',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(str) {
  if (!str) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(str))
}

function formatDateTime(str) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(str))
}

function isOverdue(article) {
  if (!article.deadline || article.status === 'COMPLETED') return false
  return new Date(article.deadline) < new Date()
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Stepper({ currentStatus }) {
  const currentStep = STATUSES.indexOf(currentStatus)
  return (
    <div className="stepper">
      {STATUSES.map((s, i) => (
        <div
          key={s}
          className={[
            'stepper-step',
            i < currentStep  ? 'step--done'    : '',
            i === currentStep ? 'step--current' : '',
          ].join(' ')}
        >
          <div className="stepper-dot-row">
            <div className="stepper-dot">
              {i < currentStep && <span>✓</span>}
            </div>
            {i < STATUSES.length - 1 && (
              <div className={`stepper-connector ${i < currentStep ? 'stepper-connector--done' : ''}`} />
            )}
          </div>
          <span className="stepper-label">{STATUS_LABELS[s]}</span>
        </div>
      ))}
    </div>
  )
}

function TimelineEntry({ log }) {
  return (
    <div className="timeline-entry">
      <div className="timeline-dot" />
      <div className="timeline-body">
        <div className="timeline-header">
          <span className="timeline-who">{log.changedBy.name}</span>
          <span className="timeline-when">{formatDateTime(log.createdAt)}</span>
        </div>
        <div className="timeline-change">
          {log.oldStatus ? (
            <>
              <StatusBadge status={log.oldStatus} />
              <span className="timeline-arrow">→</span>
              <StatusBadge status={log.newStatus} />
            </>
          ) : (
            <>
              <StatusBadge status={log.newStatus} />
              <span className="timeline-pill">created</span>
            </>
          )}
        </div>
        {log.note && <p className="timeline-note">"{log.note}"</p>}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminArticlePage() {
  const { id } = useParams()

  const [article,   setArticle]   = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [pageError, setPageError] = useState('')

  // Status update
  const [newStatus,  setNewStatus]  = useState('')
  const [note,       setNote]       = useState('')
  const [saving,     setSaving]     = useState(false)
  const [saveError,  setSaveError]  = useState('')
  const [saveOk,     setSaveOk]     = useState(false)

  async function loadArticle() {
    try {
      const data = await apiFetch(`/api/articles/${id}`)
      setArticle(data)
      setNewStatus(data.status)
    } catch (err) {
      setPageError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadArticle() }, [id])

  async function handleStatusSave() {
    if (!newStatus || newStatus === article.status) return
    setSaving(true)
    setSaveError('')
    setSaveOk(false)
    try {
      await apiFetch(`/api/articles/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus, note: note.trim() || undefined }),
      })
      setNote('')
      setSaveOk(true)
      await loadArticle()
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Render states ──────────────────────────────────────────────────────────

  if (loading)   return <Layout><p className="state-msg">Loading…</p></Layout>
  if (pageError) return <Layout><p className="state-msg state-msg--error">{pageError}</p></Layout>
  if (!article)  return <Layout><p className="state-msg">Article not found.</p></Layout>

  const overdue = isOverdue(article)

  return (
    <Layout>
      <Link to="/admin" className="back-link">← All Content</Link>

      {/* Article header */}
      <div className="article-detail-header">
        <div className="article-detail-title-row">
          <h2 className="article-detail-title">{article.title}</h2>
          <StatusBadge status={article.status} />
        </div>
        {overdue && <span className="overdue-tag" style={{ marginTop: '8px', display: 'inline-block' }}>Overdue</span>}
      </div>

      {/* Meta strip */}
      <div className="detail-meta">
        <div className="detail-meta-item">
          <span className="detail-meta-label">Client</span>
          <span>{article.client.name}</span>
        </div>
        <div className="detail-meta-item">
          <span className="detail-meta-label">Type</span>
          <span>{article.articleType.name}</span>
        </div>
        <div className="detail-meta-item">
          <span className="detail-meta-label">Deadline</span>
          <span className={overdue ? 'text-danger' : ''}>{formatDate(article.deadline)}</span>
        </div>
        <div className="detail-meta-item">
          <span className="detail-meta-label">Assigned to</span>
          <span>{article.assignedWriter.name}</span>
        </div>
        <div className="detail-meta-item">
          <span className="detail-meta-label">Created by</span>
          <span>{article.createdBy.name}</span>
        </div>
      </div>

      {/* Progress stepper */}
      <div className="detail-section">
        <h3 className="section-heading">Progress</h3>
        <Stepper currentStatus={article.status} />
      </div>

      {/* Admin status update */}
      <div className="detail-section">
        <h3 className="section-heading">Update Status</h3>
        <div className="admin-status-row">
          <select
            className="field-input"
            value={newStatus}
            onChange={(e) => { setNewStatus(e.target.value); setSaveOk(false) }}
            disabled={saving}
          >
            {STATUSES.map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <button
            className="btn-primary"
            onClick={handleStatusSave}
            disabled={saving || newStatus === article.status}
          >
            {saving ? 'Saving…' : 'Update'}
          </button>
        </div>
        <div className="field" style={{ marginTop: '12px' }}>
          <label className="field-label field-label--optional" htmlFor="admin-note">
            Note <span className="field-optional">(optional)</span>
          </label>
          <textarea
            id="admin-note"
            className="field-input field-textarea"
            placeholder="Add context for the team…"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={saving}
          />
        </div>
        {saveError && <p className="form-error" style={{ marginTop: '8px' }}>{saveError}</p>}
        {saveOk    && <p className="doc-saved-msg">✓ Status updated</p>}
      </div>

      {/* Google Doc link — read only for admin */}
      {article.googleDocLink && (
        <div className="detail-section">
          <h3 className="section-heading">Google Doc</h3>
          <a
            href={article.googleDocLink}
            target="_blank"
            rel="noreferrer"
            className="doc-link-existing"
          >
            {article.googleDocLink}
          </a>
        </div>
      )}

      {/* Activity timeline */}
      <div className="detail-section">
        <h3 className="section-heading">Activity History</h3>
        {article.activityLogs.length === 0 ? (
          <p className="state-msg" style={{ padding: '24px 0' }}>No activity recorded yet.</p>
        ) : (
          <div className="timeline">
            {article.activityLogs.map((log) => (
              <TimelineEntry key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
