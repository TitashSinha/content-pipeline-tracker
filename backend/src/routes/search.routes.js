import { Router } from 'express';
import { getDB } from '../db.js';
import { authRequired } from '../auth.js';

const router = Router();
const ASSIGNABLE_ROLES = ['WRITER', 'TEAM_LEADER'];

router.get('/', authRequired, (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  if (q.length < 2) return res.json({ articles: [], writers: [], clients: [] });

  const db = getDB();
  const isPrivileged = req.user.role === 'ADMIN' || req.user.role === 'TEAM_LEADER';

  const articles = (
    isPrivileged
      ? db.articles
      : db.articles.filter((a) => a.assignedWriterId === req.user.id)
  )
    .filter((a) => a.title.toLowerCase().includes(q))
    .slice(0, 6)
    .map((a) => ({ id: a.id, title: a.title, status: a.status }));

  const writers = isPrivileged
    ? db.users
        .filter((u) => ASSIGNABLE_ROLES.includes(u.role) && u.name.toLowerCase().includes(q))
        .slice(0, 5)
        .map((u) => ({ id: u.id, name: u.name, role: u.role }))
    : [];

  const clients = isPrivileged
    ? db.clients
        .filter((c) => c.name.toLowerCase().includes(q))
        .slice(0, 5)
        .map((c) => ({ id: c.id, name: c.name }))
    : [];

  res.json({ articles, writers, clients });
});

export default router;
