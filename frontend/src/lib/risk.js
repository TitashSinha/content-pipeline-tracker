// FEATURE: Team Leader Workspace (Phase 4) — shared risk / capacity / smart-
// assignment helpers. Pure functions over the article + writer lists, used by
// the TL Team workspace and the assignment form. Advisory only: like the Phase 2
// deadline/duplicate warnings, these inform decisions — they never block.
//
// Time-in-stage math relies on `article.statusSince` (added by the backend's
// enrichList): the timestamp a piece entered its current status.
import { isActive, STATUS_LABELS } from './workflow.js';
import { isOverdue } from './utils.js';

const DAY = 86400000;

// A writer's soft capacity — active pieces before they're "at capacity". Single
// source of truth for the assignment-form overload warning and the capacity panel.
export const WRITER_CAPACITY = 5;
export const isOverloaded = (active) => active >= WRITER_CAPACITY;

// How long a piece may sit in a stage before it counts as "stalled" (ms). Review
// is tightest — work parked there is usually waiting on a reviewer.
const STALL_LIMITS = {
  BRIEF_PENDING: 3 * DAY,
  WRITING: 4 * DAY,
  REVIEW: 2 * DAY,
  REOPENED: 2 * DAY,
};

export const msInStage = (article, now = Date.now()) =>
  article.statusSince ? now - new Date(article.statusSince).getTime() : 0;

/** Compact age label: "20m" / "5h" / "3d". */
export function formatAge(ms) {
  if (ms == null || ms < 0) ms = 0;
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

/** { writerId: activeCount } across the article list. */
export function activeCountByWriter(articles) {
  const map = {};
  for (const a of articles) {
    if (isActive(a.status)) map[a.assignedWriterId] = (map[a.assignedWriterId] || 0) + 1;
  }
  return map;
}

/** Capacity state for one writer — headroom + a level for color coding. */
export function capacityState(active) {
  const headroom = WRITER_CAPACITY - active;
  if (headroom < 0) return { headroom, level: 'over', label: `${-headroom} over` };
  if (headroom === 0) return { headroom, level: 'full', label: 'At capacity' };
  if (headroom === 1) return { headroom, level: 'busy', label: '1 slot free' };
  return { headroom, level: 'ok', label: `${headroom} slots free` };
}

const LEVEL_RANK = { high: 0, medium: 1, low: 2 };
export const topLevel = (risks) =>
  risks.reduce((top, r) => (LEVEL_RANK[r.level] < LEVEL_RANK[top] ? r.level : top), 'low');

/** Every risk on one *active* article → [{ id, level, label }]. Empty otherwise. */
export function assessRisks(article, { activeByWriter = {}, now = Date.now() } = {}) {
  if (!isActive(article.status)) return [];
  const risks = [];

  if (isOverdue(article)) {
    risks.push({ id: 'overdue', level: 'high', label: 'Overdue' });
  } else if (article.deadline) {
    const endOfDay = new Date(article.deadline); endOfDay.setHours(23, 59, 59, 999);
    const left = endOfDay.getTime() - now;
    if (left <= DAY) risks.push({ id: 'due-soon', level: 'medium', label: 'Due within a day' });
    if (article.ttwTargetMinutes != null && left > 0 && article.ttwTargetMinutes * 60000 > left) {
      risks.push({ id: 'tight', level: 'high', label: 'Not enough time left for the TTW target' });
    }
  }

  const limit = STALL_LIMITS[article.status];
  const age = msInStage(article, now);
  if (limit && age > limit) {
    risks.push({ id: 'stalled', level: 'medium', label: `Stalled in ${STATUS_LABELS[article.status]} · ${formatAge(age)}` });
  }

  const load = activeByWriter[article.assignedWriterId] || 0;
  if (isOverloaded(load)) {
    risks.push({ id: 'overloaded', level: 'medium', label: `Assignee carries ${load} active pieces` });
  }
  return risks;
}

/** Active articles that carry at least one risk, worst first (then soonest due). */
export function articlesAtRisk(articles, now = Date.now()) {
  const activeByWriter = activeCountByWriter(articles);
  return articles
    .filter((a) => isActive(a.status))
    .map((a) => ({ article: a, risks: assessRisks(a, { activeByWriter, now }) }))
    .filter((r) => r.risks.length > 0)
    .sort((x, y) => {
      const lv = LEVEL_RANK[topLevel(x.risks)] - LEVEL_RANK[topLevel(y.risks)];
      if (lv !== 0) return lv;
      const dx = x.article.deadline ? new Date(x.article.deadline).getTime() : Infinity;
      const dy = y.article.deadline ? new Date(y.article.deadline).getTime() : Infinity;
      return dx - dy;
    });
}

/** Active pieces that have waited longest in their current stage. */
export function longestWaiting(articles, { limit = 6, now = Date.now() } = {}) {
  return articles
    .filter((a) => isActive(a.status))
    .map((a) => ({ article: a, ms: msInStage(a, now) }))
    .sort((x, y) => y.ms - x.ms)
    .slice(0, limit);
}

/** Per-stage pile-up: count + average time-in-stage for the active stages. */
export function bottlenecks(articles, now = Date.now()) {
  const stages = ['BRIEF_PENDING', 'WRITING', 'REVIEW', 'REOPENED'];
  return stages.map((status) => {
    const items = articles.filter((a) => a.status === status);
    const avgMs = items.length ? items.reduce((s, a) => s + msInStage(a, now), 0) / items.length : 0;
    return { status, count: items.length, avgMs };
  });
}

/**
 * SLA / time-in-stage summary (Phase 5) — how many active pieces are within their
 * stall limit vs breaching it, per stage and overall. Reuses STALL_LIMITS so the
 * "stalled" risk and the SLA report share one definition of "too long".
 */
export function slaSummary(articles, now = Date.now()) {
  const stages = ['BRIEF_PENDING', 'WRITING', 'REVIEW', 'REOPENED'];
  let total = 0, breaching = 0;
  const byStage = stages.map((status) => {
    const items = articles.filter((a) => a.status === status);
    const limit = STALL_LIMITS[status];
    const over = items.filter((a) => limit && msInStage(a, now) > limit).length;
    total += items.length; breaching += over;
    return { status, count: items.length, breaching: over, limitMs: limit };
  });
  return { byStage, total, breaching, withinRate: total ? Math.round(((total - breaching) / total) * 100) : null };
}

// --- deadline recommendation (Phase 6) -----------------------------------
// A realistic lead time (calendar days from today) for a new piece: enough room
// for the writing itself (~4 focused hours/day) plus a buffer, stretched when the
// assignee is already loaded. Advisory — fills the field, never forces it.
export function recommendDeadlineDays({ ttwTargetMinutes, writerActive = 0 } = {}) {
  const fromTtw = ttwTargetMinutes ? Math.ceil(ttwTargetMinutes / 240) : 0; // ~4 hrs/day
  let days = Math.max(2, fromTtw + 1); // floor of 2 days, +1 buffer
  if (isOverloaded(writerActive)) days += 3;
  else if (writerActive >= WRITER_CAPACITY - 1) days += 1;
  return days;
}

/** A recommended deadline Date: today + recommended lead, at 18:00. */
export function recommendDeadline(opts = {}, from = new Date()) {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  d.setDate(d.getDate() + recommendDeadlineDays(opts));
  d.setHours(18, 0, 0, 0);
  return d;
}

// --- smart assignment ----------------------------------------------------
const normalize = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Does a writer's specialties text overlap the content type name?
function specialtyMatch(specialties, typeName) {
  if (!specialties || !typeName) return false;
  const spec = normalize(specialties);
  return normalize(typeName).split(' ').some((w) => w.length >= 3 && spec.includes(w));
}

/**
 * Rank assignable writers for a new piece: the client's preferred writer first,
 * then a specialty match, then lightest current load. Overloaded writers are
 * penalised. `writers` is the assignable list ({ id, name, role, specialties }).
 */
export function suggestWriters(writers, { typeName, articles = [], defaultWriterId = null, limit = 3 } = {}) {
  const activeByWriter = activeCountByWriter(articles);
  return writers
    .map((w) => {
      const active = activeByWriter[w.id] || 0;
      const match = specialtyMatch(w.specialties, typeName);
      const isDefault = defaultWriterId != null && String(w.id) === String(defaultWriterId);
      const reason = isDefault ? "Client's pick" : match ? 'Specialty match' : 'Lightest load';
      const score = (isDefault ? 100 : 0) + (match ? 50 : 0) - active - (isOverloaded(active) ? 20 : 0);
      return { id: w.id, name: w.name, role: w.role, active, reason, score };
    })
    .sort((a, b) => b.score - a.score || a.active - b.active || a.name.localeCompare(b.name))
    .slice(0, limit);
}
