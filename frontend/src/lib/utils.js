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

// Formats a TTW value (hours) as a human-readable string.
export function formatTTW(hours) {
  if (hours === null || hours === undefined) return '—'
  if (hours < 1) return '< 1h'
  const days = Math.floor(hours / 24)
  const hrs  = hours % 24
  if (days === 0) return `${hrs}h`
  if (hrs  === 0) return `${days}d`
  return `${days}d ${hrs}h`
}
