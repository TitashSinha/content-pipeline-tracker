import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import QuoteBox from './QuoteBox.jsx';
import Avatar from './Avatar.jsx';
import NotificationBell from './NotificationBell.jsx';
import CommandPalette from './CommandPalette.jsx';
import ShortcutsHelp from './ShortcutsHelp.jsx';
import usePersistentState from '../hooks/usePersistentState.js';
import useHotkeys from '../hooks/useHotkeys.js';
import { useTheme } from '../lib/theme.js';
import {
  IconDashboard, IconContent, IconClients, IconKey,
  IconLogout, IconMenu, IconClose, IconChevronDown, IconUser, IconUsers,
  IconSearch, IconTag, IconKeyboard, IconTemplate, IconChart, IconRefresh, IconActivity,
  IconSun, IconMoon, IconMonitor,
} from '../lib/icons.jsx';
import { IconButton } from './ui/index.js';

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', Icon: IconSun },
  { value: 'dark', label: 'Dark', Icon: IconMoon },
  { value: 'system', label: 'Auto', Icon: IconMonitor },
];

const NAV = {
  ADMIN: [
    { to: '/admin', label: 'Dashboard', Icon: IconDashboard, end: true },
    { to: '/admin/analytics', label: 'Analytics', Icon: IconChart },
    { to: '/admin/activity', label: 'Activity', Icon: IconActivity },
    { to: '/admin/writers', label: 'People', Icon: IconUsers },
    { to: '/admin/clients', label: 'Clients', Icon: IconClients },
    { to: '/admin/templates', label: 'Templates', Icon: IconTemplate },
    { to: '/admin/recurring', label: 'Recurring', Icon: IconRefresh },
    { to: '/admin/content-types', label: 'Content Types', Icon: IconTag },
  ],
  TEAM_LEADER: [
    { to: '/tl', label: 'Dashboard', Icon: IconDashboard, end: true },
    { to: '/tl/team', label: 'Team', Icon: IconUsers },
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
  const [helpOpen, setHelpOpen] = useState(false);
  const [collapsed, setCollapsed] = usePersistentState('cpt_sidebar_collapsed', false);
  const [themePref, setThemePref] = useTheme();
  const menuRef = useRef(null);

  const home = user.role === 'ADMIN' ? '/admin' : user.role === 'TEAM_LEADER' ? '/tl' : '/writer';
  const roleLabel = user.role === 'ADMIN' ? 'Admin' : user.role === 'TEAM_LEADER' ? 'Team Leader' : 'Writer';
  const closeDrawer = () => setOpen(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  // Global shortcuts: ⌘K opens search, ? opens the shortcuts help.
  useHotkeys({
    'mod+k': () => setPaletteOpen(true),
    '?': () => setHelpOpen(true),
  });

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
      <div className={`app-shell ${collapsed ? 'app-shell--collapsed' : ''}`}>
        <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
          <div className="sidebar-head">
            <Link to={home} className="brand brand--link" onClick={closeDrawer} title="Go to dashboard">
              <span className="brand-mark">✦</span>
              <div className="brand-text">
                <strong>Content Pipeline Tracker</strong>
              </div>
            </Link>
            <button
              type="button"
              className="sidebar-toggle"
              onClick={() => setCollapsed((c) => !c)}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <IconMenu />
            </button>
          </div>

          <nav className="nav">
            {navLinks.map(({ to, label, Icon, end }) => (
              <NavLink key={to} to={to} end={end} className="nav-link" onClick={closeDrawer} title={collapsed ? label : undefined}>
                <Icon /> <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <QuoteBox />
        </aside>

        {open && <div className="scrim" onClick={closeDrawer} />}

        <div className="main">
          <header className="topbar">
            <IconButton className="topbar-menu" onClick={() => setOpen((o) => !o)} aria-label="Menu">
              {open ? <IconClose /> : <IconMenu />}
            </IconButton>

            <button
              type="button"
              className="search-trigger"
              onClick={() => setPaletteOpen(true)}
              aria-label="Search (⌘K)"
            >
              <IconSearch />
              <span>Search…</span>
              <span className="search-trigger-spacer" />
              <kbd>⌘K</kbd>
            </button>

            <div className="topbar-spacer" />

            <NotificationBell />

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
                      <span className="text-muted text-[.8rem]">{user.email}</span>
                    </div>
                  </div>
                  <div className="theme-switch" role="group" aria-label="Theme">
                    {THEME_OPTIONS.map(({ value, label, Icon }) => (
                      <button
                        key={value}
                        type="button"
                        className={`theme-switch-btn ${themePref === value ? 'theme-switch-btn--active' : ''}`}
                        onClick={() => setThemePref(value)}
                        aria-pressed={themePref === value}
                      >
                        <Icon /> <span>{label}</span>
                      </button>
                    ))}
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
                    <button type="button" className="user-dropdown-item" role="menuitem" onClick={() => { setMenuOpen(false); setHelpOpen(true); }}>
                      <IconKeyboard /> Keyboard shortcuts
                    </button>
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
      {helpOpen && <ShortcutsHelp onClose={() => setHelpOpen(false)} />}
    </>
  );
}
