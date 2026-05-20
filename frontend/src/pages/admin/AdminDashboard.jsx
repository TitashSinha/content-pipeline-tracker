import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import StatusBadge from '../../components/StatusBadge'
import ArticleForm from '../../components/admin/ArticleForm'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import { apiFetch } from '../../api/client'
import { formatDate, isOverdue } from '../../lib/utils'
import { STATUSES, STATUS_LABELS } from '../../lib/constants'

const PAGE_SIZE = 20

function exportToCSV(articles) {
  const headers = ['Title', 'Client', 'Article Type', 'Assigned Writer', 'Status', 'Deadline', 'Google Doc Link']
  const rows = articles.map(a => [
    a.title,
    a.client.name,
    a.articleType.name,
    a.assignedWriter.name,
    a.status,
    formatDate(a.deadline),
    a.googleDocLink || '',
  ])
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `content-export-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Stats sub-components ─────────────────────────────────────────────────────

function StatCard({ label, value, variant }) {
  return (
    <div className={`stat-card ${variant ? `stat-card--${variant}` : ''}`}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}

const WORKLOAD_PREVIEW = 4

function WorkloadRow({ w, activeCount }) {
  return (
    <div className="workload-row">
      <span className="workload-name">{w.writerName}</span>
      <div className="workload-bar-wrap">
        <div
          className="workload-bar"
          style={{ width: `${Math.min(100, (w.activeArticles / activeCount) * 100)}%` }}
        />
      </div>
      <span className="workload-count">{w.activeArticles}</span>
    </div>
  )
}

function WorkloadModal({ writers, activeCount, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Writer Workload</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="workload-list">
          {writers.map(w => (
            <WorkloadRow key={w.writerId} w={w} activeCount={activeCount} />
          ))}
        </div>
      </div>
    </div>
  )
}

function DashboardStats({ articles, dashStats }) {
  const [showWorkloadModal, setShowWorkloadModal] = useState(false)

  const statusCounts = useMemo(() => {
    const counts = {}
    STATUSES.forEach(s => { counts[s] = 0 })
    articles.forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++ })
    return counts
  }, [articles])

  const activeCount      = articles.filter(a => a.status !== 'COMPLETED').length
  const overdueCount     = articles.filter(isOverdue).length
  const completionsMonth = dashStats?.completionsThisMonth ?? '—'
  const byWriter         = useMemo(() =>
    (dashStats?.byWriter ?? []).sort((a, b) => b.activeArticles - a.activeArticles),
  [dashStats])

  const previewWriters = byWriter.slice(0, WORKLOAD_PREVIEW)
  const hasMore        = byWriter.length > WORKLOAD_PREVIEW

  return (
    <div className="dashboard-stats">
      {/* Top stat cards */}
      <div className="stat-cards">
        <StatCard label="Active" value={activeCount} />
        <StatCard label="Overdue" value={overdueCount} variant={overdueCount > 0 ? 'warning' : null} />
        <StatCard label="Completed this month" value={completionsMonth} variant="success" />
      </div>

      <div className="dashboard-lower">
        {/* Status breakdown */}
        <div className="dash-panel">
          <h4 className="dash-panel-title">By Stage</h4>
          <div className="stage-breakdown">
            {STATUSES.map(s => (
              <div key={s} className="stage-row">
                <StatusBadge status={s} />
                <span className="stage-count">{statusCounts[s]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Writer workload */}
        <div className="dash-panel">
          <h4 className="dash-panel-title">Writer Workload</h4>
          {byWriter.length === 0 ? (
            <p className="dash-empty">No active assignments.</p>
          ) : (
            <>
              <div className="workload-list">
                {previewWriters.map(w => (
                  <WorkloadRow key={w.writerId} w={w} activeCount={activeCount} />
                ))}
              </div>
              {hasMore && (
                <button className="workload-show-more" onClick={() => setShowWorkloadModal(true)}>
                  + {byWriter.length - WORKLOAD_PREVIEW} more writers
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {showWorkloadModal && (
        <WorkloadModal
          writers={byWriter}
          activeCount={activeCount}
          onClose={() => setShowWorkloadModal(false)}
        />
      )}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [articles,     setArticles]     = useState([])
  const [writers,      setWriters]      = useState([])
  const [clients,      setClients]      = useState([])
  const [articleTypes, setArticleTypes] = useState([])
  const [dashStats,    setDashStats]    = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')

  // Modal state — null means closed
  const [formModal,    setFormModal]    = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [confirming,   setConfirming]   = useState(false)

  // Filter state
  const [search,        setSearch]        = useState('')
  const [filterStatus,  setFilterStatus]  = useState('')
  const [filterWriter,  setFilterWriter]  = useState('')
  const [currentPage,   setCurrentPage]   = useState(1)

  // ── Data loading ────────────────────────────────────────────────────────────

  async function loadAll() {
    try {
      const [arts, wrs, cls, types, stats] = await Promise.all([
        apiFetch('/api/articles'),
        apiFetch('/api/users/writers'),
        apiFetch('/api/clients'),
        apiFetch('/api/article-types'),
        apiFetch('/api/dashboard'),
      ])
      setArticles(arts)
      setWriters(wrs)
      setClients(cls)
      setArticleTypes(types)
      setDashStats(stats)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  // ── Filtered list (client-side) ─────────────────────────────────────────────

  const filtered = useMemo(() => {
    setCurrentPage(1)
    return articles.filter(a => {
      if (search       && !a.title.toLowerCase().includes(search.toLowerCase())) return false
      if (filterStatus && a.status !== filterStatus)                              return false
      if (filterWriter && String(a.assignedWriter.id) !== filterWriter)           return false
      return true
    })
  }, [articles, search, filterStatus, filterWriter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const overdueCount = useMemo(() => articles.filter(isOverdue).length, [articles])

  // ── CRUD handlers ───────────────────────────────────────────────────────────

  async function handleSave(data) {
    if (formModal.mode === 'create') {
      await apiFetch('/api/articles', { method: 'POST', body: JSON.stringify(data) })
    } else {
      await apiFetch(`/api/articles/${formModal.article.id}`, { method: 'PUT', body: JSON.stringify(data) })
    }
    setFormModal(null)
    await loadAll()
  }

  async function handleDelete() {
    setConfirming(true)
    try {
      await apiFetch(`/api/articles/${deleteTarget.id}`, { method: 'DELETE' })
      setDeleteTarget(null)
      await loadAll()
    } finally {
      setConfirming(false)
    }
  }

  function clearFilters() {
    setSearch('')
    setFilterStatus('')
    setFilterWriter('')
  }

  const hasFilters = search || filterStatus || filterWriter

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Layout>
      {/* Page header */}
      <div className="page-header page-header--row">
        <div>
          <h2 className="page-title">Content</h2>
          <p className="page-subtitle">
            {articles.length} total
            {overdueCount > 0 && <span className="overdue-count"> · {overdueCount} overdue</span>}
          </p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={loadAll} disabled={loading} title="Refresh">
            ↻ Refresh
          </button>
          <button
            className="btn-secondary"
            onClick={() => exportToCSV(filtered)}
            disabled={filtered.length === 0}
            title="Export current view as CSV"
          >
            ↓ Export CSV
          </button>
          <button className="btn-primary" onClick={() => setFormModal({ mode: 'create', article: null })}>
            + New Content
          </button>
        </div>
      </div>

      {/* Dashboard stats */}
      {!loading && !error && (
        <DashboardStats articles={articles} dashStats={dashStats} />
      )}

      {/* Search and filter bar */}
      <div className="filter-bar">
        <input
          className="field-input filter-search"
          type="search"
          placeholder="Search by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="field-input filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <select
          className="field-input filter-select"
          value={filterWriter}
          onChange={(e) => setFilterWriter(e.target.value)}
        >
          <option value="">All writers</option>
          {writers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        {hasFilters && (
          <button className="btn-clear" onClick={clearFilters}>Clear</button>
        )}
      </div>

      {/* Main content */}
      {loading ? (
        <p className="state-msg">Loading…</p>
      ) : error ? (
        <p className="state-msg state-msg--error">{error}</p>
      ) : filtered.length === 0 ? (
        <p className="state-msg">
          {hasFilters ? 'No articles match your filters.' : 'No articles yet. Create one to get started.'}
        </p>
      ) : (
        <div className="table-wrap">
          <table className="article-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Writer</th>
                <th>Client</th>
                <th>Type</th>
                <th>Deadline</th>
                <th>Status</th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((a) => {
                const overdue = isOverdue(a)
                return (
                  <tr key={a.id} className={overdue ? 'row--overdue' : ''}>
                    <td data-label="Title">
                      <div className="td-title">
                        <Link className="article-title-link" to={`/admin/articles/${a.id}`}>
                          {a.title}
                        </Link>
                        {overdue && <span className="overdue-tag">Overdue</span>}
                      </div>
                    </td>
                    <td data-label="Writer">{a.assignedWriter.name}</td>
                    <td data-label="Client">{a.client.name}</td>
                    <td data-label="Type">{a.articleType.name}</td>
                    <td data-label="Deadline" className={overdue ? 'td-date--overdue' : ''}>
                      {formatDate(a.deadline)}
                    </td>
                    <td data-label="Status"><StatusBadge status={a.status} /></td>
                    <td className="td-actions">
                      <button
                        className="btn-action"
                        onClick={() => setFormModal({ mode: 'edit', article: a })}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-action btn-action--danger"
                        onClick={() => setDeleteTarget(a)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="btn-secondary pagination-btn"
              onClick={() => setCurrentPage(p => p - 1)}
              disabled={currentPage === 1}
            >
              ← Prev
            </button>
            <span className="pagination-info">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="btn-secondary pagination-btn"
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage === totalPages}
            >
              Next →
            </button>
          </div>
        )}
        </div>
      )}

      {/* Modals */}
      {formModal && (
        <ArticleForm
          mode={formModal.mode}
          article={formModal.article}
          writers={writers}
          clients={clients}
          articleTypes={articleTypes}
          onSave={handleSave}
          onClose={() => setFormModal(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Article"
          message={`Are you sure you want to delete "${deleteTarget.title}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          confirming={confirming}
        />
      )}
    </Layout>
  )
}
