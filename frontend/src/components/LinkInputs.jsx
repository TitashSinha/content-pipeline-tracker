import { IconPlus, IconClose } from '../lib/icons.jsx';
import { IconButton, LinkButton } from './ui/index.js';

// Controlled list of URL inputs with inline add/remove. Always renders at least
// one row; empties are filtered by the caller before saving.
export default function LinkInputs({ value, onChange, placeholder }) {
  const links = value.length ? value : [''];
  const update = (i, v) => onChange(links.map((l, idx) => (idx === i ? v : l)));
  const remove = (i) => {
    const next = links.filter((_, idx) => idx !== i);
    onChange(next.length ? next : ['']);
  };

  return (
    <div className="link-inputs">
      {links.map((link, i) => (
        <div className="link-input-row" key={i}>
          <input value={link} onChange={(e) => update(i, e.target.value)} placeholder={placeholder} />
          {links.length > 1 && (
            <IconButton onClick={() => remove(i)} aria-label="Remove link">
              <IconClose />
            </IconButton>
          )}
        </div>
      ))}
      <LinkButton onClick={() => onChange([...links, ''])}>
        <IconPlus /> Add another link
      </LinkButton>
    </div>
  );
}
