// FEATURE: Recurring Content (Phase 6) — CRUD for recurrence rules + a manual
// "Run now". Admin/TL only (they assign work). Reads run a sweep first so the
// list reflects anything that just came due. See recurrence.js for the engine.
import { Router } from 'express';
import { getDB, persist, nextId } from '../db.js';
import { authRequired, teamLeaderOrAdminOnly } from '../auth.js';
import { CADENCES, sweepRecurrences, runRecurrenceNow } from '../recurrence.js';

const router = Router();

const sanitizeLinks = (v) => (Array.isArray(v) ? v : []).map((s) => String(s).trim()).filter(Boolean);
const cleanText = (v) => String(v ?? '').trim() || null;
const num = (v) => (v === '' || v == null ? null : Number(v));

function applyFields(r, b) {
  if ('title' in b) r.title = String(b.title).trim();
  if ('clientId' in b) r.clientId = Number(b.clientId);
  if ('articleTypeId' in b) r.articleTypeId = Number(b.articleTypeId);
  if ('assignedWriterId' in b) r.assignedWriterId = Number(b.assignedWriterId);
  if ('cadence' in b && CADENCES.includes(b.cadence)) r.cadence = b.cadence;
  if ('leadTimeDays' in b) r.leadTimeDays = num(b.leadTimeDays);
  if ('wordCountTarget' in b) r.wordCountTarget = num(b.wordCountTarget);
  if ('ttwTargetMinutes' in b) r.ttwTargetMinutes = num(b.ttwTargetMinutes);
  if ('briefNotes' in b) r.briefNotes = cleanText(b.briefNotes);
  if ('referenceLinks' in b) r.referenceLinks = sanitizeLinks(b.referenceLinks);
  if ('nextRunAt' in b && b.nextRunAt) r.nextRunAt = new Date(b.nextRunAt).toISOString();
  if ('active' in b) r.active = !!b.active;
}

router.get('/', authRequired, teamLeaderOrAdminOnly, (req, res) => {
  const db = getDB();
  sweepRecurrences(db); // catch up before reporting
  res.json(db.recurrences);
});

router.post('/', authRequired, teamLeaderOrAdminOnly, (req, res) => {
  const b = req.body || {};
  if (!b.title || !b.clientId || !b.articleTypeId || !b.assignedWriterId) {
    return res.status(400).json({ error: 'Title, client, type and writer are required' });
  }
  if (!CADENCES.includes(b.cadence)) return res.status(400).json({ error: 'Pick a valid cadence' });
  const db = getDB();
  const now = new Date().toISOString();
  const recurrence = {
    id: nextId('recurrences'),
    title: String(b.title).trim(),
    clientId: Number(b.clientId),
    articleTypeId: Number(b.articleTypeId),
    assignedWriterId: Number(b.assignedWriterId),
    cadence: b.cadence,
    leadTimeDays: num(b.leadTimeDays) ?? 5,
    wordCountTarget: num(b.wordCountTarget),
    ttwTargetMinutes: num(b.ttwTargetMinutes),
    briefNotes: cleanText(b.briefNotes),
    referenceLinks: sanitizeLinks(b.referenceLinks),
    nextRunAt: b.nextRunAt ? new Date(b.nextRunAt).toISOString() : now,
    lastRunAt: null,
    active: b.active != null ? !!b.active : true,
    createdById: req.user.id,
    createdAt: now,
    updatedAt: now,
  };
  db.recurrences.push(recurrence);
  persist();
  res.status(201).json(recurrence);
});

router.put('/:id', authRequired, teamLeaderOrAdminOnly, (req, res) => {
  const db = getDB();
  const r = db.recurrences.find((x) => x.id === Number(req.params.id));
  if (!r) return res.status(404).json({ error: 'Recurrence not found' });
  applyFields(r, req.body || {});
  r.updatedAt = new Date().toISOString();
  persist();
  res.json(r);
});

router.delete('/:id', authRequired, teamLeaderOrAdminOnly, (req, res) => {
  const db = getDB();
  const idx = db.recurrences.findIndex((x) => x.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Recurrence not found' });
  db.recurrences.splice(idx, 1);
  persist();
  res.json({ ok: true });
});

// Manual spawn — create one piece now without disturbing the schedule.
router.post('/:id/run', authRequired, teamLeaderOrAdminOnly, (req, res) => {
  const db = getDB();
  const r = db.recurrences.find((x) => x.id === Number(req.params.id));
  if (!r) return res.status(404).json({ error: 'Recurrence not found' });
  const article = runRecurrenceNow(db, r);
  res.status(201).json({ id: article.id, title: article.title });
});

export default router;
