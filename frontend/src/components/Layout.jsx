import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import QuoteBox from './QuoteBox.jsx';
import Avatar from './Avatar.jsx';
import { api } from '../api/client.js';
import {
  IconDashboard, IconContent, IconClients, IconKey,
  IconLogout, IconMenu, IconClose, IconChevronDown, IconUser, IconUsers,
  IconSearch, IconTL, IconTag,
} from '../lib/icons.jsx';

const NAV = {
  ADMIN: [
    { to: '/admin', label: 'Dashboard', Icon: IconDashboard, end: true },
    { to: '/admin/writers', label: 'Writers', Icon: IconUsers },
    { to: '/admin/clients', label: 'Clients', Icon: IconClients },
    { to: '/admin/content-types', label: 'Content Types', Icon: IconTag },
  ],
  TEAM_LEADER: [
    { to: '/tl', label: 'Dashboard', Icon: IconDashboard, end: true },
    { to: '/tl/my-content', label: 'My Content', Icon: IconContent },
  ],
  WRITER: [{ to: '/writer', label: 'My Content', Icon: IconContent, end: true }],
};

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Global search state
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const debouncedQ = useDebounce(searchQ, 250);

  const home = user.role === 'ADMIN' ? '/admin' : user.role === 'TEAM_LEADER' ? '/tl' : '/writer';
  const roleLabel = user.role === 'ADMIN' ? 'Admin' : user.role === 'TEAM_LEADER' ? 'Team Leader' : 'Writer';
  const closeDrawer = () => setOpen(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  // Fetch search results when debounced query changes
  useEffect(() => {
    if (debouncedQ.length < 2) { setSearchResults(null); setSearching(false); return; }
    setSearching(true);
    setSearchResults(null);
    api.searchAll(debouncedQ)
      .then((r) => { setSearchResults(r); setSearching(false); })
      .catch(() => { setSearchResults(null); setSearching(false); });
  }, [debouncedQ]);

  // ⌘K / Ctrl+K opens and focuses search
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Close search on outside click
  useEffect(() => {
    if (!searchOpen) return;
    const onDown = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
        setSearchQ('');
        setSearchResults(null);
      }
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [searchOpen]);

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

  function handleResultClick(type, id) {
    setSearchOpen(false);
    setSearchQ('');
    setSearchResults(null);
    if (type === 'article') {
      const base = user.role === 'ADMIN' ? '/admin' : user.role === 'TEAM_LEADER' ? '/tl' : '/writer';
      navigate(`${base}/articles/${id}`);
    } else if (type === 'writer') {
      navigate(`/admin/writers/${id}`);
    } else if (type === 'client') {
      navigate(`/admin/clients/${id}`);
    }
  }

  const hasResults = searchResults &&
    (searchResults.articles?.length || searchResults.writers?.length || searchResults.clients?.length);

  const navLinks = NAV[user.role] || NAV.WRITER;

  return (
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
          {/* Hamburger — mobile only */}
          <button type="button" className="icon-btn topbar-menu" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            {open ? <IconClose /> : <IconMenu />}
          </button>

          {/* Global search */}
          <div className="topbar-search" ref={searchRef}>
            <div className={`topbar-search-box ${searchOpen ? 'topbar-search-box--open' : ''}`}>
              <IconSearch className="topbar-search-icon" />
              <input
                ref={searchInputRef}
                className="topbar-search-input"
                value={searchQ}
                placeholder="Search… (⌘K)"
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => { setSearchQ(e.target.value); setSearchOpen(true); }}
                onKeyDown={(e) => e.key === 'Escape' && (setSearchOpen(false), setSearchQ(''))}
              />
            </div>

            {searchOpen && debouncedQ.length >= 2 && (
              <div className="search-dropdown">
                {searching && <p className="search-empty search-loading">Searching…</p>}
                {!searching && !hasResults && <p className="search-empty">No results for "{debouncedQ}"</p>}

                {searchResults?.articles?.length > 0 && (
                  <div className="search-section">
                    <span className="search-section-label">Content</span>
                    {searchResults.articles.map((a) => (
                      <button key={a.id} type="button" className="search-result" onClick={() => handleResultClick('article', a.id)}>
                        <span className="search-result-name">{a.title}</span>
                        <span className="search-result-tag">Content</span>
                      </button>
                    ))}
                  </div>
                )}

                {searchResults?.writers?.length > 0 && (
                  <div className="search-section">
                    <span className="search-section-label">Writers</span>
                    {searchResults.writers.map((w) => (
                      <button key={w.id} type="button" className="search-result" onClick={() => handleResultClick('writer', w.id)}>
                        <span className="search-result-name">{w.name}</span>
                        <span className="search-result-tag">{w.role === 'TEAM_LEADER' ? 'Team Leader' : 'Writer'}</span>
                      </button>
                    ))}
                  </div>
                )}

                {searchResults?.clients?.length > 0 && (
                  <div className="search-section">
                    <span className="search-section-label">Clients</span>
                    {searchResults.clients.map((c) => (
                      <button key={c.id} type="button" className="search-result" onClick={() => handleResultClick('client', c.id)}>
                        <span className="search-result-name">{c.name}</span>
                        <span className="search-result-tag">Client</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

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
  );
}
