import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Layout from '../components/Layout.jsx';
import Loader from '../components/Loader.jsx';

function homeFor(role) {
  if (role === 'ADMIN') return '/admin';
  if (role === 'TEAM_LEADER') return '/tl';
  return '/writer';
}

export default function ProtectedRoute({ role }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader full />;
  if (!user) return <Navigate to="/login" replace />;
  const allowed = role ? (Array.isArray(role) ? role : [role]) : null;
  if (allowed && !allowed.includes(user.role)) {
    return <Navigate to={homeFor(user.role)} replace />;
  }
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
