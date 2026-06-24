import { useTheme } from '../lib/theme.js';
import { IconSun, IconMoon, IconMonitor } from '../lib/icons.jsx';
import { cn } from './ui/cn.js';

// Compact Light / Dark / Auto segmented toggle. Reusable; currently used on the
// login screen so the theme can be changed before signing in.
const OPTIONS = [
  { value: 'light', label: 'Light', Icon: IconSun },
  { value: 'dark', label: 'Dark', Icon: IconMoon },
  { value: 'system', label: 'Auto', Icon: IconMonitor },
];

export default function ThemeToggle({ className }) {
  const [pref, setPref] = useTheme();
  return (
    <div
      role="group"
      aria-label="Theme"
      className={cn(
        'inline-flex items-center gap-0.5 p-1 rounded-full border border-border bg-surface/80 backdrop-blur shadow-[var(--shadow-sm)]',
        className,
      )}
    >
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setPref(value)}
          aria-pressed={pref === value}
          title={label}
          aria-label={label}
          className={cn(
            'grid place-items-center size-8 rounded-full transition-[background,color] duration-150 [&_svg]:size-[16px]',
            pref === value
              ? 'bg-primary text-on-primary'
              : 'text-muted enabled:hover:bg-primary-soft enabled:hover:text-ink',
          )}
        >
          <Icon />
        </button>
      ))}
    </div>
  );
}
