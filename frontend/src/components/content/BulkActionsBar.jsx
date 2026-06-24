import { useState } from 'react';
import { STATUSES, STATUS_LABELS } from '../../lib/workflow.js';
import { Button } from '../ui/index.js';
import { IconClose, IconDownload } from '../../lib/icons.jsx';

// FEATURE: Bulk Actions
// Appears when one or more rows are selected. Reassign, change deadline, update
// status, or export the selection. Status changes that aren't legal for a given
// row are skipped server-side and reported back in the toast.

const selectCls =
  'h-8 px-2.5 text-[.83rem] border border-border rounded-[var(--radius-sm)] bg-surface text-ink ' +
  'focus:outline-none focus:border-primary focus:shadow-[var(--ring)] disabled:opacity-50';

const dateCls =
  'h-8 px-2.5 text-[.83rem] border border-border rounded-[var(--radius-sm)] bg-surface text-ink ' +
  'focus:outline-none focus:border-primary focus:shadow-[var(--ring)] disabled:opacity-50';

export default function BulkActionsBar({ count, writers, busy, onReassign, onDeadline, onStatus, onExport, onClear }) {
  const [writer, setWriter] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState('');

  return (
    <div className="flex items-center gap-4 px-4 py-2.5 bg-primary-soft border border-primary/20 rounded-[var(--radius-sm)] flex-wrap">
      {/* Count + clear */}
      <div className="flex items-center gap-2 text-[.88rem] text-muted whitespace-nowrap flex-shrink-0">
        <strong className="text-ink text-[1rem]">{count}</strong> selected
        <button
          type="button"
          className="grid place-items-center w-6 h-6 rounded-full bg-surface-2 text-muted hover:text-ink transition-colors"
          onClick={onClear}
          title="Clear selection"
          aria-label="Clear selection"
        >
          <IconClose className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="flex items-center gap-1.5">
          <select value={writer} onChange={(e) => setWriter(e.target.value)} disabled={busy} className={selectCls}>
            <option value="">Reassign to…</option>
            <optgroup label="Team Leaders">
              {writers.filter((w) => w.role === 'TEAM_LEADER').map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </optgroup>
            <optgroup label="Writers">
              {writers.filter((w) => w.role === 'WRITER').map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </optgroup>
          </select>
          <Button variant="ghost" size="sm" disabled={busy || !writer} onClick={() => onReassign(Number(writer))}>Apply</Button>
        </div>

        <div className="flex items-center gap-1.5">
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} disabled={busy} className={dateCls} />
          <Button variant="ghost" size="sm" disabled={busy || !deadline} onClick={() => onDeadline(new Date(deadline).toISOString())}>Set deadline</Button>
        </div>

        <div className="flex items-center gap-1.5">
          <select value={status} onChange={(e) => setStatus(e.target.value)} disabled={busy} className={selectCls}>
            <option value="">Set status…</option>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <Button variant="ghost" size="sm" disabled={busy || !status} onClick={() => onStatus(status)}>Apply</Button>
        </div>

        <Button variant="ghost" size="sm" disabled={busy} onClick={onExport}>
          <IconDownload /> Export
        </Button>
      </div>
    </div>
  );
}
