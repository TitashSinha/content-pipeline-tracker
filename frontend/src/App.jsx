import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import Loader from './components/Loader.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ChangePasswordPage from './pages/ChangePasswordPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminArticlePage from './pages/admin/AdminArticlePage.jsx';
import ClientsPage from './pages/admin/ClientsPage.jsx';
import ClientDetailPage from './pages/admin/ClientDetailPage.jsx';
import WritersPage from './pages/admin/WritersPage.jsx';
import WriterDetailPage from './pages/admin/WriterDetailPage.jsx';
import WriterDashboard from './pages/writer/WriterDashboard.jsx';
import WriterArticlePage from './pages/writer/WriterArticlePage.jsx';
import TLDashboard from './pages/tl/TLDashboard.jsx';
import TLArticlePage from './pages/tl/TLArticlePage.jsx';
import TLMyContent from './pages/tl/TLMyContent.jsx';

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <Loader full />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user.role === 'TEAM_LEADER') return <Navigate to="/tl" replace />;
  return <Navigate to="/writer" replace />;
}

export default function App() {
  // Route table — admin, writer, and shared (profile / password) areas.
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
      </Route>

      <Route element={<ProtectedRoute role="ADMIN" />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/writers" element={<WritersPage />} />
        <Route path="/admin/clients" element={<ClientsPage />} />
        <Route path="/admin/clients/:id" element={<ClientDetailPage />} />
      </Route>

      {/* Article and writer detail accessible to both ADMIN and TEAM_LEADER */}
      <Route element={<ProtectedRoute role={['ADMIN', 'TEAM_LEADER']} />}>
        <Route path="/admin/articles/:id" element={<AdminArticlePage />} />
        <Route path="/admin/writers/:id" element={<WriterDetailPage />} />
      </Route>

      <Route element={<ProtectedRoute role="TEAM_LEADER" />}>
        <Route path="/tl" element={<TLDashboard />} />
        <Route path="/tl/articles/:id" element={<TLArticlePage />} />
        <Route path="/tl/my-content" element={<TLMyContent />} />
      </Route>

      <Route element={<ProtectedRoute role="WRITER" />}>
        <Route path="/writer" element={<WriterDashboard />} />
        <Route path="/writer/articles/:id" element={<WriterArticlePage />} />
      </Route>

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
