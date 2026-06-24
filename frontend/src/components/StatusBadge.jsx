import Badge from './ui/Badge.jsx';
import { STATUS_LABELS } from '../lib/workflow.js';

export default function StatusBadge({ status, size }) {
  return <Badge variant={status} size={size}>{STATUS_LABELS[status] ?? status}</Badge>;
}
