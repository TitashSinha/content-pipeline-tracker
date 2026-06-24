import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext.jsx';
import Layout from '../components/Layout.jsx';
import Loader from '../components/Loader.jsx';
import { d, ease } from '../lib/motion.js';

function homeFor(role) {
  if (role === 'ADMIN') return '/admin';
  if (role === 'TEAM_LEADER') return '/tl';
  return '/writer';
}

export default function ProtectedRoute({ role }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loader full />;
  if (!user) return <Navigate to="/login" replace />;
  const allowed = role ? (Array.isArray(role) ? role : [role]) : null;
  if (allowed && !allowed.includes(user.role)) {
    return <Navigate to={homeFor(user.role)} replace />;
  }
  return (
    <Layout>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: d.slow, ease: ease.out }}
          style={{ display: 'contents' }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
}
