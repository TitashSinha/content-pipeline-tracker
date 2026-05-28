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

// Computes actual time taken in minutes from activity logs (any order).
// Returns null if the article never entered WRITING or COMPLETED.
export function computeTTWMinutes(activityLogs) {
  const sorted = [...activityLogs].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  const writing   = sorted.find(l => l.newStatus === 'WRITING')
  const completed = sorted.find(l => l.newStatus === 'COMPLETED')
  if (!writing || !completed) return null
  return Math.round((new Date(completed.createdAt) - new Date(writing.createdAt)) / 60_000)
}

// Formats a TTW value (minutes) as a human-readable string.
// e.g. 150 → "2h 30m", 30 → "30m", 1500 → "1d 1h"
export function formatTTW(minutes) {
  if (minutes === null || minutes === undefined) return '—'
  const m = Math.round(minutes)
  if (m < 60) return `${m}m`
  const days = Math.floor(m / 1440)
  const rem  = m % 1440
  const hrs  = Math.floor(rem / 60)
  const mins = rem % 60
  const hPart = hrs  > 0 ? `${hrs}h`  : ''
  const mPart = mins > 0 ? `${mins}m` : ''
  if (days === 0) return [hPart, mPart].filter(Boolean).join(' ')
  return [`${days}d`, hPart, mPart].filter(Boolean).join(' ')
}
