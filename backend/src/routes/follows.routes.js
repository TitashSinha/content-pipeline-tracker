// FEATURE: Follow / watch (Phase 7). Opt into an article's updates without owning
// it — followers join the notification audience (see notify.js). Idempotent.
import { Router } from 'express';
import { getDB, persist, nextId } from '../db.js';
import { authRequired } from '../auth.js';

const router = Router();

function canAccessArticle(req, a) {
  if (!a) return false;
  return req.user.role === 'ADMIN' || req.user.role === 'TEAM_LEADER'
    || (a.assignedWriterId === req.user.id && a.status !== 'DRAFT');
}

const state = (db, articleId, userId) => {
  const followers = db.follows.filter((f) => f.articleId === articleId);
  return { isFollowing: followers.some((f) => f.userId === userId), followerCount: followers.length };
};

router.post('/article/:id', authRequired, (req, res) => {
  const db = getDB();
  const a = db.articles.find((x) => x.id === Number(req.params.id));
  if (!a) return res.status(404).json({ error: 'Article not found' });
  if (!canAccessArticle(req, a)) return res.status(403).json({ error: 'Not your article' });
  if (!db.follows.some((f) => f.articleId === a.id && f.userId === req.user.id)) {
    db.follows.push({ id: nextId('follows'), articleId: a.id, userId: req.user.id, createdAt: new Date().toISOString() });
    persist();
  }
  res.json(state(db, a.id, req.user.id));
});

router.delete('/article/:id', authRequired, (req, res) => {
  const db = getDB();
  const id = Number(req.params.id);
  const before = db.follows.length;
  db.follows = db.follows.filter((f) => !(f.articleId === id && f.userId === req.user.id));
  if (db.follows.length !== before) persist();
  res.json(state(db, id, req.user.id));
});

export default router;
