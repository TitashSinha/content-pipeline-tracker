import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import Loader from './components/Loader.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ChangePasswordPage from './pages/ChangePasswordPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminArticlePage from './pages/admin/AdminArticlePage.jsx';
import ClientsPage from './pages/admin/ClientsPage.jsx';
import ClientDetailPage from './pages/admin/ClientDetailPage.jsx';
import WritersPage from './pages/admin/WritersPage.jsx';
import WriterDetailPage from './pages/admin/WriterDetailPage.jsx';
import ArticleTypesPage from './pages/admin/ArticleTypesPage.jsx';
import TemplatesPage from './pages/admin/TemplatesPage.jsx';
import AnalyticsPage from './pages/admin/AnalyticsPage.jsx';
import RecurringPage from './pages/admin/RecurringPage.jsx';
import ActivityPage from './pages/admin/ActivityPage.jsx';
import WriterDashboard from './pages/writer/WriterDashboard.jsx';
import WriterArticlePage from './pages/writer/WriterArticlePage.jsx';
import TLDashboard from './pages/tl/TLDashboard.jsx';
import TLArticlePage from './pages/tl/TLArticlePage.jsx';
import TLMyContent from './pages/tl/TLMyContent.jsx';
import TLTeam from './pages/tl/TLTeam.jsx';

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <Loader full />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user.role === 'TEAM_LEADER') return <Navigate to="/tl" replace />;
  return <Navigate to="/writer" replace />;
}

// ROUTING: data router (createBrowserRouter) so dirty forms can block the
// browser Back button via useBlocker in components/Modal.jsx. ProtectedRoute is
// a layout route (renders <Layout><Outlet/></Layout>); role-gating lives there.
export const router = createBrowserRouter(
  [
    { path: '/login', element: <LoginPage /> },

    {
      element: <ProtectedRoute />,
      children: [
        { path: '/profile', element: <ProfilePage /> },
        { path: '/change-password', element: <ChangePasswordPage /> },
        { path: '/search', element: <SearchPage /> },
      ],
    },

    {
      element: <ProtectedRoute role="ADMIN" />,
      children: [
        { path: '/admin', element: <AdminDashboard /> },
        { path: '/admin/analytics', element: <AnalyticsPage /> },
        { path: '/admin/writers', element: <WritersPage /> },
        { path: '/admin/clients', element: <ClientsPage /> },
        { path: '/admin/clients/:id', element: <ClientDetailPage /> },
        { path: '/admin/content-types', element: <ArticleTypesPage /> },
        { path: '/admin/templates', element: <TemplatesPage /> },
        { path: '/admin/recurring', element: <RecurringPage /> },
        { path: '/admin/activity', element: <ActivityPage /> },
      ],
    },

    // Article + writer detail are shared by ADMIN and TEAM_LEADER.
    {
      element: <ProtectedRoute role={['ADMIN', 'TEAM_LEADER']} />,
      children: [
        { path: '/admin/articles/:id', element: <AdminArticlePage /> },
        { path: '/admin/writers/:id', element: <WriterDetailPage /> },
      ],
    },

    {
      element: <ProtectedRoute role="TEAM_LEADER" />,
      children: [
        { path: '/tl', element: <TLDashboard /> },
        { path: '/tl/team', element: <TLTeam /> },
        { path: '/tl/articles/:id', element: <TLArticlePage /> },
        { path: '/tl/my-content', element: <TLMyContent /> },
      ],
    },

    {
      element: <ProtectedRoute role="WRITER" />,
      children: [
        { path: '/writer', element: <WriterDashboard /> },
        { path: '/writer/articles/:id', element: <WriterArticlePage /> },
      ],
    },

    { path: '*', element: <HomeRedirect /> },
  ],
  { future: { v7_relativeSplatPath: true } },
);
