import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import Loader from '../../components/Loader.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { formatDate, ttwDisplay, isOverdue } from '../../lib/utils.js';

function byDeadline(a, b) {
  if (!a.deadline) return 1;
  if (!b.deadline) return -1;
  return new Date(a.deadline) - new Date(b.deadline);
}

function WriterCard({ article }) {
  const overdue = isOverdue(article);
  return (
    <Link to={`/writer/articles/${article.id}`} className={`content-card ${overdue ? 'content-card--overdue' : ''}`}>
      <div className="content-card-top">
        <h3>{article.title}</h3>
        <StatusBadge status={article.status} />
      </div>
      <p className="content-card-sub">{article.clientName} · {article.typeName}</p>
      <div className="content-card-foot">
        <span className="ttw-chip">TTW {ttwDisplay(article)}</span>
        <span className={`deadline ${overdue ? 'deadline--over' : ''}`}>
          {formatDate(article.deadline)}{overdue && ' · Overdue'}
        </span>
      </div>
    </Link>
  );
}

export default function WriterDashboard() {
  const [articles, setArticles] = useState(null);

  useEffect(() => {
    api.listArticles().then(setArticles).catch(() => setArticles([]));
  }, []);

  if (!articles) return <Loader full />;

  const active = articles.filter((a) => a.status !== 'COMPLETED').sort(byDeadline);
  const completed = articles.filter((a) => a.status === 'COMPLETED');
  const overdue = active.filter(isOverdue).length;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>My Content</h1>
          <p className="muted">{active.length} active · {overdue} overdue · {completed.length} completed</p>
        </div>
      </div>

      {active.length === 0 && completed.length === 0 && (
        <EmptyState title="Nothing assigned yet" message="When your team lead assigns you content, it'll show up here." />
      )}

      {active.length > 0 && (
        <section className="section">
          <h2 className="section-title">Active</h2>
          <div className="card-grid">
            {active.map((a) => <WriterCard key={a.id} article={a} />)}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section className="section">
          <h2 className="section-title">Completed</h2>
          <div className="card-grid card-grid--muted">
            {completed.map((a) => <WriterCard key={a.id} article={a} />)}
          </div>
        </section>
      )}
    </div>
  );
}
