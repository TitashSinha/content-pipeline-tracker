import { Router } from 'express';
import { getDB, persist, nextId } from '../db.js';
import { authRequired, adminOnly, teamLeaderOrAdminOnly } from '../auth.js';
import { computeTTWMinutes } from '../ttw.js';
import { canTransition, requiresPrivilege } from '../workflow.js';
import { sweepRecurrences } from '../recurrence.js';
import { notifyStatusChange, notifyAssigned } from '../notify.js';

const router = Router();

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
// A paused writing session stops the live clock (see ttw.js).
function actualTTW(db, a) {
  if (a.ttwOverrideMinutes != null) return a.ttwOverrideMinutes;
  const logs = db.activityLogs.filter((l) => l.articleId === a.id);
  return computeTTWMinutes(logs, a.status, a.pausedAt != null);
}

// When the piece entered its CURRENT status — i.e. how long it's been waiting in
// this stage. The most recent log whose newStatus is the current status, else
// the creation time (a brand-new Brief Pending piece has no transition log yet).
// Powers Phase 4 time-in-stage analytics (stalled risk, longest-waiting).
function statusSince(db, a) {
  let since = a.createdAt ?? null;
  for (const l of db.activityLogs) {
    if (l.articleId === a.id && l.newStatus === a.status && l.oldStatus !== l.newStatus) {
      if (!since || new Date(l.createdAt) > new Date(since)) since = l.createdAt;
    }
  }
  return since;
}

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'not set';

function logActivity(db, entry) {
  db.activityLogs.push({ id: nextId('activityLogs'), createdAt: new Date().toISOString(), ...entry });
}

// The three field mutations below are shared by the single-item routes and the
// bulk endpoint. Each sets the field, writes an activity-log entry, and reports
// whether anything actually changed (so callers can tally updated vs skipped).

function applyDeadline(db, a, rawDeadline, userId) {
  const next = rawDeadline || null;
  if (next === a.deadline) return false;
  const prev = a.deadline;
  a.deadline = next;
  logActivity(db, {
    articleId: a.id, changedById: userId, oldStatus: a.status, newStatus: a.status,
    kind: 'deadline', note: `Deadline changed from ${fmtDate(prev)} to ${fmtDate(next)}`,
  });
  return true;
}

function applyReassign(db, a, rawWriterId, userId) {
  const next = Number(rawWriterId);
  if (!next || next === a.assignedWriterId) return false;
  const prev = a.assignedWriterId;
  a.assignedWriterId = next;
  logActivity(db, {
    articleId: a.id, changedById: userId, oldStatus: a.status, newStatus: a.status,
    kind: 'reassign', note: `Reassigned from ${writerName(db, prev)} to ${writerName(db, next)}`,
  });
  notifyAssigned(db, a, next, userId);
  return true;
}

// Validate against the state machine, then apply + log. Returns { ok } | { error }.
function applyStatus(db, a, to, userId, note) {
  const from = a.status;
  if (!canTransition(from, to)) return { error: `Cannot move from ${from} to ${to}` };
  logActivity(db, {
    articleId: a.id, changedById: userId, oldStatus: from, newStatus: to,
    note: String(note || '').trim() || null,
  });
  a.status = to;
  notifyStatusChange(db, a, from, to, userId);
  return { ok: true };
}

/** Lightweight shape for tables/cards. */
function enrichList(db, a) {
  const writer = db.users.find((u) => u.id === a.assignedWriterId);
  // writerNotes is a private assignee scratchpad — never include it in list
  // payloads (those are visible to admins/TLs). It's added back in enrichDetail
  // only for the assignee themselves.
  const { writerNotes, ...rest } = a;
  return {
    ...rest,
    referenceLinks: a.referenceLinks ?? [],
    clientName: nameById(db, 'clients', a.clientId) ?? 'Unknown client',
    typeName: nameById(db, 'articleTypes', a.articleTypeId),
    writerName: writer ? writer.name : 'Unknown Writer',
    writerRole: writer ? writer.role : null,
    overdue: isOverdue(a),
    statusSince: statusSince(db, a),
    ttwManual: a.ttwOverrideMinutes != null,
    ttwActualMinutes:
      a.status === 'COMPLETED' || a.ttwOverrideMinutes != null ? actualTTW(db, a) : null,
  };
}

/** Full shape for the detail page, including the activity timeline.
 *  `viewerId` (the requester) gates the private writer notes. */
function enrichDetail(db, a, viewerId) {
  const logs = db.activityLogs
    .filter((l) => l.articleId === a.id)
    .sort((x, y) => new Date(x.createdAt) - new Date(y.createdAt))
    .map((l) => {
      const u = resolveUser(db, l.changedById);
      return { ...l, changedByName: u?.name ?? null, changedByRole: u?.role ?? null };
    });
  const detail = {
    ...enrichList(db, a),
    createdByName: resolveUserName(db, a.createdById),
    ttwActualMinutes: actualTTW(db, a),
    activity: logs,
  };
  // FEATURE: Private writer notes — only the assignee can see/edit their own.
  const isMine = viewerId != null && a.assignedWriterId === viewerId;
  if (isMine) {
    detail.isMine = true;
    detail.writerNotes = a.writerNotes ?? '';
  }
  // FEATURE: Follow / watch — is the viewer watching, and how many are?
  const followers = db.follows.filter((f) => f.articleId === a.id);
  detail.followerCount = followers.length;
  detail.isFollowing = viewerId != null && followers.some((f) => f.userId === viewerId);
  return detail;
}

// Writers can see their own work, but not Drafts (those aren't briefed yet).
const canAccess = (req, a) =>
  req.user.role === 'ADMIN' ||
  req.user.role === 'TEAM_LEADER' ||
  (a.assignedWriterId === req.user.id && a.status !== 'DRAFT');

// --- list & detail ------------------------------------------------------
router.get('/', authRequired, (req, res) => {
  const db = getDB();
  sweepRecurrences(db); // on-request catch-up: spawn any recurring content now due
  const canSeeAll = req.user.role === 'ADMIN' || req.user.role === 'TEAM_LEADER';
  const visible = canSeeAll
    ? db.articles
    : db.articles.filter((a) => a.assignedWriterId === req.user.id && a.status !== 'DRAFT');
  res.json(visible.map((a) => enrichList(db, a)));
});

router.get('/:id', authRequired, (req, res) => {
  const db = getDB();
  const a = db.articles.find((x) => x.id === Number(req.params.id));
  if (!a) return res.status(404).json({ error: 'Article not found' });
  if (!canAccess(req, a)) return res.status(403).json({ error: 'Not your article' });
  res.json(enrichDetail(db, a, req.user.id));
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
      writerNotes: null,
      pausedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    db.articles.push(article);
    created.push(enrichDetail(db, article, req.user.id));
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
    // New content normally enters the pipeline at Brief Pending; admins/TLs can
    // opt to stash it as a Draft (hidden from the writer until briefed).
    status: b.status === 'DRAFT' ? 'DRAFT' : 'BRIEF_PENDING',
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
    writerNotes: null,
    pausedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  db.articles.push(article);
  persist();
  res.status(201).json(enrichDetail(db, article, req.user.id));
});

router.put('/:id', authRequired, teamLeaderOrAdminOnly, (req, res) => {
  const db = getDB();
  const a = db.articles.find((x) => x.id === Number(req.params.id));
  if (!a) return res.status(404).json({ error: 'Article not found' });

  const b = req.body || {};
  const idFields = ['clientId', 'articleTypeId'];
  const numFields = ['wordCountTarget', 'ttwTargetMinutes'];
  const textFields = ['title', 'briefNotes'];

  for (const f of idFields) if (f in b) a[f] = Number(b[f]);
  for (const f of numFields)
    if (f in b) a[f] = b[f] === '' || b[f] == null ? null : Number(b[f]);
  for (const f of textFields)
    if (f in b) a[f] = b[f] === '' || b[f] == null ? null : String(b[f]).trim();
  if ('referenceLinks' in b) a.referenceLinks = sanitizeLinks(b.referenceLinks);

  // Deadline + reassignment are handled by the shared helpers, which log them.
  if ('deadline' in b) applyDeadline(db, a, b.deadline ? String(b.deadline).trim() : null, req.user.id);
  if ('assignedWriterId' in b) applyReassign(db, a, b.assignedWriterId, req.user.id);

  a.updatedAt = new Date().toISOString();
  persist();
  res.json(enrichDetail(db, a, req.user.id));
});

// --- bulk field updates (admin / TL) ------------------------------------
// FEATURE: Bulk Actions — reassign / change deadline / update status across a
// selection. Status moves that aren't legal for a given row are skipped and
// reported back, never forced.
router.patch('/bulk', authRequired, teamLeaderOrAdminOnly, (req, res) => {
  const { ids, action, value } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'No items selected' });
  }
  if (!['reassign', 'deadline', 'status'].includes(action)) {
    return res.status(400).json({ error: 'Unknown bulk action' });
  }
  const db = getDB();
  const idSet = new Set(ids.map(Number));
  const targets = db.articles.filter((a) => idSet.has(a.id));
  if (targets.length === 0) return res.status(404).json({ error: 'No matching content' });

  const now = new Date().toISOString();
  let updated = 0;
  let skipped = 0;
  for (const a of targets) {
    let changed = false;
    if (action === 'reassign') changed = applyReassign(db, a, value, req.user.id);
    else if (action === 'deadline') changed = applyDeadline(db, a, value ? String(value).trim() : null, req.user.id);
    else if (action === 'status') changed = applyStatus(db, a, value, req.user.id, null).ok === true;
    if (changed) { a.updatedAt = now; updated++; } else { skipped++; }
  }
  persist();
  res.json({ updated, skipped });
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
  if (!canTransition(from, to)) {
    return res.status(400).json({ error: `Cannot move from ${from} to ${to}` });
  }
  const privileged = req.user.role === 'ADMIN' || req.user.role === 'TEAM_LEADER';
  if (requiresPrivilege(from, to) && !privileged) {
    return res.status(403).json({ error: 'Only an admin or team leader can do that' });
  }

  applyStatus(db, a, to, req.user.id, req.body?.note);
  // Leaving WRITING ends any open pause so a re-entry doesn't start paused.
  if (a.status !== 'WRITING') a.pausedAt = null;
  a.updatedAt = new Date().toISOString();
  persist();
  res.json(enrichDetail(db, a, req.user.id));
});

// --- pause / resume writing session -------------------------------------
// FEATURE: Resume Writing Session — a writer can stop the TTW clock without
// changing status, then pick up later. Logged so TTW stays a pure function of
// the activity log (see ttw.js). Allowed only while actually in Writing.
router.post('/:id/pause', authRequired, (req, res) => {
  const db = getDB();
  const a = db.articles.find((x) => x.id === Number(req.params.id));
  if (!a) return res.status(404).json({ error: 'Article not found' });
  if (!canAccess(req, a)) return res.status(403).json({ error: 'Not your article' });
  if (a.status !== 'WRITING') return res.status(400).json({ error: 'Only a piece in Writing can be paused' });
  if (a.pausedAt) return res.json(enrichDetail(db, a, req.user.id)); // already paused — no-op
  a.pausedAt = new Date().toISOString();
  logActivity(db, {
    articleId: a.id, changedById: req.user.id, oldStatus: a.status, newStatus: a.status,
    kind: 'pause', note: 'Paused writing session',
  });
  a.updatedAt = a.pausedAt;
  persist();
  res.json(enrichDetail(db, a, req.user.id));
});

router.post('/:id/resume', authRequired, (req, res) => {
  const db = getDB();
  const a = db.articles.find((x) => x.id === Number(req.params.id));
  if (!a) return res.status(404).json({ error: 'Article not found' });
  if (!canAccess(req, a)) return res.status(403).json({ error: 'Not your article' });
  if (a.status !== 'WRITING') return res.status(400).json({ error: 'Only a piece in Writing can be resumed' });
  if (!a.pausedAt) return res.json(enrichDetail(db, a, req.user.id)); // not paused — no-op
  a.pausedAt = null;
  logActivity(db, {
    articleId: a.id, changedById: req.user.id, oldStatus: a.status, newStatus: a.status,
    kind: 'resume', note: 'Resumed writing session',
  });
  a.updatedAt = new Date().toISOString();
  persist();
  res.json(enrichDetail(db, a, req.user.id));
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
  res.json(enrichDetail(db, a, req.user.id));
});

// --- private writer notes (assignee only) -------------------------------
// FEATURE: Private writer notes — a personal scratchpad on an article, readable
// and writable only by its current assignee (not admins/TLs). Stored as a
// single per-article field; reassignment hands the note to the new assignee.
router.put('/:id/notes', authRequired, (req, res) => {
  const db = getDB();
  const a = db.articles.find((x) => x.id === Number(req.params.id));
  if (!a) return res.status(404).json({ error: 'Article not found' });
  if (a.assignedWriterId !== req.user.id) {
    return res.status(403).json({ error: 'Only the assignee can edit private notes' });
  }
  const { notes } = req.body || {};
  a.writerNotes = notes == null ? null : String(notes);
  a.updatedAt = new Date().toISOString();
  persist();
  res.json(enrichDetail(db, a, req.user.id));
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
  res.json(enrichDetail(db, a, req.user.id));
});

export default router;
