// FEATURE: Recurring Content (Phase 6). A recurrence is a saved "spawn this kind
// of piece every week/fortnight/month" rule. There is no background scheduler —
// given the JSON datastore (and Render's ephemeral disk + cold starts), spawning
// runs as a lightweight on-request sweep: sweepRecurrences() is called on boot and
// at the top of GET /api/articles + GET /api/recurrences, so any load catches up.
//
// Catch-up policy: spawn AT MOST ONE piece per due recurrence per sweep, then
// advance nextRunAt to the next future slot. A series idle through several periods
// produces one fresh task, not a backlog flood.
import { getDB, persist, nextId } from './db.js';
import { createNotification } from './notify.js';

const DAY = 86400000;
export const CADENCES = ['weekly', 'biweekly', 'monthly'];

/** Next occurrence after `iso` for the given cadence. */
export function advance(iso, cadence) {
  const d = new Date(iso);
  if (cadence === 'monthly') d.setMonth(d.getMonth() + 1);
  else if (cadence === 'biweekly') d.setDate(d.getDate() + 14);
  else d.setDate(d.getDate() + 7); // weekly (default)
  return d;
}

/** Build a Brief Pending article from a recurrence, dated for `runDate`. */
export function buildArticleFromRecurrence(db, r, runDate = new Date()) {
  let deadline = null;
  if (r.leadTimeDays != null) {
    const d = new Date(runDate.getTime() + r.leadTimeDays * DAY);
    d.setHours(18, 0, 0, 0);
    deadline = d.toISOString();
  }
  const stamp = runDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const nowIso = new Date().toISOString();
  return {
    id: nextId('articles'),
    title: `${r.title} · ${stamp}`,
    status: 'BRIEF_PENDING',
    clientId: r.clientId,
    articleTypeId: r.articleTypeId,
    assignedWriterId: r.assignedWriterId,
    createdById: r.createdById ?? null,
    deadline,
    wordCountTarget: r.wordCountTarget ?? null,
    ttwTargetMinutes: r.ttwTargetMinutes ?? null,
    referenceLinks: Array.isArray(r.referenceLinks) ? [...r.referenceLinks] : [],
    briefNotes: r.briefNotes ?? null,
    ttwOverrideMinutes: null,
    writerNotes: null,
    pausedAt: null,
    recurrenceId: r.id, // provenance: this piece came from a recurring series
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

/**
 * Spawn one article for every active recurrence whose nextRunAt has passed,
 * advancing each to its next future slot. Persists only if something spawned.
 * Returns the number of pieces created.
 */
export function sweepRecurrences(db = getDB(), now = Date.now()) {
  let spawned = 0;
  for (const r of db.recurrences) {
    if (!r.active || !r.nextRunAt) continue;
    if (new Date(r.nextRunAt).getTime() > now) continue;
    const article = buildArticleFromRecurrence(db, r, new Date(r.nextRunAt));
    db.articles.push(article);
    // System spawn (no actor) → notify the assigned writer.
    createNotification(db, { userId: article.assignedWriterId, type: 'assigned', articleId: article.id, actorId: null, message: 'created a recurring piece for you' });
    r.lastRunAt = new Date().toISOString();
    let next = new Date(r.nextRunAt);
    do { next = advance(next.toISOString(), r.cadence); } while (next.getTime() <= now);
    r.nextRunAt = next.toISOString();
    spawned++;
  }
  if (spawned) persist();
  return spawned;
}

/** Spawn one piece immediately (manual "Run now"), without touching the schedule. */
export function runRecurrenceNow(db, r) {
  const article = buildArticleFromRecurrence(db, r, new Date());
  db.articles.push(article);
  createNotification(db, { userId: article.assignedWriterId, type: 'assigned', articleId: article.id, actorId: null, message: 'created a recurring piece for you' });
  r.lastRunAt = new Date().toISOString();
  persist();
  return article;
}
