import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { STATUSES, emptyStageTally, isActive } from '../lib/workflow.js';
import { isOverdue } from '../lib/utils.js';
import { readJson, writeJson } from '../lib/storage.js';

// FEATURE: shared content-list engine for the Admin and TL dashboards.
// Owns date-range + filters + sort + pagination, the derived row sets, and the
// by-stage / period stats. State is mirrored to the URL (shareable + Back
// button) and to localStorage (so the view is remembered across navigation —
// part of "Remember User State"). Keeping this in one hook is what lets both
// dashboards stay thin and identical in behavior.
// Related: components/content/ContentControls.jsx, ContentTable.jsx, DashboardStats.jsx

const PAGE_SIZE = 20;

const DEFAULTS = {
  dateRange: 'today',
  filters: { q: '', status: '', writer: '', client: '', overdue: false },
  sort: { key: 'deadline', dir: 'asc' },
};

function inDateRange(article, range, custom) {
  if (range === 'all') return true;
  if (range === 'custom' && custom) {
    const d = new Date(article.createdAt); d.setHours(0, 0, 0, 0);
    if (custom.mode === 'range') {
      const from = new Date(custom.from); from.setHours(0, 0, 0, 0);
      const to = new Date(custom.to); to.setHours(23, 59, 59, 999);
      return d >= from && d <= to;
    }
    if (custom.mode === 'days') {
      return custom.dates.some((day) => {
        const dd = new Date(day); dd.setHours(0, 0, 0, 0);
        return d.getTime() === dd.getTime();
      });
    }
  }
  const created = new Date(article.createdAt);
  const now = new Date();
  if (range === 'today') return created.toDateString() === now.toDateString();
  if (range === 'week') {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return created >= weekStart;
  }
  if (range === 'month') return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  return true;
}

function sortValue(a, key) {
  switch (key) {
    case 'title': return a.title.toLowerCase();
    case 'writer': return (a.writerName || '').toLowerCase();
    case 'client': return (a.clientName || '').toLowerCase();
    case 'status': return STATUSES.indexOf(a.status);
    case 'deadline': return a.deadline ? new Date(a.deadline).getTime() : Infinity;
    default: return 0;
  }
}

export default function useContentList(articles, storageKey) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [saved] = useState(() => readJson(storageKey, {}));

  const [dateRange, setDateRange] = useState(searchParams.get('range') || saved.dateRange || DEFAULTS.dateRange);
  const [filters, setFilters] = useState({
    q: searchParams.get('q') ?? saved.filters?.q ?? '',
    status: searchParams.get('status') ?? saved.filters?.status ?? '',
    writer: searchParams.get('writer') ?? saved.filters?.writer ?? '',
    client: searchParams.get('client') ?? saved.filters?.client ?? '',
    overdue: searchParams.has('overdue') ? searchParams.get('overdue') === '1' : (saved.filters?.overdue ?? false),
  });
  const [sort, setSort] = useState({
    key: searchParams.get('sortKey') || saved.sort?.key || DEFAULTS.sort.key,
    dir: searchParams.get('sortDir') || saved.sort?.dir || DEFAULTS.sort.dir,
  });
  const [customFilter, setCustomFilter] = useState(saved.customFilter || null);
  const [page, setPage] = useState(saved.page || 1);

  // Mirror state → URL (shareable + Back) and localStorage (cross-navigation).
  useEffect(() => {
    const p = {};
    if (filters.q) p.q = filters.q;
    if (filters.status) p.status = filters.status;
    if (filters.writer) p.writer = filters.writer;
    if (filters.client) p.client = filters.client;
    if (filters.overdue) p.overdue = '1';
    if (dateRange !== DEFAULTS.dateRange) p.range = dateRange;
    if (sort.key !== DEFAULTS.sort.key) p.sortKey = sort.key;
    if (sort.dir !== DEFAULTS.sort.dir) p.sortDir = sort.dir;
    setSearchParams(p, { replace: true });
    writeJson(storageKey, { dateRange, filters, sort, customFilter, page });
  }, [filters, dateRange, sort, customFilter, page]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter / range / sort changes reset to the first page.
  useEffect(() => { setPage(1); }, [filters, dateRange, sort, customFilter]);

  const rangeFiltered = useMemo(
    () => articles.filter((a) => inDateRange(a, dateRange, customFilter)),
    [articles, dateRange, customFilter],
  );

  const filtered = useMemo(() => {
    const rows = rangeFiltered.filter((a) => {
      if (filters.q && !a.title.toLowerCase().includes(filters.q.toLowerCase())) return false;
      if (filters.status && a.status !== filters.status) return false;
      if (filters.writer && String(a.assignedWriterId) !== String(filters.writer)) return false;
      if (filters.client && String(a.clientId) !== String(filters.client)) return false;
      if (filters.overdue && !isOverdue(a)) return false;
      return true;
    });
    const mult = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const x = sortValue(a, sort.key);
      const y = sortValue(b, sort.key);
      return x < y ? -mult : x > y ? mult : 0;
    });
  }, [rangeFiltered, filters, sort]);

  const periodStats = useMemo(() => {
    const now = new Date();
    const active = rangeFiltered.filter((a) => isActive(a.status));
    const overdue = active.filter((a) => a.deadline && new Date(a.deadline) < now);
    const done = rangeFiltered.filter((a) => a.status === 'COMPLETED');
    const byStage = emptyStageTally();
    for (const a of rangeFiltered) byStage[a.status] = (byStage[a.status] || 0) + 1;
    return { active: active.length, overdue: overdue.length, done: done.length, byStage };
  }, [rangeFiltered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const toggleSort = useCallback((key) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
  }, []);

  const clearFilters = useCallback(() => setFilters({ ...DEFAULTS.filters }), []);

  const filterActive = !!(filters.q || filters.status || filters.writer || filters.client || filters.overdue);

  const applyView = useCallback((view) => {
    setFilters({ ...DEFAULTS.filters, ...view.filters });
    setDateRange(view.dateRange || DEFAULTS.dateRange);
    setCustomFilter(null);
  }, []);

  // Is the current state exactly this view? (drives the active-chip highlight)
  const matchesView = useCallback((view) => {
    const f = { ...DEFAULTS.filters, ...view.filters };
    return (view.dateRange || DEFAULTS.dateRange) === dateRange
      && f.q === filters.q && f.status === filters.status
      && f.writer === filters.writer && f.client === filters.client
      && !!f.overdue === !!filters.overdue;
  }, [filters, dateRange]);

  const reset = useCallback(() => {
    setDateRange(DEFAULTS.dateRange);
    setFilters({ ...DEFAULTS.filters });
    setSort({ ...DEFAULTS.sort });
    setCustomFilter(null);
    setPage(1);
  }, []);

  return {
    dateRange, setDateRange, customFilter, setCustomFilter,
    filters, setFilters, clearFilters, filterActive,
    sort, toggleSort,
    page: safePage, setPage, totalPages,
    rangeFiltered, filtered, pageRows, periodStats,
    applyView, matchesView, reset,
  };
}
