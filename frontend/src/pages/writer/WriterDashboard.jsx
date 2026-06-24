import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import { SkeletonPage } from '../../components/Skeleton.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { Button, LinkButton } from '../../components/ui/index.js';
import { cn } from '../../components/ui/cn.js';
import { useToast } from '../../components/Toast.jsx';
import { formatDate, formatTTW, ttwDisplay, isOverdue } from '../../lib/utils.js';
import { STATUS_LABELS } from '../../lib/workflow.js';
import { IconArrowRight } from '../../lib/icons.jsx';

const COMPLETED_PREVIEW = 5;
// FEATURE: Today's Focus — only a writer's actionable pieces (waiting on them,
// not on a reviewer). Review/Completed/Draft are excluded.
const ACTIONABLE = ['BRIEF_PENDING', 'WRITING', 'REOPENED'];

function Metric({ label, value, sub, tone }) {
  const isWarn = tone === 'warn';
  return (
    <div className={cn(
      'flex flex-col gap-0.5 bg-surface border border-border rounded-[var(--radius)] shadow-[var(--shadow-sm)] p-[16px_18px]',
      isWarn && 'border-warning-border bg-warning-soft',
    )}>
      <span className={cn('text-[1.7rem] font-bold tracking-[-0.02em] leading-[1.1]', isWarn && 'text-warning')}>{value}</span>
      <span className="text-[.82rem] text-muted font-semibold">{label}</span>
      {sub && <span className="text-[.74rem] text-muted mt-0.5">{sub}</span>}
    </div>
  );
}

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
    <div className={cn(
      'relative flex flex-col bg-surface border border-border rounded-[var(--radius)] shadow-[var(--shadow-sm)]',
      'overflow-hidden transition-[transform,box-shadow] duration-[120ms] hover:-translate-y-0.5 hover:shadow-[var(--shadow)]',
    )}>
      {overdue && <span className="absolute top-3 bottom-3 left-0 w-[3px] bg-danger rounded-r-[2px]" aria-hidden="true" />}
      <Link
        to={`/writer/articles/${article.id}`}
        className="flex flex-col gap-[10px] flex-1 p-[18px] text-ink no-underline hover:text-ink"
      >
        <div className="flex justify-between items-start gap-[10px]">
          <h3 className="text-[1rem] leading-[1.3] m-0">{article.title}</h3>
          <StatusBadge status={article.status} />
        </div>
        <p className="m-0 text-muted text-[.84rem]">{article.clientName} · {article.typeName}</p>
        <div className="flex justify-between items-center mt-auto gap-2">
          {article.status === 'WRITING' && article.pausedAt && (
            <span className="text-[.72rem] font-bold text-muted bg-surface-2 border border-border-strong px-[9px] py-[2px] rounded-full">
              Paused
            </span>
          )}
          {hasTTW && (
            <span className="text-[.78rem] font-semibold text-primary-hover bg-primary-soft px-[10px] py-[3px] rounded-full">
              TTW {ttwDisplay(article)}
            </span>
          )}
          <span className={cn('text-[.8rem] text-muted ml-auto', overdue && 'text-danger font-semibold')}>
            {formatDate(article.deadline)}{overdue && ' · Overdue'}
          </span>
        </div>
      </Link>
      {quickAction && (
        <div className="border-t border-border p-[10px_18px]">
          <Button variant="primary" size="sm" block disabled={busy} onClick={doAction}>
            {busy ? '…' : quickAction.label}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function WriterDashboard() {
  const [articles, setArticles] = useState(null);
  const [stats, setStats] = useState(null);
  const [showAllCompleted, setShowAllCompleted] = useState(false);

  function load() {
    api.listArticles().then(setArticles).catch(() => setArticles([]));
    api.myStats().then(setStats).catch(() => setStats(null));
  }
  useEffect(() => { load(); }, []);

  if (!articles) return <div className="page"><SkeletonPage /></div>;

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

  // FEATURE: Today's Focus — hardest-deadline actionable pieces, capped at 3.
  const isToday = (a) => a.deadline && new Date(a.deadline).toDateString() === todayStr;
  const focusRank = (a) => (isOverdue(a) ? 0 : isToday(a) ? 1 : a.deadline ? 2 : 3);
  const actionable = active.filter((a) => ACTIONABLE.includes(a.status));
  const focus = [...actionable].sort((a, b) => focusRank(a) - focusRank(b) || byDeadline(a, b)).slice(0, 3);

  // FEATURE: Estimated remaining work — sum of TTW targets across actionable pieces.
  const withEstimate = actionable.filter((a) => a.ttwTargetMinutes != null);
  const remainingMinutes = withEstimate.reduce((s, a) => s + a.ttwTargetMinutes, 0);
  const noEstimateCount = actionable.length - withEstimate.length;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>My Content</h1>
          <p className="text-muted">{active.length} active · {overdueItems.length} overdue · {completed.length} completed</p>
        </div>
      </div>

      {/* FEATURE: Personal metrics */}
      <div className="grid [grid-template-columns:repeat(auto-fit,minmax(170px,1fr))] gap-[14px]">
        <Metric label="Active now" value={active.length} tone={overdueItems.length > 0 ? 'warn' : undefined} />
        <Metric label="Completed this week" value={stats ? stats.completedThisWeek : '—'} />
        <Metric label="Avg time to write" value={stats && stats.avgTtwMinutes != null ? formatTTW(stats.avgTtwMinutes) : '—'} />
        <Metric
          label="On-time rate"
          value={stats && stats.onTimeRate != null ? `${stats.onTimeRate}%` : '—'}
          sub={stats && stats.onTimeTotal > 0 ? `${stats.onTimeCount} of ${stats.onTimeTotal} on time` : 'no deadlines yet'}
          tone={stats && stats.onTimeRate != null && stats.onTimeRate < 70 ? 'warn' : undefined}
        />
      </div>

      {/* FEATURE: Today's Focus + estimated remaining work */}
      {focus.length > 0 && (
        <section className="bg-surface border border-border rounded-[var(--radius)] shadow-[var(--shadow-sm)] p-[18px_20px] flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <h2 className="text-[1rem] text-muted font-bold m-0">Today's Focus</h2>
            {withEstimate.length > 0 && (
              <span className="text-[.82rem] font-semibold text-primary-hover bg-primary-soft px-[11px] py-1 rounded-full">
                ≈ {formatTTW(remainingMinutes)} of writing planned
                {noEstimateCount > 0 && ` · ${noEstimateCount} unestimated`}
              </span>
            )}
          </div>
          <ol className="list-none m-0 p-0 flex flex-col gap-2">
            {focus.map((a, i) => {
              const overdueItem = isOverdue(a);
              const hint = overdueItem ? 'Overdue' : isToday(a) ? 'Due today' : a.deadline ? `Due ${formatDate(a.deadline)}` : 'No deadline';
              return (
                <li key={a.id} className="flex items-center gap-3">
                  <span className="shrink-0 w-6 h-6 grid place-items-center rounded-full bg-primary-soft text-primary-hover text-[.8rem] font-bold">
                    {i + 1}
                  </span>
                  <Link
                    to={`/writer/articles/${a.id}`}
                    className={cn(
                      'flex-1 flex items-center gap-3 px-[14px] py-[11px] border border-border rounded-[var(--radius-sm)]',
                      'bg-surface-2 no-underline text-ink hover:text-ink',
                      'transition-[border-color,background,transform] duration-[150ms]',
                      'hover:border-border-strong hover:bg-surface active:translate-y-px',
                    )}
                  >
                    <div className="flex-1 min-w-0 flex flex-col gap-px">
                      <span className="font-semibold whitespace-nowrap overflow-hidden text-ellipsis">{a.title}</span>
                      <span className="text-[.78rem] text-muted">{a.clientName} · {STATUS_LABELS[a.status]}</span>
                    </div>
                    <span className={cn(
                      'text-[.78rem] font-semibold whitespace-nowrap',
                      overdueItem ? 'text-danger' : isToday(a) ? 'text-warning' : 'text-muted',
                    )}>
                      {hint}
                    </span>
                    <IconArrowRight className="w-4 h-4 text-muted shrink-0" />
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {active.length === 0 && completed.length === 0 && (
        <EmptyState title="Nothing assigned yet" message="When your team lead assigns you content, it'll show up here." />
      )}

      {overdueItems.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[1rem] text-danger font-bold">Overdue</h2>
          <div className="grid [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {overdueItems.map((a) => <WriterCard key={a.id} article={a} onStatusChange={load} />)}
          </div>
        </section>
      )}

      {dueToday.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[1rem] text-warning font-bold">Due Today</h2>
          <div className="grid [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {dueToday.map((a) => <WriterCard key={a.id} article={a} onStatusChange={load} />)}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[1rem] text-muted font-bold">Active</h2>
          <div className="grid [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {upcoming.map((a) => <WriterCard key={a.id} article={a} onStatusChange={load} />)}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[1rem] text-muted font-bold">
            Completed
            <span className="inline-block ml-[6px] text-[.75rem] bg-border rounded-full px-2 py-px text-muted font-semibold align-middle">
              {completed.length}
            </span>
          </h2>
          <div className="grid [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))] gap-4 opacity-[.82]">
            {(showAllCompleted ? completed : completed.slice(0, COMPLETED_PREVIEW)).map((a) => (
              <WriterCard key={a.id} article={a} onStatusChange={load} />
            ))}
          </div>
          {completed.length > COMPLETED_PREVIEW && (
            <LinkButton className="mx-auto" onClick={() => setShowAllCompleted((s) => !s)}>
              {showAllCompleted ? 'Show less' : `Show ${completed.length - COMPLETED_PREVIEW} more`}
            </LinkButton>
          )}
        </section>
      )}
    </div>
  );
}
