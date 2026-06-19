import { useState } from 'react';
import { IconEye, IconEyeOff } from '../lib/icons.jsx';

// Password input with a show/hide eye toggle. Drop-in replacement for a plain
// <input type="password"> inside a .field label.
export default function PasswordField({ value, onChange, placeholder, autoFocus, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="password-field">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        title={show ? 'Hide password' : 'Show password'}
      >
        {show ? <IconEyeOff /> : <IconEye />}
      </button>
    </div>
  );
}
