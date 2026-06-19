import { STATUS_LABELS } from '../lib/constants.js';
import { formatDateTime, initials } from '../lib/utils.js';

function RoleChip({ role }) {
  if (role === 'TEAM_LEADER') return <span className={'role-chip role-chip--tl'}>TL</span>;
  if (role === 'ADMIN') return <span className={'role-chip role-chip--admin'}>Admin</span>;
  return null;
}

export default function Timeline({ entries }) {
  if (!entries?.length) {
    return <p className="muted">No activity yet.</p>;
  }
  return (
    <ul className="timeline">
      {entries.map((e) => (
        <li key={e.id} className="timeline-item">
          <span className="timeline-avatar">{initials(e.changedByName || '?')}</span>
          <div className="timeline-body">
            {e.kind === 'reassign' ? (
              <p className="timeline-head">
                <strong>{e.changedByName || 'Admin'}</strong><RoleChip role={e.changedByRole} />
                <span className="timeline-reassign">{e.note}</span>
              </p>
            ) : (
              <>
                <p className="timeline-head">
                  <strong>{e.changedByName || 'Someone'}</strong><RoleChip role={e.changedByRole} />
                  <span className="timeline-change">
                    {STATUS_LABELS[e.oldStatus]} <span className="arrow">{'→'}</span> {STATUS_LABELS[e.newStatus]}
                  </span>
                </p>
                {e.note && <p className="timeline-note">{'"'}{e.note}{'"'}</p>}
              </>
            )}
            <time className="timeline-time">{formatDateTime(e.createdAt)}</time>
          </div>
        </li>
      ))}
    </ul>
  );
}
