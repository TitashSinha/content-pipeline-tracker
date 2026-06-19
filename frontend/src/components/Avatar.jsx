import { initials } from '../lib/utils.js';

// Renders the user's uploaded photo, or their initials as a fallback.
export default function Avatar({ user, className = '' }) {
  if (user?.avatarUrl) {
    return <img className={`avatar avatar--img ${className}`} src={user.avatarUrl} alt={user.name || ''} />;
  }
  return <div className={`avatar ${className}`}>{initials(user?.name || '')}</div>;
}
