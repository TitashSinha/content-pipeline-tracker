import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import QuoteBox from './QuoteBox.jsx';
import Avatar from './Avatar.jsx';
import CommandPalette from './CommandPalette.jsx';
import {
  IconDashboard, IconContent, IconClients, IconKey,
  IconLogout, IconMenu, IconClose, IconChevronDown, IconUser, IconUsers,
  IconSearch, IconTag,
} from '../lib/icons.jsx';

const NAV = {
  ADMIN: [
    { to: '/admin', label: 'Dashboard', Icon: IconDashboard, end: true },
    { to: '/admin/writers', label: 'People', Icon: IconUsers },
    { to: '/admin/clients', label: 'Clients', Icon: IconClients },
    { to: '/admin/content-types', label: 'Content Types', Icon: IconTag },
  ],
  TEAM_LEADER: [
    { to: '/tl', label: 'Dashboard', Icon: IconDashboard, end: true },
    { to: '/tl/my-content', label: 'My Content', Icon: IconContent },
  ],
  WRITER: [{ to: '/writer', label: 'My Content', Icon: IconContent, end: true }],
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const menuRef = useRef(null);

  const home = user.role === 'ADMIN' ? '/admin' : user.role === 'TEAM_LEADER' ? '/tl' : '/writer';
  const roleLabel = user.role === 'ADMIN' ? 'Admin' : user.role === 'TEAM_LEADER' ? 'Team Leader' : 'Writer';
  const closeDrawer = () => setOpen(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  // ⌘K / Ctrl+K → command palette
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Close profile dropdown on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenuOpen(false);
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const navLinks = NAV[user.role] || NAV.WRITER;

  return (
    <>
      <div className="app-shell">
        <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
          <Link to={home} className="brand brand--link" onClick={closeDrawer} title="Go to dashboard">
            <span className="brand-mark">✦</span>
            <div className="brand-text">
              <strong>Content Pipeline</strong>
              <span className="brand-sub">Lexiconn</span>
            </div>
          </Link>

          <nav className="nav">
            {navLinks.map(({ to, label, Icon, end }) => (
              <NavLink key={to} to={to} end={end} className="nav-link" onClick={closeDrawer}>
                <Icon /> <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <QuoteBox />
        </aside>

        {open && <div className="scrim" onClick={closeDrawer} />}

        <div className="main">
          <header className="topbar">
            <button type="button" className="icon-btn topbar-menu" onClick={() => setOpen((o) => !o)} aria-label="Menu">
              {open ? <IconClose /> : <IconMenu />}
            </button>

            <button
              type="button"
              className="search-trigger"
              onClick={() => setPaletteOpen(true)}
              aria-label="Search (⌘K)"
            >
              <IconSearch />
              <span>Search…</span>
              <kbd>⌘K</kbd>
            </button>

            <div className="topbar-spacer" />

            <div className="user-menu" ref={menuRef}>
              <button
                type="button"
                className={`user-chip ${menuOpen ? 'user-chip--open' : ''}`}
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <Avatar user={user} />
                <div className="user-meta">
                  <strong>{user.name}{user.role === 'TEAM_LEADER' ? ' (TL)' : ''}</strong>
                  <span className={`role-pill role-pill--${user.role.toLowerCase().replace('_', '-')}`}>{roleLabel}</span>
                </div>
                <IconChevronDown className="chevron" />
              </button>

              {menuOpen && (
                <div className="user-dropdown" role="menu">
                  <div className="user-dropdown-head">
                    <Avatar user={user} className="avatar--lg" />
                    <div className="user-dropdown-id">
                      <strong>{user.name}{user.role === 'TEAM_LEADER' ? ' (TL)' : ''}</strong>
                      <span className="muted tiny">{user.email}</span>
                    </div>
                  </div>
                  <div className="user-dropdown-list">
                    <Link to="/profile" className="user-dropdown-item" role="menuitem" onClick={() => setMenuOpen(false)}>
                      <IconUser /> Profile
                    </Link>
                    <Link to={home} className="user-dropdown-item" role="menuitem" onClick={() => setMenuOpen(false)}>
                      <IconDashboard /> Dashboard
                    </Link>
                    <Link to="/change-password" className="user-dropdown-item" role="menuitem" onClick={() => setMenuOpen(false)}>
                      <IconKey /> Change password
                    </Link>
                    <button type="button" className="user-dropdown-item user-dropdown-item--danger" role="menuitem" onClick={handleLogout}>
                      <IconLogout /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </header>
          <main className="content">{children}</main>
        </div>
      </div>
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} userRole={user.role} />
    </>
  );
}
