// FEATURE: Org activity feed + Audit log (Phase 7). One filterable surface for
// Admin/TL: a unified, reverse-chronological stream of every status change,
// reassignment, deadline edit, pause/resume, and comment across all articles.
// Filters (kind / actor / text) turn the live feed into an auditable history.
import { Router } from 'express';
import { getDB } from '../db.js';
import { authRequired, teamLeaderOrAdminOnly } from '../auth.js';

const router = Router();
const FEED_LIMIT = 80;

const resolveUser = (db, id) =>
  db.users.find((u) => u.id === id) || db.archivedUsers.find((u) => u.id === id) || null;

router.get('/', authRequired, teamLeaderOrAdminOnly, (req, res) => {
  const db = getDB();
  const titleOf = (id) => db.articles.find((a) => a.id === id)?.title ?? 'Unknown content';
  const actor = (id) => {
    const u = id != null ? resolveUser(db, id) : null;
    return { actorId: id ?? null, actorName: u?.name ?? (id == null ? 'Automation' : 'Unknown'), actorRole: u?.role ?? null };
  };

  // activity-log events (status transitions, reassign, deadline, pause/resume)
  const logEvents = db.activityLogs.map((l) => ({
    id: `log-${l.id}`,
    kind: l.kind || 'status',
    articleId: l.articleId,
    articleTitle: titleOf(l.articleId),
    oldStatus: l.oldStatus,
    newStatus: l.newStatus,
    note: l.note ?? null,
    createdAt: l.createdAt,
    ...actor(l.changedById),
  }));

  // comment events
  const commentEvents = db.comments.map((c) => ({
    id: `comment-${c.id}`,
    kind: 'comment',
    articleId: c.articleId,
    articleTitle: titleOf(c.articleId),
    body: c.body,
    isReply: c.parentId != null,
    createdAt: c.createdAt,
    ...actor(c.authorId),
  }));

  let events = [...logEvents, ...commentEvents];

  // --- filters (these are what make it an audit log) ---
  const { kind, actorId, q } = req.query;
  if (kind) events = events.filter((e) => e.kind === kind);
  if (actorId) events = events.filter((e) => String(e.actorId) === String(actorId));
  if (q) {
    const needle = String(q).toLowerCase();
    events = events.filter((e) => (e.articleTitle || '').toLowerCase().includes(needle));
  }

  events.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const limit = Math.min(Number(req.query.limit) || FEED_LIMIT, 300);
  res.json({ total: events.length, events: events.slice(0, limit) });
});

export default router;
