import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { IconSearch } from '../lib/icons.jsx';
import { STATUS_LABELS } from '../lib/workflow.js';
import { readJson, writeJson } from '../lib/storage.js';

const RECENT_KEY = 'cpt_recent_searches';
const MAX_RECENT = 5;

const getRecent = () => readJson(RECENT_KEY, []);
function saveRecent(q) {
  if (!q?.trim()) return;
  const prev = getRecent().filter((s) => s !== q.trim());
  writeJson(RECENT_KEY, [q.trim(), ...prev].slice(0, MAX_RECENT));
}

function useDebounce(v, d) {
  const [dv, setDv] = useState(v);
  useEffect(() => { const t = setTimeout(() => setDv(v), d); return () => clearTimeout(t); }, [v, d]);
  return dv;
}

function RoleTag({ role }) {
  if (role === 'TEAM_LEADER') return <span className="cmd-item-tag cmd-item-tag--tl">TL</span>;
  if (role === 'ADMIN') return <span className="cmd-item-tag cmd-item-tag--admin">Admin</span>;
  return null;
}

export default function CommandPalette({ isOpen, onClose, userRole }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef(null);
  const dq = useDebounce(query, 200);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults(null);
      setActiveIdx(-1);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  useEffect(() => {
    if (dq.length < 2) { setResults(null); setSearching(false); return; }
    setSearching(true);
    api.searchAll(dq)
      .then((r) => { setResults(r); setSearching(false); setActiveIdx(-1); })
      .catch(() => { setResults(null); setSearching(false); });
  }, [dq]);

  const items = useMemo(() => {
    if (!results) return [];
    return [
      ...(results.articles || []).map((a) => ({ kind: 'article', ...a })),
      ...(results.writers || []).map((w) => ({ kind: 'writer', ...w })),
      ...(results.clients || []).map((c) => ({ kind: 'client', ...c })),
    ];
  }, [results]);

  function go(item) {
    saveRecent(query);
    onClose();
    if (item.kind === 'article') {
      const base = userRole === 'ADMIN' ? '/admin' : userRole === 'TEAM_LEADER' ? '/tl' : '/writer';
      navigate(`${base}/articles/${item.id}`);
    } else if (item.kind === 'writer') {
      navigate(`/admin/writers/${item.id}`);
    } else if (item.kind === 'client') {
      navigate(`/admin/clients/${item.id}`);
    }
  }

  function onKey(e) {
    if (e.key === 'Escape') { onClose(); return; }
    if (items.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => (i + 1) % items.length); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx((i) => (i - 1 + items.length) % items.length); }
    if (e.key === 'Enter' && activeIdx >= 0) go(items[activeIdx]);
  }

  if (!isOpen) return null;

  const recent = getRecent();
  const showHint = query.length < 2;
  const hasResults = results && (results.articles?.length || results.writers?.length || results.clients?.length);
  const noResults = !searching && results && !hasResults;

  let idx = -1;

  return (
    <div className="cmd-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cmd-panel">
        <div className="cmd-input-row">
          <IconSearch className="cmd-input-icon" />
          <input
            ref={inputRef}
            className="cmd-input"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIdx(-1); }}
            onKeyDown={onKey}
            placeholder="Search articles, writers, clients…"
            autoComplete="off"
            spellCheck={false}
          />
          <button type="button" className="cmd-esc-btn" onClick={onClose} aria-label="Close">esc</button>
        </div>

        <div className="cmd-body">
          {/* FEATURE: Advanced search — jump to the faceted search page. */}
          <button
            type="button"
            className="cmd-item cmd-item--advanced"
            onClick={() => { saveRecent(query); onClose(); navigate(query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : '/search'); }}
          >
            <IconSearch className="cmd-item-icon cmd-item-icon--muted" />
            <span className="cmd-item-label">
              {query.trim() ? <>Advanced search for <strong>“{query.trim()}”</strong></> : 'Open advanced search'}
            </span>
            <span className="cmd-item-tag cmd-item-tag--muted">filters</span>
          </button>

          {showHint && recent.length === 0 && (
            <p className="cmd-hint">Start typing to search…</p>
          )}

          {showHint && recent.length > 0 && (
            <div className="cmd-section">
              <span className="cmd-section-label">Recent</span>
              {recent.map((s, i) => (
                <button key={i} type="button" className="cmd-item"
                  onClick={() => { setQuery(s); requestAnimationFrame(() => inputRef.current?.focus()); }}>
                  <IconSearch className="cmd-item-icon cmd-item-icon--muted" />
                  <span className="cmd-item-label">{s}</span>
                </button>
              ))}
            </div>
          )}

          {searching && <p className="cmd-hint">Searching…</p>}
          {noResults && <p className="cmd-hint">No results for <strong>"{dq}"</strong></p>}

          {results?.articles?.length > 0 && (
            <div className="cmd-section">
              <span className="cmd-section-label">Content</span>
              {results.articles.map((a) => { idx++; const i = idx; return (
                <button key={a.id} type="button"
                  className={`cmd-item${activeIdx === i ? ' cmd-item--active' : ''}`}
                  onClick={() => go({ kind: 'article', ...a })}>
                  <span className="cmd-item-label">{a.title}</span>
                  <span className="cmd-item-tag cmd-item-tag--muted">{STATUS_LABELS[a.status]}</span>
                </button>
              ); })}
            </div>
          )}

          {results?.writers?.length > 0 && (
            <div className="cmd-section">
              <span className="cmd-section-label">Writers</span>
              {results.writers.map((w) => { idx++; const i = idx; return (
                <button key={w.id} type="button"
                  className={`cmd-item${activeIdx === i ? ' cmd-item--active' : ''}`}
                  onClick={() => go({ kind: 'writer', ...w })}>
                  <span className="cmd-item-label">{w.name}</span>
                  <RoleTag role={w.role} />
                </button>
              ); })}
            </div>
          )}

          {results?.clients?.length > 0 && (
            <div className="cmd-section">
              <span className="cmd-section-label">Clients</span>
              {results.clients.map((c) => { idx++; const i = idx; return (
                <button key={c.id} type="button"
                  className={`cmd-item${activeIdx === i ? ' cmd-item--active' : ''}`}
                  onClick={() => go({ kind: 'client', ...c })}>
                  <span className="cmd-item-label">{c.name}</span>
                  <span className="cmd-item-tag">Client</span>
                </button>
              ); })}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="cmd-footer">
            <span>↑↓ navigate</span>
            <span>↵ open</span>
            <span>esc close</span>
          </div>
        )}
      </div>
    </div>
  );
}
