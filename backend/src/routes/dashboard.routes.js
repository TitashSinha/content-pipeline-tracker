import { Router } from 'express';
import { getDB } from '../db.js';
import { authRequired, teamLeaderOrAdminOnly } from '../auth.js';
import { emptyStageTally, isActive } from '../workflow.js';
import { computeTTWMinutes } from '../ttw.js';

const router = Router();

// Actual time-to-write for one article (manual override wins, else the
// clock-summed writing time). Mirrors the helper in articles.routes.js.
const actualTTW = (db, a) =>
  a.ttwOverrideMinutes != null
    ? a.ttwOverrideMinutes
    : computeTTWMinutes(db.activityLogs.filter((l) => l.articleId === a.id), a.status, a.pausedAt != null);

// Monday 00:00 of the current week (local time).
function startOfWeek(now) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - day);
  return d;
}
// End of the deadline day (deadlines are day-granular; on-time means same day OK).
const endOfDeadlineDay = (iso) => {
  const d = new Date(iso);
  d.setHours(23, 59, 59, 999);
  return d;
};

// Team-wide dashboard: stats, by-stage tally, and per-writer workload.
// Admin + Team Leader both manage the team, so both may read it.
router.get('/', authRequired, teamLeaderOrAdminOnly, (req, res) => {
  const db = getDB();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const active = db.articles.filter((a) => isActive(a.status));
  const overdue = active.filter((a) => a.deadline && new Date(a.deadline) < now);

  // When was each article completed? (timestamp of its COMPLETED log)
  const completedAt = {};
  for (const log of db.activityLogs) {
    if (log.newStatus === 'COMPLETED') completedAt[log.articleId] = log.createdAt;
  }
  const doneThisMonth = db.articles.filter(
    (a) =>
      a.status === 'COMPLETED' &&
      completedAt[a.id] &&
      new Date(completedAt[a.id]) >= monthStart,
  ).length;

  const byStage = emptyStageTally();
  for (const a of db.articles) byStage[a.status] = (byStage[a.status] || 0) + 1;

  const workload = db.users
    .filter((u) => u.role === 'WRITER' || u.role === 'TEAM_LEADER')
    .map((u) => {
      const mine = active.filter((a) => a.assignedWriterId === u.id);
      return {
        id: u.id,
        name: u.name,
        role: u.role,
        active: mine.length,
        overdue: mine.filter((a) => a.deadline && new Date(a.deadline) < now).length,
      };
    })
    .sort((a, b) => b.active - a.active);

  res.json({
    active: active.length,
    overdue: overdue.length,
    doneThisMonth,
    byStage,
    workload,
  });
});

// FEATURE: Personal metrics (Phase 3) — the signed-in user's own numbers.
// Any authenticated role; a writer sees their own throughput, a TL/admin sees
// theirs for the work assigned to them. Activity-log-backed (completion times,
// TTW, on-time rate) so it can't be derived from the article list alone.
router.get('/me', authRequired, (req, res) => {
  const db = getDB();
  const uid = req.user.id;
  const now = new Date();
  const weekStart = startOfWeek(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const mine = db.articles.filter((a) => a.assignedWriterId === uid);
  const activeCount = mine.filter((a) => isActive(a.status)).length;

  // When was each of my articles completed? (timestamp of its COMPLETED log)
  const completedAt = {};
  for (const log of db.activityLogs) {
    if (log.newStatus === 'COMPLETED') completedAt[log.articleId] = log.createdAt;
  }
  const completed = mine.filter((a) => a.status === 'COMPLETED' && completedAt[a.id]);
  const completedThisWeek = completed.filter((a) => new Date(completedAt[a.id]) >= weekStart).length;
  const completedThisMonth = completed.filter((a) => new Date(completedAt[a.id]) >= monthStart).length;

  // Average actual TTW across completed pieces that have a measurable time.
  const times = completed.map((a) => actualTTW(db, a)).filter((m) => m > 0);
  const avgTtwMinutes = times.length ? Math.round(times.reduce((s, m) => s + m, 0) / times.length) : null;

  // On-time rate: of completed pieces that had a deadline, how many landed by it.
  const withDeadline = completed.filter((a) => a.deadline);
  const onTime = withDeadline.filter((a) => new Date(completedAt[a.id]) <= endOfDeadlineDay(a.deadline)).length;
  const onTimeRate = withDeadline.length ? Math.round((onTime / withDeadline.length) * 100) : null;

  res.json({
    activeCount,
    completedThisWeek,
    completedThisMonth,
    avgTtwMinutes,
    onTimeRate,
    onTimeCount: onTime,
    onTimeTotal: withDeadline.length,
  });
});

export default router;
