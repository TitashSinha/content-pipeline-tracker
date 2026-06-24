// FEATURE: Threaded comments (Phase 7). A separate collection (not activityLogs)
// because comments are editable/deletable, whereas log entries are immutable. One
// level of threading: a reply carries parentId pointing at a top-level comment.
// Posting notifies the article's audience (assignee + followers) via notify.js.
import { Router } from 'express';
import { getDB, persist, nextId } from '../db.js';
import { authRequired } from '../auth.js';
import { notifyComment } from '../notify.js';

const router = Router();

const resolveUser = (db, id) =>
  db.users.find((u) => u.id === id) || db.archivedUsers.find((u) => u.id === id) || null;

// Same visibility rule as articles: admins/TLs see all; a writer only their own
// non-draft pieces. Comments inherit the article's access.
function canAccessArticle(req, a) {
  if (!a) return false;
  return req.user.role === 'ADMIN' || req.user.role === 'TEAM_LEADER'
    || (a.assignedWriterId === req.user.id && a.status !== 'DRAFT');
}

function enrich(db, c) {
  const u = resolveUser(db, c.authorId);
  return { ...c, authorName: u?.name ?? 'Unknown', authorRole: u?.role ?? null };
}

router.get('/article/:id', authRequired, (req, res) => {
  const db = getDB();
  const a = db.articles.find((x) => x.id === Number(req.params.id));
  if (!a) return res.status(404).json({ error: 'Article not found' });
  if (!canAccessArticle(req, a)) return res.status(403).json({ error: 'Not your article' });
  const list = db.comments
    .filter((c) => c.articleId === a.id)
    .sort((x, y) => new Date(x.createdAt) - new Date(y.createdAt))
    .map((c) => enrich(db, c));
  res.json(list);
});

router.post('/', authRequired, (req, res) => {
  const db = getDB();
  const { articleId, body, parentId } = req.body || {};
  const text = String(body || '').trim();
  if (!text) return res.status(400).json({ error: 'Comment cannot be empty' });
  const a = db.articles.find((x) => x.id === Number(articleId));
  if (!a) return res.status(404).json({ error: 'Article not found' });
  if (!canAccessArticle(req, a)) return res.status(403).json({ error: 'Not your article' });

  // Replies attach only to a top-level comment on the same article (one level deep).
  let parent = null;
  if (parentId != null) {
    parent = db.comments.find((c) => c.id === Number(parentId) && c.articleId === a.id);
    if (!parent) return res.status(400).json({ error: 'Reply target not found' });
    if (parent.parentId) return res.status(400).json({ error: 'Replies can only attach to a top-level comment' });
  }

  const now = new Date().toISOString();
  const comment = {
    id: nextId('comments'),
    articleId: a.id,
    authorId: req.user.id,
    parentId: parent ? parent.id : null,
    body: text,
    createdAt: now,
    editedAt: null,
  };
  db.comments.push(comment);
  notifyComment(db, a, comment, req.user.id);
  persist();
  res.status(201).json(enrich(db, comment));
});

router.put('/:id', authRequired, (req, res) => {
  const db = getDB();
  const c = db.comments.find((x) => x.id === Number(req.params.id));
  if (!c) return res.status(404).json({ error: 'Comment not found' });
  if (c.authorId !== req.user.id) return res.status(403).json({ error: 'You can only edit your own comments' });
  const text = String(req.body?.body || '').trim();
  if (!text) return res.status(400).json({ error: 'Comment cannot be empty' });
  c.body = text;
  c.editedAt = new Date().toISOString();
  persist();
  res.json(enrich(db, c));
});

router.delete('/:id', authRequired, (req, res) => {
  const db = getDB();
  const c = db.comments.find((x) => x.id === Number(req.params.id));
  if (!c) return res.status(404).json({ error: 'Comment not found' });
  const isAdmin = req.user.role === 'ADMIN';
  if (c.authorId !== req.user.id && !isAdmin) {
    return res.status(403).json({ error: 'You can only delete your own comments' });
  }
  // Deleting a top-level comment removes its replies too.
  db.comments = db.comments.filter((x) => x.id !== c.id && x.parentId !== c.id);
  persist();
  res.json({ ok: true });
});

export default router;
