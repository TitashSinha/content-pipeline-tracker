// FEATURE: Org activity feed + Audit log (Phase 7). A unified, filterable stream
// of everything happening across the workspace. Admin surface; the filters (kind /
// actor / text) turn the live feed into an auditable history.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { SkeletonPage } from '../../components/Skeleton.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { initials, formatDateTime } from '../../lib/utils.js';
import { STATUS_LABELS } from '../../lib/workflow.js';
import { Card } from '../../components/ui/index.js';

const KIND_OPTIONS = [
  { value: '', label: 'All activity' },
  { value: 'status', label: 'Status changes' },
  { value: 'reassign', label: 'Reassignments' },
  { value: 'deadline', label: 'Deadline changes' },
  { value: 'comment', label: 'Comments' },
];

function RoleChip({ role }) {
  if (role === 'TEAM_LEADER') return <span className="role-chip role-chip--tl">TL</span>;
  if (role === 'ADMIN') return <span className="role-chip role-chip--admin">Admin</span>;
  return null;
}

function EventText({ e }) {
  if (e.kind === 'comment') {
    return <>{e.isReply ? 'replied' : 'commented'}: <span className="event-quote">“{e.body}”</span></>;
  }
  if (e.kind === 'status') {
    return <>moved <span className="event-change">{STATUS_LABELS[e.oldStatus]} → {STATUS_LABELS[e.newStatus]}</span></>;
  }
  return <>{e.note || e.kind}</>;
}

export default function ActivityPage() {
  const [events, setEvents] = useState(null);
  const [total, setTotal] = useState(0);
  const [writers, setWriters] = useState([]);
  const [kind, setKind] = useState('');
  const [actorId, setActorId] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => { api.listWriters().then(setWriters).catch(() => {}); }, []);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (kind) p.set('kind', kind);
    if (actorId) p.set('actorId', actorId);
    if (q.trim()) p.set('q', q.trim());
    const s = p.toString();
    return s ? `?${s}` : '';
  }, [kind, actorId, q]);

  useEffect(() => {
    let live = true;
    const t = setTimeout(() => {
      api.activityFeed(query).then((r) => { if (live) { setEvents(r.events); setTotal(r.total); } }).catch(() => setEvents([]));
    }, 200);
    return () => { live = false; clearTimeout(t); };
  }, [query]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Activity</h1>
          <p className="text-muted">Everything happening across the workspace · audit-ready history.</p>
        </div>
      </div>

      <div className="activity-filters">
        <select value={kind} onChange={(e) => setKind(e.target.value)}>
          {KIND_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={actorId} onChange={(e) => setActorId(e.target.value)}>
          <option value="">Anyone</option>
          {writers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by content title…" />
      </div>

      {events == null ? (
        <SkeletonPage />
      ) : events.length === 0 ? (
        <EmptyState title="No matching activity" message="Try a different filter, or clear them to see everything." />
      ) : (
        <Card>
          <ul className="event-list">
            {events.map((e) => (
              <li key={e.id} className="event-item">
                <span className={`event-avatar ${e.actorId == null ? 'event-avatar--auto' : ''}`}>{e.actorId == null ? '⟳' : initials(e.actorName)}</span>
                <div className="event-body">
                  <p className="event-text">
                    <strong>{e.actorName}</strong><RoleChip role={e.actorRole} /> <EventText e={e} />
                  </p>
                  <p className="event-meta">
                    <Link to={`/admin/articles/${e.articleId}`} className="event-article">{e.articleTitle}</Link>
                    <time>{formatDateTime(e.createdAt)}</time>
                  </p>
                </div>
              </li>
            ))}
          </ul>
          {total > events.length && <p className="text-muted text-[.8rem] event-foot">Showing {events.length} of {total} — narrow the filters to see more.</p>}
        </Card>
      )}
    </div>
  );
}
