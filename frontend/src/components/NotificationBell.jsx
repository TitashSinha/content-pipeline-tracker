// FEATURE: Notifications center (Phase 7) — topbar bell with an unread badge and
// a dropdown feed. Refetches on open and on every route change (the Layout, and
// thus this bell, persists across navigation), so the badge stays fresh without a
// polling loop. Clicking an item marks it read and jumps to the article.
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { IconBell } from '../lib/icons.jsx';
import { initials, formatDateTime } from '../lib/utils.js';
import { IconButton, LinkButton } from './ui/index.js';

const articlePath = (role, id) =>
  role === 'ADMIN' ? `/admin/articles/${id}` : role === 'TEAM_LEADER' ? `/tl/articles/${id}` : `/writer/articles/${id}`;

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ unread: 0, items: [] });
  const ref = useRef(null);

  const load = () => api.listNotifications().then(setData).catch(() => {});
  useEffect(() => { load(); }, [pathname]);
  useEffect(() => { if (open) load(); }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('mousedown', onDown); window.removeEventListener('keydown', onKey); };
  }, [open]);

  function openItem(n) {
    setOpen(false);
    if (!n.read) api.markNotificationRead(n.id).then(load).catch(() => {});
    if (n.articleId) navigate(articlePath(user.role, n.articleId));
  }
  async function markAll() {
    try { await api.markAllNotificationsRead(); load(); } catch {}
  }

  return (
    <div className="notif" ref={ref}>
      <IconButton
        className={`notif-btn ${open ? 'notif-btn--open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${data.unread ? ` (${data.unread} unread)` : ''}`}
      >
        <IconBell />
        {data.unread > 0 && <span className="notif-badge">{data.unread > 9 ? '9+' : data.unread}</span>}
      </IconButton>

      {open && (
        <div className="notif-panel" role="menu">
          <div className="notif-head">
            <strong>Notifications</strong>
            {data.unread > 0 && <LinkButton onClick={markAll}>Mark all read</LinkButton>}
          </div>
          {data.items.length === 0 ? (
            <p className="notif-empty text-muted">You're all caught up.</p>
          ) : (
            <ul className="notif-list">
              {data.items.map((n) => (
                <li
                  key={n.id}
                  className={`notif-item ${n.read ? '' : 'notif-item--unread'}`}
                  onClick={() => openItem(n)}
                >
                  <span className="notif-avatar">{initials(n.actorName || '?')}</span>
                  <div className="notif-body">
                    <p className="notif-text">
                      <strong>{n.actorName}</strong> {n.message}
                      {n.articleTitle && <> · <span className="notif-article">{n.articleTitle}</span></>}
                    </p>
                    <time className="notif-time">{formatDateTime(n.createdAt)}</time>
                  </div>
                  {!n.read && <span className="notif-dot" aria-hidden="true" />}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
