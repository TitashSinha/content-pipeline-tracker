// Team Leader dashboard — same surface as the admin dashboard, minus delete.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';
import Loader from '../../components/Loader.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Modal from '../../components/Modal.jsx';
import ArticleForm from '../../components/admin/ArticleForm.jsx';
import BatchAssignModal from '../../components/admin/BatchAssignModal.jsx';
import DashboardStats, { WorkloadRow } from '../../components/content/DashboardStats.jsx';
import { ContentViewBar, ContentFilterBar } from '../../components/content/ContentControls.jsx';
import ContentTable from '../../components/content/ContentTable.jsx';
import BulkActionsBar from '../../components/content/BulkActionsBar.jsx';
import { useToast } from '../../components/Toast.jsx';
import useContentList from '../../hooks/useContentList.js';
import useSavedViews from '../../hooks/useSavedViews.js';
import useHotkeys from '../../hooks/useHotkeys.js';
import useSelection from '../../hooks/useSelection.js';
import { exportArticlesCsv, articleDuplicateSeed } from '../../lib/utils.js';
import { Button, IconButton, Card } from '../../components/ui/index.js';
import { IconPlus, IconRefresh, IconDownload, IconEdit, IconBatch, IconCopy } from '../../lib/icons.jsx';

const today = () => new Date().toISOString().slice(0, 10);

export default function TLDashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [formArticle, setFormArticle] = useState(undefined);
  const [showBatch, setShowBatch] = useState(false);
  const [showAllWorkload, setShowAllWorkload] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const searchRef = useRef(null);

  const articles = data?.articles ?? [];
  const list = useContentList(articles, 'cpt_view_tl');
  const views = useSavedViews();
  const selection = useSelection();

  async function loadAll() {
    const [arts, clients, writers, types, stats, templates] = await Promise.all([
      api.listArticles(), api.listClients(), api.listWriters(), api.listTypes(), api.dashboard(), api.listTemplates(),
    ]);
    setData({ articles: arts, clients, writers, types, stats, templates });
  }
  useEffect(() => { loadAll(); }, []);

  const modalOpen = formArticle !== undefined || showBatch || showAllWorkload;
  useHotkeys({
    'mod+n': () => setFormArticle(null),
    'mod+shift+b': () => setShowBatch(true),
    'mod+/': () => searchRef.current?.focus(),
  }, { enabled: !modalOpen });

  if (!data) return <Loader full />;

  const { stats } = data;
  const busiest = Math.max(1, ...stats.workload.map((w) => w.active));
  const selectedRows = list.filtered.filter((a) => selection.has(a.id));

  async function runBulk(action, value) {
    setBulkBusy(true);
    try {
      const { updated, skipped } = await api.bulkUpdateArticles([...selection.ids], action, value);
      toast.success(`${updated} updated${skipped ? ` · ${skipped} skipped` : ''}`);
      selection.clear();
      await loadAll();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBulkBusy(false);
    }
  }

  async function refresh() {
    setRefreshing(true);
    list.reset();
    selection.clear();
    try { await loadAll(); toast.success('Dashboard refreshed'); } finally { setRefreshing(false); }
  }

  const renderActions = (a) => (
    <>
      <IconButton title="Duplicate" onClick={() => setFormArticle(articleDuplicateSeed(a))}><IconCopy /></IconButton>
      <IconButton title="Edit" onClick={() => setFormArticle(a)}><IconEdit /></IconButton>
    </>
  );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted">All content across your team.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="ghost" onClick={refresh} disabled={refreshing}>
            <IconRefresh className={refreshing ? 'spin' : ''} />
            <span className="max-sm:hidden">{refreshing ? 'Refreshing…' : 'Refresh'}</span>
          </Button>
          <Button variant="ghost" onClick={() => exportArticlesCsv(list.filtered, `content-pipeline-${today()}.csv`)}>
            <IconDownload /> <span className="max-sm:hidden">Export CSV</span>
          </Button>
          <Button variant="ghost" onClick={() => setShowBatch(true)}>
            <IconBatch /> <span className="max-sm:hidden">Batch Assign</span>
          </Button>
          <Button onClick={() => setFormArticle(null)}>
            <IconPlus /> New content
          </Button>
        </div>
      </div>

      <ContentViewBar
        dateRange={list.dateRange} setDateRange={list.setDateRange}
        customFilter={list.customFilter} setCustomFilter={list.setCustomFilter}
        filters={list.filters} filterActive={list.filterActive}
        views={views} applyView={list.applyView} matchesView={list.matchesView}
      />

      <DashboardStats
        periodStats={list.periodStats} dateRange={list.dateRange}
        statusFilter={list.filters.status}
        onStageClick={(s) => list.setFilters((f) => ({ ...f, status: f.status === s ? '' : s }))}
        workload={stats.workload} busiest={busiest}
        onShowAllWorkload={() => setShowAllWorkload(true)}
      />

      <ContentFilterBar
        filters={list.filters} setFilters={list.setFilters}
        clearFilters={list.clearFilters} filterActive={list.filterActive}
        writers={data.writers} clients={data.clients} searchInputRef={searchRef}
      />

      {selection.size > 0 && (
        <BulkActionsBar
          count={selection.size} writers={data.writers} busy={bulkBusy}
          onReassign={(id) => runBulk('reassign', id)}
          onDeadline={(iso) => runBulk('deadline', iso)}
          onStatus={(s) => runBulk('status', s)}
          onExport={() => exportArticlesCsv(selectedRows, `content-selected-${today()}.csv`)}
          onClear={selection.clear}
        />
      )}

      <Card noPad>
        {list.filtered.length === 0 ? (
          <EmptyState
            title={articles.length === 0 ? 'No content yet' : 'No content matches'}
            message={articles.length === 0
              ? 'Create your first piece of content to get started.'
              : 'Try adjusting your filters or switching to All Time.'}
            action={articles.length === 0
              ? <Button onClick={() => setFormArticle(null)}><IconPlus /> New content</Button>
              : list.filterActive ? <Button variant="ghost" onClick={list.clearFilters}>Clear filters</Button> : null}
          />
        ) : (
          <ContentTable
            rows={list.pageRows} sort={list.sort} onToggleSort={list.toggleSort}
            onRowClick={(a) => navigate(`/tl/articles/${a.id}`)}
            selectable selectedIds={selection.ids}
            onToggleSelect={selection.toggle} onToggleSelectAll={selection.toggleAll}
            renderActions={renderActions}
            page={list.page} totalPages={list.totalPages} setPage={list.setPage} totalCount={list.filtered.length}
          />
        )}
      </Card>

      {formArticle !== undefined && (
        <ArticleForm
          article={formArticle}
          clients={data.clients} writers={data.writers} types={data.types}
          articles={data.articles} templates={data.templates}
          onClose={() => setFormArticle(undefined)}
          onSaved={() => { setFormArticle(undefined); loadAll(); }}
        />
      )}

      {showBatch && (
        <BatchAssignModal
          clients={data.clients} writers={data.writers} types={data.types}
          onClose={() => setShowBatch(false)}
          onSaved={() => { setShowBatch(false); loadAll(); }}
        />
      )}

      {showAllWorkload && (
        <Modal title="Writer Workload" onClose={() => setShowAllWorkload(false)}>
          <div className="grid grid-cols-1 gap-[14px_28px]">
            {stats.workload.map((w) => <WorkloadRow key={w.id} writer={w} busiest={busiest} />)}
          </div>
        </Modal>
      )}
    </div>
  );
}
