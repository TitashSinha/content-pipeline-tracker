import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import StatusBadge from '../../components/StatusBadge'
import Stepper from '../../components/Stepper'
import TimelineEntry from '../../components/TimelineEntry'
import { apiFetch } from '../../api/client'
import { formatDate, isOverdue } from '../../lib/utils'
import { STATUSES } from '../../lib/constants'

// ─── Constants ────────────────────────────────────────────────────────────────

// Forward progression — null means already at the end
const NEXT_STATUS = {
  BRIEF_PENDING: 'WRITING',
  WRITING:       'REVIEW',
  REVIEW:        'REVISION',
  REVISION:      'COMPLETED',
  COMPLETED:     null,
}

// Backward progression — null means already at the start
const PREV_STATUS = {
  BRIEF_PENDING: null,
  WRITING:       'BRIEF_PENDING',
  REVIEW:        'WRITING',
  REVISION:      'REVIEW',
  COMPLETED:     'REVISION',
}

const FORWARD_LABEL = {
  BRIEF_PENDING: 'Start Writing',
  WRITING:       'Submit for Review',
  REVIEW:        'Begin Revision',
  REVISION:      'Mark as Completed',
}

const BACK_LABEL = {
  WRITING:   '← Back to Brief Pending',
  REVIEW:    '← Back to Writing',
  REVISION:  '← Back to Review',
  COMPLETED: '← Back to Revision',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WriterArticlePage() {
  const { id } = useParams()

  const [article,    setArticle]    = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [pageError,  setPageError]  = useState('')

  // Status update
  const [note,       setNote]       = useState('')
  const [saving,     setSaving]     = useState(false)
  const [saveError,  setSaveError]  = useState('')

  // Google Doc link
  const [docLink,    setDocLink]    = useState('')
  const [savingDoc,  setSavingDoc]  = useState(false)
  const [docError,   setDocError]   = useState('')
  const [docSaved,   setDocSaved]   = useState(false)

  async function loadArticle() {
    try {
      const data = await apiFetch(`/api/articles/${id}`)
      setArticle(data)
      setDocLink(data.googleDocLink || '')
    } catch (err) {
      setPageError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadArticle() }, [id])

  async function handleMove(targetStatus) {
    if (!targetStatus) return
    setSaving(true)
    setSaveError('')
    try {
      await apiFetch(`/api/articles/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: targetStatus, note: note.trim() || undefined }),
      })
      setNote('')
      await loadArticle()
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDocSave() {
    if (!docLink.trim()) return
    setSavingDoc(true)
    setDocError('')
    setDocSaved(false)
    try {
      await apiFetch(`/api/articles/${id}/doc`, {
        method: 'PATCH',
        body: JSON.stringify({ googleDocLink: docLink.trim() }),
      })
      setDocSaved(true)
      await loadArticle()
    } catch (err) {
      setDocError(err.message)
    } finally {
      setSavingDoc(false)
    }
  }

  // ── Render states ──────────────────────────────────────────────────────────

  if (loading)   return <Layout><p className="state-msg">Loading article…</p></Layout>
  if (pageError) return <Layout><p className="state-msg state-msg--error">{pageError}</p></Layout>
  if (!article)  return <Layout><p className="state-msg">Article not found.</p></Layout>

  const overdue    = isOverdue(article)
  const nextStatus = NEXT_STATUS[article.status]
  const prevStatus = PREV_STATUS[article.status]
  const showDoc    = article.status !== 'BRIEF_PENDING'

  return (
    <Layout>
      {/* Back navigation */}
      <Link to="/writer" className="back-link">← My Content</Link>

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
          <span className="detail-meta-label">Assigned by</span>
          <span>{article.createdBy.name}</span>
        </div>
      </div>

      {/* Progress stepper */}
      <div className="detail-section">
        <h3 className="section-heading">Progress</h3>
        <Stepper currentStatus={article.status} />
      </div>

      {/* Status actions — shown whenever there is at least one direction to move */}
      {(nextStatus || prevStatus) && (
        <div className="detail-section">
          <h3 className="section-heading">Update Status</h3>

          {article.status === 'COMPLETED' && (
            <p className="completed-msg" style={{ marginBottom: '16px' }}>✓ This article is marked complete</p>
          )}

          {/* Buttons first — the note is secondary */}
          <div className="status-btn-row">
            {prevStatus && (
              <button
                className="btn-go-back"
                onClick={() => handleMove(prevStatus)}
                disabled={saving}
              >
                {saving ? '…' : BACK_LABEL[article.status]}
              </button>
            )}
            {nextStatus && (
              <button
                className="btn-primary btn-status"
                onClick={() => handleMove(nextStatus)}
                disabled={saving}
              >
                {saving ? 'Updating…' : `${FORWARD_LABEL[article.status]} →`}
              </button>
            )}
          </div>

          {/* Note — clearly secondary, after the action buttons */}
          <div className="field" style={{ marginTop: '16px' }}>
            <label className="field-label field-label--optional" htmlFor="status-note">
              Add a note <span className="field-optional">(optional)</span>
            </label>
            <textarea
              id="status-note"
              className="field-input field-textarea"
              placeholder="Describe what changed, any blockers, context for the team…"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={saving}
            />
          </div>

          {saveError && <p className="form-error" style={{ marginTop: '8px' }}>{saveError}</p>}
        </div>
      )}

      {/* Google Doc link */}
      {showDoc && (
        <div className="detail-section">
          <h3 className="section-heading">Google Doc Link</h3>
          {article.googleDocLink && (
            <a
              href={article.googleDocLink}
              target="_blank"
              rel="noreferrer"
              className="doc-link-existing"
            >
              {article.googleDocLink}
            </a>
          )}
          <div className="doc-link-row">
            <input
              className="field-input"
              type="url"
              placeholder="https://docs.google.com/…"
              value={docLink}
              onChange={(e) => { setDocLink(e.target.value); setDocSaved(false) }}
              disabled={savingDoc}
            />
            <button
              className="btn-secondary"
              onClick={handleDocSave}
              disabled={savingDoc || !docLink.trim()}
            >
              {savingDoc ? 'Saving…' : article.googleDocLink ? 'Update' : 'Save'}
            </button>
          </div>
          {docError && <p className="form-error" style={{ marginTop: '8px' }}>{docError}</p>}
          {docSaved  && <p className="doc-saved-msg">✓ Link saved</p>}
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
