import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import StatusBadge from '../../components/StatusBadge'
import { apiFetch } from '../../api/client'

function isOverdue(article) {
  if (!article.deadline || article.status === 'COMPLETED') return false
  return new Date(article.deadline) < new Date()
}

function formatDate(str) {
  if (!str) return 'No deadline set'
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(str))
}

// ─── Article card ─────────────────────────────────────────────────────────────

function ArticleCard({ article, onClick }) {
  const overdue = isOverdue(article)
  return (
    <button
      className={`article-card ${overdue ? 'article-card--overdue' : ''}`}
      onClick={onClick}
    >
      <div className="article-card-top">
        <span className="article-card-title">{article.title}</span>
        <StatusBadge status={article.status} />
      </div>
      <div className="article-card-meta">
        <span>{article.client.name}</span>
        <span className="meta-dot">·</span>
        <span>{article.articleType.name}</span>
      </div>
      <div className={`article-card-deadline ${overdue ? 'article-card-deadline--overdue' : ''}`}>
        {overdue && <span className="overdue-tag">Overdue</span>}
        <span>{formatDate(article.deadline)}</span>
      </div>
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WriterDashboard() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    apiFetch('/api/articles')
      .then(setArticles)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const active    = articles.filter((a) => a.status !== 'COMPLETED')
  const completed = articles.filter((a) => a.status === 'COMPLETED')
  const overdue   = articles.filter(isOverdue).length

  return (
    <Layout>
      <div className="page-header">
        <h2 className="page-title">My Content</h2>
        <p className="page-subtitle">
          {active.length} active
          {overdue > 0 && <span className="overdue-count"> · {overdue} overdue</span>}
          {completed.length > 0 && ` · ${completed.length} completed`}
        </p>
      </div>

      {loading ? (
        <p className="state-msg">Loading your articles…</p>
      ) : error ? (
        <p className="state-msg state-msg--error">{error}</p>
      ) : articles.length === 0 ? (
        <p className="state-msg">You have no articles assigned yet.</p>
      ) : (
        <>
          {active.length > 0 && (
            <div className="article-cards">
              {active.map((a) => (
                <ArticleCard
                  key={a.id}
                  article={a}
                  onClick={() => navigate(`/writer/articles/${a.id}`)}
                />
              ))}
            </div>
          )}

          {completed.length > 0 && (
            <>
              <h3 className="writer-section-title">Completed</h3>
              <div className="article-cards article-cards--muted">
                {completed.map((a) => (
                  <ArticleCard
                    key={a.id}
                    article={a}
                    onClick={() => navigate(`/writer/articles/${a.id}`)}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </Layout>
  )
}
