// FEATURE: Notifications (Phase 7) — generated on write at the mutation choke
// points (status change, reassignment, new comment, recurring spawn) rather than
// derived on read, so per-user unread state is real and cheap. Helpers push onto
// db.notifications; the calling route persists. A user is notified about an
// article when they're the assignee OR they follow it — and never about their own
// action. Messages store only the event phrase; the GET route resolves the
// (current) article title + actor name so nothing goes stale.
import { nextId } from './db.js';

/** Push one notification (skips self-notification and missing recipients). */
export function createNotification(db, { userId, type, articleId = null, actorId = null, message }) {
  if (!userId || userId === actorId) return;
  db.notifications.push({
    id: nextId('notifications'),
    userId,
    type,
    articleId,
    actorId,
    message,
    read: false,
    createdAt: new Date().toISOString(),
  });
}

/** Everyone watching an article (assignee + followers), minus the actor. */
export function articleAudience(db, a, actorId) {
  const ids = new Set();
  if (a.assignedWriterId) ids.add(a.assignedWriterId);
  for (const f of db.follows) if (f.articleId === a.id) ids.add(f.userId);
  if (actorId != null) ids.delete(actorId);
  return [...ids];
}

// A human phrase for a status transition.
export function statusMessage(from, to) {
  if (to === 'REVIEW') return 'submitted for review';
  if (to === 'WRITING' && from === 'REVIEW') return 'sent back to writing';
  if (to === 'WRITING' && from === 'REOPENED') return 'resumed writing on';
  if (to === 'WRITING') return 'moved to writing';
  if (to === 'COMPLETED') return 'marked complete';
  if (to === 'REOPENED') return 'reopened';
  if (to === 'BRIEF_PENDING') return 'sent to brief';
  return `moved to ${to}`;
}

export function notifyStatusChange(db, a, from, to, actorId) {
  const message = statusMessage(from, to);
  for (const userId of articleAudience(db, a, actorId)) {
    createNotification(db, { userId, type: 'status', articleId: a.id, actorId, message });
  }
}

export function notifyAssigned(db, a, newWriterId, actorId) {
  createNotification(db, { userId: newWriterId, type: 'assigned', articleId: a.id, actorId, message: 'assigned this to you' });
}

export function notifyComment(db, a, comment, actorId) {
  const message = comment.parentId ? 'replied on' : 'commented on';
  for (const userId of articleAudience(db, a, actorId)) {
    createNotification(db, { userId, type: 'comment', articleId: a.id, actorId, message });
  }
  // Loop the parent comment's author in too, even if they no longer follow.
  if (comment.parentId) {
    const parent = db.comments.find((c) => c.id === comment.parentId);
    if (parent) createNotification(db, { userId: parent.authorId, type: 'comment', articleId: a.id, actorId, message: 'replied to your comment on' });
  }
}
