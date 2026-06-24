import { cn } from './cn.js';

// Shared control styling (replaces the .field input/select/textarea rules).
const CONTROL =
  'w-full px-3 py-2.5 rounded-[var(--radius-sm)] border border-border-strong bg-surface text-ink ' +
  'text-[.9rem] [font-family:inherit] focus:outline-none focus:border-primary focus:shadow-[var(--ring)]';

// Labelled field wrapper (replaces .field). Renders <label><span>…</span>{control}</label>.
export function Field({ label, hint, error, htmlFor, className, children }) {
  return (
    <label htmlFor={htmlFor} className={cn('flex flex-col gap-1.5', className)}>
      {label && <span className="text-[.82rem] font-semibold text-ink">{label}</span>}
      {children}
      {hint && <span className="text-[.76rem] text-muted">{hint}</span>}
      {error && <span className="text-[.8rem] text-danger">{error}</span>}
    </label>
  );
}

export function Input({ className, ...props }) {
  return <input className={cn(CONTROL, className)} {...props} />;
}

export function Select({ className, ...props }) {
  return <select className={cn(CONTROL, className)} {...props} />;
}

export function Textarea({ className, ...props }) {
  return <textarea className={cn(CONTROL, 'resize-y', className)} {...props} />;
}
