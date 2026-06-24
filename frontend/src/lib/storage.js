// Fail-safe localStorage wrappers (JSON in / out). Every call is guarded so a
// disabled or full storage degrades gracefully instead of throwing into the UI.
export function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}
