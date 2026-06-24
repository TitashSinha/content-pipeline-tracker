import { useEffect, useRef } from 'react';

// FEATURE: Keyboard Shortcuts
// Declarative global shortcuts. Pass a map of combo → handler:
//   useHotkeys({ 'mod+n': newContent, 'mod+shift+b': batch, 'mod+/': focusSearch, '?': help })
// "mod" = Cmd on macOS / Ctrl elsewhere. Handlers read from a ref so callers
// don't need to memoize the map. Plain (modifier-less) combos never fire while
// the user is typing, so they don't hijack normal input.

function parse(combo) {
  const parts = combo.toLowerCase().split('+');
  return {
    mod: parts.includes('mod'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt'),
    key: parts[parts.length - 1],
  };
}

const isTyping = (el) =>
  !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);

export default function useHotkeys(map, { enabled = true } = {}) {
  const mapRef = useRef(map);
  mapRef.current = map;

  useEffect(() => {
    if (!enabled) return undefined;
    const onKey = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      for (const [combo, handler] of Object.entries(mapRef.current)) {
        const b = parse(combo);
        if (b.key !== e.key.toLowerCase()) continue;
        if (b.mod !== mod) continue;
        if (b.shift && !e.shiftKey) continue;
        if (b.alt && !e.altKey) continue;
        if (!b.mod && isTyping(document.activeElement)) continue;
        e.preventDefault();
        handler(e);
        return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled]);
}
