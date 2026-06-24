// FEATURE: Advanced search (Phase 7). A faceted, full-text search over the content
// the signed-in user can see (the role-scoped article list already enforces
// visibility). Searches title + brief notes + client/writer/type, with status /
// writer / client / type facets. Reachable from the command palette.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { Card } from '../components/ui/index.js';
import { formatDate, isOverdue } from '../lib/utils.js';
import { STATUSES, STATUS_LABELS } from '../lib/workflow.js';

const articleBase = (role) => (role === 'ADMIN' ? '/admin' : role === 'TEAM_LEADER' ? '/tl' : '/writer');
const matchText = (a, needle) =>
  [a.title, a.briefNotes, a.clientName, a.writerName, a.typeName]
    .some((v) => String(v || '').toLowerCase().includes(needle));

export default function SearchPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [q, setQ] = useState(params.get('q') || '');
  const [status, setStatus] = useState('');
  const [writerId, setWriterId] = useState('');
  const [clientId, setClientId] = useState('');

  useEffect(() => {
    Promise.all([api.listArticles(), api.listClients().catch(() => []), api.listWriters().catch(() => [])])
      .then(([articles, clients, writers]) => setData({ articles, clients, writers }))
      .catch(() => setData({ articles: [], clients: [], writers: [] }));
  }, []);

  // keep the URL ?q= in sync so the search is shareable / survives reload
  useEffect(() => {
    const next = new URLSearchParams(params);
    if (q.trim()) next.set('q', q.trim()); else next.delete('q');
    setParams(next, { replace: true });
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const results = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    return data.articles.filter((a) =>
      (!needle || matchText(a, needle)) &&
      (!status || a.status === status) &&
      (!writerId || String(a.assignedWriterId) === writerId) &&
      (!clientId || String(a.clientId) === clientId),
    );
  }, [data, q, status, writerId, clientId]);

  if (!data) return <Loader full />;
  const isAdmin = user.role === 'ADMIN' || user.role === 'TEAM_LEADER';
  const hasFilters = q.trim() || status || writerId || clientId;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Search</h1>
          <p className="text-muted">{hasFilters ? `${results.length} result${results.length === 1 ? '' : 's'}` : 'Search across all the content you can see.'}</p>
        </div>
      </div>

      <div className="search-controls">
        <input className="search-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, brief, client…" autoFocus />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Any status</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        {isAdmin && (
          <select value={writerId} onChange={(e) => setWriterId(e.target.value)}>
            <option value="">Any writer</option>
            {data.writers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        )}
        {isAdmin && (
          <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">Any client</option>
            {data.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>

      {results.length === 0 ? (
        <EmptyState title={hasFilters ? 'No matches' : 'Start searching'} message={hasFilters ? 'Try fewer or different filters.' : 'Type above, or pick a facet to narrow things down.'} />
      ) : (
        <Card noPad>
          <table className="table">
            <thead>
              <tr><th>Title</th><th>Client</th><th>Writer</th><th>Status</th><th>Deadline</th></tr>
            </thead>
            <tbody>
              {results.map((a) => {
                const overdue = isOverdue(a);
                return (
                  <tr key={a.id} className={`cursor-pointer transition-colors hover:bg-surface-2 ${overdue ? 'row-overdue' : ''}`} onClick={() => navigate(`${articleBase(user.role)}/articles/${a.id}`)}>
                    <td className="font-semibold">{a.title}</td>
                    <td>{a.clientName}</td>
                    <td>{a.writerName}</td>
                    <td><StatusBadge status={a.status} /></td>
                    <td className={overdue ? 'text-danger' : ''}>{formatDate(a.deadline)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
