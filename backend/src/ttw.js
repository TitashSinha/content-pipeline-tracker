// TTW (Time to Write) = total wall-clock time an article spent in WRITING.
// We walk the activity log in chronological order and sum every interval that
// begins when the article ENTERS writing and ends when it LEAVES writing.
// Time spent in REVIEW (or any other status) never counts.
export function computeTTWMinutes(logs, currentStatus) {
  const sorted = [...logs].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  );

  let totalMs = 0;
  let writingStart = null;

  for (const log of sorted) {
    if (log.newStatus === 'WRITING') writingStart = new Date(log.createdAt);
    if (log.oldStatus === 'WRITING' && writingStart) {
      totalMs += new Date(log.createdAt) - writingStart;
      writingStart = null;
    }
  }

  // Still writing right now? Count up to the present moment (live clock).
  if (currentStatus === 'WRITING' && writingStart) {
    totalMs += Date.now() - writingStart;
  }

  return Math.round(totalMs / 60000);
}
