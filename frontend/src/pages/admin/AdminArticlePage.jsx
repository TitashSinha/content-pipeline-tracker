import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import ArticleDetail from '../../components/ArticleDetail.jsx';
import Loader from '../../components/Loader.jsx';

export default function AdminArticlePage() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getArticle(id).then(setArticle).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="page"><p className="form-error">{error}</p></div>;
  if (!article) return <Loader full />;

  return (
    <div className="page">
      <ArticleDetail article={article} role="ADMIN" onChange={setArticle} backTo="/admin" backLabel="Content" />
    </div>
  );
}
