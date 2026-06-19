import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import Loader from '../../components/Loader.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { useToast } from '../../components/Toast.jsx';
import { formatDate, ttwDisplay, isOverdue } from '../../lib/utils.js';

const COMPLETED_PREVIEW = 5;

function byDeadline(a, b) {
  if (!a.deadline) return 1;
  if (!b.deadline) return -1;
  return new Date(a.deadline) - new Date(b.deadline);
}

function WriterCard({ article, onStatusChange }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const overdue = isOverdue(article);
  const hasTTW = article.ttwTargetMinutes != null || article.ttwActualMinutes != null;

  const quickAction =
    article.status === 'BRIEF_PENDING' ? { label: 'Start Writing', to: 'WRITING' }
    : article.status === 'WRITING' ? { label: 'Submit for Review', to: 'REVIEW' }
    : null;

  async function doAction(e) {
    e.preventDefault();
    e.stopPropagation();
    setBusy(true);
    try {
      await api.setStatus(article.id, quickAction.to);
      toast.success('Status updated');
      onStatusChange();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`content-card ${overdue ? 'content-card--overdue' : ''}`}>
      <Link to={`/writer/articles/${article.id}`} className="content-card-body">
        <div className="content-card-top">
          <h3>{article.title}</h3>
          <StatusBadge status={article.status} />
        </div>
        <p className="content-card-sub">{article.clientName} · {article.typeName}</p>
        <div className="content-card-foot">
          {hasTTW && <span className="ttw-chip">TTW {ttwDisplay(article)}</span>}
          <span className={`deadline ${overdue ? 'deadline--over' : ''}`}>
            {formatDate(article.deadline)}{overdue && ' · Overdue'}
          </span>
        </div>
      </Link>
      {quickAction && (
        <div className="content-card-action">
          <button
            type="button"
            className="btn btn--primary btn--sm"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={busy}
            onClick={doAction}
          >
            {busy ? '…' : quickAction.label}
          </button>
        </div>
      )}
    </div>
  );
}

export default function WriterDashboard() {
  const [articles, setArticles] = useState(null);
  const [showAllCompleted, setShowAllCompleted] = useState(false);

  function load() {
    api.listArticles().then(setArticles).catch(() => setArticles([]));
  }
  useEffect(() => { load(); }, []);

  if (!articles) return <Loader full />;

  const now = new Date();
  const todayStr = now.toDateString();
  const active = articles.filter((a) => a.status !== 'COMPLETED');
  const overdueItems = active.filter(isOverdue).sort(byDeadline);
  const dueToday = active
    .filter((a) => !isOverdue(a) && a.deadline && new Date(a.deadline).toDateString() === todayStr)
    .sort(byDeadline);
  const upcoming = active
    .filter((a) => !isOverdue(a) && !(a.deadline && new Date(a.deadline).toDateString() === todayStr))
    .sort(byDeadline);
  const completed = articles.filter((a) => a.status === 'COMPLETED');
  const urgentCount = overdueItems.length + dueToday.length;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>My Content</h1>
          <p className="muted">{active.length} active · {overdueItems.length} overdue · {completed.length} completed</p>
        </div>
      </div>

      {urgentCount > 0 && (
        <div className="urgent-callout">
          <strong>{urgentCount} piece{urgentCount === 1 ? '' : 's'} need{urgentCount === 1 ? 's' : ''} attention</strong>
          <span className="muted">
            {overdueItems.length > 0 && `${overdueItems.length} overdue`}
            {overdueItems.length > 0 && dueToday.length > 0 && ' · '}
            {dueToday.length > 0 && `${dueToday.length} due today`}
          </span>
        </div>
      )}

      {active.length === 0 && completed.length === 0 && (
        <EmptyState title="Nothing assigned yet" message="When your team lead assigns you content, it'll show up here." />
      )}

      {overdueItems.length > 0 && (
        <section className="section">
          <h2 className="section-title section-title--danger">Overdue</h2>
          <div className="card-grid">
            {overdueItems.map((a) => <WriterCard key={a.id} article={a} onStatusChange={load} />)}
          </div>
        </section>
      )}

      {dueToday.length > 0 && (
        <section className="section">
          <h2 className="section-title section-title--warning">Due Today</h2>
          <div className="card-grid">
            {dueToday.map((a) => <WriterCard key={a.id} article={a} onStatusChange={load} />)}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="section">
          <h2 className="section-title">Active</h2>
          <div className="card-grid">
            {upcoming.map((a) => <WriterCard key={a.id} article={a} onStatusChange={load} />)}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section className="section">
          <h2 className="section-title">
            Completed
            <span className="section-count">{completed.length}</span>
          </h2>
          <div className="card-grid card-grid--muted">
            {(showAllCompleted ? completed : completed.slice(0, COMPLETED_PREVIEW)).map((a) => (
              <WriterCard key={a.id} article={a} onStatusChange={load} />
            ))}
          </div>
          {completed.length > COMPLETED_PREVIEW && (
            <button
              type="button"
              className="link-btn"
              style={{ display: 'block', margin: '12px auto 0' }}
              onClick={() => setShowAllCompleted((s) => !s)}
            >
              {showAllCompleted ? 'Show less' : `Show ${completed.length - COMPLETED_PREVIEW} more`}
            </button>
          )}
        </section>
      )}
    </div>
  );
}
