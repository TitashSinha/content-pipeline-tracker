import { STATUS_LABELS } from '../lib/constants.js';

export default function StatusBadge({ status, size }) {
  return (
    <span className={`badge badge--${status.toLowerCase()} ${size === 'lg' ? 'badge--lg' : ''}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
