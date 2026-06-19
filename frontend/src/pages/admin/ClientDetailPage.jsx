import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import Loader from '../../components/Loader.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import ClientForm from '../../components/admin/ClientForm.jsx';
import ArticleForm from '../../components/admin/ArticleForm.jsx';
import { formatDate } from '../../lib/utils.js';
import { IconArrowLeft, IconEdit, IconExternal, IconPlus } from '../../lib/icons.jsx';

function Meta({ label, value }) {
  return (
    <div className="meta-item">
      <span className="meta-label">{label}</span>
      <span className="meta-value">{value ?? '—'}</span>
    </div>
  );
}

const STATUS_ORDER = { BRIEF_PENDING: 0, WRITING: 1, REVIEW: 2, COMPLETED: 3 };

export default function ClientDetailPage() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [types, setTypes] = useState([]);
  const [clients, setClients] = useState([]);
  const [writers, setWriters] = useState([]);
  const [articles, setArticles] = useState([]);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  function load() {
    return api.getClient(id).then(setClient).catch((e) => setError(e.message));
  }

  function loadArticles() {
    api.listArticles().then((all) =>
      setArticles(all.filter((a) => a.clientId === Number(id)))
    );
  }

  useEffect(() => {
    load();
    api.listTypes().then(setTypes);
    api.listClients().then(setClients);
    api.listWriters().then(setWriters);
    loadArticles();
  }, [id]);

  const active = useMemo(
    () => articles
      .filter((a) => a.status !== 'COMPLETED')
      .sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9)),
    [articles]
  );
  const completed = useMemo(
    () => articles
      .filter((a) => a.status === 'COMPLETED')
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
    [articles]
  );

  if (error) return <div className="page"><p className="form-error">{error}</p></div>;
  if (!client) return <Loader full />;

  return (
    <div className="page">
      <div className="detail">
        <Link to="/admin/clients" className="back-link"><IconArrowLeft /> Clients</Link>

        <div className="page-head">
          <div>
            <h1>{client.name}</h1>
            <p className="muted">{client.contentTypeName ?? 'No content type'}</p>
          </div>
          <div className="page-head-actions">
            <button type="button" className="btn btn--primary" onClick={() => setCreating(true)}>
              <IconPlus /> New content
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setEditing(true)}><IconEdit /> Edit</button>
          </div>
        </div>

        <div className="card detail-meta">
          <Meta label="Industry" value={client.industry} />
          <Meta
            label="Website"
            value={client.website
              ? <a className="doc-link" href={client.website} target="_blank" rel="noreferrer"><IconExternal /> <span className="ref-link-text">{client.website}</span></a>
              : null}
          />
          <Meta label="Competitors" value={client.competitors} />
          <Meta label="Onboarded" value={client.onboardingDate ? formatDate(client.onboardingDate) : null} />
          <Meta label="Pilot date" value={client.pilotDate ? formatDate(client.pilotDate) : null} />
        </div>

        {client.pilotNotes && (
          <div className="card">
            <h2 className="card-title">The pilot</h2>
            <p className="brief-notes">{client.pilotNotes}</p>
          </div>
        )}

        {client.sampleLinks?.length > 0 && (
          <div className="card">
            <h2 className="card-title">Sample work</h2>
            <ul className="ref-link-list">
              {client.sampleLinks.map((l, i) => (
                <li key={i}>
                  <a className="doc-link" href={l} target="_blank" rel="noreferrer">
                    <IconExternal /> <span className="ref-link-text">{l}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {client.notes && (
          <div className="card">
            <h2 className="card-title">Notes</h2>
            <p className="brief-notes">{client.notes}</p>
          </div>
        )}

        {active.length > 0 && (
          <div className="card">
            <h2 className="card-title">Active content ({active.length})</h2>
            <ul className="writer-articles">
              {active.map((a) => (
                <li key={a.id}>
                  <Link to={`/admin/articles/${a.id}`} className="writer-article-link">
                    <span className="writer-article-title">{a.title}</span>
                    <span className="writer-article-meta">
                      {a.writerName && <span className="muted">{a.writerName}</span>}
                      {a.deadline && <span className="muted">{formatDate(a.deadline)}</span>}
                    </span>
                    <StatusBadge status={a.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {completed.length > 0 && (
          <div className="card">
            <h2 className="card-title">Completed ({completed.length})</h2>
            <ul className="writer-articles">
              {completed.map((a) => (
                <li key={a.id}>
                  <Link to={`/admin/articles/${a.id}`} className="writer-article-link">
                    <span className="writer-article-title">{a.title}</span>
                    <span className="writer-article-meta">
                      {a.writerName && <span className="muted">{a.writerName}</span>}
                    </span>
                    <StatusBadge status={a.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {articles.length === 0 && (
          <div className="card">
            <p className="muted" style={{ textAlign: 'center', padding: '1rem 0' }}>
              No content yet for this client.{' '}
              <button type="button" className="link-btn" onClick={() => setCreating(true)}>
                Create the first piece →
              </button>
            </p>
          </div>
        )}
      </div>

      {editing && (
        <ClientForm
          client={client}
          types={types}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); load(); }}
        />
      )}

      {creating && (
        <ArticleForm
          article={{ clientId: Number(id) }}
          clients={clients}
          writers={writers}
          types={types}
          onClose={() => setCreating(false)}
          onSaved={() => { setCreating(false); loadArticles(); }}
        />
      )}
    </div>
  );
}
