import { Router } from 'express';
import { getDB, persist, nextId } from '../db.js';
import { authRequired, adminOnly } from '../auth.js';

const router = Router();

router.get('/', authRequired, (req, res) => {
  res.json(getDB().articleTypes);
});

router.post('/', authRequired, adminOnly, (req, res) => {
  const { name } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  const db = getDB();
  if (db.articleTypes.find((t) => t.name.toLowerCase() === name.trim().toLowerCase())) {
    return res.status(409).json({ error: 'A type with that name already exists' });
  }
  const type = { id: nextId('articleTypes'), name: name.trim() };
  db.articleTypes.push(type);
  persist();
  res.status(201).json(type);
});

router.put('/:id', authRequired, adminOnly, (req, res) => {
  const db = getDB();
  const type = db.articleTypes.find((t) => t.id === Number(req.params.id));
  if (!type) return res.status(404).json({ error: 'Type not found' });
  const { name } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  const clash = db.articleTypes.find(
    (t) => t.id !== type.id && t.name.toLowerCase() === name.trim().toLowerCase()
  );
  if (clash) return res.status(409).json({ error: 'A type with that name already exists' });
  type.name = name.trim();
  persist();
  res.json(type);
});

router.delete('/:id', authRequired, adminOnly, (req, res) => {
  const db = getDB();
  const id = Number(req.params.id);
  const inUse = db.articles.some((a) => a.articleTypeId === id);
  if (inUse) return res.status(409).json({ error: 'This type is used by existing articles and cannot be deleted' });
  db.articleTypes = db.articleTypes.filter((t) => t.id !== id);
  persist();
  res.json({ ok: true });
});

export default router;
