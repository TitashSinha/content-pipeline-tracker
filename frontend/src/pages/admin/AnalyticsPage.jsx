// FEATURE: Analytics & Reporting (Phase 5). Admin reporting surface. Historical
// series (velocity, client health, writer trends) come from GET /api/analytics;
// the current-snapshot views (workload forecast, SLA / time-in-stage) are derived
// here from the article list via lib/risk.js — same split as Phases 3–4. The whole
// page is print-friendly: "Print report" calls window.print() and the global
// print stylesheet drops the app chrome (see index.css @media print).
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client.js';
import { SkeletonPage } from '../../components/Skeleton.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { Button, Card, CardTitle } from '../../components/ui/index.js';
import { formatTTW, formatDateTime, initials } from '../../lib/utils.js';
import { isActive, STATUS_LABELS, STATUS_COLORS } from '../../lib/workflow.js';
import { slaSummary, formatAge } from '../../lib/risk.js';
import { IconDownload } from '../../lib/icons.jsx';

const DAY = 86400000;
const FORECAST_DAYS = 14;

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [articles, setArticles] = useState(null);

  useEffect(() => {
    api.analytics().then(setData).catch(() => setData(false));
    api.listArticles().then(setArticles).catch(() => setArticles([]));
  }, []);

  const snapshot = useMemo(() => {
    if (!articles) return null;
    const now = Date.now();
    const active = articles.filter((a) => isActive(a.status));

    // Workload forecast — active pieces due each of the next 14 days.
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const forecast = Array.from({ length: FORECAST_DAYS }, (_, i) => {
      const d = new Date(start); d.setDate(d.getDate() + i);
      const from = d.getTime();
      const due = active.filter((a) => a.deadline && new Date(a.deadline).getTime() >= from && new Date(a.deadline).getTime() < from + DAY).length;
      return { date: d, due };
    });
    const dueNext7 = forecast.slice(0, 7).reduce((s, d) => s + d.due, 0);
    const overdueCarry = active.filter((a) => a.deadline && new Date(a.deadline).getTime() < start.getTime()).length;
    const unscheduled = active.filter((a) => !a.deadline).length;

    return { sla: slaSummary(articles, now), forecast, dueNext7, overdueCarry, unscheduled };
  }, [articles]);

  if (data === null || !snapshot) return <div className="page"><SkeletonPage /></div>;
  if (data === false) return <div className="page"><p className="form-error">Could not load analytics.</p></div>;

  const { totals, velocity, clients, writers } = data;
  const { sla, forecast, dueNext7, overdueCarry, unscheduled } = snapshot;
  const monthTrend = totals.completedThisMonth - totals.completedLastMonth;
  const velMax = Math.max(1, ...velocity.weekly.map((w) => w.completed));
  const fcMax = Math.max(1, ...forecast.map((d) => d.due));
  const activeClients = clients.filter((c) => c.total > 0);
  const activeWriters = writers.filter((w) => w.completed > 0 || w.active > 0);

  return (
    <div className="page analytics">
      <div className="page-head">
        <div>
          <h1>Analytics</h1>
          <p className="text-muted">Velocity, client health, and team performance · generated {formatDateTime(data.generatedAt)}</p>
        </div>
        <div className="flex gap-2 flex-wrap no-print">
          <Button variant="ghost" onClick={() => window.print()}>
            <IconDownload /> Print / Export
          </Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="kpi-row">
        <Kpi label="Completed (all time)" value={totals.completedAll} />
        <Kpi label="Completed this month" value={totals.completedThisMonth} trend={monthTrend} sub={`${totals.completedLastMonth} last month`} />
        <Kpi label="Active pipeline" value={totals.activeAll} />
        <Kpi label="Within SLA" value={sla.withinRate != null ? `${sla.withinRate}%` : '—'} sub={`${sla.breaching} breaching`} tone={sla.withinRate != null && sla.withinRate < 70 ? 'warn' : undefined} />
      </div>

      <div className="analytics-cols">
        {/* Content velocity */}
        <Card as="section">
          <CardTitle as="h2">Content velocity · last 8 weeks</CardTitle>
          <div className="bar-chart">
            {velocity.weekly.map((w) => (
              <div key={w.weekStart} className="bar-col" title={`Week of ${w.label}: ${w.completed} completed`}>
                <span className="bar-val">{w.completed || ''}</span>
                <span className="bar bar-grow" style={{ height: `${(w.completed / velMax) * 100}%`, background: 'var(--primary)', animationDelay: `${w.completed * 0.02}s` }} />
                <span className="bar-label">{w.label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Workload forecast */}
        <Card as="section">
          <CardTitle as="h2">Workload forecast · next 14 days</CardTitle>
          <div className="bar-chart bar-chart--dense">
            {forecast.map((d, i) => (
              <div key={i} className="bar-col" title={`${d.date.toLocaleDateString()}: ${d.due} due`}>
                <span className="bar-val">{d.due || ''}</span>
                <span className="bar bar-grow" style={{ height: `${(d.due / fcMax) * 100}%`, background: d.due >= 3 ? 'var(--color-danger)' : d.due === 2 ? 'var(--color-warning)' : 'var(--color-info)', animationDelay: `${i * 0.02}s` }} />
                <span className="bar-label">{d.date.getDate()}</span>
              </div>
            ))}
          </div>
          <p className="text-muted text-[.8rem] forecast-foot">
            {dueNext7} due in the next 7 days
            {overdueCarry > 0 && <> · <span className="text-danger">{overdueCarry} already overdue</span></>}
            {unscheduled > 0 && <> · {unscheduled} active with no deadline</>}
          </p>
        </Card>
      </div>

      {/* SLA tracking */}
      <Card as="section">
        <CardTitle as="h2">SLA · time in stage</CardTitle>
        <ul className="sla-list">
          {sla.byStage.map((s) => {
            const within = s.count - s.breaching;
            const pct = s.count ? (within / s.count) * 100 : 0;
            return (
              <li key={s.status} className="sla-row">
                <span className="sla-label">
                  <span className="legend-dot" style={{ background: STATUS_COLORS[s.status] }} />
                  {STATUS_LABELS[s.status]}
                  <span className="text-muted text-[.8rem]"> · limit {formatAge(s.limitMs)}</span>
                </span>
                <span className="sla-bar">
                  <span className="sla-fill-ok" style={{ '--fill': `${pct}%` }} />
                  <span className="sla-fill-over" style={{ '--fill': `${100 - pct}%` }} />
                </span>
                <span className="sla-meta">
                  {s.count === 0 ? <span className="text-muted">none</span>
                    : s.breaching > 0 ? <span className="text-danger">{s.breaching} over</span>
                    : <span className="sla-clear">on track</span>}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* Client health */}
      <Card as="section" noPad>
        <div className="table-head-pad"><CardTitle as="h2">Client health</CardTitle></div>
        {activeClients.length === 0 ? (
          <EmptyState title="No clients yet" message="Client metrics appear once content is assigned." />
        ) : (<>
          <div className="table-scroll">
            <table className="table analytics-table">
              <thead>
                <tr>
                  <th>Client</th><th>Total</th><th>Active</th><th>Completed</th>
                  <th>On-time</th><th>Avg turnaround</th><th>Avg TTW</th>
                </tr>
              </thead>
              <tbody>
                {activeClients.map((c) => (
                  <tr key={c.id}>
                    <td className="font-semibold">{c.name}{c.overdueActive > 0 && <span className="overdue-tag overdue-tag--sm">{c.overdueActive} overdue</span>}</td>
                    <td>{c.total}</td>
                    <td>{c.active}</td>
                    <td>{c.completed}</td>
                    <td>{c.onTimeRate != null ? <RatePill value={c.onTimeRate} /> : <span className="text-muted">—</span>}</td>
                    <td>{c.avgTurnaroundDays != null ? `${c.avgTurnaroundDays}d` : <span className="text-muted">—</span>}</td>
                    <td>{c.avgTtwMinutes != null ? formatTTW(c.avgTtwMinutes) : <span className="text-muted">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-bot-pad" />
        </>)}
      </Card>

      {/* Writer trends */}
      <Card as="section" noPad>
        <div className="table-head-pad"><CardTitle as="h2">Writer trends</CardTitle></div>
        {activeWriters.length === 0 ? (
          <EmptyState title="No writers yet" message="Throughput appears once writers complete work." />
        ) : (<>
          <div className="table-scroll">
            <table className="table analytics-table">
              <thead>
                <tr>
                  <th>Writer</th><th>Active</th><th>Completed</th><th>This month</th>
                  <th>Avg TTW</th><th>On-time</th>
                </tr>
              </thead>
              <tbody>
                {activeWriters.map((w) => {
                  const delta = w.completedThisMonth - w.completedLastMonth;
                  return (
                    <tr key={w.id}>
                      <td className="font-semibold analytics-writer">
                        <span className="analytics-avatar">{initials(w.name)}</span>
                        {w.name}{w.role === 'TEAM_LEADER' && <span className="role-chip role-chip--tl">TL</span>}
                      </td>
                      <td>{w.active}</td>
                      <td>{w.completed}</td>
                      <td>
                        {w.completedThisMonth}
                        {delta !== 0 && <span className={`trend ${delta > 0 ? 'trend--up' : 'trend--down'}`}>{delta > 0 ? '▲' : '▼'} {Math.abs(delta)}</span>}
                      </td>
                      <td>{w.avgTtwMinutes != null ? formatTTW(w.avgTtwMinutes) : <span className="text-muted">—</span>}</td>
                      <td>{w.onTimeRate != null ? <RatePill value={w.onTimeRate} /> : <span className="text-muted">—</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="table-bot-pad" />
        </>)}
      </Card>
    </div>
  );
}

function Kpi({ label, value, sub, trend, tone }) {
  return (
    <div className={`kpi-card ${tone ? `kpi-card--${tone}` : ''}`}>
      <span className="kpi-value">
        {value}
        {trend != null && trend !== 0 && <span className={`trend ${trend > 0 ? 'trend--up' : 'trend--down'}`}>{trend > 0 ? '▲' : '▼'} {Math.abs(trend)}</span>}
      </span>
      <span className="kpi-label">{label}</span>
      {sub && <span className="kpi-sub">{sub}</span>}
    </div>
  );
}

function RatePill({ value }) {
  const level = value >= 85 ? 'ok' : value >= 60 ? 'mid' : 'low';
  return <span className={`rate-pill rate-pill--${level}`}>{value}%</span>;
}
