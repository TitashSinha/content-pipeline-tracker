import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import StatusBadge from '../../components/StatusBadge'
import Stepper from '../../components/Stepper'
import TimelineEntry from '../../components/TimelineEntry'
import ArticleForm from '../../components/admin/ArticleForm'
import { apiFetch } from '../../api/client'
import { formatDate, isOverdue, computeTTWMinutes, formatTTW } from '../../lib/utils'
import { STATUSES, STATUS_LABELS } from '../../lib/constants'

export default function AdminArticlePage() {
  const { id } = useParams()

  const [article,      setArticle]      = useState(null)
  const [writers,      setWriters]      = useState([])
  const [clients,      setClients]      = useState([])
  const [articleTypes, setArticleTypes] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [pageError,    setPageError]    = useState('')

  // Status update
  const [newStatus, setNewStatus] = useState('')
  const [note,      setNote]      = useState('')
  const [saving,    setSaving]    = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveOk,    setSaveOk]    = useState(false)

  // Edit modal
  const [formModal, setFormModal] = useState(false)

  async function loadAll() {
    try {
      const [data, wrs, cls, types] = await Promise.all([
        apiFetch(`/api/articles/${id}`),
        apiFetch('/api/users/writers'),
        apiFetch('/api/clients'),
        apiFetch('/api/article-types'),
      ])
      setArticle(data)
      setNewStatus(data.status)
      setWriters(wrs)
      setClients(cls)
      setArticleTypes(types)
    } catch (err) {
      setPageError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [id])

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
      await loadAll()
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleEditSave(data) {
    await apiFetch(`/api/articles/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    setFormModal(false)
    await loadAll()
  }

  // ── Render states ─────────────────────────────────────────────────────────────

  if (loading)   return <Layout><p className="state-msg">Loading…</p></Layout>
  if (pageError) return <Layout><p className="state-msg state-msg--error">{pageError}</p></Layout>
  if (!article)  return <Layout><p className="state-msg">Article not found.</p></Layout>

  const overdue   = isOverdue(article)
  const ttwMins   = computeTTWMinutes(article.activityLogs)

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
        {article.wordCountTarget && (
          <div className="detail-meta-item">
            <span className="detail-meta-label">Word Count</span>
            <span>{article.wordCountTarget.toLocaleString()} words</span>
          </div>
        )}
        <div className="detail-meta-item">
          <span className="detail-meta-label">TTW</span>
          <span>{article.ttwTargetMinutes ? formatTTW(article.ttwTargetMinutes) : '—'}</span>
        </div>
        {ttwHours !== null && (
          <div className="detail-meta-item">
            <span className="detail-meta-label">Time Taken</span>
            <span className="detail-ttw">{formatTTW(ttwMins)}</span>
          </div>
        )}
        <div className="detail-meta-item">
          <span className="detail-meta-label">Assigned to</span>
          <span>{article.assignedWriter.name}</span>
        </div>
        <div className="detail-meta-item">
          <span className="detail-meta-label">Created by</span>
          <span>{article.createdBy.name}</span>
        </div>
      </div>

      {/* Edit button */}
      <div style={{ marginBottom: '16px' }}>
        <button className="btn-secondary" onClick={() => setFormModal(true)}>
          ✎ Edit Details
        </button>
      </div>

      {/* Brief notes */}
      {article.briefNotes && (
        <div className="detail-section">
          <h3 className="section-heading">Brief Notes</h3>
          <p className="brief-notes">{article.briefNotes}</p>
        </div>
      )}

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

      {/* Edit modal */}
      {formModal && (
        <ArticleForm
          mode="edit"
          article={article}
          writers={writers}
          clients={clients}
          articleTypes={articleTypes}
          onSave={handleEditSave}
          onClose={() => setFormModal(false)}
        />
      )}
    </Layout>
  )
}
