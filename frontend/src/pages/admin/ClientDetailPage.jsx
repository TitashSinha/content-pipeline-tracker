import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import { SkeletonDetail } from '../../components/Skeleton.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import ClientForm from '../../components/admin/ClientForm.jsx';
import ArticleForm from '../../components/admin/ArticleForm.jsx';
import { Button, LinkButton, Card, CardTitle } from '../../components/ui/index.js';
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
  const [templates, setTemplates] = useState([]);
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
    api.listTemplates().then(setTemplates);
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
  if (!client) return <div className="page"><SkeletonDetail /></div>;

  return (
    <div className="page">
      <div className="detail">
        <Link to="/admin/clients" className="back-link"><IconArrowLeft /> Clients</Link>

        <div className="page-head">
          <div>
            <h1>{client.name}</h1>
            <p className="text-muted">{client.contentTypeName ?? 'No content type'}</p>
          </div>
          <div className="page-head-actions">
            <Button onClick={() => setCreating(true)}>
              <IconPlus /> New content
            </Button>
            <Button variant="ghost" onClick={() => setEditing(true)}><IconEdit /> Edit</Button>
          </div>
        </div>

        <Card className="detail-meta">
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
        </Card>

        {client.pilotNotes && (
          <Card>
            <CardTitle as="h2">The pilot</CardTitle>
            <p className="brief-notes">{client.pilotNotes}</p>
          </Card>
        )}

        {client.sampleLinks?.length > 0 && (
          <Card>
            <CardTitle as="h2">Sample work</CardTitle>
            <ul className="ref-link-list">
              {client.sampleLinks.map((l, i) => (
                <li key={i}>
                  <a className="doc-link" href={l} target="_blank" rel="noreferrer">
                    <IconExternal /> <span className="ref-link-text">{l}</span>
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {client.notes && (
          <Card>
            <CardTitle as="h2">Notes</CardTitle>
            <p className="brief-notes">{client.notes}</p>
          </Card>
        )}

        {active.length > 0 && (
          <Card>
            <CardTitle as="h2">Active content ({active.length})</CardTitle>
            <ul className="writer-articles">
              {active.map((a) => (
                <li key={a.id}>
                  <Link to={`/admin/articles/${a.id}`} className="writer-article-link">
                    <span className="writer-article-title">{a.title}</span>
                    <span className="writer-article-meta">
                      {a.writerName && <span className="text-muted">{a.writerName}</span>}
                      {a.deadline && <span className="text-muted">{formatDate(a.deadline)}</span>}
                    </span>
                    <StatusBadge status={a.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {completed.length > 0 && (
          <Card>
            <CardTitle as="h2">Completed ({completed.length})</CardTitle>
            <ul className="writer-articles">
              {completed.map((a) => (
                <li key={a.id}>
                  <Link to={`/admin/articles/${a.id}`} className="writer-article-link">
                    <span className="writer-article-title">{a.title}</span>
                    <span className="writer-article-meta">
                      {a.writerName && <span className="text-muted">{a.writerName}</span>}
                    </span>
                    <StatusBadge status={a.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {articles.length === 0 && (
          <Card>
            <p className="text-muted text-center py-4">
              No content yet for this client.{' '}
              <LinkButton onClick={() => setCreating(true)}>Create the first piece →</LinkButton>
            </p>
          </Card>
        )}
      </div>

      {editing && (
        <ClientForm
          client={client}
          types={types}
          writers={writers}
          templates={templates}
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
          articles={articles}
          templates={templates}
          onClose={() => setCreating(false)}
          onSaved={() => { setCreating(false); loadArticles(); }}
        />
      )}
    </div>
  );
}
