import { useEffect, useRef, useState } from 'react';
import { cn } from './cn.js';

function useCountUp(target, duration = 700) {
  const num = typeof target === 'number' ? target : NaN;
  const [display, setDisplay] = useState(isNaN(num) ? target : 0);
  const raf = useRef(null);
  useEffect(() => {
    if (isNaN(num)) { setDisplay(target); return; }
    if (num === 0) { setDisplay(0); return; }
    const start = performance.now();
    function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      // ease-out cubic
      const ease = 1 - (1 - t) ** 3;
      setDisplay(Math.round(ease * num));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [num, duration, target]);
  return display;
}

// KPI card (replaces .stat-card / .stat-card--*). Soft brand-tinted gradient +
// a thin inset edge accent. `icon` is optional — a small tinted chip in the
// top-right corner (the one refinement borrowed from the reference dashboards).
const TONES = {
  blue:  'bg-gradient-to-br from-surface to-info-soft before:bg-info',
  amber: 'bg-gradient-to-br from-surface to-warning-soft before:bg-warning',
  green: 'bg-gradient-to-br from-surface to-success-soft before:bg-success',
};

const ICON_TONES = {
  blue:  'bg-info-soft text-info-strong',
  amber: 'bg-warning-soft text-warning',
  green: 'bg-success-soft text-success-strong',
};

export default function StatCard({ tone = 'blue', label, value, hint, icon, className }) {
  const animated = useCountUp(value);
  return (
    <div
      className={cn(
        'relative overflow-hidden flex flex-col gap-0.5 p-5 border border-border rounded-[var(--radius)] shadow-[var(--shadow-sm)]',
        'transition-[box-shadow,transform] duration-[180ms] hover:shadow-[var(--shadow)] hover:-translate-y-px',
        "before:content-[''] before:absolute before:left-0 before:top-[18px] before:bottom-[18px] before:w-[3px] before:rounded-r-[3px] before:opacity-85",
        TONES[tone],
        className,
      )}
    >
      {icon && (
        <span className={cn('absolute top-4 right-4 grid place-items-center size-9 rounded-[10px] [&_svg]:size-[18px]', ICON_TONES[tone])}>
          {icon}
        </span>
      )}
      <span className="text-[.82rem] text-muted font-semibold">{label}</span>
      <strong className="text-[2.1rem] font-extrabold tracking-[-.02em] leading-[1.1]">{animated}</strong>
      {hint && <span className="text-[.76rem] text-muted">{hint}</span>}
    </div>
  );
}
