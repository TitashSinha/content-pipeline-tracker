import { Router } from 'express';
import { getDB, persist, nextId } from '../db.js';
import { authRequired, adminOnly, teamLeaderOrAdminOnly } from '../auth.js';
import { computeTTWMinutes } from '../ttw.js';

const router = Router();

// Legal forward/backward moves. COMPLETED is admin-only (enforced below).
const TRANSITIONS = {
  BRIEF_PENDING: ['WRITING'],
  WRITING: ['REVIEW'],
  REVIEW: ['WRITING', 'COMPLETED'],
  COMPLETED: [],
};

const nameById = (db, collection, id) =>
  db[collection].find((row) => row.id === id)?.name ?? null;

// Active writer's name, or "Unknown Writer" once they've been removed (binned).
const writerName = (db, id) => {
  const writer = db.users.find((u) => u.id === id);
  return writer ? writer.name : 'Unknown Writer';
};

// For historical attribution, also look in the bin so past actions keep a name.
const resolveUser = (db, id) =>
  db.users.find((u) => u.id === id) || db.archivedUsers.find((u) => u.id === id) || null;
const resolveUserName = (db, id) => resolveUser(db, id)?.name ?? null;

const isOverdue = (a) =>
  !!(a.deadline && a.status !== 'COMPLETED' && new Date(a.deadline) < new Date());

const sanitizeLinks = (value) =>
  (Array.isArray(value) ? value : [])
    .map((s) => String(s).trim())
    .filter(Boolean);

// A manually-entered time wins; otherwise the clock-summed writing time.
function actualTTW(db, a) {
  if (a.ttwOverrideMinutes != null) return a.ttwOverrideMinutes;
  const logs = db.activityLogs.filter((l) => l.articleId === a.id);
  return computeTTWMinutes(logs, a.status);
}

/** Lightweight shape for tables/cards. */
function enrichList(db, a) {
  const writer = db.users.find((u) => u.id === a.assignedWriterId);
  return {
    ...a,
    referenceLinks: a.referenceLinks ?? [],
    clientName: nameById(db, 'clients', a.clientId) ?? 'Unknown client',
    typeName: nameById(db, 'articleTypes', a.articleTypeId),
    writerName: writer ? writer.name : 'Unknown Writer',
    writerRole: writer ? writer.role : null,
    overdue: isOverdue(a),
    ttwManual: a.ttwOverrideMinutes != null,
    ttwActualMinutes:
      a.status === 'COMPLETED' || a.ttwOverrideMinutes != null ? actualTTW(db, a) : null,
  };
}

/** Full shape for the detail page, including the activity timeline. */
function enrichDetail(db, a) {
  const logs = db.activityLogs
    .filter((l) => l.articleId === a.id)
    .sort((x, y) => new Date(x.createdAt) - new Date(y.createdAt))
    .map((l) => {
      const u = resolveUser(db, l.changedById);
      return { ...l, changedByName: u?.name ?? null, changedByRole: u?.role ?? null };
    });
  return {
    ...enrichList(db, a),
    createdByName: resolveUserName(db, a.createdById),
    ttwActualMinutes: actualTTW(db, a),
    activity: logs,
  };
}

const canAccess = (req, a) =>
  req.user.role === 'ADMIN' || req.user.role === 'TEAM_LEADER' || a.assignedWriterId === req.user.id;

// --- list & detail ------------------------------------------------------
router.get('/', authRequired, (req, res) => {
  const db = getDB();
  const canSeeAll = req.user.role === 'ADMIN' || req.user.role === 'TEAM_LEADER';
  const visible = canSeeAll
    ? db.articles
    : db.articles.filter((a) => a.assignedWriterId === req.user.id);
  res.json(visible.map((a) => enrichList(db, a)));
});

router.get('/:id', authRequired, (req, res) => {
  const db = getDB();
  const a = db.articles.find((x) => x.id === Number(req.params.id));
  if (!a) return res.status(404).json({ error: 'Article not found' });
  if (!canAccess(req, a)) return res.status(403).json({ error: 'Not your article' });
  res.json(enrichDetail(db, a));
});

// --- batch create (admin / TL) ------------------------------------------
router.post('/batch', authRequired, teamLeaderOrAdminOnly, (req, res) => {
  const items = req.body?.articles;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Provide an array of articles' });
  }
  const db = getDB();
  const now = new Date().toISOString();
  const created = [];
  for (const b of items) {
    if (!b.title || !b.clientId || !b.articleTypeId || !b.assignedWriterId) {
      return res.status(400).json({ error: 'Each article needs title, client, type and writer' });
    }
    const article = {
      id: nextId('articles'),
      title: String(b.title).trim(),
      status: 'BRIEF_PENDING',
      clientId: Number(b.clientId),
      articleTypeId: Number(b.articleTypeId),
      assignedWriterId: Number(b.assignedWriterId),
      createdById: req.user.id,
      deadline: b.deadline || null,
      wordCountTarget: b.wordCountTarget ? Number(b.wordCountTarget) : null,
      ttwTargetMinutes: b.ttwTargetMinutes ? Number(b.ttwTargetMinutes) : null,
      referenceLinks: (Array.isArray(b.referenceLinks) ? b.referenceLinks : []).map((s) => String(s).trim()).filter(Boolean),
      briefNotes: b.briefNotes?.trim() || null,
      ttwOverrideMinutes: null,
      createdAt: now,
      updatedAt: now,
    };
    db.articles.push(article);
    created.push(enrichDetail(db, article));
  }
  persist();
  res.status(201).json(created);
});

// --- create / update / delete (admin / TL) ------------------------------
router.post('/', authRequired, teamLeaderOrAdminOnly, (req, res) => {
  const b = req.body || {};
  if (!b.title || !b.clientId || !b.articleTypeId || !b.assignedWriterId) {
    return res.status(400).json({ error: 'Title, client, type and writer are required' });
  }
  const db = getDB();
  const now = new Date().toISOString();
  const article = {
    id: nextId('articles'),
    title: String(b.title).trim(),
    status: 'BRIEF_PENDING',
    clientId: Number(b.clientId),
    articleTypeId: Number(b.articleTypeId),
    assignedWriterId: Number(b.assignedWriterId),
    createdById: req.user.id,
    deadline: b.deadline || null,
    wordCountTarget: b.wordCountTarget ? Number(b.wordCountTarget) : null,
    ttwTargetMinutes: b.ttwTargetMinutes ? Number(b.ttwTargetMinutes) : null,
    referenceLinks: sanitizeLinks(b.referenceLinks),
    briefNotes: b.briefNotes?.trim() || null,
    ttwOverrideMinutes: null,
    createdAt: now,
    updatedAt: now,
  };
  db.articles.push(article);
  persist();
  res.status(201).json(enrichDetail(db, article));
});

router.put('/:id', authRequired, teamLeaderOrAdminOnly, (req, res) => {
  const db = getDB();
  const a = db.articles.find((x) => x.id === Number(req.params.id));
  if (!a) return res.status(404).json({ error: 'Article not found' });

  const b = req.body || {};
  const prevWriterId = a.assignedWriterId;
  const prevDeadline = a.deadline;
  const idFields = ['clientId', 'articleTypeId', 'assignedWriterId'];
  const numFields = ['wordCountTarget', 'ttwTargetMinutes'];
  const textFields = ['title', 'deadline', 'briefNotes'];

  for (const f of idFields) if (f in b) a[f] = Number(b[f]);
  for (const f of numFields)
    if (f in b) a[f] = b[f] === '' || b[f] == null ? null : Number(b[f]);
  for (const f of textFields)
    if (f in b) a[f] = b[f] === '' || b[f] == null ? null : String(b[f]).trim();
  if ('referenceLinks' in b) a.referenceLinks = sanitizeLinks(b.referenceLinks);

  // Record a deadline change in the activity log.
  if ('deadline' in b && a.deadline !== prevDeadline) {
    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'not set';
    db.activityLogs.push({
      id: nextId('activityLogs'),
      articleId: a.id,
      changedById: req.user.id,
      oldStatus: a.status,
      newStatus: a.status,
      kind: 'deadline',
      note: `Deadline changed from ${fmt(prevDeadline)} to ${fmt(a.deadline)}`,
      createdAt: new Date().toISOString(),
    });
  }

  // Record a reassignment in the activity log when the writer actually changes.
  if ('assignedWriterId' in b && Number(b.assignedWriterId) !== prevWriterId) {
    db.activityLogs.push({
      id: nextId('activityLogs'),
      articleId: a.id,
      changedById: req.user.id,
      oldStatus: a.status,
      newStatus: a.status,
      kind: 'reassign',
      note: `Reassigned from ${writerName(db, prevWriterId)} to ${writerName(db, a.assignedWriterId)}`,
      createdAt: new Date().toISOString(),
    });
  }

  a.updatedAt = new Date().toISOString();
  persist();
  res.json(enrichDetail(db, a));
});

router.delete('/:id', authRequired, adminOnly, (req, res) => {
  const db = getDB();
  const idx = db.articles.findIndex((x) => x.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Article not found' });
  const [removed] = db.articles.splice(idx, 1);
  db.activityLogs = db.activityLogs.filter((l) => l.articleId !== removed.id);
  persist();
  res.json({ ok: true });
});

// --- status change ------------------------------------------------------
router.post('/:id/status', authRequired, (req, res) => {
  const db = getDB();
  const a = db.articles.find((x) => x.id === Number(req.params.id));
  if (!a) return res.status(404).json({ error: 'Article not found' });
  if (!canAccess(req, a)) return res.status(403).json({ error: 'Not your article' });

  const to = req.body?.status;
  const from = a.status;
  if (!(TRANSITIONS[from] || []).includes(to)) {
    return res.status(400).json({ error: `Cannot move from ${from} to ${to}` });
  }
  if (to === 'COMPLETED' && req.user.role !== 'ADMIN' && req.user.role !== 'TEAM_LEADER') {
    return res.status(403).json({ error: 'Only an admin or team leader can mark content complete' });
  }

  db.activityLogs.push({
    id: nextId('activityLogs'),
    articleId: a.id,
    changedById: req.user.id,
    oldStatus: from,
    newStatus: to,
    note: String(req.body?.note || '').trim() || null,
    createdAt: new Date().toISOString(),
  });
  a.status = to;
  a.updatedAt = new Date().toISOString();
  persist();
  res.json(enrichDetail(db, a));
});

// --- reference links ----------------------------------------------------
router.put('/:id/links', authRequired, (req, res) => {
  const db = getDB();
  const a = db.articles.find((x) => x.id === Number(req.params.id));
  if (!a) return res.status(404).json({ error: 'Article not found' });
  if (!canAccess(req, a)) return res.status(403).json({ error: 'Not your article' });
  a.referenceLinks = sanitizeLinks(req.body?.referenceLinks);
  a.updatedAt = new Date().toISOString();
  persist();
  res.json(enrichDetail(db, a));
});

// --- manual time taken (overrides the auto-tracked TTW) ------------------
router.put('/:id/time-taken', authRequired, (req, res) => {
  const db = getDB();
  const a = db.articles.find((x) => x.id === Number(req.params.id));
  if (!a) return res.status(404).json({ error: 'Article not found' });
  if (!canAccess(req, a)) return res.status(403).json({ error: 'Not your article' });
  const { minutes } = req.body || {};
  if (minutes == null || minutes === '') {
    a.ttwOverrideMinutes = null; // revert to automatic tracking
  } else {
    const n = Number(minutes);
    if (!Number.isFinite(n) || n < 0) return res.status(400).json({ error: 'Enter a valid number of minutes' });
    a.ttwOverrideMinutes = Math.round(n);
  }
  a.updatedAt = new Date().toISOString();
  persist();
  res.json(enrichDetail(db, a));
});

export default router;
