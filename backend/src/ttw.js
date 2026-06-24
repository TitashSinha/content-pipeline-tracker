// TTW (Time to Write) = total wall-clock time an article spent actively in
// WRITING. We walk the activity log in chronological order and sum every
// interval that begins when the article ENTERS writing and ends when it LEAVES
// writing. Time spent in REVIEW (or any other status) never counts.
//
// FEATURE: Resume Writing Session (Phase 3) — a writer can pause/resume without
// changing status. Pause/resume are logged as { kind: 'pause' | 'resume' } and
// bracket a writing interval exactly like leaving/entering WRITING does, so a
// piece left open overnight no longer inflates its TTW. The whole computation
// stays a pure function of the activity log (no separate time tracking).
export function computeTTWMinutes(logs, currentStatus, isPaused = false) {
  const sorted = [...logs].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  );

  let totalMs = 0;
  let start = null; // start of the currently-open writing interval, if any

  const open = (t) => { start = new Date(t); };
  const close = (t) => {
    if (start) { totalMs += new Date(t) - start; start = null; }
  };

  for (const log of sorted) {
    // Pause/resume bracket a writing interval without moving the status.
    if (log.kind === 'pause') { close(log.createdAt); continue; }
    if (log.kind === 'resume') { open(log.createdAt); continue; }
    // Only genuine status transitions move the clock; deadline/reassign logs
    // (where oldStatus === newStatus) must never reset an open interval.
    if (log.oldStatus === log.newStatus) continue;
    if (log.newStatus === 'WRITING') open(log.createdAt);
    else if (log.oldStatus === 'WRITING') close(log.createdAt);
  }

  // Still actively writing (and not paused)? Count up to the present moment.
  if (currentStatus === 'WRITING' && !isPaused) {
    if (start) totalMs += Date.now() - start;
  }

  return Math.round(totalMs / 60000);
}
