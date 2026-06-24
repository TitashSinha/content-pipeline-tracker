import { STATUS_LABELS, isActive } from './workflow.js';

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
    isActive(article.status) &&
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

/** Escape a single CSV cell (quote if it contains a comma, quote or newline). */
const csvCell = (v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// Build + download a CSV of the given article rows. Shared by the dashboard's
// full export and the bulk "Export selected" action.
export function exportArticlesCsv(rows, filename) {
  const headers = ['Title', 'Client', 'Type', 'Writer', 'Status', 'Deadline', 'Word Count Target', 'TTW', 'Reference Links'];
  const lines = [headers.join(',')];
  for (const a of rows) {
    lines.push([
      a.title, a.clientName, a.typeName, a.writerName, STATUS_LABELS[a.status] ?? a.status,
      a.deadline ? formatDate(a.deadline) : '', a.wordCountTarget ?? '',
      ttwDisplay(a), (a.referenceLinks || []).join(' | '),
    ].map(csvCell).join(','));
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
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

// FEATURE: Duplicate Detection
// Normalize a title to letters+digits so punctuation/casing/spacing don't hide
// near-identical pieces, then match exact or substring (length-guarded to avoid
// noise). Same-client matches are surfaced first. Advisory only — never blocks.
const normalizeTitle = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function findSimilarArticles(title, articles, { clientId, excludeId } = {}) {
  const n = normalizeTitle(title);
  if (n.length < 4) return [];
  const sameClient = (a) => clientId && String(a.clientId) === String(clientId);
  return articles
    .filter((a) => a.id !== excludeId && a.title)
    .filter((a) => {
      const an = normalizeTitle(a.title);
      return an === n || (n.length >= 6 && an.includes(n)) || (an.length >= 6 && n.includes(an));
    })
    .sort((a, b) => (sameClient(b) ? 1 : 0) - (sameClient(a) ? 1 : 0))
    .slice(0, 3);
}

// FEATURE: Quick-duplicate (Phase 6) — a create-form seed cloned from an existing
// piece. No `id` (so ArticleForm opens in create mode), title marked "(copy)", and
// deadline cleared so a fresh one is set (the form's Suggest button helps here).
export function articleDuplicateSeed(a) {
  return {
    title: `${a.title} (copy)`,
    clientId: a.clientId,
    articleTypeId: a.articleTypeId,
    assignedWriterId: a.assignedWriterId,
    deadline: null,
    wordCountTarget: a.wordCountTarget ?? '',
    ttwTargetMinutes: a.ttwTargetMinutes ?? '',
    briefNotes: a.briefNotes || '',
    referenceLinks: a.referenceLinks?.length ? a.referenceLinks : [''],
  };
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}
