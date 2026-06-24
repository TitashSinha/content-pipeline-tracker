import { useCallback, useState } from 'react';

// Reusable multi-select state for tables — a Set of row ids. Powers Bulk Actions.
export default function useSelection() {
  const [ids, setIds] = useState(() => new Set());

  const toggle = useCallback((id) => setIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  }), []);

  const toggleAll = useCallback((rowIds, allSelected) => setIds((prev) => {
    const next = new Set(prev);
    if (allSelected) rowIds.forEach((id) => next.delete(id));
    else rowIds.forEach((id) => next.add(id));
    return next;
  }), []);

  const clear = useCallback(() => setIds(new Set()), []);
  const has = useCallback((id) => ids.has(id), [ids]);

  return { ids, size: ids.size, toggle, toggleAll, clear, has };
}
