// FEATURE: Team Leader Workspace (Phase 4) — the TL's command center for running
// their team. Everything is derived (frontend) from the article + writer lists
// via the shared lib/risk.js helpers; no per-widget endpoints.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import Loader from '../../components/Loader.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { Card, LinkButton } from '../../components/ui/index.js';
import { initials, formatDate, isOverdue } from '../../lib/utils.js';
import { isActive, STATUS_LABELS, STATUS_COLORS } from '../../lib/workflow.js';
import {
  WRITER_CAPACITY, activeCountByWriter, capacityState, articlesAtRisk,
  longestWaiting, bottlenecks, formatAge, topLevel,
} from '../../lib/risk.js';
import { IconWarning, IconArrowRight } from '../../lib/icons.jsx';

const RISK_PREVIEW = 6;
const DAY_MS = 86400000;

export default function TLTeam() {
  const [data, setData] = useState(null);
  const [showAllRisk, setShowAllRisk] = useState(false);

  useEffect(() => {
    Promise.all([api.listArticles(), api.listWriters()])
      .then(([articles, writers]) => setData({ articles, writers }))
      .catch(() => setData({ articles: [], writers: [] }));
  }, []);

  const view = useMemo(() => {
    if (!data) return null;
    const { articles, writers } = data;
    const now = Date.now();
    const activeByWriter = activeCountByWriter(articles);

    const capacity = writers
      .map((w) => {
        const mine = articles.filter((a) => a.assignedWriterId === w.id && isActive(a.status));
        return { ...w, active: mine.length, overdue: mine.filter(isOverdue).length };
      })
      .sort((a, b) => b.active - a.active);

    // Availability: count active pieces due each of the next 7 days, per writer.
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + i); return d;
    });
    const dueCount = (writerId, day) => {
      const start = day.getTime();
      return articles.filter((a) =>
        a.assignedWriterId === writerId && isActive(a.status) && a.deadline &&
        new Date(a.deadline).getTime() >= start && new Date(a.deadline).getTime() < start + DAY_MS,
      ).length;
    };
    const availability = capacity
      .filter((w) => w.active > 0)
      .map((w) => ({ ...w, perDay: days.map((d) => dueCount(w.id, d)) }));

    return {
      risks: articlesAtRisk(articles, now),
      waiting: longestWaiting(articles, { limit: 6, now }),
      stages: bottlenecks(articles, now),
      capacity,
      days,
      availability,
      activeTotal: articles.filter((a) => isActive(a.status)).length,
      overdueTotal: articles.filter(isOverdue).length,
    };
  }, [data]);

  if (!view) return <Loader full />;

  const { risks, waiting, stages, capacity, days, availability, activeTotal, overdueTotal } = view;
  const maxStageCount = Math.max(1, ...stages.map((s) => s.count));
  const reviewWait = stages.find((s) => s.status === 'REVIEW');
  const shownRisks = showAllRisk ? risks : risks.slice(0, RISK_PREVIEW);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Team</h1>
          <p className="text-muted">Capacity, risk, and where work is piling up.</p>
        </div>
      </div>

      {/* Quick pulse */}
      <div className="team-pulse">
        <PulseStat label="Active pieces" value={activeTotal} />
        <PulseStat label="At risk" value={risks.length} tone={risks.length ? 'warn' : undefined} />
        <PulseStat label="Overdue" value={overdueTotal} tone={overdueTotal ? 'danger' : undefined} />
        <PulseStat label="Avg review wait" value={reviewWait && reviewWait.count ? formatAge(reviewWait.avgMs) : '—'} />
      </div>

      {/* Needs attention (risk detection) */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[1rem] text-muted font-bold">Needs attention</h2>
        <Card noPad>
          {risks.length === 0 ? (
            <EmptyState title="All clear" message="No active pieces are flagged right now." />
          ) : (
            <ul className="risk-list">
              {shownRisks.map(({ article, risks: rs }) => (
                <li key={article.id} className={`risk-row risk-row--${topLevel(rs)}`}>
                  <Link to={`/tl/articles/${article.id}`} className="risk-link">
                    <div className="risk-main">
                      <span className="risk-title">{article.title}</span>
                      <span className="risk-sub">{article.clientName} · {article.writerName} · {STATUS_LABELS[article.status]}</span>
                    </div>
                    <div className="risk-tags">
                      {rs.map((r) => <span key={r.id} className={`risk-chip risk-chip--${r.level}`}>{r.label}</span>)}
                    </div>
                    <IconArrowRight className="risk-arrow" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        {risks.length > RISK_PREVIEW && (
          <LinkButton style={{ alignSelf: 'center' }} onClick={() => setShowAllRisk((s) => !s)}>
            {showAllRisk ? 'Show less' : `Show ${risks.length - RISK_PREVIEW} more`}
          </LinkButton>
        )}
      </section>

      {/* Writer capacity */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[1rem] text-muted font-bold">Writer capacity</h2>
        <div className="capacity-grid">
          {capacity.map((w) => {
            const cap = capacityState(w.active);
            return (
              <div key={w.id} className={`capacity-card capacity-card--${cap.level}`}>
                <div className="capacity-head">
                  <span className="capacity-avatar">{initials(w.name)}</span>
                  <div className="capacity-id">
                    <span className="capacity-name">{w.name}{w.role === 'TEAM_LEADER' && <span className="role-chip role-chip--tl">TL</span>}</span>
                    <span className="capacity-state">{cap.label}{w.overdue > 0 && <span className="capacity-overdue"> · {w.overdue} overdue</span>}</span>
                  </div>
                  <span className="capacity-count">{w.active}</span>
                </div>
                <div className="capacity-bar">
                  <span className="capacity-fill" style={{ width: `${Math.min(100, (w.active / Math.max(1, WRITER_CAPACITY)) * 100)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="team-cols">
        {/* Bottlenecks */}
        <section className="flex flex-col gap-3">
          <h2 className="text-[1rem] text-muted font-bold">Bottlenecks</h2>
          <Card>
            <ul className="bottleneck-list">
              {stages.map((s) => (
                <li key={s.status} className="bottleneck-row">
                  <span className="bottleneck-label">
                    <span className="legend-dot" style={{ background: STATUS_COLORS[s.status] }} />
                    {STATUS_LABELS[s.status]}
                  </span>
                  <span className="bottleneck-bar">
                    <span className="bottleneck-fill" style={{ width: `${(s.count / maxStageCount) * 100}%`, background: STATUS_COLORS[s.status] }} />
                  </span>
                  <span className="bottleneck-meta">{s.count}{s.count > 0 && <span className="text-muted"> · avg {formatAge(s.avgMs)}</span>}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        {/* Longest waiting */}
        <section className="flex flex-col gap-3">
          <h2 className="text-[1rem] text-muted font-bold">Longest waiting</h2>
          <Card noPad>
            {waiting.length === 0 ? (
              <EmptyState title="Nothing waiting" message="No active pieces in the pipeline." />
            ) : (
              <ul className="waiting-list">
                {waiting.map(({ article, ms }) => (
                  <li key={article.id} className="waiting-row">
                    <Link to={`/tl/articles/${article.id}`} className="waiting-link">
                      <StatusBadge status={article.status} />
                      <span className="waiting-title">{article.title}</span>
                      <span className="waiting-age">{formatAge(ms)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>
      </div>

      {/* Availability — next 7 days */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[1rem] text-muted font-bold">Availability · next 7 days</h2>
        <Card noPad className="availability-wrap">
          {availability.length === 0 ? (
            <EmptyState title="No upcoming work" message="No active pieces are assigned right now." />
          ) : (
            <table className="availability">
              <thead>
                <tr>
                  <th className="availability-name-col">Writer</th>
                  {days.map((d) => (
                    <th key={d.toISOString()}>
                      <span className="avail-day">{d.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                      <span className="avail-date">{d.getDate()}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {availability.map((w) => (
                  <tr key={w.id}>
                    <td className="availability-name-col">{w.name}</td>
                    {w.perDay.map((n, i) => (
                      <td key={i}>
                        {n > 0 ? <span className={`avail-cell avail-cell--${n >= 3 ? 'high' : n === 2 ? 'mid' : 'low'}`}>{n}</span> : <span className="avail-empty">·</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </section>
    </div>
  );
}

function PulseStat({ label, value, tone }) {
  return (
    <div className={`pulse-stat ${tone ? `pulse-stat--${tone}` : ''}`}>
      <span className="pulse-value">{value}</span>
      <span className="pulse-label">{label}</span>
    </div>
  );
}
