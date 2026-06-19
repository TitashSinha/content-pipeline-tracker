import { STATUS_LABELS } from '../lib/constants.js';
import { formatDateTime, initials } from '../lib/utils.js';

export default function Timeline({ entries }) {
  if (!entries?.length) {
    return <p className="muted">No activity yet — the story starts when the writer hits “Start Writing”.</p>;
  }
  return (
    <ul className="timeline">
      {entries.map((e) => (
        <li key={e.id} className="timeline-item">
          <span className="timeline-avatar">{initials(e.changedByName || '?')}</span>
          <div className="timeline-body">
            {e.kind === 'reassign' ? (
              <p className="timeline-head">
                <strong>{e.changedByName || 'Admin'}</strong>
                <span className="timeline-reassign">{e.note}</span>
              </p>
            ) : (
              <>
                <p className="timeline-head">
                  <strong>{e.changedByName || 'Someone'}</strong>
                  <span className="timeline-change">
                    {STATUS_LABELS[e.oldStatus]} <span className="arrow">→</span> {STATUS_LABELS[e.newStatus]}
                  </span>
                </p>
                {e.note && <p className="timeline-note">“{e.note}”</p>}
              </>
            )}
            <time className="timeline-time">{formatDateTime(e.createdAt)}</time>
          </div>
        </li>
      ))}
    </ul>
  );
}
