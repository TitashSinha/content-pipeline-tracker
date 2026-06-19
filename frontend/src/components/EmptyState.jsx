export default function EmptyState({ title, message, action }) {
  return (
    <div className="empty-state">
      <div className="empty-mark">✦</div>
      <h3>{title}</h3>
      {message && <p className="muted">{message}</p>}
      {action}
    </div>
  );
}
