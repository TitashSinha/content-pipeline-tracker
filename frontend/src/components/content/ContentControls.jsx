import { useState } from 'react';
import DatePickerPopover from '../DatePickerPopover.jsx';
import { LinkButton } from '../ui/index.js';
import { STATUSES, STATUS_LABELS } from '../../lib/workflow.js';
import { IconSearch, IconFilter, IconBookmark, IconClose } from '../../lib/icons.jsx';
import { cn } from '../ui/cn.js';

// Shared dashboard controls, split into two cohesive bars:
//   ContentViewBar   — high-level slice (date range + Saved Views), sits above
//                      the stats so the summary reflects the chosen range.
//   ContentFilterBar — granular table filters, sits directly above the table.
// All state lives in the parent's useContentList / useSavedViews.

const DATE_RANGES = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All Time' },
];

const TAB_BASE =
  'px-3 py-1.5 rounded-[var(--radius-sm)] border text-[.82rem] font-semibold cursor-pointer ' +
  'transition-[background,border-color,color] duration-[120ms] whitespace-nowrap';

export function ContentViewBar({
  dateRange, setDateRange, customFilter, setCustomFilter,
  filters, filterActive, views, applyView, matchesView,
}) {
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');

  function saveCurrent(e) {
    e.preventDefault();
    if (!name.trim()) return;
    views.addView(name.trim(), filters, dateRange);
    setName('');
    setNaming(false);
  }

  const allViews = [...views.builtinViews, ...views.userViews];

  return (
    <div className="flex flex-col gap-2.5">
      {/* Date range row */}
      <div className="flex items-center gap-2 flex-wrap">
        <IconFilter className="w-4 h-4 text-muted flex-shrink-0" />
        {DATE_RANGES.map((r) => (
          <button
            key={r.key}
            type="button"
            className={cn(
              TAB_BASE,
              dateRange === r.key
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-surface text-muted border-border hover:border-primary hover:text-ink',
            )}
            onClick={() => { setDateRange(r.key); setCustomFilter(null); }}
          >
            {r.label}
          </button>
        ))}
        <DatePickerPopover
          customFilter={customFilter}
          onApply={(cf) => { setCustomFilter(cf); setDateRange('custom'); }}
          onClear={() => { setCustomFilter(null); setDateRange('today'); }}
        />
      </div>

      {/* Saved views row */}
      <div className="flex items-center gap-2 flex-wrap">
        <IconBookmark className="w-4 h-4 text-muted flex-shrink-0" />
        {allViews.map((v) => {
          const active = matchesView(v);
          return (
            <span
              key={v.id}
              className={cn(
                'inline-flex items-center rounded-full border text-[.78rem] font-semibold transition-colors duration-[120ms]',
                active
                  ? 'border-primary bg-primary text-on-primary'
                  : 'border-border bg-surface text-ink hover:border-primary',
              )}
            >
              <button type="button" className="px-3 py-1 rounded-full" onClick={() => applyView(v)}>{v.name}</button>
              {!v.builtin && (
                <button
                  type="button"
                  className="pr-2 text-inherit hover:text-danger transition-colors"
                  title="Remove view"
                  onClick={() => views.removeView(v.id)}
                >
                  <IconClose className="w-3 h-3" />
                </button>
              )}
            </span>
          );
        })}
        {naming ? (
          <form className="inline-flex items-center gap-1.5" onSubmit={saveCurrent}>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name this view…"
              maxLength={32}
              className="h-7 px-2.5 text-[.82rem] border border-border rounded-[var(--radius-sm)] bg-surface text-ink focus:outline-none focus:border-primary focus:shadow-[var(--ring)]"
            />
            <LinkButton type="submit">Save</LinkButton>
            <LinkButton type="button" onClick={() => { setNaming(false); setName(''); }}>Cancel</LinkButton>
          </form>
        ) : (
          filterActive && (
            <LinkButton type="button" className="whitespace-nowrap" onClick={() => setNaming(true)}>
              + Save current view
            </LinkButton>
          )
        )}
      </div>
    </div>
  );
}

export function ContentFilterBar({ filters, setFilters, clearFilters, filterActive, writers, clients, searchInputRef }) {
  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  const inputCls =
    'h-9 px-3 text-[.86rem] border border-border rounded-[var(--radius-sm)] bg-surface text-ink ' +
    'focus:outline-none focus:border-primary focus:shadow-[var(--ring)] transition-[border-color,box-shadow] duration-[120ms]';

  return (
    <div className="flex gap-2.5 flex-wrap items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] flex items-center">
        <IconSearch className="absolute left-3 w-[17px] h-[17px] text-muted pointer-events-none" />
        <input
          ref={searchInputRef}
          value={filters.q}
          onChange={set('q')}
          placeholder="Search by title…"
          className={cn(inputCls, 'w-full pl-9')}
        />
      </div>

      <select value={filters.status} onChange={set('status')} className={inputCls}>
        <option value="">All statuses</option>
        {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
      </select>

      <select value={filters.writer} onChange={set('writer')} className={inputCls}>
        <option value="">All writers</option>
        <optgroup label="Team Leaders">
          {writers.filter((w) => w.role === 'TEAM_LEADER').map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </optgroup>
        <optgroup label="Writers">
          {writers.filter((w) => w.role === 'WRITER').map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </optgroup>
      </select>

      <select value={filters.client} onChange={set('client')} className={inputCls}>
        <option value="">All clients</option>
        {clients.map((c) => <option key={c.id} value={c.id}>{c.name}{c.contentTypeName ? ` · ${c.contentTypeName}` : ''}</option>)}
      </select>

      {filterActive && <LinkButton type="button" onClick={clearFilters}>Clear</LinkButton>}
    </div>
  );
}
