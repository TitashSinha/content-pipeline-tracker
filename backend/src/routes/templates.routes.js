import { Router } from 'express';
import { getDB, persist, nextId } from '../db.js';
import { authRequired, teamLeaderOrAdminOnly } from '../auth.js';

// FEATURE: Article Templates
// Reusable article briefs (content type / word count / TTW / brief notes / links).
// Applied when creating content (see frontend ArticleForm) and referenceable as a
// client's default brief (clients.defaultTemplateId). Read is open to any signed-in
// user (so the picker works); writes are Admin/TL only.

const router = Router();

const sanitizeLinks = (v) => (Array.isArray(v) ? v : []).map((s) => String(s).trim()).filter(Boolean);
const cleanText = (v) => String(v ?? '').trim() || null;
const num = (v) => (v === '' || v == null ? null : Number(v));

function applyFields(t, b) {
  if ('name' in b) t.name = String(b.name).trim();
  if ('articleTypeId' in b) t.articleTypeId = b.articleTypeId ? Number(b.articleTypeId) : null;
  if ('wordCountTarget' in b) t.wordCountTarget = num(b.wordCountTarget);
  if ('ttwTargetMinutes' in b) t.ttwTargetMinutes = num(b.ttwTargetMinutes);
  if ('briefNotes' in b) t.briefNotes = cleanText(b.briefNotes);
  if ('referenceLinks' in b) t.referenceLinks = sanitizeLinks(b.referenceLinks);
}

router.get('/', authRequired, (req, res) => {
  res.json(getDB().templates);
});

router.post('/', authRequired, teamLeaderOrAdminOnly, (req, res) => {
  const db = getDB();
  const name = String(req.body?.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Template name is required' });
  const now = new Date().toISOString();
  const template = {
    id: nextId('templates'),
    name,
    articleTypeId: null,
    wordCountTarget: null,
    ttwTargetMinutes: null,
    briefNotes: null,
    referenceLinks: [],
    createdAt: now,
    updatedAt: now,
  };
  applyFields(template, req.body || {});
  db.templates.push(template);
  persist();
  res.status(201).json(template);
});

router.put('/:id', authRequired, teamLeaderOrAdminOnly, (req, res) => {
  const db = getDB();
  const t = db.templates.find((x) => x.id === Number(req.params.id));
  if (!t) return res.status(404).json({ error: 'Template not found' });
  if ('name' in (req.body || {}) && !String(req.body.name).trim()) {
    return res.status(400).json({ error: 'Template name is required' });
  }
  applyFields(t, req.body || {});
  t.updatedAt = new Date().toISOString();
  persist();
  res.json(t);
});

router.delete('/:id', authRequired, teamLeaderOrAdminOnly, (req, res) => {
  const db = getDB();
  const id = Number(req.params.id);
  const idx = db.templates.findIndex((x) => x.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Template not found' });
  db.templates.splice(idx, 1);
  // Clear any client default that pointed at this template.
  for (const c of db.clients) if (c.defaultTemplateId === id) c.defaultTemplateId = null;
  persist();
  res.json({ ok: true });
});

export default router;
