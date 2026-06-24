// FEATURE: Dark / light / system themes (Phase 8). The whole app is themed
// through CSS variables; this controller just resolves the user's preference and
// sets `data-theme="dark" | "light"` on <html>. The dark token overrides live in
// index.css under `:root[data-theme="dark"]`. A tiny inline script in index.html
// applies the stored preference before first paint to avoid a flash.
import { useEffect, useState } from 'react';

const KEY = 'cpt_theme';
export const THEMES = ['light', 'dark', 'system'];

export const getThemePref = () => {
  const v = localStorage.getItem(KEY);
  return THEMES.includes(v) ? v : 'system';
};

const systemDark = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;

/** The actual theme to render for a preference ("system" → light|dark). */
export const resolveTheme = (pref) => (pref === 'system' ? (systemDark() ? 'dark' : 'light') : pref);

/** Apply a preference to the document. */
export function applyTheme(pref) {
  document.documentElement.dataset.theme = resolveTheme(pref);
}

/** Persist + apply. */
export function setThemePref(pref) {
  localStorage.setItem(KEY, pref);
  applyTheme(pref);
}

/**
 * Theme hook: returns [pref, setPref, resolved]. Keeps the document in sync and,
 * while the preference is "system", follows OS changes live.
 */
export function useTheme() {
  const [pref, setPref] = useState(getThemePref);

  useEffect(() => {
    applyTheme(pref);
    if (pref !== 'system' || typeof matchMedia !== 'function') return undefined;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [pref]);

  const update = (next) => { setThemePref(next); setPref(next); };
  return [pref, update, resolveTheme(pref)];
}
