import { cn } from './cn.js';

// Surface container (replaces .card / .card.no-pad / .card.narrow).
export default function Card({ noPad = false, narrow = false, as: As = 'div', className, ...props }) {
  return (
    <As
      className={cn(
        'bg-surface border border-border rounded-[var(--radius)] shadow-[var(--shadow-sm)]',
        noPad ? 'p-0 overflow-hidden' : 'p-5',
        narrow && 'max-w-[460px]',
        className,
      )}
      {...props}
    />
  );
}

// Card heading (replaces .card-title). `flush` drops the bottom margin for use
// inside CardTitleRow.
export function CardTitle({ as: As = 'h3', flush = false, className, ...props }) {
  return <As className={cn('text-[.95rem] font-bold', flush ? 'mb-0' : 'mb-3.5', className)} {...props} />;
}

// Title + actions on one row (replaces .card-title-row). Put a <CardTitle flush>
// inside, plus the action element.
export function CardTitleRow({ className, ...props }) {
  return <div className={cn('flex items-center justify-between mb-3.5', className)} {...props} />;
}
