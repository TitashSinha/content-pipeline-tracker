import { useCallback } from 'react';
import usePersistentState from './usePersistentState.js';

// FEATURE: Saved Views — named dashboard filter presets.
// Built-ins are computed (always present); user views persist in localStorage.
// A view = { id, name, filters: { q, status, writer, client, overdue }, dateRange }.
// Related: hooks/useContentList.js, components/content/ContentControls.jsx

const STORE_KEY = 'cpt_saved_views';

export const BUILTIN_VIEWS = [
  {
    id: 'builtin:review', name: 'Review Queue', builtin: true, dateRange: 'all',
    filters: { q: '', status: 'REVIEW', writer: '', client: '', overdue: false },
  },
  {
    id: 'builtin:overdue', name: 'Overdue', builtin: true, dateRange: 'all',
    filters: { q: '', status: '', writer: '', client: '', overdue: true },
  },
];

export default function useSavedViews() {
  const [userViews, setUserViews] = usePersistentState(STORE_KEY, []);

  const addView = useCallback((name, filters, dateRange) => {
    const view = { id: `v${Date.now()}`, name: name.trim(), filters, dateRange };
    // Replace any existing view with the same name so re-saving updates in place.
    setUserViews((prev) => [...prev.filter((v) => v.name !== view.name), view]);
    return view;
  }, [setUserViews]);

  const removeView = useCallback(
    (id) => setUserViews((prev) => prev.filter((v) => v.id !== id)),
    [setUserViews],
  );

  return { builtinViews: BUILTIN_VIEWS, userViews, addView, removeView };
}
