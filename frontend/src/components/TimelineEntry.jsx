import StatusBadge from './StatusBadge'
import { formatDateTime } from '../lib/utils'

export default function TimelineEntry({ log }) {
  return (
    <div className="timeline-entry">
      <div className="timeline-dot" />
      <div className="timeline-body">
        <div className="timeline-header">
          <span className="timeline-who">{log.changedBy.name}</span>
          <span className="timeline-when">{formatDateTime(log.createdAt)}</span>
        </div>
        <div className="timeline-change">
          {log.oldStatus ? (
            <>
              <StatusBadge status={log.oldStatus} />
              <span className="timeline-arrow">→</span>
              <StatusBadge status={log.newStatus} />
            </>
          ) : (
            <>
              <StatusBadge status={log.newStatus} />
              <span className="timeline-pill">created</span>
            </>
          )}
        </div>
        {log.note && <p className="timeline-note">"{log.note}"</p>}
      </div>
    </div>
  )
}
