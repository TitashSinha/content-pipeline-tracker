import { STATUS_LABELS } from './constants.js';

export function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function isOverdue(article) {
  return !!(
    article.deadline &&
    article.status !== 'COMPLETED' &&
    new Date(article.deadline) < new Date()
  );
}

/** Minutes → "1h 30m" / "45m" / "2h". */
export function formatTTW(minutes) {
  if (minutes == null) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

/**
 * What to show in a TTW cell:
 *  - completed → "actual / target"
 *  - otherwise → the target budget (or — if none set)
 */
export function ttwDisplay(article) {
  const target = article.ttwTargetMinutes;
  if (article.status === 'COMPLETED') {
    return target != null
      ? `${formatTTW(article.ttwActualMinutes)} / ${formatTTW(target)}`
      : formatTTW(article.ttwActualMinutes);
  }
  return target != null ? formatTTW(target) : '—';
}

export function statusLabel(status) {
  return STATUS_LABELS[status] ?? status;
}

/** Center-crop + scale an image File to a square JPEG data URL (default 256px). */
export function resizeImageToDataUrl(file, size = 256) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const min = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, size, size);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image')); };
    img.src = url;
  });
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}
