import { cn } from './cn.js';

const BASE =
  'inline-flex items-center font-semibold text-[.76rem] px-[11px] py-[3px] rounded-full whitespace-nowrap';

// Maps status keys → token-driven Tailwind colour pairs.
const VARIANTS = {
  DRAFT:         'bg-surface-2 text-muted',
  BRIEF_PENDING: 'bg-info-soft text-info-strong',
  WRITING:       'bg-secondary-soft text-primary-hover',
  REVIEW:        'bg-warning-soft text-warning',
  COMPLETED:     'bg-success-soft text-success-strong',
  REOPENED:      'bg-info-soft text-info-strong',
};

export default function Badge({ variant, size, className, ...props }) {
  return (
    <span
      className={cn(
        BASE,
        size === 'lg' && 'text-[.82rem] px-[14px] py-[5px]',
        VARIANTS[variant] ?? 'bg-surface-2 text-muted',
        className,
      )}
      {...props}
    />
  );
}
