import { cn } from './cn.js';

// Primary action button. Token-driven so it follows light/dark automatically.
// Replaces the legacy .btn / .btn--* classes.
const BASE =
  'inline-flex items-center justify-center gap-[7px] whitespace-nowrap rounded-[var(--radius-sm)] ' +
  'border font-semibold transition-[transform,background,box-shadow,border-color] ' +
  'duration-150 active:scale-[0.96] active:translate-y-px disabled:opacity-[.55] disabled:cursor-not-allowed [&_svg]:size-[17px]';

const VARIANTS = {
  primary: 'bg-primary text-on-primary border-transparent shadow-[var(--shadow-sm)] enabled:hover:bg-primary-hover',
  ghost:   'bg-surface text-ink border-[var(--color-border-strong)] enabled:hover:bg-surface-2',
  success: 'bg-success-strong text-white border-transparent enabled:hover:brightness-[1.06]',
  danger:  'bg-danger text-white border-transparent enabled:hover:brightness-[.95]',
};

const SIZES = {
  md: 'px-4 py-[9px] text-[.88rem]',
  sm: 'px-3 py-1.5 text-[.82rem]',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  type = 'button',
  className,
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(BASE, VARIANTS[variant], SIZES[size], block && 'w-full', className)}
      {...props}
    />
  );
}

// Text-only action (replaces .link-btn).
export function LinkButton({ type = 'button', className, ...props }) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center gap-1.5 border-none bg-transparent p-1 text-[.85rem] font-semibold text-primary [&_svg]:size-[14px] enabled:hover:underline',
        className,
      )}
      {...props}
    />
  );
}
