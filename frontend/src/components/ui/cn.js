// Tiny classNames joiner — no dependency. Falsy parts are dropped, arrays flattened.
// Keeps primitive call-sites readable: cn('base', cond && 'x', props.className).
export function cn(...parts) {
  return parts.flat().filter(Boolean).join(' ');
}
