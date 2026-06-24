import StatusBadge from '../StatusBadge.jsx';
import { Button } from '../ui/index.js';
import { IconSort, IconExternal } from '../../lib/icons.jsx';
import { formatDate, ttwDisplay, isOverdue } from '../../lib/utils.js';

// Shared content table for the dashboards. Sticky header (the wrapper scrolls),
// sortable columns, optional row selection for bulk actions, and a row-actions
// slot supplied by the caller (Admin gets edit + delete, TL gets edit).
// Collapses to a card stack on mobile via the data-label attributes.

const SORTABLE = [
  { key: 'title', label: 'Title' },
  { key: 'writer', label: 'Writer' },
  { key: 'client', label: 'Client' },
  { key: 'deadline', label: 'Deadline' },
  { key: 'status', label: 'Status' },
];

export default function ContentTable({
  rows, sort, onToggleSort, onRowClick,
  selectable = false, selectedIds, onToggleSelect, onToggleSelectAll,
  renderActions,
  page, totalPages, setPage, totalCount,
}) {
  const pageIds = rows.map((r) => r.id);
  const allOnPageSelected = selectable && pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const colCount = (selectable ? 1 : 0) + 8 + (renderActions ? 1 : 0);

  return (
    <>
      <div className="content-table-wrap">
        <table className="table table--articles">
          <thead>
            <tr>
              {selectable && (
                <th className="col-check">
                  <input
                    type="checkbox"
                    aria-label="Select all on this page"
                    checked={allOnPageSelected}
                    onChange={() => onToggleSelectAll(pageIds, allOnPageSelected)}
                  />
                </th>
              )}
              {SORTABLE.map((col) => (
                <th key={col.key} className="sortable" onClick={() => onToggleSort(col.key)}>
                  {col.label}
                  <IconSort dir={sort.key === col.key ? sort.dir : null} />
                </th>
              ))}
              <th>Type</th>
              <th>Links</th>
              <th>TTW</th>
              {renderActions && <th aria-label="Actions" />}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td className="table-empty-cell" colSpan={colCount}>No content on this page.</td></tr>
            ) : rows.map((a) => {
              const overdue = isOverdue(a);
              const selected = selectable && selectedIds.has(a.id);
              return (
                <tr
                  key={a.id}
                  className={[
                    'cursor-pointer transition-colors',
                    overdue   ? 'bg-warning-soft hover:bg-warning-soft' : 'hover:bg-surface-2',
                    selected  ? '!bg-primary-soft hover:!bg-primary-soft' : '',
                  ].join(' ')}
                  onClick={() => onRowClick(a)}
                >
                  {selectable && (
                    <td className="col-check" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={`Select ${a.title}`}
                        checked={selected}
                        onChange={() => onToggleSelect(a.id)}
                      />
                    </td>
                  )}
                  <td className="font-semibold" data-label="Title">
                    {a.title}
                    {overdue && (
                      <span className="inline-block ml-2 align-[1px] text-[.68rem] font-bold uppercase tracking-[.04em] text-danger bg-danger-soft px-2 py-0.5 rounded-full">
                        Overdue
                      </span>
                    )}
                  </td>
                  <td data-label="Writer">{a.writerName}{a.writerRole === 'TEAM_LEADER' ? ' (TL)' : ''}</td>
                  <td data-label="Client">{a.clientName}</td>
                  <td data-label="Deadline" className={overdue ? 'text-danger' : ''}>{formatDate(a.deadline)}</td>
                  <td data-label="Status"><StatusBadge status={a.status} /></td>
                  <td data-label="Type">{a.typeName}</td>
                  <td data-label="Links">
                    {a.referenceLinks?.length
                      ? <a href={a.referenceLinks[0]} target="_blank" rel="noreferrer" className="doc-pill" onClick={(e) => e.stopPropagation()}><IconExternal /> {a.referenceLinks.length > 1 ? `${a.referenceLinks.length} links` : 'Link'}</a>
                      : <span className="text-muted">—</span>}
                  </td>
                  <td data-label="TTW">{ttwDisplay(a)}</td>
                  {renderActions && (
                    <td className="col-actions" onClick={(e) => e.stopPropagation()}>{renderActions(a)}</td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-3.5 gap-3 flex-wrap">
        <span className="text-muted text-[.82rem]">{totalCount} item{totalCount === 1 ? '' : 's'}</span>
        <div className="flex items-center gap-2.5">
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-[.82rem] text-muted">Page {page} of {totalPages}</span>
          <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </div>
    </>
  );
}
