import { Router } from 'express';
import { getDB } from '../db.js';
import { authRequired, adminOnly } from '../auth.js';

const router = Router();

router.get('/', authRequired, adminOnly, (req, res) => {
  const db = getDB();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const active = db.articles.filter((a) => a.status !== 'COMPLETED');
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

  const byStage = { BRIEF_PENDING: 0, WRITING: 0, REVIEW: 0, COMPLETED: 0 };
  for (const a of db.articles) byStage[a.status] = (byStage[a.status] || 0) + 1;

  const workload = db.users
    .filter((u) => u.role === 'WRITER' || u.role === 'TEAM_LEADER')
    .map((u) => ({
      id: u.id,
      name: u.name,
      role: u.role,
      active: active.filter((a) => a.assignedWriterId === u.id).length,
    }))
    .sort((a, b) => b.active - a.active);

  res.json({
    active: active.length,
    overdue: overdue.length,
    doneThisMonth,
    byStage,
    workload,
  });
});

export default router;
