import { cn } from './cn.js';

// Square icon-only button (replaces .icon-btn / .icon-btn--danger).
export default function IconButton({ tone = 'default', type = 'button', className, ...props }) {
  return (
    <button
      type={type}
      className={cn(
        'inline-grid place-items-center size-[34px] rounded-[9px] bg-surface-2 border border-border',
        'text-muted transition-[background,color,transform] duration-150 active:scale-[0.88]',
        tone === 'danger'
          ? 'enabled:hover:bg-danger-soft enabled:hover:text-danger'
          : 'enabled:hover:bg-primary-soft enabled:hover:text-ink',
        className,
      )}
      {...props}
    />
  );
}
