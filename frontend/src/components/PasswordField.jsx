import { useState } from 'react';
import { IconEye, IconEyeOff } from '../lib/icons.jsx';
import { Input } from './ui/index.js';

// Password input with a show/hide eye toggle. Self-contained (uses the Input
// primitive), so it works inside both the legacy .field label and the new Field.
export default function PasswordField({ value, onChange, placeholder, autoFocus, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative flex items-center">
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        className="pr-11"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        title={show ? 'Hide password' : 'Show password'}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 grid place-items-center size-[30px] rounded-lg border-none bg-transparent text-muted enabled:hover:text-ink"
      >
        {show ? <IconEyeOff /> : <IconEye />}
      </button>
    </div>
  );
}
