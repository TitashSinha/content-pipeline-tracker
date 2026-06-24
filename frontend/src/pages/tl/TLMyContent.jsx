import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../api/client.js';
import Loader from '../../components/Loader.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { formatDate, ttwDisplay, isOverdue } from '../../lib/utils.js';
import { Card } from '../../components/ui/index.js';
import { IconExternal } from '../../lib/icons.jsx';

export default function TLMyContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [articles, setArticles] = useState(null);

  useEffect(() => {
    api.listArticles().then((all) => {
      setArticles(all.filter((a) => a.assignedWriterId === user.id));
    }).catch(() => setArticles([]));
  }, [user.id]);

  if (!articles) return <Loader full />;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>My Content</h1>
          <p className="text-muted">Articles assigned directly to you.</p>
        </div>
      </div>
      {articles.length === 0 ? (
        <EmptyState title="Nothing assigned to you yet" message="Your TL dashboard shows all team content." />
      ) : (
        <Card noPad>
          <table className="table">
            <thead>
              <tr><th>Title</th><th>Client</th><th>Deadline</th><th>Status</th><th>TTW</th><th>Links</th></tr>
            </thead>
            <tbody>
              {articles.map((a) => {
                const overdue = isOverdue(a);
                return (
                  <tr key={a.id} className={`cursor-pointer transition-colors hover:bg-surface-2 ${overdue ? 'row-overdue' : ''}`} onClick={() => navigate(`/tl/articles/${a.id}`)}>
                    <td className="font-semibold">
                      {a.title}{overdue && <span className="overdue-tag overdue-tag--sm">Overdue</span>}
                    </td>
                    <td>{a.clientName}</td>
                    <td className={overdue ? 'text-danger' : ''}>{formatDate(a.deadline)}</td>
                    <td><StatusBadge status={a.status} /></td>
                    <td>{ttwDisplay(a)}</td>
                    <td>
                      {a.referenceLinks?.length
                        ? <a href={a.referenceLinks[0]} target="_blank" rel="noreferrer" className="doc-pill" onClick={(e) => e.stopPropagation()}><IconExternal /> Link</a>
                        : <span className="text-muted">—</span>}
                    </td>
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
