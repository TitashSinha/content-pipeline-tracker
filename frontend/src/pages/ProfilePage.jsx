import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import { useToast } from '../components/Toast.jsx';
import Avatar from '../components/Avatar.jsx';
import { formatDate, resizeImageToDataUrl } from '../lib/utils.js';
import { IconKey, IconLogout, IconDashboard, IconEdit, IconUpload, IconTrash } from '../lib/icons.jsx';

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const fileRef = useRef(null);
  const menuRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const roleLabel = user.role === 'ADMIN' ? 'Admin' : user.role === 'TEAM_LEADER' ? 'Team Leader' : 'Writer';
  const home = user.role === 'ADMIN' ? '/admin' : user.role === 'TEAM_LEADER' ? '/tl' : '/writer';

  function handleLogout() {
    logout();
    navigate('/login');
  }

  // Close the avatar menu on outside-click / Escape.
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

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Please choose an image file');
    setBusy(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file, 256);
      const { user: updated } = await api.setAvatar(dataUrl);
      updateUser(updated);
      toast.success('Photo updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
      setMenuOpen(false);
    }
  }

  async function removeAvatar() {
    setBusy(true);
    try {
      const { user: updated } = await api.setAvatar(null);
      updateUser(updated);
      toast.success('Photo removed');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
      setMenuOpen(false);
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Account</h1>
          <p className="muted">Your profile and account settings.</p>
        </div>
      </div>

      <div className="card profile-head">
        <div className="profile-avatar" ref={menuRef}>
          <button
            type="button"
            className="profile-avatar-btn"
            onClick={() => setMenuOpen((o) => !o)}
            disabled={busy}
            aria-label="Edit photo"
            title="Edit photo"
          >
            <Avatar user={user} className="avatar--xl" />
            <span className="avatar-overlay"><IconEdit /></span>
          </button>
          <span className="avatar-pen" aria-hidden="true"><IconEdit /></span>
          {menuOpen && (
            <div className="avatar-menu">
              <button type="button" onClick={() => fileRef.current?.click()} disabled={busy}>
                <IconUpload /> Upload photo
              </button>
              {user.avatarUrl && (
                <button type="button" className="danger" onClick={removeAvatar} disabled={busy}>
                  <IconTrash /> Remove photo
                </button>
              )}
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
        </div>

        <div className="profile-id">
          <h2>{user.name}</h2>
          <span className={`role-pill role-pill--${user.role.toLowerCase().replace('_', '-')}`}>{roleLabel}</span>
          <p className="muted">{user.email}</p>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Account details</h2>
        <div className="detail-meta">
          <div className="meta-item"><span className="meta-label">Name</span><span className="meta-value">{user.name}</span></div>
          <div className="meta-item"><span className="meta-label">Email</span><span className="meta-value">{user.email}</span></div>
          <div className="meta-item"><span className="meta-label">Role</span><span className="meta-value">{roleLabel}</span></div>
          {user.createdAt && (
            <div className="meta-item"><span className="meta-label">Member since</span><span className="meta-value">{formatDate(user.createdAt)}</span></div>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Security</h2>
        <p className="muted profile-sec-text">Keep your account secure with a strong, unique password.</p>
        <Link to="/change-password" className="btn btn--ghost"><IconKey /> Change password</Link>
      </div>

      <div className="profile-actions">
        <Link to={home} className="btn btn--ghost"><IconDashboard /> Back to dashboard</Link>
        <button type="button" className="btn btn--danger" onClick={handleLogout}><IconLogout /> Sign out</button>
      </div>
    </div>
  );
}
