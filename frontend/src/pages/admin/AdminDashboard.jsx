import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import Loader from '../../components/Loader.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import Donut from '../../components/Donut.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Modal from '../../components/Modal.jsx';
import ArticleForm from '../../components/admin/ArticleForm.jsx';
import BatchAssignModal from '../../components/admin/BatchAssignModal.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import { useToast } from '../../components/Toast.jsx';
import { STATUSES, STATUS_LABELS } from '../../lib/constants.js';
import { formatDate, ttwDisplay, isOverdue, initials } from '../../lib/utils.js';
import {
  IconPlus, IconSearch, IconRefresh, IconDownload,
  IconEdit, IconTrash, IconExternal, IconSort, IconBatch, IconFilter,
} from '../../lib/icons.jsx';

const PAGE_SIZE = 20;

const STAGE_COLORS = {
  BRIEF_PENDING: '#8FC6D2',
  WRITING: '#F0B49E',
  REVIEW: '#E6C48C',
  COMPLETED: '#AFC3A2',
};

const SORTABLE = [
  { key: 'title', label: 'Title' },
  { key: 'writer', label: 'Writer' },
  { key: 'client', label: 'Client' },
  { key: 'deadline', label: 'Deadline' },
  { key: 'status', label: 'Status' },
];

const DATE_RANGES = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All Time' },
];

function inDateRange(article, range) {
  if (range === 'all') return true;
  const created = new Date(article.createdAt);
  const now = new Date();
  if (range === 'today') {
    return created.toDateString() === now.toDateString();
  }
  if (range === 'week') {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return created >= weekStart;
  }
  if (range === 'month') {
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }
  return true;
}

function sortValue(a, key) {
  switch (key) {
    case 'title': return a.title.toLowerCase();
    case 'writer': return (a.writerName || '').toLowerCase();
    case 'client': return (a.clientName || '').toLowerCase();
    case 'status': return STATUSES.indexOf(a.status);
    case 'deadline': return a.deadline ? new Date(a.deadline).getTime() : Infinity;
    default: return 0;
  }
}

const csvCell = (v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [dateRange, setDateRange] = useState(searchParams.get('range') || 'today');
  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    status: searchParams.get('status') || '',
    writer: searchParams.get('writer') || '',
    client: searchParams.get('client') || '',
  });
  const [sort, setSort] = useState({
    key: searchParams.get('sortKey') || 'deadline',
    dir: searchParams.get('sortDir') || 'asc',
  });
  const [page, setPage] = useState(1);
  const [formArticle, setFormArticle] = useState(undefined);
  const [showBatch, setShowBatch] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [delBusy, setDelBusy] = useState(false);
  const [showAllWorkload, setShowAllWorkload] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function loadAll() {
    const [articles, clients, writers, types, stats] = await Promise.all([
      api.listArticles(), api.listClients(), api.listWriters(), api.listTypes(), api.dashboard(),
    ]);
    setData({ articles, clients, writers, types, stats });
  }
  useEffect(() => { loadAll(); }, []);

  // Persist filter/range/sort in URL so the Back button restores them
  useEffect(() => {
    const p = {};
    if (filters.q) p.q = filters.q;
    if (filters.status) p.status = filters.status;
    if (filters.writer) p.writer = filters.writer;
    if (filters.client) p.client = filters.client;
    if (dateRange !== 'today') p.range = dateRange;
    if (sort.key !== 'deadline') p.sortKey = sort.key;
    if (sort.dir !== 'asc') p.sortDir = sort.dir;
    setSearchParams(p, { replace: true });
  }, [filters, dateRange, sort]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setPage(1); }, [filters, dateRange, sort]);

  const rangeFiltered = useMemo(() => {
    if (!data) return [];
    return data.articles.filter((a) => inDateRange(a, dateRange));
  }, [data, dateRange]);

  const filtered = useMemo(() => {
    const rows = rangeFiltered.filter((a) => {
      if (filters.q && !a.title.toLowerCase().includes(filters.q.toLowerCase())) return false;
      if (filters.status && a.status !== filters.status) return false;
      if (filters.writer && String(a.assignedWriterId) !== filters.writer) return false;
      if (filters.client && String(a.clientId) !== filters.client) return false;
      return true;
    });
    const mult = sort.dir === 'asc' ? 1 : -1;
    return rows.sort((a, b) => {
      const x = sortValue(a, sort.key);
      const y = sortValue(b, sort.key);
      if (x < y) return -1 * mult;
      if (x > y) return 1 * mult;
      return 0;
    });
  }, [rangeFiltered, filters, sort]);

  // Stats computed from the date-filtered set (before text/status filters)
  const periodStats = useMemo(() => {
    const now = new Date();
    const active = rangeFiltered.filter((a) => a.status !== 'COMPLETED');
    const overdue = active.filter((a) => a.deadline && new Date(a.deadline) < now);
    const done = rangeFiltered.filter((a) => a.status === 'COMPLETED');
    const byStage = { BRIEF_PENDING: 0, WRITING: 0, REVIEW: 0, COMPLETED: 0 };
    for (const a of rangeFiltered) byStage[a.status] = (byStage[a.status] || 0) + 1;
    return { active: active.length, overdue: overdue.length, done: done.length, byStage };
  }, [rangeFiltered]);

  if (!data) return <Loader full />;

  const { stats } = data;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const filterActive = filters.q || filters.status || filters.writer || filters.client;
  const busiest = Math.max(1, ...stats.workload.map((w) => w.active));

  const doneLabel = dateRange === 'today' ? 'Done today'
    : dateRange === 'week' ? 'Done this week'
    : dateRange === 'month' ? 'Done this month'
    : 'Done (all time)';

  function toggleSort(key) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
  }

  async function refresh() {
    setRefreshing(true);
    setDateRange('today');
    setFilters({ q: '', status: '', writer: '', client: '' });
    try { await loadAll(); toast.success('Dashboard refreshed'); } finally { setRefreshing(false); }
  }

  function exportCSV() {
    const headers = ['Title', 'Client', 'Type', 'Writer', 'Status', 'Deadline', 'Word Count Target', 'TTW', 'Reference Links'];
    const lines = [headers.join(',')];
    for (const a of filtered) {
      lines.push([
        a.title, a.clientName, a.typeName, a.writerName, STATUS_LABELS[a.status],
        a.deadline ? formatDate(a.deadline) : '', a.wordCountTarget ?? '',
        ttwDisplay(a), (a.referenceLinks || []).join(' | '),
      ].map(csvCell).join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `content-pipeline-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function confirmDelete() {
    setDelBusy(true);
    try {
      await api.deleteArticle(deleting.id);
      toast.success('Content deleted');
      setDeleting(null);
      await loadAll();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDelBusy(false);
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">All content across every writer and client.</p>
        </div>
        <div className="head-actions">
          <button type="button" className="btn btn--ghost" onClick={refresh} disabled={refreshing}>
            <IconRefresh className={refreshing ? 'spin' : ''} />
            <span className="hide-sm">{refreshing ? 'Refreshing…' : 'Refresh'}</span>
          </button>
          <button type="button" className="btn btn--ghost" onClick={exportCSV}>
            <IconDownload /> <span className="hide-sm">Export CSV</span>
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => setShowBatch(true)}>
            <IconBatch /> <span className="hide-sm">Batch Assign</span>
          </button>
          <button type="button" className="btn btn--primary" onClick={() => setFormArticle(null)}>
            <IconPlus /> New content
          </button>
        </div>
      </div>

      {/* Date range filter tabs */}
      <div className="date-range-bar">
        <IconFilter className="date-range-icon" />
        {DATE_RANGES.map((r) => (
          <button
            key={r.key}
            type="button"
            className={`date-range-tab ${dateRange === r.key ? 'date-range-tab--active' : ''}`}
            onClick={() => setDateRange(r.key)}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Stats + by-stage */}
      <div className="stats-row">
        <StatCard tone="blue" label="Active" value={periodStats.active} hint={dateRange === 'all' ? 'not yet completed' : `not completed · ${DATE_RANGES.find(r => r.key === dateRange)?.label}`} />
        <StatCard tone="amber" label="Overdue" value={periodStats.overdue} hint="past deadline" />
        <StatCard tone="green" label={doneLabel} value={periodStats.done} hint="status: completed" />

        <div className="card stage-panel">
          <h2 className="card-title">By Stage</h2>
          <div className="stage-panel-body">
            <Donut
              segments={STATUSES.map((s) => ({ value: periodStats.byStage[s] || 0, color: STAGE_COLORS[s] }))}
              onSegmentClick={(i) => {
                const s = STATUSES[i];
                setFilters((f) => ({ ...f, status: f.status === s ? '' : s }));
              }}
            />
            <ul className="stage-legend">
              {STATUSES.map((s) => (
                <li
                  key={s}
                  className={`legend-item${filters.status === s ? ' legend-item--active' : ''}`}
                  onClick={() => setFilters((f) => ({ ...f, status: f.status === s ? '' : s }))}
                >
                  <span className="legend-dot" style={{ background: STAGE_COLORS[s] }} />
                  <span className="legend-label">{STATUS_LABELS[s]}</span>
                  <span className="legend-count">{periodStats.byStage[s] || 0}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Writer workload */}
      <div className="card">
        <div className="card-title-row">
          <h2 className="card-title">Writer Workload</h2>
          {stats.workload.length > 6 && (
            <button type="button" className="link-btn" onClick={() => setShowAllWorkload(true)}>Show all</button>
          )}
        </div>
        <div className="workload-grid">
          {stats.workload.slice(0, 6).map((w) => (
            <WorkloadRow key={w.id} writer={w} busiest={busiest} />
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search">
          <IconSearch />
          <input
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            placeholder="Search by title…"
          />
        </div>
        <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <select value={filters.writer} onChange={(e) => setFilters((f) => ({ ...f, writer: e.target.value }))}>
          <option value="">All writers</option>
          {data.writers.map((w) => <option key={w.id} value={w.id}>{w.name}{w.role === 'TEAM_LEADER' ? ' (TL)' : ''}</option>)}
        </select>
        <select value={filters.client} onChange={(e) => setFilters((f) => ({ ...f, client: e.target.value }))}>
          <option value="">All clients</option>
          {data.clients.map((c) => <option key={c.id} value={c.id}>{c.name}{c.contentTypeName ? ` · ${c.contentTypeName}` : ''}</option>)}
        </select>
        {filterActive && (
          <button type="button" className="link-btn" onClick={() => setFilters({ q: '', status: '', writer: '', client: '' })}>
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card no-pad">
        {filtered.length === 0 ? (
          <EmptyState
            title={data.articles.length === 0 ? 'No content yet' : 'No content matches'}
            message={
              data.articles.length === 0
                ? 'Create your first piece of content to get started.'
                : 'Try adjusting your filters or switching to All Time.'
            }
          />
        ) : (
          <>
            <table className="table table--articles">
              <thead>
                <tr>
                  {SORTABLE.map((col) => (
                    <th key={col.key} className="sortable" onClick={() => toggleSort(col.key)}>
                      {col.label}
                      <IconSort dir={sort.key === col.key ? sort.dir : null} />
                    </th>
                  ))}
                  <th>Type</th>
                  <th>Links</th>
                  <th>TTW</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {pageRows.map((a) => {
                  const overdue = isOverdue(a);
                  return (
                    <tr
                      key={a.id}
                      className={`row-link ${overdue ? 'row-overdue' : ''}`}
                      onClick={() => navigate(`/admin/articles/${a.id}`)}
                    >
                      <td className="cell-strong" data-label="Title">
                        {a.title}
                        {overdue && <span className="overdue-tag overdue-tag--sm">Overdue</span>}
                      </td>
                      <td data-label="Writer">{a.writerName}{a.writerRole === 'TEAM_LEADER' ? ' (TL)' : ''}</td>
                      <td data-label="Client">{a.clientName}</td>
                      <td data-label="Deadline" className={overdue ? 'text-danger' : ''}>{formatDate(a.deadline)}</td>
                      <td data-label="Status"><StatusBadge status={a.status} /></td>
                      <td data-label="Type">{a.typeName}</td>
                      <td data-label="Links">
                        {a.referenceLinks?.length
                          ? <a href={a.referenceLinks[0]} target="_blank" rel="noreferrer" className="doc-pill" onClick={(e) => e.stopPropagation()}><IconExternal /> {a.referenceLinks.length > 1 ? `${a.referenceLinks.length} links` : 'Link'}</a>
                          : <span className="muted">—</span>}
                      </td>
                      <td data-label="TTW">{ttwDisplay(a)}</td>
                      <td className="col-actions" onClick={(e) => e.stopPropagation()}>
                        <button type="button" className="icon-btn" title="Edit" onClick={() => setFormArticle(a)}><IconEdit /></button>
                        <button type="button" className="icon-btn icon-btn--danger" title="Delete" onClick={() => setDeleting(a)}><IconTrash /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="pagination">
              <span className="muted">{filtered.length} item{filtered.length === 1 ? '' : 's'}</span>
              <div className="pagination-ctrls">
                <button type="button" className="btn btn--ghost btn--sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                <span className="page-indicator">Page {page} of {totalPages}</span>
                <button type="button" className="btn btn--ghost btn--sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {formArticle !== undefined && (
        <ArticleForm
          article={formArticle}
          clients={data.clients}
          writers={data.writers}
          types={data.types}
          onClose={() => setFormArticle(undefined)}
          onSaved={() => { setFormArticle(undefined); loadAll(); }}
        />
      )}

      {showBatch && (
        <BatchAssignModal
          clients={data.clients}
          writers={data.writers}
          types={data.types}
          onClose={() => setShowBatch(false)}
          onSaved={() => { setShowBatch(false); loadAll(); }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete content"
          message={`Are you sure you want to delete "${deleting.title}"? This cannot be undone.`}
          busy={delBusy}
          onCancel={() => setDeleting(null)}
          onConfirm={confirmDelete}
        />
      )}

      {showAllWorkload && (
        <Modal title="Writer Workload" onClose={() => setShowAllWorkload(false)}>
          <div className="workload-grid workload-grid--modal">
            {stats.workload.map((w) => <WorkloadRow key={w.id} writer={w} busiest={busiest} />)}
          </div>
        </Modal>
      )}
    </div>
  );
}

function StatCard({ tone, label, value, hint }) {
  return (
    <div className={`card stat-card stat-card--${tone}`}>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      <span className="stat-hint">{hint}</span>
    </div>
  );
}

function WorkloadRow({ writer, busiest }) {
  return (
    <div className="workload-row">
      <span className="workload-avatar">{initials(writer.name)}</span>
      <div className="workload-meta">
        <span className="workload-name">{writer.name}</span>
        <div className="workload-bar">
          <span className="workload-fill" style={{ width: `${(writer.active / busiest) * 100}%` }} />
        </div>
      </div>
      <span className="workload-count">{writer.active}</span>
    </div>
  );
}
