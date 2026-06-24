// FEATURE: Analytics & Reporting (Phase 5). Historical, activity-log-backed
// series that the article list alone can't provide: content velocity over time,
// per-client health, and per-writer throughput trends. "Current snapshot"
// analytics (workload forecast, SLA / time-in-stage) are derived on the frontend
// from the article list via lib/risk.js — this endpoint owns only what needs the
// activity log (completion timestamps, turnaround, TTW).
import { Router } from 'express';
import { getDB } from '../db.js';
import { authRequired, adminOnly } from '../auth.js';
import { isActive } from '../workflow.js';
import { computeTTWMinutes } from '../ttw.js';

const router = Router();

const DAY = 86400000;
const avg = (arr) => (arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : null);
const round1 = (n) => (n == null ? null : Math.round(n * 10) / 10);

// Monday 00:00 of the week containing `d` (local time).
function startOfWeek(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}
// End of a (day-granular) deadline — on-time means delivered same day or earlier.
const endOfDeadlineDay = (iso) => {
  const d = new Date(iso); d.setHours(23, 59, 59, 999); return d;
};

const VELOCITY_WEEKS = 8;

router.get('/', authRequired, adminOnly, (req, res) => {
  const db = getDB();
  const now = new Date();

  // When was each article completed? (timestamp of its COMPLETED log)
  const completedAt = {};
  for (const log of db.activityLogs) {
    if (log.newStatus === 'COMPLETED') completedAt[log.articleId] = log.createdAt;
  }
  const completed = db.articles.filter((a) => a.status === 'COMPLETED' && completedAt[a.id]);

  // Per-article helpers (TTW: manual override wins, else clock-summed writing).
  const ttwOf = (a) =>
    a.ttwOverrideMinutes != null
      ? a.ttwOverrideMinutes
      : computeTTWMinutes(db.activityLogs.filter((l) => l.articleId === a.id), a.status, a.pausedAt != null);
  const turnaroundDays = (a) => (new Date(completedAt[a.id]) - new Date(a.createdAt)) / DAY;
  const isOnTime = (a) => new Date(completedAt[a.id]) <= endOfDeadlineDay(a.deadline);
  const avgTtw = (arts) => {
    const t = arts.map(ttwOf).filter((m) => m > 0);
    return t.length ? Math.round(avg(t)) : null;
  };
  const onTimeRate = (arts) => {
    const withDl = arts.filter((a) => a.deadline);
    if (!withDl.length) return null;
    return Math.round((withDl.filter(isOnTime).length / withDl.length) * 100);
  };

  // --- content velocity: completed pieces per week, last 8 weeks ---
  const thisWeek = startOfWeek(now);
  const weekly = [];
  for (let i = VELOCITY_WEEKS - 1; i >= 0; i--) {
    const start = new Date(thisWeek); start.setDate(start.getDate() - i * 7);
    const end = new Date(start); end.setDate(end.getDate() + 7);
    const count = completed.filter((a) => {
      const t = new Date(completedAt[a.id]);
      return t >= start && t < end;
    }).length;
    weekly.push({
      weekStart: start.toISOString(),
      label: start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      completed: count,
    });
  }
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const inMonth = (a, start, end) => {
    const t = new Date(completedAt[a.id]);
    return t >= start && (!end || t < end);
  };
  const completedThisMonth = completed.filter((a) => inMonth(a, monthStart)).length;
  const completedLastMonth = completed.filter((a) => inMonth(a, lastMonthStart, monthStart)).length;

  // --- client health ---
  const clients = db.clients
    .map((c) => {
      const arts = db.articles.filter((a) => a.clientId === c.id);
      const done = arts.filter((a) => a.status === 'COMPLETED' && completedAt[a.id]);
      return {
        id: c.id,
        name: c.name,
        total: arts.length,
        active: arts.filter((a) => isActive(a.status)).length,
        completed: done.length,
        overdueActive: arts.filter((a) => isActive(a.status) && a.deadline && new Date(a.deadline) < now).length,
        onTimeRate: onTimeRate(done),
        avgTurnaroundDays: done.length ? round1(avg(done.map(turnaroundDays))) : null,
        avgTtwMinutes: avgTtw(done),
      };
    })
    .sort((a, b) => b.total - a.total);

  // --- writer trends ---
  const writers = db.users
    .filter((u) => u.role === 'WRITER' || u.role === 'TEAM_LEADER')
    .map((u) => {
      const arts = db.articles.filter((a) => a.assignedWriterId === u.id);
      const done = arts.filter((a) => a.status === 'COMPLETED' && completedAt[a.id]);
      return {
        id: u.id,
        name: u.name,
        role: u.role,
        active: arts.filter((a) => isActive(a.status)).length,
        completed: done.length,
        completedThisMonth: done.filter((a) => inMonth(a, monthStart)).length,
        completedLastMonth: done.filter((a) => inMonth(a, lastMonthStart, monthStart)).length,
        avgTtwMinutes: avgTtw(done),
        onTimeRate: onTimeRate(done),
      };
    })
    .sort((a, b) => b.completed - a.completed);

  res.json({
    generatedAt: now.toISOString(),
    totals: {
      completedAll: completed.length,
      activeAll: db.articles.filter((a) => isActive(a.status)).length,
      completedThisMonth,
      completedLastMonth,
    },
    velocity: { weekly },
    clients,
    writers,
  });
});

export default router;
