import { useEffect, useState } from 'react';
import { readJson, writeJson } from '../lib/storage.js';

// useState that transparently persists to localStorage. Same shape as useState,
// keyed by `key`. Powers remembered UI state — sidebar collapse, dashboard
// views, etc. State that should survive refresh and navigation lives here.
export default function usePersistentState(key, initial) {
  const [value, setValue] = useState(() => readJson(key, initial));
  useEffect(() => { writeJson(key, value); }, [key, value]);
  return [value, setValue];
}
