import { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { IconCalendar } from '../lib/icons.jsx';
import { Button } from './ui/index.js';

function fmtShort(d) {
  if (!d) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// customFilter shape:
//   { mode: 'range', from: Date, to: Date }
//   { mode: 'days', dates: Date[] }
export default function DatePickerPopover({ customFilter, onApply, onClear }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('range');
  const [range, setRange] = useState(
    customFilter?.mode === 'range' ? { from: customFilter.from, to: customFilter.to } : undefined
  );
  const [days, setDays] = useState(
    customFilter?.mode === 'days' ? customFilter.dates : []
  );
  const ref = useRef(null);

  // Sync local state when external customFilter changes (e.g. cleared from outside)
  useEffect(() => {
    if (!customFilter) { setRange(undefined); setDays([]); }
  }, [customFilter]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [open]);

  function apply() {
    if (mode === 'range' && range?.from) {
      onApply({ mode: 'range', from: range.from, to: range.to ?? range.from });
    } else if (mode === 'days' && days?.length > 0) {
      onApply({ mode: 'days', dates: days });
    }
    setOpen(false);
  }

  function clear() {
    setRange(undefined);
    setDays([]);
    onClear();
    setOpen(false);
  }

  function switchMode(m) {
    setMode(m);
    setRange(undefined);
    setDays([]);
  }

  // Label on the button when a custom filter is active
  let buttonLabel = 'Custom';
  if (customFilter) {
    if (customFilter.mode === 'range') {
      const from = fmtShort(customFilter.from);
      const to = fmtShort(customFilter.to);
      buttonLabel = from === to ? from : `${from} – ${to}`;
    } else {
      buttonLabel = `${customFilter.dates.length} day${customFilter.dates.length === 1 ? '' : 's'}`;
    }
  }

  const canApply = mode === 'range' ? !!range?.from : (days?.length ?? 0) > 0;

  return (
    <div className="date-picker-wrap" ref={ref}>
      <button
        type="button"
        className={`date-range-tab date-picker-trigger ${customFilter ? 'date-range-tab--active' : ''}`}
        onClick={() => setOpen((o) => !o)}
      >
        <IconCalendar style={{ width: 13, height: 13 }} />
        {buttonLabel}
        {customFilter && (
          <span
            className="date-picker-clear-x"
            role="button"
            aria-label="Clear custom date"
            onClick={(e) => { e.stopPropagation(); clear(); }}
          >
            ✕
          </span>
        )}
      </button>

      {open && (
        <div className="date-picker-popover">
          <div className="date-picker-modes">
            <button
              type="button"
              className={`date-picker-mode-btn ${mode === 'range' ? 'date-picker-mode-btn--active' : ''}`}
              onClick={() => switchMode('range')}
            >
              Date range
            </button>
            <button
              type="button"
              className={`date-picker-mode-btn ${mode === 'days' ? 'date-picker-mode-btn--active' : ''}`}
              onClick={() => switchMode('days')}
            >
              Pick days
            </button>
          </div>

          {mode === 'range' ? (
            <DayPicker
              mode="range"
              selected={range}
              onSelect={setRange}
              numberOfMonths={1}
            />
          ) : (
            <DayPicker
              mode="multiple"
              selected={days}
              onSelect={(d) => setDays(d ?? [])}
              numberOfMonths={1}
            />
          )}

          <div className="date-picker-footer">
            <Button variant="ghost" size="sm" onClick={clear}>Clear</Button>
            <Button size="sm" disabled={!canApply} onClick={apply}>Apply</Button>
          </div>
        </div>
      )}
    </div>
  );
}
