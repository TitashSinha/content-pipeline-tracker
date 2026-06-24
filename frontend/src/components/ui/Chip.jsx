import { cn } from './cn.js';

// Pill button (replaces .chip). `active` gives the filled-primary selected state
// used by filter/segment controls.
export default function Chip({ active = false, type = 'button', className, ...props }) {
  return (
    <button
      type={type}
      className={cn(
        'px-[14px] py-1.5 rounded-full font-semibold text-[.82rem] border',
        'transition-[background,color,border-color] duration-150',
        active
          ? 'bg-primary text-on-primary border-transparent'
          : 'bg-surface text-ink border-border-strong enabled:hover:bg-primary-soft',
        className,
      )}
      {...props}
    />
  );
}
