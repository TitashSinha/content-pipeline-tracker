const CONFIG = {
  BRIEF_PENDING: { label: 'Brief Pending', cls: 'status--pending' },
  WRITING:       { label: 'Writing',       cls: 'status--writing' },
  REVIEW:        { label: 'Review',        cls: 'status--review' },
  REVISION:      { label: 'Revision',      cls: 'status--revision' },
  COMPLETED:     { label: 'Completed',     cls: 'status--completed' },
}

export default function StatusBadge({ status }) {
  const { label, cls } = CONFIG[status] ?? { label: status, cls: '' }
  return <span className={`status-badge ${cls}`}>{label}</span>
}
