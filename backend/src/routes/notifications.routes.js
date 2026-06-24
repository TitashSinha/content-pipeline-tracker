// FEATURE: Notifications center (Phase 7). Each user's own feed. Notifications
// are created on write (see notify.js); this route reads them back, enriched with
// the current article title + actor, and lets the user mark them read.
import { Router } from 'express';
import { getDB, persist } from '../db.js';
import { authRequired } from '../auth.js';

const router = Router();
const FEED_LIMIT = 40;

const resolveUser = (db, id) =>
  db.users.find((u) => u.id === id) || db.archivedUsers.find((u) => u.id === id) || null;

function enrich(db, n) {
  const actor = n.actorId != null ? resolveUser(db, n.actorId) : null;
  const article = n.articleId != null ? db.articles.find((a) => a.id === n.articleId) : null;
  return {
    ...n,
    actorName: actor?.name ?? (n.actorId == null ? 'Automation' : null),
    actorRole: actor?.role ?? null,
    articleTitle: article?.title ?? null,
  };
}

router.get('/', authRequired, (req, res) => {
  const db = getDB();
  const mine = db.notifications
    .filter((n) => n.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({
    unread: mine.filter((n) => !n.read).length,
    items: mine.slice(0, FEED_LIMIT).map((n) => enrich(db, n)),
  });
});

router.post('/:id/read', authRequired, (req, res) => {
  const db = getDB();
  const n = db.notifications.find((x) => x.id === Number(req.params.id) && x.userId === req.user.id);
  if (!n) return res.status(404).json({ error: 'Notification not found' });
  n.read = true;
  persist();
  res.json({ ok: true });
});

router.post('/read-all', authRequired, (req, res) => {
  const db = getDB();
  let changed = 0;
  for (const n of db.notifications) {
    if (n.userId === req.user.id && !n.read) { n.read = true; changed++; }
  }
  if (changed) persist();
  res.json({ ok: true, changed });
});

export default router;
