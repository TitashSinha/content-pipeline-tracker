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
