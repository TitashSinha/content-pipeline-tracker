import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../api/client.js';
import Loader from '../../components/Loader.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import Avatar from '../../components/Avatar.jsx';
import WriterForm from '../../components/admin/WriterForm.jsx';
import { Button, Card, CardTitle } from '../../components/ui/index.js';
import { formatDate } from '../../lib/utils.js';
import { IconArrowLeft, IconEdit, IconExternal } from '../../lib/icons.jsx';

function Meta({ label, value }) {
  return (
    <div className="meta-item">
      <span className="meta-label">{label}</span>
      <span className="meta-value">{value ?? '—'}</span>
    </div>
  );
}

export default function WriterDetailPage() {
  const { id } = useParams();
  const [writer, setWriter] = useState(null);
  const [articles, setArticles] = useState([]);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');

  function load() {
    return api.getWriter(id).then(setWriter).catch((e) => setError(e.message));
  }
  useEffect(() => {
    load();
    api.listArticles().then((all) => setArticles(all.filter((a) => a.assignedWriterId === Number(id))));
  }, [id]);

  if (error) return <div className="page"><p className="form-error">{error}</p></div>;
  if (!writer) return <Loader full />;

  return (
    <div className="page">
      <div className="detail">
        <Link to="/admin/writers" className="back-link"><IconArrowLeft /> Writers</Link>

        <div className="page-head">
          <div className="profile-head-row">
            <Avatar user={writer} className="avatar--lg" />
            <div>
              <h1>{writer.name}</h1>
              <p className="text-muted">{writer.email}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={() => setEditing(true)}><IconEdit /> Edit</Button>
        </div>

        <Card className="detail-meta">
          <Meta label="Specialties" value={writer.specialties} />
          <Meta label="Joined" value={writer.joinedDate ? formatDate(writer.joinedDate) : null} />
          <Meta label="Active articles" value={String(writer.activeArticles)} />
          <Meta label="Total articles" value={String(writer.totalArticles)} />
        </Card>

        {writer.bio && (
          <Card>
            <CardTitle as="h2">Bio</CardTitle>
            <p className="brief-notes">{writer.bio}</p>
          </Card>
        )}

        {writer.portfolioLinks?.length > 0 && (
          <Card>
            <CardTitle as="h2">Portfolio</CardTitle>
            <ul className="ref-link-list">
              {writer.portfolioLinks.map((l, i) => (
                <li key={i}>
                  <a className="doc-link" href={l} target="_blank" rel="noreferrer">
                    <IconExternal /> <span className="ref-link-text">{l}</span>
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {writer.notes && (
          <Card>
            <CardTitle as="h2">Notes</CardTitle>
            <p className="brief-notes">{writer.notes}</p>
          </Card>
        )}

        {articles.length > 0 && (
          <Card>
            <CardTitle as="h2">Assigned content</CardTitle>
            <ul className="writer-articles">
              {articles.map((a) => (
                <li key={a.id}>
                  <Link to={`/admin/articles/${a.id}`} className="writer-article-link">
                    <span>{a.title}</span>
                    <StatusBadge status={a.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {editing && (
        <WriterForm writer={writer} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); load(); }} />
      )}
    </div>
  );
}
