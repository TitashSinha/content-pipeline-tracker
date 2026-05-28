export function formatDate(str, fallback = '—') {
  if (!str) return fallback
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(str))
}

export function formatDateTime(str) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(str))
}

export function isOverdue(article) {
  if (!article.deadline || article.status === 'COMPLETED') return false
  return new Date(article.deadline) < new Date()
}

// Computes time-to-write in whole hours from activity logs (any order).
// Returns null if the article never entered WRITING or COMPLETED.
export function computeTTWHours(activityLogs) {
  const sorted = [...activityLogs].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  const writing   = sorted.find(l => l.newStatus === 'WRITING')
  const completed = sorted.find(l => l.newStatus === 'COMPLETED')
  if (!writing || !completed) return null
  return Math.round((new Date(completed.createdAt) - new Date(writing.createdAt)) / 3_600_000)
}

// Formats a TTW value (fractional hours) as a human-readable string.
// e.g. 2.5 → "2h 30m", 0.5 → "30m", 25.0 → "1d 1h"
export function formatTTW(hours) {
  if (hours === null || hours === undefined) return '—'
  const totalMins = Math.round(hours * 60)
  if (totalMins < 60) return `${totalMins}m`
  const days = Math.floor(totalMins / 1440)
  const rem  = totalMins % 1440
  const hrs  = Math.floor(rem / 60)
  const mins = rem % 60
  const hPart = hrs  > 0 ? `${hrs}h`  : ''
  const mPart = mins > 0 ? `${mins}m` : ''
  if (days === 0) return [hPart, mPart].filter(Boolean).join(' ')
  return [`${days}d`, hPart, mPart].filter(Boolean).join(' ')
}
